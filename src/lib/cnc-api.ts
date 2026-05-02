const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.congdonandcoleman.com";

/**
 * RESO listing path. Default `link-listings` returns the full field set (~600+ keys).
 * Set to `link-listings-v2` only if you need the older slim payload.
 */
const LINK_LISTINGS_PATH =
  (process.env.CNC_LINK_LISTINGS_PATH || "link-listings").replace(/^\/+/, "") || "link-listings";

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
  /** LINK / internal type code when sent separately from `PropertyType`. */
  listing_typ?: string;
  Slug?: string;
  link_id?: number;
  /** Present on full `link-listings` when `link_id` is not set (same as MLS listing id). */
  ListingId?: string | number;
  /** Full mailing-style line from LINK (used for parcel / map matching). */
  Address?: string;
  link_images?: { url?: string; small_url?: string }[];
  /** Lot area in square feet when LINK exposes it (preferred over interpreting `LotSizeAcres`). */
  LotSizeSquareFeet?: number;
  lot_size_square_feet?: number;
  Lot_Size_Square_Feet?: number;
  LotSizeAcres?: number;
  YearBuilt?: number;
  LivingArea?: number;
  BuildingAreaTotal?: number;
  PublicRemarks?: string;
  LINK_descr?: string;
  TitleTag?: string;
  View?: string[];
  /** RESO `Heating`; feed may send a string or list. */
  Heating?: string | string[];
  /** RESO `HeatingFuel` when sent instead of or in addition to `Heating`. */
  HeatingFuel?: string | string[];
  /** Present on some feeds; cooling is often only in `InteriorFeatures` (e.g. `AC`). */
  Cooling?: string | string[];
  Sewer?: string[];
  WaterSource?: string[];
  FoundationDetails?: string[];
  ConstructionMaterials?: string[];
  Roof?: string[];
  ParkingFeatures?: string[];
  /** May include comma-separated values or list entries (e.g. `AC` for cooling). */
  InteriorFeatures?: string | string[];
  /** Floor narrative when exposed separately from `InteriorFeatures`. */
  DescFloor1?: string;
  DescFloor2?: string;
  DescFloor3?: string;
  /** Studio description when exposed as its own field. */
  studio?: string;
  Studio?: string;
  /** RESO `Flooring`; feed may send a string or list. */
  Flooring?: string | string[];
  Appliances?: string[];
  Fencing?: string[];
  PoolFeatures?: string[];
  FireplacesTotal?: number;
  TaxAnnualAmount?: number;
  TaxYear?: number;
  AssociationYN?: boolean;
  /** RESO-style status (varies by feed). */
  StandardStatus?: string;
  /** Listing brokerage / office (RESO-style when CNC exposes it). */
  ListOfficeName?: string;
  ListOfficeFullName?: string;
  /** When present, enables distance-to-comp on listing intelligence pages. */
  Latitude?: number;
  Longitude?: number;
  /** RESO assessed value when the feed includes it (sparse). */
  TaxAssessedValue?: number;
};

type CncListingsResponse = {
  count: number;
  results: CncListing[];
};

/**
 * Normalize a CNC listing row so `link_id` is always the public MLS / LINK listing id.
 * Full `link-listings` uses `ListingId`; `link-listings-v2` may send `link_id` instead.
 */
export function normalizeCncListingRow(raw: unknown): CncListing {
  if (!raw || typeof raw !== "object") {
    throw new Error("normalizeCncListingRow: expected a listing object");
  }
  const r = raw as Record<string, unknown>;
  const lid = r.link_id;
  const listingId = r.ListingId;
  let linkId: number | undefined;
  if (typeof lid === "number" && Number.isFinite(lid)) linkId = lid;
  else if (typeof lid === "string" && lid.trim()) {
    const n = parseInt(lid, 10);
    if (Number.isFinite(n)) linkId = n;
  }
  if (linkId == null) {
    if (typeof listingId === "number" && Number.isFinite(listingId)) linkId = listingId;
    else if (listingId != null && String(listingId).trim()) {
      const n = parseInt(String(listingId), 10);
      if (Number.isFinite(n)) linkId = n;
    }
  }
  return { ...r, link_id: linkId } as CncListing;
}

/**
 * Fetch listings from the Congdon & Coleman API.
 * Returns { count, results } with up to `limit` listings.
 *
 * Uses `link-listings` by default (full RESO-style payload). Override with `CNC_LINK_LISTINGS_PATH`
 * (e.g. `link-listings-v2`) if needed. Missing keys on a row are normal for sparse RESO fields.
 */
export async function fetchListings(
  params: Record<string, string | number>
): Promise<CncListingsResponse> {
  const url = new URL(`${BASE_URL}/${LINK_LISTINGS_PATH}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CNC API request failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { count: number; results?: unknown[] };
  const rows = Array.isArray(data.results) ? data.results : [];
  return {
    count: data.count,
    results: rows.map(normalizeCncListingRow),
  };
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
