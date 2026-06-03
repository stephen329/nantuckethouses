import { listingAddressStem, looksLikeStreetAddress, streetMatchKey } from "@/lib/address-street-key";
import type { CncListing } from "@/lib/cnc-api";

const NANTUCKET_SLUG_SUFFIX = "-nantucket";

/** Public URL segment for the address “home” (e.g. `14-eel-point-road-nantucket`). */
export function propertyBaseSlugFromStreetKey(streetKey: string): string {
  const k = streetKey.trim().toLowerCase().replace(/\s+/g, " ");
  if (!k) return "";
  return `${k.replace(/\s+/g, "-")}${NANTUCKET_SLUG_SUFFIX}`;
}

/** Reverse `propertyBaseSlugFromStreetKey` for lookup (matches `streetMatchKey` stem space form). */
export function streetKeyFromPropertyBaseSlug(baseSlug: string): string {
  const s = baseSlug.trim().toLowerCase();
  const stripped = s.endsWith(NANTUCKET_SLUG_SUFFIX) ? s.slice(0, -NANTUCKET_SLUG_SUFFIX.length) : s;
  return stripped.replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

export function cncListingPropertyBaseSlug(l: CncListing): string | null {
  const stem = listingAddressStem(l.Address, l.StreetNumber, l.StreetName);
  if (!stem || !looksLikeStreetAddress(stem)) return null;
  const key = streetMatchKey(stem);
  if (!key) return null;
  return propertyBaseSlugFromStreetKey(key);
}

/**
 * Split `/property/{slug}` param into base slug and optional trailing LINK listing id.
 * Example: `14-eel-point-road-nantucket-47892` → base `14-eel-point-road-nantucket`, id `47892`.
 */
export function parseTrailingLinkIdFromPropertySlug(full: string): { baseSlug: string; linkId: string | null } {
  const trimmed = full.trim();
  const m = trimmed.match(/^(.*)-(\d{4,8})$/);
  if (!m) return { baseSlug: trimmed, linkId: null };
  return { baseSlug: m[1], linkId: m[2] };
}

/** Instance URL segment when `addressLine` is a single street line (no comma) or first segment before comma. */
export function propertyInstanceSlugFromAddressLine(addressLine: string, linkId: string | number): string | null {
  const stem = addressLine.split(",")[0]?.trim() ?? "";
  if (!stem || !looksLikeStreetAddress(stem)) return null;
  const key = streetMatchKey(stem);
  if (!key) return null;
  const base = propertyBaseSlugFromStreetKey(key);
  if (!base) return null;
  return `${base}-${String(linkId).trim()}`;
}
