import { propertyInstanceSlugFromAddressLine } from "@/lib/property-address-slug";

/** Canonical address timeline (bookmark / SEO primary). */
export function propertyBasePath(baseSlug: string): string {
  const s = String(baseSlug).trim();
  if (!s) return "/map";
  return `/property/${encodeURIComponent(s)}`;
}

/** One MLS instance: `{baseSlug}-{linkId}` under `/property/`. */
export function propertyInstancePath(baseSlug: string, linkId: string | number): string {
  const s = String(baseSlug).trim();
  const id = String(linkId).trim();
  if (!s || !id) return "/map";
  return `/property/${encodeURIComponent(`${s}-${id}`)}`;
}

/**
 * Preferred public URL for listing intelligence when a street slug can be derived from the address.
 * Falls back to `/listings/{id}` when the feed line is missing or not a matchable street.
 */
export function listingDetailPath(linkId: string | number, addressLine?: string | null): string {
  const id = String(linkId).trim();
  if (!id) return "/listings";
  const segment = addressLine ? propertyInstanceSlugFromAddressLine(addressLine, id) : null;
  if (segment) return `/property/${encodeURIComponent(segment)}`;
  return `/listings/${encodeURIComponent(id)}`;
}

/** In-app parcel landing (assessor tax map + parcel id). */
export function parcelDetailPath(taxMap: string, parcel: string): string {
  const tm = String(taxMap).trim();
  const p = String(parcel).trim();
  if (!tm || !p) return "/map";
  return `/parcels/${encodeURIComponent(tm)}/${encodeURIComponent(p)}`;
}

/** Full zoning worksheet tool. */
export function zoningLookupToolPath(taxMap: string, parcel: string): string {
  const tm = String(taxMap).trim();
  const p = String(parcel).trim();
  return `/tools/zoning-lookup/${encodeURIComponent(tm)}/${encodeURIComponent(p)}`;
}
