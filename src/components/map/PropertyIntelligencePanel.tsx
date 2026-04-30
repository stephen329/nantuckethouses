"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/components/ui/utils";
import type { ParcelProperties } from "@/components/zoning/ZoningMap";
import type { LinkListingPinProperties, ParcelMapLinkListingMatch } from "@/lib/link-listings-parcel-match";
import type { NrMapRentalResult } from "@/lib/nr-map-rentals";
import { nantucketLinkListingUrl } from "@/lib/link-listing-url";
import { nantucketVacationRentalListingUrl } from "@/lib/nr-vacation-rental-url";
import {
  formatExpansionIdea,
  getExpansionIntelligence,
  type ExpansionIntelligence,
} from "@/lib/property-expansion-intelligence";
import { parcelIsWatched, toggleWatchParcelId } from "@/lib/omnibox-local-storage";
import { PropertyIntelligenceHero } from "@/components/map/PropertyIntelligenceHero";

export type DistrictMatchLite = {
  code: string;
  info: {
    name?: string;
    minLotSize?: string;
    frontage?: string;
    maxGroundCover?: string;
    frontSetback?: string;
    sideSetback?: string;
    rearSetback?: string;
  };
} | null;

type TimelineEntry = { year: string; label: string };

function formatMoney(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function linkListPriceNum(p: LinkListingPinProperties): number {
  if (p.pool === "sold" && p.closePriceNum > 0) return p.closePriceNum;
  return p.listPriceNum;
}

function linkMlsNeighborhood(mlsArea: string | null | undefined): string | null {
  const s = mlsArea?.trim();
  return s ? s : null;
}

function rentalPulseRows(listPrice: number | null, weeklyRent: number | null) {
  const peak = weeklyRent ?? (listPrice != null && listPrice > 0 ? Math.max(8000, Math.round(listPrice * 0.0011)) : null);
  if (peak == null) return null;
  /** Rule of thumb: ~10 peak summer weeks of gross rent (simplified annual revenue). */
  const annualRevenue = Math.round(peak * 10);
  const cap =
    listPrice != null && listPrice > 0
      ? `${((annualRevenue / listPrice) * 100).toFixed(1)}% (at list)`
      : "—";
  return { peak, annualRevenue, cap };
}

function buildTimeline(link: LinkListingPinProperties | null): TimelineEntry[] {
  const out: TimelineEntry[] = [];
  if (link?.pool === "sold" && link.closeDate) {
    const y = String(link.closeDate).slice(0, 4);
    out.push({ year: y || "—", label: `Sold — ${link.closePrice || link.listPrice || "price on file"}` });
  }
  out.push({ year: "—", label: "HDC / permit history: request a pulled file from Stephen for this parcel." });
  out.push({ year: "—", label: "Rental history: peak weeks and rate cards available on comparable corridor homes." });
  return out.slice(0, 4);
}

type Props = {
  hubTitle?: string;
  /** Mobile bottom sheet: tighter hero (4:3). */
  compactHero?: boolean;
  selectedParcel: ParcelProperties | null;
  selectedRental: NrMapRentalResult | null;
  selectedLink: LinkListingPinProperties | null;
  linkListingId: string | null;
  /** LINK row for this parcel (viewport pins or `?parcel_id=` server match). */
  parcelLinkListingMatch?: ParcelMapLinkListingMatch | null;
  vacationRentalSlug: string | null;
  districtMatch: DistrictMatchLite;
  zoningLabel: string;
  /** Parcel centroid for satellite hero (property map only). */
  parcelMapCenter?: { lng: number; lat: number } | null;
  onWatchChange?: () => void;
  /** Switch map to rentals view and frame nearby inventory (parcel selection). */
  onViewComparableRentals?: () => void;
};

const ATLANTIC_NAVY = "#0c2340";
const PRIVET_MIST = "#22c55e";

function ExpansionBlock({ exp, zoneLabel }: { exp: ExpansionIntelligence; zoneLabel: string }) {
  const pct = exp.percentUtilized ?? 0;
  const barPct = exp.percentUtilized != null ? Math.min(100, pct) : 100;
  const usedGradient = `linear-gradient(90deg, ${ATLANTIC_NAVY} 0%, #1e4b7a 55%, #2563eb 100%)`;
  const barBackground =
    !exp.footprintUnknown && exp.percentUtilized != null
      ? `linear-gradient(90deg, ${ATLANTIC_NAVY} 0%, ${ATLANTIC_NAVY} ${barPct}%, ${PRIVET_MIST} ${barPct}%, #4ade80 100%)`
      : undefined;

  return (
    <section className="border-t border-[var(--cedar-shingle)]/15 pt-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-[var(--atlantic-navy)]">Expansion potential</h3>
        <span
          className={cn(
            "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
            exp.verdictLevel === "HIGH" && "bg-emerald-100 text-emerald-900",
            exp.verdictLevel === "MODERATE" && "bg-amber-100 text-amber-900",
            exp.verdictLevel === "MAXED" && "bg-red-100 text-red-900",
          )}
        >
          {exp.verdictLevel}
        </span>
      </div>
      <div className="mb-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 shadow-inner">
        {exp.footprintUnknown ? (
          <div
            className="h-full w-full rounded-full bg-gradient-to-r from-slate-300 via-slate-100 to-slate-300"
            title="Measured footprint not in dataset"
          />
        ) : (
          <div
            className="h-full w-full rounded-full transition-all"
            style={{ background: barBackground ?? usedGradient, width: "100%" }}
            title="Atlantic navy = estimated used ground cover · green = remaining envelope"
          />
        )}
      </div>
      <p className="text-xs text-[var(--nantucket-gray)]">
        {exp.percentUtilized != null ? (
          <>
            <span className="font-semibold text-[var(--atlantic-navy)]">{pct}%</span> utilized ground cover (est.)
          </>
        ) : (
          <span className="text-[var(--nantucket-gray)]">Current footprint not in parcel GIS — bar shows zoning allowance only.</span>
        )}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--atlantic-navy)]">
        {exp.remainingSqFt.toLocaleString()} sq ft remaining ground cover (envelope)
      </p>
      <p className="mt-1 text-xs leading-snug text-[var(--atlantic-navy)]">{formatExpansionIdea(exp)}</p>
      <p className="mt-1 text-xs text-[var(--nantucket-gray)]">
        {zoneLabel} •{" "}
        {exp.hdcNote ? (
          <span className="inline-flex items-center gap-1">
            HDC review likely for visible exterior work
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="inline-flex rounded p-0.5 text-[var(--atlantic-navy)] hover:bg-slate-100" aria-label="HDC note">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[14rem] text-left text-[11px] leading-snug">
                All changes visible from the street must go through Historical District Commission approval when within an HDC
                district. Confirm jurisdiction on every project.
              </TooltipContent>
            </Tooltip>
          </span>
        ) : (
          "Confirm HDC jurisdiction with the commission before assuming exterior freedom."
        )}
      </p>
    </section>
  );
}

function ZoningCheatSheet({ code, districtMatch }: { code: string; districtMatch: DistrictMatchLite }) {
  const info = districtMatch?.info;
  return (
    <section className="border-t border-[var(--cedar-shingle)]/15 pt-3">
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--atlantic-navy)]">Zoning cheat sheet — {code}</h3>
      <ul className="grid gap-1 text-[11px] leading-snug text-[var(--atlantic-navy)]">
        <li className="flex justify-between gap-2 border-b border-[var(--cedar-shingle)]/10 py-0.5">
          <span className="text-[var(--nantucket-gray)]">Max ground cover</span>
          <span className="font-medium">{info?.maxGroundCover ?? "—"}</span>
        </li>
        <li className="flex justify-between gap-2 border-b border-[var(--cedar-shingle)]/10 py-0.5">
          <span className="text-[var(--nantucket-gray)]">Min lot size</span>
          <span className="font-medium">{info?.minLotSize ?? "—"}</span>
        </li>
        <li className="flex justify-between gap-2 border-b border-[var(--cedar-shingle)]/10 py-0.5">
          <span className="text-[var(--nantucket-gray)]">Frontage</span>
          <span className="font-medium">{info?.frontage ?? "—"}</span>
        </li>
        <li className="flex justify-between gap-2 border-b border-[var(--cedar-shingle)]/10 py-0.5">
          <span className="text-[var(--nantucket-gray)]">Setbacks</span>
          <span className="text-right font-medium">
            {info?.frontSetback ?? "—"} front · {info?.sideSetback ?? "—"} side · {info?.rearSetback ?? "—"} rear
          </span>
        </li>
        <li className="flex justify-between gap-2 py-0.5">
          <span className="text-[var(--nantucket-gray)]">Secondary dwelling</span>
          <span className="max-w-[55%] text-right font-medium">Accessory / guest — verify use table + lot coverage</span>
        </li>
      </ul>
    </section>
  );
}

function buildDeepAnalysisMailto(opts: {
  parcelId: string;
  title: string;
  expansion: ExpansionIntelligence;
  zoneLabel: string;
}): string {
  const lines = [
    `Parcel ID: ${opts.parcelId}`,
    `Zoning: ${opts.zoneLabel}`,
    `Expansion verdict: ${opts.expansion.verdictLevel}`,
    opts.expansion.percentUtilized != null
      ? `Est. ground cover used: ${opts.expansion.percentUtilized}%`
      : "Ground cover utilization: not in parcel GIS (envelope-only estimate)",
    `Remaining ground cover (est.): ${opts.expansion.remainingSqFt.toLocaleString()} sq ft`,
    "",
    "What would you stress-test on this parcel?",
  ];
  const subject = encodeURIComponent(`Deeper analysis: ${opts.title} (${opts.parcelId})`);
  const body = encodeURIComponent(lines.join("\n"));
  return `mailto:stephen@nantuckethouses.com?subject=${subject}&body=${body}`;
}

export function PropertyIntelligencePanel({
  hubTitle = "Nantucket Market Pulse — Town Area",
  compactHero = false,
  selectedParcel,
  selectedRental,
  selectedLink,
  linkListingId,
  parcelLinkListingMatch = null,
  vacationRentalSlug,
  districtMatch,
  zoningLabel,
  parcelMapCenter = null,
  onWatchChange,
  onViewComparableRentals,
}: Props) {
  const has = Boolean(selectedParcel || selectedRental || selectedLink);
  const parcelId = String(selectedParcel?.parcel_id ?? "").trim();
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    if (!parcelId) {
      setWatched(false);
      return;
    }
    setWatched(parcelIsWatched(parcelId));
  }, [parcelId]);

  const onToggleWatch = useCallback(() => {
    if (!parcelId) return;
    toggleWatchParcelId(parcelId);
    setWatched(parcelIsWatched(parcelId));
    onWatchChange?.();
  }, [parcelId, onWatchChange]);

  const lotSqft = useMemo(() => {
    if (selectedParcel?.lot_area_sqft != null && selectedParcel.lot_area_sqft > 0) return selectedParcel.lot_area_sqft;
    if (selectedLink?.lotAcres != null && selectedLink.lotAcres > 0) return Math.round(selectedLink.lotAcres * 43_560);
    return null;
  }, [selectedParcel?.lot_area_sqft, selectedLink?.lotAcres]);

  const zoneForExpansion = selectedParcel?.zoning ?? districtMatch?.code ?? null;

  const expansion = useMemo(() => {
    if (lotSqft == null || lotSqft <= 0) return null;
    return getExpansionIntelligence({ lotSizeSqft: lotSqft, currentGroundCoverSqFt: null }, zoneForExpansion);
  }, [lotSqft, zoneForExpansion]);

  const listPriceForPulse = useMemo(() => {
    if (selectedLink != null) return linkListPriceNum(selectedLink);
    const n = parcelLinkListingMatch?.listPriceNum;
    if (n != null && !Number.isNaN(n) && n > 0) return n;
    return null;
  }, [selectedLink, parcelLinkListingMatch?.listPriceNum]);

  const rentalPulse = useMemo(() => {
    const wk = selectedRental?.weeklyRentEstimate ?? null;
    return rentalPulseRows(listPriceForPulse, wk);
  }, [selectedRental?.weeklyRentEstimate, listPriceForPulse]);

  const timeline = useMemo(() => buildTimeline(selectedLink), [selectedLink]);

  if (!has) {
    return (
      <div className="space-y-4 rounded-lg border border-[var(--cedar-shingle)]/20 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold tracking-tight text-[var(--atlantic-navy)] lg:text-lg">Property intelligence</h2>
        <div className="rounded-lg border border-[var(--cedar-shingle)]/15 bg-[var(--sandstone)]/35 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--privet-green)]">Market pulse</p>
          <p className="mt-1 text-sm font-semibold leading-snug text-[var(--atlantic-navy)]">{hubTitle}</p>
          <ul className="mt-3 space-y-2 border-t border-[var(--cedar-shingle)]/10 pt-3 text-sm text-[var(--nantucket-gray)]">
            <li>3 new listings in the last 48h (island-wide MLS pulse).</li>
            <li>2 notable price adjustments this week — ask Stephen for the story behind the numbers.</li>
          </ul>
        </div>
        <div className="rounded-md border border-[var(--privet-green)]/25 bg-[var(--privet-green)]/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--atlantic-navy)]">Stephen&apos;s pick of the week</p>
          <p className="mt-1 text-sm text-[var(--atlantic-navy)]">
            Surfside corridor: strong rental weeks, tight resale inventory, and sensible zoning for the right renovation play.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link href="/neighborhoods" className="rounded-full border border-[var(--cedar-shingle)]/30 px-3 py-1 text-[var(--atlantic-navy)] hover:bg-[var(--sandstone)]">
            Highest rental yield zones
          </Link>
          <Link href="/market-pulse" className="rounded-full border border-[var(--cedar-shingle)]/30 px-3 py-1 text-[var(--atlantic-navy)] hover:bg-[var(--sandstone)]">
            Most active streets
          </Link>
        </div>
      </div>
    );
  }

  const heroUrl =
    selectedLink != null
      ? selectedLink.thumbUrl
      : selectedRental?.thumbUrl ?? parcelLinkListingMatch?.thumbUrl ?? null;
  const title =
    selectedLink?.address ??
    selectedRental?.streetAddress ??
    selectedRental?.headline ??
    selectedParcel?.location ??
    "Property";
  const subPrice =
    selectedLink != null
      ? `${selectedLink.pool === "sold" ? selectedLink.closePrice || selectedLink.listPrice : selectedLink.listPrice} • ${selectedLink.pool === "sold" ? "Sold" : "Active"} • LINK MLS`
      : selectedRental != null
        ? `${selectedRental.headline} • Active • Nantucket Rentals`
        : selectedParcel != null &&
            parcelLinkListingMatch?.pool === "active" &&
            parcelLinkListingMatch.listPrice
          ? `${parcelLinkListingMatch.listPrice}${parcelLinkListingMatch.mlsArea?.trim() ? ` ${parcelLinkListingMatch.mlsArea.trim()}` : ""}`
          : `${selectedParcel?.tax_map ?? ""} · ${selectedParcel?.parcel ?? ""} • Parcel`;

  const showZoning = Boolean(selectedParcel && districtMatch);
  const expansionZoneLabel = expansion?.zoneCodeResolved ?? zoningLabel;
  /** “Expansion potential” UI only when measured ground cover exists (not envelope-only). */
  const showExpansionPotential = Boolean(expansion?.percentUtilized != null);

  const linkLngLat =
    selectedLink != null &&
    selectedLink.longitude != null &&
    selectedLink.latitude != null &&
    Number.isFinite(selectedLink.longitude) &&
    Number.isFinite(selectedLink.latitude)
      ? { lng: selectedLink.longitude, lat: selectedLink.latitude }
      : parcelLinkListingMatch != null &&
          parcelLinkListingMatch.longitude != null &&
          parcelLinkListingMatch.latitude != null &&
          Number.isFinite(parcelLinkListingMatch.longitude) &&
          Number.isFinite(parcelLinkListingMatch.latitude)
        ? { lng: parcelLinkListingMatch.longitude, lat: parcelLinkListingMatch.latitude }
        : null;

  const rentalLngLat =
    selectedRental != null &&
    Number.isFinite(selectedRental.longitude) &&
    Number.isFinite(selectedRental.latitude)
      ? { lng: selectedRental.longitude, lat: selectedRental.latitude }
      : null;

  const statusLabel =
    selectedLink?.pool === "sold"
      ? linkMlsNeighborhood(selectedLink.mlsArea) ?? "Sold"
      : selectedLink
        ? linkMlsNeighborhood(selectedLink.mlsArea) ?? "For sale"
        : parcelLinkListingMatch?.pool === "sold"
          ? linkMlsNeighborhood(parcelLinkListingMatch.mlsArea) ?? "Sold"
          : parcelLinkListingMatch?.pool === "active"
            ? linkMlsNeighborhood(parcelLinkListingMatch.mlsArea) ?? "For sale"
            : selectedRental
              ? "For rent"
              : linkMlsNeighborhood(parcelLinkListingMatch?.mlsArea) ?? "Parcel";

  const heroListingHref = (() => {
    if (selectedLink != null) return nantucketLinkListingUrl(selectedLink.linkId);
    if (selectedRental?.thumbUrl && selectedRental.slug?.trim()) {
      return nantucketVacationRentalListingUrl(selectedRental.slug.trim());
    }
    if (parcelLinkListingMatch && !selectedRental?.thumbUrl) {
      return nantucketLinkListingUrl(parcelLinkListingMatch.linkId);
    }
    return null;
  })();

  return (
    <div className="space-y-0 rounded-lg border border-[var(--cedar-shingle)]/20 bg-white shadow-sm">
      <PropertyIntelligenceHero
        heroUrl={heroUrl}
        heroListingHref={heroListingHref}
        title={title}
        compactHero={compactHero}
        statusLabel={statusLabel}
        parcelId={parcelId}
        watched={watched}
        onToggleWatch={onToggleWatch}
        parcelMapCenter={parcelMapCenter}
        linkLngLat={linkLngLat}
        rentalLngLat={rentalLngLat}
        districtMatch={districtMatch}
        zoningLabel={zoningLabel}
        parcelZoning={selectedParcel?.zoning ?? null}
      />

      <div className="space-y-3 p-4">
        <div>
          <h2 className="text-lg font-semibold leading-tight text-[var(--atlantic-navy)]">{title}</h2>
          <p className="mt-1 text-xs text-[var(--nantucket-gray)]">{subPrice}</p>
        </div>

        {showExpansionPotential && expansion ? (
          <ExpansionBlock exp={expansion} zoneLabel={expansionZoneLabel} />
        ) : expansion == null ? (
          <p className="border-t border-[var(--cedar-shingle)]/15 pt-3 text-xs text-[var(--nantucket-gray)]">
            Expansion math needs lot size from assessor data. Pan to a parcel or open a LINK pin with lot acres.
          </p>
        ) : null}

        {rentalPulse ? (
          <section className="border-t border-[var(--cedar-shingle)]/15 pt-3">
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--atlantic-navy)]">Rental pulse</h3>
            <dl className="space-y-1 text-[11px]">
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--nantucket-gray)]">Peak weekly (Jul–Aug)</dt>
                <dd className="font-medium text-[var(--atlantic-navy)]">{formatMoney(rentalPulse.peak)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--nantucket-gray)]">Est. annual revenue</dt>
                <dd className="font-medium text-[var(--atlantic-navy)]">{formatMoney(rentalPulse.annualRevenue)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--nantucket-gray)]">Est. cap rate</dt>
                <dd className="font-medium text-[var(--atlantic-navy)]">{rentalPulse.cap}</dd>
              </div>
            </dl>
            {expansion ? (
              <p className="mt-2 border-l-2 border-[var(--privet-green)] pl-2 text-xs italic leading-snug text-[var(--nantucket-gray)]">
                <span className="font-semibold not-italic text-[var(--atlantic-navy)]">Maury&apos;s take: </span>
                {expansion.mauryInsight}
              </p>
            ) : null}
            {parcelId && expansion ? (
              <a
                href={buildDeepAnalysisMailto({
                  parcelId,
                  title,
                  expansion,
                  zoneLabel: expansionZoneLabel,
                })}
                className="mt-2 inline-block text-[11px] font-medium text-blue-800 underline decoration-blue-800/40 underline-offset-2 hover:text-blue-950"
              >
                Ask Stephen for deeper analysis on this parcel
              </a>
            ) : null}
            {onViewComparableRentals ? (
              <Button type="button" variant="outline" className="mt-3 w-full text-xs" onClick={onViewComparableRentals}>
                View comparable rentals →
              </Button>
            ) : (
              <Button asChild variant="outline" className="mt-3 w-full text-xs">
                <Link href="/map?mode=rent">View comparable rentals →</Link>
              </Button>
            )}
          </section>
        ) : expansion ? (
          <section className="border-t border-[var(--cedar-shingle)]/15 pt-3">
            <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--atlantic-navy)]">Maury&apos;s take</h3>
            <p className="text-xs leading-snug text-[var(--nantucket-gray)]">{expansion.mauryInsight}</p>
            {parcelId ? (
              <a
                href={buildDeepAnalysisMailto({
                  parcelId,
                  title,
                  expansion,
                  zoneLabel: expansionZoneLabel,
                })}
                className="mt-2 inline-block text-[11px] font-medium text-blue-800 underline decoration-blue-800/40 underline-offset-2 hover:text-blue-950"
              >
                Ask Stephen for deeper analysis on this parcel
              </a>
            ) : null}
            {onViewComparableRentals ? (
              <Button type="button" variant="outline" className="mt-3 w-full text-xs" onClick={onViewComparableRentals}>
                View comparable rentals →
              </Button>
            ) : (
              <Button asChild variant="outline" className="mt-3 w-full text-xs">
                <Link href="/map?mode=rent">View comparable rentals →</Link>
              </Button>
            )}
          </section>
        ) : null}

        {showZoning && districtMatch ? <ZoningCheatSheet code={districtMatch.code} districtMatch={districtMatch} /> : selectedParcel ? (
          <section className="border-t border-[var(--cedar-shingle)]/15 pt-3">
            <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--atlantic-navy)]">Zoning</h3>
            <p className="text-xs text-[var(--nantucket-gray)]">District {zoningLabel} — open district profile in the full matrix below.</p>
          </section>
        ) : null}

        <section className="border-t border-[var(--cedar-shingle)]/15 pt-3">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--atlantic-navy)]">Historical timeline</h3>
          <ul className="space-y-2">
            {timeline.map((t, i) => (
              <li key={`${t.year}-${i}`} className="flex gap-2 text-[11px]">
                <span className="w-10 shrink-0 font-semibold text-[var(--atlantic-navy)]">{t.year}</span>
                <span className="text-[var(--nantucket-gray)]">{t.label}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-2 border-t border-[var(--cedar-shingle)]/15 pt-3">
          {selectedParcel?.internal_id ? (
            <Button asChild variant="outline" className="w-full text-sm">
              <a
                href={`https://gis.vgsi.com/nantucketma/Parcel.aspx?Pid=${encodeURIComponent(String(selectedParcel.internal_id))}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Assessor&apos;s Record
              </a>
            </Button>
          ) : null}
          {selectedLink ? (
            <Button asChild className="w-full bg-blue-700 text-sm text-white hover:bg-blue-800">
              <a href={nantucketLinkListingUrl(selectedLink.linkId)} target="_blank" rel="noopener noreferrer">
                View full LINK listing
              </a>
            </Button>
          ) : null}
          {linkListingId && !selectedLink ? (
            <Button asChild className="w-full bg-blue-700 text-sm text-white hover:bg-blue-800">
              <a href={nantucketLinkListingUrl(linkListingId)} target="_blank" rel="noopener noreferrer">
                View full LINK listing
              </a>
            </Button>
          ) : null}
          {selectedRental?.slug?.trim() ? (
            <Button asChild variant="outline" className="w-full text-sm">
              <a href={nantucketVacationRentalListingUrl(selectedRental.slug)} target="_blank" rel="noopener noreferrer">
                View rental listing
              </a>
            </Button>
          ) : null}
          {vacationRentalSlug && !selectedRental ? (
            <Button asChild variant="outline" className="w-full text-sm">
              <a href={nantucketVacationRentalListingUrl(vacationRentalSlug)} target="_blank" rel="noopener noreferrer">
                Comparable rental on file
              </a>
            </Button>
          ) : null}
          <Button asChild className="w-full bg-[var(--atlantic-navy)] text-sm text-white">
            <a
              href={`mailto:stephen@nantuckethouses.com?subject=${encodeURIComponent(`Property: ${title} — valuation / tour`)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Custom valuation or property tour — opens your email app"
            >
              Message Stephen
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
