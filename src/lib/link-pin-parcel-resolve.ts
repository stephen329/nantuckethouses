import type { Feature, Geometry } from "geojson";
import type { LinkListingPinProperties } from "@/lib/link-listings-parcel-match";
import { buildParcelStreetCentroidIndex, type ParcelProps } from "@/lib/link-listings-parcel-match";
import { listingAddressStem, streetIndexLookupKeys } from "@/lib/address-street-key";

/**
 * Resolve a LINK listing address (MLS / pin `address`) to a tax parcel feature
 * using the same street-key → centroid index as `/api/map/link-listings`.
 */
export function findParcelFeatureByListingAddress<G extends { parcel_id?: string | null }>(
  address: string,
  features: Feature<Geometry, G>[],
): Feature<Geometry, G> | null {
  if (!features.length) return null;
  const index = buildParcelStreetCentroidIndex(features as Feature<Geometry, ParcelProps>[]);
  const stem = listingAddressStem(address);
  if (!stem) return null;
  let hit: { lng: number; lat: number; parcel_id: string } | null = null;
  for (const key of streetIndexLookupKeys(stem)) {
    const h = index.get(key);
    if (h) {
      hit = h;
      break;
    }
  }
  if (!hit) return null;
  const pid = hit.parcel_id.trim();
  return features.find((f) => String(f.properties?.parcel_id ?? "").trim() === pid) ?? null;
}

export function findParcelFeatureForLinkPin<G extends { parcel_id?: string | null }>(
  props: LinkListingPinProperties,
  features: Feature<Geometry, G>[],
): Feature<Geometry, G> | null {
  return findParcelFeatureByListingAddress(props.address, features);
}
