"use client";

import { useCallback, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { Settings2 } from "lucide-react";
import Link from "next/link";
import type { PropertyV3Payload } from "@/lib/property-v3-data";
import {
  type CompFilterState,
  type GeoMode,
  type SizeCompareMode,
  computeProjectionFromIntel,
  defaultCompFilterState,
  filterActiveIntel,
  filterParcelIntel,
  filterSoldIntel,
  medianActivePpsfFromIntel,
  medianCloseToAssessedFromIntel,
  medianGlaSoldFromIntel,
  medianSoldListPriceFromIntel,
  medianSoldPpsfFromIntel,
  percentileInSorted,
} from "@/lib/property-v3-market-intel";
import { zoningLookupToolPath } from "@/lib/property-routes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/components/ui/utils";

function medianNums(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function daysAgoCutoff(days: number): number {
  return Date.now() - days * 86400000;
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-[var(--nantucket-gray)]">
        <span>{label}</span>
        <span className="tabular-nums text-[var(--atlantic-navy)]">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#e8edf4]">
        <div
          className="h-full rounded-full bg-[var(--privet-green)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

type Props = { data: PropertyV3Payload };

const FILTER_SECTION_IDS = {
  geography: "pv3-filter-geography",
  sold: "pv3-filter-sold-window",
  size: "pv3-filter-size",
  attrs: "pv3-filter-listing-attrs",
} as const;

const GLA_CHIP_PCTS = [10, 20, 30, 40] as const;
const LOT_CHIP_PCTS = [10, 20, 30] as const;
const SOLD_CHIP_MONTHS = [6, 12, 18, 24] as const;

function nearestIn<const T extends readonly number[]>(value: number, presets: T): T[number] {
  return presets.reduce((best, p) => (Math.abs(p - value) < Math.abs(best - value) ? p : best), presets[0]!);
}

function geoLabel(mode: GeoMode, data: PropertyV3Payload): string {
  if (mode === "mls") {
    return data.mlsAreaPrimary
      ? `MLS area: ${data.mlsAreaPrimary}`
      : "MLS area (no primary MLS area on file — cohort may be empty)";
  }
  return data.subjectZoningLabel
    ? `Zoning district: ${data.subjectZoningLabel}`
    : "Zoning district (no zoning on assessor parcel — use MLS area)";
}

function FilterSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="border-b border-[#e4eaf2] pb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--atlantic-navy)]">
      {children}
    </h3>
  );
}

function subjectLotSqftFromParcel(d: PropertyV3Payload): number | null {
  const ls = d.parcel.lotSqft;
  if (typeof ls === "number" && ls > 0) return ls;
  const ac = d.parcel.acreage;
  if (typeof ac === "number" && ac > 0) return Math.round(ac * 43_560);
  return null;
}

function sortedPositive(nums: (number | null | undefined)[]): number[] {
  return nums.filter((x): x is number => x != null && x > 0).sort((a, b) => a - b);
}

function domSoldDays(onMarket: string | null | undefined, close: string | null | undefined): number | null {
  if (!onMarket || !close) return null;
  const a = new Date(onMarket).getTime();
  const b = new Date(close).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const d = Math.round((b - a) / 86_400_000);
  return d >= 0 ? d : null;
}

function domActiveDays(onMarket: string | null | undefined): number | null {
  if (!onMarket) return null;
  const t = new Date(onMarket).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / 86_400_000));
}

function fmtPpsf(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `$${Math.round(n).toLocaleString()}/SF`;
}

type ComparisonTone = "good" | "bad" | "neutral" | "na";

function toneClass(tone: ComparisonTone): string {
  switch (tone) {
    case "good":
      return "border-emerald-200/90 bg-emerald-50/90 text-emerald-950 hover:bg-emerald-50";
    case "bad":
      return "border-rose-200/90 bg-rose-50/90 text-rose-950 hover:bg-rose-50";
    case "na":
      return "border-[#eef2f7] bg-[#f9fafb] text-[var(--nantucket-gray)] hover:bg-[#f4f6f8]";
    default:
      return "border-[#e0e6ef] bg-white text-[var(--atlantic-navy)] hover:bg-[#fafbfd]";
  }
}

/** Lower $/SF vs cohort median → good (better value). */
function ppsfTone(subject: number | null, median: number | null): ComparisonTone {
  if (median == null || median <= 0) return "na";
  if (subject == null || !Number.isFinite(subject)) return "neutral";
  if (subject < median * 0.97) return "good";
  if (subject > median * 1.03) return "bad";
  return "neutral";
}

/** Lower sale/assessed vs cohort median → good. */
function saleToAssessedTone(subject: number | null, cohortMedian: number | null): ComparisonTone {
  if (cohortMedian == null || cohortMedian <= 0) return "na";
  if (subject == null || !Number.isFinite(subject)) return "neutral";
  if (subject < cohortMedian * 0.97) return "good";
  if (subject > cohortMedian * 1.03) return "bad";
  return "neutral";
}

/** Sold DOM: shorter vs cohort median → good (faster sale). */
function domSoldTone(subject: number | null, cohortMedian: number | null): ComparisonTone {
  if (cohortMedian == null) return "na";
  if (subject == null) return "neutral";
  if (subject < cohortMedian * 0.85) return "good";
  if (subject > cohortMedian * 1.2) return "bad";
  return "neutral";
}

function ComparisonGridCell({
  tone,
  tab,
  onJump,
  children,
}: {
  tone: ComparisonTone;
  tab: "active" | "sold" | "parcels";
  onJump: (t: "active" | "sold" | "parcels") => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onJump(tab)}
      className={cn(
        "w-full min-h-[4.25rem] rounded-lg border px-2.5 py-2 text-left text-[11px] leading-snug shadow-sm transition-colors sm:min-h-[4.75rem] sm:px-3 sm:py-2.5 sm:text-[13px]",
        toneClass(tone)
      )}
    >
      {children}
    </button>
  );
}

/** Subject column: same footprint as cohort cells but not tied to a depth tab. */
function ComparisonGridSubjectCell({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "w-full min-h-[4.25rem] rounded-lg border border-[var(--atlantic-navy)]/20 bg-[#f2f8fb] px-2.5 py-2 text-left text-[11px] leading-snug shadow-sm sm:min-h-[4.75rem] sm:px-3 sm:py-2.5 sm:text-[13px] text-[var(--atlantic-navy)]"
      )}
    >
      {children}
    </div>
  );
}

function SelectChip({
  selected,
  disabled,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-0 flex-col justify-center rounded-md border px-2.5 py-1.5 text-left text-[11px] font-semibold leading-snug transition-colors sm:px-3 sm:py-1.5 sm:text-xs",
        selected && !disabled
          ? "border-[var(--atlantic-navy)] bg-[#e8f4fb] text-[var(--atlantic-navy)] shadow-sm ring-1 ring-[var(--atlantic-navy)]/15"
          : "border-[#dce4ed] bg-white text-[var(--atlantic-navy)] hover:border-[#b8cad8] hover:bg-[#fafcfd]",
        disabled && "cursor-not-allowed border-[#eceff3] bg-[#f4f5f7] text-[var(--nantucket-gray)] opacity-60 hover:bg-[#f4f5f7]",
        className
      )}
    >
      {children}
    </button>
  );
}

export function PropertyV3View({ data }: Props) {
  const [soldMonths, setSoldMonths] = useState(12);
  const [tab, setTab] = useState<"active" | "sold" | "parcels">("sold");
  const [geoMode, setGeoMode] = useState<GeoMode>("mls");
  const [moreListingFiltersOpen, setMoreListingFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<CompFilterState>(() => defaultCompFilterState());

  useLayoutEffect(() => {
    setFilters((f) => {
      if (f.sizeCompareMode === "gla" && !(GLA_CHIP_PCTS as readonly number[]).includes(f.glaTolerancePct)) {
        return { ...f, glaTolerancePct: nearestIn(f.glaTolerancePct, GLA_CHIP_PCTS) };
      }
      if (f.sizeCompareMode === "land" && !(LOT_CHIP_PCTS as readonly number[]).includes(f.landTolerancePct)) {
        return { ...f, landTolerancePct: nearestIn(f.landTolerancePct, LOT_CHIP_PCTS) };
      }
      return f;
    });
    setSoldMonths((m) =>
      (SOLD_CHIP_MONTHS as readonly number[]).includes(m) ? m : nearestIn(m, SOLD_CHIP_MONTHS)
    );
    // One-time snap to allowed presets only.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const effectiveGeoMode = useMemo((): GeoMode => {
    if (geoMode === "zoning" && !data.subjectZoningKey) return "mls";
    return geoMode;
  }, [geoMode, data.subjectZoningKey]);

  const excludeLinkIds = useMemo(() => {
    const s = new Set<number>();
    if (data.currentActive?.linkId != null) s.add(data.currentActive.linkId);
    return s;
  }, [data.currentActive?.linkId]);

  const subjectGla = data.rankings.subjectGla;
  const subjectAssessed = data.rankings.subjectAssessed;
  const subjectLotSqft = useMemo(() => {
    const mls = data.rankings.subjectLotSqft;
    if (mls != null && mls > 0) return mls;
    return subjectLotSqftFromParcel(data);
  }, [data]);

  const filteredSold = useMemo(
    () =>
      filterSoldIntel(
        data.intelSold,
        effectiveGeoMode,
        data.subjectZoningKey,
        subjectGla,
        subjectLotSqft,
        filters,
        excludeLinkIds,
        data.mlsAreaPrimary
      ),
    [
      data.intelSold,
      data.subjectZoningKey,
      data.mlsAreaPrimary,
      effectiveGeoMode,
      subjectGla,
      subjectLotSqft,
      filters,
      excludeLinkIds,
    ]
  );

  const filteredActive = useMemo(
    () =>
      filterActiveIntel(
        data.intelActive,
        effectiveGeoMode,
        data.subjectZoningKey,
        subjectGla,
        subjectLotSqft,
        filters,
        excludeLinkIds,
        data.mlsAreaPrimary
      ),
    [
      data.intelActive,
      data.subjectZoningKey,
      data.mlsAreaPrimary,
      effectiveGeoMode,
      subjectGla,
      subjectLotSqft,
      filters,
      excludeLinkIds,
    ]
  );

  const filteredParcels = useMemo(() => {
    let rows = filterParcelIntel(data.parcelIntel, effectiveGeoMode, data.subjectZoningKey, data.parcel.parcelId);
    if (filters.sizeCompareMode !== "land") return rows;
    const sub = subjectLotSqft;
    if (sub == null || sub <= 0) return rows;
    const tol = Math.max(1, filters.landTolerancePct) / 100;
    rows = rows.filter((p) => {
      const v =
        p.lotSqft != null && p.lotSqft > 0
          ? p.lotSqft
          : p.acreage != null && p.acreage > 0
            ? Math.round(p.acreage * 43_560)
            : null;
      if (v == null || v <= 0) return false;
      const r = v / sub;
      return r >= 1 - tol && r <= 1 + tol;
    });
    return rows;
  }, [data.parcelIntel, data.parcel.parcelId, data.subjectZoningKey, effectiveGeoMode, filters, subjectLotSqft]);

  /** Assessor parcels outside the MLS map bbox (non-MLS map cohort); same zoning / lot band as MLS cohort when applicable. */
  const filteredNonMlsParcels = useMemo(() => {
    let rows = data.parcelIntel.filter((p) => p.parcelId !== data.parcel.parcelId && !p.inMlsBbox);
    if (effectiveGeoMode === "zoning") {
      if (!data.subjectZoningKey) return [];
      rows = rows.filter((p) => p.zoningKey != null && p.zoningKey === data.subjectZoningKey);
    }
    if (filters.sizeCompareMode !== "land") return rows;
    const sub = subjectLotSqft;
    if (sub == null || sub <= 0) return rows;
    const tol = Math.max(1, filters.landTolerancePct) / 100;
    rows = rows.filter((p) => {
      const v =
        p.lotSqft != null && p.lotSqft > 0
          ? p.lotSqft
          : p.acreage != null && p.acreage > 0
            ? Math.round(p.acreage * 43_560)
            : null;
      if (v == null || v <= 0) return false;
      const r = v / sub;
      return r >= 1 - tol && r <= 1 + tol;
    });
    return rows;
  }, [data.parcelIntel, data.parcel.parcelId, data.subjectZoningKey, effectiveGeoMode, filters, subjectLotSqft]);

  const soldWindowRows = useMemo(() => {
    const t0 = daysAgoCutoff(soldMonths);
    return filteredSold.filter((r) => {
      if (!r.closeDate) return false;
      const t = new Date(r.closeDate).getTime();
      return Number.isFinite(t) && t >= t0;
    });
  }, [filteredSold, soldMonths]);

  const clientMedianSoldPpsf = useMemo(() => medianSoldPpsfFromIntel(soldWindowRows), [soldWindowRows]);
  const clientMedianSoldGla = useMemo(() => medianGlaSoldFromIntel(soldWindowRows), [soldWindowRows]);
  const clientMedianActivePpsf = useMemo(() => medianActivePpsfFromIntel(filteredActive), [filteredActive]);

  const subjectListPriceForGrid = useMemo(() => {
    if (data.currentActive?.listPrice != null && data.currentActive.listPrice > 0) {
      return data.currentActive.listPrice;
    }
    if (data.focusListing?.listPrice != null && data.focusListing.listPrice > 0) {
      return data.focusListing.listPrice;
    }
    return null;
  }, [data.currentActive?.listPrice, data.focusListing?.listPrice]);

  const clientMedianActiveListPrice = useMemo(() => {
    const prices = filteredActive.map((r) => r.listPrice).filter((p): p is number => p != null && p > 0);
    return medianNums(prices);
  }, [filteredActive]);

  /** Subject list price ÷ cohort median list (active). */
  const activeListPriceSubjectOverCohortMedian = useMemo(() => {
    const s = subjectListPriceForGrid;
    const m = clientMedianActiveListPrice;
    if (s == null || !Number.isFinite(s) || m == null || !Number.isFinite(m) || m <= 0) return null;
    return s / m;
  }, [subjectListPriceForGrid, clientMedianActiveListPrice]);

  const clientMedianSoldListPrice = useMemo(
    () => medianSoldListPriceFromIntel(soldWindowRows),
    [soldWindowRows]
  );

  const soldListPriceSubjectOverCohortMedian = useMemo(() => {
    const s = subjectListPriceForGrid;
    const m = clientMedianSoldListPrice;
    if (s == null || !Number.isFinite(s) || m == null || !Number.isFinite(m) || m <= 0) return null;
    return s / m;
  }, [subjectListPriceForGrid, clientMedianSoldListPrice]);

  /** Subject $/SF ÷ cohort median $/SF. Active: list ÷ GLA vs median ask $/SF in filtered active cohort. */
  const activePpsfSubjectOverCohortMedian = useMemo(() => {
    const s = data.rankings.subjectActivePpsf;
    const m = clientMedianActivePpsf;
    if (s == null || !Number.isFinite(s) || m == null || !Number.isFinite(m) || m <= 0) return null;
    return s / m;
  }, [data.rankings.subjectActivePpsf, clientMedianActivePpsf]);

  /** Subject last-sale $/SF ÷ cohort median closed $/SF (sold window). */
  const soldPpsfSubjectOverCohortMedian = useMemo(() => {
    const s = data.rankings.subjectSoldPpsf;
    const m = clientMedianSoldPpsf;
    if (s == null || !Number.isFinite(s) || m == null || !Number.isFinite(m) || m <= 0) return null;
    return s / m;
  }, [data.rankings.subjectSoldPpsf, clientMedianSoldPpsf]);

  const { median: saleToAssessedMultiplier, sample: saleToAssessedSample } = useMemo(
    () => medianCloseToAssessedFromIntel(soldWindowRows),
    [soldWindowRows]
  );

  const subjectAcres = data.parcel.acreage ?? 0;
  const landAcresSorted = useMemo(() => {
    const v = filteredParcels
      .map((p) => p.acreage)
      .filter((a): a is number => a != null && a > 0)
      .sort((a, b) => a - b);
    return v;
  }, [filteredParcels]);

  const clientLandPercentile = useMemo(() => {
    if (subjectAcres <= 0 || landAcresSorted.length === 0) return null;
    return percentileInSorted(landAcresSorted, subjectAcres);
  }, [landAcresSorted, subjectAcres]);

  const clientMedianLandAcres = useMemo(() => medianNums(landAcresSorted), [landAcresSorted]);

  const projection = useMemo(() => {
    return computeProjectionFromIntel({
      subjectGla,
      subjectAssessed,
      soldRows: filteredSold,
      activeRows: filteredActive,
      soldWindowMonths: soldMonths,
    });
  }, [subjectGla, subjectAssessed, filteredSold, filteredActive, soldMonths]);

  const subjectSaleToAssessed = useMemo(() => {
    if (!subjectAssessed || subjectAssessed <= 0) return null;
    const c = data.focusListing?.closePrice;
    if (c != null && c > 0) return c / subjectAssessed;
    const h = data.history.find((x) => x.closePrice != null && x.closePrice > 0);
    if (h?.closePrice) return h.closePrice / subjectAssessed;
    return null;
  }, [subjectAssessed, data.focusListing?.closePrice, data.history]);

  const subjectActiveDom = useMemo(() => {
    const id = data.currentActive?.linkId;
    if (id == null) return null;
    const row = data.intelActive.find((r) => r.linkId === id);
    return row ? domActiveDays(row.onMarketDate) : null;
  }, [data.currentActive?.linkId, data.intelActive]);

  const subjectSoldDom = useMemo(() => {
    const fid = data.focusListing?.linkId;
    if (fid == null) return null;
    const r = data.intelSold.find((x) => x.linkId === fid);
    return r ? domSoldDays(r.onMarketDate, r.closeDate) : null;
  }, [data.focusListing?.linkId, data.intelSold]);

  const parcelAssessedSorted = useMemo(
    () => sortedPositive(filteredParcels.map((p) => p.assessed)),
    [filteredParcels]
  );
  const medianParcelAssessed = useMemo(() => medianNums(parcelAssessedSorted), [parcelAssessedSorted]);

  const activeGlaSorted = useMemo(() => sortedPositive(filteredActive.map((r) => r.gla)), [filteredActive]);
  const soldGlaSorted = useMemo(() => sortedPositive(soldWindowRows.map((r) => r.gla)), [soldWindowRows]);
  const activeLotSorted = useMemo(() => sortedPositive(filteredActive.map((r) => r.lotSqft)), [filteredActive]);
  const soldLotSorted = useMemo(() => sortedPositive(soldWindowRows.map((r) => r.lotSqft)), [soldWindowRows]);

  const pctGlaActive = useMemo(
    () => (subjectGla != null && subjectGla > 0 ? percentileInSorted(activeGlaSorted, subjectGla) : null),
    [subjectGla, activeGlaSorted]
  );
  const pctGlaSold = useMemo(
    () => (subjectGla != null && subjectGla > 0 ? percentileInSorted(soldGlaSorted, subjectGla) : null),
    [subjectGla, soldGlaSorted]
  );

  const pctLotActive = useMemo(
    () =>
      subjectLotSqft != null && subjectLotSqft > 0
        ? percentileInSorted(activeLotSorted, subjectLotSqft)
        : null,
    [subjectLotSqft, activeLotSorted]
  );
  const pctLotSold = useMemo(
    () =>
      subjectLotSqft != null && subjectLotSqft > 0 ? percentileInSorted(soldLotSorted, subjectLotSqft) : null,
    [subjectLotSqft, soldLotSorted]
  );

  const medianActiveDom = useMemo(() => {
    const vals = filteredActive.map((r) => domActiveDays(r.onMarketDate)).filter((x): x is number => x != null);
    return medianNums(vals);
  }, [filteredActive]);

  const medianSoldDom = useMemo(() => {
    const vals = soldWindowRows
      .map((r) => domSoldDays(r.onMarketDate, r.closeDate))
      .filter((x): x is number => x != null);
    return medianNums(vals);
  }, [soldWindowRows]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of data.intelSold) {
      if (r.propertyTypeLabel?.trim()) set.add(r.propertyTypeLabel.trim());
    }
    for (const r of data.intelActive) {
      if (r.propertyTypeLabel?.trim()) set.add(r.propertyTypeLabel.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [data.intelSold, data.intelActive]);

  const jumpToTabDepth = useCallback((t: "active" | "sold" | "parcels") => {
    setTab(t);
    window.setTimeout(() => {
      document.getElementById(`pv3-depth-${t}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }, []);

  const resetComparisonDefaults = useCallback(() => {
    setFilters(defaultCompFilterState());
    setSoldMonths(12);
    setGeoMode("mls");
    setMoreListingFiltersOpen(false);
  }, []);

  const geographyChipMls = effectiveGeoMode === "mls";
  const geographyChipZoning = effectiveGeoMode === "zoning";

  const lotOffSelected = filters.sizeCompareMode === "gla";

  const heroPhoto =
    data.focusListing?.photos?.[0] ??
    (data.currentActive ? null : data.history[0] ? null : null);

  const beds = data.focusListing?.beds ?? data.currentActive?.beds ?? null;
  const baths = data.focusListing?.baths ?? data.currentActive?.baths ?? null;
  const statusLabel = data.currentActive ? "Active" : "Off-Market";

  const taxMap = data.parcel.taxMap ?? "";
  const parcelNum = data.parcel.parcelNum ?? "";
  const zoningHref =
    taxMap && parcelNum ? zoningLookupToolPath(taxMap, parcelNum) : data.assessorDatabaseUrl;

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <nav className="text-xs text-[var(--nantucket-gray)]">
        <Link href="/" className="hover:text-[var(--privet-green)]">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/map" className="hover:text-[var(--privet-green)]">
          Map
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-[var(--atlantic-navy)]">Property (V3)</span>
      </nav>

      {data.ambiguousParcel ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Multiple assessor parcels share this address slug; showing the primary record. Confirm parcel ID on the
          assessor card.
        </p>
      ) : null}

      <section className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="relative w-full max-w-[400px] shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-[#e0e6ef] bg-[#0a1628] shadow-sm">
          {heroPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroPhoto} alt="" className="aspect-[4/3] w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center bg-[#0a1628] p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Nantucket Houses_Master_logo.png"
                alt=""
                className="h-16 w-auto opacity-40 grayscale"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <span className="inline-block rounded bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90">
              {statusLabel}
            </span>
            <h1 className="mt-2 text-lg font-semibold leading-snug sm:text-xl">{data.parcel.location}</h1>
            <p className="mt-1 text-sm text-white/85">
              {beds != null || baths != null ? (
                <>
                  {beds ?? "—"} bed · {baths ?? "—"} bath
                </>
              ) : (
                "Beds / baths from MLS when a listing is matched"
              )}
            </p>
            <p className="mt-1 text-xs text-white/70">
              {data.parcel.use ?? "—"} · Lot {data.parcel.acreage != null ? `${data.parcel.acreage} ac` : "—"} ·
              Assessor parcel {data.parcel.parcelId}
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--nantucket-gray)]">
            Parcel-first intelligence (V3)
          </p>
          <p className="text-sm text-[var(--atlantic-navy)]/90">
            MLS area:{" "}
            <span className="font-semibold">{data.mlsAreaPrimary ?? "Unknown (no MLS area on file)"}</span>
            {data.bboxKeyResolved ? (
              <span className="text-[var(--nantucket-gray)]"> · Bbox {data.bboxKeyResolved}</span>
            ) : null}
          </p>
          <p className="text-sm text-[var(--atlantic-navy)]/90">
            Zoning district (assessor):{" "}
            <span className="font-semibold">{data.subjectZoningLabel ?? "—"}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {data.currentActive ? (
              <Link
                href={data.currentActive.linkMlsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-[var(--privet-green)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brass-hover)]"
              >
                View full MLS listing
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-dashed border-[#cfd8e6] px-4 py-2.5 text-sm font-medium text-[var(--nantucket-gray)]">
                No active MLS match on this parcel
              </span>
            )}
            <Link
              href={zoningHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-[#e0e6ef] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--atlantic-navy)] shadow-sm hover:border-[var(--privet-green)]"
            >
              Assessor &amp; zoning worksheet
            </Link>
          </div>
          {data.listingInstanceId != null ? (
            <Link href={data.canonicalPath} className="inline-block text-sm font-medium text-[var(--privet-green)] hover:underline">
              ← Full property history (canonical address page)
            </Link>
          ) : null}
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border-2 border-[#d4e4ec] bg-gradient-to-b from-white to-[#f7fafc] p-4 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--atlantic-navy)]">
          <Settings2 className="h-5 w-5 shrink-0 text-[var(--atlantic-navy)]/80" aria-hidden />
          Market rankings &amp; comps
        </h2>
        <h3 className="mt-3 text-xl font-bold tracking-tight text-[var(--atlantic-navy)] sm:text-2xl">
          Customize Your Market Comparison
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--nantucket-gray)] sm:text-[15px]">
          Define the exact set of properties you want to compare against. Change geography, size match, time window, or
          other filters — everything below updates instantly.
        </p>

        <div
          id="pv3-define-comparison"
          className="mt-6 scroll-mt-24 rounded-2xl border border-[#d0dde8] bg-gradient-to-b from-white via-[#fafcfd] to-[#f4f9fb] p-5 shadow-sm sm:mt-7 sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <h3 className="text-lg font-bold tracking-tight text-[var(--atlantic-navy)] sm:text-xl">
                Define Your Comparison Set
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--nantucket-gray)] sm:text-[13px]">
                One choice per row. Everything below — cohort snapshot, comparison grid, and projections — updates
                instantly as you change options.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:pt-0.5">
              <button
                type="button"
                onClick={resetComparisonDefaults}
                className="rounded-md border border-[#c5d3e0] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--atlantic-navy)] shadow-sm transition-colors hover:border-[var(--atlantic-navy)]/40 hover:bg-[#f0f7fc] sm:text-sm"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-6 sm:gap-5">
            <div
              id={FILTER_SECTION_IDS.geography}
              className="scroll-mt-28 grid gap-3 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:items-start sm:gap-x-10"
            >
              <div className="pt-0.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--nantucket-gray)]">
                  Geography
                </p>
              </div>
              <div className="min-w-0 space-y-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <SelectChip selected={geographyChipMls} onClick={() => setGeoMode("mls")}>
                    MLS area
                    <span className="mt-0.5 block text-[10px] font-medium leading-tight text-[var(--nantucket-gray)]">
                      {data.mlsAreaPrimary ?? "—"}
                    </span>
                  </SelectChip>
                  <SelectChip
                    selected={geographyChipZoning}
                    disabled={!data.subjectZoningKey}
                    onClick={() => setGeoMode("zoning")}
                  >
                    Zoning district
                    <span className="mt-0.5 block text-[10px] font-medium leading-tight text-[var(--nantucket-gray)]">
                      {data.subjectZoningLabel ?? "—"}
                    </span>
                  </SelectChip>
                </div>
                <p className="text-xs text-[var(--nantucket-gray)]">
                  <span className="font-medium text-[var(--atlantic-navy)]">{geoLabel(effectiveGeoMode, data)}</span>
                  {effectiveGeoMode === "zoning" ? (
                    <span className="mt-1 block">
                      Listings match an assessor parcel in this zoning; parcels use the same district.
                    </span>
                  ) : (
                    <span className="mt-1 block">
                      Listings share the same MLS area; parcels use the MLS-area map bbox.
                    </span>
                  )}
                </p>
                {geoMode === "zoning" && !data.subjectZoningKey ? (
                  <p className="text-xs text-amber-800">No assessor zoning on file — MLS area cohort is used.</p>
                ) : null}
              </div>
            </div>

            <div
              id={FILTER_SECTION_IDS.size}
              className="scroll-mt-28 grid gap-3 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:items-start sm:gap-x-10"
            >
              <div className="pt-0.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--nantucket-gray)]">
                  Living area (SF)
                </p>
              </div>
              <div className="min-w-0 space-y-2">
                <div
                  className={cn(
                    "flex flex-wrap items-center gap-1.5",
                    filters.sizeCompareMode === "land" && "opacity-50"
                  )}
                >
                  {GLA_CHIP_PCTS.map((pct) => (
                    <SelectChip
                      key={pct}
                      selected={filters.sizeCompareMode === "gla" && filters.glaTolerancePct === pct}
                      disabled={filters.sizeCompareMode === "land"}
                      onClick={() => setFilters((f) => ({ ...f, sizeCompareMode: "gla", glaTolerancePct: pct }))}
                    >
                      ±{pct}%
                    </SelectChip>
                  ))}
                </div>
                {filters.sizeCompareMode === "land" ? (
                  <p className="text-xs text-[var(--nantucket-gray)]">
                    Living-area match is off while <strong className="text-[var(--atlantic-navy)]">Lot size</strong> is
                    selected. Choose <strong className="text-[var(--atlantic-navy)]">Off</strong> under Lot size to use
                    GLA chips again.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="scroll-mt-28 grid gap-3 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:items-start sm:gap-x-10">
              <div className="pt-0.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--nantucket-gray)]">
                  Lot size <span className="font-normal normal-case">(optional)</span>
                </p>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <SelectChip
                    selected={lotOffSelected}
                    onClick={() => setFilters((f) => ({ ...f, sizeCompareMode: "gla" }))}
                  >
                    Off
                    <span className="mt-0.5 block text-[10px] font-medium leading-tight text-[var(--nantucket-gray)]">
                      Use living area match
                    </span>
                  </SelectChip>
                  {LOT_CHIP_PCTS.map((pct) => (
                    <SelectChip
                      key={pct}
                      selected={filters.sizeCompareMode === "land" && filters.landTolerancePct === pct}
                      onClick={() =>
                        setFilters((f) => ({ ...f, sizeCompareMode: "land", landTolerancePct: pct }))
                      }
                    >
                      MLS lot ±{pct}%
                    </SelectChip>
                  ))}
                </div>
              </div>
            </div>

            <div
              id={FILTER_SECTION_IDS.sold}
              className="scroll-mt-28 grid gap-3 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:items-start sm:gap-x-10"
            >
              <div className="pt-0.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--nantucket-gray)]">
                  Sold time window
                </p>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  {SOLD_CHIP_MONTHS.map((m) => (
                    <SelectChip key={m} selected={soldMonths === m} onClick={() => setSoldMonths(m)}>
                      {m} mo
                    </SelectChip>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-[#dce5ee] pt-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--nantucket-gray)]">
              Cohort snapshot
            </p>
            <p className="mt-1 text-xs text-[var(--nantucket-gray)]">
              Live counts from your selections — updates immediately when any option changes.
            </p>
            <div className="mt-4 rounded-xl bg-[var(--atlantic-navy)] px-4 py-4 text-white shadow-inner sm:px-5 sm:py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-4 sm:gap-y-1">
                <span className="text-xl font-bold tabular-nums sm:text-2xl">
                  {filteredActive.length.toLocaleString()}{" "}
                  <span className="text-sm font-semibold text-white/80 sm:text-base">active</span>
                </span>
                <span className="hidden text-white/35 sm:inline">·</span>
                <span className="text-xl font-bold tabular-nums sm:text-2xl">
                  {soldWindowRows.length.toLocaleString()}{" "}
                  <span className="text-sm font-semibold text-white/80 sm:text-base">sold ({soldMonths} mo)</span>
                </span>
                <span className="hidden text-white/35 sm:inline">·</span>
                <span
                  className="text-xl font-bold tabular-nums sm:text-2xl"
                  title="Assessor parcels outside the MLS-area map bbox (same geography & lot band when applicable)"
                >
                  {filteredNonMlsParcels.length.toLocaleString()}{" "}
                  <span className="text-sm font-semibold text-white/80 sm:text-base">non-MLS parcels</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[#e6edf4] pt-5">
            <button
              type="button"
              onClick={() => setMoreListingFiltersOpen((o) => !o)}
              className="text-sm font-semibold text-[var(--privet-green)] hover:underline"
            >
              {moreListingFiltersOpen ? "Hide" : "Show"} listing attribute filters (beds, baths, year, types…)
            </button>
          </div>

          {moreListingFiltersOpen ? (
            <div id={FILTER_SECTION_IDS.attrs} className="scroll-mt-28 mt-4 space-y-4 rounded-lg border border-[#e0e6ef] bg-[#f8fafc] p-4 text-sm sm:p-5">
              <FilterSectionTitle>Listing attributes</FilterSectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumPair
                  label="Beds (min / max)"
                  min={filters.bedMin}
                  max={filters.bedMax}
                  onMin={(n) => setFilters((f) => ({ ...f, bedMin: n }))}
                  onMax={(n) => setFilters((f) => ({ ...f, bedMax: n }))}
                />
                <NumPair
                  label="Baths (min / max)"
                  min={filters.bathMin}
                  max={filters.bathMax}
                  onMin={(n) => setFilters((f) => ({ ...f, bathMin: n }))}
                  onMax={(n) => setFilters((f) => ({ ...f, bathMax: n }))}
                />
                <NumPair
                  label="Year built (min / max)"
                  min={filters.yearMin}
                  max={filters.yearMax}
                  onMin={(n) => setFilters((f) => ({ ...f, yearMin: n }))}
                  onMax={(n) => setFilters((f) => ({ ...f, yearMax: n }))}
                />
                <label className="block text-xs font-medium text-[var(--atlantic-navy)]">
                  Min MLS lot (sq ft)
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 10000"
                    value={filters.lotMinSqft ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFilters((f) => ({
                        ...f,
                        lotMinSqft: v === "" ? null : Math.max(0, parseInt(v, 10) || 0),
                      }));
                    }}
                    className="mt-1 w-full rounded border border-[#e0e6ef] bg-white px-2 py-1.5 text-sm"
                  />
                </label>
              </div>
              {typeOptions.length > 0 ? (
                <div>
                  <p className="text-[11px] font-medium text-[var(--atlantic-navy)]">Property types (empty = all)</p>
                  <div className="mt-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                    {typeOptions.map((t) => {
                      const on = filters.propertyTypeLabels.includes(t);
                      return (
                        <label
                          key={t}
                          className={cn(
                            "cursor-pointer rounded-full border px-2.5 py-1 text-xs",
                            on ? "border-[var(--privet-green)] bg-[var(--privet-green)]/10" : "border-[#e0e6ef] bg-white"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="mr-1 align-middle"
                            checked={on}
                            onChange={() => {
                              setFilters((f) => ({
                                ...f,
                                propertyTypeLabels: on
                                  ? f.propertyTypeLabels.filter((x) => x !== t)
                                  : [...f.propertyTypeLabels, t],
                              }));
                            }}
                          />
                          {t}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    bedMin: null,
                    bedMax: null,
                    bathMin: null,
                    bathMax: null,
                    yearMin: null,
                    yearMax: null,
                    lotMinSqft: null,
                    propertyTypeLabels: [],
                  }))
                }
                className="rounded-lg border border-[#e0e6ef] bg-white px-4 py-2 text-sm font-medium text-[var(--atlantic-navy)] hover:bg-[var(--sandstone)]/50"
              >
                Clear listing attribute filters
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-6 rounded-xl border border-[#cfe0ea] bg-gradient-to-b from-white to-[#f7fbfd] p-4 shadow-sm sm:p-5">
          <h3 className="text-base font-semibold text-[var(--atlantic-navy)]">Property Comparison Grid</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--nantucket-gray)] sm:text-sm">
            Subject property vs. current comparison set (update filters above to change the cohorts)
          </p>

          <div className="mt-4 -mx-1 overflow-x-auto px-1 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[36rem] border-separate border-spacing-y-1.5 text-left sm:min-w-[48rem]">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wide text-[var(--nantucket-gray)] sm:text-xs">
                  <th className="min-w-[7.5rem] pb-2 pr-2 align-bottom sm:min-w-[9rem]">Metric</th>
                  <th className="min-w-[8rem] max-w-[10.5rem] pb-2 px-1 align-top pt-1 font-semibold normal-case leading-tight tracking-normal text-[var(--atlantic-navy)] sm:min-w-[9rem] sm:max-w-[12rem] sm:text-[11px]">
                    <div>{data.parcel.location}</div>
                    <div className="mt-1.5 text-[10px] font-semibold tabular-nums tracking-normal text-[var(--atlantic-navy)] sm:text-[11px]">
                      {subjectGla != null ? `${subjectGla.toLocaleString()} SQFT` : "—"}
                    </div>
                  </th>
                  <th className="px-1 pb-2 align-bottom">Active</th>
                  <th className="px-1 pb-2 align-bottom">Sold</th>
                  <th className="pl-1 pb-2 align-bottom">All Parcels</th>
                </tr>
              </thead>
              <tbody className="align-top">
                <tr>
                  <td className="pr-2 font-medium text-[var(--atlantic-navy)]">List price</td>
                  <td className="p-1">
                    <ComparisonGridSubjectCell>
                      {subjectListPriceForGrid != null ? (
                        <span className="text-base font-bold tabular-nums sm:text-lg">{fmtMoney(subjectListPriceForGrid)}</span>
                      ) : (
                        <span className="text-[11px] text-[var(--nantucket-gray)]">—</span>
                      )}
                    </ComparisonGridSubjectCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell tone="neutral" tab="active" onJump={jumpToTabDepth}>
                      {clientMedianActiveListPrice != null ? (
                        <>
                          <div className="tabular-nums text-[13px] font-semibold sm:text-sm">
                            {fmtMoney(clientMedianActiveListPrice)}
                          </div>
                          <div className="mt-1 text-[10px] leading-snug text-[var(--nantucket-gray)] sm:text-[11px]">
                            {activeListPriceSubjectOverCohortMedian != null ? (
                              <>
                                Subject ÷ this price:{" "}
                                <span className="font-semibold tabular-nums text-[var(--atlantic-navy)]">
                                  {activeListPriceSubjectOverCohortMedian.toFixed(2)}×
                                </span>
                                {" "}
                                <span className="opacity-90">
                                  ({activeListPriceSubjectOverCohortMedian >= 1 ? "at or above" : "below"})
                                </span>
                              </>
                            ) : (
                              "—"
                            )}
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </ComparisonGridCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell tone="neutral" tab="sold" onJump={jumpToTabDepth}>
                      {clientMedianSoldListPrice != null ? (
                        <>
                          <div className="tabular-nums text-[13px] font-semibold sm:text-sm">
                            {fmtMoney(clientMedianSoldListPrice)}
                          </div>
                          <div className="mt-1 text-[10px] leading-snug text-[var(--nantucket-gray)] sm:text-[11px]">
                            {soldListPriceSubjectOverCohortMedian != null ? (
                              <>
                                Subject ÷ this price:{" "}
                                <span className="font-semibold tabular-nums text-[var(--atlantic-navy)]">
                                  {soldListPriceSubjectOverCohortMedian.toFixed(2)}×
                                </span>
                                {" "}
                                <span className="opacity-90">
                                  ({soldListPriceSubjectOverCohortMedian >= 1 ? "at or above" : "below"})
                                </span>
                              </>
                            ) : (
                              "—"
                            )}
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </ComparisonGridCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell tone="na" tab="parcels" onJump={jumpToTabDepth}>
                      —
                    </ComparisonGridCell>
                  </td>
                </tr>
                <tr>
                  <td className="pr-2 font-medium text-[var(--atlantic-navy)]">Living Area (SQFT)</td>
                  <td className="p-1">
                    <ComparisonGridSubjectCell>
                      {subjectGla != null ? (
                        <span className="tabular-nums font-semibold">{subjectGla.toLocaleString()} SQFT</span>
                      ) : (
                        "—"
                      )}
                    </ComparisonGridSubjectCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell tone="neutral" tab="active" onJump={jumpToTabDepth}>
                      {pctGlaActive != null && subjectGla != null ? (
                        <>
                          <span className="tabular-nums font-semibold">{pctGlaActive}th</span> percentile · subject{" "}
                          <strong className="tabular-nums">{subjectGla.toLocaleString()} SQFT</strong>
                        </>
                      ) : (
                        "—"
                      )}
                    </ComparisonGridCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell tone="neutral" tab="sold" onJump={jumpToTabDepth}>
                      {pctGlaSold != null && subjectGla != null ? (
                        <>
                          <span className="tabular-nums font-semibold">{pctGlaSold}th</span> percentile · subject{" "}
                          <strong className="tabular-nums">{subjectGla.toLocaleString()} SQFT</strong>
                        </>
                      ) : (
                        "—"
                      )}
                    </ComparisonGridCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell tone="na" tab="parcels" onJump={jumpToTabDepth}>
                      —
                    </ComparisonGridCell>
                  </td>
                </tr>
                <tr>
                  <td className="pr-2 font-medium text-[var(--atlantic-navy)]">Price / SF (living)</td>
                  <td className="p-1">
                    <ComparisonGridSubjectCell>
                      {data.currentActive?.listPrice != null &&
                      data.currentActive.listPrice > 0 &&
                      subjectGla != null &&
                      subjectGla > 0 ? (
                        <>
                          <div className="text-base font-bold tabular-nums leading-tight text-[var(--atlantic-navy)] sm:text-lg">
                            {fmtPpsf(data.currentActive.listPrice / subjectGla)}
                          </div>
                          <div className="mt-1.5 text-[10px] font-normal leading-snug text-[var(--nantucket-gray)] sm:text-[11px]">
                            <span className="font-semibold text-[var(--atlantic-navy)]/90">
                              {fmtMoney(data.currentActive.listPrice)}
                            </span>{" "}
                            list price ÷{" "}
                            <span className="font-semibold tabular-nums text-[var(--atlantic-navy)]/90">
                              {subjectGla.toLocaleString()} SF
                            </span>{" "}
                            living area
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </ComparisonGridSubjectCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell
                      tone={ppsfTone(data.rankings.subjectActivePpsf, clientMedianActivePpsf)}
                      tab="active"
                      onJump={jumpToTabDepth}
                    >
                      {clientMedianActivePpsf != null ? (
                        <>
                          Median <span className="tabular-nums font-semibold">{fmtPpsf(clientMedianActivePpsf)}</span>
                          {data.rankings.subjectActivePpsf != null ? (
                            <>
                              {" "}
                              · subject{" "}
                              <strong className="tabular-nums">{fmtPpsf(data.rankings.subjectActivePpsf)}</strong>
                            </>
                          ) : (
                            " · subject —"
                          )}
                          {activePpsfSubjectOverCohortMedian != null ? (
                            <span className="mt-1 block text-[10px] leading-snug text-[var(--nantucket-gray)] sm:text-[11px]">
                              Ratio (subject ask ÷ cohort median ask):{" "}
                              <span className="font-semibold tabular-nums text-[var(--atlantic-navy)]">
                                {activePpsfSubjectOverCohortMedian.toFixed(2)}×
                              </span>
                              {" "}
                              <span className="opacity-90">
                                ({activePpsfSubjectOverCohortMedian >= 1 ? "at or above" : "below"} median)
                              </span>
                            </span>
                          ) : null}
                        </>
                      ) : (
                        "—"
                      )}
                    </ComparisonGridCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell
                      tone={ppsfTone(data.rankings.subjectSoldPpsf, clientMedianSoldPpsf)}
                      tab="sold"
                      onJump={jumpToTabDepth}
                    >
                      {clientMedianSoldPpsf != null ? (
                        <>
                          Median <span className="tabular-nums font-semibold">{fmtPpsf(clientMedianSoldPpsf)}</span>
                          {data.rankings.subjectSoldPpsf != null ? (
                            <>
                              {" "}
                              · subject{" "}
                              <strong className="tabular-nums">{fmtPpsf(data.rankings.subjectSoldPpsf)}</strong>
                            </>
                          ) : (
                            " · subject —"
                          )}
                          {soldPpsfSubjectOverCohortMedian != null ? (
                            <span className="mt-1 block text-[10px] leading-snug text-[var(--nantucket-gray)] sm:text-[11px]">
                              Ratio (subject sale ÷ cohort median):{" "}
                              <span className="font-semibold tabular-nums text-[var(--atlantic-navy)]">
                                {soldPpsfSubjectOverCohortMedian.toFixed(2)}×
                              </span>
                              {" "}
                              <span className="opacity-90">
                                ({soldPpsfSubjectOverCohortMedian >= 1 ? "at or above" : "below"} median)
                              </span>
                            </span>
                          ) : null}
                        </>
                      ) : (
                        "—"
                      )}
                    </ComparisonGridCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell tone="na" tab="parcels" onJump={jumpToTabDepth}>
                      —
                    </ComparisonGridCell>
                  </td>
                </tr>
                <tr>
                  <td className="pr-2 font-medium text-[var(--atlantic-navy)]">Lot size</td>
                  <td className="p-1">
                    <ComparisonGridSubjectCell>
                      {subjectLotSqft != null ? (
                        <div className="tabular-nums font-semibold">{subjectLotSqft.toLocaleString()} SF</div>
                      ) : null}
                      {subjectAcres > 0 ? (
                        <div className={cn("tabular-nums font-semibold", subjectLotSqft != null && "mt-0.5")}>
                          {subjectAcres} ac
                        </div>
                      ) : null}
                      {subjectLotSqft == null && subjectAcres <= 0 ? "—" : null}
                    </ComparisonGridSubjectCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell tone="neutral" tab="active" onJump={jumpToTabDepth}>
                      {pctLotActive != null ? (
                        <>
                          <span className="tabular-nums font-semibold">{pctLotActive}th</span> percentile (MLS lot) ·
                          subject{" "}
                          <strong className="tabular-nums">
                            {subjectLotSqft != null ? `${subjectLotSqft.toLocaleString()} SF` : "—"}
                          </strong>
                        </>
                      ) : (
                        "—"
                      )}
                    </ComparisonGridCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell tone="neutral" tab="sold" onJump={jumpToTabDepth}>
                      {pctLotSold != null ? (
                        <>
                          <span className="tabular-nums font-semibold">{pctLotSold}th</span> percentile (MLS lot) ·
                          subject{" "}
                          <strong className="tabular-nums">
                            {subjectLotSqft != null ? `${subjectLotSqft.toLocaleString()} SF` : "—"}
                          </strong>
                        </>
                      ) : (
                        "—"
                      )}
                    </ComparisonGridCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell tone="neutral" tab="parcels" onJump={jumpToTabDepth}>
                      {clientLandPercentile != null && subjectAcres > 0 ? (
                        <>
                          <span className="tabular-nums font-semibold">{clientLandPercentile}th</span> percentile (acres)
                          · subject <strong className="tabular-nums">{subjectAcres} ac</strong>
                        </>
                      ) : (
                        "—"
                      )}
                    </ComparisonGridCell>
                  </td>
                </tr>
                <tr>
                  <td className="pr-2 font-medium text-[var(--atlantic-navy)]">Assessed value</td>
                  <td className="p-1">
                    <ComparisonGridSubjectCell>
                      {subjectAssessed != null ? (
                        <span className="font-semibold tabular-nums">{fmtMoney(subjectAssessed)}</span>
                      ) : (
                        "—"
                      )}
                    </ComparisonGridSubjectCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell tone="na" tab="active" onJump={jumpToTabDepth}>
                      —
                    </ComparisonGridCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell tone="na" tab="sold" onJump={jumpToTabDepth}>
                      —
                    </ComparisonGridCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell
                      tone={
                        medianParcelAssessed != null && subjectAssessed != null && subjectAssessed > 0
                          ? "neutral"
                          : "na"
                      }
                      tab="parcels"
                      onJump={jumpToTabDepth}
                    >
                      {medianParcelAssessed != null && subjectAssessed != null ? (
                        <>
                          Median <span className="font-semibold tabular-nums">{fmtMoney(medianParcelAssessed)}</span> ·
                          subject <strong className="tabular-nums">{fmtMoney(subjectAssessed)}</strong>
                        </>
                      ) : (
                        "—"
                      )}
                    </ComparisonGridCell>
                  </td>
                </tr>
                <tr>
                  <td className="pr-2 font-medium text-[var(--atlantic-navy)]">Price to Assessed</td>
                  <td className="p-1">
                    <ComparisonGridSubjectCell>
                      {subjectSaleToAssessed != null ? (
                        <>
                          <span className="font-semibold tabular-nums">{subjectSaleToAssessed.toFixed(2)}×</span>
                          <span className="mt-1 block text-[10px] font-normal text-[var(--nantucket-gray)]">
                            Close price ÷ assessed total
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </ComparisonGridSubjectCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell tone="na" tab="active" onJump={jumpToTabDepth}>
                      —
                    </ComparisonGridCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell
                      tone={saleToAssessedTone(subjectSaleToAssessed, saleToAssessedMultiplier)}
                      tab="sold"
                      onJump={jumpToTabDepth}
                    >
                      {saleToAssessedMultiplier != null ? (
                        <>
                          Median <span className="font-semibold tabular-nums">{saleToAssessedMultiplier.toFixed(2)}×</span>
                          {subjectSaleToAssessed != null ? (
                            <>
                              {" "}
                              · subject{" "}
                              <strong className="tabular-nums">{subjectSaleToAssessed.toFixed(2)}×</strong>
                            </>
                          ) : (
                            " · subject —"
                          )}
                          <span className="mt-0.5 block text-[10px] text-[var(--nantucket-gray)]">
                            MLS closings with assessor match · {soldMonths} mo window
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </ComparisonGridCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell tone="na" tab="parcels" onJump={jumpToTabDepth}>
                      —
                    </ComparisonGridCell>
                  </td>
                </tr>
                <tr>
                  <td className="pr-2 font-medium text-[var(--atlantic-navy)]">Days on market</td>
                  <td className="p-1">
                    <ComparisonGridSubjectCell>
                      {subjectActiveDom != null ? (
                        <>
                          <span className="font-semibold tabular-nums">{subjectActiveDom}</span> days
                          <span className="mt-0.5 block text-[10px] text-[var(--nantucket-gray)]">Current active</span>
                        </>
                      ) : subjectSoldDom != null ? (
                        <>
                          <span className="font-semibold tabular-nums">{subjectSoldDom}</span> days
                          <span className="mt-0.5 block text-[10px] text-[var(--nantucket-gray)]">Last sale (list→close)</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </ComparisonGridSubjectCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell tone="neutral" tab="active" onJump={jumpToTabDepth}>
                      {medianActiveDom != null ? (
                        <>
                          Median <span className="font-semibold tabular-nums">{Math.round(medianActiveDom)}</span> days
                          {subjectActiveDom != null ? (
                            <>
                              {" "}
                              · subject <strong className="tabular-nums">{subjectActiveDom}</strong>
                            </>
                          ) : (
                            " · subject —"
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </ComparisonGridCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell
                      tone={domSoldTone(subjectSoldDom, medianSoldDom)}
                      tab="sold"
                      onJump={jumpToTabDepth}
                    >
                      {medianSoldDom != null ? (
                        <>
                          Median <span className="font-semibold tabular-nums">{Math.round(medianSoldDom)}</span> days
                          {subjectSoldDom != null ? (
                            <>
                              {" "}
                              · subject <strong className="tabular-nums">{subjectSoldDom}</strong>
                            </>
                          ) : (
                            " · subject —"
                          )}
                          <span className="mt-0.5 block text-[10px] text-[var(--nantucket-gray)]">
                            Sold · {soldMonths} mo window
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </ComparisonGridCell>
                  </td>
                  <td className="p-1">
                    <ComparisonGridCell tone="na" tab="parcels" onJump={jumpToTabDepth}>
                      —
                    </ComparisonGridCell>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[10px] text-[var(--nantucket-gray)] sm:text-xs">
            Tap a cell to open the matching tab below. Green highlights suggest relatively stronger value vs the cohort;
            red suggests relatively higher pricing or longer time on market (sold).
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-[var(--sandstone)] p-1">
            <TabsTrigger value="active" className="flex-1 min-w-[8rem]">
              Active
            </TabsTrigger>
            <TabsTrigger value="sold" className="flex-1 min-w-[8rem]">
              Sold
            </TabsTrigger>
            <TabsTrigger value="parcels" className="flex-1 min-w-[8rem]">
              Parcels
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" id="pv3-depth-active" className="scroll-mt-28 mt-4 space-y-4">
            <p className="text-xs text-[var(--nantucket-gray)]">
              Active cohort count is shown in the summary bar above; charts use the same filtered set.
            </p>
            {data.rankings.subjectActivePpsf != null && clientMedianActivePpsf != null ? (
              <Bar
                label="This property $/SF (vs MLS GLA) vs median active in cohort"
                value={Math.round(data.rankings.subjectActivePpsf)}
                max={Math.max(data.rankings.subjectActivePpsf, clientMedianActivePpsf) * 1.05}
              />
            ) : (
              <p className="text-sm tabular-nums text-[var(--atlantic-navy)]">—</p>
            )}
          </TabsContent>

          <TabsContent value="sold" id="pv3-depth-sold" className="scroll-mt-28 mt-4 space-y-4">
            <p className="text-xs text-[var(--nantucket-gray)]">
              Sold counts and window match the summary bar; medians and projections use closings in the last{" "}
              {soldMonths} months within your filters.
            </p>
            {data.rankings.subjectSoldPpsf != null && clientMedianSoldPpsf != null ? (
              <Bar
                label="This property last sold $/SF vs window median"
                value={Math.round(data.rankings.subjectSoldPpsf)}
                max={Math.max(data.rankings.subjectSoldPpsf, clientMedianSoldPpsf) * 1.05}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="parcels" id="pv3-depth-parcels" className="scroll-mt-28 mt-4 space-y-4">
            <p className="text-xs text-[var(--nantucket-gray)]">
              Parcel count follows geography and, in Lot mode, the same ±% lot band as MLS rows. Server payload caps
              parcel rows.
            </p>
            {subjectAcres > 0 && clientMedianLandAcres != null ? (
              <Bar
                label="This parcel land vs median acres (cohort)"
                value={Math.round(subjectAcres * 1000) / 1000}
                max={Math.max(subjectAcres, clientMedianLandAcres) * 1.1}
              />
            ) : null}
            <p className="text-xs text-[var(--nantucket-gray)]">
              GLA on assessor export is not modeled in this GeoJSON — GLA uses MLS living area when present.
            </p>
          </TabsContent>
        </Tabs>

        <div className="mt-6 grid gap-4 border-t border-[#eef2f7] pt-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-[var(--atlantic-navy)]">Gross living area (GLA)</h3>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--atlantic-navy)]">
              {subjectGla != null ? `${subjectGla.toLocaleString()} SF` : "—"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--atlantic-navy)]">Land percentile (cohort)</h3>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--privet-green)]">
              {clientLandPercentile != null ? `${clientLandPercentile}th` : "—"}
            </p>
            <p className="text-xs text-[var(--nantucket-gray)]">Percentile of lot acres vs assessor parcels in cohort</p>
          </div>
          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-[var(--atlantic-navy)]">Assessed value context</h3>
            <p className="mt-1 text-sm text-[var(--atlantic-navy)]/90">
              {saleToAssessedMultiplier != null ? (
                <>
                  Sold closings in cohort with MLS↔assessor matches imply a median price-to-assessed multiple of about{" "}
                  <span className="font-semibold">{saleToAssessedMultiplier.toFixed(2)}×</span> (n={saleToAssessedSample}
                  in {soldMonths} mo window).
                </>
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border-2 border-[var(--privet-green)]/40 bg-[var(--sandstone)]/60 p-4 sm:p-5">
          <h3 className="text-base font-semibold text-[var(--atlantic-navy)]">Projected pricing (illustrative)</h3>
          {projection ? (
            <dl className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-[var(--nantucket-gray)]">Projected listing range</dt>
                <dd className="text-lg font-semibold tabular-nums text-[var(--atlantic-navy)]">
                  {fmtMoney(projection.listLow)} – {fmtMoney(projection.listHigh)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--nantucket-gray)]">Projected sale range</dt>
                <dd className="text-lg font-semibold tabular-nums text-[var(--atlantic-navy)]">
                  {fmtMoney(projection.saleLow)} – {fmtMoney(projection.saleHigh)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-[var(--nantucket-gray)]">Need assessed value, GLA, and sold comps to project.</p>
          )}
          <p className="mt-3 text-xs leading-relaxed text-[var(--nantucket-gray)]">
            Basis: subject GLA and assessed total, median sold $/SF in the selected {soldMonths}-month window within
            geography + comp filters, and median price-to-assessed from the same window. Not an appraisal — for discussion
            only.
          </p>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--atlantic-navy)]">Assessor details</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--nantucket-gray)]">Owner</dt>
            <dd className="font-medium text-[var(--atlantic-navy)]">{data.parcel.ownerName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--nantucket-gray)]">Assessed total</dt>
            <dd className="font-medium text-[var(--atlantic-navy)]">{fmtMoney(data.parcel.assessedTotal)}</dd>
          </div>
          <div>
            <dt className="text-[var(--nantucket-gray)]">Lot SF (assessor)</dt>
            <dd className="font-medium text-[var(--atlantic-navy)]">
              {data.parcel.lotSqft != null ? Math.round(data.parcel.lotSqft).toLocaleString() : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--nantucket-gray)]">Zoning</dt>
            <dd className="font-medium text-[var(--atlantic-navy)]">{data.parcel.zoning ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--atlantic-navy)]">MLS history (this parcel)</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e8edf4] text-xs font-semibold uppercase tracking-wide text-[var(--nantucket-gray)]">
                <th className="py-2 pr-2">MLS number</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2">Dates</th>
                <th className="py-2 pr-2">Price</th>
                <th className="py-2">Brokerage</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((h) => (
                <tr
                  key={h.linkId}
                  className={cn(
                    "border-b border-[#f0f3f7] last:border-0",
                    data.currentActive?.linkId === h.linkId && "bg-[var(--sandstone)]/50"
                  )}
                >
                  <td className="py-2 pr-2 font-mono tabular-nums">
                    <a
                      href={h.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[var(--privet-green)] hover:underline"
                    >
                      {h.linkId}
                    </a>
                  </td>
                  <td className="py-2 pr-2">{h.mlsStatus}</td>
                  <td className="py-2 pr-2 text-xs text-[var(--nantucket-gray)]">
                    {h.closeDate || h.onMarketDate || "—"}
                  </td>
                  <td className="py-2 pr-2 font-medium tabular-nums">
                    {h.closePrice != null ? fmtMoney(h.closePrice) : h.listPrice != null ? fmtMoney(h.listPrice) : "—"}
                  </td>
                  <td className="max-w-[14rem] py-2 text-[var(--atlantic-navy)]/90">
                    {h.brokerage ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data.listingInstanceId ? (
          <p className="mt-4 text-xs text-[var(--nantucket-gray)]">
            Other instances: use the MLS number links above. Canonical URL for SEO:{" "}
            <span className="font-mono text-[var(--atlantic-navy)]">{data.canonicalPath}</span>
          </p>
        ) : (
          <p className="mt-4 text-xs text-[var(--nantucket-gray)]">
            <Link href={data.canonicalPath} className="font-medium text-[var(--privet-green)] hover:underline">
              View all instances on the base property page
            </Link>
          </p>
        )}
      </section>

      {data.focusListing?.publicRemarks ? (
        <section className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--atlantic-navy)]">Description (this MLS instance)</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--atlantic-navy)]/90">
            {data.focusListing.publicRemarks}
          </p>
        </section>
      ) : null}

      {data.focusListing?.photos && data.focusListing.photos.length > 1 ? (
        <section className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--atlantic-navy)]">Photos</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {data.focusListing.photos.slice(0, 12).map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" className="aspect-video w-full rounded object-cover" />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--atlantic-navy)]">Location</h2>
        <p className="mt-2 text-sm text-[var(--nantucket-gray)]">
          Open the map to see this parcel in context, or use the zoning worksheet for regulatory layers.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/map"
            className="inline-flex rounded-lg border border-[#e0e6ef] px-3 py-2 text-sm font-medium text-[var(--atlantic-navy)] hover:border-[var(--privet-green)]"
          >
            Island map
          </Link>
          {taxMap && parcelNum ? (
            <Link
              href={zoningHref}
              className="inline-flex rounded-lg border border-[#e0e6ef] px-3 py-2 text-sm font-medium text-[var(--atlantic-navy)] hover:border-[var(--privet-green)]"
            >
              Zoning worksheet
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function NumPair({
  label,
  min,
  max,
  onMin,
  onMax,
}: {
  label: string;
  min: number | null;
  max: number | null;
  onMin: (n: number | null) => void;
  onMax: (n: number | null) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--atlantic-navy)]">{label}</p>
      <div className="mt-1 flex gap-2">
        <input
          type="number"
          placeholder="Min"
          value={min ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onMin(v === "" ? null : parseFloat(v));
          }}
          className="w-full min-w-0 rounded border border-[#e0e6ef] px-2 py-1 text-sm"
        />
        <input
          type="number"
          placeholder="Max"
          value={max ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onMax(v === "" ? null : parseFloat(v));
          }}
          className="w-full min-w-0 rounded border border-[#e0e6ef] px-2 py-1 text-sm"
        />
      </div>
    </div>
  );
}
