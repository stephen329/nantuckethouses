import type { CncListing } from "@/lib/cnc-api";
import { daysBetween, median, average } from "@/lib/cnc-api";
import { normalizeNantucketAreaName } from "@/lib/nantucket-area-normalize";

export function lotSqftFromListing(l: CncListing): number | null {
  const ext = l as CncListing & {
    lot_size_square_feet?: number;
    Lot_Size_Square_Feet?: number;
  };
  const raw =
    l.LotSizeSquareFeet ?? ext.lot_size_square_feet ?? ext.Lot_Size_Square_Feet;
  const sq = typeof raw === "number" && raw > 0 ? raw : null;
  if (sq) return Math.round(sq);
  const acres = l.LotSizeAcres;
  if (typeof acres === "number" && acres > 0) return Math.round(acres * 43560);
  return null;
}

export function livingSqftFromListing(l: CncListing): number | null {
  const bat = l.BuildingAreaTotal;
  if (typeof bat === "number" && bat > 0) return Math.round(bat);
  const la = l.LivingArea;
  return typeof la === "number" && la > 0 ? Math.round(la) : null;
}

export function priceForListing(l: CncListing, mode: "list" | "close"): number | null {
  if (mode === "close") {
    const c = l.ClosePrice;
    if (typeof c === "number" && c > 0) return c;
  }
  const p = l.ListPrice;
  return typeof p === "number" && p > 0 ? p : null;
}

export function dollarPerSf(
  l: CncListing,
  mode: "list" | "close"
): number | null {
  const price = priceForListing(l, mode);
  const sq = livingSqftFromListing(l);
  if (!price || !sq) return null;
  return Math.round(price / sq);
}

export function listingDomDays(l: CncListing): number | null {
  const status = (l.MlsStatus || "").toUpperCase();
  if (status === "S" && l.OnMarketDate && l.CloseDate) {
    const d = daysBetween(l.OnMarketDate, l.CloseDate);
    return d >= 0 && d < 2000 ? d : null;
  }
  if (l.OnMarketDate) {
    const d = daysBetween(l.OnMarketDate, new Date().toISOString());
    return d >= 0 ? d : null;
  }
  return null;
}

export function formatMoney(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return m >= 10 ? `$${m.toFixed(1)}M` : `$${m.toFixed(2)}M`;
  }
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n.toLocaleString("en-US")}`;
}

export function formatMoneyFull(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export type IslandBenchmarks = {
  activeCount: number;
  sold12moCount: number;
  medianListPrice: number | null;
  medianClosePrice12mo: number | null;
  islandActivePpsfValues: number[];
  islandSoldPpsfValues: number[];
  medianActivePpsf: number | null;
  avgActivePpsf: number | null;
  medianSoldPpsf: number | null;
  avgSoldPpsf: number | null;
  medianDomActive: number | null;
  medianDomSold12: number | null;
  medianYearBuiltActive: number | null;
  medianAgeActive: number | null;
  medianLotSqftActive: number | null;
};

export function computeIslandBenchmarks(
  active: CncListing[],
  sold12: CncListing[]
): IslandBenchmarks {
  const listPrices = active.map((l) => l.ListPrice).filter((p): p is number => p > 0);
  const closePrices = sold12
    .map((l) => l.ClosePrice ?? l.ListPrice)
    .filter((p): p is number => p > 0);

  const islandActivePpsfValues = active
    .map((l) => dollarPerSf(l, "list"))
    .filter((v): v is number => v != null && v > 0) as number[];
  const islandSoldPpsfValues = sold12
    .map((l) => dollarPerSf(l, "close"))
    .filter((v): v is number => v != null && v > 0) as number[];

  const domActive = active
    .filter((l) => l.OnMarketDate)
    .map((l) => daysBetween(l.OnMarketDate!, new Date().toISOString()))
    .filter((d) => d >= 0 && d < 2000);
  const domSold = sold12
    .filter((l) => l.OnMarketDate && l.CloseDate)
    .map((l) => daysBetween(l.OnMarketDate!, l.CloseDate!))
    .filter((d) => d >= 0 && d < 2000);

  const years = active
    .map((l) => l.YearBuilt)
    .filter((y): y is number => typeof y === "number" && y > 1600 && y <= new Date().getFullYear());
  const ages = years.map((y) => new Date().getFullYear() - y);

  const lots = active.map(lotSqftFromListing).filter((v): v is number => v != null && v > 0) as number[];

  return {
    activeCount: active.length,
    sold12moCount: sold12.length,
    medianListPrice: median(listPrices),
    medianClosePrice12mo: median(closePrices),
    islandActivePpsfValues,
    islandSoldPpsfValues,
    medianActivePpsf: median(islandActivePpsfValues),
    avgActivePpsf: average(islandActivePpsfValues),
    medianSoldPpsf: median(islandSoldPpsfValues),
    avgSoldPpsf: average(islandSoldPpsfValues),
    medianDomActive: median(domActive),
    medianDomSold12: median(domSold),
    medianYearBuiltActive: median(years),
    medianAgeActive: median(ages),
    medianLotSqftActive: median(lots),
  };
}

export type NeighborhoodSlice = {
  name: string;
  activePpsf: number[];
  soldPpsf: number[];
  yearBuilt: number[];
  lotSqft: number[];
  domSold: number[];
};

export function sliceNeighborhood(
  name: string,
  active: CncListing[],
  sold12: CncListing[]
): NeighborhoodSlice {
  const norm = normalizeNantucketAreaName(name);
  const match = (l: CncListing) =>
    l.MLSAreaMajor && normalizeNantucketAreaName(l.MLSAreaMajor) === norm;

  const na = active.filter(match);
  const ns = sold12.filter(match);

  const activePpsf = na.map((l) => dollarPerSf(l, "list")).filter((v): v is number => v != null) as number[];
  const soldPpsf = ns.map((l) => dollarPerSf(l, "close")).filter((v): v is number => v != null) as number[];
  const yearBuilt = na
    .map((l) => l.YearBuilt)
    .filter((y): y is number => typeof y === "number" && y > 1600) as number[];
  const lotSqft = na.map(lotSqftFromListing).filter((v): v is number => v != null) as number[];
  const domSold = ns
    .filter((l) => l.OnMarketDate && l.CloseDate)
    .map((l) => daysBetween(l.OnMarketDate!, l.CloseDate!))
    .filter((d) => d >= 0 && d < 2000);

  return { name: norm, activePpsf, soldPpsf, yearBuilt, lotSqft, domSold };
}
