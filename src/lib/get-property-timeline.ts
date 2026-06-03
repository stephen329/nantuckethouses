import { cache } from "react";
import { fetchAllListings, type CncListing } from "@/lib/cnc-api";
import { listingAddressStem, looksLikeStreetAddress, streetMatchKey } from "@/lib/address-street-key";
import {
  cncListingPropertyBaseSlug,
  parseTrailingLinkIdFromPropertySlug,
  streetKeyFromPropertyBaseSlug,
} from "@/lib/property-address-slug";
import { formatMoneyFull, priceForListing } from "@/lib/listing-detail-math";

export type PropertyHistoryStatus = "Active" | "Sold" | "Under Agreement";

export type PropertyHistoryRow = {
  linkId: string;
  status: PropertyHistoryStatus;
  /** Primary row date: close date when sold, else on-market. */
  primaryDate: string | null;
  priceDisplay: string;
  sortTime: number;
};

function statusLabel(l: CncListing): PropertyHistoryStatus {
  const s = (l.MlsStatus || (l as { StandardStatus?: string }).StandardStatus || "").toUpperCase();
  if (s === "S" || s === "CLOSED") return "Sold";
  if (s === "A" || s === "ACTIVE") return "Active";
  return "Under Agreement";
}

function formatAddress(l: CncListing): string {
  const fromParts = [l.StreetNumber, l.StreetName].filter(Boolean).join(" ").trim();
  if (fromParts) return fromParts;
  return (l.Address || "").trim() || "Address unavailable";
}

function effectiveSortTime(l: CncListing): number {
  const st = statusLabel(l);
  if (st === "Sold" && l.CloseDate) {
    const t = new Date(l.CloseDate).getTime();
    if (!Number.isNaN(t)) return t;
  }
  if (l.OnMarketDate) {
    const t = new Date(l.OnMarketDate).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

function primaryDateForRow(l: CncListing, status: PropertyHistoryStatus): string | null {
  if (status === "Sold") return l.CloseDate?.trim() || null;
  return l.OnMarketDate?.trim() || null;
}

function priceDisplayForRow(l: CncListing, status: PropertyHistoryStatus): string {
  if (status === "Sold") {
    const c = l.ClosePrice;
    if (typeof c === "number" && c > 0) return formatMoneyFull(c);
  }
  const p = priceForListing(l, "list");
  if (p != null && p > 0) return formatMoneyFull(p);
  return "—";
}

/** Normalize to the same space-separated lower form `streetMatchKey` uses after expansion. */
function normalizeStreetKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function getCncListingsForPropertyStreetKey(streetKey: string): Promise<CncListing[]> {
  const keyNorm = normalizeStreetKey(streetKey);
  if (!keyNorm) return [];

  const [active, sold] = await Promise.all([
    fetchAllListings({ status: "A" }),
    fetchAllListings({ status: "S", close_date: 4000 }),
  ]);

  const seen = new Set<number>();
  const out: CncListing[] = [];

  for (const l of [...active, ...sold]) {
    const id = l.link_id;
    if (id == null || seen.has(id)) continue;
    const stem = listingAddressStem(l.Address, l.StreetNumber, l.StreetName);
    if (!stem || !looksLikeStreetAddress(stem)) continue;
    const k = streetMatchKey(stem);
    if (normalizeStreetKey(k) !== keyNorm) continue;
    seen.add(id);
    out.push(l);
  }
  return out;
}

export function listingsToPropertyHistoryRows(listings: CncListing[]): PropertyHistoryRow[] {
  const rows: PropertyHistoryRow[] = [];
  for (const l of listings) {
    const id = l.link_id;
    if (id == null) continue;
    const status = statusLabel(l);
    rows.push({
      linkId: String(id),
      status,
      primaryDate: primaryDateForRow(l, status),
      priceDisplay: priceDisplayForRow(l, status),
      sortTime: effectiveSortTime(l),
    });
  }
  rows.sort((a, b) => b.sortTime - a.sortTime);
  return rows;
}

export type PropertyNeighborIds = { prevLinkId: string | null; nextLinkId: string | null };

export function propertySaleNeighborsChronological(
  listings: CncListing[],
  currentLinkId: string,
): PropertyNeighborIds {
  const sorted = [...listings].sort((a, b) => effectiveSortTime(a) - effectiveSortTime(b));
  const idx = sorted.findIndex((l) => String(l.link_id) === currentLinkId);
  if (idx < 0) return { prevLinkId: null, nextLinkId: null };
  const prev = idx > 0 ? sorted[idx - 1]?.link_id : null;
  const next = idx < sorted.length - 1 ? sorted[idx + 1]?.link_id : null;
  return {
    prevLinkId: prev != null ? String(prev) : null,
    nextLinkId: next != null ? String(next) : null,
  };
}

export function displayTitleFromListings(listings: CncListing[], streetKey: string): string {
  const first = listings[0];
  if (first) return formatAddress(first);
  const k = streetKey.trim();
  if (!k) return "Property";
  return k.replace(/\b\w/g, (c) => c.toUpperCase());
}

export type PropertySlugLoadResult = {
  baseSlug: string;
  linkId: string | null;
  streetKey: string;
  listings: CncListing[];
  expectedBaseForInstance: string | null;
};

async function loadPropertyListingsForUrlSlugImpl(fullSlug: string): Promise<PropertySlugLoadResult> {
  const { baseSlug, linkId } = parseTrailingLinkIdFromPropertySlug(fullSlug);
  const streetKey = streetKeyFromPropertyBaseSlug(baseSlug);
  const listings = await getCncListingsForPropertyStreetKey(streetKey);

  let expectedBaseForInstance: string | null = null;
  if (linkId) {
    const hit = listings.find((l) => String(l.link_id) === linkId);
    expectedBaseForInstance = hit ? cncListingPropertyBaseSlug(hit) : null;
  }

  return { baseSlug, linkId, streetKey, listings, expectedBaseForInstance };
}

export const loadPropertyListingsForUrlSlug = cache(loadPropertyListingsForUrlSlugImpl);
