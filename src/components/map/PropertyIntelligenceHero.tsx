"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { getZoningColor } from "@/lib/zoning-colors";
import { mapboxSatelliteStaticUrl } from "@/lib/mapbox-static-satellite";

type HeroMapCenter = { lng: number; lat: number };

function zoneHeadline(
  districtMatch: DistrictMatchForHero,
  parcelZoning: string | null | undefined,
  zoningLabel: string,
): string {
  const raw = (districtMatch?.code ?? parcelZoning ?? zoningLabel ?? "").toString().trim();
  if (!raw || raw.toLowerCase() === "unknown") return "SITE";
  return raw.toUpperCase().slice(0, 12);
}

/** Large mono label for zoning-DNA fallback (avoid showing “SITE” as a district code). */
function zoneMonoForDna(
  districtMatch: DistrictMatchForHero,
  parcelZoning: string | null | undefined,
  zoningLabel: string,
): string {
  const fromDistrict = districtMatch?.code?.trim();
  if (fromDistrict) return fromDistrict.toUpperCase().slice(0, 10);
  const pz = parcelZoning?.trim();
  if (pz && pz.toLowerCase() !== "unknown") return pz.toUpperCase().slice(0, 10);
  const zl = zoningLabel?.trim();
  if (zl && zl.toLowerCase() !== "unknown") return zl.toUpperCase().slice(0, 10);
  return "INTEL";
}

/** Matches `DistrictMatchLite` from PropertyIntelligencePanel (avoid circular imports). */
type DistrictMatchForHero = {
  code: string;
  info?: {
    maxGroundCover?: string;
  };
} | null;

type Props = {
  heroUrl: string | null;
  /** When set with `heroUrl`, wraps the listing photo in a new-tab link (LINK MLS or Nantucket Rentals). */
  heroListingHref?: string | null;
  title: string;
  compactHero: boolean;
  statusLabel: string;
  parcelId: string;
  watched: boolean;
  onToggleWatch: () => void;
  /** Parcel centroid from parent (synced from parcel GeoJSON). */
  parcelMapCenter: HeroMapCenter | null;
  /** LINK pin coordinates when present. */
  linkLngLat: HeroMapCenter | null;
  /** Nantucket Rentals coordinates when present. */
  rentalLngLat: HeroMapCenter | null;
  districtMatch: DistrictMatchForHero;
  zoningLabel: string;
  parcelZoning?: string | null;
};

function resolveHeroCenter(link: HeroMapCenter | null, rental: HeroMapCenter | null, parcel: HeroMapCenter | null): HeroMapCenter | null {
  if (link && Number.isFinite(link.lng) && Number.isFinite(link.lat)) return link;
  if (rental && Number.isFinite(rental.lng) && Number.isFinite(rental.lat)) return rental;
  if (parcel && Number.isFinite(parcel.lng) && Number.isFinite(parcel.lat)) return parcel;
  return null;
}

function ZoningDnaHero({
  title,
  districtMatch,
  zoningLabel,
  parcelZoning,
}: {
  title: string;
  districtMatch: DistrictMatchForHero;
  zoningLabel: string;
  parcelZoning?: string | null;
}) {
  const code = zoneMonoForDna(districtMatch, parcelZoning, zoningLabel);
  const tint = getZoningColor(parcelZoning ?? districtMatch?.code ?? zoningLabel, null);
  const maxGc = districtMatch?.info?.maxGroundCover ?? "—";
  return (
    <div
      className="relative flex min-h-[140px] flex-col justify-end overflow-hidden rounded-t-lg px-4 pb-4 pt-10 text-[var(--atlantic-navy)]"
      style={{
        backgroundColor: `${tint}22`,
        backgroundImage: `linear-gradient(145deg, ${tint}35 0%, rgba(255,255,255,0.92) 45%, ${tint}18 100%), repeating-linear-gradient(-12deg, transparent, transparent 8px, rgba(7,64,89,0.04) 8px, rgba(7,64,89,0.04) 9px)`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/30" />
      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--nantucket-gray)]">Zoning intelligence</p>
        <p className="mt-1 font-mono text-4xl font-bold leading-none tracking-tight text-[var(--atlantic-navy)]">{code}</p>
        <p className="mt-2 text-sm font-semibold text-[var(--atlantic-navy)]">Max ground cover · {maxGc}</p>
        <p className="mt-1 max-w-[95%] text-xs leading-snug text-[var(--nantucket-gray)]">
          Accessory / guest dwelling — verify use table + lot coverage with the full matrix below.
        </p>
        <p className="mt-3 line-clamp-2 text-xs font-medium text-[var(--atlantic-navy)]">{title}</p>
      </div>
    </div>
  );
}

export function PropertyIntelligenceHero({
  heroUrl,
  heroListingHref = null,
  title,
  compactHero,
  statusLabel,
  parcelId,
  watched,
  onToggleWatch,
  parcelMapCenter,
  linkLngLat,
  rentalLngLat,
  districtMatch,
  zoningLabel,
  parcelZoning,
}: Props) {
  const center = useMemo(
    () => resolveHeroCenter(linkLngLat, rentalLngLat, parcelMapCenter),
    [linkLngLat, rentalLngLat, parcelMapCenter],
  );

  const [satFailed, setSatFailed] = useState(false);

  useEffect(() => {
    setSatFailed(false);
  }, [center?.lng, center?.lat, compactHero]);

  const satelliteUrl = useMemo(() => {
    if (!center || satFailed) return null;
    const w = 400;
    const h = compactHero ? 320 : 250;
    return mapboxSatelliteStaticUrl({ lng: center.lng, lat: center.lat, zoom: 18, width: w, height: h, retina: true });
  }, [center, compactHero, satFailed]);

  const zoneBadge = zoneHeadline(districtMatch, parcelZoning, zoningLabel);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-slate-200",
        compactHero
          ? "min-h-[220px] h-[40vh] max-h-[min(360px,52dvh)] rounded-t-none"
          : "aspect-video rounded-t-lg",
      )}
    >
      {heroUrl ? (
        heroListingHref ? (
          <a
            href={heroListingHref}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 block cursor-pointer"
            aria-label="Open full listing in new tab"
          >
            <Image src={heroUrl} alt="" fill className="object-cover" sizes="(min-width: 1024px) 30vw, 100vw" unoptimized />
          </a>
        ) : (
          <Image src={heroUrl} alt="" fill className="object-cover" sizes="(min-width: 1024px) 30vw, 100vw" unoptimized />
        )
      ) : satelliteUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- Mapbox signed-style URL; dimensions match requested static size */}
          <img
            src={satelliteUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setSatFailed(true)}
          />
          <div className="pointer-events-none absolute left-3 top-10 z-[1] rounded-md bg-black/45 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white/95">
            Satellite view
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
          {!compactHero ? (
            <div className="pointer-events-none absolute left-3 bottom-3 right-3 text-white">
              <div className="line-clamp-2 text-base font-semibold leading-snug drop-shadow-sm">{title}</div>
            </div>
          ) : null}
          <div className="pointer-events-none absolute right-3 top-11 max-w-[11rem] rounded bg-black/60 px-2 py-1 text-right text-[10px] font-semibold uppercase tracking-wide text-white">
            {zoneBadge === "SITE" ? "Aerial lot" : `${zoneBadge} · district`}
          </div>
        </>
      ) : (
        <ZoningDnaHero
          title={title}
          districtMatch={districtMatch}
          zoningLabel={zoningLabel}
          parcelZoning={parcelZoning}
        />
      )}

      <div className="absolute left-2 top-2 flex w-[calc(100%-1rem)] items-start justify-between gap-2">
        <span
          title={statusLabel}
          className="max-w-[min(72vw,15rem)] truncate rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm"
        >
          {statusLabel}
        </span>
        {!compactHero && parcelId ? (
          <button
            type="button"
            onClick={onToggleWatch}
            className="rounded-full bg-black/45 p-2 text-white backdrop-blur-sm hover:bg-black/60"
            aria-label={watched ? "Remove from watchlist" : "Watch property"}
          >
            <Heart className={cn("h-4 w-4", watched && "fill-red-400 text-red-400")} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
