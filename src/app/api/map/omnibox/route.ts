import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import type { Feature, Geometry } from "geojson";
import { fetchListings, type CncListing } from "@/lib/cnc-api";
import { centroidFromGeometry } from "@/lib/geo-centroid";
import { MAP_NEIGHBORHOOD_BOUNDS } from "@/lib/map-neighborhood-bounds";
import type {
  OmniboxActiveListing,
  OmniboxCategories,
  OmniboxNeighborhoodHit,
  OmniboxParcelHit,
  OmniboxResponse,
  OmniboxRentalHit,
  OmniboxSoldComp,
} from "@/lib/map-omnibox-types";
import {
  buildParcelStreetCentroidIndex,
  matchLinkListingToPoint,
  type LinkListingRow,
  type ParcelProps,
} from "@/lib/link-listings-parcel-match";
import { getExpansionIntelligence } from "@/lib/property-expansion-intelligence";

const GEOJSON_PATH = path.join(process.cwd(), "src/data/zoning-tool/nantucket-tax-parcels.clean.geojson");
const NEIGHBORHOODS_PATH = path.join(process.cwd(), "src/data/neighborhood-profiles.json");

const ISLAND_BBOX = { west: -70.2, south: 41.22, east: -69.95, north: 41.33 };

type AssessorParcelProps = ParcelProps & {
  lot_area_sqft?: number;
  zoning?: string | null;
};

let cachedParcelFeatures: Feature<Geometry, AssessorParcelProps>[] | null = null;
let cachedParcelStreetIndex: ReturnType<typeof buildParcelStreetCentroidIndex> | null = null;
let cachedNeighborhoodProfiles: Record<string, { name?: string; slug?: string; description?: string }> | null = null;

function loadParcelFeatures(): Feature<Geometry, AssessorParcelProps>[] {
  if (cachedParcelFeatures) return cachedParcelFeatures;
  const raw = fs.readFileSync(GEOJSON_PATH, "utf8");
  const gj = JSON.parse(raw) as { features?: Feature<Geometry, AssessorParcelProps>[] };
  cachedParcelFeatures = gj.features ?? [];
  return cachedParcelFeatures;
}

function getParcelStreetIndex(features: Feature<Geometry, AssessorParcelProps>[]) {
  if (!cachedParcelStreetIndex) {
    cachedParcelStreetIndex = buildParcelStreetCentroidIndex(features as Feature<Geometry, ParcelProps>[]);
  }
  return cachedParcelStreetIndex;
}

function loadNeighborhoodProfiles(): Record<string, { name?: string; slug?: string; description?: string }> {
  if (!cachedNeighborhoodProfiles) {
    cachedNeighborhoodProfiles = JSON.parse(fs.readFileSync(NEIGHBORHOODS_PATH, "utf8")) as Record<
      string,
      { name?: string; slug?: string; description?: string }
    >;
  }
  return cachedNeighborhoodProfiles;
}

/** Cheap parcel relevance for omnibox (avoid expansion math on every island match). */
function parcelMatchRank(loc: string, pid: string, tm: string, qLower: string, boundsHit: boolean): number {
  let score = 0;
  if (loc.startsWith(qLower)) score += 8;
  else if (pid.startsWith(qLower) || tm.startsWith(qLower)) score += 7;
  else if (loc.includes(qLower) || pid.includes(qLower) || tm.includes(qLower)) score += 2;
  if (boundsHit) score += 10;
  return score;
}

type NrOmniboxRow = {
  nrPropertyId?: number;
  slug?: string;
  streetAddress?: string;
  headline?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  NrRentalRates?: { propertyWeeklyRentInteger?: number }[];
  averageNightlyRate?: number;
};

let nrOmniboxCacheRows: NrOmniboxRow[] | null = null;
let nrOmniboxCacheAt = 0;
let nrOmniboxInflight: Promise<NrOmniboxRow[]> | null = null;
const NR_OMNIBOX_CACHE_MS = 10 * 60 * 1000;
const NR_OMNIBOX_MAX_PAGES = 3;

async function getNrOmniboxRentalRows(base: string): Promise<NrOmniboxRow[]> {
  const now = Date.now();
  if (nrOmniboxCacheRows && now - nrOmniboxCacheAt < NR_OMNIBOX_CACHE_MS) return nrOmniboxCacheRows;
  if (nrOmniboxInflight) return nrOmniboxInflight;

  nrOmniboxInflight = (async () => {
    try {
      const rows: NrOmniboxRow[] = [];
      let nextUrl: string | null = `${base}/property/nrproperty-listing/?page=1&page_size=500`;
      let pages = 0;
      while (nextUrl && pages < NR_OMNIBOX_MAX_PAGES) {
        pages += 1;
        const res = await fetch(nextUrl, { headers: { Accept: "application/json" }, cache: "no-store" });
        if (!res.ok) break;
        const body = (await res.json()) as { results?: NrOmniboxRow[]; next?: string | null };
        for (const row of body.results ?? []) rows.push(row);
        nextUrl = body.next ?? null;
      }
      nrOmniboxCacheRows = rows;
      nrOmniboxCacheAt = Date.now();
      return rows;
    } finally {
      nrOmniboxInflight = null;
    }
  })();

  return nrOmniboxInflight;
}

function getNrListingsApiBase(): string {
  const raw = process.env.NR_LISTINGS_API_BASE ?? "https://api.nantucketrentals.com/api";
  return raw.trim().replace(/\/$/, "");
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function parseBoundsParam(raw: string | null): { west: number; south: number; east: number; north: number } | null {
  if (!raw?.trim()) return null;
  const parts = raw.split(",").map((s) => Number(String(s).trim()));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null;
  const [west, south, east, north] = parts;
  if (west >= east || south >= north) return null;
  return { west, south, east, north };
}

function pointInBbox(lng: number, lat: number, b: { west: number; south: number; east: number; north: number }): boolean {
  return lng >= b.west && lng <= b.east && lat >= b.south && lat <= b.north;
}

function buildCategories(o: {
  activeListings: OmniboxActiveListing[];
  soldComps: OmniboxSoldComp[];
  parcels: OmniboxParcelHit[];
  neighborhoods: OmniboxNeighborhoodHit[];
}): OmniboxCategories {
  return {
    listings: o.activeListings.map((l) => ({
      id: l.id,
      type: "listing" as const,
      label: l.address,
      price: l.priceLabel,
      status: "Active",
      lat: l.lat,
      lng: l.lng,
    })),
    sold: o.soldComps.map((l) => ({
      id: l.id,
      type: "sold" as const,
      label: l.address,
      price: l.priceLabel,
      status: "Sold",
      lat: l.lat,
      lng: l.lng,
    })),
    parcels: o.parcels.map((p) => ({
      id: p.parcel_id,
      type: "parcel" as const,
      label: `${p.address} • ${p.taxMap}-${p.parcel}`,
      zone: p.zone ?? "—",
      expansionVerdict: p.expansionVerdict ?? null,
      lat: p.lat,
      lng: p.lng,
    })),
    neighborhoods: o.neighborhoods.map((n) => ({
      id: n.slug,
      type: "neighborhood" as const,
      label: n.name,
      countListings: n.countActive,
      countRentals: n.countRentals,
    })),
  };
}

const NL_SUGGESTIONS: OmniboxResponse["nlSuggestions"] = [
  { id: "beds4_sale_sconset", label: "Show 4+ bed homes for sale in Sconset" },
  { id: "rent_beach_12k", label: "Rentals under $12k/week near beach" },
  { id: "waterfront_town", label: "Waterfront near Town" },
  { id: "sold_surfside_2y", label: "Recent sold comps — Surfside" },
];

function emptyResponse(query: string): OmniboxResponse {
  const base = {
    query,
    suggestions: [] as string[],
    categories: buildCategories({
      activeListings: [],
      soldComps: [],
      parcels: [],
      neighborhoods: [],
    }),
    activeListings: [] as OmniboxActiveListing[],
    soldComps: [] as OmniboxSoldComp[],
    parcels: [] as OmniboxParcelHit[],
    neighborhoods: [] as OmniboxNeighborhoodHit[],
    rentals: [] as OmniboxRentalHit[],
    nlSuggestions: NL_SUGGESTIONS,
  };
  return base;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const qRaw = searchParams.get("q") ?? "";
  const q = qRaw.trim();
  const mode = (searchParams.get("mode") ?? "all").toLowerCase();
  const bounds = parseBoundsParam(searchParams.get("bounds"));

  const empty = emptyResponse(q);

  if (q.length < 2) {
    return NextResponse.json(empty);
  }

  const qLower = q.toLowerCase();
  const nlSuggestions: string[] = [
    `Properties with high expansion potential near “${q}”`,
    `4+ bedroom homes for sale in this corridor`,
  ];

  try {
    const features = loadParcelFeatures();
    const index = getParcelStreetIndex(features);

    type ParcelCand = { feat: Feature<Geometry, AssessorParcelProps>; score: number };
    const parcelCands: ParcelCand[] = [];
    for (const feat of features) {
      const p = feat.properties ?? {};
      const loc = String(p.location ?? "").toLowerCase();
      const pid = String(p.parcel_id ?? "").toLowerCase();
      const tm = `${p.tax_map ?? ""} ${p.parcel ?? ""}`.trim().toLowerCase();
      if (!loc.includes(qLower) && !pid.includes(qLower) && !tm.includes(qLower)) continue;
      const c = centroidFromGeometry(feat.geometry);
      if (!c) continue;
      const boundsHit = Boolean(bounds && pointInBbox(c.lng, c.lat, bounds));
      const score = parcelMatchRank(loc, pid, tm, qLower, boundsHit);
      parcelCands.push({ feat, score });
    }
    parcelCands.sort((a, b) => b.score - a.score);

    const parcels: OmniboxParcelHit[] = [];
    for (const { feat } of parcelCands) {
      if (parcels.length >= 12) break;
      const p = feat.properties ?? {};
      const c = centroidFromGeometry(feat.geometry);
      if (!c) continue;
      const lot = typeof p.lot_area_sqft === "number" && p.lot_area_sqft > 0 ? p.lot_area_sqft : 0;
      const zoneRaw = p.zoning != null ? String(p.zoning).trim() : "";
      const exp =
        lot > 0 ? getExpansionIntelligence({ lotSizeSqft: lot, currentGroundCoverSqFt: null }, zoneRaw || null) : null;
      parcels.push({
        parcel_id: String(p.parcel_id ?? "").trim(),
        taxMap: String(p.tax_map ?? ""),
        parcel: String(p.parcel ?? ""),
        address: String(p.location ?? "Address unavailable"),
        lat: c.lat,
        lng: c.lng,
        zone: exp ? exp.zoneCodeResolved : zoneRaw || null,
        expansionVerdict: exp ? exp.verdictLevel : null,
      });
    }

    const nhRaw = loadNeighborhoodProfiles();
    const neighborhoods: OmniboxNeighborhoodHit[] = [];
    for (const [slug, row] of Object.entries(nhRaw)) {
      if (typeof row !== "object" || row == null) continue;
      const name = String(row.name ?? slug);
      const nameL = name.toLowerCase();
      const slugL = slug.toLowerCase();
      const descL = String(row.description ?? "").toLowerCase();
      if (!nameL.includes(qLower) && !slugL.includes(qLower) && !descL.includes(qLower)) continue;
      const b = MAP_NEIGHBORHOOD_BOUNDS[slug];
      if (!b) continue;
      neighborhoods.push({
        name,
        slug,
        countActive: null,
        countRentals: null,
        bounds: b,
      });
      if (neighborhoods.length >= 8) break;
    }
    neighborhoods.sort((a, b) => {
      const aSlug = a.slug.toLowerCase() === qLower ? 0 : 1;
      const bSlug = b.slug.toLowerCase() === qLower ? 0 : 1;
      if (aSlug !== bSlug) return aSlug - bSlug;
      const aName = a.name.toLowerCase().startsWith(qLower) ? 0 : 1;
      const bName = b.name.toLowerCase().startsWith(qLower) ? 0 : 1;
      if (aName !== bName) return aName - bName;
      return a.name.localeCompare(b.name);
    });

    const wantSale = mode === "all" || mode === "sale";
    const wantSold = mode === "all" || mode === "sold";
    const wantRent = mode === "all" || mode === "rent";

    const activeListings: OmniboxActiveListing[] = [];
    const soldComps: OmniboxSoldComp[] = [];

    const fetchActiveRows = async (): Promise<CncListing[]> => {
      if (!wantSale) return [];
      try {
        const res = await fetchListings({ status: "A", limit: 20, search: q });
        return res.results;
      } catch {
        return [];
      }
    };
    const fetchSoldRows = async (): Promise<CncListing[]> => {
      if (!wantSold) return [];
      try {
        const res = await fetchListings({ status: "S", close_date: 730, limit: 15, search: q });
        return res.results;
      } catch {
        return [];
      }
    };

    const [activeRows, soldRows] = await Promise.all([fetchActiveRows(), fetchSoldRows()]);

    for (const row of activeRows) {
      const pt = matchLinkListingToPoint(row as LinkListingRow, index, "active", ISLAND_BBOX);
      if (!pt) continue;
      activeListings.push({
        id: String(row.link_id ?? pt.linkId),
        address: pt.address,
        price: row.ListPrice ?? pt.listPrice,
        priceLabel: formatMoney(row.ListPrice ?? pt.listPrice),
        lat: pt.latitude,
        lng: pt.longitude,
        source: "LINK",
        status: "for_sale",
      });
      if (activeListings.length >= 8) break;
    }

    for (const row of soldRows) {
      const pt = matchLinkListingToPoint(row as LinkListingRow, index, "sold", ISLAND_BBOX);
      if (!pt) continue;
      const price = row.ClosePrice ?? row.ListPrice ?? 0;
      soldComps.push({
        id: String(row.link_id ?? pt.linkId),
        address: pt.address,
        price,
        priceLabel: formatMoney(price),
        closeDate: row.CloseDate ?? null,
        lat: pt.latitude,
        lng: pt.longitude,
        source: "LINK",
        status: "sold",
      });
      if (soldComps.length >= 6) break;
    }

    const rentals: OmniboxRentalHit[] = [];
    if (wantRent) {
      try {
        const base = getNrListingsApiBase();
        const rows = await getNrOmniboxRentalRows(base);
        for (const row of rows) {
          if ((row.status ?? "").toLowerCase() !== "active") continue;
          const blob = [row.headline, row.streetAddress].filter(Boolean).join(" ").toLowerCase();
          if (!blob.includes(qLower)) continue;
          const id = row.nrPropertyId;
          const lat = row.latitude;
          const lng = row.longitude;
          if (id == null || lat == null || lng == null) continue;
          const wk = Math.max(0, ...(row.NrRentalRates?.map((r) => r.propertyWeeklyRentInteger ?? 0) ?? []));
          const weekly = wk > 0 ? wk : row.averageNightlyRate ? Math.round(row.averageNightlyRate * 7) : null;
          rentals.push({
            nrPropertyId: id,
            slug: row.slug?.trim() || null,
            address: String(row.streetAddress ?? "").trim() || "Rental",
            headline: String(row.headline ?? "").trim(),
            priceLabel: weekly ? `${formatMoney(weekly)}/wk est.` : null,
            lat,
            lng,
          });
          if (rentals.length >= 10) break;
        }
      } catch {
        /* NR API unavailable */
      }
    }

    const categories = buildCategories({ activeListings, soldComps, parcels, neighborhoods });

    const out: OmniboxResponse = {
      query: q,
      suggestions: nlSuggestions,
      categories,
      activeListings,
      soldComps,
      parcels,
      neighborhoods,
      rentals,
      nlSuggestions: NL_SUGGESTIONS,
    };

    return NextResponse.json(out);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ...emptyResponse(q), suggestions: nlSuggestions, message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
