"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ActivePeerRow, CompRow, NormalizedListingDetail } from "@/lib/get-listing-detail";
import { formatMoneyFull } from "@/lib/listing-detail-math";

type Props = {
  comps: CompRow[];
  activePeerComps: ActivePeerRow[];
  listing: NormalizedListingDetail;
};

type Band = "all" | "nh" | "band" | "ppsf";
type Dataset = "sold" | "active";

function formatMonthsSince(m: number | null): string {
  if (m == null || !Number.isFinite(m)) return "—";
  if (m < 1) return "<1 mo";
  if (m < 24) return `${Math.round(m)} mo`;
  const y = Math.floor(m / 12);
  const mo = Math.round(m - y * 12);
  return `${y}y${mo ? ` ${mo}mo` : ""}`;
}

function formatDistance(mi: number | null): string {
  if (mi == null || !Number.isFinite(mi)) return "—";
  return `${mi} mi`;
}

export function ListingCompsTable({ comps, activePeerComps, listing }: Props) {
  const [band, setBand] = useState<Band>("all");
  const [dataset, setDataset] = useState<Dataset>("sold");

  const refPrice =
    listing.status === "Sold"
      ? listing.closePrice ?? listing.listPrice
      : listing.listPrice;
  const subjectPpsfSold =
    listing.status === "Sold"
      ? listing.dollarPerSfClose ?? listing.dollarPerSfList
      : listing.dollarPerSfList;
  const subjectPpsfList = listing.dollarPerSfList;

  const soldFiltered = useMemo(() => {
    let rows = comps;
    if (band === "nh") {
      rows = rows.filter((c) => c.neighborhood === listing.neighborhood);
    }
    if (band === "band" && refPrice != null) {
      const lo = refPrice * 0.75;
      const hi = refPrice * 1.25;
      rows = rows.filter((c) => c.closePrice >= lo && c.closePrice <= hi);
    }
    if (band === "ppsf" && subjectPpsfSold != null && subjectPpsfSold > 0) {
      rows = rows.filter(
        (c) => c.ppsf != null && Math.abs(c.ppsf - subjectPpsfSold) / subjectPpsfSold <= 0.12
      );
    }
    return rows;
  }, [band, comps, listing.neighborhood, refPrice, subjectPpsfSold]);

  const activeFiltered = useMemo(() => {
    let rows = activePeerComps;
    if (band === "nh") {
      rows = rows.filter((c) => c.neighborhood === listing.neighborhood);
    }
    if (band === "band" && refPrice != null) {
      const lo = refPrice * 0.75;
      const hi = refPrice * 1.25;
      rows = rows.filter((c) => c.listPrice >= lo && c.listPrice <= hi);
    }
    if (band === "ppsf" && subjectPpsfList != null && subjectPpsfList > 0) {
      rows = rows.filter(
        (c) => c.ppsf != null && Math.abs(c.ppsf - subjectPpsfList) / subjectPpsfList <= 0.12
      );
    }
    return rows;
  }, [band, activePeerComps, listing.neighborhood, refPrice, subjectPpsfList]);

  return (
    <section className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-white p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--atlantic-navy)]">Comparable properties</h2>
          <p className="mt-1 text-sm text-[var(--nantucket-gray)]">
            <span className="font-medium text-[var(--atlantic-navy)]">Sold</span>: 12-month closes, similarity-ranked.
            <span className="font-medium text-[var(--atlantic-navy)]"> Active peers</span>: on-market LINK rows in the
            same similarity pool (not pending / under agreement in this view). Distance is straight-line when
            coordinates exist in the feed; otherwise omitted.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2 text-xs">
            <FilterBtn active={dataset === "sold"} onClick={() => setDataset("sold")}>
              Sold comps
            </FilterBtn>
            <FilterBtn
              active={dataset === "active"}
              onClick={() => setDataset("active")}
              disabled={activePeerComps.length === 0}
            >
              Active peers
            </FilterBtn>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <FilterBtn active={band === "all"} onClick={() => setBand("all")}>
              All
            </FilterBtn>
            <FilterBtn active={band === "nh"} onClick={() => setBand("nh")}>
              {listing.neighborhood} only
            </FilterBtn>
            <FilterBtn active={band === "band"} onClick={() => setBand("band")}>
              ±25% price
            </FilterBtn>
            <FilterBtn
              active={band === "ppsf"}
              onClick={() => setBand("ppsf")}
              disabled={
                dataset === "sold"
                  ? subjectPpsfSold == null || subjectPpsfSold <= 0
                  : subjectPpsfList == null || subjectPpsfList <= 0
              }
            >
              ±12% $/SF
            </FilterBtn>
          </div>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
        {dataset === "sold" ? (
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-[#e8edf4] text-left text-[var(--nantucket-gray)]">
                <th className="py-2 pr-2 font-medium">Address</th>
                <th className="py-2 pr-2 font-medium">Dist.</th>
                <th className="py-2 pr-2 font-medium">Sale date</th>
                <th className="py-2 pr-2 font-medium">Sim.</th>
                <th className="py-2 pr-2 font-medium">Price</th>
                <th className="py-2 pr-2 font-medium">$/SF</th>
                <th className="py-2 pr-2 font-medium">Built</th>
                <th className="py-2 pr-2 font-medium">Beds/baths</th>
                <th className="py-2 font-medium">Δ $/SF</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {soldFiltered.map((c) => (
                <tr key={c.linkId} className="border-b border-[#eef2f7] last:border-0">
                  <td className="py-2 pr-2">
                    <Link
                      href={`/listings/${c.linkId}`}
                      className="font-semibold text-[var(--privet-green)] hover:underline"
                    >
                      {c.address}
                    </Link>
                    <div className="text-[11px] font-normal text-[var(--nantucket-gray)]">{c.neighborhood}</div>
                  </td>
                  <td className="py-2 pr-2 text-xs text-[var(--atlantic-navy)]" title="Great-circle miles when lat/lon in LINK">
                    {formatDistance(c.distanceMiles)}
                  </td>
                  <td className="py-2 pr-2 whitespace-nowrap text-xs">
                    <div className="font-medium text-[var(--atlantic-navy)]">{c.closeDate}</div>
                    {c.monthsSinceClose != null ? (
                      <div className="text-[var(--nantucket-gray)]">{formatMonthsSince(c.monthsSinceClose)} since close</div>
                    ) : null}
                  </td>
                  <td className="py-2 pr-2" title="Heuristic: SF, price, age, lot, beds/baths">
                    {c.similarityScore}
                  </td>
                  <td className="py-2 pr-2">{formatMoneyFull(c.closePrice)}</td>
                  <td className="py-2 pr-2">{c.ppsf != null ? `$${c.ppsf.toLocaleString()}` : "—"}</td>
                  <td className="py-2 pr-2">{c.yearBuilt ?? "—"}</td>
                  <td className="py-2 pr-2">
                    {c.beds ?? "—"} / {c.baths ?? "—"}
                  </td>
                  <td className="py-2 text-xs font-medium text-[var(--atlantic-navy)]">{c.deltaNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-[#e8edf4] text-left text-[var(--nantucket-gray)]">
                <th className="py-2 pr-2 font-medium">Address</th>
                <th className="py-2 pr-2 font-medium">Listed</th>
                <th className="py-2 pr-2 font-medium">DOM</th>
                <th className="py-2 pr-2 font-medium">Sim.</th>
                <th className="py-2 pr-2 font-medium">List price</th>
                <th className="py-2 pr-2 font-medium">$/SF (list)</th>
                <th className="py-2 pr-2 font-medium">Built</th>
                <th className="py-2 pr-2 font-medium">Beds/baths</th>
                <th className="py-2 font-medium">Δ $/SF</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {activeFiltered.map((c) => (
                <tr key={c.linkId} className="border-b border-[#eef2f7] last:border-0">
                  <td className="py-2 pr-2">
                    <Link
                      href={`/listings/${c.linkId}`}
                      className="font-semibold text-[var(--privet-green)] hover:underline"
                    >
                      {c.address}
                    </Link>
                    <div className="text-[11px] font-normal text-[var(--nantucket-gray)]">{c.neighborhood}</div>
                  </td>
                  <td className="py-2 pr-2 whitespace-nowrap text-xs">{c.onMarketDate ?? "—"}</td>
                  <td className="py-2 pr-2">{c.dom ?? "—"}</td>
                  <td className="py-2 pr-2">{c.similarityScore}</td>
                  <td className="py-2 pr-2">{formatMoneyFull(c.listPrice)}</td>
                  <td className="py-2 pr-2">{c.ppsf != null ? `$${c.ppsf.toLocaleString()}` : "—"}</td>
                  <td className="py-2 pr-2">{c.yearBuilt ?? "—"}</td>
                  <td className="py-2 pr-2">
                    {c.beds ?? "—"} / {c.baths ?? "—"}
                  </td>
                  <td className="py-2 text-xs font-medium text-[var(--atlantic-navy)]">{c.deltaNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {dataset === "sold" && soldFiltered.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--nantucket-gray)]">No sold comps for this filter.</p>
        )}
        {dataset === "active" && activeFiltered.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--nantucket-gray)]">No active peers for this filter.</p>
        )}
      </div>
    </section>
  );
}

function FilterBtn({
  children,
  active,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 font-medium transition-colors ${
        disabled
          ? "cursor-not-allowed border-[#e8edf4] bg-[#f5f6f8] text-[var(--nantucket-gray)]/50"
          : active
            ? "border-[var(--privet-green)] bg-[var(--privet-green)]/10 text-[var(--atlantic-navy)]"
            : "border-[#e0e6ef] bg-white text-[var(--nantucket-gray)] hover:border-[var(--privet-green)]/40"
      }`}
    >
      {children}
    </button>
  );
}
