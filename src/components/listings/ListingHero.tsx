"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { NormalizedListingDetail } from "@/lib/get-listing-detail";
import { formatMoneyFull } from "@/lib/listing-detail-math";
import { cn } from "@/components/ui/utils";

type Props = {
  listing: NormalizedListingDetail;
};

function sqFtLabel(listing: NormalizedListingDetail): string {
  if (listing.livingSqft == null) return "—";
  return `${listing.livingSqft.toLocaleString()} sq ft`;
}

function pricePerSfDisplay(listing: NormalizedListingDetail): string {
  const ppsf =
    listing.status === "Sold"
      ? listing.dollarPerSfClose ?? listing.dollarPerSfList
      : listing.dollarPerSfList;
  if (listing.livingSqft == null || ppsf == null) return "—";
  return `$${ppsf.toLocaleString()}/SF`;
}

function displayPrice(listing: NormalizedListingDetail): string {
  if (listing.status === "Sold" && listing.closePrice != null) {
    return formatMoneyFull(listing.closePrice);
  }
  if (listing.listPrice != null) return formatMoneyFull(listing.listPrice);
  return "—";
}

function VitalItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--nantucket-gray)]">
        {label}
      </dt>
      <dd className="mt-0.5 font-listing-mono text-base font-bold tabular-nums text-[var(--atlantic-navy)] sm:text-lg">
        {children}
      </dd>
    </div>
  );
}

export function ListingHero({ listing }: Props) {
  const slides =
    listing.photos.length > 0
      ? listing.photos
      : ["/Nantucket Houses_Master_logo.png"];

  const [i, setI] = useState(0);
  const next = useCallback(() => setI((v) => (v + 1) % slides.length), [slides.length]);
  const prev = useCallback(
    () => setI((v) => (v - 1 + slides.length) % slides.length),
    [slides.length]
  );

  useEffect(() => {
    const t = setInterval(next, 8000);
    return () => clearInterval(t);
  }, [next]);

  const lot =
    listing.lotSqft != null ? `${listing.lotSqft.toLocaleString()} SF` : "—";

  const statusClass =
    listing.status === "Active"
      ? "bg-emerald-700/90 text-white"
      : listing.status === "Sold"
        ? "bg-[var(--atlantic-navy)]/90 text-white"
        : "bg-amber-700/90 text-white";

  return (
    <section className="listing-hero-root relative -mx-4 overflow-hidden border border-[#e0e6ef] bg-[#0a1628] shadow-[var(--elevation-1)] sm:mx-0 sm:rounded-[var(--radius-card)] print:border print:border-[#e0e6ef] print:shadow-none">
      <div className="listing-hero-media relative aspect-[4/3] min-h-[220px] sm:min-h-[320px] lg:aspect-[21/9] lg:min-h-[360px]">
        {slides.map((src, idx) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${idx}`}
            src={src}
            alt=""
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
              idx === i ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            loading={idx === 0 ? "eager" : "lazy"}
          />
        ))}
        <div
          className="listing-hero-gradient absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
          aria-hidden
        />

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="listing-print-hide absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--atlantic-navy)] shadow-md hover:bg-white"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={next}
              className="listing-print-hide absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--atlantic-navy)] shadow-md hover:bg-white"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <div className="listing-print-hide absolute bottom-20 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Photo ${idx + 1}`}
                  onClick={() => setI(idx)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    idx === i ? "bg-white" : "bg-white/40 hover:bg-white/70",
                  )}
                />
              ))}
            </div>
          </>
        )}

        <div className="listing-hero-copy absolute inset-x-0 bottom-0 z-[5] p-4 pb-5 text-white sm:p-6 sm:pb-6 lg:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
                statusClass,
              )}
            >
              {listing.status}
            </span>
            {listing.dom != null && (
              <span className="rounded bg-black/40 px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
                DOM {listing.dom} {listing.status === "Sold" ? "(to close)" : ""}
              </span>
            )}
            <span className="text-[11px] text-white/75 sm:text-xs">
              MLS: {listing.mlsRawStatus} · ID {listing.linkId}
            </span>
          </div>

          <h1 className="text-xl font-semibold leading-tight drop-shadow-sm sm:text-2xl lg:text-3xl">
            {listing.addressLine}
            <span className="mt-1 block text-base font-normal text-white/90 sm:text-lg">
              {listing.neighborhood}
            </span>
          </h1>
        </div>
      </div>

      <div className="listing-hero-vitals border-t border-[#e0e6ef] bg-white px-4 py-4 sm:px-6 sm:py-5">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
          <VitalItem label={listing.status === "Sold" ? "Sold price" : "List price"}>
            {displayPrice(listing)}
          </VitalItem>
          <VitalItem label="Beds / baths">
            {listing.bedrooms ?? "—"} / {listing.bathrooms ?? "—"}
          </VitalItem>
          <VitalItem label="Total square footage">{sqFtLabel(listing)}</VitalItem>
          <VitalItem label="$ / SF">{pricePerSfDisplay(listing)}</VitalItem>
        </dl>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[#eef1f5] pt-4 sm:grid-cols-4">
          <VitalItem label="Year built">{listing.yearBuilt ?? "—"}</VitalItem>
          <VitalItem label="Lot size">{lot}</VitalItem>
        </dl>
      </div>
    </section>
  );
}
