import type { FeatureCollection, Point } from "geojson";
import type { LinkListingPinProperties } from "@/lib/link-listings-parcel-match";
import type { NrMapRentalResult } from "@/lib/nr-map-rentals";

export type PropertyMapMode = "rent" | "sale" | "sold" | "all";

export type RentalRatePeriod = "weekly" | "monthly" | "annual";

export type RentalFiltersState = {
  ratePeriod: RentalRatePeriod;
  minRate: string;
  maxRate: string;
  minBedrooms: string;
  minBaths: string;
  minOccupancy: string;
  petFriendly: boolean;
  waterfront: boolean;
  pool: boolean;
  /** Any | walk to beach | not walk-to-beach */
  beachDistance: "any" | "walk" | "not_walk";
  renovated: boolean;
  townWalk: boolean;
};

export type LinkPropertyTypeKey = "sf" | "condo" | "land" | "guest" | "multi";

export type LinkFiltersState = {
  pricePreset: "" | "1-3" | "3-6" | "6+";
  minPrice: string;
  maxPrice: string;
  minBeds: string;
  minBaths: string;
  minLotAcres: string;
  newConstruction: boolean;
  waterfront: boolean;
  /** Keyword “walk to town” style (remarks / marketing). */
  walkToTown: boolean;
  /** Recently renovated / like-new (remarks heuristic). */
  renoRecent: boolean;
  /** Curated MLS areas (Surfside, Town, Brant Point, …). */
  highYieldZones: boolean;
  propertyTypes: LinkPropertyTypeKey[];
  /** yyyy-mm-dd inclusive lower bound on sold close date (sold pool). */
  soldCloseAfter: string;
  /** yyyy-mm-dd inclusive upper bound on sold close date (sold pool). */
  soldCloseBefore: string;
  minDom: string;
  maxDom: string;
  /** Max $/sqft when living area is present on the pin (LINK feed). */
  maxPricePerSqft: string;
};

export const DEFAULT_RENTAL_FILTERS: RentalFiltersState = {
  ratePeriod: "weekly",
  minRate: "",
  maxRate: "",
  minBedrooms: "",
  minBaths: "",
  minOccupancy: "",
  petFriendly: false,
  waterfront: false,
  pool: false,
  beachDistance: "any",
  renovated: false,
  townWalk: false,
};

export const DEFAULT_LINK_FILTERS: LinkFiltersState = {
  pricePreset: "",
  minPrice: "",
  maxPrice: "",
  minBeds: "",
  minBaths: "",
  minLotAcres: "",
  newConstruction: false,
  waterfront: false,
  walkToTown: false,
  renoRecent: false,
  highYieldZones: false,
  propertyTypes: [],
  soldCloseAfter: "",
  soldCloseBefore: "",
  minDom: "",
  maxDom: "",
  maxPricePerSqft: "",
};

export const LINK_PROPERTY_TYPE_LABELS: { key: LinkPropertyTypeKey; label: string }[] = [
  { key: "sf", label: "Single Family" },
  { key: "condo", label: "Condo / Townhouse" },
  { key: "land", label: "Land" },
  { key: "guest", label: "Guest / Carriage" },
  { key: "multi", label: "Multi-Family" },
];

export function isHighYieldMlsArea(area: string | null | undefined): boolean {
  if (!area?.trim()) return false;
  const a = area.toLowerCase();
  const needles = [
    "town",
    "brant",
    "cliff",
    "surfside",
    "sconset",
    "siasconset",
    "wauwinet",
    "quent",
    "dionis",
    "polpis",
    "quidnet",
    "pocomo",
    "madaket",
    "shimmo",
  ];
  return needles.some((n) => a.includes(n));
}

export function linkMatchesPropertyTypes(propertyType: string | null, keys: LinkPropertyTypeKey[]): boolean {
  if (!keys.length) return true;
  const s = (propertyType ?? "").toLowerCase();
  if (!s.trim()) return false;
  return keys.some((k) => {
    switch (k) {
      case "sf":
        return /\b(single.?family|sfr|detached)\b/i.test(s) || (s.includes("residential") && !s.includes("condo"));
      case "condo":
        return /\b(condo|townhouse|town house|attached)\b/i.test(s);
      case "land":
        return /\b(land|lot|lots|acre|unimproved|vacant land)\b/i.test(s);
      case "guest":
        return /\b(guest|carriage|in-?law|accessory)\b/i.test(s);
      case "multi":
        return /\b(multi|duplex|triplex|2.?4 units|investment)\b/i.test(s);
      default:
        return false;
    }
  });
}

function parsePositiveInt(s: string): number | null {
  const n = Number.parseInt(s.trim(), 10);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

function parsePositiveFloat(s: string): number | null {
  const n = Number.parseFloat(s.trim());
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

function parseMoney(s: string): number | null {
  const t = s.trim().replace(/[$,]/g, "");
  if (!t) return null;
  const n = Number.parseFloat(t);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

function parseListingDateMs(s: string | null | undefined): number | null {
  if (!s?.trim()) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

function domDays(onMarket: string | null, end: Date): number | null {
  const t0 = parseListingDateMs(onMarket);
  if (t0 == null) return null;
  return Math.floor((end.getTime() - t0) / 86_400_000);
}

function rentalComparableRate(r: NrMapRentalResult, period: RentalRatePeriod): number | null {
  const w = r.weeklyRentEstimate ?? null;
  if (w == null || w <= 0) return null;
  if (period === "weekly") return w;
  if (period === "monthly") return (w * 52) / 12;
  return w * 52;
}

export function countActiveRentalFilters(f: RentalFiltersState): number {
  let n = 0;
  if (f.minRate.trim() || f.maxRate.trim()) n += 1;
  if (f.minBedrooms.trim()) n += 1;
  if (f.minBaths.trim()) n += 1;
  if (f.minOccupancy.trim()) n += 1;
  if (f.petFriendly) n += 1;
  if (f.waterfront) n += 1;
  if (f.pool) n += 1;
  if (f.beachDistance !== "any") n += 1;
  if (f.renovated) n += 1;
  if (f.townWalk) n += 1;
  return n;
}

export function countActiveLinkFilters(f: LinkFiltersState): number {
  let n = 0;
  if (f.pricePreset) n += 1;
  else if (f.minPrice.trim() || f.maxPrice.trim()) n += 1;
  if (f.minBeds.trim()) n += 1;
  if (f.minBaths.trim()) n += 1;
  if (f.minLotAcres.trim()) n += 1;
  if (f.newConstruction) n += 1;
  if (f.waterfront) n += 1;
  if (f.walkToTown) n += 1;
  if (f.renoRecent) n += 1;
  if (f.highYieldZones) n += 1;
  if (f.propertyTypes.length) n += 1;
  if (f.soldCloseAfter.trim() || f.soldCloseBefore.trim()) n += 1;
  if (f.minDom.trim() || f.maxDom.trim()) n += 1;
  if (f.maxPricePerSqft.trim()) n += 1;
  return n;
}

export function applyRentalFilters(results: NrMapRentalResult[], f: RentalFiltersState): NrMapRentalResult[] {
  const minR = parseMoney(f.minRate);
  const maxR = parseMoney(f.maxRate);
  const minBed = parsePositiveInt(f.minBedrooms);
  const minBath = parsePositiveFloat(f.minBaths);
  const minOcc = parsePositiveInt(f.minOccupancy);

  return results.filter((r) => {
    const rate = rentalComparableRate(r, f.ratePeriod);
    if (minR != null && (rate == null || rate < minR)) return false;
    if (maxR != null && (rate == null || rate > maxR)) return false;

    if (minBed != null) {
      const b = r.totalBedrooms ?? 0;
      if (b < minBed) return false;
    }
    if (minBath != null) {
      const bth = r.totalBathrooms ?? 0;
      if (bth < minBath) return false;
    }
    if (minOcc != null) {
      const c = r.totalCapacity ?? 0;
      if (c < minOcc) return false;
    }
    if (f.petFriendly && !r.petFriendlyHint) return false;
    if (f.waterfront && !r.waterfrontHint) return false;
    if (f.pool && !r.hasPool) return false;
    if (f.beachDistance === "walk" && !r.walkToBeach) return false;
    if (f.beachDistance === "not_walk" && r.walkToBeach) return false;
    if (f.renovated && !r.renovatedHint) return false;
    if (f.townWalk && !r.townWalkHint) return false;
    return true;
  });
}

function linkTransactionPrice(p: LinkListingPinProperties, pool: "active" | "sold"): number {
  const closeN = typeof p.closePriceNum === "number" && !Number.isNaN(p.closePriceNum) ? p.closePriceNum : 0;
  if (pool === "sold" && closeN > 0) return closeN;
  return typeof p.listPriceNum === "number" && !Number.isNaN(p.listPriceNum) ? p.listPriceNum : 0;
}

export function filterLinkFeatureCollection(
  fc: FeatureCollection<Point, LinkListingPinProperties>,
  f: LinkFiltersState,
  pool: "active" | "sold",
): FeatureCollection<Point, LinkListingPinProperties> {
  let minP = parseMoney(f.minPrice);
  let maxP = parseMoney(f.maxPrice);
  if (f.pricePreset === "1-3") {
    minP = 1_000_000;
    maxP = 3_000_000;
  } else if (f.pricePreset === "3-6") {
    minP = 3_000_000;
    maxP = 6_000_000;
  } else if (f.pricePreset === "6+") {
    minP = 6_000_000;
    maxP = null;
  }

  const minBeds = parsePositiveFloat(f.minBeds);
  const minBaths = parsePositiveFloat(f.minBaths);
  const minLot = parsePositiveFloat(f.minLotAcres);
  const minDom = parsePositiveInt(f.minDom);
  const maxDom = parsePositiveInt(f.maxDom);
  const maxPpsf = parsePositiveFloat(f.maxPricePerSqft);
  const afterMs = f.soldCloseAfter.trim() ? parseListingDateMs(f.soldCloseAfter) : null;
  const beforeMs = f.soldCloseBefore.trim() ? parseListingDateMs(f.soldCloseBefore) : null;
  const now = new Date();

  const feats = fc.features.filter((feat) => {
    const p = feat.properties;
    const price = linkTransactionPrice(p, pool);
    if (minP != null && price < minP) return false;
    if (maxP != null && price > maxP) return false;

    const beds = p.bedrooms ?? null;
    const baths = p.baths ?? null;
    const lot = p.lotAcres ?? null;
    const nc = Boolean(p.newConstruction);
    const wf = Boolean(p.waterfront);

    if (minBeds != null) {
      if (beds == null || beds < minBeds) return false;
    }
    if (minBaths != null) {
      if (baths == null || baths < minBaths) return false;
    }
    if (minLot != null) {
      if (lot == null || lot < minLot) return false;
    }
    if (f.newConstruction && !nc) return false;
    if (f.waterfront && !wf) return false;
    if (f.walkToTown && !p.townWalkHint) return false;
    if (f.renoRecent && !p.renoHint) return false;
    if (f.highYieldZones && !isHighYieldMlsArea(p.mlsArea)) return false;
    if (!linkMatchesPropertyTypes(p.propertyType, f.propertyTypes)) return false;

    if (maxPpsf != null) {
      const sq = p.livingAreaSqft;
      if (sq == null || sq <= 0) return false;
      if (price / sq > maxPpsf) return false;
    }

    if (pool === "sold" && (afterMs != null || beforeMs != null)) {
      const closeMs = parseListingDateMs(p.closeDate);
      if (closeMs == null) return false;
      if (afterMs != null && closeMs < afterMs) return false;
      if (beforeMs != null && closeMs >= beforeMs + 86_400_000) return false;
    }

    if (minDom != null || maxDom != null) {
      const end = pool === "sold" ? new Date(parseListingDateMs(p.closeDate) ?? now) : now;
      const d = domDays(p.onMarketDate, end);
      if (d == null) return false;
      if (minDom != null && d < minDom) return false;
      if (maxDom != null && d > maxDom) return false;
    }

    return true;
  });

  return { type: "FeatureCollection", features: feats };
}
