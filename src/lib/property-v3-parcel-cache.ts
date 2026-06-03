import fs from "fs";
import path from "path";
import type { Feature, Geometry } from "geojson";
import { centroidFromGeometry } from "@/lib/geo-centroid";
import { listingAddressStem, looksLikeStreetAddress, streetMatchKey } from "@/lib/address-street-key";
import {
  buildParcelStreetCentroidIndex,
  type ParcelProps,
} from "@/lib/link-listings-parcel-match";
import { propertyBaseSlugFromStreetKey } from "@/lib/property-address-slug";

export type AssessorParcelProps = ParcelProps & {
  acreage?: number | null;
  lot_area_sqft?: number | null;
  assessed_total?: number | null;
  assessed_building?: number | null;
  owner_name?: string | null;
  use?: string | null;
  zoning?: string | null;
  tax_map?: string | null;
  parcel?: string | null;
};

export type AssessorParcelFeature = Feature<Geometry, AssessorParcelProps>;

type Cache = {
  features: AssessorParcelFeature[];
  byParcelId: Map<string, AssessorParcelFeature>;
  bySlug: Map<string, AssessorParcelFeature[]>;
};

let cache: Cache | null = null;
let streetIndex: Map<string, { lng: number; lat: number; parcel_id: string }> | null = null;

/** Same rules as public `/property/{slug}` base segment (see `property-address-slug`). */
export function parcelLocationToBaseSlug(location: string): string {
  const stem = listingAddressStem(location);
  if (!stem || !looksLikeStreetAddress(stem)) return "";
  const key = streetMatchKey(stem);
  if (!key) return "";
  return propertyBaseSlugFromStreetKey(key);
}

export function isSlugifiableParcelLocation(location: string | null | undefined): boolean {
  if (!location || !String(location).trim()) return false;
  return looksLikeStreetAddress(String(location).trim());
}

export function getAssessorParcelCache(): Cache {
  if (cache) return cache;
  const geoPath = path.join(
    process.cwd(),
    "src/data/zoning-tool/nantucket-tax-parcels.clean.geojson"
  );
  const raw = fs.readFileSync(geoPath, "utf8");
  const gj = JSON.parse(raw) as { features?: AssessorParcelFeature[] };
  const features = gj.features ?? [];
  const byParcelId = new Map<string, AssessorParcelFeature>();
  const bySlug = new Map<string, AssessorParcelFeature[]>();

  for (const f of features) {
    const pid = String(f.properties?.parcel_id ?? "").trim();
    if (pid) byParcelId.set(pid, f);
    const loc = f.properties?.location;
    if (!loc || !isSlugifiableParcelLocation(String(loc))) continue;
    const slug = parcelLocationToBaseSlug(String(loc));
    const arr = bySlug.get(slug) ?? [];
    arr.push(f);
    bySlug.set(slug, arr);
  }

  cache = { features, byParcelId, bySlug };
  return cache;
}

export function listParcelsBySlug(addressSlug: string): AssessorParcelFeature[] {
  const { bySlug } = getAssessorParcelCache();
  return bySlug.get(addressSlug.toLowerCase()) ?? [];
}

export function pickParcelForSlug(addressSlug: string): AssessorParcelFeature | null {
  const list = listParcelsBySlug(addressSlug);
  if (list.length === 0) return null;
  if (list.length === 1) return list[0]!;
  return [...list].sort((a, b) =>
    String(a.properties?.parcel_id ?? "").localeCompare(String(b.properties?.parcel_id ?? ""))
  )[0]!;
}

export function getParcelById(parcelId: string): AssessorParcelFeature | null {
  return getAssessorParcelCache().byParcelId.get(String(parcelId).trim()) ?? null;
}

/** Street-key → centroid (first parcel per key), for MLS ↔ parcel matching. */
export function getParcelStreetIndex(): Map<
  string,
  { lng: number; lat: number; parcel_id: string }
> {
  if (streetIndex) return streetIndex;
  streetIndex = buildParcelStreetCentroidIndex(
    getAssessorParcelCache().features as Feature<Geometry, ParcelProps>[]
  );
  return streetIndex;
}

export function parcelCentroid(f: AssessorParcelFeature): { lng: number; lat: number } | null {
  return centroidFromGeometry(f.geometry);
}
