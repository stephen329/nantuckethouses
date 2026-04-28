import { Activity, DollarSign, TrendingUp } from "lucide-react";
import type { PulseStats } from "@/types";

type Props = {
  stats: PulseStats;
};

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function getMarketLabel(rate: number): { label: string; color: string } {
  if (rate < 5) return { label: "Seller's Market", color: "text-[var(--privet-green)]" };
  if (rate <= 7) return { label: "Balanced", color: "text-amber-500" };
  return { label: "Buyer's Market", color: "text-blue-500" };
}

export function PulseDashboard({ stats }: Props) {
  const marketLabel = stats.absorptionRate
    ? getMarketLabel(stats.absorptionRate)
    : null;

  const tickers = [
    {
      label: "Active Inventory",
      value: stats.activeInventory.toString(),
      subtitle: "On-market listings",
      icon: Activity,
      badge: null as string | null,
    },
    {
      label: "Median Sale Price",
      value: stats.medianSalePrice6mo
        ? formatCurrency(stats.medianSalePrice6mo)
        : "\u2014",
      subtitle: "Last 6 months closed",
      icon: DollarSign,
      badge: null,
    },
    {
      label: "Absorption Rate",
      value: stats.absorptionRate
        ? `${stats.absorptionRate.toFixed(1)} mo`
        : "\u2014",
      subtitle: "Months of supply",
      icon: TrendingUp,
      badge: marketLabel?.label ?? null,
      badgeColor: marketLabel?.color ?? null,
    },
  ];

  return (
    <section className="bg-[var(--atlantic-navy)] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p
            className="text-xs uppercase tracking-[0.25em] font-semibold mb-2 font-sans"
            style={{ color: "#6dbd8b" }}
          >
            Nantucket Pulse
          </p>
          <h1 className="text-white text-2xl sm:text-3xl">The Big Three</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {tickers.map((ticker) => (
            <div
              key={ticker.label}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50 font-sans">
                  {ticker.label}
                </p>
                <ticker.icon className="w-4 h-4 text-white/30" />
              </div>
              <p className="text-2xl sm:text-3xl font-serif text-white leading-none mb-2">
                {ticker.value}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/40 font-sans">
                  {ticker.subtitle}
                </p>
                {ticker.badge && (
                  <span
                    className={`text-xs font-semibold ${(ticker as any).badgeColor ?? "text-white/60"}`}
                  >
                    {ticker.badge}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-white/25 font-sans">
          Absorption rate = active inventory / avg monthly sales (12mo).
        </p>
      </div>
    </section>
  );
}
