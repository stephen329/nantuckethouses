import type { MarketHighlightsData } from "@/types";

type Props = {
  data: MarketHighlightsData;
};

export function MarketHighlights({ data }: Props) {
  return (
    <section className="py-12 sm:py-16 bg-[var(--sandstone)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-8">
          <div>
            <p className="text-[var(--cedar-shingle)] text-xs uppercase tracking-[0.25em] font-semibold mb-2 font-sans">
              Expert Sentiment
            </p>
            <h2 className="text-[var(--atlantic-navy)]">Market Highlights</h2>
          </div>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.cards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-lg p-6 border border-[var(--cedar-shingle)]/10 hover:border-[var(--cedar-shingle)]/25 transition-colors"
            >
              <div className="text-[var(--privet-green)] text-sm font-medium font-sans tracking-wide">
                {card.label}
              </div>
              <h3 className="text-3xl font-serif text-[var(--atlantic-navy)] mt-2">
                {card.headline}
              </h3>
              <p className="text-[var(--nantucket-gray)] mt-3 text-sm leading-relaxed">
                {card.body}
              </p>
              <div className="text-sm text-[var(--atlantic-navy)]/70 mt-4 leading-relaxed">
                {card.footnote}
              </div>
            </div>
          ))}
        </div>

        {/* Stephen's Market Read */}
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
