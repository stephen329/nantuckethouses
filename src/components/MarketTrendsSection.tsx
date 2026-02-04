"use client";

import { useEffect, useState } from "react";
import { TrendingUp, AlertCircle } from "lucide-react";

type Insight = {
  type: "trend" | "anomaly";
  statement: string;
};

type MarketInsightsResponse = {
  insights?: Insight[];
  error?: string;
};

export function MarketTrendsSection() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/market-insights", { cache: "no-store" });
        const json = (await res.json()) as MarketInsightsResponse;
        if (!cancelled && json.insights?.length) {
          setInsights(json.insights);
        }
        if (json.error && !json.insights?.length) setError(json.error);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section id="market-trends" className="py-24 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-left mb-12">
            <h2 className="mb-4">Market Trends & Anomalies</h2>
            <p className="text-xl max-w-2xl opacity-75">
              What the Repliers data is showing.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white p-8 border border-[#D6C8B0] rounded-sm animate-pulse"
              >
                <div className="h-4 bg-[#E8E8E8] rounded w-1/4 mb-4" />
                <div className="h-3 bg-[#E8E8E8] rounded w-full mb-2" />
                <div className="h-3 bg-[#E8E8E8] rounded w-5/6" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (insights.length === 0 && !error) {
    return null;
  }

  return (
    <section id="market-trends" className="py-24 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-left mb-12">
          <p className="text-[#C9A227] text-sm uppercase tracking-wider font-medium mb-2">
            Live from the MLS
          </p>
          <h2 className="mb-4">Market Trends & Anomalies</h2>
          <p className="text-xl max-w-2xl opacity-75">
            Statements derived from real-time Repliers data—prices, days on market, and closed sales—so you see what the numbers are signaling.
          </p>
        </div>

        {error && (
          <p className="mb-6 text-sm text-[#F28F7D]">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="bg-white p-8 border border-[#D6C8B0] rounded-sm hover:shadow-lg transition-shadow flex flex-col"
            >
              <div className="flex items-center gap-2 mb-4">
                {insight.type === "trend" ? (
                  <TrendingUp className="w-5 h-5 text-[#C9A227]" aria-hidden />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[#3a5c7e]" aria-hidden />
                )}
                <span
                  className={`text-xs uppercase tracking-wider font-medium ${
                    insight.type === "trend"
                      ? "text-[#C9A227]"
                      : "text-[#3a5c7e]"
                  }`}
                >
                  {insight.type === "trend" ? "Trend" : "Anomaly"}
                </span>
              </div>
              <p className="text-[#1A2A3A] leading-relaxed flex-1">
                {insight.statement}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm opacity-60 max-w-2xl mx-auto">
          Data sourced from the Repliers MLS statistics API. These insights are interpretive and should be read alongside local expertise.
        </p>
      </div>
    </section>
  );
}
