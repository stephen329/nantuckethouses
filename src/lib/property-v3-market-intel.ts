import { median } from "@/lib/cnc-api";

/** Client-safe: no Node `fs` (do not import `property-v3-parcel-cache` from this module). */

export type GeoMode = "mls" | "zoning";

export type SizeCompareMode = "gla" | "land";

export type CompFilterState = {
  /** Match listings by interior GLA band vs subject, or by MLS lot size vs subject lot. */
  sizeCompareMode: SizeCompareMode;
  glaTolerancePct: number;
  landTolerancePct: number;
  bedMin: number | null;
  bedMax: number | null;
  bathMin: number | null;
  bathMax: number | null;
  yearMin: number | null;
  yearMax: number | null;
  lotMinSqft: number | null;
  /** Normalized property-type labels; empty = all types */
  propertyTypeLabels: string[];
};

export const defaultCompFilterState = (): CompFilterState => ({
  sizeCompareMode: "gla",
  glaTolerancePct: 10,
  landTolerancePct: 30,
  bedMin: null,
  bedMax: null,
  bathMin: null,
  bathMax: null,
  yearMin: null,
  yearMax: null,
  lotMinSqft: null,
  propertyTypeLabels: [],
});

export type PropertyV3IntelSold = {
  linkId: number;
  address: string;
  lat: number | null;
  lon: number | null;
  distMi: number | null;
  sameStreet: boolean;
  sameMls: boolean;
  mlsArea: string | null;
  gla: number | null;
  beds: number | null;
  baths: number | null;
  yearBuilt: number | null;
  propertyTypeLabel: string | null;
  lotSqft: number | null;
  /** Last/original MLS list price when the feed includes it for sold rows. */
  listPrice: number | null;
  closePrice: number | null;
  closeDate: string | null;
  /** When present, used for sold days-on-market vs close. */
  onMarketDate: string | null;
  ppsf: number | null;
  closeToAssessedRatio: number | null;
  /** Assessor zoning on matched parcel (normalized key for cohort). */
  zoningKey: string | null;
};

export type PropertyV3IntelActive = {
  linkId: number;
  address: string;
  lat: number | null;
  lon: number | null;
  distMi: number | null;
  sameStreet: boolean;
  sameMls: boolean;
  mlsArea: string | null;
  gla: number | null;
  beds: number | null;
  baths: number | null;
  yearBuilt: number | null;
  propertyTypeLabel: string | null;
  lotSqft: number | null;
  listPrice: number | null;
  onMarketDate: string | null;
  ppsf: number | null;
  zoningKey: string | null;
};

export type PropertyV3IntelParcel = {
  parcelId: string;
  acreage: number | null;
  assessed: number | null;
  lotSqft: number | null;
  lng: number;
  lat: number;
  distMi: number | null;
  /** Parcel centroid inside MLS-area map bbox (assessor cohort used today). */
  inMlsBbox: boolean;
  zoningKey: string | null;
};

export function listingLatLon(row: {
  Latitude?: number;
  Longitude?: number;
  latitude?: number;
  longitude?: number;
}): { lat: number; lon: number } | null {
  const r = row as Record<string, unknown>;
  const lat = r.Latitude ?? r.latitude;
  const lon = r.Longitude ?? r.longitude;
  if (typeof lat === "number" && typeof lon === "number" && Number.isFinite(lat) && Number.isFinite(lon)) {
    return { lat, lon };
  }
  return null;
}

function passesGeo(
  row: { sameMls: boolean; zoningKey: string | null },
  mode: GeoMode,
  subjectZoningKey: string | null,
  /** When null/empty, intel rows were admitted without same-MLS (street / zoning / radius); do not drop them in MLS mode. */
  mlsAreaPrimary: string | null
): boolean {
  if (mode === "mls") {
    if (mlsAreaPrimary?.trim()) return row.sameMls;
    return true;
  }
  if (!subjectZoningKey) return false;
  return row.zoningKey != null && row.zoningKey === subjectZoningKey;
}

function passesCompFilters(
  row: {
    gla: number | null;
    beds: number | null;
    baths: number | null;
    yearBuilt: number | null;
    lotSqft: number | null;
    propertyTypeLabel: string | null;
  },
  subjectGla: number | null,
  subjectLotSqft: number | null,
  f: CompFilterState
): boolean {
  if (f.propertyTypeLabels.length > 0) {
    const lab = row.propertyTypeLabel?.trim() || "";
    if (!lab || !f.propertyTypeLabels.some((t) => lab === t || lab.includes(t) || t.includes(lab))) {
      return false;
    }
  }
  if (f.sizeCompareMode === "gla") {
    if (subjectGla != null && subjectGla > 0 && row.gla != null && row.gla > 0) {
      const tol = Math.max(1, f.glaTolerancePct) / 100;
      const ratio = row.gla / subjectGla;
      if (ratio < 1 - tol || ratio > 1 + tol) return false;
    }
  } else {
    if (subjectLotSqft != null && subjectLotSqft > 0 && row.lotSqft != null && row.lotSqft > 0) {
      const tol = Math.max(1, f.landTolerancePct) / 100;
      const ratio = row.lotSqft / subjectLotSqft;
      if (ratio < 1 - tol || ratio > 1 + tol) return false;
    }
  }
  if (f.bedMin != null && (row.beds == null || row.beds < f.bedMin)) return false;
  if (f.bedMax != null && (row.beds == null || row.beds > f.bedMax)) return false;
  if (f.bathMin != null && (row.baths == null || row.baths < f.bathMin)) return false;
  if (f.bathMax != null && (row.baths == null || row.baths > f.bathMax)) return false;
  if (f.yearMin != null && (row.yearBuilt == null || row.yearBuilt < f.yearMin)) return false;
  if (f.yearMax != null && (row.yearBuilt == null || row.yearBuilt > f.yearMax)) return false;
  if (f.lotMinSqft != null && f.lotMinSqft > 0) {
    if (row.lotSqft == null || row.lotSqft < f.lotMinSqft) return false;
  }
  return true;
}

export function filterSoldIntel(
  rows: PropertyV3IntelSold[],
  mode: GeoMode,
  subjectZoningKey: string | null,
  subjectGla: number | null,
  subjectLotSqft: number | null,
  filters: CompFilterState,
  /** Exclude subject parcel's own MLS rows if linkId matches */
  excludeLinkIds: Set<number>,
  mlsAreaPrimary: string | null
): PropertyV3IntelSold[] {
  return rows.filter((r) => {
    if (excludeLinkIds.has(r.linkId)) return false;
    if (!passesGeo(r, mode, subjectZoningKey, mlsAreaPrimary)) return false;
    return passesCompFilters(r, subjectGla, subjectLotSqft, filters);
  });
}

export function filterActiveIntel(
  rows: PropertyV3IntelActive[],
  mode: GeoMode,
  subjectZoningKey: string | null,
  subjectGla: number | null,
  subjectLotSqft: number | null,
  filters: CompFilterState,
  excludeLinkIds: Set<number>,
  mlsAreaPrimary: string | null
): PropertyV3IntelActive[] {
  return rows.filter((r) => {
    if (excludeLinkIds.has(r.linkId)) return false;
    if (!passesGeo(r, mode, subjectZoningKey, mlsAreaPrimary)) return false;
    return passesCompFilters(r, subjectGla, subjectLotSqft, filters);
  });
}

export function filterParcelIntel(
  rows: PropertyV3IntelParcel[],
  mode: GeoMode,
  subjectZoningKey: string | null,
  subjectParcelId: string
): PropertyV3IntelParcel[] {
  return rows.filter((p) => {
    if (p.parcelId === subjectParcelId) return false;
    if (mode === "mls") return p.inMlsBbox;
    if (!subjectZoningKey) return false;
    return p.zoningKey != null && p.zoningKey === subjectZoningKey;
  });
}

export function percentileInSorted(sortedAsc: number[], value: number): number | null {
  if (sortedAsc.length === 0) return null;
  const le = sortedAsc.filter((x) => x <= value).length;
  return Math.round((le / sortedAsc.length) * 100);
}

export function medianSoldPpsfFromIntel(rows: PropertyV3IntelSold[]): number | null {
  const v = rows.map((r) => r.ppsf).filter((x): x is number => x != null && x > 0);
  return median(v);
}

export function medianSoldListPriceFromIntel(rows: PropertyV3IntelSold[]): number | null {
  const v = rows.map((r) => r.listPrice).filter((x): x is number => x != null && x > 0);
  return median(v);
}

export function medianActivePpsfFromIntel(rows: PropertyV3IntelActive[]): number | null {
  const v = rows.map((r) => r.ppsf).filter((x): x is number => x != null && x > 0);
  return median(v);
}

export function medianGlaSoldFromIntel(rows: PropertyV3IntelSold[]): number | null {
  const v = rows.map((r) => r.gla).filter((x): x is number => x != null && x > 0);
  return median(v);
}

export function medianCloseToAssessedFromIntel(rows: PropertyV3IntelSold[]): {
  median: number | null;
  sample: number;
} {
  const ratios = rows.map((r) => r.closeToAssessedRatio).filter((x): x is number => x != null && x > 0);
  return { median: median(ratios), sample: ratios.length };
}

export function computeProjectionFromIntel(args: {
  subjectGla: number | null;
  subjectAssessed: number | null;
  soldRows: PropertyV3IntelSold[];
  activeRows: PropertyV3IntelActive[];
  soldWindowMonths: number;
}): {
  listLow: number;
  listHigh: number;
  saleLow: number;
  saleHigh: number;
} | null {
  const { subjectGla, subjectAssessed, soldRows, activeRows, soldWindowMonths } = args;
  const t0 = Date.now() - soldWindowMonths * (86400000 * 30.4375);
  const windowSold = soldRows.filter((r) => {
    if (!r.closeDate) return false;
    const t = new Date(r.closeDate).getTime();
    return Number.isFinite(t) && t >= t0;
  });
  const { median: medianRatio, sample } = medianCloseToAssessedFromIntel(windowSold);
  if (!subjectAssessed || !medianRatio || medianRatio <= 0 || sample < 1) return null;

  const medGla = medianGlaSoldFromIntel(windowSold);
  const glaAdj =
    subjectGla && medGla && medGla > 0 ? Math.min(1.35, Math.max(0.65, subjectGla / medGla)) : 1;
  const saleMid = subjectAssessed * medianRatio * glaAdj;

  const medSoldPpsf = medianSoldPpsfFromIntel(windowSold);
  const medActivePpsf = medianActivePpsfFromIntel(activeRows);
  const listBump =
    medActivePpsf && medSoldPpsf && medSoldPpsf > 0 ? medActivePpsf / medSoldPpsf : 1.05;

  return {
    listLow: Math.round(saleMid * listBump * 0.92),
    listHigh: Math.round(saleMid * listBump * 1.12),
    saleLow: Math.round(saleMid * 0.9),
    saleHigh: Math.round(saleMid * 1.1),
  };
}

export function pickLotSqftFromListing(row: {
  LotSizeSquareFeet?: number;
  lot_size_square_feet?: number;
  Lot_Size_Square_Feet?: number;
}): number | null {
  const a = row.LotSizeSquareFeet ?? row.lot_size_square_feet ?? row.Lot_Size_Square_Feet;
  return typeof a === "number" && a > 0 ? a : null;
}
