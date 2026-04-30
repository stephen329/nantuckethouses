import { NextResponse } from "next/server";
import type { NrMapRentalResult } from "@/lib/nr-map-rentals";

function getNrListingsApiBase(): string {
  const raw = process.env.NR_LISTINGS_API_BASE ?? "https://api.nantucketrentals.com/api";
  return raw.trim().replace(/\/$/, "");
}

type NrListingRow = {
  nrPropertyId?: number;
  slug?: string;
  streetAddress?: string;
  headline?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  NrPropertyPics?: { nrPropertyPicPath?: string }[];
  NrRentalRates?: { propertyWeeklyRentInteger?: number; propertyWeeklyRent?: number }[];
  averageNightlyRate?: number;
  totalBedrooms?: number;
  totalBathrooms?: number;
  totalCapacity?: number;
  hasPool?: boolean;
  walkToBeach?: boolean;
  highlights?: string | null;
};

function deriveWeeklyRent(row: NrListingRow): number | null {
  const rates = row.NrRentalRates ?? [];
  const ints = rates
    .map((r) => r.propertyWeeklyRentInteger ?? r.propertyWeeklyRent)
    .filter((n): n is number => typeof n === "number" && !Number.isNaN(n) && n > 0);
  if (ints.length) return Math.round(Math.max(...ints));
  const nightly = row.averageNightlyRate;
  if (typeof nightly === "number" && !Number.isNaN(nightly) && nightly > 0) return Math.round(nightly * 7);
  return null;
}

function textBlob(row: NrListingRow): string {
  return [row.headline, row.streetAddress, row.slug, row.highlights].filter(Boolean).join(" ");
}

function petFriendlyHint(row: NrListingRow): boolean {
  return /\b(pet|pets|dog|dogs|cat|cats)\b/i.test(textBlob(row));
}

function waterfrontHint(row: NrListingRow): boolean {
  return /\b(waterfront|oceanfront|harbor|harbour|sound front|on the water|water view|beachfront)\b/i.test(textBlob(row));
}

function renovatedHint(row: NrListingRow): boolean {
  return /\b(renovated|renovation|fully updated|gut renovated|like new|newly renovated|designer|restored)\b/i.test(textBlob(row));
}

function townWalkHint(row: NrListingRow): boolean {
  return /\b(downtown|in town|in-town|town center|center of town|historic district|main street|steps to town|walk to town)\b/i.test(
    textBlob(row),
  );
}

function inBbox(lng: number, lat: number, west: number, south: number, east: number, north: number): boolean {
  return lng >= west && lng <= east && lat >= south && lat <= north;
}

/**
 * GET /api/map/rentals?bbox=west,south,east,north
 * Proxies active Nantucket Rentals inventory for map pins (public listing API).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bboxRaw = searchParams.get("bbox");
  let west: number;
  let south: number;
  let east: number;
  let north: number;
  if (bboxRaw) {
    const parts = bboxRaw.split(",").map((x) => Number.parseFloat(x.trim()));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
      return NextResponse.json({ error: "Invalid bbox. Use west,south,east,north." }, { status: 400 });
    }
    [west, south, east, north] = parts as [number, number, number, number];
  } else {
    // Nantucket island-ish bounds when no viewport yet
    west = -70.2;
    south = 41.22;
    east = -69.95;
    north = 41.33;
  }

  const base = getNrListingsApiBase();
  const collected: NrListingRow[] = [];
  let nextUrl: string | null = `${base}/property/nrproperty-listing/?page=1&page_size=500`;

  try {
    while (nextUrl) {
      const res = await fetch(nextUrl, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) {
        return NextResponse.json({ error: `Listings upstream ${res.status}`, results: [] as NrMapRentalResult[] }, { status: 502 });
      }
      const body = (await res.json()) as { results?: NrListingRow[]; next?: string | null };
      for (const row of body.results ?? []) {
        if ((row.status ?? "").toLowerCase() === "active") collected.push(row);
      }
      nextUrl = body.next ?? null;
    }
  } catch {
    return NextResponse.json({ error: "Failed to fetch rentals", results: [] }, { status: 502 });
  }

  const results: NrMapRentalResult[] = [];
  for (const row of collected) {
    const id = row.nrPropertyId;
    const slug = row.slug?.trim();
    const lat = row.latitude;
    const lng = row.longitude;
    if (id == null || !slug || lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) continue;
    if (!inBbox(lng, lat, west, south, east, north)) continue;
    const thumb = row.NrPropertyPics?.[0]?.nrPropertyPicPath ?? null;
    results.push({
      nrPropertyId: id,
      slug,
      streetAddress: String(row.streetAddress ?? "").trim() || slug,
      headline: String(row.headline ?? row.streetAddress ?? slug).trim(),
      latitude: lat,
      longitude: lng,
      thumbUrl: thumb,
      weeklyRentEstimate: deriveWeeklyRent(row),
      totalBedrooms: typeof row.totalBedrooms === "number" ? row.totalBedrooms : null,
      totalBathrooms: typeof row.totalBathrooms === "number" ? row.totalBathrooms : null,
      totalCapacity: typeof row.totalCapacity === "number" ? row.totalCapacity : null,
      hasPool: Boolean(row.hasPool),
      walkToBeach: Boolean(row.walkToBeach),
      averageNightlyRate: typeof row.averageNightlyRate === "number" ? row.averageNightlyRate : null,
      petFriendlyHint: petFriendlyHint(row),
      waterfrontHint: waterfrontHint(row),
      renovatedHint: renovatedHint(row),
      townWalkHint: townWalkHint(row),
    });
  }

  return NextResponse.json({ results });
}
