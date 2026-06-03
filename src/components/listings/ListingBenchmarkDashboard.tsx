"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown, Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { ListingDetailPayload } from "@/lib/get-listing-detail";
import { neighborhoodBenchmarkBlurb } from "@/lib/listing-neighborhood-copy";
import { median } from "@/lib/cnc-api";
import { buyerSignalVsBench, pctDiffNum, signalToneClasses } from "@/lib/listing-benchmark-signals";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/components/ui/utils";

type Props = {
  payload: ListingDetailPayload;
};

function fmtPctDiff(a: number | null, b: number | null): string {
  if (a == null || b == null || b === 0) return "—";
  const p = Math.round(((a - b) / b) * 1000) / 10;
  return `${p >= 0 ? "+" : ""}${p}%`;
}

/** Benchmark bar vs this listing’s $/SF (positive = benchmark is more $/SF). */
function benchVsThisListingPctNote(barPpsf: number, thisPpsf: number | null): string | null {
  if (thisPpsf == null || thisPpsf <= 0 || barPpsf <= 0) return null;
  const p = ((barPpsf - thisPpsf) / thisPpsf) * 100;
  const v = Math.round(p * 10) / 10;
  if (Math.abs(v) < 0.35) return "≈ on par with this listing’s $/SF";
  const dir = v > 0 ? "above" : "below";
  return `${Math.abs(v)}% ${dir} this listing’s $/SF`;
}

/** One clause for takeaway: subject vs bench (negative = below bench). */
function diffTakeawayClause(subject: number, bench: number, label: string): string | null {
  if (bench <= 0) return null;
  const p = ((subject - bench) / bench) * 100;
  const abs = Math.abs(Math.round(p * 10) / 10);
  if (Math.abs(p) < 0.5) return null;
  const tilde = abs >= 12 ? "~" : "";
  if (p < 0) return `${tilde}${abs}% below ${label}`;
  return `${abs}% above ${label}`;
}

function fmtMoneySf(n: number | null): string {
  if (n == null || n <= 0) return "—";
  return `$${Math.round(n).toLocaleString()}/SF`;
}

/** Desktop: tinted “subject” column. Mobile: left accent + light fill so rows read as highlighted cells, not a floating pop-over. */
const subjectColTh =
  "py-2.5 px-3 font-bold text-[var(--atlantic-navy)] max-sm:bg-[#eef6fc] max-sm:border-l-[3px] max-sm:border-[#074059] max-sm:shadow-none sm:bg-[#eef6fc] sm:border-l sm:border-[#d4e4f4] sm:shadow-[inset_3px_0_0_0_rgba(7,64,89,0.06)] sm:rounded-l-md";
const subjectColTd =
  "py-2.5 px-3 align-top font-bold text-[var(--atlantic-navy)] max-sm:bg-[#f4f9fc] max-sm:border-l-[3px] max-sm:border-[#074059] max-sm:shadow-none sm:bg-[#eef6fc] sm:border-l sm:border-r sm:border-[#d4e4f4] sm:shadow-[inset_3px_0_0_0_rgba(7,64,89,0.06)] sm:rounded-l-md";

function PpsfVsAreaChip({
  subject,
  bench,
  areaLabel,
}: {
  subject: number | null;
  bench: number | null;
  areaLabel: string;
}) {
  const pct = pctDiffNum(subject, bench);
  if (subject == null || bench == null || bench <= 0 || pct == null) return null;
  const abs = Math.abs(Math.round(pct * 10) / 10);
  const signal = buyerSignalVsBench(subject, bench);
  const tone = signalToneClasses(signal);
  const below = pct < -0.5;
  const above = pct > 0.5;
  return (
    <span
      className={cn(
        "mt-1.5 inline-flex max-w-full flex-wrap items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold leading-tight",
        tone.wrap,
      )}
    >
      {below ? (
        <TrendingDown className="h-3.5 w-3.5 shrink-0 text-current" aria-hidden />
      ) : above ? (
        <TrendingUp className="h-3.5 w-3.5 shrink-0 text-current" aria-hidden />
      ) : (
        <Minus className="h-3.5 w-3.5 shrink-0 text-current opacity-80" aria-hidden />
      )}
      {below ? (
        <span>
          {abs}% below {areaLabel}
        </span>
      ) : above ? (
        <span>
          {abs}% above {areaLabel}
        </span>
      ) : (
        <span>
          ≈ at {areaLabel}
          <span className="font-medium"> — in line with the area</span>
        </span>
      )}
    </span>
  );
}

function NhActivePpsfSpectrum({
  min,
  max,
  medianPpsf,
  value,
  nhName,
}: {
  min: number;
  max: number;
  medianPpsf: number | null;
  value: number | null;
  nhName: string;
}) {
  if (value == null || max <= min) return null;
  const span = max - min;
  const rawPct = ((value - min) / span) * 100;
  const pct = Math.min(100, Math.max(0, rawPct));
  const med =
    medianPpsf != null && Number.isFinite(medianPpsf) && medianPpsf > 0 ? medianPpsf : null;
  const medPct =
    med != null ? Math.min(100, Math.max(0, ((med - min) / span) * 100)) : null;
  const medLabel = med != null ? `$${Math.round(med).toLocaleString()}/SF` : null;
  return (
    <div className="mt-4 rounded-lg border border-[#dce9f4] bg-white px-3 py-3 sm:px-4">
      <p className="text-xs font-medium text-[var(--atlantic-navy)]">Price spectrum · {nhName}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-[var(--nantucket-gray)]">
        Active listings in this snapshot (low → high $/SF). Lower is the &ldquo;value&rdquo; end of the strip; higher
        reflects more dollars per foot in the mix. The median (P50) shows where the middle of the neighborhood list
        sits—not an outlier anchor.
      </p>
      <div className="relative mt-6 pb-3">
        {medPct != null && medLabel ? (
          <div
            className="absolute bottom-full left-0 z-[6] mb-1 -translate-x-1/2 text-center"
            style={{ left: `${medPct}%` }}
          >
            <span className="inline-block max-w-[9rem] rounded border border-[#074059]/25 bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-[var(--atlantic-navy)] shadow-sm">
              Median (P50)
              <span className="block font-bold tabular-nums text-[var(--atlantic-navy)]">{medLabel}</span>
            </span>
          </div>
        ) : null}
        <div
          className="h-3.5 w-full rounded-full bg-gradient-to-r from-emerald-200/90 via-amber-100 to-rose-200/90"
          aria-hidden
        />
        {medPct != null ? (
          <div
            className="absolute top-1/2 z-[5] h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#074059]/75"
            style={{ left: `${medPct}%` }}
            aria-hidden
          />
        ) : null}
        <div
          className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#074059] shadow-md ring-2 ring-[#074059]/25"
          style={{ left: `${pct}%` }}
          role="img"
          aria-label={`This home at about ${Math.round(pct)}% along ${nhName} active $/SF range from $${Math.round(min)} to $${Math.round(max)} per square foot`}
          title={`This home ≈ ${Math.round(pct)}% along the range ($${Math.round(min)}–$${Math.round(max)}/SF)`}
        />
      </div>
      <div className="mt-2 flex justify-between gap-2 text-[10px] font-medium tabular-nums text-[var(--nantucket-gray)]">
        <span>Low ${Math.round(min).toLocaleString()}/SF</span>
        <span className="text-center text-[var(--atlantic-navy)]">This home</span>
        <span>High ${Math.round(max).toLocaleString()}/SF</span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTip({ active, payload, label, footer, valueAsMoneyPerSf }: any) {
  if (!active || !payload?.length) return null;
  const fmtVal = (p: { value?: number; dataKey?: string }) => {
    if (typeof p.value !== "number") return p.value;
    if (valueAsMoneyPerSf || p.dataKey === "ppsf") return `$${p.value.toLocaleString()}/SF`;
    return p.value.toLocaleString();
  };
  return (
    <div className="rounded-md border border-[#e0e6ef] bg-white px-3 py-2 text-xs shadow-md max-w-xs">
      {label && <p className="font-semibold text-[var(--atlantic-navy)]">{label}</p>}
      {payload.map(
        (
          p: {
            name?: string;
            value?: number;
            color?: string;
            dataKey?: string;
            payload?: { metricFull?: string; benchVsThisNote?: string | null };
          },
          idx: number
        ) => (
          <p key={idx} className="text-[var(--nantucket-gray)]">
            <span className="inline-block h-2 w-2 rounded-full mr-1 align-middle" style={{ background: p.color }} />
            {p.name}: {fmtVal(p)}
            {p.payload?.benchVsThisNote ? (
              <span className="mt-1 block text-[11px] font-medium text-[var(--atlantic-navy)]">{p.payload.benchVsThisNote}</span>
            ) : null}
            {p.payload?.metricFull && idx === 0 ? (
              <span className="block text-[10px] text-[var(--nantucket-gray)]/90 mt-0.5">{p.payload.metricFull}</span>
            ) : null}
          </p>
        )
      )}
      {footer && <p className="mt-2 border-t border-[#eef2f7] pt-2 text-[10px] leading-snug text-[var(--nantucket-gray)]">{footer}</p>}
    </div>
  );
}

export function ListingBenchmarkDashboard({ payload }: Props) {
  const [open, setOpen] = useState(true);
  const { listing, island, neighborhood, dataTooltip, dataAsOfDateLabel } = payload;

  const nhName = listing.neighborhood;
  const blurbs = neighborhoodBenchmarkBlurb(nhName);

  const thisActivePpsf = listing.dollarPerSfList;
  const thisSoldPpsf = listing.dollarPerSfClose;
  const thisPpsfHighlight =
    listing.status === "Sold"
      ? thisSoldPpsf ?? thisActivePpsf
      : thisActivePpsf;

  const islandActiveAvg = island.avgActivePpsf;
  const islandSoldAvg = island.avgSoldPpsf;
  const nhActiveAvg = payload.nhAvgActivePpsf;
  const nhSoldAvg = payload.nhAvgSoldPpsf;

  const pctNhVsIslandSold = fmtPctDiff(nhSoldAvg, islandSoldAvg);
  /** Island “benchmark” for this home: sold 12 mo avg when present, else active island avg. */
  const islandBenchForPct = islandSoldAvg ?? islandActiveAvg;
  const pctThisVsIslandBench = fmtPctDiff(thisPpsfHighlight, islandBenchForPct);
  const benchActiveRow = nhActiveAvg ?? islandActiveAvg;
  const benchSoldRow = nhSoldAvg ?? islandSoldAvg;

  const ppsfVsNeighborhoodNote = useMemo(() => {
    const useActiveBench = listing.status !== "Sold" || thisActivePpsf != null;
    const subj = useActiveBench ? thisActivePpsf ?? thisPpsfHighlight : thisSoldPpsf ?? thisPpsfHighlight;
    const bench = useActiveBench ? nhActiveAvg : nhSoldAvg;
    const benchLabel = useActiveBench
      ? `current ${nhName} active average`
      : `${nhName} sold average (12 mo)`;
    if (subj == null || bench == null || bench <= 0) return null;
    const pct = Math.round(((subj - bench) / bench) * 1000) / 10;
    const abs = Math.abs(pct);
    const dir = pct >= 0 ? "above" : "below";
    const sign = pct > 0 ? "+" : "";
    return `This listing's $${subj.toLocaleString()}/SF is ${sign}${abs}% ${dir} ${benchLabel} (LINK data as of ${dataAsOfDateLabel}).`;
  }, [
    listing.status,
    thisActivePpsf,
    thisSoldPpsf,
    thisPpsfHighlight,
    nhActiveAvg,
    nhSoldAvg,
    nhName,
    dataAsOfDateLabel,
  ]);

  /** Bar colors: dark green = subject; teal/green = neighborhood; terracotta/orange = island. */
  const barPpsf = useMemo(() => {
    const BAR_THIS = "#14532d";
    const BAR_NH_ACTIVE = "#0d9488";
    const BAR_NH_SOLD = "#14a085";
    /** Island-wide: cool slate–blue (broader market), not warm red–orange (reads as “bad”). */
    const BAR_ISL_ACTIVE = "#5b7a9a";
    const BAR_ISL_SOLD = "#3f5f7c";
    const anchor = thisPpsfHighlight;
    const mk = (
      name: string,
      ppsf: number | null,
      fill: string,
      isThis: boolean,
    ): { name: string; ppsf: number; fill: string; benchVsThisNote: string | null } | null => {
      const v = ppsf ?? 0;
      if (v <= 0) return null;
      return {
        name,
        ppsf: v,
        fill,
        benchVsThisNote: isThis
          ? "Subject listing — anchor for other benchmarks."
          : benchVsThisListingPctNote(v, anchor),
      };
    };
    return [
      mk("This listing", thisPpsfHighlight, BAR_THIS, true),
      mk(`${nhName} active avg`, nhActiveAvg, BAR_NH_ACTIVE, false),
      mk("Island active avg", islandActiveAvg, BAR_ISL_ACTIVE, false),
      mk(`${nhName} sold avg (12 mo)`, nhSoldAvg, BAR_NH_SOLD, false),
      mk("Island sold avg (12 mo)", islandSoldAvg, BAR_ISL_SOLD, false),
    ].filter((d): d is NonNullable<typeof d> => d != null);
  }, [
    nhActiveAvg,
    nhSoldAvg,
    islandActiveAvg,
    islandSoldAvg,
    nhName,
    thisPpsfHighlight,
  ]);

  const ppsfBarTakeaway = useMemo(() => {
    const subj = thisPpsfHighlight;
    if (subj == null || subj <= 0) return null;
    const money = `$${Math.round(subj).toLocaleString()}`;
    const parts: string[] = [];
    const a = diffTakeawayClause(subj, nhActiveAvg ?? 0, `current ${nhName} active average`);
    if (a) parts.push(a);
    if (islandSoldAvg != null && islandSoldAvg > 0) {
      const b = diffTakeawayClause(subj, islandSoldAvg, "island sold averages (12 mo)");
      if (b) parts.push(b);
    } else if (islandActiveAvg != null && islandActiveAvg > 0) {
      const b = diffTakeawayClause(subj, islandActiveAvg, "island active average");
      if (b) parts.push(b);
    }
    if (!parts.length) return null;
    return `This listing’s ${money}/SF is ${parts.join(" and ")} (LINK data as of ${dataAsOfDateLabel}).`;
  }, [
    thisPpsfHighlight,
    nhActiveAvg,
    nhName,
    islandSoldAvg,
    islandActiveAvg,
    dataAsOfDateLabel,
  ]);

  const nhActivePpsfBracketNote = useMemo(() => {
    const subj = thisActivePpsf;
    const arr = neighborhood.activePpsf.filter((x) => x > 0);
    if (subj == null || subj <= 0 || arr.length < 8) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const atOrBelow = sorted.filter((x) => x <= subj).length;
    const lowerPct = Math.round((atOrBelow / sorted.length) * 100);
    if (lowerPct < 12 || lowerPct > 88) return null;
    return `Ranks in about the lower ${lowerPct}% of current ${nhName} active listings by $/SF in this snapshot—often read as competitive on price-per-foot; confirm against condition and micro-location.`;
  }, [thisActivePpsf, neighborhood.activePpsf, nhName]);

  const ppsfChartXMax = useMemo(() => {
    if (!barPpsf.length) return 1700;
    const m = Math.max(...barPpsf.map((d) => d.ppsf), 500);
    return Math.ceil(Math.max(m * 1.14, 1700) / 50) * 50;
  }, [barPpsf]);

  const ppsfBarChartAriaLabel = `Nantucket real estate price per square foot benchmark chart for ${listing.addressLine} vs ${nhName} and island averages – ${dataAsOfDateLabel}`;

  const homeAge =
    listing.yearBuilt != null ? new Date().getFullYear() - listing.yearBuilt : null;
  const islandMedYb = island.medianYearBuiltActive;
  const islandMedAge = island.medianAgeActive;
  const nhMedYb = payload.nhMedianYearBuilt;
  const nhMedAge = payload.nhMedianAge;

  const radarRows = useMemo(() => {
    const nPpsf = nhSoldAvg ?? nhActiveAvg ?? 0;
    const iPpsf = islandSoldAvg ?? islandActiveAvg ?? 0;
    const nAge = nhMedAge ?? 0;
    const iAge = islandMedAge ?? 0;
    const nLot = median(neighborhood.lotSqft) ?? 0;
    const iLot = island.medianLotSqftActive ?? 0;
    const nDom = median(neighborhood.domSold) ?? 0;
    const iDom = island.medianDomSold12 ?? 0;
    const scale = (a: number, b: number) => {
      const m = Math.max(a, b, 1);
      return { n: Math.round((a / m) * 100), i: Math.round((b / m) * 100) };
    };
    const a = scale(nPpsf, iPpsf);
    const b = scale(nAge, iAge);
    const c = scale(nLot, iLot);
    const d = scale(nDom, iDom);
    return [
      {
        metric: "$/SF (nh vs isl.)",
        metricFull: "Neighborhood vs island $/SF (sold avg where available, else active avg in slice)",
        nh: a.n,
        island: a.i,
      },
      {
        metric: "Typical age",
        metricFull: "Median home age (years) — active stock neighborhood vs island",
        nh: b.n,
        island: b.i,
      },
      {
        metric: "Lot (active med.)",
        metricFull: "Median lot size (SF) — active listings in neighborhood vs island active median",
        nh: c.n,
        island: c.i,
      },
      {
        metric: "DOM sold",
        metricFull: "Median days on market for sold closings (12 mo neighborhood vs island)",
        nh: d.n,
        island: d.i,
      },
    ];
  }, [
    nhSoldAvg,
    nhActiveAvg,
    islandSoldAvg,
    islandActiveAvg,
    nhMedAge,
    islandMedAge,
    neighborhood.lotSqft,
    neighborhood.domSold,
    island.medianLotSqftActive,
    island.medianDomSold12,
  ]);

  const nhActiveSpectrumMeta = useMemo(() => {
    const arr = neighborhood.activePpsf.filter((x) => x > 0);
    if (arr.length < 2) return null;
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    return { min, max, median: median(arr) };
  }, [neighborhood.activePpsf]);

  const domHighVelocity = useMemo(() => {
    const dom = listing.dom;
    if (dom == null || dom < 0) return false;
    const i = island.medianDomSold12;
    const t = payload.tierMedianDomSold;
    const refs = [i, t].filter((x): x is number => typeof x === "number" && x >= 30);
    if (refs.length === 0) return false;
    const marketRef = Math.max(...refs);
    if (marketRef < 40) return false;
    const threshold = Math.max(10, marketRef * 0.22);
    return dom < threshold;
  }, [listing.dom, island.medianDomSold12, payload.tierMedianDomSold]);

  const dist = neighborhood.soldPpsf;
  const showPercentiles = dist.length >= 20 && thisPpsfHighlight != null;
  const sorted = showPercentiles ? [...dist].sort((a, b) => a - b) : [];
  const p = (q: number) =>
    sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1)))]! : 0;

  const row3SubjectSignal = buyerSignalVsBench(thisPpsfHighlight, islandBenchForPct);
  const row3Tone = signalToneClasses(row3SubjectSignal);

  return (
    <section className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-white shadow-sm overflow-hidden print:overflow-visible">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="listing-print-hide flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-6 hover:bg-[var(--sandstone)]/50 transition-colors">
          <div>
            <h2 className="text-lg font-semibold text-[var(--atlantic-navy)]">
              Nantucket value context
            </h2>
            <p className="mt-0.5 text-sm text-[var(--nantucket-gray)]">
              How this listing compares to island and {nhName} benchmarks · {dataAsOfDateLabel}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-[var(--nantucket-gray)] transition-transform",
              open && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="print:block">
          <div className="border-t border-[#e8edf4] px-4 pb-6 pt-2 sm:px-6 space-y-10">
            <p className="text-xs text-[var(--nantucket-gray)]">{dataTooltip}</p>

            {payload.marketPulseBullets.length > 0 ? (
              <div className="rounded-lg border border-[#e0e6ef] bg-[var(--sandstone)]/35 px-4 py-3">
                <h3 className="text-sm font-semibold text-[var(--atlantic-navy)]">Current market snapshot</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-[var(--nantucket-gray)]">
                  {payload.marketPulseBullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* A — $/SF */}
            <div>
              <h3 className="text-base font-semibold text-[var(--atlantic-navy)]">
                A. Price per square foot
              </h3>
              <p className="mt-1 text-sm text-[var(--nantucket-gray)]">
                Active listings as of {dataAsOfDateLabel}. Sold metrics: past 12 months closes. Green vs amber cues
                assume lower $/SF is more buyer-friendly for the same livable square footage—always pair with condition,
                location, and lot.
              </p>
              {nhActiveSpectrumMeta ? (
                <NhActivePpsfSpectrum
                  min={nhActiveSpectrumMeta.min}
                  max={nhActiveSpectrumMeta.max}
                  medianPpsf={nhActiveSpectrumMeta.median}
                  value={thisPpsfHighlight}
                  nhName={nhName}
                />
              ) : null}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#e8edf4] text-left text-[var(--nantucket-gray)]">
                      <th className="py-2.5 pr-2 pl-1 text-xs font-semibold uppercase tracking-wide">Metric</th>
                      <th className={cn(subjectColTh, "text-sm tracking-tight")}>This property</th>
                      <th className="py-2.5 pr-2 text-xs font-semibold uppercase tracking-wide">{nhName} avg</th>
                      <th className="py-2.5 pr-1 text-xs font-semibold uppercase tracking-wide">Island-wide avg</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    <tr className="border-b border-[#eef2f7]">
                      <td className="py-2.5 pr-2 pl-1 font-medium text-[var(--atlantic-navy)]">Asking price / SF</td>
                      <td className={cn(subjectColTd, "font-bold")}>
                        <div>{fmtMoneySf(thisActivePpsf)}</div>
                        <PpsfVsAreaChip
                          subject={thisActivePpsf}
                          bench={benchActiveRow}
                          areaLabel={nhActiveAvg != null ? `${nhName} active avg` : "island active avg"}
                        />
                      </td>
                      <td className="py-2.5 pr-2">{fmtMoneySf(nhActiveAvg)}</td>
                      <td className="py-2.5 pr-1">{fmtMoneySf(islandActiveAvg)}</td>
                    </tr>
                    <tr className="border-b border-[#eef2f7]">
                      <td className="py-2.5 pr-2 pl-1 font-medium text-[var(--atlantic-navy)]">
                        Market value (solds) / SF
                      </td>
                      <td className={cn(subjectColTd, "font-bold")}>
                        <div>{fmtMoneySf(thisSoldPpsf)}</div>
                        <PpsfVsAreaChip
                          subject={thisSoldPpsf}
                          bench={benchSoldRow}
                          areaLabel={nhSoldAvg != null ? `${nhName} sold avg` : "island sold avg"}
                        />
                      </td>
                      <td className="py-2.5 pr-2">{fmtMoneySf(nhSoldAvg)}</td>
                      <td className="py-2.5 pr-1">{fmtMoneySf(islandSoldAvg)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-2 pl-1 align-top font-medium text-[var(--atlantic-navy)]">
                        <span className="block">Δ vs island benchmark</span>
                        <span className="mt-0.5 block text-[10px] font-normal normal-case leading-snug text-[var(--nantucket-gray)]">
                          Same basis as value score: sold 12 mo island avg when available, else active island avg.
                          Neighborhood column stays sold-vs-sold when both exist.
                        </span>
                      </td>
                      <td className={cn(subjectColTd, "align-top")}>
                        {pctThisVsIslandBench === "—" ? (
                          "—"
                        ) : (
                          <>
                            <span
                              className={cn(
                                "inline-block rounded-md px-2 py-1 text-lg font-bold tabular-nums sm:text-xl",
                                row3Tone.wrap,
                              )}
                            >
                              {pctThisVsIslandBench}
                            </span>
                            <span className="mt-1.5 block text-[10px] font-semibold leading-tight text-[var(--nantucket-gray)]">
                              {row3SubjectSignal === "favorable"
                                ? "Below island benchmark"
                                : row3SubjectSignal === "neutral"
                                  ? "Near island benchmark"
                                  : "Above island benchmark"}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="py-2.5 pr-2 align-top">{pctNhVsIslandSold}</td>
                      <td className="py-2.5 pr-1 text-[var(--nantucket-gray)]">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-lg border border-[#e8edf4] px-3 py-2.5 text-sm">
                <div className="flex flex-wrap items-center gap-2 gap-y-1.5">
                  <p className="font-semibold text-[var(--atlantic-navy)]">Market velocity &amp; comparison</p>
                  {domHighVelocity ? (
                    <span className="inline-flex items-center rounded-full border border-amber-400/70 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
                      New listing · High velocity
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-[11px] leading-snug text-[var(--nantucket-gray)]">
                  vs typical time-on-market for recent solds in this snapshot—useful when price looks attractive but
                  inventory is moving quickly.
                </p>
                <ul className="mt-1.5 space-y-1 text-xs text-[var(--nantucket-gray)] tabular-nums">
                  <li>
                    This listing DOM:{" "}
                    <span className="font-semibold text-[var(--atlantic-navy)]">
                      {listing.dom != null ? `${listing.dom} days` : "—"}
                    </span>
                  </li>
                  <li>
                    Median DOM (sold, island 12 mo):{" "}
                    <span className="font-semibold text-[var(--atlantic-navy)]">
                      {island.medianDomSold12 != null ? `${island.medianDomSold12} days` : "—"}
                    </span>
                  </li>
                  <li>
                    Median DOM (sold, your price tier, 12 mo):{" "}
                    <span className="font-semibold text-[var(--atlantic-navy)]">
                      {payload.tierMedianDomSold != null ? `${payload.tierMedianDomSold} days` : "—"}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[#e8edf4] pb-3 text-[11px] font-medium text-[var(--atlantic-navy)]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-6 shrink-0 rounded-sm bg-[#14532d]" aria-hidden />
                  This listing
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-6 shrink-0 rounded-sm bg-[#0d9488]" aria-hidden />
                  {nhName} (local market)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-6 shrink-0 rounded-sm bg-[#4f6d8c]" aria-hidden />
                  Island-wide
                </span>
              </div>
              <div
                className="mt-4 h-[22rem] min-h-[280px] w-full min-w-0 print:h-56 sm:h-[26rem]"
                role="figure"
                aria-label={ppsfBarChartAriaLabel}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={barPpsf} margin={{ left: 8, right: 16, top: 14, bottom: 44 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8edf4" vertical horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, ppsfChartXMax]}
                      tickFormatter={(v) => `$${v}`}
                      fontSize={11}
                      ticks={[0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000].filter((t) => t <= ppsfChartXMax)}
                      label={{
                        value: "Price per Square Foot ($)",
                        position: "insideBottom",
                        offset: -22,
                        fill: "#6D7380",
                        fontSize: 11,
                      }}
                    />
                    <YAxis type="category" dataKey="name" width={156} tick={{ fontSize: 11 }} interval={0} />
                    {[500, 1000, 1500].map((x) =>
                      x <= ppsfChartXMax ? (
                        <ReferenceLine
                          key={x}
                          x={x}
                          stroke="#94a3b8"
                          strokeDasharray="5 5"
                          strokeOpacity={0.7}
                        />
                      ) : null,
                    )}
                    <Tooltip
                      cursor={{ fill: "rgba(7, 64, 89, 0.06)" }}
                      content={
                        <ChartTip
                          valueAsMoneyPerSf
                          footer="Hover shows % vs this listing’s $/SF. Bar labels show dollars per SF. Higher $/SF is not “better”—it is context for location, condition, and lot."
                        />
                      }
                    />
                    <Bar dataKey="ppsf" radius={[0, 4, 4, 0]} isAnimationActive={false} maxBarSize={34}>
                      {barPpsf.map((e, idx) => (
                        <Cell key={idx} fill={e.fill} />
                      ))}
                      <LabelList
                        dataKey="ppsf"
                        position="insideRight"
                        offset={-6}
                        fill="#ffffff"
                        fontSize={11}
                        fontWeight={700}
                        formatter={(v: number | string) => {
                          const n = typeof v === "number" ? v : Number(v);
                          if (!Number.isFinite(n) || n <= 0) return "";
                          return `$${Math.round(n).toLocaleString()}`;
                        }}
                        style={{
                          paintOrder: "stroke fill",
                          stroke: "rgba(0,0,0,0.28)",
                          strokeWidth: 2.5,
                          strokeLinejoin: "round",
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {ppsfBarTakeaway ? (
                <p className="mt-3 text-sm font-bold leading-snug text-[var(--atlantic-navy)]">{ppsfBarTakeaway}</p>
              ) : ppsfVsNeighborhoodNote ? (
                <p className="mt-3 text-sm font-bold leading-snug text-[var(--atlantic-navy)]">{ppsfVsNeighborhoodNote}</p>
              ) : null}
              {ppsfBarTakeaway && ppsfVsNeighborhoodNote ? (
                <p className="mt-2 text-xs font-medium leading-snug text-[var(--nantucket-gray)]">{ppsfVsNeighborhoodNote}</p>
              ) : null}
              {nhActivePpsfBracketNote ? (
                <p className="mt-2 text-xs font-semibold leading-snug text-[var(--atlantic-navy)]">{nhActivePpsfBracketNote}</p>
              ) : null}
              {payload.nhPpsfPercentileNote ? (
                <p className="mt-2 text-xs leading-relaxed text-[var(--atlantic-navy)]/90">
                  <span className="font-semibold text-[var(--atlantic-navy)]">Sold cohort: </span>
                  {payload.nhPpsfPercentileNote}
                </p>
              ) : null}
              {showPercentiles && (
                <div className="mt-4 rounded-lg border border-dashed border-[#cfd8e6] bg-[var(--sandstone)]/40 p-3 text-xs text-[var(--atlantic-navy)]">
                  <p className="font-medium">Neighborhood sold $/SF distribution · snapshot (n={dist.length})</p>
                  <p className="mt-1 text-[var(--nantucket-gray)]">
                    P25 {fmtMoneySf(p(0.25))} · P50 {fmtMoneySf(p(0.5))} · P75{" "}
                    {fmtMoneySf(p(0.75))} · This listing {fmtMoneySf(thisPpsfHighlight)}
                  </p>
                </div>
              )}
            </div>

            {/* B — Year built */}
            <div>
              <h3 className="text-base font-semibold text-[var(--atlantic-navy)]">
                B. Year built & home age
              </h3>
              <p className="mt-1 text-sm text-[var(--nantucket-gray)]">
                This home: built {listing.yearBuilt ?? "—"} → age {homeAge != null ? `${homeAge} yr` : "—"}.
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-[#e8edf4] text-left text-[var(--nantucket-gray)]">
                      <th className="py-2 pr-2 font-medium">Metric</th>
                      <th className="py-2 pr-2 font-medium">This</th>
                      <th className="py-2 pr-2 font-medium">{nhName}</th>
                      <th className="py-2 pr-2 font-medium">Island</th>
                      <th className="py-2 font-medium">Price-tier (sold 12 mo)</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    <tr className="border-b border-[#eef2f7]">
                      <td className="py-2 pr-2">Year built</td>
                      <td className="py-2 pr-2">{listing.yearBuilt ?? "—"}</td>
                      <td className="py-2 pr-2">{nhMedYb ?? "—"}</td>
                      <td className="py-2 pr-2">{islandMedYb ?? "—"}</td>
                      <td className="py-2">{payload.tierYearBuiltRange ?? "—"}</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-2">Age (years)</td>
                      <td className="py-2 pr-2">{homeAge ?? "—"}</td>
                      <td className="py-2 pr-2">{nhMedAge ?? "—"}</td>
                      <td className="py-2 pr-2">{islandMedAge ?? "—"}</td>
                      <td className="py-2">{payload.tierMedianAgeRange ?? "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[var(--nantucket-gray)]">
                Nantucket&apos;s housing stock skews older—many island parcels carry pre-1940 origins in the
                assessor file, while new construction or major rehabs can command premiums in higher price tiers.
                Homes from the same build cohort in {nhName} have often seen strong value when kitchens, baths, and
                mechanicals were updated—compare to recent sold comps in LINK, not list copy alone.
                Source mix: LINK fields + sold cohort by price band (sparse tiers show “—”).
              </p>
            </div>

            {/* C — Neighborhood card + radar */}
            <div>
              <h3 className="text-base font-semibold text-[var(--atlantic-navy)]">
                C. {nhName} vs. rest of the island
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-[#e8edf4] bg-[var(--sandstone)]/30 p-4 text-sm min-w-0">
                  <p className="font-semibold text-[var(--atlantic-navy)]">{nhName} profile</p>
                  <ul className="mt-2 space-y-1.5 text-[var(--nantucket-gray)]">
                    <li>
                      Avg $ / SF (active): {fmtMoneySf(nhActiveAvg)} vs island {fmtMoneySf(islandActiveAvg)}
                    </li>
                    <li>
                      Median sold $ / SF (12 mo): {fmtMoneySf(nhSoldAvg)} vs island{" "}
                      {fmtMoneySf(islandSoldAvg)}
                    </li>
                    <li>Typical age (median, active stock in area): {nhMedAge ?? "—"} yr vs island {islandMedAge ?? "—"}</li>
                    <li className="text-[var(--atlantic-navy)]">{blurbs.traits}</li>
                  </ul>
                  {blurbs.valueContext ? (
                    <p className="mt-3 text-xs leading-relaxed text-[var(--atlantic-navy)]/90 border-t border-[#e0e6ef] pt-3">
                      <span className="font-medium text-[var(--atlantic-navy)]">Why it matters: </span>
                      {blurbs.valueContext}
                    </p>
                  ) : null}
                </div>
                <div className="h-72 print:h-56 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarRows}>
                      <PolarGrid stroke="#e0e6ef" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: "#6D7380" }} />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fontSize: 8, fill: "#8b95a8" }}
                        tickCount={5}
                        axisLine={false}
                      />
                      <Radar
                        name={nhName}
                        dataKey="nh"
                        stroke="#15A5E5"
                        fill="#15A5E5"
                        fillOpacity={0.35}
                      />
                      <Radar name="Island" dataKey="island" stroke="#074059" fill="#074059" fillOpacity={0.2} />
                      <Legend
                        wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
                        iconType="circle"
                        formatter={(value) => <span className="text-[var(--atlantic-navy)]">{value}</span>}
                      />
                      <Tooltip
                        content={
                          <ChartTip footer="Axes are scaled 0–100 within each metric so shapes are comparable; see tables for raw numbers." />
                        }
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-1.5 text-xs font-medium text-[var(--atlantic-navy)] lg:hidden print:hidden">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#15A5E5]" aria-hidden />
                    {nhName}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#074059]" aria-hidden />
                    Island
                  </span>
                </div>
              </div>
              <p className="mt-2 text-[10px] leading-snug text-[var(--nantucket-gray)]">
                Radar: each spoke is an indexed 0–100 score within that metric so neighborhood vs island shape is
                comparable; tooltips and profile bullets carry the definitions. Raw dollars, days, and SF appear in
                section A and the profile list—not on the radius scale.
              </p>
              {payload.valueContextTakeaway ? (
                <p className="mt-3 rounded-md border border-dashed border-[#cfd8e6] bg-white/80 px-3 py-2 text-xs leading-relaxed text-[var(--atlantic-navy)]">
                  <span className="font-semibold">Takeaway: </span>
                  {payload.valueContextTakeaway}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-[var(--nantucket-gray)]">
                Five-year appreciation axis: pending longer historical series—will layer in as the database grows.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
