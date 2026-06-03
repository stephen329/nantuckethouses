"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";
import type { ZoningUseRow } from "@/lib/zoning-allowable-uses";

export type { ZoningUseRow };

/** Top-level keys in `zoning-use-chart.json` (excluding `metadata`). */
export type UseChartCategoryChip =
  | "Residential"
  | "Commercial"
  | "Commercial Industrial"
  | "Industrial"
  | "Other";

const USE_CHART_CATEGORY_CHIPS: { id: UseChartCategoryChip; label: string }[] = [
  { id: "Residential", label: "Residential" },
  { id: "Commercial", label: "Commercial" },
  { id: "Commercial Industrial", label: "Commercial Industrial" },
  { id: "Industrial", label: "Industrial" },
  { id: "Other", label: "Other" },
];

function filterUseRows(rows: ZoningUseRow[], filterText: string, category: UseChartCategoryChip | null) {
  const q = filterText.trim().toLowerCase();
  return rows.filter((row) => {
    if (category != null && row.category !== category) return false;
    if (q && !String(row.useName ?? "").toLowerCase().includes(q)) return false;
    return true;
  });
}

type RowStatus = "allowed" | "limited" | "prohibited";

function rowStatus(row: ZoningUseRow): RowStatus {
  if (!row.allowed) return "prohibited";
  const v = String(row.value ?? "");
  if (v.includes("SP")) return "limited";
  return "allowed";
}

type Props = {
  zoningUseRows: ZoningUseRow[];
  legend: Record<string, string>;
  chartSource: string;
};

function StatusTag({ status, className }: { status: RowStatus; className?: string }) {
  if (status === "allowed") return null;
  if (status === "limited") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-200/90 sm:py-1",
          className,
        )}
      >
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden />
        Limited
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 ring-1 ring-rose-200/80 sm:py-1",
        className,
      )}
    >
      <X className="h-3.5 w-3.5 text-rose-600" aria-hidden />
      Not allowed
    </span>
  );
}

export function ParcelZoningUsesSection({ zoningUseRows, legend, chartSource }: Props) {
  const [filter, setFilter] = useState("");
  const [categoryChip, setCategoryChip] = useState<UseChartCategoryChip | null>(null);

  /** Chart includes disallowed cells; list only uses permitted in the selected zoning district. */
  const permittedRows = useMemo(() => zoningUseRows.filter((r) => r.allowed), [zoningUseRows]);

  const filteredRows = useMemo(
    () => filterUseRows(permittedRows, filter, categoryChip),
    [permittedRows, filter, categoryChip],
  );

  const sortedRows = useMemo(() => {
    const order: Record<RowStatus, number> = { allowed: 0, limited: 1, prohibited: 2 };
    return [...filteredRows].sort((a, b) => {
      const d = order[rowStatus(a)] - order[rowStatus(b)];
      if (d !== 0) return d;
      return a.useName.localeCompare(b.useName);
    });
  }, [filteredRows]);

  return (
    <div className="w-full max-w-none overflow-hidden rounded-none border-0 border-t border-[var(--cedar-shingle)]/12 bg-[var(--sandstone)]/20 shadow-none">
      <div className="border-b border-[var(--cedar-shingle)]/10 bg-white/90 px-0 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--nantucket-gray)]">Permitted uses</p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Filter by use chart category">
            {USE_CHART_CATEGORY_CHIPS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (categoryChip === id) {
                    setCategoryChip(null);
                    setFilter("");
                  } else {
                    setCategoryChip(id);
                  }
                }}
                className={cn(
                  "min-h-[36px] rounded-full px-2.5 py-1.5 text-[11px] font-semibold leading-tight transition-colors sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-xs",
                  categoryChip === id
                    ? "bg-[var(--atlantic-navy)] text-white shadow-sm"
                    : "bg-white/90 text-[var(--nantucket-gray)] ring-1 ring-[var(--cedar-shingle)]/20 hover:bg-[var(--sandstone)]/60",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {categoryChip === null ? (
            <p className="mt-2 text-xs leading-snug text-[var(--nantucket-gray)]">
              Select a category chip to list allowed uses in that group for this zoning district.
            </p>
          ) : null}
        </div>
      </div>

      {categoryChip != null ? (
        <div>
          <div className="space-y-3 border-b border-[var(--cedar-shingle)]/10 bg-white/80 px-0 py-3">
            <Input
              placeholder="Filter uses in this category…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-10 min-h-[44px] rounded-xl border-[var(--cedar-shingle)]/20 bg-white text-sm md:h-9 md:min-h-0"
            />
          </div>

          <div className="max-h-[min(55vh,26rem)] overflow-y-auto overscroll-contain px-0 py-3">
            {sortedRows.length ? (
              <div className="grid grid-cols-2 gap-3">
                {sortedRows.map((row) => {
                  const status = rowStatus(row);
                  const rawNote = legend[row.value] ?? row.value ?? "";
                  const note = String(rawNote).trim();
                  const longNote = note.length > 72;

                  return (
                    <div
                      key={`${row.category}-${row.useName}-${row.value}`}
                      className="rounded-2xl border border-[var(--cedar-shingle)]/10 bg-white p-3 shadow-sm ring-1 ring-black/[0.02] transition-shadow hover:shadow-md"
                    >
                      <div className="flex min-h-0 w-full flex-col gap-2">
                        <div className="min-w-0 w-full">
                          <p className="text-sm font-semibold leading-snug text-[var(--atlantic-navy)]">{row.useName}</p>
                          {longNote ? (
                            <details className="group/note mt-2 sm:mt-2">
                              <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 text-xs text-[var(--nantucket-gray)] marker:content-none sm:min-h-0 [&::-webkit-details-marker]:hidden">
                                <ChevronDown className="h-4 w-4 shrink-0 text-[var(--privet-green)] transition-transform group-open/note:rotate-180" />
                                <span className="font-medium text-[var(--atlantic-navy)]">Notes</span>
                                <span className="text-[var(--nantucket-gray)]">(tap to expand)</span>
                              </summary>
                              <p className="mt-2 border-l-2 border-[var(--cedar-shingle)]/20 pl-3 text-xs leading-relaxed text-[var(--nantucket-gray)]">
                                {note}
                              </p>
                            </details>
                          ) : (
                            <p className="mt-2 text-xs leading-relaxed text-[var(--nantucket-gray)]">{note}</p>
                          )}
                        </div>
                        <StatusTag status={status} className="w-full justify-center" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="px-1 py-6 text-center text-sm text-[var(--nantucket-gray)]">
                No permitted uses match your search or category filter.
              </p>
            )}
          </div>

          <p className="border-t border-[var(--cedar-shingle)]/10 bg-white/70 px-0 py-2.5 text-[10px] leading-relaxed text-[var(--nantucket-gray)]">
            Source: {chartSource}
          </p>
        </div>
      ) : null}
    </div>
  );
}
