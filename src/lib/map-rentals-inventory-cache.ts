import { unstable_cache } from "next/cache";
import type { NrMapRentalResult } from "@/lib/nr-map-rentals";

const MAP_RENTALS_INVENTORY_TAG = "map-rentals-inventory";
/** Full NR listing pagination is expensive; refresh in the background on this interval. */
export const MAP_RENTALS_INVENTORY_REVALIDATE_SECONDS = 300;

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
  return /\b(waterfront|oceanfront|harbor|harbour|sound front|on the water|water view|beachfront)\b/i.test(
    textBlob(row),
  );
}

function renovatedHint(row: NrListingRow): boolean {
  return /\b(renovated|renovation|fully updated|gut renovated|like new|newly renovated|designer|restored)\b/i.test(
    textBlob(row),
  );
}

function townWalkHint(row: NrListingRow): boolean {
  return /\b(downtown|in town|in-town|town center|center of town|historic district|main street|steps to town|walk to town)\b/i.test(
    textBlob(row),
  );
}

function inBbox(lng: number, lat: number, west: number, south: number, east: number, north: number): boolean {
  return lng >= west && lng <= east && lat >= south && lat <= north;
}

async function fetchAllActiveNrRowsFromUpstream(): Promise<NrListingRow[]> {
  const base = getNrListingsApiBase();
  const collected: NrListingRow[] = [];
  let nextUrl: string | null = `${base}/property/nrproperty-listing/?page=1&page_size=500`;

  while (nextUrl) {
    const res = await fetch(nextUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Listings upstream ${res.status} ${res.statusText}`);
    }
    const body = (await res.json()) as { results?: NrListingRow[]; next?: string | null };
    for (const row of body.results ?? []) {
      if ((row.status ?? "").toLowerCase() === "active") collected.push(row);
    }
    nextUrl = body.next ?? null;
  }

  return collected;
}

const getCachedActiveNrRows = unstable_cache(
  fetchAllActiveNrRowsFromUpstream,
  ["map-rentals-full-inventory"],
  {
    revalidate: MAP_RENTALS_INVENTORY_REVALIDATE_SECONDS,
    tags: [MAP_RENTALS_INVENTORY_TAG],
  },
);

function mapRowsToResults(
  rows: NrListingRow[],
  west: number,
  south: number,
  east: number,
  north: number,
): NrMapRentalResult[] {
  const results: NrMapRentalResult[] = [];
  for (const row of rows) {
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
  return results;
}

/**
 * Active NR rows for the whole catalog, served from Next data cache (see revalidate + tags).
 * Bbox filtering stays cheap in memory per request.
 */
export async function getMapRentalResultsForBbox(
  west: number,
  south: number,
  east: number,
  north: number,
): Promise<{ results: NrMapRentalResult[]; inventoryError: boolean }> {
  try {
    const rows = await getCachedActiveNrRows();
    return { results: mapRowsToResults(rows, west, south, east, north), inventoryError: false };
  } catch {
    return { results: [], inventoryError: true };
  }
}

/** Populate / refresh the cached full inventory (e.g. Vercel Cron). */
export async function warmMapRentalsInventory(): Promise<{ count: number }> {
  const rows = await getCachedActiveNrRows();
  return { count: rows.length };
}

export { MAP_RENTALS_INVENTORY_TAG };
