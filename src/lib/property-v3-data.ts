import { cache } from "react";
import type { CncListing } from "@/lib/cnc-api";
import { fetchAllListings } from "@/lib/cnc-api";
import { listingAddressStem, looksLikeStreetAddress, streetMatchKey } from "@/lib/address-street-key";
import { haversineMiles } from "@/lib/geo-haversine";
import {
  matchLinkListingToPoint,
  type LinkListingRow,
} from "@/lib/link-listings-parcel-match";
import { nantucketLinkListingUrl } from "@/lib/link-listing-url";
import { formatListingTypeDisplay, listingTypOrPropertyType } from "@/lib/listing-type-labels";
import { normalizeNantucketAreaName } from "@/lib/nantucket-area-normalize";
import { parseTrailingLinkIdFromPropertySlug } from "@/lib/property-address-slug";
import { listingLatLon, type PropertyV3IntelActive, type PropertyV3IntelParcel, type PropertyV3IntelSold } from "@/lib/property-v3-market-intel";
import { propertyBasePath, propertyInstancePath } from "@/lib/property-routes";
import {
  bboxForMlsArea,
  inBbox,
  ISLAND_BBOX,
  mlsAreaToBboxKey,
} from "@/lib/property-v3-neighborhood";
import {
  getAssessorParcelCache,
  getParcelById,
  getParcelStreetIndex,
  parcelCentroid,
  parcelLocationToBaseSlug,
  pickParcelForSlug,
  type AssessorParcelFeature,
} from "@/lib/property-v3-parcel-cache";
import { livingSqftFromListing, lotSqftFromListing } from "@/lib/listing-detail-math";

const SOLD_HISTORY_DAYS = 1095;
const SOLD_RANKING_DAYS = 730;

function sameMlsArea(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  return normalizeNantucketAreaName(a) === normalizeNantucketAreaName(b);
}

function pickLotAcresFromParcel(f: AssessorParcelFeature): number | null {
  const ac = f.properties?.acreage;
  if (typeof ac === "number" && ac > 0) return ac;
  const sq = f.properties?.lot_area_sqft;
  if (typeof sq === "number" && sq > 0) return Math.round((sq / 43_560) * 10_000) / 10_000;
  return null;
}

function assessedTotal(f: AssessorParcelFeature): number | null {
  const t = f.properties?.assessed_total;
  return typeof t === "number" && t > 0 ? t : null;
}

function rowMatchesParcel(
  row: CncListing,
  parcelId: string,
  pool: "active" | "sold"
): boolean {
  const idx = getParcelStreetIndex();
  return !!matchLinkListingToPoint(
    row as LinkListingRow,
    idx,
    pool,
    ISLAND_BBOX,
    parcelId
  );
}

/** Close price ÷ assessor total when MLS row matches a parcel (server-only). */
function closeToAssessedForSoldRow(row: LinkListingRow): number | null {
  const cp = row.ClosePrice ?? row.ListPrice;
  if (!cp || cp <= 0) return null;
  const hit = matchLinkListingToPoint(row, getParcelStreetIndex(), "sold", ISLAND_BBOX, null);
  if (!hit) return null;
  const pf = getParcelById(hit.parcel_id);
  const as = pf?.properties?.assessed_total;
  if (typeof as !== "number" || as <= 0) return null;
  return cp / as;
}

async function findListingByLinkId(linkId: number): Promise<CncListing | null> {
  const active = await fetchAllListings({ status: "A" });
  const a = active.find((l) => l.link_id === linkId);
  if (a) return a;
  const sold = await fetchAllListings({ status: "S", close_date: SOLD_HISTORY_DAYS });
  return sold.find((l) => l.link_id === linkId) ?? null;
}

function listingPool(row: CncListing): "active" | "sold" {
  const s = (row.MlsStatus || "").toUpperCase();
  return s === "S" ? "sold" : "active";
}

function formatAddress(row: CncListing): string {
  const parts = [row.StreetNumber, row.StreetName].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  return (row.Address || "").split(",")[0]?.trim() || "Listing";
}

export type PropertyV3HistoryRow = {
  linkId: number;
  address: string;
  mlsStatus: string;
  listPrice: number | null;
  closePrice: number | null;
  closeDate: string | null;
  onMarketDate: string | null;
  instancePath: string;
  linkUrl: string;
  /** Listing office / brokerage when the feed includes it. */
  brokerage: string | null;
};

/** Subject-only anchors; cohort stats are derived client-side from intel rows + geography/filters. */
export type PropertyV3RankingsSnapshot = {
  subjectGla: number | null;
  /** MLS lot size (LotSizeSquareFeet, etc. via lotSqftFromListing); null if not on feed. */
  subjectLotSqft: number | null;
  subjectAssessed: number | null;
  subjectActivePpsf: number | null;
  subjectSoldPpsf: number | null;
};

export type PropertyV3Payload = {
  version: "v3";
  canonicalAddressSlug: string;
  canonicalPath: string;
  /** When URL included a listing id */
  listingInstanceId: number | null;
  /** True when slug matched multiple assessor rows */
  ambiguousParcel: boolean;
  parcel: {
    parcelId: string;
    location: string;
    acreage: number | null;
    lotSqft: number | null;
    assessedTotal: number | null;
    ownerName: string | null;
    use: string | null;
    zoning: string | null;
    taxMap: string | null;
    parcelNum: string | null;
    lng: number | null;
    lat: number | null;
  };
  mlsAreaPrimary: string | null;
  bboxKeyResolved: string | null;
  /** Normalized assessor zoning on subject parcel (for zoning-district cohort). */
  subjectZoningKey: string | null;
  /** Raw zoning label from assessor (display). */
  subjectZoningLabel: string | null;
  assessorDatabaseUrl: string;
  history: PropertyV3HistoryRow[];
  currentActive: {
    linkId: number;
    address: string;
    listPrice: number | null;
    beds: number | null;
    baths: number | null;
    linkMlsUrl: string;
    instancePath: string;
  } | null;
  /** Instance row when URL is instance; else null */
  focusListing: {
    linkId: number;
    address: string;
    listPrice: number | null;
    closePrice: number | null;
    publicRemarks: string | null;
    photos: string[];
    beds: number | null;
    baths: number | null;
    yearBuilt: number | null;
    propertyType: string | null;
    linkMlsUrl: string;
  } | null;
  /** Superset for client geography + comps filters (MLS area ∪ same zoning ∪ ~1 mi ∪ same street). */
  intelSold: PropertyV3IntelSold[];
  intelActive: PropertyV3IntelActive[];
  /** Parcel centroids in MLS bbox or within ~1.1 mi of subject (for cohort stats + table). */
  parcelIntel: PropertyV3IntelParcel[];
  rankings: PropertyV3RankingsSnapshot;
};

function parcelToPayloadParcel(f: AssessorParcelFeature) {
  const c = parcelCentroid(f);
  const p = f.properties;
  return {
    parcelId: String(p?.parcel_id ?? "").trim(),
    location: String(p?.location ?? "").trim(),
    acreage: pickLotAcresFromParcel(f),
    lotSqft: typeof p?.lot_area_sqft === "number" ? p.lot_area_sqft : null,
    assessedTotal: assessedTotal(f),
    ownerName: p?.owner_name ? String(p.owner_name) : null,
    use: p?.use ? String(p.use) : null,
    zoning: p?.zoning ? String(p.zoning) : null,
    taxMap: p?.tax_map ? String(p.tax_map) : null,
    parcelNum: p?.parcel ? String(p.parcel) : null,
    lng: c?.lng ?? null,
    lat: c?.lat ?? null,
  };
}

function listingBrokerage(row: CncListing): string | null {
  const full = row.ListOfficeFullName?.trim();
  const name = row.ListOfficeName?.trim();
  const s = full || name;
  return s ? s : null;
}

function buildHistoryRows(
  parcelId: string,
  canonicalSlug: string,
  active: CncListing[],
  sold: CncListing[]
): PropertyV3HistoryRow[] {
  const rows: PropertyV3HistoryRow[] = [];
  for (const row of active) {
    if (!row.link_id || !rowMatchesParcel(row, parcelId, "active")) continue;
    rows.push({
      linkId: row.link_id,
      address: formatAddress(row),
      mlsStatus: row.MlsStatus || "A",
      listPrice: row.ListPrice > 0 ? row.ListPrice : null,
      closePrice: null,
      closeDate: null,
      onMarketDate: row.OnMarketDate ?? null,
      instancePath: propertyInstancePath(canonicalSlug, row.link_id),
      linkUrl: nantucketLinkListingUrl(String(row.link_id)),
      brokerage: listingBrokerage(row),
    });
  }
  for (const row of sold) {
    if (!row.link_id || !rowMatchesParcel(row, parcelId, "sold")) continue;
    rows.push({
      linkId: row.link_id,
      address: formatAddress(row),
      mlsStatus: row.MlsStatus || "S",
      listPrice: row.ListPrice > 0 ? row.ListPrice : null,
      closePrice: row.ClosePrice && row.ClosePrice > 0 ? row.ClosePrice : null,
      closeDate: row.CloseDate ?? null,
      onMarketDate: row.OnMarketDate ?? null,
      instancePath: propertyInstancePath(canonicalSlug, row.link_id),
      linkUrl: nantucketLinkListingUrl(String(row.link_id)),
      brokerage: listingBrokerage(row),
    });
  }
  rows.sort((a, b) => {
    const da = (a.closeDate || a.onMarketDate || "").slice(0, 10);
    const db = (b.closeDate || b.onMarketDate || "").slice(0, 10);
    return db.localeCompare(da);
  });
  return rows;
}

function bestGlaFromHistory(history: CncListing[]): number | null {
  let best: number | null = null;
  for (const row of history) {
    const g = livingSqftFromListing(row);
    if (g != null && (best == null || g > best)) best = g;
  }
  return best;
}

function bestLotSqftFromHistory(history: CncListing[]): number | null {
  let best: number | null = null;
  for (const row of history) {
    const v = lotSqftFromListing(row);
    if (v != null && (best == null || v > best)) best = v;
  }
  return best;
}

function rowStreetKeyFromListing(row: CncListing): string | null {
  const stem = listingAddressStem(formatAddress(row));
  if (!stem || !looksLikeStreetAddress(stem)) return null;
  return streetMatchKey(stem);
}

/** Normalize assessor / MLS zoning tokens for cohort matching. */
function normalizeZoningKey(z: string | null | undefined): string | null {
  const t = String(z ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!t) return null;
  return t.toUpperCase();
}

function listingZoningKey(row: CncListing, pool: "active" | "sold"): string | null {
  const hit = matchLinkListingToPoint(
    row as LinkListingRow,
    getParcelStreetIndex(),
    pool,
    ISLAND_BBOX,
    null
  );
  if (!hit) return null;
  const pf = getParcelById(hit.parcel_id);
  return normalizeZoningKey(pf?.properties?.zoning);
}

async function loadPropertyV3Payload(fullSlug: string): Promise<PropertyV3Payload | null> {
  const decoded = decodeURIComponent(fullSlug).trim();
  const { baseSlug: rawBase, linkId: linkIdStr } = parseTrailingLinkIdFromPropertySlug(decoded);
  const addressSlug = rawBase.trim().toLowerCase();
  const listingInstanceId =
    linkIdStr && /^\d+$/.test(linkIdStr) ? parseInt(linkIdStr, 10) : null;

  let parcelFeat: AssessorParcelFeature | null = null;
  let ambiguous = false;
  /** Set when URL ends with `-{link_id}`; subject metrics prefer this MLS row. */
  let instanceListing: CncListing | null = null;

  if (listingInstanceId != null) {
    const row = await findListingByLinkId(listingInstanceId);
    if (!row || row.link_id == null) return null;
    instanceListing = row;
    const pool = listingPool(row);
    const hit = matchLinkListingToPoint(
      row as LinkListingRow,
      getParcelStreetIndex(),
      pool,
      ISLAND_BBOX,
      null
    );
    if (!hit) return null;
    parcelFeat = getParcelById(hit.parcel_id);
    if (!parcelFeat) return null;
  } else {
    const picked = pickParcelForSlug(addressSlug);
    if (!picked) return null;
    const all = getAssessorParcelCache().bySlug.get(addressSlug) ?? [];
    ambiguous = all.length > 1;
    parcelFeat = picked;
  }

  const loc = String(parcelFeat.properties?.location ?? "").trim();
  const canonicalAddressSlug = parcelLocationToBaseSlug(loc);
  const canonicalPath = propertyBasePath(canonicalAddressSlug);

  const parcelId = String(parcelFeat.properties?.parcel_id ?? "").trim();
  // Run sequentially: three concurrent full pulls was tripping CNC/nginx (504).
  const active = await fetchAllListings({ status: "A" });
  const soldLong = await fetchAllListings({ status: "S", close_date: SOLD_HISTORY_DAYS });
  const soldRank = await fetchAllListings({ status: "S", close_date: SOLD_RANKING_DAYS });

  const onParcelSold = soldLong.filter((r) => rowMatchesParcel(r, parcelId, "sold"));
  const onParcelActive = active.filter((r) => rowMatchesParcel(r, parcelId, "active"));
  const onParcelAll = [...onParcelActive, ...onParcelSold];

  const mlsAreaPrimary =
    (listingInstanceId != null ? instanceListing?.MLSAreaMajor?.trim() : null) ||
    onParcelActive[0]?.MLSAreaMajor?.trim() ||
    onParcelSold.sort((a, b) => (b.CloseDate || "").localeCompare(a.CloseDate || ""))[0]?.MLSAreaMajor?.trim() ||
    null;

  const bbox = bboxForMlsArea(mlsAreaPrimary);
  const bboxKeyResolved = mlsAreaToBboxKey(mlsAreaPrimary);

  const centroid = parcelCentroid(parcelFeat);
  const subLat = centroid?.lat ?? null;
  const subLon = centroid?.lng ?? null;
  const subjectPt =
    subLat != null && subLon != null ? { lat: subLat, lon: subLon } : null;

  const subjectStem = listingAddressStem(loc);
  const subjectStreetKey =
    subjectStem && looksLikeStreetAddress(subjectStem) ? streetMatchKey(subjectStem) : null;

  const subjectZoningKey = normalizeZoningKey(parcelFeat.properties?.zoning);
  const subjectZoningLabel = parcelFeat.properties?.zoning
    ? String(parcelFeat.properties.zoning).trim() || null
    : null;

  function listingInIntelUniverse(r: CncListing, pool: "active" | "sold"): boolean {
    const sameM = mlsAreaPrimary ? sameMlsArea(r.MLSAreaMajor, mlsAreaPrimary) : false;
    const ll = listingLatLon(r);
    const dist =
      subjectPt && ll ? haversineMiles(subjectPt, { lat: ll.lat, lon: ll.lon }) : null;
    const sk = rowStreetKeyFromListing(r);
    const sameS = subjectStreetKey != null && sk != null && sk === subjectStreetKey;
    const zRow = listingZoningKey(r, pool);
    const sameZ = subjectZoningKey != null && zRow != null && zRow === subjectZoningKey;
    if (sameM || sameS || sameZ) return true;
    if (dist != null && dist <= 1.08) return true;
    return false;
  }

  const intelSold: PropertyV3IntelSold[] = [];
  for (const r of soldRank) {
    if (!r.link_id || !listingInIntelUniverse(r, "sold")) continue;
    const ll = listingLatLon(r);
    const dist =
      subjectPt && ll ? haversineMiles(subjectPt, { lat: ll.lat, lon: ll.lon }) : null;
    const sk = rowStreetKeyFromListing(r);
    const sameS = subjectStreetKey != null && sk != null && sk === subjectStreetKey;
    const sameM = mlsAreaPrimary ? sameMlsArea(r.MLSAreaMajor, mlsAreaPrimary) : false;
    const zk = listingZoningKey(r, "sold");
    const g = livingSqftFromListing(r);
    const p = r.ClosePrice ?? r.ListPrice;
    const ppsf = g && p && p > 0 ? Math.round(p / g) : null;
    intelSold.push({
      linkId: r.link_id,
      address: formatAddress(r),
      lat: ll?.lat ?? null,
      lon: ll?.lon ?? null,
      distMi: dist,
      sameStreet: sameS,
      sameMls: sameM,
      mlsArea: r.MLSAreaMajor ?? null,
      gla: g,
      beds: r.BedroomsTotal ?? null,
      baths: r.BathroomsTotalDecimal ?? null,
      yearBuilt: r.YearBuilt ?? null,
      propertyTypeLabel: formatListingTypeDisplay(listingTypOrPropertyType(r)),
      lotSqft: lotSqftFromListing(r),
      listPrice: r.ListPrice > 0 ? r.ListPrice : null,
      closePrice: p && p > 0 ? p : null,
      closeDate: r.CloseDate ?? null,
      onMarketDate: r.OnMarketDate ?? null,
      ppsf,
      closeToAssessedRatio: closeToAssessedForSoldRow(r as LinkListingRow),
      zoningKey: zk,
    });
  }

  const intelActive: PropertyV3IntelActive[] = [];
  for (const r of active) {
    if (!r.link_id || !listingInIntelUniverse(r, "active")) continue;
    const ll = listingLatLon(r);
    const dist =
      subjectPt && ll ? haversineMiles(subjectPt, { lat: ll.lat, lon: ll.lon }) : null;
    const sk = rowStreetKeyFromListing(r);
    const sameS = subjectStreetKey != null && sk != null && sk === subjectStreetKey;
    const sameM = mlsAreaPrimary ? sameMlsArea(r.MLSAreaMajor, mlsAreaPrimary) : false;
    const zk = listingZoningKey(r, "active");
    const g = livingSqftFromListing(r);
    const ppsf = g && r.ListPrice > 0 ? Math.round(r.ListPrice / g) : null;
    intelActive.push({
      linkId: r.link_id,
      address: formatAddress(r),
      lat: ll?.lat ?? null,
      lon: ll?.lon ?? null,
      distMi: dist,
      sameStreet: sameS,
      sameMls: sameM,
      mlsArea: r.MLSAreaMajor ?? null,
      gla: g,
      beds: r.BedroomsTotal ?? null,
      baths: r.BathroomsTotalDecimal ?? null,
      yearBuilt: r.YearBuilt ?? null,
      propertyTypeLabel: formatListingTypeDisplay(listingTypOrPropertyType(r)),
      lotSqft: lotSqftFromListing(r),
      listPrice: r.ListPrice > 0 ? r.ListPrice : null,
      onMarketDate: r.OnMarketDate ?? null,
      ppsf,
      zoningKey: zk,
    });
  }

  const cohortBbox = bbox ?? ISLAND_BBOX;
  const parcelIntelScratch: PropertyV3IntelParcel[] = [];
  for (const f of getAssessorParcelCache().features) {
    const c = parcelCentroid(f);
    if (!c) continue;
    const inB = inBbox(c.lng, c.lat, cohortBbox);
    const dist = subjectPt ? haversineMiles(subjectPt, { lat: c.lat, lon: c.lng }) : null;
    const pZoning = normalizeZoningKey(f.properties?.zoning);
    const inZoning = subjectZoningKey != null && pZoning != null && pZoning === subjectZoningKey;
    if (!inB && (dist == null || dist > 1.18) && !inZoning) continue;
    const pid = String(f.properties?.parcel_id ?? "").trim();
    if (!pid) continue;
    const lotSqft =
      typeof f.properties?.lot_area_sqft === "number" ? f.properties.lot_area_sqft : null;
    parcelIntelScratch.push({
      parcelId: pid,
      acreage: pickLotAcresFromParcel(f),
      assessed: assessedTotal(f),
      lotSqft,
      lng: c.lng,
      lat: c.lat,
      distMi: dist,
      inMlsBbox: inB,
      zoningKey: pZoning,
    });
  }
  const MAX_PARCEL_INTEL = 4500;
  const parcelIntel =
    parcelIntelScratch.length > MAX_PARCEL_INTEL
      ? parcelIntelScratch.slice(0, MAX_PARCEL_INTEL)
      : parcelIntelScratch;

  /** When URL names a listing id, use that row for "current" active + GLA; else first on-parcel active. */
  let cur: CncListing | undefined;
  if (listingInstanceId != null && instanceListing) {
    if (listingPool(instanceListing) === "active") {
      cur =
        onParcelActive.find((r) => r.link_id === listingInstanceId) ??
        active.find(
          (r) => r.link_id === listingInstanceId && rowMatchesParcel(r, parcelId, "active")
        ) ??
        undefined;
    }
  } else {
    cur = onParcelActive[0];
  }

  const subjectGla = (() => {
    if (listingInstanceId != null && instanceListing) {
      const g = livingSqftFromListing(instanceListing);
      if (g != null && g > 0) return g;
    }
    return bestGlaFromHistory(onParcelAll);
  })();

  const subjectLotSqft = (() => {
    if (listingInstanceId != null && instanceListing) {
      const v = lotSqftFromListing(instanceListing);
      if (v != null && v > 0) return v;
    }
    if (cur) {
      const v = lotSqftFromListing(cur);
      if (v != null && v > 0) return v;
    }
    return bestLotSqftFromHistory(onParcelAll);
  })();

  const subjectAssessed = assessedTotal(parcelFeat);

  let subjectActivePpsf: number | null = null;
  if (listingInstanceId != null && instanceListing && listingPool(instanceListing) === "active") {
    const lp = instanceListing.ListPrice;
    const gRow = livingSqftFromListing(instanceListing);
    const gEff = gRow != null && gRow > 0 ? gRow : subjectGla;
    if (lp > 0 && gEff != null && gEff > 0) subjectActivePpsf = lp / gEff;
  } else if (cur && subjectGla && cur.ListPrice > 0) {
    subjectActivePpsf = cur.ListPrice / subjectGla;
  }

  let lastSold: CncListing | undefined = [...onParcelSold].sort((a, b) =>
    (b.CloseDate || "").localeCompare(a.CloseDate || "")
  )[0];
  if (listingInstanceId != null) {
    const sid = onParcelSold.find((r) => r.link_id === listingInstanceId);
    if (sid) lastSold = sid;
  }

  let subjectSoldPpsf: number | null = null;
  if (lastSold) {
    const gSold = livingSqftFromListing(lastSold) ?? subjectGla;
    const cp = lastSold.ClosePrice ?? lastSold.ListPrice;
    if (gSold && cp && cp > 0) subjectSoldPpsf = cp / gSold;
  }

  const history = buildHistoryRows(parcelId, canonicalAddressSlug, active, soldLong);

  const currentActiveRow = cur ?? (instanceListing && listingPool(instanceListing) === "active" ? instanceListing : undefined);
  const currentActive = currentActiveRow?.link_id
    ? {
        linkId: currentActiveRow.link_id,
        address: formatAddress(currentActiveRow),
        listPrice: currentActiveRow.ListPrice > 0 ? currentActiveRow.ListPrice : null,
        beds: currentActiveRow.BedroomsTotal ?? null,
        baths: currentActiveRow.BathroomsTotalDecimal ?? null,
        linkMlsUrl: nantucketLinkListingUrl(String(currentActiveRow.link_id)),
        instancePath: propertyInstancePath(canonicalAddressSlug, currentActiveRow.link_id),
      }
    : null;

  let focusListing: PropertyV3Payload["focusListing"] = null;
  if (listingInstanceId != null && instanceListing?.link_id != null) {
    const fr = instanceListing;
    const focusLinkId = fr.link_id!;
    const imgs = (fr.link_images ?? [])
      .map((i) => i.url || i.small_url)
      .filter((u): u is string => Boolean(u));
    focusListing = {
      linkId: focusLinkId,
      address: formatAddress(fr),
      listPrice: fr.ListPrice > 0 ? fr.ListPrice : null,
      closePrice: fr.ClosePrice && fr.ClosePrice > 0 ? fr.ClosePrice : null,
      publicRemarks: (fr.PublicRemarks || fr.LINK_descr || "").trim() || null,
      photos: imgs,
      beds: fr.BedroomsTotal ?? null,
      baths: fr.BathroomsTotalDecimal ?? null,
      yearBuilt: fr.YearBuilt ?? null,
      propertyType: fr.PropertyType ?? null,
      linkMlsUrl: nantucketLinkListingUrl(String(focusLinkId)),
    };
  }

  return {
    version: "v3",
    canonicalAddressSlug,
    canonicalPath,
    listingInstanceId,
    ambiguousParcel: ambiguous,
    parcel: parcelToPayloadParcel(parcelFeat),
    mlsAreaPrimary,
    bboxKeyResolved,
    subjectZoningKey,
    subjectZoningLabel,
    assessorDatabaseUrl: "https://www.nantucket-ma.gov/382/Assessor---Database-Information",
    history,
    currentActive,
    focusListing,
    intelSold,
    intelActive,
    parcelIntel,
    rankings: {
      subjectGla,
      subjectLotSqft,
      subjectAssessed,
      subjectActivePpsf,
      subjectSoldPpsf,
    },
  };
}

export const getPropertyV3Payload = cache(loadPropertyV3Payload);
