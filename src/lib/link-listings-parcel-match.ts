import type { Feature, FeatureCollection, Geometry, Point } from "geojson";
import { centroidFromGeometry } from "@/lib/geo-centroid";
import { listingAddressStem, looksLikeStreetAddress, streetMatchKey } from "@/lib/address-street-key";

export type ParcelProps = { parcel_id?: string | null; location?: string | null };

export type LinkListingRow = {
  link_id?: number;
  Address?: string;
  StreetNumber?: string;
  StreetName?: string;
  ListPrice?: number;
  ClosePrice?: number;
  CloseDate?: string;
  MlsStatus?: string;
  Slug?: string;
  link_images?: { url?: string; small_url?: string }[];
};

export type LinkListingMapPoint = {
  linkId: number;
  longitude: number;
  latitude: number;
  address: string;
  listPrice: number;
  closePrice: number | null;
  closeDate: string | null;
  pool: "active" | "sold";
  thumbUrl: string | null;
  slug: string | null;
};

export type LinkListingPinProperties = {
  linkId: string;
  pool: "active" | "sold";
  address: string;
  listPrice: string;
  listPriceNum: number;
  closePrice: string;
  closeDate: string;
  thumbUrl: string | null;
  slug: string | null;
};

export type LinkListingPinFeature = Feature<Point, LinkListingPinProperties>;

function inBbox(lng: number, lat: number, west: number, south: number, east: number, north: number): boolean {
  return lng >= west && lng <= east && lat >= south && lat <= north;
}

function formatMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/** Build first-match street key → centroid from parcel GeoJSON features. */
export function buildParcelStreetCentroidIndex(
  features: Feature<Geometry, ParcelProps>[],
): Map<string, { lng: number; lat: number; parcel_id: string }> {
  const index = new Map<string, { lng: number; lat: number; parcel_id: string }>();
  for (const feat of features) {
    const loc = feat.properties?.location;
    const pid = feat.properties?.parcel_id;
    if (loc == null || pid == null || String(loc).trim() === "" || String(pid).trim() === "") continue;
    const locS = String(loc).trim();
    if (!looksLikeStreetAddress(locS)) continue;
    const key = streetMatchKey(locS);
    if (!key || index.has(key)) continue;
    const c = centroidFromGeometry(feat.geometry);
    if (!c) continue;
    index.set(key, { ...c, parcel_id: String(pid).trim() });
  }
  return index;
}

export function matchLinkListingToPoint(
  row: LinkListingRow,
  index: Map<string, { lng: number; lat: number; parcel_id: string }>,
  pool: "active" | "sold",
  bbox: { west: number; south: number; east: number; north: number },
): LinkListingMapPoint | null {
  const id = row.link_id;
  if (id == null) return null;
  const stem = listingAddressStem(row.Address, row.StreetNumber, row.StreetName);
  if (!stem) return null;
  const key = streetMatchKey(stem);
  if (!key) return null;
  const hit = index.get(key);
  if (!hit) return null;
  if (!inBbox(hit.lng, hit.lat, bbox.west, bbox.south, bbox.east, bbox.north)) return null;
  const img = row.link_images?.[0];
  const thumb = img?.small_url ?? img?.url ?? null;
  return {
    linkId: id,
    longitude: hit.lng,
    latitude: hit.lat,
    address: stem,
    listPrice: row.ListPrice ?? 0,
    closePrice: row.ClosePrice ?? null,
    closeDate: row.CloseDate ?? null,
    pool,
    thumbUrl: thumb,
    slug: row.Slug ?? null,
  };
}

export function linkMapPointsToGeoJson(points: LinkListingMapPoint[]): FeatureCollection<Point, LinkListingPinProperties> {
  return {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature" as const,
      id: `link:${p.linkId}`,
      geometry: { type: "Point" as const, coordinates: [p.longitude, p.latitude] },
      properties: {
        linkId: String(p.linkId),
        pool: p.pool,
        address: p.address,
        listPrice: formatMoney(p.listPrice),
        listPriceNum: p.listPrice,
        closePrice: p.closePrice != null ? formatMoney(p.closePrice) : "",
        closeDate: p.closeDate ?? "",
        thumbUrl: p.thumbUrl,
        slug: p.slug,
      },
    })),
  };
}
