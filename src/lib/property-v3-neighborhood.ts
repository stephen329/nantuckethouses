import { MAP_NEIGHBORHOOD_BOUNDS } from "@/lib/map-neighborhood-bounds";
import { normalizeNantucketAreaName } from "@/lib/nantucket-area-normalize";

export type Bbox = { west: number; south: number; east: number; north: number };

/** Fly-to boxes plus a few MLS labels not in the original map set. */
export const PROPERTY_V3_BBOX: Record<string, Bbox> = {
  ...MAP_NEIGHBORHOOD_BOUNDS,
  "tom-nevers": { west: -70.13, south: 41.22, east: -70.05, north: 41.255 },
};

export function inBbox(lng: number, lat: number, bbox: Bbox): boolean {
  return lng >= bbox.west && lng <= bbox.east && lat >= bbox.south && lat <= bbox.north;
}

/**
 * Map MLS `MLSAreaMajor` (normalized) to a bbox slug key in {@link PROPERTY_V3_BBOX}.
 * Returns null when unknown — caller may fall back to island-wide stats.
 */
export function mlsAreaToBboxKey(mlsArea: string | null | undefined): string | null {
  if (!mlsArea?.trim()) return null;
  const label = normalizeNantucketAreaName(mlsArea).toLowerCase();
  const direct: Record<string, string> = {
    town: "town",
    surfside: "surfside",
    sconset: "sconset",
    madaket: "madaket",
    cisco: "cisco",
    cliff: "cliff",
    polpis: "polpis",
    wauwinet: "wauwinet",
    dionis: "dionis",
    monomoy: "monomoy",
    madequecham: "madequecham",
    "tom nevers": "tom-nevers",
    "mid island": "mid-island",
    "brant point": "brant-point",
    nauset: "madequecham",
    quidnet: "wauwinet",
    shimmo: "mid-island",
  };
  if (direct[label]) return direct[label]!;
  if (PROPERTY_V3_BBOX[label]) return label;
  return null;
}

export function bboxForMlsArea(mlsArea: string | null | undefined): Bbox | null {
  const key = mlsAreaToBboxKey(mlsArea);
  if (!key) return null;
  return PROPERTY_V3_BBOX[key] ?? null;
}

export const ISLAND_BBOX: Bbox = { west: -70.2, south: 41.22, east: -69.95, north: 41.33 };
