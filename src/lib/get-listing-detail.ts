import {
  fetchAllListings,
  median,
  average,
  daysBetween,
  type CncListing,
} from "@/lib/cnc-api";
import { normalizeNantucketAreaName } from "@/lib/nantucket-area-normalize";
import { neighborhoodBenchmarkBlurb } from "@/lib/listing-neighborhood-copy";
import {
  computeIslandBenchmarks,
  dollarPerSf,
  formatMoneyFull,
  listingDomDays,
  livingSqftFromListing,
  lotSqftFromListing,
  priceForListing,
  sliceNeighborhood,
  type IslandBenchmarks,
} from "@/lib/listing-detail-math";
import { formatHeatingCodes } from "@/lib/heating-labels";
import { formatViewCodes } from "@/lib/views-labels";
import { formatSewerCodes } from "@/lib/sewer-labels";
import { getInteriorFeaturesDisplayParts } from "@/lib/interior-features-layout";
import { formatListingTypeDisplay, listingTypOrPropertyType } from "@/lib/listing-type-labels";
import {
  computeIslandValueScoreSnapshot,
  type ListingIslandValueScore,
} from "@/lib/listing-benchmark-signals";
import { matchAssessorParcelByListingAddress, getDistrictRule } from "@/lib/parcel-data";
import {
  buildZoningUseRowsForDistrict,
  zoningUseChartLegendAndSource,
  type ListingAllowableUsesModule,
} from "@/lib/zoning-allowable-uses";

export type ListingStatusLabel = "Active" | "Sold" | "Under Agreement";

export type NormalizedListingDetail = {
  linkId: string;
  addressLine: string;
  neighborhood: string;
  listPrice: number | null;
  closePrice: number | null;
  closeDate: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  livingSqft: number | null;
  lotSqft: number | null;
  yearBuilt: number | null;
  dollarPerSfList: number | null;
  dollarPerSfClose: number | null;
  status: ListingStatusLabel;
  mlsRawStatus: string;
  dom: number | null;
  photos: string[];
  propertyType: string | null;
  views: string[];
  taxAnnual: number | null;
  taxYear: number | null;
  /** When RESO / LINK exposes assessed total (sparse). */
  taxAssessedValue: number | null;
};

export type PropertyFactRow = {
  label: string;
  value: string;
  href?: string;
  hrefLabel?: string;
  /** Preserve newlines in the value cell (e.g. stacked interior sections). */
  multiline?: boolean;
};

export type PropertyFactSection = {
  title: string;
  rows: PropertyFactRow[];
};

export type DerivedMetricRow = {
  label: string;
  value: string;
  /** Muted supporting line under the value. */
  sub?: string;
  /** Below neighborhood $/SF = subtle favorable (buy-side framing). */
  valueTone?: "favorable" | "neutral";
  /** Native tooltip (e.g. list vs assessed). */
  valueTitle?: string;
};

export type ActivePeerRow = {
  linkId: string;
  address: string;
  neighborhood: string;
  onMarketDate: string | null;
  listPrice: number;
  ppsf: number | null;
  dom: number | null;
  yearBuilt: number | null;
  beds: number | null;
  baths: number | null;
  livingSqft: number | null;
  similarityScore: number;
  deltaNote: string;
};

export type CompRow = {
  linkId: string;
  address: string;
  neighborhood: string;
  closeDate: string;
  closePrice: number;
  ppsf: number | null;
  yearBuilt: number | null;
  beds: number | null;
  baths: number | null;
  livingSqft: number | null;
  lotSqft: number | null;
  /** 0–100 heuristic vs subject (SF, price, age, lot, beds/baths). */
  similarityScore: number;
  deltaNote: string;
  /** Recency of comp close (sold only). */
  monthsSinceClose: number | null;
  /** Straight-line distance when coords exist in feed; otherwise null. */
  distanceMiles: number | null;
};

/** Human-readable comp-pool rules for this subject (matches `listingsMatchingCompCriteria`). */
export type CompSetCriterion = { label: string; text: string };

export type CompSetDefinition = {
  criteria: CompSetCriterion[];
  /** Ranking, sold window, and how table chips relate to the pool. */
  methodology: string;
};

export type ListingDetailPayload = {
  listing: NormalizedListingDetail;
  /** ISO date-only for copy blocks */
  dataAsOfDateLabel: string;
  dataTooltip: string;
  island: IslandBenchmarks;
  neighborhood: ReturnType<typeof sliceNeighborhood>;
  nhAvgActivePpsf: number | null;
  nhAvgSoldPpsf: number | null;
  nhMedianYearBuilt: number | null;
  nhMedianAge: number | null;
  /** Price-band (sold 12 mo) year stats for rough tier context */
  tierYearBuiltRange: string | null;
  tierMedianAgeRange: string | null;
  comps: CompRow[];
  /** Active / on-market peers in same pool as benchmarks (similarity-ranked). */
  activePeerComps: ActivePeerRow[];
  expertParagraph: string;
  /** Institutional snapshot rows for the listing sidebar. */
  islandContextRows: { label: string; value: string }[];
  propertyFactSections: PropertyFactSection[];
  derivedMetrics: DerivedMetricRow[];
  /** Median days on market for sold closings in this listing’s price tier (12 mo island). */
  tierMedianDomSold: number | null;
  assessorSearchUrl: string;
  linkMlsDetailUrl: string;
  /** Full date+time (ET) when this payload was built. */
  lastUpdatedAtLabel: string;
  /** Short bullets under value context (live counts from this pull). */
  marketPulseBullets: string[];
  /** One-line radar / profile takeaway from this pull. */
  valueContextTakeaway: string | null;
  /** Neighborhood $/SF rank vs cohort when sample is large enough. */
  nhPpsfPercentileNote: string | null;
  /** Assessor parcel match → same allowable-use chart as the Property Map. */
  listingAllowableUses: ListingAllowableUsesModule;
  /** Island $/SF value score (same basis as benchmark dashboard) for hero placement. */
  listingValueScore: ListingIslandValueScore | null;
  /** What “comps” means for this listing (same filters as sold + active peer pools). */
  compSet: CompSetDefinition;
};

function statusLabel(l: CncListing): ListingStatusLabel {
  const s = (l.MlsStatus || l.StandardStatus || "").toUpperCase();
  if (s === "S" || s === "CLOSED") return "Sold";
  if (s === "A" || s === "ACTIVE") return "Active";
  return "Under Agreement";
}

function formatAddress(l: CncListing): string {
  const fromParts = [l.StreetNumber, l.StreetName].filter(Boolean).join(" ").trim();
  if (fromParts) return fromParts;
  return (l.Address || "").trim() || "Address unavailable";
}

export async function findListingByLinkId(linkId: number): Promise<CncListing | null> {
  const active = await fetchAllListings({ status: "A" });
  const inActive = active.find((l) => l.link_id === linkId);
  if (inActive) return inActive;
  const sold = await fetchAllListings({ status: "S", close_date: 1095 });
  return sold.find((l) => l.link_id === linkId) ?? null;
}

function yearTierFromPrice(price: number | null): { min: number; max: number } | null {
  if (price == null || price <= 0) return null;
  if (price < 2_000_000) return { min: 1_500_000, max: 2_000_000 };
  if (price < 3_000_000) return { min: 2_000_000, max: 3_000_000 };
  if (price < 5_000_000) return { min: 3_000_000, max: 5_000_000 };
  if (price < 8_000_000) return { min: 5_000_000, max: 8_000_000 };
  return { min: 8_000_000, max: 25_000_000 };
}

function formatSoldTierPriceBand(tier: { min: number; max: number }): string {
  const a = tier.min / 1_000_000;
  const b = tier.max / 1_000_000;
  const fmt = (x: number) => (Math.abs(x - Math.round(x)) < 1e-6 ? String(Math.round(x)) : x.toFixed(1));
  return `$${fmt(a)}M–$${fmt(b)}M`;
}

function tierYearStats(
  sold: CncListing[],
  tier: { min: number; max: number } | null
): { yearRange: string | null; ageRange: string | null } {
  if (!tier) return { yearRange: null, ageRange: null };
  const band = formatSoldTierPriceBand(tier);
  const ys = sold
    .filter((l) => {
      const p = l.ClosePrice ?? l.ListPrice;
      return typeof p === "number" && p >= tier.min && p < tier.max;
    })
    .map((l) => l.YearBuilt)
    .filter((y): y is number => typeof y === "number" && y > 1600 && y <= new Date().getFullYear());
  if (ys.length < 3) return { yearRange: null, ageRange: null };
  const sorted = [...ys].sort((a, b) => a - b);
  const yMed = median(sorted)!;
  const yLo = sorted[Math.floor(sorted.length * 0.25)]!;
  const yHi = sorted[Math.ceil(sorted.length * 0.75) - 1]!;
  const cy = new Date().getFullYear();
  const ages = sorted.map((y) => cy - y);
  const aMed = median(ages)!;
  const aLo = ages[Math.floor(ages.length * 0.25)]!;
  const aHi = ages[Math.ceil(ages.length * 0.75) - 1]!;
  const n = ys.length;
  const nNote = n >= 3 ? ` · n=${n} sold in band` : "";
  return {
    yearRange: `${yLo}–${yHi} (median year built ${yMed}; sold homes ${band} island-wide${nNote})`,
    ageRange: `${aLo}–${aHi} yr (median age ${aMed}; same sold cohort${nNote})`,
  };
}

/** Same MLS area (normalized). If subject has no MLS area, area is not enforced. */
function compSameMlsArea(subject: CncListing, row: CncListing): boolean {
  const s = subject.MLSAreaMajor?.trim();
  if (!s) return true;
  const r = row.MLSAreaMajor?.trim();
  if (!r) return false;
  return normalizeNantucketAreaName(s) === normalizeNantucketAreaName(r);
}

/** Comp bedrooms = subject count or one more (when subject bed count is known). */
function compBedroomRule(subject: CncListing, row: CncListing): boolean {
  const b0 = subject.BedroomsTotal;
  if (b0 == null || b0 < 0) return true;
  const b = row.BedroomsTotal;
  if (b == null) return false;
  return b === b0 || b === b0 + 1;
}

/** Comp GLA within ±12% of subject GLA (when subject GLA is known). */
function compLivingAreaBand(subject: CncListing, row: CncListing): boolean {
  const s = livingSqftFromListing(subject);
  if (s == null || s <= 0) return true;
  const g = livingSqftFromListing(row);
  if (g == null || g <= 0) return false;
  return g >= s * 0.88 && g <= s * 1.12;
}

function listingsMatchingCompCriteria(subject: CncListing, pool: CncListing[]): CncListing[] {
  return pool.filter(
    (l) => compSameMlsArea(subject, l) && compBedroomRule(subject, l) && compLivingAreaBand(subject, l)
  );
}

export function buildCompSetDefinition(subject: CncListing): CompSetDefinition {
  const criteria: CompSetCriterion[] = [];

  const areaRaw = subject.MLSAreaMajor?.trim();
  if (areaRaw) {
    criteria.push({
      label: "MLS area",
      text: `Same normalized MLS area as this listing ("${normalizeNantucketAreaName(areaRaw)}"). Comps without an MLS area do not qualify.`,
    });
  } else {
    criteria.push({
      label: "MLS area",
      text: "Not restricted - this listing has no MLS area on file, so comps are not filtered by MLS area.",
    });
  }

  const beds = subject.BedroomsTotal;
  if (beds != null && beds >= 0) {
    criteria.push({
      label: "Bedrooms",
      text:
        beds === 0
          ? "0 or 1 bedroom (same as this listing or one more)."
          : `${beds} or ${beds + 1} bedrooms (same as this listing or one more).`,
    });
  } else {
    criteria.push({
      label: "Bedrooms",
      text: "Not restricted - bedroom count is missing on this listing.",
    });
  }

  const gla = livingSqftFromListing(subject);
  if (gla != null && gla > 0) {
    const lo = Math.round(gla * 0.88);
    const hi = Math.round(gla * 1.12);
    criteria.push({
      label: "Living area",
      text: `${lo.toLocaleString()}-${hi.toLocaleString()} sq ft (±12% around this listing's ${Math.round(gla).toLocaleString()} sq ft). Comps without living SF do not qualify.`,
    });
  } else {
    criteria.push({
      label: "Living area",
      text: "Not restricted - living square footage is missing on this listing.",
    });
  }

  return {
    criteria,
    methodology:
      "Sold comps are closings from the last 12 months with a sale price. Active peers are other listings marked active with a list price. Both pools use the rules above, then we rank by closest living area, price, and year built (ties: newer close for sold, newer on-market date for active). The chips above the table only narrow what you see; they do not change the server-side pool.",
  };
}

function selectComps(subject: CncListing, sold: CncListing[], limit: number): CncListing[] {
  const sq = livingSqftFromListing(subject);
  const refPrice =
    priceForListing(subject, statusLabel(subject) === "Sold" ? "close" : "list") ?? subject.ListPrice;

  let pool = sold.filter((l) => l.link_id !== subject.link_id && l.ClosePrice && l.ClosePrice > 0);
  pool = listingsMatchingCompCriteria(subject, pool);

  const scored = pool.map((l) => {
    const lsq = livingSqftFromListing(l);
    let score = 0;
    if (sq && lsq) score += Math.abs(lsq - sq);
    const cp = l.ClosePrice ?? 0;
    if (refPrice && cp) score += Math.abs(cp - refPrice) / 50_000;
    const yb = l.YearBuilt;
    const sy = subject.YearBuilt;
    if (yb && sy) score += Math.abs(yb - sy) * 3;
    return { l, score };
  });

  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    const ta = Date.parse(a.l.CloseDate?.trim() || "") || 0;
    const tb = Date.parse(b.l.CloseDate?.trim() || "") || 0;
    return tb - ta;
  });
  return scored.slice(0, limit).map((x) => x.l);
}

function compSimilarityScore(subject: CncListing, c: CncListing): number {
  let loss = 0;
  const sSq = livingSqftFromListing(subject);
  const cSq = livingSqftFromListing(c);
  if (sSq && cSq && sSq > 0) loss += Math.min(Math.abs(cSq - sSq) / sSq, 1.2) * 32;
  const sP = priceForListing(subject, statusLabel(subject) === "Sold" ? "close" : "list") ?? subject.ListPrice;
  const cP = c.ClosePrice ?? 0;
  if (sP && cP) loss += Math.min(Math.abs(cP - sP) / sP, 0.85) * 28;
  const sy = subject.YearBuilt;
  const cy = c.YearBuilt;
  if (sy && cy) loss += Math.min(Math.abs(cy - sy) / 45, 1) * 14;
  const sLot = lotSqftFromListing(subject);
  const cLot = lotSqftFromListing(c);
  if (sLot && cLot && sLot > 0) loss += Math.min(Math.abs(cLot - sLot) / sLot, 1.2) * 14;
  const sb = subject.BedroomsTotal ?? 0;
  const cb = c.BedroomsTotal ?? 0;
  loss += Math.min(Math.abs(cb - sb), 4) * 2.2;
  const sbt = subject.BathroomsTotalDecimal ?? 0;
  const cbt = c.BathroomsTotalDecimal ?? 0;
  loss += Math.min(Math.abs(cbt - sbt), 3) * 2;
  return Math.max(0, Math.min(100, Math.round(100 - loss)));
}

function activePeerSimilarityScore(subject: CncListing, c: CncListing): number {
  let loss = 0;
  const sSq = livingSqftFromListing(subject);
  const cSq = livingSqftFromListing(c);
  if (sSq && cSq && sSq > 0) loss += Math.min(Math.abs(cSq - sSq) / sSq, 1.2) * 32;
  const sP = priceForListing(subject, "list") ?? subject.ListPrice ?? 0;
  const cP = typeof c.ListPrice === "number" && c.ListPrice > 0 ? c.ListPrice : 0;
  if (sP && cP) loss += Math.min(Math.abs(cP - sP) / sP, 0.85) * 28;
  const sy = subject.YearBuilt;
  const cy = c.YearBuilt;
  if (sy && cy) loss += Math.min(Math.abs(cy - sy) / 45, 1) * 14;
  const sLot = lotSqftFromListing(subject);
  const cLot = lotSqftFromListing(c);
  if (sLot && cLot && sLot > 0) loss += Math.min(Math.abs(cLot - sLot) / sLot, 1.2) * 14;
  const sb = subject.BedroomsTotal ?? 0;
  const cb = c.BedroomsTotal ?? 0;
  loss += Math.min(Math.abs(cb - sb), 4) * 2.2;
  const sbt = subject.BathroomsTotalDecimal ?? 0;
  const cbt = c.BathroomsTotalDecimal ?? 0;
  loss += Math.min(Math.abs(cbt - sbt), 3) * 2;
  return Math.max(0, Math.min(100, Math.round(100 - loss)));
}

function selectActivePeers(subject: CncListing, active: CncListing[], limit: number): CncListing[] {
  const sq = livingSqftFromListing(subject);
  const refPrice = priceForListing(subject, "list") ?? subject.ListPrice;

  let pool = active.filter(
    (l) => l.link_id !== subject.link_id && typeof l.ListPrice === "number" && l.ListPrice > 0
  );
  pool = listingsMatchingCompCriteria(subject, pool);

  const scored = pool.map((l) => {
    const lsq = livingSqftFromListing(l);
    let score = 0;
    if (sq && lsq) score += Math.abs(lsq - sq);
    const lp = l.ListPrice ?? 0;
    if (refPrice && lp) score += Math.abs(lp - refPrice) / 50_000;
    const yb = l.YearBuilt;
    const sy = subject.YearBuilt;
    if (yb && sy) score += Math.abs(yb - sy) * 3;
    return { l, score };
  });
  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    const ta = Date.parse(a.l.OnMarketDate?.trim() || "") || 0;
    const tb = Date.parse(b.l.OnMarketDate?.trim() || "") || 0;
    return tb - ta;
  });
  return scored.slice(0, limit).map((x) => x.l);
}

function latLonFromListing(l: CncListing): { lat: number; lon: number } | null {
  const r = l as Record<string, unknown>;
  const lat = r.Latitude ?? r.latitude;
  const lon = r.Longitude ?? r.longitude;
  if (typeof lat === "number" && typeof lon === "number" && Number.isFinite(lat) && Number.isFinite(lon)) {
    return { lat, lon };
  }
  return null;
}

function haversineMiles(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

function monthsSinceCloseDate(closeDateStr: string): number | null {
  const t = Date.parse(closeDateStr.trim());
  if (!Number.isFinite(t)) return null;
  const diffMs = Date.now() - t;
  if (diffMs < 0) return null;
  return diffMs / (1000 * 60 * 60 * 24 * 30.4375);
}

function medianDomSoldInTier(
  sold: CncListing[],
  tier: { min: number; max: number } | null
): number | null {
  if (!tier) return null;
  const doms = sold
    .filter((l) => {
      const p = l.ClosePrice ?? l.ListPrice;
      return typeof p === "number" && p >= tier.min && p < tier.max && l.OnMarketDate && l.CloseDate;
    })
    .map((l) => daysBetween(l.OnMarketDate!, l.CloseDate!))
    .filter((d) => d >= 0 && d < 2000);
  return median(doms);
}

function taxAssessedFromListing(l: CncListing): number | null {
  const r = l as Record<string, unknown>;
  for (const k of ["TaxAssessedValue", "TaxAssessedTotalValue", "AssessedValue"]) {
    const v = r[k];
    if (typeof v === "number" && v > 0) return v;
  }
  return null;
}

function fmtRatioX(r: number): string {
  return `${Math.round(r * 100) / 100}x`;
}

/** Mean list÷assessed or close÷assessed among rows with both fields (for benchmarks). */
function avgPriceToAssessedRatio(
  listings: CncListing[],
  priceMode: "list" | "close"
): number | null {
  const ratios: number[] = [];
  for (const l of listings) {
    const assessed = taxAssessedFromListing(l);
    const price = priceForListing(l, priceMode);
    if (assessed == null || assessed <= 0 || price == null || price <= 0) continue;
    ratios.push(price / assessed);
  }
  if (ratios.length === 0) return null;
  const avg = ratios.reduce((s, v) => s + v, 0) / ratios.length;
  return Math.round(avg * 100) / 100;
}

function buildDerivedMetrics(
  listing: NormalizedListingDetail,
  nhName: string,
  nhAvgActivePpsf: number | null,
  active: CncListing[],
  sold12: CncListing[]
): DerivedMetricRow[] {
  const rows: DerivedMetricRow[] = [];
  const subjectPpsf =
    listing.status === "Sold"
      ? listing.dollarPerSfClose ?? listing.dollarPerSfList
      : listing.dollarPerSfList;

  if (subjectPpsf != null && subjectPpsf > 0 && nhAvgActivePpsf != null && nhAvgActivePpsf > 0) {
    const belowNeighbor = subjectPpsf < nhAvgActivePpsf;
    rows.push({
      label: "$/SqFt vs Neighborhood",
      value: `$${subjectPpsf.toLocaleString()}/SqFt vs $${Math.round(nhAvgActivePpsf).toLocaleString()}/SQFt (${nhName} Active Listings)`,
      sub: "Building area from LINK when present; compare to assessor card for gross living area disputes.",
      valueTone: belowNeighbor ? "favorable" : "neutral",
    });
  } else if (subjectPpsf != null && subjectPpsf > 0) {
    rows.push({
      label: "$/SqFt vs Neighborhood",
      value: `$${subjectPpsf.toLocaleString()}/SqFt (neighborhood active average n/a in this LINK pull)`,
      sub: "Square footage or neighborhood sample too thin for a peer average.",
    });
  } else {
    rows.push({
      label: "$/SqFt vs Neighborhood",
      value: "—",
      sub: "Square footage or price missing in LINK for a reliable $/SF read.",
    });
  }

  const refPrice =
    listing.status === "Sold" && listing.closePrice != null
      ? listing.closePrice
      : listing.listPrice;
  const assessed = listing.taxAssessedValue;

  const nhActive = active.filter(
    (l) => l.MLSAreaMajor && normalizeNantucketAreaName(l.MLSAreaMajor) === nhName
  );
  const nhListToAssessedAvg = avgPriceToAssessedRatio(nhActive, "list");
  const islandSoldToAssessedAvg = avgPriceToAssessedRatio(sold12, "close");

  if (refPrice != null && refPrice > 0 && assessed != null && assessed > 0) {
    const subjectRatio = refPrice / assessed;
    const parts: string[] = [];
    if (nhListToAssessedAvg != null) {
      parts.push(
        `${fmtRatioX(subjectRatio)} vs ${fmtRatioX(nhListToAssessedAvg)} (${nhName} Active Listings)`
      );
    } else {
      parts.push(`${fmtRatioX(subjectRatio)} (listing vs assessed; neighborhood active benchmark n/a in LINK)`);
    }
    if (islandSoldToAssessedAvg != null) {
      parts.push(`${fmtRatioX(islandSoldToAssessedAvg)} Nantucket average Sale Price to Assessed Value`);
    }
    rows.push({
      label: "List vs Assessed Value",
      value: parts.join("\n"),
      sub: "Ratios use list price for neighborhood actives and sold close for island average where assessed values exist in LINK. Assessed values often lag the market.",
      valueTitle:
        "List price vs Assessed Value ratio helps flag potential negotiation room or over/under pricing relative to town records.",
    });
  } else {
    rows.push({
      label: "List vs Assessed Value",
      value: "—",
      sub: "Assessed total and/or list/close price not in this LINK row — open the town assessor card.",
    });
  }

  const taxPart =
    listing.taxAnnual != null && listing.taxAnnual > 0
      ? `${formatMoneyFull(listing.taxAnnual)} annual taxes (and HOA, if applicable)`
      : "Annual taxes not in LINK (and HOA, if applicable)";
  rows.push({
    label: "Annual Expenses",
    value: taxPart,
    sub:
      "Taxes projected based on assessor's revaluation at full asking price. Actual expenses likely to be lower. Financing costs are not modeled here.",
  });

  return rows;
}

/** Split RESO multi-value fields whether the feed sends CSV or an array. */
function feedTokens(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string" && v.trim()) {
    return v
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function joinTokens(v: unknown): string | null {
  const t = feedTokens(v);
  return t.length ? t.join(", ") : null;
}

function firstHeatingRaw(l: CncListing): unknown {
  const r = l as Record<string, unknown>;
  const keys = ["Heating", "heating", "HeatingFuel", "heating_fuel", "HeatType", "heat_type"];
  for (const k of keys) {
    const v = r[k];
    if (v == null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === "string" && !v.trim()) continue;
    return v;
  }
  return null;
}

/** RESO `Heating` (and alternates), expanded from LINK codes to display labels. */
function heatingFromListing(l: CncListing): string | null {
  return formatHeatingCodes(firstHeatingRaw(l));
}

/** LINK lists cooling under InteriorFeatures (token `AC`), not always `Cooling`. */
function coolingFromListing(l: CncListing): string | null {
  for (const p of feedTokens(l.InteriorFeatures)) {
    const compact = p.replace(/\s+/g, " ").trim();
    if (/^AC$/i.test(compact) || /^A\/C$/i.test(compact)) return "AC";
    if (/\bAC\b/i.test(compact) || /\bA\/C\b/i.test(compact)) return "AC";
  }
  return joinTokens(l.Cooling);
}

function buildPropertyFactSections(l: CncListing): PropertyFactSection[] {
  const join = (v: unknown): string | null => {
    if (v == null) return null;
    if (Array.isArray(v)) return v.filter(Boolean).join(", ") || null;
    if (typeof v === "string" && v.trim()) return v.trim();
    return null;
  };

  const interiorParts = getInteriorFeaturesDisplayParts(l);
  const lotSq = lotSqftFromListing(l);

  return [
    {
      title: "Structure",
      rows: [
        {
          label: "Property type",
          value: formatListingTypeDisplay(listingTypOrPropertyType(l)) ?? join(l.PropertyType) ?? "—",
        },
        {
          label: "Lot size",
          value:
            lotSq != null ? `${lotSq.toLocaleString()} sq ft (LINK / lot fields when present)` : "—",
        },
        { label: "Foundation", value: join(l.FoundationDetails) ?? "—" },
        { label: "Year built", value: l.YearBuilt != null ? String(l.YearBuilt) : "—" },
        { label: "Parking", value: join(l.ParkingFeatures) ?? "—" },
        { label: "Views (LINK)", value: formatViewCodes(l.View) ?? "—" },
        { label: "Private pool", value: join(l.PoolFeatures) ?? "—" },
      ],
    },
    {
      title: "Systems & utilities",
      rows: [
        { label: "Water", value: join(l.WaterSource) ?? "—" },
        { label: "Sewer / septic", value: formatSewerCodes(l.Sewer) ?? "—" },
      ],
    },
    {
      title: "Interior",
      rows: [
        { label: "Flooring", value: joinTokens(l.Flooring) ?? "—" },
        { label: "Appliances", value: join(l.Appliances) ?? "—" },
        { label: "Heating", value: heatingFromListing(l) ?? "—" },
        { label: "Cooling", value: coolingFromListing(l) ?? "—" },
      ],
    },
    ...(interiorParts.otherFeatures
      ? [
          {
            title: "Other features",
            rows: [
              {
                label: "InteriorFeatures (LINK)",
                value: interiorParts.otherFeatures,
              },
            ],
          },
        ]
      : []),
    {
      title: "Narrative",
      rows: [
        {
          label: "Interior features (LINK)",
          value: interiorParts.interior ?? "—",
          multiline: true,
        },
        {
          label: "LINK description",
          value:
            typeof l.LINK_descr === "string" && l.LINK_descr.trim()
              ? l.LINK_descr.replace(/\s+/g, " ").trim()
              : "—",
        },
      ],
    },
    {
      title: "Finances",
      rows: [
        {
          label: "Assessed value & tax bills",
          value:
            "Last assessed value and exact tax bills belong on the town assessor card (use Town assessor above). Tax rates vary by district and year—confirm with the Assessor before underwriting.",
          multiline: true,
        },
        {
          label: "Annual tax (LINK)",
          value:
            typeof l.TaxAnnualAmount === "number" && l.TaxAnnualAmount > 0
              ? `${formatMoneyFull(l.TaxAnnualAmount)}${l.TaxYear ? ` (tax year ${l.TaxYear})` : ""}`
              : "—",
        },
        {
          label: "Nantucket Islands Land Bank transfer fee",
          value: "2% of purchase price",
        },
        {
          label: "Nantucket Land & Water Council fee",
          value:
            "Watershed / conservation-related charges may apply by location — confirm with the town and your closing attorney.",
        },
        {
          label: "Zoning / lot coverage",
          value:
            "District rules and remaining envelope are not in this LINK row — confirm on the assessor parcel card and zoning map.",
          href: "/tools/zoning-lookup",
          hrefLabel: "Zoning lookup",
        },
      ],
    },
  ];
}

function buildNhPpsfPercentileNote(
  listing: NormalizedListingDetail,
  nh: ReturnType<typeof sliceNeighborhood>,
  nhName: string
): string | null {
  const cohort =
    listing.status === "Sold"
      ? nh.soldPpsf.filter((x) => x > 0)
      : nh.activePpsf.filter((x) => x > 0);
  const v =
    listing.status === "Sold"
      ? listing.dollarPerSfClose ?? listing.dollarPerSfList
      : listing.dollarPerSfList;
  if (cohort.length < 5 || v == null || v <= 0) return null;
  const sorted = [...cohort].sort((a, b) => a - b);
  const below = sorted.filter((x) => x < v).length;
  const beatPct = Math.round((below / sorted.length) * 100);
  const bucket = listing.status === "Sold" ? "sold" : "active";
  const modeShort = listing.status === "Sold" ? "sold (12 mo)" : "active";
  return `At $${v.toLocaleString()}/SF (${modeShort}, LINK), this property ranks higher than ${beatPct}% of ${nhName} ${bucket} comparables with reported $/SF (n=${sorted.length}).`;
}

function buildValueContextTakeaway(
  nhName: string,
  nhActiveAvg: number | null,
  islandActiveAvg: number | null,
  nhLotMed: number | null,
  islandLotMed: number | null,
  dataAsOfDateLabel: string
): string | null {
  if (nhActiveAvg == null || islandActiveAvg == null || islandActiveAvg <= 0) return null;
  const pct = Math.round(((nhActiveAvg - islandActiveAvg) / islandActiveAvg) * 1000) / 10;
  const abs = Math.abs(pct);
  const lower = pct < 0;
  const lotFrag =
    nhLotMed != null && islandLotMed != null && islandLotMed > 0
      ? ` ${nhName} also shows larger typical lots in active LINK stock (median lot ~${nhLotMed.toLocaleString()} SF vs ~${islandLotMed.toLocaleString()} island-wide).`
      : "";
  return `${nhName} is at ~${abs}% ${lower ? "lower" : "higher"} active $/SF than the island average in this pull, while neighborhood amenities and micro-location still need field verification.${lotFrag} Value pattern as of ${dataAsOfDateLabel}.`;
}

function buildMarketPulseBullets(island: IslandBenchmarks): string[] {
  const bullets: string[] = [];
  bullets.push(
    `Island active inventory: ${island.activeCount} listings (context only—supply shifts seasonally).`
  );
  if (island.medianListPrice != null && island.medianClosePrice12mo != null) {
    bullets.push(
      `Median asking price (active): ${formatMoneyFull(island.medianListPrice)} | Median sold (12 mo): ${formatMoneyFull(island.medianClosePrice12mo)} (reflects a mix of price tiers).`
    );
  } else if (island.medianListPrice != null) {
    bullets.push(`Median asking price (active): ${formatMoneyFull(island.medianListPrice)}.`);
  }
  bullets.push(
    "New construction and soft costs remain elevated—1980s–2000s turnkey homes in family-oriented pockets often benchmark favorably on $/SF vs new builds; verify mechanicals, envelope, and flood/zoning in diligence."
  );
  return bullets;
}

function buildExpertCopy(
  listing: NormalizedListingDetail,
  island: IslandBenchmarks,
  nhName: string,
  nhActiveInArea: number,
  thisPpsf: number | null,
  dataAsOfDateLabel: string
): string {
  const medAsk = island.medianListPrice;
  const medAskTxt = medAsk ? formatMoneyFull(medAsk) : "the mid-single-digit millions";
  const invLead =
    nhActiveInArea > 0 && nhName !== "Island"
      ? `With limited ${nhName} inventory and island median asking prices near ${medAskTxt}, `
      : `With island median asking prices near ${medAskTxt} (${island.activeCount} active in this LINK pull), `;
  const subjectPhrase =
    listing.yearBuilt != null ? `this ${listing.yearBuilt}-built home` : "this home";
  const core =
    thisPpsf != null
      ? `${subjectPhrase} at $${thisPpsf.toLocaleString()}/SF sits competitively against recent sold comps in the neighborhood.`
      : `${subjectPhrase} should be read against recent sold comps in the neighborhood until $/SF is clear in LINK.`;
  return `${invLead}${core} Setting and square footage can offer strong appeal for four-season use, but as with all Nantucket properties, buyers should verify mechanicals, envelope condition, flood details, and zoning during diligence. Data as of ${dataAsOfDateLabel} – not investment advice.`;
}

export async function getListingDetailPayload(linkIdStr: string): Promise<ListingDetailPayload | null> {
  const linkId = parseInt(linkIdStr, 10);
  if (!Number.isFinite(linkId) || linkId <= 0) return null;

  const active = await fetchAllListings({ status: "A" });
  const sold12 = await fetchAllListings({ status: "S", close_date: 365 });

  const raw =
    active.find((l) => l.link_id === linkId) ??
    sold12.find((l) => l.link_id === linkId) ??
    (await findListingByLinkId(linkId));

  if (!raw || raw.link_id == null) return null;

  const island = computeIslandBenchmarks(active, sold12);
  const nhName = raw.MLSAreaMajor
    ? normalizeNantucketAreaName(raw.MLSAreaMajor)
    : "Island";
  const nh = sliceNeighborhood(nhName, active, sold12);

  const nhAvgActivePpsf = average(nh.activePpsf);
  const nhAvgSoldPpsf = average(nh.soldPpsf);
  const nhMedianYearBuilt = median(nh.yearBuilt);
  const nhMedianAge =
    nhMedianYearBuilt != null ? new Date().getFullYear() - nhMedianYearBuilt : null;

  const tier = yearTierFromPrice(
    priceForListing(raw, statusLabel(raw) === "Sold" ? "close" : "list")
  );
  const tierStats = tierYearStats(sold12, tier);

  const status = statusLabel(raw);
  const listPrice = priceForListing(raw, "list");
  const closePrice =
    typeof raw.ClosePrice === "number" && raw.ClosePrice > 0 ? raw.ClosePrice : null;

  const livingSqft = livingSqftFromListing(raw);
  const lotSqft = lotSqftFromListing(raw);

  const photos = (raw.link_images ?? [])
    .map((im) => im.url || im.small_url)
    .filter((u): u is string => Boolean(u));

  const listing: NormalizedListingDetail = {
    linkId: String(raw.link_id),
    addressLine: formatAddress(raw),
    neighborhood: nhName,
    listPrice,
    closePrice,
    closeDate: raw.CloseDate ?? null,
    bedrooms: raw.BedroomsTotal ?? null,
    bathrooms: raw.BathroomsTotalDecimal ?? null,
    livingSqft,
    lotSqft,
    yearBuilt: raw.YearBuilt ?? null,
    dollarPerSfList: dollarPerSf(raw, "list"),
    dollarPerSfClose: dollarPerSf(raw, "close"),
    status,
    mlsRawStatus: raw.MlsStatus || raw.StandardStatus || "—",
    dom: listingDomDays(raw),
    photos,
    propertyType: formatListingTypeDisplay(listingTypOrPropertyType(raw)) ?? raw.PropertyType ?? null,
    views: feedTokens((raw as Record<string, unknown>).View),
    taxAnnual: typeof raw.TaxAnnualAmount === "number" ? raw.TaxAnnualAmount : null,
    taxYear: typeof raw.TaxYear === "number" ? raw.TaxYear : null,
    taxAssessedValue: taxAssessedFromListing(raw),
  };

  const tierMedianDomSold = medianDomSoldInTier(sold12, tier);
  const subjectLoc = latLonFromListing(raw);

  const compListings = selectComps(raw, sold12, 8);
  const subjectPpsf =
    status === "Sold"
      ? listing.dollarPerSfClose ?? listing.dollarPerSfList
      : listing.dollarPerSfList;

  const comps: CompRow[] = compListings.map((c) => {
    const ppsf = dollarPerSf(c, "close");
    const closePx =
      typeof c.ClosePrice === "number" && c.ClosePrice > 0 ? c.ClosePrice : 0;
    let deltaNote = "—";
    if (subjectPpsf != null && ppsf != null && subjectPpsf > 0) {
      const d = Math.round(((ppsf - subjectPpsf) / subjectPpsf) * 1000) / 10;
      const dir = d >= 0 ? "above" : "below";
      deltaNote = `${d >= 0 ? "+" : ""}${d}% $ / SF ${dir} this listing`;
    }
    const closeD = c.CloseDate || "";
    const peerLoc = latLonFromListing(c);
    const distanceMiles =
      subjectLoc && peerLoc ? Math.round(haversineMiles(subjectLoc, peerLoc) * 10) / 10 : null;
    const monthsSinceClose =
      closeD && closeD !== "—" ? monthsSinceCloseDate(closeD) : null;
    return {
      linkId: String(c.link_id ?? ""),
      address: formatAddress(c),
      neighborhood: c.MLSAreaMajor ? normalizeNantucketAreaName(c.MLSAreaMajor) : "—",
      closeDate: closeD || "—",
      closePrice: closePx,
      ppsf,
      yearBuilt: c.YearBuilt ?? null,
      beds: c.BedroomsTotal ?? null,
      baths: c.BathroomsTotalDecimal ?? null,
      livingSqft: livingSqftFromListing(c),
      lotSqft: lotSqftFromListing(c),
      similarityScore: compSimilarityScore(raw, c),
      deltaNote,
      monthsSinceClose,
      distanceMiles,
    };
  });

  const activePeerListings = selectActivePeers(raw, active, 8);
  const subjectListPpsf = listing.dollarPerSfList;
  const activePeerComps: ActivePeerRow[] = activePeerListings.map((c) => {
    const ppsf = dollarPerSf(c, "list");
    let deltaNote = "—";
    if (subjectListPpsf != null && ppsf != null && subjectListPpsf > 0) {
      const d = Math.round(((ppsf - subjectListPpsf) / subjectListPpsf) * 1000) / 10;
      const dir = d >= 0 ? "above" : "below";
      deltaNote = `${d >= 0 ? "+" : ""}${d}% $ / SF ${dir} subject (list)`;
    }
    return {
      linkId: String(c.link_id ?? ""),
      address: formatAddress(c),
      neighborhood: c.MLSAreaMajor ? normalizeNantucketAreaName(c.MLSAreaMajor) : "—",
      onMarketDate: c.OnMarketDate ?? null,
      listPrice: typeof c.ListPrice === "number" && c.ListPrice > 0 ? c.ListPrice : 0,
      ppsf,
      dom: listingDomDays(c),
      yearBuilt: c.YearBuilt ?? null,
      beds: c.BedroomsTotal ?? null,
      baths: c.BathroomsTotalDecimal ?? null,
      livingSqft: livingSqftFromListing(c),
      similarityScore: activePeerSimilarityScore(raw, c),
      deltaNote,
    };
  });

  const asOf = new Date();
  const dataAsOfDateLabel = asOf.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const dataTooltip = `Data from ${island.activeCount} active listings and ${island.sold12moCount} sold closings in the past 12 months island-wide (${dataAsOfDateLabel}). Square footage and taxes follow LINK / public fields when present.`;

  const assessorSearchUrl = "https://www.nantucket-ma.gov/182/Assessor";
  const linkMlsDetailUrl = `https://nantucket.mylinkmls.com/PropertyListing.aspx?listingId=${encodeURIComponent(String(raw.link_id))}`;

  const propertyFactSections = buildPropertyFactSections(raw);
  const derivedMetrics = buildDerivedMetrics(listing, nhName, nhAvgActivePpsf, active, sold12);

  const islandContextRows = [
    {
      label: "Active listings (LINK, this pull)",
      value: String(island.activeCount),
    },
    {
      label: "Median list price (active)",
      value: island.medianListPrice != null ? formatMoneyFull(island.medianListPrice) : "—",
    },
    {
      label: "Median close price (sold, 12 mo)",
      value: island.medianClosePrice12mo != null ? formatMoneyFull(island.medianClosePrice12mo) : "—",
    },
    {
      label: "Median DOM — sold, island (12 mo)",
      value: island.medianDomSold12 != null ? `${island.medianDomSold12} days` : "—",
    },
    {
      label: "Median DOM — sold, this price tier (12 mo)",
      value: tierMedianDomSold != null ? `${tierMedianDomSold} days` : "—",
    },
    {
      label: "This listing — days on market",
      value: listing.dom != null ? `${listing.dom} days` : "—",
    },
    {
      label: "Nantucket Islands Land Bank transfer fee",
      value: "2% of purchase price",
    },
    {
      label: "Nantucket Land & Water Council fee",
      value: "Watershed / conservation-related charges may apply by location — confirm with the town and your closing attorney.",
    },
  ];

  const nhActiveInArea =
    raw.MLSAreaMajor?.trim() && nhName !== "Island"
      ? active.filter(
          (l) =>
            l.MLSAreaMajor && normalizeNantucketAreaName(l.MLSAreaMajor) === nhName
        ).length
      : 0;

  const nhLotMed = median(nh.lotSqft);
  const islandLotMed = island.medianLotSqftActive;

  const expertParagraph = buildExpertCopy(
    listing,
    island,
    nhName,
    nhActiveInArea,
    subjectPpsf,
    dataAsOfDateLabel
  );
  const lastUpdatedAtLabel = asOf.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });

  const marketPulseBullets = buildMarketPulseBullets(island);
  const valueContextTakeaway = buildValueContextTakeaway(
    nhName,
    nhAvgActivePpsf,
    island.avgActivePpsf,
    nhLotMed,
    islandLotMed,
    dataAsOfDateLabel
  );
  const nhPpsfPercentileNote = buildNhPpsfPercentileNote(listing, nh, nhName);

  const { legend: zoningUseLegend, chartSource: zoningUseChartSource } = zoningUseChartLegendAndSource();
  let listingAllowableUses: ListingAllowableUsesModule = { matched: false };
  try {
    const assessorParcelMatch = await matchAssessorParcelByListingAddress(listing.addressLine);
    if (assessorParcelMatch) {
      listingAllowableUses = {
        matched: true,
        zoningCode: assessorParcelMatch.zoningCode,
        districtName: getDistrictRule(assessorParcelMatch.zoningCode)?.name ?? null,
        zoningLookupPath:
          assessorParcelMatch.taxMap.trim() && assessorParcelMatch.parcel.trim()
            ? `/tools/zoning-lookup/${encodeURIComponent(assessorParcelMatch.taxMap.trim())}/${encodeURIComponent(assessorParcelMatch.parcel.trim())}`
            : null,
        rows: buildZoningUseRowsForDistrict(assessorParcelMatch.zoningCode),
        legend: zoningUseLegend,
        chartSource: zoningUseChartSource,
      };
    }
  } catch (e) {
    console.error("listing allowable uses / parcel match:", e instanceof Error ? e.message : e);
  }

  const listingValueScore = computeIslandValueScoreSnapshot(
    listing.status === "Sold"
      ? listing.dollarPerSfClose ?? listing.dollarPerSfList
      : listing.dollarPerSfList,
    island.avgSoldPpsf,
    island.avgActivePpsf,
  );

  const compSet = buildCompSetDefinition(raw);

  return {
    listing,
    dataAsOfDateLabel,
    dataTooltip,
    island,
    neighborhood: nh,
    nhAvgActivePpsf,
    nhAvgSoldPpsf,
    nhMedianYearBuilt,
    nhMedianAge,
    tierYearBuiltRange: tierStats.yearRange,
    tierMedianAgeRange: tierStats.ageRange,
    tierMedianDomSold,
    comps,
    activePeerComps,
    expertParagraph,
    islandContextRows,
    propertyFactSections,
    derivedMetrics,
    assessorSearchUrl,
    linkMlsDetailUrl,
    lastUpdatedAtLabel,
    marketPulseBullets,
    valueContextTakeaway,
    nhPpsfPercentileNote,
    listingAllowableUses,
    listingValueScore,
    compSet,
  };
}

export { neighborhoodBenchmarkBlurb };
