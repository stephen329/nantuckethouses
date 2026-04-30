"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";

export type ZoningUseRow = { category: string; useName: string; value: string; allowed: boolean };

type UseFilterChip = "all" | "residential" | "accessory" | "special";

type DistrictMatchLite = {
  code: string;
  info: {
    name?: string;
    maxGroundCover?: string;
  };
} | null;

function filterUseRows(rows: ZoningUseRow[], filterText: string, chip: UseFilterChip) {
  const q = filterText.trim().toLowerCase();
  return rows.filter((row) => {
    if (q && !row.useName.toLowerCase().includes(q)) return false;
    if (chip === "residential") return row.category === "Residential";
    if (chip === "accessory") return row.useName.toLowerCase().includes("accessory");
    if (chip === "special") return row.value.includes("SP");
    return true;
  });
}

type RowStatus = "allowed" | "limited" | "prohibited";

function rowStatus(row: ZoningUseRow): RowStatus {
  if (!row.allowed) return "prohibited";
  if (row.value.includes("SP")) return "limited";
  return "allowed";
}

const CHIP_LABELS: Record<UseFilterChip, string> = {
  all: "All",
  residential: "Residential",
  accessory: "Accessory",
  special: "Special",
};

type Props = {
  zoningCode: string;
  districtMatch: DistrictMatchLite;
  zoningUseRows: ZoningUseRow[];
  legend: Record<string, string>;
  chartSource: string;
};

function StatusTag({ status }: { status: RowStatus }) {
  if (status === "allowed") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80 sm:py-1">
        <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
        Allowed
      </span>
    );
  }
  if (status === "limited") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-200/90 sm:py-1">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden />
        Limited
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 ring-1 ring-rose-200/80 sm:py-1">
      <X className="h-3.5 w-3.5 text-rose-600" aria-hidden />
      Not allowed
    </span>
  );
}

export function ParcelZoningUsesSection({ zoningCode, districtMatch, zoningUseRows, legend, chartSource }: Props) {
  const [filter, setFilter] = useState("");
  const [chip, setChip] = useState<UseFilterChip>("all");

  const filteredRows = useMemo(() => filterUseRows(zoningUseRows, filter, chip), [zoningUseRows, filter, chip]);

  const sortedRows = useMemo(() => {
    const order: Record<RowStatus, number> = { allowed: 0, limited: 1, prohibited: 2 };
    return [...filteredRows].sort((a, b) => {
      const d = order[rowStatus(a)] - order[rowStatus(b)];
      if (d !== 0) return d;
      return a.useName.localeCompare(b.useName);
    });
  }, [filteredRows]);

  const code = districtMatch?.code ?? zoningCode;
  const districtName = districtMatch?.info.name;
  const maxGc = districtMatch?.info.maxGroundCover;

  return (
    <div className="mb-3 w-full">
      <div className="overflow-hidden rounded-2xl border border-[var(--cedar-shingle)]/12 bg-[var(--sandstone)]/20 shadow-sm">
        <div className="border-b border-[var(--cedar-shingle)]/10 bg-white/90 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--nantucket-gray)]">Permitted uses</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="text-sm text-[var(--atlantic-navy)]">
              <span className="font-semibold tabular-nums">{code}</span>
              {districtName ? <span className="text-[var(--nantucket-gray)]"> — {districtName}</span> : null}
            </div>
            {maxGc ? (
              <div className="text-left text-xs text-[var(--nantucket-gray)] sm:text-right sm:text-sm">
                Max ground cover <span className="font-semibold text-[var(--atlantic-navy)]">{maxGc}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 border-b border-[var(--cedar-shingle)]/10 bg-white/80 px-4 py-3">
          <Input
            placeholder="Filter uses…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-10 min-h-[44px] rounded-xl border-[var(--cedar-shingle)]/20 bg-white text-sm md:h-9 md:min-h-0"
          />
          <div className="flex flex-wrap gap-2">
            {(["all", "residential", "accessory", "special"] as UseFilterChip[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChip(c)}
                className={cn(
                  "min-h-[40px] rounded-full px-3.5 py-2 text-xs font-medium transition-colors md:min-h-0 md:px-3 md:py-1.5",
                  chip === c
                    ? "bg-[var(--atlantic-navy)] text-white shadow-sm"
                    : "bg-white/90 text-[var(--nantucket-gray)] ring-1 ring-[var(--cedar-shingle)]/20 hover:bg-[var(--sandstone)]/60",
                )}
              >
                {CHIP_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[min(55vh,26rem)] overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
          {sortedRows.length ? (
            <div className="grid grid-cols-1 gap-3">
              {sortedRows.map((row) => {
                const status = rowStatus(row);
                const note = (legend[row.value] ?? row.value).trim();
                const longNote = note.length > 72;

                return (
                  <div
                    key={`${row.category}-${row.useName}-${row.value}`}
                    className="rounded-2xl border border-[var(--cedar-shingle)]/10 bg-white p-4 shadow-sm ring-1 ring-black/[0.02] transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug text-[var(--atlantic-navy)]">{row.useName}</p>
                        <p className="mt-0.5 text-[11px] uppercase tracking-wide text-[var(--nantucket-gray)]">{row.category}</p>
                        {longNote ? (
                          <details className="group mt-2 sm:mt-2">
                            <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 text-xs text-[var(--nantucket-gray)] marker:content-none sm:min-h-0 [&::-webkit-details-marker]:hidden">
                              <ChevronDown className="h-4 w-4 shrink-0 text-[var(--privet-green)] transition-transform group-open:rotate-180" />
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
                      <div className="flex shrink-0 items-center sm:pt-0.5">
                        <StatusTag status={status} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="px-1 py-6 text-center text-sm text-[var(--nantucket-gray)]">No use-chart rows for this filter.</p>
          )}
        </div>

        <p className="border-t border-[var(--cedar-shingle)]/10 bg-white/70 px-4 py-2.5 text-[10px] leading-relaxed text-[var(--nantucket-gray)]">
          Source: {chartSource}
        </p>
      </div>
    </div>
  );
}
