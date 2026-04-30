import type { Feature, Geometry } from "geojson";
import type { LinkListingPinProperties } from "@/lib/link-listings-parcel-match";
import { buildParcelStreetCentroidIndex, type ParcelProps } from "@/lib/link-listings-parcel-match";
import { listingAddressStem, streetMatchKey } from "@/lib/address-street-key";

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
  const key = streetMatchKey(stem);
  if (!key) return null;
  const hit = index.get(key);
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
