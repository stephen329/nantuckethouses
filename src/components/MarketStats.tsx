"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

type StatCard = {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  period?: string;
};

type MarketStatsResponse = {
  data?: {
    aggregates?: Record<string, unknown>;
  };
  error?: string;
};

const FALLBACK_STATS: StatCard[] = [
  {
    label: "Median Sale Price",
    value: "$3.2M",
    change: "+12.3%",
    isPositive: true,
    period: "YoY",
  },
  {
    label: "Days on Market",
    value: "42",
    change: "-8 days",
    isPositive: true,
    period: "vs. prior",
  },
  {
    label: "Active Listings",
    value: "187",
    change: "-15.2%",
    isPositive: false,
    period: "YoY",
  },
  {
    label: "Sales Volume",
    value: "$89M",
    change: "+18.4%",
    isPositive: true,
    period: "Recent Period",
  },
];

export function MarketStats() {
  const [stats, setStats] = useState<StatCard[]>(FALLBACK_STATS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const res = await fetch("/api/market-stats?location=Nantucket, MA", {
          cache: "no-store",
        });
        const json = (await res.json()) as MarketStatsResponse;

        if (!res.ok || json.error) {
          throw new Error(json.error || "Failed to load stats");
        }

        // NOTE: shape depends on Repliers aggregates response; adjust mapping as needed.
        const aggregates =
          (json.data as { aggregates?: Record<string, unknown> } | undefined)
            ?.aggregates ?? {};
        const nextStats: StatCard[] = [
          {
            label: "Median List Price",
            value: formatCurrency(aggregates.medianListPrice),
            period: "Latest",
          },
          {
            label: "Median Days on Market",
            value: formatNumber(aggregates.medianDaysOnMarket),
            period: "Latest",
          },
          {
            label: "Active Listings",
            value: formatNumber(aggregates.activeListingCount),
            period: "Current",
          },
          {
            label: "Sales Volume",
            value: formatCurrency(aggregates.totalSalesVolume),
            period: "Latest",
          },
        ].filter((s) => s.value !== "N/A");

        if (!cancelled && nextStats.length) {
          setStats(nextStats);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load stats");
        }
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="market-insights" className="py-24 bg-[#E8E8E8]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-left mb-16">
          <h2 className="mb-4">Live Market Intelligence</h2>
          <p className="text-xl max-w-2xl opacity-75">
            Exclusive access to real-time data and proprietary insights that give you an edge in Nantucket's competitive market.
          </p>
          {error && (
            <p className="mt-2 text-sm text-[#F28F7D]">
              Showing fallback figures (live data unavailable): {error}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white p-8 border border-[#D6C8B0] rounded-sm hover:shadow-lg transition-shadow"
            >
              <div className="mb-4">
                <p className="text-sm uppercase tracking-wider opacity-60 mb-2">
                  {stat.label}
                </p>
                <h3 className="text-[#0A1A2F]">{stat.value}</h3>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-[#E8E8E8]">
                {stat.isPositive ? (
                  <TrendingUp className="w-4 h-4 text-[#A8D5C2]" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-[#F28F7D]" />
                )}
                <span className={`text-sm ${stat.isPositive ? 'text-[#A8D5C2]' : 'text-[#F28F7D]'}`}>
                  {stat.change}
                </span>
                <span className="text-sm opacity-50">{stat.period}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button className="bg-[#3A5C7E] text-white px-8 py-4 rounded-md hover:bg-[#2d4860] transition-colors">
            Download Full Market Report
          </button>
        </div>
      </div>
    </section>
  );
}

function formatCurrency(value: unknown) {
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return "N/A";
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatNumber(value: unknown) {
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return "N/A";
  return num.toLocaleString("en-US");
}
