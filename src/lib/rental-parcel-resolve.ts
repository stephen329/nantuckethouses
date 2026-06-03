import type { Feature, Geometry } from "geojson";
import { listingAddressStem, looksLikeStreetAddress, streetMatchKey } from "@/lib/address-street-key";

/** Minimal parcel fields needed to match an NR rental pin to a tax lot. */
export type ParcelPropsForRentalMatch = {
  parcel_id?: string | null;
  tax_map?: string | null;
  parcel?: string | null;
  location?: string | null;
};

export type ParcelFeatureForRentalMatch = Feature<Geometry, ParcelPropsForRentalMatch>;

function taxParcelLookupKey(p: ParcelPropsForRentalMatch): string {
  return `${p.tax_map ?? ""} ${p.parcel ?? ""}`.trim();
}

/**
 * Find the tax parcel feature for a vacation rental (slug from NR ↔ parcel feed,
 * else normalized street vs assessor `location`).
 */
export function findParcelFeatureForNrRental(
  rental: { slug?: string | null; streetAddress?: string | null },
  slugByParcelId: Record<string, string>,
  features: ParcelFeatureForRentalMatch[],
): ParcelFeatureForRentalMatch | null {
  const slug = String(rental.slug ?? "").trim().toLowerCase();
  if (slug) {
    for (const [feedKey, feedSlug] of Object.entries(slugByParcelId)) {
      if (String(feedSlug).trim().toLowerCase() !== slug) continue;
      const k = String(feedKey).trim();
      const byPid = features.find((f) => String(f.properties?.parcel_id ?? "").trim() === k);
      if (byPid) return byPid;
      const byTm = features.find((f) => taxParcelLookupKey(f.properties ?? {}).toLowerCase() === k.toLowerCase());
      if (byTm) return byTm;
    }
  }

  const stem = listingAddressStem(rental.streetAddress ?? undefined);
  if (!stem || !looksLikeStreetAddress(stem)) return null;
  const key = streetMatchKey(stem);
  if (!key) return null;

  for (const f of features) {
    const loc = String(f.properties?.location ?? "").trim();
    if (!loc || !looksLikeStreetAddress(loc)) continue;
    const locStem = listingAddressStem(loc);
    if (streetMatchKey(locStem) === key || streetMatchKey(loc) === key) return f;
  }
  return null;
}
