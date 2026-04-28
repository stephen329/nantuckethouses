"use client";

import { useEffect, useState, useMemo } from "react";
import { Activity, DollarSign, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";
import { PriceTrendChart } from "@/components/charts/PriceTrendChart";
import { InventoryChart } from "@/components/charts/InventoryChart";
import { DaysOnMarketChart } from "@/components/charts/DaysOnMarketChart";
import { PriceDistributionChart } from "@/components/charts/PriceDistributionChart";
import { NeighborhoodSalesTable } from "@/components/charts/NeighborhoodSalesTable";
import { WhaleWatch } from "@/components/home/WhaleWatch";
import type { WhaleWatchSale } from "@/types";

type MonthlyData = {
  month: string;
  year: number;
  medianPrice: number;
  avgPrice: number;
  soldCount: number;
  medianDaysOnMarket: number;
};

type DistributionData = {
  range: string;
  count: number;
  percentage: number;
};

type NeighborhoodSales = {
  name: string;
  salesCount: number;
  avgSalePrice: number;
  totalVolume: number;
};

type MarketStats = {
  activeListingCount: number;
  medianListPrice: number | null;
  avgListPrice: number | null;
  medianDaysOnMarket: number | null;
};

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export default function MarketPulsePage() {
  const [years, setYears] = useState(3);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [historyData, setHistoryData] = useState<MonthlyData[]>([]);
  const [priceDistribution, setPriceDistribution] = useState<DistributionData[]>([]);
  const [neighborhoodSales, setNeighborhoodSales] = useState<NeighborhoodSales[]>([]);
  const [whaleWatchSales, setWhaleWatchSales] = useState<WhaleWatchSale[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isDistLoading, setIsDistLoading] = useState(true);
  const [isNeighborhoodLoading, setIsNeighborhoodLoading] = useState(true);
  const [isWhaleLoading, setIsWhaleLoading] = useState(true);
  const [totalSold, setTotalSold] = useState<number | undefined>();

  // Absorption rate
  const absorptionRate = useMemo(() => {
    if (!stats || historyData.length === 0) return null;
    const recentMonths = historyData.slice(-12);
    const totalRecentSales = recentMonths.reduce((sum, d) => sum + (d.soldCount || 0), 0);
    const avgMonthlySales = recentMonths.length > 0 ? totalRecentSales / recentMonths.length : 0;
    return avgMonthlySales > 0 ? stats.activeListingCount / avgMonthlySales : null;
  }, [stats, historyData]);

  // Fetch stats + distribution + whale watch (once on mount)
  useEffect(() => {
    async function fetchOnce() {
      try {
        const [statsRes, distRes, whaleRes] = await Promise.all([
          fetch("/api/market-stats"),
          fetch("/api/price-distribution"),
          fetch("/api/whale-watch"),
        ]);
        const statsJson = await statsRes.json();
        const distJson = await distRes.json();
        const whaleJson = await whaleRes.json();

        if (statsJson.data?.aggregates) setStats(statsJson.data.aggregates);
        if (distJson.data) setPriceDistribution(distJson.data);
        if (whaleJson.data) setWhaleWatchSales(whaleJson.data);
      } catch (e) {
        console.error("Failed to fetch static data:", e);
      } finally {
        setIsStatsLoading(false);
        setIsDistLoading(false);
        setIsWhaleLoading(false);
      }
    }
    fetchOnce();
  }, []);

  // Fetch history + neighborhood data (on year change)
  useEffect(() => {
    async function fetchTimeSensitive() {
      setIsHistoryLoading(true);
      setIsNeighborhoodLoading(true);
      try {
        const [histRes, neighRes] = await Promise.all([
          fetch(`/api/market-history?years=${years}`),
          fetch(`/api/neighborhood-sales?years=${years}`),
        ]);
        const histJson = await histRes.json();
        const neighJson = await neighRes.json();

        if (histJson.data) {
          setHistoryData(histJson.data);
          setTotalSold(histJson.totalSold);
        }
        if (neighJson.data) setNeighborhoodSales(neighJson.data);
      } catch (e) {
        console.error("Failed to fetch time-sensitive data:", e);
      } finally {
        setIsHistoryLoading(false);
        setIsNeighborhoodLoading(false);
      }
    }
    fetchTimeSensitive();
  }, [years]);

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      {/* Header */}
      <section className="bg-[var(--atlantic-navy)] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-white/50 hover:text-white text-sm mb-4 inline-block transition-colors"
          >
            &larr; Command Center
          </Link>
          <p
            className="text-xs uppercase tracking-[0.25em] font-semibold mb-2 font-sans"
            style={{ color: "#6dbd8b" }}
          >
            Market Intelligence
          </p>
          <h1 className="text-white text-3xl sm:text-4xl">Market Pulse</h1>
          <p className="text-white/50 mt-2 text-sm max-w-2xl">
            Live dashboards powered by Nantucket MLS data. Inventory trends, pricing
            analysis, sales velocity, and neighborhood breakdowns.
          </p>
        </div>
      </section>

      {/* Market Snapshot Tiles */}
      <section className="py-8 -mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isStatsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-5 animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-20" />
                </div>
              ))
            ) : (
              <>
                <StatTile
                  label="Active Listings"
                  value={stats?.activeListingCount?.toString() ?? "—"}
                  subtitle="On-market inventory"
                  icon={Activity}
                />
                <StatTile
                  label="Median List Price"
                  value={stats?.medianListPrice ? formatCurrency(stats.medianListPrice) : "—"}
                  subtitle="Current asking price"
                  icon={DollarSign}
                />
                <StatTile
                  label="Avg Days on Market"
                  value={stats?.medianDaysOnMarket ? `${stats.medianDaysOnMarket}` : "—"}
                  subtitle="Time to sell (median)"
                  icon={Clock}
                />
                <StatTile
                  label="Absorption Rate"
                  value={absorptionRate ? `${absorptionRate.toFixed(1)} mo` : "—"}
                  subtitle="Months of supply"
                  icon={TrendingUp}
                  badge={
                    absorptionRate
                      ? absorptionRate < 5
                        ? "Seller's Market"
                        : absorptionRate <= 7
                          ? "Balanced"
                          : "Buyer's Market"
                      : undefined
                  }
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Time Range Toggle + Charts */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header with Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl text-[var(--atlantic-navy)]">
                Sales Data
              </h2>
              {totalSold && (
                <p className="text-xs text-[var(--nantucket-gray)] mt-1">
                  {totalSold.toLocaleString()} closed transactions
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--nantucket-gray)] hidden sm:inline">
                Range:
              </span>
              <div className="flex items-center gap-1 bg-white border border-[var(--cedar-shingle)]/15 p-1 rounded-lg shadow-sm">
                {[1, 3, 5].map((y) => (
                  <button
                    key={y}
                    onClick={() => setYears(y)}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                      years === y
                        ? "bg-[var(--privet-green)] text-white shadow-sm"
                        : "text-[var(--atlantic-navy)]/60 hover:text-[var(--atlantic-navy)] hover:bg-[var(--sandstone)]"
                    }`}
                  >
                    {y}Y
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <PriceTrendChart data={historyData} isLoading={isHistoryLoading} />
            <InventoryChart data={historyData} isLoading={isHistoryLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <DaysOnMarketChart data={historyData} isLoading={isHistoryLoading} />
            <PriceDistributionChart
              data={priceDistribution}
              isLoading={isDistLoading}
            />
          </div>
        </div>
      </section>

      {/* Neighborhood Breakdown */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl text-[var(--atlantic-navy)] mb-6">
            Neighborhood Breakdown
          </h2>
          <NeighborhoodSalesTable
            data={neighborhoodSales}
            isLoading={isNeighborhoodLoading}
          />
        </div>
      </section>

      {/* Whale Watch */}
      {!isWhaleLoading && whaleWatchSales.length > 0 && (
        <WhaleWatch
          sales={whaleWatchSales}
          year={new Date().getFullYear()}
        />
      )}

      {/* CTA */}
      <section className="py-12 bg-[var(--atlantic-navy)]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-white text-2xl mb-3">Need Custom Analysis?</h2>
          <p className="text-white/60 text-sm mb-6">
            These dashboards tell the broad story. For analysis specific to your
            neighborhood, price point, or development plans — let&apos;s talk.
          </p>
          <a
            href="https://calendly.com/stephen-maury/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[var(--privet-green)] text-white px-8 py-3 text-sm font-medium rounded-md hover:bg-[var(--privet-green)]/90 transition-colors"
          >
            Schedule a Market Discussion
          </a>
        </div>
      </section>
    </div>
  );
}

// ─── Stat Tile Component ───────────────────────────────────
function StatTile({
  label,
  value,
  subtitle,
  icon: Icon,
  badge,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: typeof Activity;
  badge?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/50 font-sans">
          {label}
        </p>
        <Icon className="w-4 h-4 text-[var(--nantucket-gray)]" />
      </div>
      <p className="text-2xl font-serif text-[var(--atlantic-navy)] leading-none mb-1">
        {value}
      </p>
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--nantucket-gray)]">{subtitle}</p>
        {badge && (
          <span
            className={`text-xs font-semibold ${
              badge === "Seller's Market"
                ? "text-[var(--privet-green)]"
                : badge === "Balanced"
                  ? "text-amber-500"
                  : "text-blue-500"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
