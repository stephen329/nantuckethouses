const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.congdonandcoleman.com";

export type CncListing = {
  ListPrice: number;
  ClosePrice?: number;
  CloseDate?: string;
  OnMarketDate?: string;
  MlsStatus: string;
  MLSAreaMajor?: string;
  BedroomsTotal?: number;
  BathroomsTotalDecimal?: number;
  StreetNumber?: string;
  StreetName?: string;
  PropertyType?: string;
  Slug?: string;
  link_id?: number;
  /** Full mailing-style line from LINK (used for parcel / map matching). */
  Address?: string;
  link_images?: { url?: string; small_url?: string }[];
  LotSizeAcres?: number;
  YearBuilt?: number;
  PublicRemarks?: string;
  LINK_descr?: string;
  TitleTag?: string;
  View?: string[];
};

type CncListingsResponse = {
  count: number;
  results: CncListing[];
};

/**
 * Fetch listings from the Congdon & Coleman API.
 * Returns { count, results } with up to `limit` listings.
 */
export async function fetchListings(
  params: Record<string, string | number>
): Promise<CncListingsResponse> {
  const url = new URL(`${BASE_URL}/link-listings-v2`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CNC API request failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<CncListingsResponse>;
}

/**
 * Fetch all listings matching params by paginating through results.
 * Use for computing statistics where we need the full dataset.
 */
export async function fetchAllListings(
  params: Record<string, string | number>
): Promise<CncListing[]> {
  const pageSize = 500;
  const first = await fetchListings({ ...params, limit: pageSize, offset: 0 });
  const all = [...first.results];
  const total = first.count;

  // Fetch remaining pages in parallel
  if (total > pageSize) {
    const pages = Math.ceil(total / pageSize);
    const fetches = [];
    for (let i = 1; i < pages; i++) {
      fetches.push(
        fetchListings({ ...params, limit: pageSize, offset: i * pageSize })
      );
    }
    const results = await Promise.all(fetches);
    for (const r of results) {
      all.push(...r.results);
    }
  }

  return all;
}

/** Compute the median of a sorted-ascending numeric array. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/** Compute the average of a numeric array. */
export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
}

/** Compute days between two date strings. */
export function daysBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}
