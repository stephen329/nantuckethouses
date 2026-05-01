import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { VibeMeterData, VibeTrend } from "@/types";

type Props = {
  data: VibeMeterData;
};

const trendIcons: Record<VibeTrend, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const trendColors: Record<VibeTrend, string> = {
  up: "text-[var(--privet-green)]",
  down: "text-red-500",
  flat: "text-[var(--nantucket-gray)]",
};

export function VibeMeter({ data }: Props) {
  return (
    <section className="py-12 sm:py-16 bg-[var(--sandstone)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-8">
          <div>
            <p className="text-[var(--cedar-shingle)] text-xs uppercase tracking-[0.25em] font-semibold mb-2 font-sans">
              Expert Sentiment
            </p>
            <h2 className="text-[var(--atlantic-navy)]">Vibe Check</h2>
          </div>
          <p className="text-xs text-[var(--nantucket-gray)] font-sans">
            Week of{" "}
            {new Date(data.weekOf + "T00:00:00").toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Neighborhood Sentiment Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.neighborhoods.map((hood) => {
            const TrendIcon = trendIcons[hood.trend];
            const trendColor = trendColors[hood.trend];

            return (
              <div
                key={hood.neighborhood}
                className="bg-white rounded-lg p-4 border border-[var(--cedar-shingle)]/10 hover:border-[var(--cedar-shingle)]/25 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[var(--atlantic-navy)] font-sans">
                    {hood.neighborhood}
                  </h3>
                  <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                </div>
                <p className="text-sm text-[var(--atlantic-navy)]/70 leading-relaxed italic">
                  &ldquo;{hood.note}&rdquo;
                </p>
              </div>
            );
          })}
        </div>

        {/* Overall Market Sentiment */}
        {data.stephenNote && (
          <div className="mt-8 bg-white rounded-lg border-l-4 border-[var(--cedar-shingle)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cedar-shingle)] mb-2 font-sans">
              Stephen&apos;s Market Read
            </p>
            <p className="text-sm text-[var(--atlantic-navy)]/80 leading-relaxed">
              {data.stephenNote}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
