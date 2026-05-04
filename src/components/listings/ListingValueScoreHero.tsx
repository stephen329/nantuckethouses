"use client";

import type { ListingIslandValueScore } from "@/lib/listing-benchmark-signals";
import { formatPctSignedOneDecimal, signalToneClasses } from "@/lib/listing-benchmark-signals";
import { cn } from "@/components/ui/utils";

type Props = {
  score: ListingIslandValueScore;
};

export function ListingValueScoreHero({ score }: Props) {
  const st = signalToneClasses(score.signal);
  return (
    <section className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-white p-4 shadow-sm sm:p-5 print:break-inside-avoid">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--nantucket-gray)]">
        Executive summary
      </p>
      <p className="mt-1 text-xs text-[var(--nantucket-gray)]">Island-wide $/SF benchmark vs this listing (LINK snapshot).</p>
      <div className={cn("mt-3 rounded-xl border px-4 py-4 sm:px-5 print:border", st.wrap)}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--nantucket-gray)]">
          Value score vs island
        </p>
        <p
          className={cn(
            "mt-1 font-listing-mono text-3xl font-bold tabular-nums tracking-tight sm:text-4xl",
            st.text,
          )}
        >
          {formatPctSignedOneDecimal(score.p)}
        </p>
        <p className="mt-2 text-sm font-medium leading-snug text-[var(--atlantic-navy)]">{score.sentence}</p>
      </div>
    </section>
  );
}
