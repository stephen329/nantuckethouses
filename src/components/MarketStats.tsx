"use client";

import { useEffect, useState } from "react";

type StatCard = {
  label: string;
  value: string;
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
    label: "Active Listings",
    value: "83",
    period: "Current",
  },
  {
    label: "Median List Price",
    value: "$3.1M",
    period: "Latest",
  },
  {
    label: "Median Days on Market",
    value: "135",
    period: "Latest",
  },
];

export function MarketStats() {
  const [stats, setStats] = useState<StatCard[]>(FALLBACK_STATS);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
            label: "Active Listings",
            value: formatNumber(aggregates.activeListingCount),
            period: "Current",
          },
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
        ].filter((s) => s.value !== "N/A");

        if (!cancelled && nextStats.length) {
          setStats(nextStats);
          setLastUpdated(new Date());
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
          <h2 className="mb-4">The Nantucket Index</h2>
          <p className="text-xl max-w-2xl opacity-75">
            Interpreted through local judgment, not algorithms.
          </p>
          {error && (
            <p className="mt-2 text-sm text-[#F28F7D]">
              Showing fallback figures (live data unavailable): {error}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white p-8 border border-[#D6C8B0] rounded-sm hover:shadow-lg transition-shadow"
            >
              <div>
                <p className="text-sm uppercase tracking-wider opacity-60 mb-2">
                  {stat.label}
                </p>
                <h3 className="text-[#1A2A3A]">{stat.value}</h3>
              </div>
              {stat.period && (
                <div className="pt-4 mt-4 border-t border-[#E8E8E8]">
                  <span className="text-sm opacity-50">{stat.period}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Last Updated Timestamp */}
        <p className="mt-4 text-center text-sm opacity-50">
          Last updated: {lastUpdated 
            ? lastUpdated.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : 'February 2026'}
        </p>

        {/* Interpretive Line */}
        <p className="mt-6 text-center text-lg opacity-70 italic max-w-3xl mx-auto">
          The value isn't the numbers—it's understanding what they signal before the market reacts.
        </p>

        {/* Planning & Regulatory Update */}
        <div className="mt-12 bg-white p-8 border border-[#D6C8B0] rounded-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-[#C9A227] text-sm uppercase tracking-wider font-medium mb-2">
                Planning & Regulatory Update
              </p>
              <h4 className="text-[#1A2A3A] text-xl font-medium mb-2">
                Q1 2026: Zoning Review in Progress
              </h4>
              <p className="text-[#1A2A3A]/70 leading-relaxed max-w-2xl">
                The Planning Board is currently reviewing proposed amendments to residential density requirements in the Mid-Island zone. I'm monitoring implications for development feasibility and advising clients accordingly.
              </p>
            </div>
            <a 
              href="#" 
              className="shrink-0 text-[#C9A227] hover:text-[#B89220] transition-colors flex items-center gap-2 font-medium whitespace-nowrap"
            >
              View Current Planning Updates
              <span className="text-lg">→</span>
            </a>
          </div>
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
