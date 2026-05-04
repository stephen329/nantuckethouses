"use client";

export function ListingPrintToolbar() {
  return (
    <div className="listing-print-hide flex flex-wrap items-center justify-end gap-2 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg border border-[#e0e6ef] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--atlantic-navy)] shadow-sm hover:bg-[var(--sandstone)]"
      >
        Property report (print / save PDF)
      </button>
    </div>
  );
}
