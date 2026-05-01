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

export type LinkPropertyTypeKey = "houses" | "land" | "commercial";

/** Sold-pool “closed in the last …” window; empty = no date filter. */
export type LinkFiltersSoldInLast = "" | "7d" | "30d" | "90d" | "6m" | "12m" | "24m" | "36m";

/** Preset rows for the “Sold in last” control (no “any time” row — empty state uses a hidden `option`). */
export const LINK_FILTERS_SOLD_IN_LAST_OPTIONS: { value: Exclude<LinkFiltersSoldInLast, "">; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
  { value: "24m", label: "24 months" },
  { value: "36m", label: "36 months" },
];

export type LinkFiltersState = {
  pricePreset: "" | "1-3" | "3-6" | "6+";
  minPrice: string;
  maxPrice: string;
  minBeds: string;
  minBaths: string;
  minLotAcres: string;
  newConstruction: boolean;
  waterfront: boolean;
  /** Pool / swimming pool (remarks heuristic on LINK pins). */
  pool: boolean;
  propertyTypes: LinkPropertyTypeKey[];
  /** Sold listings only: require close date within this lookback from “now”. */
  soldInLast: LinkFiltersSoldInLast;
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
  pool: false,
  propertyTypes: [],
  soldInLast: "",
  minDom: "",
  maxDom: "",
  maxPricePerSqft: "",
};

/** MLS-facing labels for the map LINK property-type chips (sale/sold pools). */
export const LINK_PROPERTY_TYPE_LABELS: { key: LinkPropertyTypeKey; label: string }[] = [
  { key: "houses", label: "Houses" },
  { key: "land", label: "Land" },
  { key: "commercial", label: "Commercial" },
];

function linkPropertyTypeIsLand(low: string): boolean {
  return /\b(land|lot|lots|acre|unimproved|vacant land|lots\s*[\/&]\s*land|agricultural|farm)\b/i.test(low);
}

function linkPropertyTypeIsCommercial(low: string): boolean {
  return /\b(commercial|industrial|retail|office|warehouse|hospitality|hotel|motel|mixed.?use|business|medical|restaurant)\b/i.test(
    low,
  );
}

/** Dwelling / residential inventory that is not land-only or commercial. */
function linkPropertyTypeIsHouses(low: string): boolean {
  if (!low.trim()) return false;
  if (linkPropertyTypeIsLand(low) || linkPropertyTypeIsCommercial(low)) return false;
  return (
    /\b(single.?family|1.?family|one.?family|sfr|detached|attached)\b/i.test(low) ||
    /\b(condo|townhouse|town house|co-?op|cooperative)\b/i.test(low) ||
    /\baffordable\b/i.test(low) ||
    /\b(guest|carriage|in-?law|accessory)\b/i.test(low) ||
    /\b(multi|duplex|triplex|2-?4 units|investment)\b/i.test(low) ||
    (/\bresidential\b/i.test(low) && !/\bland\b/i.test(low))
  );
}

export function linkMatchesPropertyTypes(propertyType: string | null, keys: LinkPropertyTypeKey[]): boolean {
  if (!keys.length) return true;
  const raw = propertyType ?? "";
  if (!raw.trim()) return false;
  const low = raw.toLowerCase();
  return keys.some((k) => {
    switch (k) {
      case "land":
        return linkPropertyTypeIsLand(low);
      case "commercial":
        return linkPropertyTypeIsCommercial(low);
      case "houses":
        return linkPropertyTypeIsHouses(low);
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
  if (f.pool) n += 1;
  if (f.propertyTypes.length) n += 1;
  if (f.soldInLast) n += 1;
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

/** Start of “sold in last …” window (inclusive), in ms since epoch. */
export function soldInLastStartMs(preset: LinkFiltersSoldInLast, now: Date): number | null {
  if (!preset) return null;
  const DAY = 86_400_000;
  const t = now.getTime();
  if (preset === "7d") return t - 7 * DAY;
  if (preset === "30d") return t - 30 * DAY;
  if (preset === "90d") return t - 90 * DAY;
  const months =
    preset === "6m" ? 6 : preset === "12m" ? 12 : preset === "24m" ? 24 : preset === "36m" ? 36 : 0;
  if (!months) return null;
  const d = new Date(t);
  d.setMonth(d.getMonth() - months);
  return d.getTime();
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
  const now = new Date();
  const soldWindowStartMs = pool === "sold" ? soldInLastStartMs(f.soldInLast, now) : null;
  const soldWindowEndMs = now.getTime();

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
    if (f.pool && !p.hasPool) return false;
    if (!linkMatchesPropertyTypes(p.propertyType, f.propertyTypes)) return false;

    if (maxPpsf != null) {
      const sq = p.livingAreaSqft;
      if (sq == null || sq <= 0) return false;
      if (price / sq > maxPpsf) return false;
    }

    if (pool === "sold" && soldWindowStartMs != null) {
      const closeMs = parseListingDateMs(p.closeDate);
      if (closeMs == null) return false;
      if (closeMs < soldWindowStartMs) return false;
      if (closeMs > soldWindowEndMs) return false;
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
