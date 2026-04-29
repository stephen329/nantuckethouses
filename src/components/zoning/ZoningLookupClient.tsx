"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FeatureCollection, Geometry, Point } from "geojson";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";
import { MapLegend } from "@/components/zoning/MapLegend";
import { ParcelProperties, ZoningMap } from "@/components/zoning/ZoningMap";
import { UseBadge } from "@/components/zoning/UseBadge";
import zoningData from "@/data/zoning-districts.json";
import zoningUseChart from "@/data/zoning-use-chart.json";
import recentSoldParcels from "@/data/recent-sold-parcels.json";
import nrRentalSlugsByParcel from "@/data/nr-rental-slugs-by-parcel.json";
import { getZoningColor } from "@/lib/zoning-colors";
import { nantucketLinkListingUrl } from "@/lib/link-listing-url";
import type {
  LinkListingPinFeature,
  LinkListingPinProperties,
} from "@/lib/link-listings-parcel-match";
import type { NrMapRentalResult, RentalPinFeature } from "@/lib/nr-map-rentals";
import { rentalsToGeoJson } from "@/lib/nr-map-rentals";
import { nantucketVacationRentalListingUrl } from "@/lib/nr-vacation-rental-url";
import { PropertyMapWelcomeBanner } from "@/components/map/PropertyMapWelcomeBanner";

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

export type PropertyMapMode = "rent" | "sale" | "sold" | "all";

const EMPTY_LINK_FC: FeatureCollection<Point, LinkListingPinProperties> = { type: "FeatureCollection", features: [] };

function parseMapMode(v: string | null): PropertyMapMode {
  if (v === "sale" || v === "sold" || v === "all" || v === "rent") return v;
  return "rent";
}

type ParcelFeatureCollection = FeatureCollection<Geometry, ParcelProperties>;
type ParcelFeature = ParcelFeatureCollection["features"][number];
type UseFilterChip = "all" | "residential" | "accessory" | "special";

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
type ZoningUseRow = { category: string; useName: string; value: string; allowed: boolean };

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

function groupByCategory(rows: ZoningUseRow[], categoryOrder: string[]) {
  const out = new Map<string, ZoningUseRow[]>();
  for (const category of categoryOrder) {
    const group = rows.filter((row) => row.category === category);
    if (group.length) out.set(category, group);
  }
  return out;
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
};

function ParcelDetailPanel({ selectedParcel, zoningLabel, districtMatch, zoningUseRows, linkListingId, vacationRentalSlug }: PanelProps) {
  const [filter, setFilter] = useState("");
  const [chip, setChip] = useState<UseFilterChip>("all");

  const categoryOrder = ["Residential", "Commercial", "Commercial Industrial", "Industrial", "Other"];
  const labelMap: Record<string, string> = {
    Residential: "Residential",
    Commercial: "Commercial",
    "Commercial Industrial": "Commercial Industrial",
    Industrial: "Industrial",
    Other: "Other",
  };
  const legend = (zoningUseChart as { metadata: { legend: Record<string, string> } }).metadata.legend;

  const filteredRows = useMemo(() => filterUseRows(zoningUseRows, filter, chip), [zoningUseRows, filter, chip]);
  const permitted = useMemo(() => groupByCategory(filteredRows.filter((r) => r.allowed), categoryOrder), [filteredRows]);
  const blocked = useMemo(() => groupByCategory(filteredRows.filter((r) => !r.allowed), categoryOrder), [filteredRows]);

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
            {linkListingId ? (
              <Button asChild variant="outline" size="sm">
                <a href={nantucketLinkListingUrl(linkListingId)} target="_blank" rel="noopener noreferrer">
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
            <p className="text-xs text-[var(--nantucket-gray)]">Tax Map/Parcel</p>
            <p className="mt-1 font-medium">{selectedParcel?.tax_map ?? "N/A"} / {selectedParcel?.parcel ?? "N/A"}</p>
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
      </div>

      <div className={cn("mt-auto border-t bg-white p-4", "sticky bottom-0 md:static")}>
        <div className="mb-3 rounded-lg border bg-white">
          <div className="border-b px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--nantucket-gray)]">Zoning Uses ({selectedParcel?.zoning ?? "District"})</p>
          </div>
          <div className="space-y-2 p-3">
            <Input placeholder="Filter uses..." value={filter} onChange={(e) => setFilter(e.target.value)} className="h-8 bg-white text-xs" />
            <div className="flex flex-wrap gap-1">
              {(["all", "residential", "accessory", "special"] as UseFilterChip[]).map((c) => (
                <button key={c} type="button" onClick={() => setChip(c)} className={cn("rounded border px-2 py-1 text-[10px] uppercase tracking-wide", chip === c ? "border-[var(--privet-green)] bg-[var(--privet-green)]/10 text-[var(--atlantic-navy)]" : "border-[var(--cedar-shingle)]/30 text-[var(--nantucket-gray)]")}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-56 overflow-auto px-3 pb-3">
            {filteredRows.length ? (
              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Permitted Uses</p>
                  <div className="space-y-2">
                    {Array.from(permitted.entries()).map(([category, rows]) => (
                      <div key={`p-${category}`} className="rounded border">
                        <p className="border-b bg-[var(--sandstone)] px-2 py-1 text-[11px] font-medium text-[var(--atlantic-navy)]">{labelMap[category] ?? category}</p>
                        <div className="grid grid-cols-1 gap-1 p-2 sm:grid-cols-2">
                          {rows.map((row) => (
                            <div key={`${category}-${row.useName}`} className="rounded border bg-white px-2 py-1.5">
                              <p className="text-[11px] text-[var(--atlantic-navy)]">{row.useName}</p>
                              <div className="mt-1">
                                <UseBadge value={row.value} allowed={row.allowed} title={legend[row.value] ?? row.value} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-rose-700">Not Allowed</p>
                  <div className="space-y-2">
                    {Array.from(blocked.entries()).map(([category, rows]) => (
                      <div key={`n-${category}`} className="rounded border">
                        <p className="border-b bg-[var(--sandstone)] px-2 py-1 text-[11px] font-medium text-[var(--atlantic-navy)]">{labelMap[category] ?? category}</p>
                        <div className="grid grid-cols-1 gap-1 p-2 sm:grid-cols-2">
                          {rows.map((row) => (
                            <div key={`${category}-${row.useName}`} className="rounded border bg-white px-2 py-1.5">
                              <p className="text-[11px] text-[var(--atlantic-navy)]">{row.useName}</p>
                              <div className="mt-1">
                                <UseBadge value={row.value} allowed={row.allowed} title={legend[row.value] ?? row.value} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--nantucket-gray)]">No use-chart rows available for this district/filter.</p>
            )}
          </div>
          <p className="border-t px-3 py-2 text-[10px] text-[var(--nantucket-gray)]">Source: {(zoningUseChart as { metadata: { source: string } }).metadata.source}</p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button className="w-full bg-[var(--privet-green)] text-white hover:bg-[var(--brass-hover)]">Get Custom Valuation from Stephen Maury</Button>
          <Button variant="outline" className="w-full">View Nearby Price Trends</Button>
        </div>
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
  const [mapMode, setMapMode] = useState<PropertyMapMode>(() => parseMapMode(searchParams.get("mode")));

  const [geojson, setGeojson] = useState<ParcelFeatureCollection | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<ParcelProperties | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [highlightRecentSales, setHighlightRecentSales] = useState(false);
  const [showZoningColors, setShowZoningColors] = useState(true);
  const [mapBounds, setMapBounds] = useState<{ west: number; south: number; east: number; north: number } | null>(null);
  const [rentalResults, setRentalResults] = useState<NrMapRentalResult[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(false);
  const [selectedRental, setSelectedRental] = useState<NrMapRentalResult | null>(null);
  const [linkActiveFc, setLinkActiveFc] = useState<FeatureCollection<Point, LinkListingPinProperties>>(EMPTY_LINK_FC);
  const [linkSoldFc, setLinkSoldFc] = useState<FeatureCollection<Point, LinkListingPinProperties>>(EMPTY_LINK_FC);
  const [linkListingsLoading, setLinkListingsLoading] = useState(false);
  const [selectedLink, setSelectedLink] = useState<LinkListingPinProperties | null>(null);

  useEffect(() => {
    setMapMode(parseMapMode(searchParams.get("mode")));
  }, [searchParams]);

  useEffect(() => {
    setSelectedRental(null);
    setSelectedLink(null);
  }, [mapMode]);

  const selectMapMode = useCallback(
    (next: PropertyMapMode) => {
      setMapMode(next);
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("mode", next);
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
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

  const recentSoldFeed = recentSoldParcels as RecentSoldParcelsFeed;

  const soldParcelIds = useMemo(() => recentSoldFeed.parcelIds, []);

  const linkListingByParcelId = useMemo(() => recentSoldFeed.linkListingByParcelId, []);

  const linkListingIdForSelection = useMemo(() => {
    const pid = selectedParcel?.parcel_id;
    if (!pid) return null;
    return linkListingByParcelId[String(pid).trim()] ?? null;
  }, [selectedParcel?.parcel_id, linkListingByParcelId]);

  const nrRentalFeed = nrRentalSlugsByParcel as NrRentalSlugsFeed;
  const slugByParcelIdForRentals = useMemo(() => nrRentalFeed.slugByParcelId, []);

  const vacationRentalSlugForSelection = useMemo(() => {
    const pid = selectedParcel?.parcel_id;
    if (!pid) return null;
    return slugByParcelIdForRentals[String(pid).trim()] ?? null;
  }, [selectedParcel?.parcel_id, slugByParcelIdForRentals]);

  const rentalGeoJson = useMemo(() => rentalsToGeoJson(rentalResults), [rentalResults]);

  const handleParcelSelectFromMap = useCallback((feature: ParcelFeature) => {
    setSelectedRental(null);
    setSelectedLink(null);
    setSelectedParcel(feature.properties ?? null);
    setSearchStatus(null);
    if (isNarrowForParcelDrawer()) setMobilePanelOpen(true);
  }, []);

  const handleRentalPinSelect = useCallback((feature: RentalPinFeature) => {
    const p = feature.properties;
    const coords = (feature.geometry as Point).coordinates;
    setSelectedParcel(null);
    setSelectedLink(null);
    setSelectedRental({
      nrPropertyId: Number(p.nrPropertyId),
      slug: p.slug,
      streetAddress: p.streetAddress,
      headline: p.headline,
      latitude: coords[1],
      longitude: coords[0],
      thumbUrl: p.thumbUrl,
    });
    if (isNarrowForParcelDrawer()) setMobilePanelOpen(true);
  }, []);

  const handleLinkListingPinSelect = useCallback((feature: LinkListingPinFeature) => {
    setSelectedParcel(null);
    setSelectedRental(null);
    setSelectedLink(feature.properties);
    if (isNarrowForParcelDrawer()) setMobilePanelOpen(true);
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
        if (mapMode === "rent") {
          setLinkListingsLoading(false);
          setLinkActiveFc(EMPTY_LINK_FC);
          setLinkSoldFc(EMPTY_LINK_FC);
          await loadRentals();
          return;
        }
        if (mapMode === "sale") {
          setRentalsLoading(false);
          setRentalResults([]);
          setLinkSoldFc(EMPTY_LINK_FC);
          await loadLink("active");
          return;
        }
        if (mapMode === "sold") {
          setRentalsLoading(false);
          setRentalResults([]);
          setLinkActiveFc(EMPTY_LINK_FC);
          await loadLink("sold");
          return;
        }
        setRentalsLoading(true);
        setLinkListingsLoading(true);
        try {
          const [rentRes, linkRes] = await Promise.all([
            fetch(`/api/map/rentals?bbox=${bboxStr}`, { signal: controller.signal }),
            fetch(`/api/map/link-listings?bbox=${bboxStr}&pool=both`, { signal: controller.signal }),
          ]);
          const rentData = (await rentRes.json()) as { results?: NrMapRentalResult[] };
          const linkData = (await linkRes.json()) as {
            active?: FeatureCollection<Point, LinkListingPinProperties>;
            sold?: FeatureCollection<Point, LinkListingPinProperties>;
          };
          if (controller.signal.aborted) return;
          if (Array.isArray(rentData.results)) setRentalResults(rentData.results);
          setLinkActiveFc(linkData.active ?? EMPTY_LINK_FC);
          setLinkSoldFc(linkData.sold ?? EMPTY_LINK_FC);
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
  }, [isPropertyMap, mapBounds, mapMode]);

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

  const selectedRentalPinKey = selectedRental ? String(selectedRental.nrPropertyId) : null;
  const selectedLinkPinKey = selectedLink?.linkId ?? null;

  const showRentalPinsOnMap = isPropertyMap && (mapMode === "rent" || mapMode === "all");
  const showLinkPinsOnMap = isPropertyMap && (mapMode === "sale" || mapMode === "sold" || mapMode === "all");

  return (
    <section className="bg-[var(--sandstone)] py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
        <div className="space-y-3">
          {isPropertyMap ? <PropertyMapWelcomeBanner /> : null}
          {isPropertyMap ? (
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Listing type">
              {(
                [
                  { mode: "rent" as const, label: "For rent" },
                  { mode: "sale" as const, label: "For sale" },
                  { mode: "sold" as const, label: "Sold" },
                  { mode: "all" as const, label: "All" },
                ] as const
              ).map(({ mode, label }) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={mapMode === mode}
                  onClick={() => selectMapMode(mode)}
                  className={cn(
                    "inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    mapMode === mode
                      ? "border-[var(--privet-green)] bg-[var(--privet-green)] text-white"
                      : "border-[var(--cedar-shingle)]/30 bg-white/90 text-[var(--atlantic-navy)] hover:bg-[var(--sandstone)]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--atlantic-navy)]">
            {isPropertyMap ? "Nantucket Property Map" : "Nantucket Zoning Lookup"}
          </h1>
          <p className="text-xl text-[var(--nantucket-gray)]">
            {isPropertyMap
              ? "Nantucket rentals and sales — live map. Updated from live inventory; parcel and zoning context built in."
              : "Click any parcel • Search by address • Instant local intelligence"}
          </p>
          {isPropertyMap ? (
            <p className="text-sm text-[var(--nantucket-gray)]">
              Curated by Stephen Maury — local context on every search.
            </p>
          ) : null}
          <div className="flex w-full gap-2">
            <div className="relative w-full">
              <Input
                placeholder="Search by address or Tax Map + Parcel (e.g., 42.3.4 152)..."
                value={searchTerm}
                onChange={(event) => { setSearchTerm(event.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
                onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); handleSearch(); } }}
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
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
          <div className="brand-surface overflow-hidden p-2">
            {isLoading ? (
              <div className="flex min-h-[620px] items-center justify-center text-[var(--nantucket-gray)]">Loading parcel intelligence map...</div>
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-3 z-10 flex max-w-[min(100%,20rem)] flex-col gap-3 rounded-md border border-[var(--cedar-shingle)]/20 bg-white/95 px-2.5 py-2 text-xs shadow">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="zoning-show-colors"
                      checked={showZoningColors}
                      onCheckedChange={(value) => setShowZoningColors(value === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="zoning-show-colors" className="cursor-pointer leading-snug text-[var(--atlantic-navy)]">
                      Zoning colors
                      <span className="mt-0.5 block font-normal text-[var(--nantucket-gray)]">Tint parcels by district. Off uses a neutral fill.</span>
                    </label>
                  </div>
                  <div className="flex items-start gap-2 border-t border-[var(--cedar-shingle)]/15 pt-3">
                    <Checkbox
                      id="zoning-highlight-recent-sales"
                      checked={highlightRecentSales}
                      onCheckedChange={(value) => setHighlightRecentSales(value === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="zoning-highlight-recent-sales" className="cursor-pointer leading-snug text-[var(--atlantic-navy)]">
                      Show recent sales
                      <span className="mt-0.5 block font-normal text-[var(--nantucket-gray)]">
                        {recentSoldFeed.matchedParcelCount} parcels matched from {recentSoldFeed.listingCount} MLS closings (MapID + ParcelId).
                      </span>
                    </label>
                  </div>
                </div>
                <ZoningMap
                  geojson={geojson}
                  selectedParcelId={selectedParcel?.parcel_id ?? null}
                  showZoningColors={showZoningColors}
                  highlightSoldParcels={highlightRecentSales}
                  soldParcelIds={soldParcelIds}
                  onParcelSelect={handleParcelSelectFromMap}
                  showRentalPins={isPropertyMap}
                  rentalGeoJson={isPropertyMap ? rentalGeoJson : null}
                  selectedRentalFeatureId={isPropertyMap ? selectedRentalPinKey : null}
                  onRentalPinSelect={isPropertyMap ? handleRentalPinSelect : undefined}
                  onViewportBoundsChange={isPropertyMap ? handleViewportBoundsChange : undefined}
                  showLinkPins={isPropertyMap}
                  linkActiveGeoJson={isPropertyMap ? linkActiveFc : null}
                  linkSoldGeoJson={isPropertyMap ? linkSoldFc : null}
                  selectedLinkListingId={isPropertyMap ? selectedLinkPinKey : null}
                  onLinkListingPinSelect={isPropertyMap ? handleLinkListingPinSelect : undefined}
                />
                <div className="absolute right-3 top-3 z-10">
                  <MapLegend showRentalsLegend={showRentalPinsOnMap} showLinkPinsLegend={showLinkPinsOnMap} />
                </div>
              </div>
            )}
          </div>

          <aside
            id="parcel-zoning-panel"
            className={cn(
              "brand-surface hidden lg:flex lg:min-h-0 lg:flex-col lg:gap-3",
              isPropertyMap ? "lg:max-h-[calc(100dvh-10rem)]" : "",
            )}
          >
            {isPropertyMap ? (
              <div className="flex max-h-[min(28rem,55vh)] shrink-0 flex-col gap-2 overflow-y-auto">
                {mapMode === "rent" || mapMode === "all" ? (
                  <div className="max-h-44 shrink-0 overflow-y-auto rounded-lg border border-[var(--cedar-shingle)]/20 bg-white p-3 shadow-sm">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--atlantic-navy)]">Rentals</p>
                      {rentalsLoading ? <span className="text-[10px] text-[var(--nantucket-gray)]">Loading…</span> : null}
                    </div>
                    {!rentalsLoading && rentalResults.length === 0 ? (
                      <p className="text-xs text-[var(--nantucket-gray)]">None in view.</p>
                    ) : (
                      <ul className="space-y-2">
                        {rentalResults.map((r) => (
                          <li key={r.nrPropertyId}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedParcel(null);
                                setSelectedLink(null);
                                setSelectedRental(r);
                              }}
                              className={cn(
                                "flex w-full flex-col items-start rounded-md border px-2 py-2 text-left text-sm transition-colors",
                                selectedRental?.nrPropertyId === r.nrPropertyId
                                  ? "border-[var(--privet-green)] bg-[var(--privet-green)]/10"
                                  : "border-[var(--cedar-shingle)]/20 bg-white hover:bg-[var(--sandstone)]",
                              )}
                            >
                              <span className="font-medium text-[var(--atlantic-navy)]">{r.headline}</span>
                              <span className="text-xs text-[var(--nantucket-gray)]">{r.streetAddress}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
                {mapMode === "sale" || mapMode === "all" ? (
                  <div className="max-h-44 shrink-0 overflow-y-auto rounded-lg border border-[var(--cedar-shingle)]/20 bg-white p-3 shadow-sm">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--atlantic-navy)]">LINK — For sale</p>
                      {linkListingsLoading ? <span className="text-[10px] text-[var(--nantucket-gray)]">Loading…</span> : null}
                    </div>
                    {linkActiveFc.features.length === 0 && !linkListingsLoading ? (
                      <p className="text-xs text-[var(--nantucket-gray)]">None matched to a parcel in view.</p>
                    ) : (
                      <ul className="space-y-2">
                        {linkActiveFc.features.map((f) => {
                          const p = f.properties;
                          return (
                            <li key={p.linkId}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedParcel(null);
                                  setSelectedRental(null);
                                  setSelectedLink(p);
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
                {mapMode === "sold" || mapMode === "all" ? (
                  <div className="max-h-44 shrink-0 overflow-y-auto rounded-lg border border-[var(--cedar-shingle)]/20 bg-white p-3 shadow-sm">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--atlantic-navy)]">LINK — Sold</p>
                      {linkListingsLoading ? <span className="text-[10px] text-[var(--nantucket-gray)]">Loading…</span> : null}
                    </div>
                    {linkSoldFc.features.length === 0 && !linkListingsLoading ? (
                      <p className="text-xs text-[var(--nantucket-gray)]">None matched to a parcel in view.</p>
                    ) : (
                      <ul className="space-y-2">
                        {linkSoldFc.features.map((f) => {
                          const p = f.properties;
                          return (
                            <li key={p.linkId}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedParcel(null);
                                  setSelectedRental(null);
                                  setSelectedLink(p);
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
                                  {p.closeDate ? ` · ${p.closeDate}` : ""}
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
            ) : null}
            {isPropertyMap && selectedLink ? (
              <div className="shrink-0 space-y-3 rounded-lg border border-[var(--cedar-shingle)]/20 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--atlantic-navy)]">
                  {selectedLink.pool === "sold" ? "LINK — Sold" : "LINK — For sale"}
                </p>
                {selectedLink.thumbUrl ? (
                  <div className="relative aspect-[16/10] max-h-40 w-full overflow-hidden rounded-lg">
                    <Image
                      src={selectedLink.thumbUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 28vw, 100vw"
                      unoptimized
                    />
                  </div>
                ) : null}
                <p className="text-lg font-semibold text-[var(--atlantic-navy)]">{selectedLink.address}</p>
                <p className="text-sm text-[var(--nantucket-gray)]">
                  {selectedLink.pool === "sold" ? (
                    <>
                      {selectedLink.closePrice ? <>Sold {selectedLink.closePrice}</> : null}
                      {selectedLink.closePrice && selectedLink.closeDate ? " · " : null}
                      {selectedLink.closeDate ? <span>Closed {selectedLink.closeDate}</span> : null}
                      {!selectedLink.closePrice && selectedLink.listPrice ? <span>Listed {selectedLink.listPrice}</span> : null}
                    </>
                  ) : (
                    <span>{selectedLink.listPrice}</span>
                  )}
                </p>
                <Button
                  asChild
                  className={cn(
                    "w-full text-white",
                    selectedLink.pool === "sold" ? "bg-slate-600 hover:bg-slate-700" : "bg-blue-600 hover:bg-blue-700",
                  )}
                >
                  <a href={nantucketLinkListingUrl(selectedLink.linkId)} target="_blank" rel="noopener noreferrer">
                    View LINK listing
                  </a>
                </Button>
                <p className="text-xs text-[var(--nantucket-gray)]">
                  Pin is at the matched tax parcel centroid; confirm on the official listing.
                </p>
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ParcelDetailPanel
                selectedParcel={selectedParcel}
                zoningLabel={zoningLabel}
                districtMatch={districtMatch}
                zoningUseRows={zoningUseRows}
                linkListingId={linkListingIdForSelection}
                vacationRentalSlug={vacationRentalSlugForSelection}
              />
            </div>
          </aside>
        </div>
      </div>

      <Drawer
        open={mobilePanelOpen && (!!selectedParcel || !!selectedRental || !!selectedLink)}
        onOpenChange={(open) => {
          setMobilePanelOpen(open);
          if (!open) {
            setSelectedParcel(null);
            setSelectedRental(null);
            setSelectedLink(null);
          }
        }}
      >
        <DrawerContent className="lg:hidden">
          <DrawerHeader>
            <DrawerTitle>
              {selectedParcel?.location ??
                selectedRental?.streetAddress ??
                selectedRental?.headline ??
                selectedLink?.address ??
                "Detail"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[75vh] overflow-y-auto">
            {selectedRental ? (
              <div className="space-y-4 p-4">
                {selectedRental.thumbUrl ? (
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
                  <div className="relative aspect-[16/10] max-h-48 w-full overflow-hidden rounded-lg">
                    <Image
                      src={selectedLink.thumbUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="100vw"
                      unoptimized
                    />
                  </div>
                ) : null}
                <p className="text-lg font-semibold text-[var(--atlantic-navy)]">{selectedLink.address}</p>
                <p className="text-sm text-[var(--nantucket-gray)]">
                  {selectedLink.pool === "sold" ? (
                    <>
                      {selectedLink.closePrice ? <>Sold {selectedLink.closePrice}</> : null}
                      {selectedLink.closePrice && selectedLink.closeDate ? " · " : null}
                      {selectedLink.closeDate ? <span>Closed {selectedLink.closeDate}</span> : null}
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
                  Pin is placed at the matched tax parcel centroid; verify on the official listing.
                </p>
              </div>
            ) : (
              <ParcelDetailPanel
                selectedParcel={selectedParcel}
                zoningLabel={zoningLabel}
                districtMatch={districtMatch}
                zoningUseRows={zoningUseRows}
                linkListingId={linkListingIdForSelection}
                vacationRentalSlug={vacationRentalSlugForSelection}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}
