import { promises as fs } from "node:fs";
import path from "node:path";
import type { Feature, Geometry } from "geojson";
import zoningData from "@/data/zoning-districts.json";
import { findParcelFeatureByListingAddress } from "@/lib/link-pin-parcel-resolve";

type RawFeature = {
  geometry: GeoJSON.Geometry;
  properties: Record<string, unknown>;
};

type RawCollection = {
  metadata?: {
    source_file?: string;
  };
  features: RawFeature[];
};

export type ParcelRecord = {
  parcelId: string;
  taxMap: string;
  parcel: string;
  address: string;
  subtitle: string;
  zoningCode: string;
  zoningColor: string;
  lotSizeAcres: number | null;
  lotSizeSqft: number | null;
  assessedValue: number | null;
  assessedPerAcre: number | null;
  primaryUse: string;
  owner: string;
  geometry: GeoJSON.Geometry;
};

/** Assessor parcel row matched from a listing street address (same index as the Property Map). */
export type AssessorParcelMatch = {
  zoningCode: string;
  taxMap: string;
  parcel: string;
  parcelId: string;
};

export type DistrictRule = {
  code: string;
  name: string;
  minLotSize?: string;
  frontage?: string;
  maxGroundCover?: string;
  frontSetback?: string;
  sideSetback?: string;
  rearSetback?: string;
  notes?: string;
  hdcScrutiny?: string;
};

const PARCEL_DATA_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "zoning-tool",
  "nantucket-tax-parcels.clean.geojson",
);

let cachedDataPromise: Promise<RawCollection> | null = null;

async function loadParcelCollection(): Promise<RawCollection> {
  if (!cachedDataPromise) {
    cachedDataPromise = fs
      .readFile(PARCEL_DATA_PATH, "utf8")
      .then((content) => JSON.parse(content) as RawCollection);
  }
  return cachedDataPromise;
}

function normalizeDistrictCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "").replace(/-/g, "");
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/[$,]/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toParcelRecord(feature: RawFeature): ParcelRecord {
  const p = feature.properties ?? {};
  const lotSizeAcres = toNumber(p.acreage);
  const lotSizeSqft = toNumber(p.lot_area_sqft);
  const assessedValue = toNumber(p.assessed_total);
  const parcelId = toStringValue(p.parcel_id);
  const taxMap = toStringValue(p.tax_map);
  const parcel = toStringValue(p.parcel);
  const zoningCode = toStringValue(p.zoning);

  return {
    parcelId,
    taxMap,
    parcel,
    address: toStringValue(p.location) || "Address unavailable",
    subtitle: `${zoningCode || "Unknown zoning"} • ${toStringValue(p.use) || "Unknown use"} • ${
      lotSizeAcres !== null ? `${lotSizeAcres.toFixed(2)} Acres` : "Lot size unavailable"
    }`,
    zoningCode,
    zoningColor: toStringValue(p.zoning_color) || "#64748b",
    lotSizeAcres,
    lotSizeSqft,
    assessedValue,
    assessedPerAcre: toNumber(p.assessed_price_per_acre),
    primaryUse: toStringValue(p.use) || toStringValue(p.primary_use) || "Unknown",
    owner: toStringValue(p.owner_name) || "Unknown",
    geometry: feature.geometry,
  };
}

/**
 * Match a LINK-style street line to the assessor parcel GeoJSON (centroid street-key index).
 * Returns zoning + parcel ids for deep links and allowable-use charts.
 */
export async function matchAssessorParcelByListingAddress(
  addressLine: string,
): Promise<AssessorParcelMatch | null> {
  const line = addressLine.trim();
  if (!line) return null;
  const collection = await loadParcelCollection();
  const hit = findParcelFeatureByListingAddress(
    line,
    collection.features as Feature<Geometry, { parcel_id?: string | null }>[],
  );
  if (!hit?.properties) return null;
  const p = hit.properties as Record<string, unknown>;
  const zoningCode = toStringValue(p.zoning);
  if (!zoningCode) return null;
  return {
    zoningCode,
    taxMap: toStringValue(p.tax_map),
    parcel: toStringValue(p.parcel),
    parcelId: toStringValue(p.parcel_id),
  };
}

export async function getParcelByMapAndParcel(
  taxMap: string,
  parcel: string,
): Promise<ParcelRecord | null> {
  const collection = await loadParcelCollection();
  const normalizedMap = taxMap.trim();
  const normalizedParcel = parcel.trim();

  const feature = collection.features.find((candidate) => {
    const properties = candidate.properties ?? {};
    return (
      toStringValue(properties.tax_map) === normalizedMap &&
      toStringValue(properties.parcel) === normalizedParcel
    );
  });

  return feature ? toParcelRecord(feature) : null;
}

export async function getComparableParcels(
  zoningCode: string,
  limit = 5,
): Promise<ParcelRecord[]> {
  const collection = await loadParcelCollection();
  const normalized = normalizeDistrictCode(zoningCode);

  return collection.features
    .map(toParcelRecord)
    .filter((record) => normalizeDistrictCode(record.zoningCode) === normalized)
    .sort((a, b) => (b.assessedValue ?? 0) - (a.assessedValue ?? 0))
    .slice(0, limit);
}

export function getDistrictRule(zoningCode: string): DistrictRule | null {
  const districts = zoningData.districts as Record<string, Record<string, string>>;
  const target = normalizeDistrictCode(zoningCode);

  for (const [code, district] of Object.entries(districts)) {
    if (normalizeDistrictCode(code) === target) {
      return {
        code,
        name: district.name ?? "District",
        minLotSize: district.minLotSize,
        frontage: district.frontage,
        maxGroundCover: district.maxGroundCover,
        frontSetback: district.frontSetback,
        sideSetback: district.sideSetback,
        rearSetback: district.rearSetback,
        notes: district.notes,
        hdcScrutiny: district.hdcScrutiny,
      };
    }
  }

  return null;
}

export async function getParcelDataLastUpdatedLabel(): Promise<string> {
  const collection = await loadParcelCollection();
  const source = collection.metadata?.source_file ?? "";
  if (source.includes("2025")) return "May 2025";
  return "Assessor data file";
}
