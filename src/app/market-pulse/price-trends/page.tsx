"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

type HistoryPoint = {
  month: string;
  year: number;
  monthKey: string;
  medianPrice: number;
  avgPrice: number;
  soldCount: number;
  medianDaysOnMarket: number;
  saleToListRatio: number | null;
};

type TierPoint = {
  range: string;
  persona: string;
  activeCount: number;
  sharePct: number;
  yoyPct: number | null;
};

type MarketStats = {
  activeListingCount: number;
  medianListPrice: number | null;
  avgListPrice: number | null;
  medianDaysOnMarket: number | null;
};

type NeighborhoodPoint = {
  name: string;
  salesCount: number;
  avgSalePrice: number;
  totalVolume: number;
};

type PulseSummary = {
  activeInventory: number;
  medianSalePrice6mo: number | null;
  medianDaysOnMarket12mo: number | null;
  absorptionRate: number | null;
};

function formatCurrency(value: number | null): string {
  if (!value) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  return `$${Math.round(value).toLocaleString()}`;
}

function formatPct(value: number | null): string {
  if (value === null) return "n/a";
  return `${value > 0 ? "+" : ""}${value}%`;
}

function toTrendMeta(value: number | null) {
  if (value === null) return { icon: null, color: "text-[var(--nantucket-gray)]" };
  if (value >= 0) return { icon: ArrowUpRight, color: "text-emerald-600" };
  return { icon: ArrowDownRight, color: "text-amber-600" };
}

export default function PriceTrendsPage() {
  const [rangeYears, setRangeYears] = useState<3 | 10 | 20>(3);
  const [propertyType, setPropertyType] = useState<"all" | "single family" | "condo" | "land">("all");
  const [neighborhood, setNeighborhood] = useState<string>("all");
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [tiers, setTiers] = useState<TierPoint[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodPoint[]>([]);
  const [pulseSummary, setPulseSummary] = useState<PulseSummary | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [historyRes, statsRes, tiersRes, pulseRes, neighborhoodsRes] = await Promise.all([
          fetch(
            `/api/market-history?years=${rangeYears}&propertyType=${encodeURIComponent(
              propertyType,
            )}&neighborhood=${encodeURIComponent(neighborhood)}`,
          ),
          fetch("/api/market-stats"),
          fetch("/api/price-tier-insights"),
          fetch("/api/pulse-summary"),
          fetch(`/api/neighborhood-sales?years=${rangeYears}`),
        ]);

        const historyJson = await historyRes.json();
        const statsJson = await statsRes.json();
        const tiersJson = await tiersRes.json();
        const pulseJson = await pulseRes.json();
        const neighborhoodsJson = await neighborhoodsRes.json();

        if (!mounted) return;

        if (!historyRes.ok || !statsRes.ok || !tiersRes.ok || !pulseRes.ok || !neighborhoodsRes.ok) {
          throw new Error(
            historyJson.error ||
              statsJson.error ||
              tiersJson.error ||
              pulseJson.error ||
              neighborhoodsJson.error ||
              "Failed to load price trends",
          );
        }

        setHistory(historyJson.data ?? []);
        setStats(statsJson.data?.aggregates ?? null);
        setTiers(tiersJson.data ?? []);
        setNeighborhoods((neighborhoodsJson.data ?? []).slice(0, 8));
        setPulseSummary(pulseJson.data ?? null);
        setLastUpdated(tiersJson.lastUpdated ?? new Date().toISOString());
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Unable to load trends");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [rangeYears, propertyType, neighborhood]);

  const hero = useMemo(() => {
    if (history.length < 2) {
      return {
        islandMedian: null as number | null,
        islandMedianYoY: null as number | null,
        velocityDom: stats?.medianDaysOnMarket ?? null,
        velocityDelta: null as number | null,
        supplyMonths: null as number | null,
      };
    }
    const latest = history[history.length - 1];
    const priorYearMatch = history.find((h) => h.month === latest.month && h.year === latest.year - 1);
    const islandMedianYoY =
      priorYearMatch && priorYearMatch.medianPrice > 0
        ? Math.round(((latest.medianPrice - priorYearMatch.medianPrice) / priorYearMatch.medianPrice) * 100)
        : null;

    const latestDom = latest.medianDaysOnMarket || null;
    const priorDom = priorYearMatch?.medianDaysOnMarket || null;
    const velocityDelta =
      latestDom !== null && priorDom !== null ? latestDom - priorDom : null;

    const recent = history.slice(-12);
    const avgMonthlySales =
      recent.length > 0
        ? recent.reduce((sum, p) => sum + p.soldCount, 0) / recent.length
        : 0;
    const supplyMonths =
      stats?.activeListingCount && avgMonthlySales > 0
        ? Number((stats.activeListingCount / avgMonthlySales).toFixed(1))
        : null;

    return {
      islandMedian: pulseSummary?.medianSalePrice6mo ?? latest.medianPrice,
      islandMedianYoY,
      velocityDom: pulseSummary?.medianDaysOnMarket12mo ?? latestDom,
      velocityDelta,
      supplyMonths: pulseSummary?.absorptionRate ?? supplyMonths,
    };
  }, [history, stats, pulseSummary]);

  const stale = useMemo(() => {
    if (!lastUpdated) return false;
    const ageMs = Date.now() - new Date(lastUpdated).getTime();
    return ageMs > 30 * 24 * 60 * 60 * 1000;
  }, [lastUpdated]);

  const chartData = history.map((p) => ({
    label: `${p.month}-${String(p.year).slice(-2)}`,
    median: p.medianPrice,
    average: p.avgPrice,
    saleToListRatio: p.saleToListRatio,
  }));

  const buyVsBuild = useMemo(() => {
    const median = hero.islandMedian ?? 0;
    const midpointBuild = 2_700_000;
    const signal = median > midpointBuild ? "Buy" : "Build";
    return { median, midpointBuild, signal };
  }, [hero.islandMedian]);

  const marketReportSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Nantucket Price Trends",
      description:
        "Nantucket real estate market trends including median price, DOM, supply, and tier distribution.",
      creator: {
        "@type": "Organization",
        name: "NantucketHouses.com",
      },
      license: "https://nantuckethouses.com",
      keywords: [
        "Nantucket real estate market trends 2026",
        "Nantucket median home price",
        "Nantucket luxury real estate tiers",
      ],
    }),
    [],
  );

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(marketReportSchema) }}
      />
      <section className="bg-[var(--atlantic-navy)] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-white/60 text-xs uppercase tracking-[0.25em] font-semibold mb-2 font-sans">
            Nantucket Premium
          </p>
          <h1 className="text-white text-3xl sm:text-4xl">Price Trends</h1>
          <p className="text-white/55 mt-2 text-sm max-w-3xl">
            Macro-to-micro market pricing intelligence with live trendlines and tier segmentation.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-md px-3 py-1.5 text-xs text-white/80">
            <span>
              Last Updated:{" "}
              {lastUpdated
                ? new Date(lastUpdated).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </span>
            <span>•</span>
            <span>Source: LINK MLS + Proprietary Data</span>
            {stale && (
              <>
                <span>•</span>
                <span className="text-amber-300">Data refresh recommended</span>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="brand-surface p-5">
              <p className="text-xs uppercase tracking-wider text-[var(--nantucket-gray)] font-sans">Island Median</p>
              <p className="text-3xl text-[var(--atlantic-navy)] mt-1">{formatCurrency(hero.islandMedian)}</p>
              <div className={`mt-2 text-sm flex items-center gap-1 ${toTrendMeta(hero.islandMedianYoY).color}`}>
                {toTrendMeta(hero.islandMedianYoY).icon && (
                  (() => {
                    const Icon = toTrendMeta(hero.islandMedianYoY).icon!;
                    return <Icon className="w-4 h-4" />;
                  })()
                )}
                <span>{formatPct(hero.islandMedianYoY)} YoY</span>
              </div>
            </div>
            <div className="brand-surface p-5">
              <p className="text-xs uppercase tracking-wider text-[var(--nantucket-gray)] font-sans">Velocity</p>
              <p className="text-3xl text-[var(--atlantic-navy)] mt-1">
                {hero.velocityDom ? `${hero.velocityDom} Days` : "—"}
              </p>
              <div className={`mt-2 text-sm flex items-center gap-1 ${toTrendMeta(hero.velocityDelta === null ? null : -hero.velocityDelta).color}`}>
                {hero.velocityDelta !== null &&
                  (() => {
                    const Icon = toTrendMeta(-hero.velocityDelta).icon!;
                    return <Icon className="w-4 h-4" />;
                  })()}
                <span>
                  {hero.velocityDelta === null
                    ? "No comparison"
                    : `${hero.velocityDelta > 0 ? "+" : ""}${hero.velocityDelta} days vs last year`}
                </span>
              </div>
            </div>
            <div className="brand-surface p-5">
              <p className="text-xs uppercase tracking-wider text-[var(--nantucket-gray)] font-sans">Supply</p>
              <p className="text-3xl text-[var(--atlantic-navy)] mt-1">
                {hero.supplyMonths ? `~${hero.supplyMonths} Months` : "—"}
              </p>
              <div className="mt-2 text-sm text-emerald-700">
                {hero.supplyMonths && hero.supplyMonths <= 4
                  ? "Strong Seller's Market"
                  : hero.supplyMonths && hero.supplyMonths <= 7
                  ? "Balanced Market"
                  : "Buyer-Leaning"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="brand-surface p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg sm:text-xl text-[var(--atlantic-navy)]">Median vs Average Price Trend</h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-[var(--sandstone)] rounded-md p-1">
                  {[3, 10, 20].map((years) => (
                    <button
                      key={years}
                      onClick={() => setRangeYears(years as 3 | 10 | 20)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold ${
                        rangeYears === years
                          ? "bg-[var(--privet-green)] text-white"
                          : "text-[var(--atlantic-navy)]/60 hover:bg-white"
                      }`}
                    >
                      {years}Y
                    </button>
                  ))}
                </div>
                <select
                  value={propertyType}
                  onChange={(e) =>
                    setPropertyType(
                      e.target.value as "all" | "single family" | "condo" | "land",
                    )
                  }
                  className="text-xs rounded-md border border-[var(--cedar-shingle)]/20 px-2.5 py-2 bg-white text-[var(--atlantic-navy)]"
                >
                  <option value="all">All Types</option>
                  <option value="single family">Single Family</option>
                  <option value="condo">Condo</option>
                  <option value="land">Land</option>
                </select>
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="text-xs rounded-md border border-[var(--cedar-shingle)]/20 px-2.5 py-2 bg-white text-[var(--atlantic-navy)]"
                >
                  <option value="all">All Neighborhoods</option>
                  {neighborhoods.map((n) => (
                    <option key={n.name} value={n.name.toLowerCase()}>
                      {n.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => window.print()}
                  className="text-xs rounded-md border border-[var(--cedar-shingle)]/20 px-2.5 py-2 bg-white text-[var(--atlantic-navy)] hover:bg-[var(--sandstone)]"
                >
                  Export PDF
                </button>
              </div>
            </div>

            <div className="h-[320px]">
              {isLoading ? (
                <div className="h-full animate-pulse bg-[var(--sandstone)] rounded-md" />
              ) : error ? (
                <div className="h-full flex items-center justify-center text-sm text-red-600">{error}</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6D7380" }} />
                    <YAxis tickFormatter={(v) => `$${Math.round(v / 1_000_000)}M`} tick={{ fontSize: 11, fill: "#6D7380" }} />
                    <Tooltip
                      formatter={(v: number, name: string) => [formatCurrency(v), name === "median" ? "Median" : "Average"]}
                    />
                    <Legend formatter={(value) => (value === "median" ? "Median Price" : "Average Price")} />
                    <Line type="monotone" dataKey="median" stroke="#074059" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="average" stroke="#15A5E5" strokeWidth={2.5} dot={false} strokeDasharray="6 4" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="brand-surface p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl text-[var(--atlantic-navy)] mb-1">Price Tier Distribution</h2>
            <p className="text-sm text-[var(--nantucket-gray)] mb-4">
              Segment mix by active listings with year-over-year sales change by tier.
            </p>

            <div className="space-y-3">
              {tiers.map((tier) => (
                <div key={tier.range} className="rounded-md border border-[var(--cedar-shingle)]/15 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[var(--atlantic-navy)]">{tier.range}</p>
                      <p className="text-xs text-[var(--nantucket-gray)]">{tier.persona}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[var(--atlantic-navy)]">{tier.sharePct}% of active listings</p>
                      <p className={`text-xs ${toTrendMeta(tier.yoyPct).color}`}>YoY sales: {formatPct(tier.yoyPct)}</p>
                    </div>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[var(--sandstone)]">
                    <div
                      className="h-2 rounded-full bg-[var(--privet-green)]"
                      style={{ width: `${Math.max(2, tier.sharePct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            </div>

            <div className="brand-surface p-5 sm:p-6">
              <h2 className="text-lg sm:text-xl text-[var(--atlantic-navy)] mb-1">Sale-to-List Expectation Gap</h2>
              <p className="text-sm text-[var(--nantucket-gray)] mb-4">
                Tracks discount/premium behavior between ask and final close.
              </p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6D7380" }} />
                    <YAxis domain={[70, 110]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#6D7380" }} />
                    <Tooltip formatter={(v: number) => [`${v?.toFixed?.(1) ?? v}%`, "Sale-to-List Ratio"]} />
                    <ReferenceLine y={100} stroke="#6D7380" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="saleToListRatio" stroke="#074059" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="brand-surface p-5 sm:p-6">
              <h2 className="text-lg sm:text-xl text-[var(--atlantic-navy)] mb-1">Buy vs Build Index</h2>
              <p className="text-sm text-[var(--nantucket-gray)] mb-4">
                Benchmarks current median pricing against a typical new-build cost envelope.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--sandstone)] rounded-md p-4">
                  <p className="text-xs uppercase tracking-wider text-[var(--nantucket-gray)] font-sans">Median Sale</p>
                  <p className="text-xl text-[var(--atlantic-navy)] mt-1">{formatCurrency(buyVsBuild.median)}</p>
                </div>
                <div className="bg-[var(--sandstone)] rounded-md p-4">
                  <p className="text-xs uppercase tracking-wider text-[var(--nantucket-gray)] font-sans">Est. Build Cost</p>
                  <p className="text-xl text-[var(--atlantic-navy)] mt-1">$1.8M–$3.6M</p>
                </div>
              </div>
              <p className="text-sm mt-4 text-[var(--atlantic-navy)]/80">
                Current signal:{" "}
                <span className="font-semibold">
                  {buyVsBuild.signal}-leaning
                </span>{" "}
                for many turnkey buyers, given elevated construction costs.
              </p>
            </div>

            <div className="brand-surface p-5 sm:p-6">
              <h2 className="text-lg sm:text-xl text-[var(--atlantic-navy)] mb-1">Neighborhood Deep Dive</h2>
              <p className="text-sm text-[var(--nantucket-gray)] mb-4">
                Top neighborhoods by transaction volume for the selected range.
              </p>
              <div className="space-y-2">
                {neighborhoods.slice(0, 6).map((n) => (
                  <div key={n.name} className="flex items-center justify-between bg-[var(--sandstone)] rounded-md px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--atlantic-navy)]">{n.name}</p>
                      <p className="text-xs text-[var(--nantucket-gray)]">{n.salesCount} sales</p>
                    </div>
                    <p className="text-sm text-[var(--atlantic-navy)]">{formatCurrency(n.avgSalePrice)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[var(--atlantic-navy)] rounded-lg p-6 sm:p-8 text-white">
            <h3 className="text-xl sm:text-2xl mb-2">Custom Valuation Report</h3>
            <p className="text-white/70 text-sm mb-5 max-w-2xl">
              Is your property outperforming its tier? Request a custom valuation report with
              absorption context, tier comps, and pricing strategy.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/opportunities/wanted-to-buy"
                className="inline-flex items-center justify-center bg-[var(--privet-green)] text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-[var(--privet-green)]/90 transition-colors"
              >
                Request Custom Valuation
              </Link>
              <a
                href="mailto:stephen@maury.net?subject=Download%20Full%20Q1%202026%20Report"
                className="inline-flex items-center justify-center bg-white/10 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-white/20 transition-colors"
              >
                Download Full Q1 2026 Report
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
