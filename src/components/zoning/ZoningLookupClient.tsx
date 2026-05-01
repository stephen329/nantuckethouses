"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FeatureCollection, Geometry, Point } from "geojson";
import { ChevronDown, Map as MapIcon, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";
import { MapLegend } from "@/components/zoning/MapLegend";
import { ParcelZoningUsesSection, type ZoningUseRow } from "@/components/zoning/ParcelZoningUsesSection";
import { ParcelProperties, ZoningMap, type ParcelBaseMapLayer } from "@/components/zoning/ZoningMap";
import zoningData from "@/data/zoning-districts.json";
import zoningUseChart from "@/data/zoning-use-chart.json";
import recentSoldParcels from "@/data/recent-sold-parcels.json";
import nrRentalSlugsByParcel from "@/data/nr-rental-slugs-by-parcel.json";
import { getZoningColor } from "@/lib/zoning-colors";
import { nantucketLinkListingUrl } from "@/lib/link-listing-url";
import {
  linkListingMatchForParcelMapSelection,
  type LinkListingPinFeature,
  type LinkListingPinProperties,
  type ParcelMapLinkListingMatch,
} from "@/lib/link-listings-parcel-match";
import type { NrMapRentalResult, RentalPinFeature } from "@/lib/nr-map-rentals";
import { rentalsToGeoJson } from "@/lib/nr-map-rentals";
import {
  nantucketRentalsComparableSearchUrlFromListingBedrooms,
  nantucketRentalsPropertySearchUrl,
  nantucketVacationRentalListingUrl,
} from "@/lib/nr-vacation-rental-url";
import {
  applyRentalFilters,
  buildMapAppliedFilterChips,
  countActiveLinkFilters,
  countActiveRentalFilters,
  DEFAULT_LINK_FILTERS,
  DEFAULT_RENTAL_FILTERS,
  filterLinkFeatureCollection,
  LINK_MAP_DEFAULT_SOLD_FEED_DAYS,
  removeMapAppliedFilterChip,
  type LinkFiltersState,
  type PropertyMapMode,
  type RentalFiltersState,
} from "@/lib/property-map-filters";
import { PropertyMapFiltersSheet } from "@/components/map/PropertyMapFiltersSheet";
import {
  PropertyMapDesktopLayerBar,
  PropertyMapLayerHelpTrigger,
  PropertyMapOverlayChip,
  ZoningLookupColorsStrip,
} from "@/components/map/PropertyMapLayerBar";
import { MapLegalNoticeButton } from "@/components/map/MapLegalNoticeButton";
import { MapResearchHubStickyFooter } from "@/components/map/MapResearchHubStickyFooter";
import { MapOmnibox } from "@/components/map/MapOmnibox";
import { PropertyIntelligencePanel } from "@/components/map/PropertyIntelligencePanel";
import type { OmniboxActiveListing, OmniboxRentalHit, OmniboxSoldComp } from "@/lib/map-omnibox-types";
import { MAP_NEIGHBORHOOD_BOUNDS } from "@/lib/map-neighborhood-bounds";
import { centroidFromGeometry } from "@/lib/geo-centroid";
import { formatLinkMlsDateDisplay } from "@/lib/link-listing-date-format";
import { findParcelFeatureByListingAddress, findParcelFeatureForLinkPin } from "@/lib/link-pin-parcel-resolve";
import { findParcelFeatureForNrRental } from "@/lib/rental-parcel-resolve";
import { bboxForReDistrictAbbrv } from "@/lib/re-districts-map";
type RecentSoldParcelsFeed = {
  parcelIds: string[];
  linkListingByParcelId: Record<string, string>;
  matchedParcelCount: number;
  listingCount: number;
};

type NrRentalSlugsFeed = {
  slugByParcelId: Record<string, string>;
  matchedParcelCount: number;
  listingCount: number;
};

export type { PropertyMapMode } from "@/lib/property-map-filters";
type SelectableMapMode = Exclude<PropertyMapMode, "all">;

const EMPTY_LINK_FC: FeatureCollection<Point, LinkListingPinProperties> = { type: "FeatureCollection", features: [] };

function parseMapModes(v: string | null): SelectableMapMode[] {
  if (v == null) return ["rent"];
  const t = v.trim();
  if (t === "" || t === "none") return [];
  if (t === "all") return ["rent", "sale", "sold"];
  const parts = v
    .split(",")
    .map((x) => x.trim())
    .filter((x): x is SelectableMapMode => x === "rent" || x === "sale" || x === "sold");
  const unique = Array.from(new Set(parts));
  return unique.length ? unique : [];
}

function serializeMapModes(modes: SelectableMapMode[]): string {
  const uniq = Array.from(new Set(modes));
  if (!uniq.length) return "none";
  const order: SelectableMapMode[] = ["sale", "rent", "sold"];
  return order.filter((m) => uniq.includes(m)).join(",");
}

function effectiveModeForOmnibox(modes: SelectableMapMode[]): PropertyMapMode {
  if (modes.length === 0) return "all";
  const hasRent = modes.includes("rent");
  const hasSale = modes.includes("sale");
  const hasSold = modes.includes("sold");
  if (hasRent && hasSale && hasSold) return "all";
  if (hasRent && !hasSale && !hasSold) return "rent";
  if (!hasRent && hasSale && !hasSold) return "sale";
  if (!hasRent && !hasSale && hasSold) return "sold";
  return "all";
}

type ParcelFeatureCollection = FeatureCollection<Geometry, ParcelProperties>;
type ParcelFeature = ParcelFeatureCollection["features"][number];
type DistrictInfo = {
  name?: string;
  minLotSize?: string;
  frontage?: string;
  maxGroundCover?: string;
  frontSetback?: string;
  sideSetback?: string;
  rearSetback?: string;
};

type UsePermission = { value: string; allowed: boolean };

function formatCurrency(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value?: number | null, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

function formatTruncatedAcreage(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  const truncated = Math.trunc(value * 100) / 100;
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(truncated);
}

function normalizeDistrictCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "").replace(/-/g, "");
}

/** Tailwind `lg` (1024px): parcel detail uses the aside; below this width use the drawer. */
function isNarrowForParcelDrawer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 1023px)").matches;
}

function getStephensTake(selectedParcel: ParcelProperties | null): string | null {
  if (!selectedParcel) return null;
  const zoning = String(selectedParcel.zoning ?? "").toUpperCase();
  if (zoning.includes("ROH")) {
    return "Strong year-round and seasonal rental demand in many ROH pockets. Well-kept properties here often see premium weekly rents in peak season.";
  }
  if (zoning.includes("R-10") || zoning.includes("R10")) {
    return "R-10 areas are often a sweet spot: broad buyer demand, good liquidity, and consistent renovation upside when zoning constraints are respected.";
  }
  if (zoning.includes("R-20") || zoning.includes("R20") || zoning.includes("R-40") || zoning.includes("R40")) {
    return "Lower-density districts can hold long-term value well, especially where lot configuration supports expansion potential without heavy variance risk.";
  }
  if (zoning.includes("CN") || zoning.includes("RC")) {
    return "Mixed-use and commercial-adjacent zones can move on story and location. Underwriting permitting risk early is critical for real confidence.";
  }
  return "Parcel-level context matters on Nantucket. I focus on zoning constraints, neighborhood demand, and resale liquidity before any final valuation call.";
}

function linkPinFromOmniboxHit(hit: OmniboxActiveListing | OmniboxSoldComp, pool: "active" | "sold"): LinkListingPinProperties {
  const isSold = pool === "sold";
  const price = typeof hit.price === "number" && !Number.isNaN(hit.price) ? hit.price : 0;
  return {
    linkId: hit.id,
    pool,
    address: hit.address,
    listPrice: isSold ? "" : hit.priceLabel,
    listPriceNum: isSold ? 0 : price,
    closePrice: isSold ? hit.priceLabel : "",
    closePriceNum: isSold ? price : 0,
    closeDate: isSold && "closeDate" in hit && hit.closeDate ? hit.closeDate : "",
    thumbUrl: null,
    slug: null,
    bedrooms: null,
    baths: null,
    lotAcres: null,
    waterfront: false,
    newConstruction: false,
    propertyType: null,
    mlsArea: null,
    onMarketDate: null,
    livingAreaSqft: null,
    renoHint: false,
    townWalkHint: false,
    hasPool: false,
    longitude: hit.lng ?? null,
    latitude: hit.lat ?? null,
  };
}

type PanelProps = {
  selectedParcel: ParcelProperties | null;
  zoningLabel: string;
  districtMatch: { code: string; info: DistrictInfo } | null;
  zoningUseRows: ZoningUseRow[];
  /** LINK MLS listing id when this parcel appears in the imported feed (`linkListingByParcelId`). */
  linkListingId: string | null;
  /** Nantucket Rentals site slug when parcel matches built feed (`nr-rental-slugs-by-parcel.json`). */
  vacationRentalSlug: string | null;
  /** Property map: switch to sold comps and frame this parcel. */
  onViewNearbySales?: () => void;
  /** Property map: switch to rentals and frame this parcel. */
  onViewComparableRentals?: () => void;
  /** Property map: LINK row matched to this parcel (active at centroid preferred). */
  parcelLinkListingMatch?: ParcelMapLinkListingMatch | null;
};

function ParcelDetailPanel({
  selectedParcel,
  zoningLabel,
  districtMatch,
  zoningUseRows,
  linkListingId,
  vacationRentalSlug,
  onViewNearbySales,
  onViewComparableRentals,
  parcelLinkListingMatch = null,
}: PanelProps) {
  const legend = (zoningUseChart as { metadata: { legend: Record<string, string> } }).metadata.legend;
  const stephensTake = useMemo(() => getStephensTake(selectedParcel), [selectedParcel]);

  const mlsListingLinkId = parcelLinkListingMatch?.linkId ?? linkListingId;

  return (
    <div className="flex min-h-[620px] flex-col">
      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--nantucket-gray)]">Parcel Detail</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl text-[var(--atlantic-navy)]">{selectedParcel?.location ?? "Select a parcel on the map"}</h2>
            {selectedParcel?.internal_id ? (
              <Button asChild variant="outline" size="sm">
                <a href={`https://gis.vgsi.com/nantucketma/Parcel.aspx?Pid=${encodeURIComponent(String(selectedParcel.internal_id))}`} target="_blank" rel="noopener noreferrer">
                  View Assessor&apos;s Record
                </a>
              </Button>
            ) : null}
            {mlsListingLinkId ? (
              <Button asChild variant="outline" size="sm">
                <a href={nantucketLinkListingUrl(mlsListingLinkId)} target="_blank" rel="noopener noreferrer">
                  View LINK listing
                </a>
              </Button>
            ) : null}
            {vacationRentalSlug ? (
              <Button asChild variant="outline" size="sm">
                <a href={nantucketVacationRentalListingUrl(vacationRentalSlug)} target="_blank" rel="noopener noreferrer">
                  View Vacation Rental Listing
                </a>
              </Button>
            ) : null}
          </div>
        </div>

        {parcelLinkListingMatch?.thumbUrl ? (
          <a
            href={nantucketLinkListingUrl(parcelLinkListingMatch.linkId)}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-lg border border-[var(--cedar-shingle)]/25 shadow-sm outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--atlantic-navy)]"
            aria-label="Open LINK MLS listing (photos)"
          >
            <div className="relative aspect-[16/10] w-full max-h-52">
              <Image
                src={parcelLinkListingMatch.thumbUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 420px, 100vw"
                unoptimized
              />
            </div>
          </a>
        ) : null}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border bg-white p-3">
            <p className="text-xs text-[var(--nantucket-gray)]">Zoning</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: getZoningColor(selectedParcel?.zoning, selectedParcel?.zoning_color) }}
              />
              <p className="font-medium">{zoningLabel}</p>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-3">
            <p className="text-xs text-[var(--nantucket-gray)]">Lot Size</p>
            <p className="mt-1 font-medium">{formatTruncatedAcreage(selectedParcel?.acreage)} acres ({formatNumber(selectedParcel?.lot_area_sqft, 0)} sqft)</p>
          </div>
          <div className="rounded-lg border bg-white p-3">
            <p className="text-xs text-[var(--nantucket-gray)]">Assessed Value</p>
            <p className="mt-1 font-medium">{formatCurrency(selectedParcel?.assessed_total)}</p>
          </div>
          <div className="rounded-lg border bg-white p-3">
            {parcelLinkListingMatch?.pool === "active" && parcelLinkListingMatch.listPrice ? (
              <>
                <p className="text-xs text-[var(--nantucket-gray)]">List price &amp; area</p>
                <p className="mt-1 text-lg font-semibold leading-snug tabular-nums text-[var(--atlantic-navy)]">
                  {parcelLinkListingMatch.listPrice}
                  {parcelLinkListingMatch.mlsArea?.trim()
                    ? ` ${parcelLinkListingMatch.mlsArea.trim()}`
                    : ""}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-[var(--nantucket-gray)]">Tax Map/Parcel</p>
                <p className="mt-1 font-medium">{selectedParcel?.tax_map ?? "N/A"} / {selectedParcel?.parcel ?? "N/A"}</p>
              </>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--cedar-shingle)]/25 bg-white p-4">
          {districtMatch ? (
            <div className="space-y-2 text-sm text-[var(--atlantic-navy)]">
              <p className="font-medium">{districtMatch.code} ({districtMatch.info.name ?? "District details"})</p>
              <p className="text-xs text-[var(--nantucket-gray)]">Minimum Lot Size: {districtMatch.info.minLotSize ?? "N/A"}</p>
              <p className="text-xs text-[var(--nantucket-gray)]">Minimum Frontage: {districtMatch.info.frontage ?? "N/A"}</p>
              <p className="text-xs text-[var(--nantucket-gray)]">Ground Cover Ratio: {districtMatch.info.maxGroundCover ?? "N/A"}</p>
              <p className="text-xs text-[var(--nantucket-gray)]">Setbacks: {districtMatch.info.frontSetback ?? "N/A"} front, {districtMatch.info.sideSetback ?? "N/A"} side, {districtMatch.info.rearSetback ?? "N/A"} rear</p>
            </div>
          ) : (
            <p className="text-sm text-[var(--atlantic-navy)]">No district rule profile found for zoning code {zoningLabel}.</p>
          )}
        </div>
        {stephensTake ? (
          <details className="rounded-lg border border-[var(--cedar-shingle)]/25 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--atlantic-navy)]">
              Stephen Maury&apos;s Take
            </summary>
            <p className="mt-2 text-sm text-[var(--nantucket-gray)]">{stephensTake}</p>
          </details>
        ) : null}
      </div>

      <div className={cn("mt-auto border-t bg-white p-4", "sticky bottom-0 md:static")}>
        <ParcelZoningUsesSection
          zoningCode={selectedParcel?.zoning ?? zoningLabel}
          districtMatch={districtMatch}
          zoningUseRows={zoningUseRows}
          legend={legend}
          chartSource={(zoningUseChart as { metadata: { source: string } }).metadata.source}
        />

        {onViewNearbySales || onViewComparableRentals ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              type="button"
              className="w-full bg-[var(--atlantic-navy)] text-white hover:bg-[var(--atlantic-navy)]/90"
              disabled={!onViewNearbySales}
              title={!onViewNearbySales ? undefined : "Show sold LINK comps near this lot on the map"}
              onClick={() => onViewNearbySales?.()}
            >
              View Nearby Sales
            </Button>
            <Button
              type="button"
              className="w-full bg-[var(--privet-green)] text-white hover:bg-[var(--brass-hover)]"
              disabled={!onViewComparableRentals}
              title={!onViewComparableRentals ? undefined : "Show vacation rentals near this lot on the map"}
              onClick={() => onViewComparableRentals?.()}
            >
              Comparable Rentals
            </Button>
          </div>
        ) : null}
        <Button variant="outline" className="mt-2 w-full">
          Get Custom Valuation from Stephen Maury
        </Button>
      </div>
    </div>
  );
}

export type ZoningLookupVariant = "tool" | "property-map";

export function ZoningLookupClient({ variant = "tool" }: { variant?: ZoningLookupVariant } = {}) {
  const isPropertyMap = variant === "property-map";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mapModes, setMapModes] = useState<SelectableMapMode[]>(() => parseMapModes(searchParams.get("mode")));

  const [geojson, setGeojson] = useState<ParcelFeatureCollection | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<ParcelProperties | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [showZoningColors, setShowZoningColors] = useState(true);
  const [mapBounds, setMapBounds] = useState<{ west: number; south: number; east: number; north: number } | null>(null);
  const [rentalResults, setRentalResults] = useState<NrMapRentalResult[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(false);
  const [selectedRental, setSelectedRental] = useState<NrMapRentalResult | null>(null);
  const [linkActiveFc, setLinkActiveFc] = useState<FeatureCollection<Point, LinkListingPinProperties>>(EMPTY_LINK_FC);
  const [linkSoldFc, setLinkSoldFc] = useState<FeatureCollection<Point, LinkListingPinProperties>>(EMPTY_LINK_FC);
  const [linkListingsLoading, setLinkListingsLoading] = useState(false);
  const [selectedLink, setSelectedLink] = useState<LinkListingPinProperties | null>(null);
  /** Parcel centroid for intelligence hero satellite fallback (synced from parcel GeoJSON). */
  const [parcelMapCenter, setParcelMapCenter] = useState<{ lng: number; lat: number } | null>(null);
  /** MLS row from `/api/map/link-listings?parcel_id=` when viewport pins miss the lot. */
  const [parcelScopedLinkMatch, setParcelScopedLinkMatch] = useState<ParcelMapLinkListingMatch | null>(null);
  const flyIdRef = useRef(0);
  const bumpFlyId = () => {
    flyIdRef.current += 1;
    return flyIdRef.current;
  };
  const [mapFlyTo, setMapFlyTo] = useState<
    | null
    | { id: number; lng: number; lat: number; zoom: number }
    | { id: number; bounds: { west: number; south: number; east: number; north: number } }
  >(null);
  const [omniboxOpen, setOmniboxOpen] = useState(false);
  const [omniboxPreview, setOmniboxPreview] = useState<{
    parcelId?: string;
    lng?: number;
    lat?: number;
  } | null>(null);
  const [layoutNarrow, setLayoutNarrow] = useState(false);
  const [mapUiHidden] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [omniboxPrefillNonce, setOmniboxPrefillNonce] = useState(0);
  const [omniboxPrefillQuery, setOmniboxPrefillQuery] = useState("");
  const [reDistrictsGeoJson, setReDistrictsGeoJson] = useState<FeatureCollection<
    Geometry,
    { Abbrv?: string; District?: string }
  > | null>(null);
  const [parcelBaseLayer, setParcelBaseLayer] = useState<ParcelBaseMapLayer>("tax_zoning");
  const [reMarketAreaAbbrv, setReMarketAreaAbbrv] = useState<string>("");
  const applyParcelBaseLayer = useCallback((next: ParcelBaseMapLayer) => {
    setParcelBaseLayer(next);
    if (next !== "re_market_areas") setReMarketAreaAbbrv("");
    if (next === "tax_zoning") setShowZoningColors(true);
    else if (next === "none") setShowZoningColors(false);
  }, []);
  const [mobileDrawerTab, setMobileDrawerTab] = useState<"rental" | "parcel">("rental");
  const [, setWatchTick] = useState(0);
  const [rentalFilters, setRentalFilters] = useState<RentalFiltersState>(() => ({ ...DEFAULT_RENTAL_FILTERS }));
  const [linkFilters, setLinkFilters] = useState<LinkFiltersState>(() => ({ ...DEFAULT_LINK_FILTERS }));
  const rentalResultsRef = useRef<NrMapRentalResult[]>([]);
  const welcomeLayerEffectSkip = useRef(true);
  const hasRentMode = mapModes.includes("rent");
  const hasSaleMode = mapModes.includes("sale");
  const hasSoldMode = mapModes.includes("sold");
  const hasListingTypeSelected = mapModes.length > 0;
  const mapModeForOmnibox = effectiveModeForOmnibox(mapModes);

  useEffect(() => {
    if (mapModes.length === 0) setFiltersOpen(false);
  }, [mapModes.length]);

  const mapResearchHubPrimaryCta = useMemo(() => {
    if (!selectedRental) return null;
    const slug = selectedRental.slug?.trim();
    return {
      primaryCtaLabel: "Check Availability" as const,
      primaryCtaHref: slug ? nantucketVacationRentalListingUrl(slug) : nantucketRentalsPropertySearchUrl({}),
    };
  }, [selectedRental]);

  useEffect(() => {
    setMapModes(parseMapModes(searchParams.get("mode")));
  }, [searchParams]);

  useEffect(() => {
    setSelectedRental(null);
    setSelectedLink(null);
    setRentalFilters({ ...DEFAULT_RENTAL_FILTERS });
    const soldInLastDefault = mapModes.includes("sold") ? ("30d" as const) : ("" as const);
    setLinkFilters({ ...DEFAULT_LINK_FILTERS, soldInLast: soldInLastDefault });
  }, [mapModes]);

  const setMapModesAndUrl = useCallback(
    (nextModes: SelectableMapMode[]) => {
      const normalized = Array.from(new Set(nextModes));
      setMapModes(normalized);
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("mode", serializeMapModes(normalized));
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const toggleMapMode = useCallback(
    (mode: SelectableMapMode) => {
      setMapModes((prev) => {
        const exists = prev.includes(mode);
        const next = exists ? prev.filter((m) => m !== mode) : [...prev, mode];
        const normalized = Array.from(new Set(next));
        const sp = new URLSearchParams(searchParams.toString());
        sp.set("mode", serializeMapModes(normalized));
        router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
        return normalized;
      });
    },
    [pathname, router, searchParams],
  );

  const selectMapMode = useCallback(
    (next: SelectableMapMode) => {
      setMapModesAndUrl([next]);
    },
    [setMapModesAndUrl],
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      if (mq.matches) setMobilePanelOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setLayoutNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isPropertyMap) return;
    let cancelled = false;
    fetch("/data/re-districts.geojson")
      .then((r) => r.json())
      .then((d: FeatureCollection<Geometry, { Abbrv?: string; District?: string }>) => {
        if (cancelled || d?.type !== "FeatureCollection" || !Array.isArray(d.features)) return;
        /** Strip legacy GeoJSON root fields; Mapbox expects plain WGS84 FeatureCollection. */
        setReDistrictsGeoJson({
          type: "FeatureCollection",
          features: d.features,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isPropertyMap]);

  const recentSoldFeed = recentSoldParcels as RecentSoldParcelsFeed;

  const linkListingByParcelId = useMemo(() => recentSoldFeed.linkListingByParcelId, []);

  const linkListingIdForSelection = useMemo(() => {
    const pid = selectedParcel?.parcel_id;
    if (!pid) return null;
    return linkListingByParcelId[String(pid).trim()] ?? null;
  }, [selectedParcel?.parcel_id, linkListingByParcelId]);

  const parcelLinkListingMatch = useMemo((): ParcelMapLinkListingMatch | null => {
    if (!isPropertyMap) return null;
    return linkListingMatchForParcelMapSelection(
      parcelMapCenter,
      linkListingIdForSelection,
      linkActiveFc,
      linkSoldFc,
    );
  }, [isPropertyMap, parcelMapCenter, linkListingIdForSelection, linkActiveFc, linkSoldFc]);

  const effectiveParcelLinkMatch = useMemo(
    () => parcelLinkListingMatch ?? parcelScopedLinkMatch ?? null,
    [parcelLinkListingMatch, parcelScopedLinkMatch],
  );

  useEffect(() => {
    if (!isPropertyMap || !selectedParcel?.parcel_id?.trim()) {
      setParcelScopedLinkMatch(null);
      return;
    }
    if (!hasSaleMode && !hasSoldMode) {
      setParcelScopedLinkMatch(null);
      return;
    }
    if (parcelLinkListingMatch) {
      setParcelScopedLinkMatch(null);
      return;
    }
    const pid = String(selectedParcel.parcel_id).trim();
    const pool = hasSaleMode && hasSoldMode ? "both" : hasSaleMode ? "active" : "sold";
    const ac = new AbortController();
    fetch(
      `/api/map/link-listings?parcel_id=${encodeURIComponent(pid)}&pool=${encodeURIComponent(pool)}&soldDays=${LINK_MAP_DEFAULT_SOLD_FEED_DAYS}`,
      { signal: ac.signal },
    )
      .then(async (r) => {
        if (ac.signal.aborted) return;
        if (r.status === 404) {
          setParcelScopedLinkMatch(null);
          return;
        }
        const data = (await r.json()) as { match?: ParcelMapLinkListingMatch | null };
        if (!ac.signal.aborted) setParcelScopedLinkMatch(data.match ?? null);
      })
      .catch(() => {
        if (!ac.signal.aborted) setParcelScopedLinkMatch(null);
      });
    return () => ac.abort();
  }, [isPropertyMap, selectedParcel?.parcel_id, hasSaleMode, hasSoldMode, parcelLinkListingMatch]);

  const nrRentalFeed = nrRentalSlugsByParcel as NrRentalSlugsFeed;
  const slugByParcelIdForRentals = useMemo(() => nrRentalFeed.slugByParcelId, []);

  const vacationRentalSlugForSelection = useMemo(() => {
    if (!selectedParcel?.parcel_id) return null;
    const pid = String(selectedParcel.parcel_id).trim();
    const tmKey = `${selectedParcel.tax_map ?? ""} ${selectedParcel.parcel ?? ""}`.trim();
    return slugByParcelIdForRentals[pid] ?? slugByParcelIdForRentals[tmKey] ?? null;
  }, [selectedParcel, slugByParcelIdForRentals]);

  rentalResultsRef.current = rentalResults;

  /** When a lot has an NR slug on file and that listing is in the current viewport feed, attach it for rental pulse / hero. */
  useEffect(() => {
    if (!isPropertyMap || !selectedParcel?.parcel_id || selectedRental) return;
    const pid = String(selectedParcel.parcel_id).trim();
    const tmKey = `${selectedParcel.tax_map ?? ""} ${selectedParcel.parcel ?? ""}`.trim();
    const slug = (slugByParcelIdForRentals[pid] || slugByParcelIdForRentals[tmKey])?.trim().toLowerCase();
    if (!slug) return;
    const hit = rentalResults.find((r) => (r.slug || "").trim().toLowerCase() === slug);
    if (hit) setSelectedRental(hit);
  }, [isPropertyMap, selectedParcel, selectedRental, slugByParcelIdForRentals, rentalResults]);

  const filteredRentals = useMemo(
    () => applyRentalFilters(rentalResults, rentalFilters),
    [rentalResults, rentalFilters],
  );

  const filteredLinkActiveFc = useMemo(
    () => filterLinkFeatureCollection(linkActiveFc, linkFilters, "active"),
    [linkActiveFc, linkFilters],
  );

  const filteredLinkSoldFc = useMemo(
    () => filterLinkFeatureCollection(linkSoldFc, linkFilters, "sold"),
    [linkSoldFc, linkFilters],
  );

  const rentalGeoJson = useMemo(() => rentalsToGeoJson(filteredRentals), [filteredRentals]);

  const rentFilterActiveCount = countActiveRentalFilters(rentalFilters);
  const linkFilterActiveCount = countActiveLinkFilters(linkFilters);
  const filterBadgeCount = useMemo(() => {
    const showRent = hasRentMode;
    const showLink = hasSaleMode || hasSoldMode;
    return (showRent ? countActiveRentalFilters(rentalFilters) : 0) + (showLink ? countActiveLinkFilters(linkFilters) : 0);
  }, [hasRentMode, hasSaleMode, hasSoldMode, rentalFilters, linkFilters]);

  const appliedFilterChips = useMemo(
    () =>
      buildMapAppliedFilterChips({
        rental: rentalFilters,
        link: linkFilters,
        showRent: hasRentMode,
        showLink: hasSaleMode || hasSoldMode,
        showSold: hasSoldMode,
      }),
    [rentalFilters, linkFilters, hasRentMode, hasSaleMode, hasSoldMode],
  );

  useEffect(() => {
    if (!selectedRental) return;
    if (!filteredRentals.some((r) => r.nrPropertyId === selectedRental.nrPropertyId)) {
      setSelectedRental(null);
    }
  }, [filteredRentals, selectedRental]);

  useEffect(() => {
    if (!selectedLink) return;
    const pool = selectedLink.pool;
    const fc = pool === "sold" ? filteredLinkSoldFc : filteredLinkActiveFc;
    const ok = fc.features.some((f) => f.properties.linkId === selectedLink.linkId);
    if (!ok) setSelectedLink(null);
  }, [filteredLinkActiveFc, filteredLinkSoldFc, selectedLink]);

  const handleParcelSelectFromMap = useCallback((feature: ParcelFeature) => {
    setSelectedLink(null);
    setSelectedRental(null);
    setSelectedParcel(feature.properties ?? null);
    setSearchStatus(null);
    setMobileDrawerTab("parcel");
    if (isNarrowForParcelDrawer()) setMobilePanelOpen(true);
  }, []);

  const handleRentalPinSelect = useCallback(
    (feature: RentalPinFeature) => {
      const p = feature.properties;
      const coords = (feature.geometry as Point).coordinates;
      const id = Number(p.nrPropertyId);
      const full = rentalResultsRef.current.find((r) => r.nrPropertyId === id);
      const rentalRow: NrMapRentalResult =
        full ?? {
          nrPropertyId: id,
          slug: p.slug,
          streetAddress: p.streetAddress,
          headline: p.headline,
          latitude: coords[1],
          longitude: coords[0],
          thumbUrl: p.thumbUrl,
          weeklyRentEstimate: null,
          totalBedrooms: null,
          totalBathrooms: null,
          totalCapacity: null,
          hasPool: false,
          walkToBeach: false,
          averageNightlyRate: null,
          petFriendlyHint: false,
          waterfrontHint: false,
          renovatedHint: false,
          townWalkHint: false,
        };
      setSelectedLink(null);
      setSelectedRental(rentalRow);
      if (isPropertyMap) {
        const parcelHit = findParcelFeatureForNrRental(rentalRow, slugByParcelIdForRentals, geojson?.features ?? []);
        setSelectedParcel(parcelHit?.properties ?? null);
      }
      setMobileDrawerTab("parcel");
      if (isNarrowForParcelDrawer()) setMobilePanelOpen(true);
    },
    [isPropertyMap, slugByParcelIdForRentals, geojson?.features],
  );

  const handleLinkListingPinSelect = useCallback(
    (feature: LinkListingPinFeature) => {
      const props = feature.properties;
      setSelectedRental(null);
      setSelectedLink(props);
      if (isPropertyMap) {
        const parcelHit = findParcelFeatureForLinkPin(props, geojson?.features ?? []);
        setSelectedParcel(parcelHit?.properties ?? null);
      } else {
        setSelectedParcel(null);
      }
      setMobileDrawerTab("parcel");
      if (isNarrowForParcelDrawer()) setMobilePanelOpen(true);
    },
    [isPropertyMap, geojson?.features],
  );

  const clearMapSelection = useCallback(() => {
    setSelectedParcel(null);
    setSelectedRental(null);
    setSelectedLink(null);
    setMobilePanelOpen(false);
    setOmniboxPreview(null);
  }, []);

  const handleViewportBoundsChange = useCallback((b: { west: number; south: number; east: number; north: number }) => {
    setMapBounds(b);
  }, []);

  useEffect(() => {
    if (!isPropertyMap || !mapBounds) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const { west, south, east, north } = mapBounds;
      const bboxStr = `${west},${south},${east},${north}`;

      const loadRentals = async () => {
        setRentalsLoading(true);
        try {
          const res = await fetch(`/api/map/rentals?bbox=${bboxStr}`, { signal: controller.signal });
          const data = (await res.json()) as { results?: NrMapRentalResult[] };
          if (!controller.signal.aborted && Array.isArray(data.results)) setRentalResults(data.results);
        } catch {
          if (!controller.signal.aborted) setRentalResults([]);
        } finally {
          if (!controller.signal.aborted) setRentalsLoading(false);
        }
      };

      const loadLink = async (pool: "active" | "sold" | "both") => {
        setLinkListingsLoading(true);
        try {
          const res = await fetch(`/api/map/link-listings?bbox=${bboxStr}&pool=${pool}`, { signal: controller.signal });
          const data = (await res.json()) as {
            active?: FeatureCollection<Point, LinkListingPinProperties>;
            sold?: FeatureCollection<Point, LinkListingPinProperties>;
          };
          if (controller.signal.aborted) return;
          setLinkActiveFc(data.active ?? EMPTY_LINK_FC);
          setLinkSoldFc(data.sold ?? EMPTY_LINK_FC);
        } catch {
          if (!controller.signal.aborted) {
            setLinkActiveFc(EMPTY_LINK_FC);
            setLinkSoldFc(EMPTY_LINK_FC);
          }
        } finally {
          if (!controller.signal.aborted) setLinkListingsLoading(false);
        }
      };

      try {
        const wantRent = hasRentMode;
        const wantSale = hasSaleMode;
        const wantSold = hasSoldMode;

        if (!wantSale && !wantSold) {
          setLinkListingsLoading(false);
          setLinkActiveFc(EMPTY_LINK_FC);
          setLinkSoldFc(EMPTY_LINK_FC);
          if (wantRent) await loadRentals();
          else {
            setRentalsLoading(false);
            setRentalResults([]);
          }
          return;
        }

        if (!wantRent) {
          setRentalsLoading(false);
          setRentalResults([]);
          if (wantSale && !wantSold) {
            setLinkSoldFc(EMPTY_LINK_FC);
            await loadLink("active");
            return;
          }
          if (!wantSale && wantSold) {
            setLinkActiveFc(EMPTY_LINK_FC);
            await loadLink("sold");
            return;
          }
          await loadLink("both");
          return;
        }

        setRentalsLoading(true);
        setLinkListingsLoading(true);
        try {
          const pool = wantSale && wantSold ? "both" : wantSale ? "active" : "sold";
          const [rentRes, linkRes] = await Promise.all([
            fetch(`/api/map/rentals?bbox=${bboxStr}`, { signal: controller.signal }),
            fetch(`/api/map/link-listings?bbox=${bboxStr}&pool=${pool}`, { signal: controller.signal }),
          ]);
          const rentData = (await rentRes.json()) as { results?: NrMapRentalResult[] };
          const linkData = (await linkRes.json()) as {
            active?: FeatureCollection<Point, LinkListingPinProperties>;
            sold?: FeatureCollection<Point, LinkListingPinProperties>;
          };
          if (controller.signal.aborted) return;
          if (Array.isArray(rentData.results)) setRentalResults(rentData.results);
          setLinkActiveFc(wantSale ? (linkData.active ?? EMPTY_LINK_FC) : EMPTY_LINK_FC);
          setLinkSoldFc(wantSold ? (linkData.sold ?? EMPTY_LINK_FC) : EMPTY_LINK_FC);
        } catch {
          if (!controller.signal.aborted) {
            setRentalResults([]);
            setLinkActiveFc(EMPTY_LINK_FC);
            setLinkSoldFc(EMPTY_LINK_FC);
          }
        } finally {
          if (!controller.signal.aborted) {
            setRentalsLoading(false);
            setLinkListingsLoading(false);
          }
        }
      } catch {
        if (!controller.signal.aborted) {
          setRentalsLoading(false);
          setLinkListingsLoading(false);
        }
      }
    }, 450);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [isPropertyMap, mapBounds, hasRentMode, hasSaleMode, hasSoldMode]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadParcels() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/tools/zoning-lookup/parcels", { signal: controller.signal });
        if (!response.ok) throw new Error(`Failed to load parcel data: ${response.status}`);
        const data = (await response.json()) as ParcelFeatureCollection;
        setGeojson(data);
      } catch (error) {
        if (!controller.signal.aborted) setSearchStatus(error instanceof Error ? error.message : "Failed to load parcel data");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    loadParcels();
    return () => controller.abort();
  }, []);

  const features = useMemo(() => geojson?.features ?? [], [geojson]);

  useEffect(() => {
    if (!isPropertyMap) {
      setParcelMapCenter(null);
      return;
    }
    if (!selectedParcel?.parcel_id?.trim()) {
      setParcelMapCenter(null);
      return;
    }
    const pid = String(selectedParcel.parcel_id).trim();
    const f = features.find((x) => String(x.properties?.parcel_id ?? "").trim() === pid);
    const geom = f?.geometry;
    if (!geom) {
      setParcelMapCenter(null);
      return;
    }
    setParcelMapCenter(centroidFromGeometry(geom));
  }, [isPropertyMap, selectedParcel?.parcel_id, features]);

  const findParcelMatch = useCallback((rawQuery: string): ParcelFeature | undefined => {
    const query = rawQuery.trim().toLowerCase();
    if (!query) return undefined;
    return features.find((feature) => {
      const p = feature.properties ?? {};
      const address = String(p.location ?? "").toLowerCase();
      const mapParcel = `${p.tax_map ?? ""} ${p.parcel ?? ""}`.trim().toLowerCase();
      const parcelId = String(p.parcel_id ?? "").toLowerCase();
      return address.includes(query) || mapParcel.includes(query) || parcelId.includes(query);
    });
  }, [features]);

  const suggestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query || query.length < 2) return [];
    return features.filter((feature) => {
      const p = feature.properties ?? {};
      const address = String(p.location ?? "").toLowerCase();
      const mapParcel = `${p.tax_map ?? ""} ${p.parcel ?? ""}`.trim().toLowerCase();
      const parcelId = String(p.parcel_id ?? "").toLowerCase();
      return address.includes(query) || mapParcel.includes(query) || parcelId.includes(query);
    }).slice(0, 8).map((feature) => {
      const p = feature.properties ?? {};
      return {
        key: `${p.parcel_id ?? "parcel"}-${p.location ?? "address"}`,
        label: p.location ?? "Address unavailable",
        subLabel: `Tax Map ${p.tax_map ?? "N/A"} • Parcel ${p.parcel ?? "N/A"}`,
        feature,
      };
    });
  }, [features, searchTerm]);

  const handleSearch = useCallback(() => {
    const query = searchTerm.trim();
    if (!query) {
      setSearchStatus("Enter an address or Tax Map + Parcel.");
      return;
    }
    const match = findParcelMatch(query);
    if (!match?.properties) {
      setSearchStatus("No parcel match found. Search by address or Tax Map + Parcel.");
      return;
    }
    setSelectedRental(null);
    setSelectedLink(null);
    setSelectedParcel(match.properties);
    setSearchStatus(`Found: ${match.properties.location ?? match.properties.parcel_id ?? "Parcel"}`);
    setShowSuggestions(false);
    if (isNarrowForParcelDrawer()) setMobilePanelOpen(true);
  }, [findParcelMatch, searchTerm]);

  const findLinkPropsOnMap = useCallback(
    (id: string, pool: "active" | "sold") => {
      const fc = pool === "sold" ? linkSoldFc : linkActiveFc;
      return fc.features.find((f) => f.properties.linkId === id)?.properties ?? null;
    },
    [linkActiveFc, linkSoldFc],
  );

  const handleApplyNlPreset = useCallback(
    (id: string) => {
      const nid = bumpFlyId();
      if (id === "beds4_sale_sconset") {
        selectMapMode("sale");
        setLinkFilters({ ...DEFAULT_LINK_FILTERS, minBeds: "4" });
        setRentalFilters({ ...DEFAULT_RENTAL_FILTERS });
        const b = MAP_NEIGHBORHOOD_BOUNDS.sconset;
        if (b) setMapFlyTo({ id: nid, bounds: b });
        return;
      }
      if (id === "rent_beach_12k") {
        selectMapMode("rent");
        setRentalFilters({
          ...DEFAULT_RENTAL_FILTERS,
          maxRate: "12000",
          beachDistance: "walk",
        });
        setLinkFilters({ ...DEFAULT_LINK_FILTERS });
        const b = MAP_NEIGHBORHOOD_BOUNDS.surfside;
        if (b) setMapFlyTo({ id: nid, bounds: b });
        return;
      }
      if (id === "waterfront_town") {
        selectMapMode("sale");
        setLinkFilters({ ...DEFAULT_LINK_FILTERS, waterfront: true });
        setRentalFilters({ ...DEFAULT_RENTAL_FILTERS });
        const b = MAP_NEIGHBORHOOD_BOUNDS.town;
        if (b) setMapFlyTo({ id: nid, bounds: b });
        return;
      }
      if (id === "sold_surfside_2y") {
        selectMapMode("sold");
        setLinkFilters({ ...DEFAULT_LINK_FILTERS });
        setRentalFilters({ ...DEFAULT_RENTAL_FILTERS });
        const b = MAP_NEIGHBORHOOD_BOUNDS.surfside;
        if (b) setMapFlyTo({ id: nid, bounds: b });
      }
    },
    [selectMapMode],
  );

  const handleOmniboxNeighborhoodSlug = useCallback((slug: string) => {
    setSelectedParcel(null);
    setSelectedRental(null);
    setSelectedLink(null);
    const b = MAP_NEIGHBORHOOD_BOUNDS[slug];
    if (b) setMapFlyTo({ id: bumpFlyId(), bounds: b });
  }, []);

  const handleOmniboxParcelSelect = useCallback(
    (parcelId: string, fly?: { lat: number; lng: number }) => {
      const trimmed = parcelId.trim();
      const match = features.find((f) => String(f.properties?.parcel_id ?? "").trim() === trimmed);
      setSelectedRental(null);
      setSelectedLink(null);
      if (match?.properties) {
        setSelectedParcel(match.properties);
      } else {
        setSelectedParcel(null);
      }
      setMobileDrawerTab("parcel");

      let lng = fly?.lng;
      let lat = fly?.lat;
      if ((lng == null || lat == null || !Number.isFinite(lng) || !Number.isFinite(lat)) && match?.geometry) {
        const c = centroidFromGeometry(match.geometry);
        if (c) {
          lng = c.lng;
          lat = c.lat;
        }
      }
      if (lng != null && lat != null && Number.isFinite(lng) && Number.isFinite(lat)) {
        setMapFlyTo({ id: bumpFlyId(), lng, lat, zoom: 16 });
      }

      if (isNarrowForParcelDrawer()) setMobilePanelOpen(true);
    },
    [features],
  );

  const handleOmniboxRentalHit = useCallback(
    (hit: OmniboxRentalHit) => {
      setSelectedLink(null);
      const full = rentalResultsRef.current.find((r) => r.nrPropertyId === hit.nrPropertyId);
      const slug = (hit.slug?.trim() || full?.slug || "").trim();
      const rentalRow: NrMapRentalResult =
        full ?? {
          nrPropertyId: hit.nrPropertyId,
          slug,
          streetAddress: hit.address,
          headline: hit.headline,
          latitude: hit.lat,
          longitude: hit.lng,
          thumbUrl: null,
          weeklyRentEstimate: null,
          totalBedrooms: null,
          totalBathrooms: null,
          totalCapacity: null,
          hasPool: false,
          walkToBeach: false,
          averageNightlyRate: null,
          petFriendlyHint: false,
          waterfrontHint: false,
          renovatedHint: false,
          townWalkHint: false,
        };
      setSelectedRental(rentalRow);
      if (isPropertyMap) {
        const parcelHit = findParcelFeatureForNrRental(rentalRow, slugByParcelIdForRentals, geojson?.features ?? []);
        setSelectedParcel(parcelHit?.properties ?? null);
      } else {
        setSelectedParcel(null);
      }
      setMapFlyTo({ id: bumpFlyId(), lng: hit.lng, lat: hit.lat, zoom: 15 });
      setMobileDrawerTab("parcel");
      if (isNarrowForParcelDrawer()) setMobilePanelOpen(true);
    },
    [isPropertyMap, slugByParcelIdForRentals, geojson?.features],
  );

  const handleOmniboxLinkHit = useCallback(
    (hit: OmniboxActiveListing | OmniboxSoldComp, pool: "active" | "sold") => {
      setSelectedRental(null);
      const onMap = findLinkPropsOnMap(hit.id, pool);
      const props = onMap ?? linkPinFromOmniboxHit(hit, pool);
      setSelectedLink(props);
      if (isPropertyMap) {
        const parcelFeat = findParcelFeatureByListingAddress(hit.address, geojson?.features ?? []);
        setSelectedParcel(parcelFeat?.properties ?? null);
      } else {
        setSelectedParcel(null);
      }
      if (hit.lat != null && hit.lng != null) {
        setMapFlyTo({ id: bumpFlyId(), lng: hit.lng, lat: hit.lat, zoom: 15 });
      }
      setMobileDrawerTab("parcel");
      if (isNarrowForParcelDrawer()) setMobilePanelOpen(true);
    },
    [findLinkPropsOnMap, isPropertyMap, geojson?.features],
  );

  const handleViewComparableRentals = useCallback(() => {
    const baseBedrooms =
      selectedLink?.bedrooms ??
      effectiveParcelLinkMatch?.bedrooms ??
      selectedRental?.totalBedrooms ??
      null;
    const url = nantucketRentalsComparableSearchUrlFromListingBedrooms(baseBedrooms);
    window.open(url, "_blank", "noopener,noreferrer");
  }, [selectedLink?.bedrooms, effectiveParcelLinkMatch?.bedrooms, selectedRental?.totalBedrooms]);

  const handleViewNearbySales = useCallback(() => {
    selectMapMode("sold");
    setLinkFilters({ ...DEFAULT_LINK_FILTERS });
    setSelectedRental(null);
    setSelectedLink(null);
    const pid = String(selectedParcel?.parcel_id ?? "").trim();
    const feat = features.find((f) => String(f.properties?.parcel_id ?? "").trim() === pid);
    const geom = feat?.geometry;
    if (geom) {
      const c = centroidFromGeometry(geom);
      if (c) {
        const pad = 0.028;
        setMapFlyTo({
          id: bumpFlyId(),
          bounds: {
            west: c.lng - pad,
            east: c.lng + pad,
            south: c.lat - pad,
            north: c.lat + pad,
          },
        });
      }
    }
    if (isNarrowForParcelDrawer()) setMobilePanelOpen(false);
  }, [features, selectMapMode, selectedParcel?.parcel_id]);

  const parcelMapCtas: Partial<
    Pick<PanelProps, "onViewNearbySales" | "onViewComparableRentals" | "parcelLinkListingMatch">
  > = isPropertyMap
    ? {
        onViewNearbySales: handleViewNearbySales,
        onViewComparableRentals: handleViewComparableRentals,
        parcelLinkListingMatch: effectiveParcelLinkMatch,
      }
    : {};

  const zoningLabel = selectedParcel?.zoning ?? "Unknown";
  const districtLookup = useMemo(() => {
    const map = new Map<string, { code: string; info: DistrictInfo }>();
    const districts = zoningData.districts as Record<string, DistrictInfo>;
    for (const [code, info] of Object.entries(districts)) {
      map.set(code.toUpperCase(), { code, info });
      map.set(normalizeDistrictCode(code), { code, info });
    }
    return map;
  }, []);
  const districtMatch = useMemo(() => {
    if (!selectedParcel?.zoning) return null;
    const raw = String(selectedParcel.zoning).toUpperCase();
    return districtLookup.get(raw) ?? districtLookup.get(normalizeDistrictCode(raw)) ?? null;
  }, [districtLookup, selectedParcel?.zoning]);

  const zoningUseRows = useMemo(() => {
    if (!selectedParcel?.zoning) return [];
    const normalizedSelected = normalizeDistrictCode(String(selectedParcel.zoning));
    const chart = zoningUseChart as Record<string, unknown>;
    const rows: ZoningUseRow[] = [];
    for (const [category, uses] of Object.entries(chart)) {
      if (category === "metadata") continue;
      for (const [useName, districtMap] of Object.entries(uses as Record<string, Record<string, UsePermission>>)) {
        const match = Object.entries(districtMap).find(([districtCode]) => normalizeDistrictCode(districtCode) === normalizedSelected);
        if (!match) continue;
        const [, permission] = match;
        rows.push({ category, useName, value: permission.value, allowed: permission.allowed });
      }
    }
    return rows;
  }, [selectedParcel?.zoning]);

  const showRentalPinsOnMap = isPropertyMap && hasRentMode;
  const showLinkPinsOnMap = isPropertyMap && (hasSaleMode || hasSoldMode);

  const mapSelectionActive = Boolean(selectedParcel || selectedRental || selectedLink);

  const WELCOME_DISMISS_LS_KEY = "nh-property-map-welcome-dismissed";
  const WELCOME_VISIT_COUNT_LS_KEY = "nh-property-map-welcome-visits";
  const [welcomePermDismissed, setWelcomePermDismissed] = useState(false);
  const [welcomeSessionHidden, setWelcomeSessionHidden] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (localStorage.getItem(WELCOME_DISMISS_LS_KEY) === "1") {
        setWelcomePermDismissed(true);
        return;
      }
      const prev = Number.parseInt(localStorage.getItem(WELCOME_VISIT_COUNT_LS_KEY) ?? "0", 10);
      const next = Number.isFinite(prev) ? prev + 1 : 1;
      localStorage.setItem(WELCOME_VISIT_COUNT_LS_KEY, String(next));
      if (next > 2) setWelcomePermDismissed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const dismissWelcomePermanent = useCallback(() => {
    try {
      localStorage.setItem(WELCOME_DISMISS_LS_KEY, "1");
    } catch {
      /* ignore */
    }
    setWelcomePermDismissed(true);
  }, []);

  const dismissWelcomeSession = useCallback(() => {
    setWelcomeSessionHidden(true);
  }, []);

  const showWelcomeCard =
    isPropertyMap && !mapSelectionActive && !welcomePermDismissed && !welcomeSessionHidden;

  useEffect(() => {
    if (!isPropertyMap) {
      welcomeLayerEffectSkip.current = true;
    }
  }, [isPropertyMap]);

  useEffect(() => {
    if (!isPropertyMap || !omniboxOpen) return;
    dismissWelcomeSession();
  }, [isPropertyMap, omniboxOpen, dismissWelcomeSession]);

  /** Narrow + open omnibox: lock page scroll so the keyboard / dropdown does not grow the document past the viewport. */
  useEffect(() => {
    if (!isPropertyMap || !layoutNarrow || typeof document === "undefined") return;
    if (!omniboxOpen) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [isPropertyMap, layoutNarrow, omniboxOpen]);

  useEffect(() => {
    if (!isPropertyMap || !filtersOpen) return;
    dismissWelcomeSession();
  }, [isPropertyMap, filtersOpen, dismissWelcomeSession]);

  useEffect(() => {
    if (!isPropertyMap) return;
    if (welcomeLayerEffectSkip.current) {
      welcomeLayerEffectSkip.current = false;
      return;
    }
    dismissWelcomeSession();
  }, [isPropertyMap, parcelBaseLayer, showZoningColors, dismissWelcomeSession]);

  const mapAddressPillLabel =
    selectedParcel?.location ??
    selectedLink?.address ??
    selectedRental?.streetAddress ??
    selectedRental?.headline ??
    "";

  const mapPillZoneBadge = useMemo(() => {
    if (districtMatch?.code) return districtMatch.code.toUpperCase().slice(0, 8);
    const z = selectedParcel?.zoning?.trim();
    if (z) return z.toUpperCase().slice(0, 8);
    if (selectedLink) return (selectedLink.pool === "sold" ? "SOLD" : "LINK").slice(0, 8);
    if (selectedRental) return "RENT";
    return "—";
  }, [districtMatch?.code, selectedParcel?.zoning, selectedRental, selectedLink]);

  return (
    <section
      className={cn(
        "bg-[var(--sandstone)]",
        isPropertyMap ? "flex min-h-0 flex-1 flex-col overflow-hidden py-0" : "py-6",
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8",
          isPropertyMap ? "min-h-0 flex-1 gap-1 overflow-hidden lg:gap-2" : "gap-5",
        )}
      >
        {isPropertyMap ? (
          <>
            <header className="hidden shrink-0 flex-wrap items-center gap-1.5 border-b border-[var(--cedar-shingle)]/25 bg-white py-1.5 sm:gap-2 sm:py-2 lg:flex">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 lg:flex-row lg:items-baseline lg:gap-3">
                <h1 className="truncate text-lg font-bold leading-tight tracking-tight text-[var(--atlantic-navy)] lg:text-3xl lg:font-semibold">
                  Nantucket Property Map
                </h1>
                <span className="hidden text-xs font-medium text-[var(--nantucket-gray)] lg:inline">
                  Live data · Curated by{" "}
                  <span className="font-semibold text-[var(--privet-green)]">Stephen Maury</span>
                </span>
              </div>
            </header>
            <div className="flex shrink-0 flex-col gap-1.5 border-b border-[var(--cedar-shingle)]/15 bg-white px-0 py-1.5 sm:gap-2 sm:py-2 lg:gap-2.5 lg:py-2.5">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <div
                  className="flex min-w-0 flex-1 flex-nowrap gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-x-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
                  role="tablist"
                  aria-label="Listing type"
                >
                  {(
                    [
                      { mode: "sale" as const, label: "For sale" },
                      { mode: "sold" as const, label: "Sold" },
                      { mode: "rent" as const, label: "Vacation Rentals" },
                    ] as const
                  ).map(({ mode, label }) => (
                    <button
                      key={mode}
                      type="button"
                      role="tab"
                      aria-selected={mapModes.includes(mode)}
                      onClick={() => toggleMapMode(mode)}
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors sm:px-3 sm:py-1 sm:text-sm",
                        mapModes.includes(mode)
                          ? mode === "sold"
                            ? "border-slate-600 bg-slate-600 text-white shadow-sm"
                            : "border-blue-700 bg-blue-700 text-white shadow-sm"
                          : "border-[var(--cedar-shingle)]/30 bg-white/90 text-[var(--atlantic-navy)] hover:bg-[var(--sandstone)]",
                      )}
                    >
                      {mode === "rent" && mapModes.includes("rent") ? (
                        <span
                          className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-300"
                        />
                      ) : null}
                      {mode === "sale" && mapModes.includes("sale") ? (
                        <span
                          className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-200"
                        />
                      ) : null}
                      {mode === "sold" && mapModes.includes("sold") ? (
                        <span
                          className="mr-2 inline-block h-2 w-2 rounded-full bg-slate-300"
                        />
                      ) : null}
                      {label}
                    </button>
                  ))}
                </div>
                {hasListingTypeSelected ? (
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(true)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--cedar-shingle)]/30 bg-white px-2 py-0.5 text-[11px] font-medium text-[var(--atlantic-navy)] transition-colors hover:bg-[var(--sandstone)] lg:hidden"
                    aria-label="Open filters"
                  >
                    Filters
                    <ChevronDown className="h-3.5 w-3.5 text-[var(--nantucket-gray)]" aria-hidden />
                    {filterBadgeCount > 0 ? (
                      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-700 px-1 text-[9px] font-semibold text-white">
                        {filterBadgeCount > 99 ? "99+" : filterBadgeCount}
                      </span>
                    ) : null}
                  </button>
                ) : null}
              </div>

              {hasListingTypeSelected && appliedFilterChips.length > 0 ? (
                <div
                  className="flex min-w-0 flex-wrap items-center gap-1.5 border-t border-[var(--cedar-shingle)]/10 pt-1.5 sm:pt-2"
                  role="list"
                  aria-label="Active map filters"
                >
                  {appliedFilterChips.map((chip) =>
                    chip.dismissable === false ? (
                      <span
                        key={chip.id}
                        role="listitem"
                        title="Sold pins use the map feed lookback. Open Filters to narrow by a shorter window."
                        className={cn(
                          "inline-flex max-w-full items-center rounded-full border py-0.5 pl-2.5 pr-2.5 text-[11px] font-medium leading-tight text-blue-950 shadow-sm",
                          chip.source === "rental"
                            ? "border-emerald-700/25 bg-emerald-50/95"
                            : "border-blue-700/25 bg-blue-50/95",
                        )}
                      >
                        <span className="min-w-0 truncate">{chip.label}</span>
                      </span>
                    ) : (
                      <button
                        key={chip.id}
                        type="button"
                        role="listitem"
                        aria-label={`Remove filter: ${chip.label}`}
                        className={cn(
                          "inline-flex max-w-full items-center gap-1 rounded-full border py-0.5 pl-2.5 pr-1 text-[11px] font-medium leading-tight shadow-sm transition-colors",
                          chip.source === "rental"
                            ? "border-emerald-700/25 bg-emerald-50/95 text-emerald-950 hover:border-emerald-700/40 hover:bg-emerald-50"
                            : "border-blue-700/25 bg-blue-50/95 text-blue-950 hover:border-blue-700/40 hover:bg-blue-50",
                        )}
                        onClick={() => {
                          const { rental: nextR, link: nextL } = removeMapAppliedFilterChip(
                            chip.id,
                            rentalFilters,
                            linkFilters,
                          );
                          setRentalFilters(nextR);
                          setLinkFilters(nextL);
                        }}
                      >
                        <span className="min-w-0 truncate">{chip.label}</span>
                        <span
                          className={cn(
                            "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                            chip.source === "rental"
                              ? "bg-emerald-700/15 text-emerald-900 hover:bg-emerald-700/25"
                              : "bg-blue-700/15 text-blue-900 hover:bg-blue-700/25",
                          )}
                          aria-hidden
                        >
                          <X className="h-3 w-3" strokeWidth={2.5} />
                        </span>
                      </button>
                    ),
                  )}
                </div>
              ) : null}

              <div className="hidden min-w-0 lg:block">
                <PropertyMapDesktopLayerBar
                  showZoningColors={showZoningColors}
                  onShowZoningColors={setShowZoningColors}
                  parcelBaseLayer={parcelBaseLayer}
                  onParcelBaseLayer={applyParcelBaseLayer}
                  reMarketAreaAbbrv={reMarketAreaAbbrv}
                  onReMarketAreaChange={setReMarketAreaAbbrv}
                  onRequestFlyToReDistrict={(abbrv) => {
                    if (!abbrv.trim() || !reDistrictsGeoJson) return;
                    const b = bboxForReDistrictAbbrv(reDistrictsGeoJson, abbrv);
                    if (b) setMapFlyTo({ id: bumpFlyId(), bounds: b });
                  }}
                  onOpenFilters={() => setFiltersOpen(true)}
                  filterBadgeCount={filterBadgeCount}
                  showFiltersButton={hasListingTypeSelected}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--atlantic-navy)]">Nantucket Zoning Lookup</h1>
          <p className="text-xl text-[var(--nantucket-gray)]">
            Click any parcel • Search by address • Instant local intelligence
          </p>
            <>
              <div className="flex w-full gap-2">
                <div className="relative w-full">
                  <Input
                    placeholder="Search by address, Tax Map/Parcel, or neighborhood (e.g., Sconset, Polpis)"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSearch();
                      }
                    }}
                    className="h-11 bg-white"
                    aria-label="Search parcels"
                  />
                  {showSuggestions && suggestions.length > 0 ? (
                    <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-[var(--cedar-shingle)]/20 bg-white shadow-lg">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.key}
                          type="button"
                          className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-[var(--sandstone)]"
                          onMouseDown={() => {
                            setSelectedRental(null);
                            setSelectedLink(null);
                            setSelectedParcel(suggestion.feature.properties ?? null);
                            setSearchTerm(suggestion.label);
                            setSearchStatus(`Found: ${suggestion.label}`);
                            setShowSuggestions(false);
                            if (isNarrowForParcelDrawer()) setMobilePanelOpen(true);
                          }}
                        >
                          <span className="text-sm text-[var(--atlantic-navy)]">{suggestion.label}</span>
                          <span className="text-xs text-[var(--nantucket-gray)]">{suggestion.subLabel}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <Button onClick={handleSearch} className="h-11 bg-[var(--privet-green)] px-5 text-white hover:bg-[var(--brass-hover)]">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </div>
              {searchStatus ? <p className="text-sm text-[var(--nantucket-gray)]">{searchStatus}</p> : null}
            </>
          </div>
        )}

        <div
          className={cn(
            "map-content-area gap-2",
            isPropertyMap
              ? "-mx-4 flex min-h-0 flex-1 flex-col overflow-hidden sm:-mx-6 lg:mx-0 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:gap-4"
              : "grid lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:gap-4",
          )}
        >
          <div
            className={cn(
              "brand-surface overflow-hidden p-1.5 lg:p-2",
              isPropertyMap && "flex min-h-0 flex-1 flex-col rounded-none p-0 lg:rounded-xl lg:p-2",
            )}
          >
            {isLoading ? (
              <div
                className={cn(
                  "flex items-center justify-center text-[var(--nantucket-gray)]",
                  isPropertyMap ? "min-h-[min(360px,50dvh)] flex-1" : "min-h-[620px]",
                )}
              >
                Loading parcel intelligence map...
              </div>
            ) : (
              <div
                className={cn(
                  "relative",
                  isPropertyMap && "flex h-full min-h-0 flex-1 flex-col",
                )}
              >
                {isPropertyMap ? (
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-[8] h-24 bg-gradient-to-b from-white/80 via-white/35 to-transparent lg:h-28" />
                ) : null}
                {isPropertyMap ? (
                  <div className={cn("absolute inset-x-0 top-0 z-[12] px-2 pt-2 lg:px-4 lg:pt-3", mapUiHidden && "pointer-events-none opacity-0")}>
                    <div className="pointer-events-auto mx-auto flex w-full max-w-3xl items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <MapOmnibox
                          mapMode={mapModeForOmnibox}
                          open={omniboxOpen}
                          onOpenChange={setOmniboxOpen}
                          onApplyNlPreset={handleApplyNlPreset}
                          onSelectParcelId={handleOmniboxParcelSelect}
                          onSelectRentalHit={handleOmniboxRentalHit}
                          onSelectLinkHit={handleOmniboxLinkHit}
                          onSelectNeighborhoodSlug={handleOmniboxNeighborhoodSlug}
                          mapBounds={mapBounds}
                          prefillNonce={omniboxPrefillNonce}
                          prefillQuery={omniboxPrefillQuery}
                          compact
                          onPreviewChange={(p) => {
                            if (!p) setOmniboxPreview(null);
                            else if (p.parcelId) setOmniboxPreview({ parcelId: p.parcelId });
                            else if (p.lng != null && p.lat != null) setOmniboxPreview({ lng: p.lng, lat: p.lat });
                          }}
                        />
                      </div>
                      <PropertyMapOverlayChip
                        className="shrink-0 lg:hidden"
                        triggerClassName="h-10 px-2 py-0 sm:px-2.5"
                        parcelBaseLayer={parcelBaseLayer}
                        onParcelBaseLayer={applyParcelBaseLayer}
                      />
                    </div>
                  </div>
                ) : null}
                {!isPropertyMap ? (
                  <div
                    className={cn(
                      "absolute left-3 top-3 z-10 rounded-lg border border-[var(--cedar-shingle)]/20 bg-white/95 px-2 py-2 shadow-md",
                      mapUiHidden && "pointer-events-none opacity-0",
                    )}
                  >
                    <ZoningLookupColorsStrip
                      showZoningColors={showZoningColors}
                      onShowZoningColors={setShowZoningColors}
                    />
                  </div>
                ) : null}
                <div className="min-h-0 flex-1">
                  <ZoningMap
                    geojson={geojson}
                    selectedParcelId={selectedParcel?.parcel_id ?? null}
                    showZoningColors={showZoningColors}
                    onParcelSelect={handleParcelSelectFromMap}
                    showRentalPins={isPropertyMap}
                    rentalGeoJson={isPropertyMap ? rentalGeoJson : null}
                    selectedRentalFeatureId={null}
                    onRentalPinSelect={isPropertyMap ? handleRentalPinSelect : undefined}
                    onViewportBoundsChange={isPropertyMap ? handleViewportBoundsChange : undefined}
                    showLinkPins={isPropertyMap}
                    linkActiveGeoJson={isPropertyMap ? filteredLinkActiveFc : null}
                    linkSoldGeoJson={isPropertyMap ? filteredLinkSoldFc : null}
                    selectedLinkListingId={null}
                    onLinkListingPinSelect={isPropertyMap ? handleLinkListingPinSelect : undefined}
                    flyTo={isPropertyMap ? mapFlyTo : null}
                    reDistrictsGeoJson={isPropertyMap ? reDistrictsGeoJson : null}
                    parcelBaseLayer={isPropertyMap ? parcelBaseLayer : "tax_zoning"}
                    highlightedReDistrictAbbrv={
                      isPropertyMap && parcelBaseLayer === "re_market_areas" && reMarketAreaAbbrv.trim()
                        ? reMarketAreaAbbrv.trim()
                        : null
                    }
                    omniboxPreviewParcelId={omniboxPreview?.parcelId ?? null}
                    omniboxPreviewPoint={
                      omniboxPreview?.lng != null && omniboxPreview?.lat != null
                        ? { lng: omniboxPreview.lng, lat: omniboxPreview.lat }
                        : null
                    }
                    className={
                      isPropertyMap ? "h-full min-h-0 w-full rounded-xl" : undefined
                    }
                    onMapNonFeatureInteraction={
                      isPropertyMap ? dismissWelcomeSession : undefined
                    }
                  />
                </div>
                {isPropertyMap ? (
                  <div className={cn(mapUiHidden && "pointer-events-none opacity-0")}>
                    <PropertyMapFiltersSheet
                      trigger="none"
                      open={filtersOpen && hasListingTypeSelected}
                      onOpenChange={setFiltersOpen}
                      side={isPropertyMap && layoutNarrow ? "top" : "bottom"}
                      mapMode={mapModeForOmnibox}
                      selectedModes={mapModes}
                      rentalFilters={rentalFilters}
                      onRentalFiltersChange={setRentalFilters}
                      linkFilters={linkFilters}
                      onLinkFiltersChange={setLinkFilters}
                      pinSummary={{
                        rentalsFiltered: filteredRentals.length,
                        rentalsInView: rentalResults.length,
                        linkActiveFiltered: filteredLinkActiveFc.features.length,
                        linkActiveTotal: linkActiveFc.features.length,
                        linkSoldFiltered: filteredLinkSoldFc.features.length,
                        linkSoldTotal: linkSoldFc.features.length,
                      }}
                      onClearAll={() => {
                        setSelectedRental(null);
                        setSelectedLink(null);
                      }}
                    />
                  </div>
                ) : null}
                <div
                  className={cn(
                    "absolute right-3 top-3 z-10 flex flex-col items-end gap-2",
                    mapUiHidden && "pointer-events-none opacity-0",
                  )}
                >
                  {isPropertyMap ? (
                    <div className="hidden items-center gap-2 lg:flex">
                      <MapLegalNoticeButton />
                    </div>
                  ) : null}
                  <div className="hidden lg:block">
                    <MapLegend showRentalsLegend={showRentalPinsOnMap} showLinkPinsLegend={showLinkPinsOnMap} />
                  </div>
                </div>
                {isPropertyMap ? (
                  <div
                    className={cn(
                      "absolute bottom-3 right-3 z-10 lg:hidden",
                      mapUiHidden && "pointer-events-none opacity-0",
                    )}
                  >
                    <PropertyMapLayerHelpTrigger className="h-8 w-8" />
                  </div>
                ) : null}
                {showWelcomeCard ? (
                  <>
                    <div
                      className="pointer-events-none absolute inset-0 z-[17] rounded-xl bg-slate-900/[0.035] backdrop-blur-[2px]"
                      aria-hidden
                    />
                    <div
                      className={cn(
                        "pointer-events-none absolute z-[19] max-w-[min(14.5rem,calc(100%-1.25rem))] lg:max-w-[15rem]",
                        layoutNarrow ? "bottom-3 right-3" : "bottom-5 right-5",
                      )}
                    >
                      <div
                        className={cn(
                          "pointer-events-auto relative rounded-xl border border-blue-800/10 bg-white/82 p-3 text-left shadow-lg shadow-blue-900/8 ring-1 ring-[var(--cedar-shingle)]/10 backdrop-blur-md",
                          mapUiHidden && "pointer-events-none opacity-0",
                        )}
                      >
                        <button
                          type="button"
                          className="absolute right-1.5 top-1.5 rounded-full p-1 text-[var(--nantucket-gray)] transition hover:bg-black/5 hover:text-[var(--atlantic-navy)]"
                          aria-label="Dismiss welcome"
                          onClick={dismissWelcomeSession}
                        >
                          <X className="h-4 w-4" aria-hidden />
                        </button>
                        <div className="flex items-start gap-2.5 pr-7">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-700/10 text-blue-800">
                            <MapIcon className="h-4 w-4" aria-hidden />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-[13px] font-bold leading-tight text-[var(--atlantic-navy)]">
                              Discover Nantucket Properties
                            </h3>
                            <p className="mt-0.5 text-[10px] font-medium leading-snug text-[var(--nantucket-gray)]">
                              Tap a parcel or search above for intel.
                            </p>
                          </div>
                        </div>
                        <ul className="mt-2.5 space-y-0.5 border-t border-[var(--cedar-shingle)]/10 pt-2 text-[10px] font-medium leading-snug text-[var(--atlantic-navy)]">
                          <li className="flex gap-1.5">
                            <span className="shrink-0 text-blue-600" aria-hidden>
                              •
                            </span>
                            Expansion &amp; buildable cover
                          </li>
                          <li className="flex gap-1.5">
                            <span className="shrink-0 text-blue-600" aria-hidden>
                              •
                            </span>
                            Maury&apos;s take &amp; rental yield
                          </li>
                          <li className="flex gap-1.5">
                            <span className="shrink-0 text-blue-600" aria-hidden>
                              •
                            </span>
                            Zoning, market areas, and filters in the toolbar
                          </li>
                        </ul>
                        <div
                          className={cn(
                            "mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                            mapUiHidden && "pointer-events-none opacity-0",
                          )}
                        >
                          <button
                            type="button"
                            className="shrink-0 rounded-full border border-dashed border-blue-600/45 bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-blue-900 shadow-sm"
                            onClick={() => {
                              dismissWelcomeSession();
                              setOmniboxPrefillQuery("Cliff Rd");
                              setOmniboxPrefillNonce((n) => n + 1);
                            }}
                          >
                            Cliff Rd
                          </button>
                          <button
                            type="button"
                            className="shrink-0 rounded-full border border-dashed border-blue-600/45 bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-blue-900 shadow-sm"
                            onClick={() => {
                              dismissWelcomeSession();
                              handleOmniboxNeighborhoodSlug("sconset");
                            }}
                          >
                            Sconset
                          </button>
                          <button
                            type="button"
                            className="shrink-0 rounded-full border border-dashed border-emerald-700/35 bg-emerald-50/90 px-2.5 py-1 text-[10px] font-semibold text-emerald-950 shadow-sm"
                            onClick={() => {
                              dismissWelcomeSession();
                              handleOmniboxNeighborhoodSlug("mid-island");
                            }}
                          >
                            High expansion parcels
                          </button>
                        </div>
                        <button
                          type="button"
                          className="mt-3 w-full rounded-lg bg-[var(--atlantic-navy)] py-2 text-center text-[11px] font-bold text-white shadow-sm transition hover:bg-[var(--atlantic-navy)]/92"
                          onClick={dismissWelcomePermanent}
                        >
                          Got it
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}
                {isPropertyMap && layoutNarrow && mapSelectionActive && !mobilePanelOpen ? (
                  <div className="pointer-events-none absolute left-1/2 top-16 z-[30] max-w-[min(calc(100%-1.5rem),22rem)] -translate-x-1/2 transition-all duration-300">
                    <button
                      type="button"
                      className={cn(
                        "pointer-events-auto flex w-full items-center justify-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-3 py-1.5 shadow-lg backdrop-blur-md",
                        mapUiHidden && "pointer-events-none opacity-0",
                      )}
                      onClick={() => setMobilePanelOpen(true)}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full animate-pulse",
                          selectedLink ? "bg-blue-600" : selectedRental ? "bg-emerald-500" : "bg-blue-600",
                        )}
                        aria-hidden
                      />
                      <span className="truncate text-sm font-bold text-slate-800">{mapAddressPillLabel}</span>
                      <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500">
                        {mapPillZoneBadge}
                      </span>
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {isPropertyMap ? (
            <div className="hidden">
              {rentFilterActiveCount > 0 && hasRentMode ? (
                <p className="rounded-md border border-emerald-700/20 bg-emerald-50/90 px-3 py-2 text-xs leading-snug text-[var(--atlantic-navy)]">
                  Showing <strong>{filteredRentals.length}</strong>{" "}
                  {filteredRentals.length === 1 ? "rental" : "rentals"} matching your criteria in this view • Powered by live{" "}
                  <a href="https://www.nantucketrentals.com" className="font-medium text-[var(--privet-green)] underline" target="_blank" rel="noopener noreferrer">
                    nantucketrentals.com
                  </a>{" "}
                  data.
                </p>
              ) : null}
              {linkFilterActiveCount > 0 && (hasSaleMode || hasSoldMode) ? (
                <p className="rounded-md border border-blue-700/20 bg-blue-50/90 px-3 py-2 text-xs leading-snug text-[var(--atlantic-navy)]">
                  {hasSaleMode && hasSoldMode ? (
                    <>
                      Showing <strong>{filteredLinkActiveFc.features.length}</strong> active and{" "}
                      <strong>{filteredLinkSoldFc.features.length}</strong> sold MLS listings matching your criteria in this view • Live MLS feed.
                    </>
                  ) : hasSaleMode ? (
                    <>
                      Showing <strong>{filteredLinkActiveFc.features.length}</strong> active MLS listings matching your criteria in this view • Live MLS feed.
                    </>
                  ) : (
                    <>
                      Showing <strong>{filteredLinkSoldFc.features.length}</strong> sold MLS listings matching your criteria in this view • Live MLS feed.
                    </>
                  )}
                </p>
              ) : null}
            </div>
          ) : null}

          <aside
            id="parcel-zoning-panel"
            className={cn(
              "brand-surface hidden lg:flex lg:min-h-0 lg:flex-col",
              isPropertyMap
                ? "lg:max-h-[calc(100dvh-5rem-2rem)] lg:overflow-hidden"
                : "lg:gap-3 lg:overflow-y-auto",
            )}
          >
            {isPropertyMap ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
                {rentFilterActiveCount > 0 && hasRentMode ? (
                  <p className="shrink-0 rounded-md border border-emerald-700/20 bg-emerald-50/90 px-3 py-2 text-xs leading-snug text-[var(--atlantic-navy)]">
                    Showing <strong>{filteredRentals.length}</strong>{" "}
                    {filteredRentals.length === 1 ? "rental" : "rentals"} matching your criteria in this view • Powered by live{" "}
                    <a href="https://www.nantucketrentals.com" className="font-medium text-[var(--privet-green)] underline" target="_blank" rel="noopener noreferrer">
                      nantucketrentals.com
                    </a>{" "}
                    data.
                  </p>
                ) : null}
                {linkFilterActiveCount > 0 && (hasSaleMode || hasSoldMode) ? (
                  <p className="shrink-0 rounded-md border border-blue-700/20 bg-blue-50/90 px-3 py-2 text-xs leading-snug text-[var(--atlantic-navy)]">
                    {hasSaleMode && hasSoldMode ? (
                      <>
                        Showing <strong>{filteredLinkActiveFc.features.length}</strong> active and{" "}
                        <strong>{filteredLinkSoldFc.features.length}</strong> sold MLS listings matching your criteria in this view • Live MLS feed.
                      </>
                    ) : hasSaleMode ? (
                      <>
                        Showing <strong>{filteredLinkActiveFc.features.length}</strong> active MLS listings matching your criteria in this view • Live MLS feed.
                      </>
                    ) : (
                      <>
                        Showing <strong>{filteredLinkSoldFc.features.length}</strong> sold MLS listings matching your criteria in this view • Live MLS feed.
                      </>
                    )}
                  </p>
                ) : null}
                <div className="flex max-h-[min(28rem,55vh)] shrink-0 flex-col gap-2 overflow-y-auto">
                {hasSaleMode ? (
                  <div className="max-h-44 shrink-0 overflow-y-auto rounded-lg border border-[var(--cedar-shingle)]/20 bg-white p-3 shadow-sm">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--atlantic-navy)]">LINK — For sale</p>
                      {linkListingsLoading ? <span className="text-[10px] text-[var(--nantucket-gray)]">Loading…</span> : null}
                    </div>
                    {linkActiveFc.features.length === 0 && !linkListingsLoading ? (
                      <p className="text-xs text-[var(--nantucket-gray)]">None matched to a parcel in view.</p>
                    ) : filteredLinkActiveFc.features.length === 0 ? (
                      <p className="text-xs text-[var(--nantucket-gray)]">No listings match your filters in this view.</p>
                    ) : (
                      <ul className="space-y-2">
                        {filteredLinkActiveFc.features.map((f) => {
                          const p = f.properties;
                          return (
                            <li key={p.linkId}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRental(null);
                                  setSelectedLink(p);
                                  const feat = findParcelFeatureForLinkPin(p, features);
                                  setSelectedParcel(feat?.properties ?? null);
                                }}
                                className={cn(
                                  "flex w-full flex-col items-start rounded-md border px-2 py-2 text-left text-sm transition-colors",
                                  selectedLink?.linkId === p.linkId
                                    ? "border-blue-600 bg-blue-50"
                                    : "border-[var(--cedar-shingle)]/20 bg-white hover:bg-[var(--sandstone)]",
                                )}
                              >
                                <span className="font-medium text-[var(--atlantic-navy)]">{p.address}</span>
                                <span className="text-xs text-[var(--nantucket-gray)]">{p.listPrice}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : null}
                {hasSoldMode ? (
                  <div className="max-h-44 shrink-0 overflow-y-auto rounded-lg border border-[var(--cedar-shingle)]/20 bg-white p-3 shadow-sm">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--atlantic-navy)]">Sold Listings</p>
                      {linkListingsLoading ? <span className="text-[10px] text-[var(--nantucket-gray)]">Loading…</span> : null}
                    </div>
                    {linkSoldFc.features.length === 0 && !linkListingsLoading ? (
                      <p className="text-xs text-[var(--nantucket-gray)]">None matched to a parcel in view.</p>
                    ) : filteredLinkSoldFc.features.length === 0 ? (
                      <p className="text-xs text-[var(--nantucket-gray)]">No listings match your filters in this view.</p>
                    ) : (
                      <ul className="space-y-2">
                        {filteredLinkSoldFc.features.map((f) => {
                          const p = f.properties;
                          return (
                            <li key={p.linkId}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRental(null);
                                  setSelectedLink(p);
                                  const feat = findParcelFeatureForLinkPin(p, features);
                                  setSelectedParcel(feat?.properties ?? null);
                                }}
                                className={cn(
                                  "flex w-full flex-col items-start rounded-md border px-2 py-2 text-left text-sm transition-colors",
                                  selectedLink?.linkId === p.linkId
                                    ? "border-slate-600 bg-slate-100"
                                    : "border-[var(--cedar-shingle)]/20 bg-white hover:bg-[var(--sandstone)]",
                                )}
                              >
                                <span className="font-medium text-[var(--atlantic-navy)]">{p.address}</span>
                                <span className="text-xs text-[var(--nantucket-gray)]">
                                  {p.closePrice ? `Sold ${p.closePrice}` : p.listPrice}
                                  {p.closeDate ? ` · ${formatLinkMlsDateDisplay(p.closeDate)}` : ""}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : null}
                </div>
              <div className="shrink-0 px-1 pb-1">
                <PropertyIntelligencePanel
                  selectedParcel={selectedParcel}
                  selectedRental={selectedRental}
                  selectedLink={selectedLink}
                  linkListingId={linkListingIdForSelection}
                  parcelLinkListingMatch={effectiveParcelLinkMatch}
                  vacationRentalSlug={vacationRentalSlugForSelection}
                  districtMatch={districtMatch}
                  zoningLabel={zoningLabel}
                  parcelMapCenter={isPropertyMap ? parcelMapCenter : null}
                  onWatchChange={() => setWatchTick((t) => t + 1)}
                  onViewComparableRentals={handleViewComparableRentals}
                />
              </div>
              {selectedParcel ? (
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <ParcelDetailPanel
                    {...parcelMapCtas}
                    selectedParcel={selectedParcel}
                    zoningLabel={zoningLabel}
                    districtMatch={districtMatch}
                    zoningUseRows={zoningUseRows}
                    linkListingId={linkListingIdForSelection}
                    vacationRentalSlug={vacationRentalSlugForSelection}
                  />
                </div>
              ) : null}
                </div>
                <MapResearchHubStickyFooter
                  className="border-t border-[var(--cedar-shingle)]/20 bg-white/90 px-2 pb-2 pt-3 backdrop-blur-sm"
                  {...(mapResearchHubPrimaryCta ?? {})}
                />
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ParcelDetailPanel
                  {...parcelMapCtas}
                  selectedParcel={selectedParcel}
                  zoningLabel={zoningLabel}
                  districtMatch={districtMatch}
                  zoningUseRows={zoningUseRows}
                  linkListingId={linkListingIdForSelection}
                  vacationRentalSlug={vacationRentalSlugForSelection}
                />
              </div>
            )}
          </aside>
        </div>
      </div>

      <Drawer
        open={mobilePanelOpen && (!!selectedParcel || !!selectedRental || !!selectedLink)}
        onOpenChange={(open) => {
          setMobilePanelOpen(open);
        }}
      >
        <DrawerContent className="flex max-h-[78vh] flex-col overflow-hidden lg:hidden">
          <DrawerHeader className="sr-only shrink-0">
            <DrawerTitle>
              {selectedParcel?.location ??
                selectedRental?.streetAddress ??
                selectedRental?.headline ??
                selectedLink?.address ??
                "Detail"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="shrink-0 border-b border-[var(--cedar-shingle)]/20 bg-white/95 px-4 py-2">
            <button
              type="button"
              onClick={clearMapSelection}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--cedar-shingle)]/30 bg-white px-3 py-1 text-xs font-medium text-[var(--atlantic-navy)]"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Back to map
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isPropertyMap ? (
              <div className="flex flex-col pb-4">
                <PropertyIntelligencePanel
                  compactHero
                  selectedParcel={selectedParcel}
                  selectedRental={selectedRental}
                  selectedLink={selectedLink}
                  linkListingId={linkListingIdForSelection}
                  parcelLinkListingMatch={effectiveParcelLinkMatch}
                  vacationRentalSlug={vacationRentalSlugForSelection}
                  districtMatch={districtMatch}
                  zoningLabel={zoningLabel}
                  parcelMapCenter={isPropertyMap ? parcelMapCenter : null}
                  onWatchChange={() => setWatchTick((t) => t + 1)}
                  onViewComparableRentals={handleViewComparableRentals}
                />
                {selectedParcel ? (
                  <div className="space-y-4 px-4 pt-4">
                    <ParcelDetailPanel
                      {...parcelMapCtas}
                      selectedParcel={selectedParcel}
                      zoningLabel={zoningLabel}
                      districtMatch={districtMatch}
                      zoningUseRows={zoningUseRows}
                      linkListingId={linkListingIdForSelection}
                      vacationRentalSlug={vacationRentalSlugForSelection}
                    />
                  </div>
                ) : selectedRental ? (
                  <p className="mx-4 mt-4 rounded-md border border-[var(--cedar-shingle)]/20 bg-[var(--sandstone)]/40 px-3 py-2 text-center text-xs text-[var(--nantucket-gray)]">
                    This vacation rental pin did not match a loaded tax parcel. Zoom to Nantucket or tap a lot on the map
                    for full parcel and zoning detail.
                  </p>
                ) : null}
              </div>
            ) : selectedRental && selectedParcel ? (
              <div className="space-y-4 p-4">
                <div className="inline-flex rounded-full border border-[var(--cedar-shingle)]/25 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setMobileDrawerTab("rental")}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      mobileDrawerTab === "rental"
                        ? "bg-[var(--privet-green)] text-white"
                        : "text-[var(--atlantic-navy)]",
                    )}
                  >
                    Rental Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileDrawerTab("parcel")}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      mobileDrawerTab === "parcel"
                        ? "bg-[var(--atlantic-navy)] text-white"
                        : "text-[var(--atlantic-navy)]",
                    )}
                  >
                    Parcel & Zoning
                  </button>
                </div>
                {mobileDrawerTab === "rental" ? (
                  <div className="space-y-4">
                    {selectedRental.thumbUrl ? (
                      selectedRental.slug?.trim() ? (
                        <a
                          href={nantucketVacationRentalListingUrl(selectedRental.slug.trim())}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block cursor-pointer overflow-hidden rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--atlantic-navy)]"
                          aria-label="Open vacation rental listing on Nantucket Rentals (photos)"
                        >
                          <div className="relative aspect-[16/10] max-h-48 w-full">
                            <Image
                              src={selectedRental.thumbUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="100vw"
                              unoptimized
                            />
                          </div>
                        </a>
                      ) : (
                        <div className="relative aspect-[16/10] max-h-48 w-full overflow-hidden rounded-lg">
                          <Image
                            src={selectedRental.thumbUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="100vw"
                            unoptimized
                          />
                        </div>
                      )
                    ) : null}
                    <p className="text-lg font-semibold text-[var(--atlantic-navy)]">{selectedRental.headline}</p>
                    <p className="text-sm text-[var(--nantucket-gray)]">{selectedRental.streetAddress}</p>
                    <Button asChild className="w-full bg-[var(--privet-green)] text-white hover:bg-[var(--brass-hover)]">
                      <a href={nantucketVacationRentalListingUrl(selectedRental.slug)} target="_blank" rel="noopener noreferrer">
                        View Vacation Rental Listing
                      </a>
                    </Button>
                  </div>
                ) : (
                  <ParcelDetailPanel
                    {...parcelMapCtas}
                    selectedParcel={selectedParcel}
                    zoningLabel={zoningLabel}
                    districtMatch={districtMatch}
                    zoningUseRows={zoningUseRows}
                    linkListingId={linkListingIdForSelection}
                    vacationRentalSlug={vacationRentalSlugForSelection}
                  />
                )}
              </div>
            ) : selectedRental ? (
              <div className="space-y-4 p-4">
                {selectedRental.thumbUrl ? (
                  selectedRental.slug?.trim() ? (
                    <a
                      href={nantucketVacationRentalListingUrl(selectedRental.slug.trim())}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block cursor-pointer overflow-hidden rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--atlantic-navy)]"
                      aria-label="Open vacation rental listing on Nantucket Rentals (photos)"
                    >
                      <div className="relative aspect-[16/10] max-h-48 w-full">
                        <Image
                          src={selectedRental.thumbUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="100vw"
                          unoptimized
                        />
                      </div>
                    </a>
                  ) : (
                    <div className="relative aspect-[16/10] max-h-48 w-full overflow-hidden rounded-lg">
                      <Image
                        src={selectedRental.thumbUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="100vw"
                        unoptimized
                      />
                    </div>
                  )
                ) : null}
                <p className="text-lg font-semibold text-[var(--atlantic-navy)]">{selectedRental.headline}</p>
                <p className="text-sm text-[var(--nantucket-gray)]">{selectedRental.streetAddress}</p>
                <Button asChild className="w-full bg-[var(--privet-green)] text-white hover:bg-[var(--brass-hover)]">
                  <a href={nantucketVacationRentalListingUrl(selectedRental.slug)} target="_blank" rel="noopener noreferrer">
                    View Vacation Rental Listing
                  </a>
                </Button>
                <p className="text-center text-xs text-[var(--nantucket-gray)]">
                  Tap the map to select a lot — parcel detail and zoning appear on larger screens in the right column.
                </p>
              </div>
            ) : selectedLink ? (
              <div className="space-y-4 p-4">
                {selectedLink.thumbUrl ? (
                  <a
                    href={nantucketLinkListingUrl(selectedLink.linkId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--atlantic-navy)]"
                    aria-label="Open LINK MLS listing (photos)"
                  >
                    <div className="relative aspect-[16/10] max-h-48 w-full">
                      <Image
                        src={selectedLink.thumbUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="100vw"
                        unoptimized
                      />
                    </div>
                  </a>
                ) : null}
                <p className="text-lg font-semibold text-[var(--atlantic-navy)]">{selectedLink.address}</p>
                <p className="text-sm text-[var(--nantucket-gray)]">
                  {selectedLink.pool === "sold" ? (
                    <>
                      {selectedLink.closePrice ? <>Sold {selectedLink.closePrice}</> : null}
                      {selectedLink.closePrice && selectedLink.closeDate ? " · " : null}
                      {selectedLink.closeDate ? (
                        <span>Closed {formatLinkMlsDateDisplay(selectedLink.closeDate)}</span>
                      ) : null}
                      {!selectedLink.closePrice && selectedLink.listPrice ? (
                        <span>Listed {selectedLink.listPrice}</span>
                      ) : null}
                    </>
                  ) : (
                    <span>{selectedLink.listPrice}</span>
                  )}
                </p>
                <Button
                  asChild
                  className={cn(
                    "w-full text-white",
                    selectedLink.pool === "sold"
                      ? "bg-slate-600 hover:bg-slate-700"
                      : "bg-blue-600 hover:bg-blue-700",
                  )}
                >
                  <a href={nantucketLinkListingUrl(selectedLink.linkId)} target="_blank" rel="noopener noreferrer">
                    View LINK listing
                  </a>
                </Button>
                <p className="text-center text-xs text-[var(--nantucket-gray)]">
                  Pin is placed inside the matched tax parcel (interior label point); verify on the official listing.
                </p>
              </div>
            ) : (
              <ParcelDetailPanel
                {...parcelMapCtas}
                selectedParcel={selectedParcel}
                zoningLabel={zoningLabel}
                districtMatch={districtMatch}
                zoningUseRows={zoningUseRows}
                linkListingId={linkListingIdForSelection}
                vacationRentalSlug={vacationRentalSlugForSelection}
              />
            )}
          </div>
          {isPropertyMap ? (
            <DrawerFooter className="mt-0 shrink-0 gap-0 border-t border-[var(--cedar-shingle)]/20 bg-[var(--sandstone)] p-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <MapResearchHubStickyFooter
                showContactLinks={false}
                showLegalNav={false}
                className="px-3 pt-3"
                {...(mapResearchHubPrimaryCta ?? {})}
              />
            </DrawerFooter>
          ) : null}
        </DrawerContent>
      </Drawer>

    </section>
  );
}
