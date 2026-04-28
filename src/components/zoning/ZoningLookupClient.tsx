"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";
import { ParcelProperties, ZoningMap } from "@/components/zoning/ZoningMap";
import zoningData from "@/data/zoning-districts.json";
import zoningUseChart from "@/data/zoning-use-chart.json";

type ParcelFeatureCollection = FeatureCollection<Geometry, ParcelProperties>;
type ParcelFeature = ParcelFeatureCollection["features"][number];

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
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(truncated);
}

type DistrictInfo = {
  name?: string;
  minLotSize?: string;
  frontage?: string;
  maxGroundCover?: string;
  frontSetback?: string;
  sideSetback?: string;
  rearSetback?: string;
  hdcScrutiny?: string;
  typicalPermitLag?: string;
  notes?: string;
};

type UsePermission = {
  value: string;
  allowed: boolean;
};

function normalizeDistrictCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "").replace(/-/g, "");
}

export function ZoningLookupClient() {
  const [geojson, setGeojson] = useState<ParcelFeatureCollection | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<ParcelProperties | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadParcels() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/tools/zoning-lookup/parcels", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Failed to load parcel data: ${response.status}`);
        }
        const data = (await response.json()) as ParcelFeatureCollection;
        setGeojson(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setSearchStatus(error instanceof Error ? error.message : "Failed to load parcel data");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadParcels();
    return () => controller.abort();
  }, []);

  const features = useMemo(() => geojson?.features ?? [], [geojson]);

  const findParcelMatch = useCallback(
    (rawQuery: string): ParcelFeature | undefined => {
      const query = rawQuery.trim().toLowerCase();
      if (!query) return undefined;

      return features.find((feature) => {
        const properties = feature.properties ?? {};
        const address = String(properties.location ?? "").toLowerCase();
        const mapParcel = `${properties.tax_map ?? ""} ${properties.parcel ?? ""}`.trim().toLowerCase();
        const parcelId = String(properties.parcel_id ?? "").toLowerCase();

        return address.includes(query) || mapParcel.includes(query) || parcelId.includes(query);
      });
    },
    [features],
  );

  const suggestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query || query.length < 2) return [];

    return features
      .filter((feature) => {
        const properties = feature.properties ?? {};
        const address = String(properties.location ?? "").toLowerCase();
        const mapParcel = `${properties.tax_map ?? ""} ${properties.parcel ?? ""}`.trim().toLowerCase();
        const parcelId = String(properties.parcel_id ?? "").toLowerCase();
        return address.includes(query) || mapParcel.includes(query) || parcelId.includes(query);
      })
      .slice(0, 8)
      .map((feature) => {
        const properties = feature.properties ?? {};
        return {
          key: `${properties.parcel_id ?? "parcel"}-${properties.location ?? "address"}`,
          label: properties.location ?? "Address unavailable",
          subLabel: `Tax Map ${properties.tax_map ?? "N/A"} • Parcel ${properties.parcel ?? "N/A"}`,
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

    setSelectedParcel(match.properties);
    setSearchStatus(`Found: ${match.properties.location ?? match.properties.parcel_id ?? "Parcel"}`);
    setShowSuggestions(false);
  }, [findParcelMatch, searchTerm]);

  const zoningLabel = selectedParcel?.zoning ?? "Unknown";
  const primaryUse = selectedParcel?.use ?? selectedParcel?.primary_use ?? "Unknown";
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
    const categories = zoningUseChart as {
      metadata: { source: string; legend: Record<string, string> };
      Residential: Record<string, Record<string, UsePermission>>;
    };

    return Object.entries(categories.Residential)
      .map(([useName, districtMap]) => {
        const matchEntry = Object.entries(districtMap).find(
          ([districtCode]) => normalizeDistrictCode(districtCode) === normalizedSelected,
        );
        if (!matchEntry) return null;
        const [, permission] = matchEntry;
        return {
          useName,
          value: permission.value,
          allowed: permission.allowed,
        };
      })
      .filter((row): row is { useName: string; value: string; allowed: boolean } => row !== null);
  }, [selectedParcel?.zoning]);

  return (
    <section className="bg-[var(--sandstone)] py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--atlantic-navy)]">
            Nantucket Zoning Lookup
          </h1>
          <p className="text-xl text-[var(--nantucket-gray)]">
            Click any parcel • Search by address • Instant local intelligence
          </p>
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="flex w-full gap-2">
              <div className="relative w-full">
                <Input
                  placeholder="Search by address or Tax Map + Parcel (e.g., 42.3.4 152)..."
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    window.setTimeout(() => setShowSuggestions(false), 120);
                  }}
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
                          setSelectedParcel(suggestion.feature.properties ?? null);
                          setSearchTerm(suggestion.label);
                          setSearchStatus(`Found: ${suggestion.label}`);
                          setShowSuggestions(false);
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
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="h-8 bg-white text-[var(--atlantic-navy)]">
                Last Updated: May 2025 • Town of Nantucket Assessors
              </Badge>
            </div>
          </div>
          {searchStatus ? <p className="text-sm text-[var(--nantucket-gray)]">{searchStatus}</p> : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
          <div className="brand-surface overflow-hidden p-2">
            {isLoading ? (
              <div className="flex min-h-[620px] items-center justify-center text-[var(--nantucket-gray)]">
                Loading parcel intelligence map...
              </div>
            ) : (
              <ZoningMap
                geojson={geojson}
                selectedParcelId={selectedParcel?.parcel_id ?? null}
                onParcelSelect={(feature) => {
                  setSelectedParcel(feature.properties ?? null);
                  setSearchStatus(null);
                }}
              />
            )}
          </div>

          <aside className="brand-surface flex min-h-[620px] flex-col">
            <div className="space-y-4 p-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--nantucket-gray)]">Parcel Detail</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl text-[var(--atlantic-navy)]">
                    {selectedParcel?.location ?? "Select a parcel on the map"}
                  </h2>
                  {selectedParcel?.tax_map && selectedParcel?.parcel ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/tools/zoning-lookup/${encodeURIComponent(selectedParcel.tax_map)}/${encodeURIComponent(selectedParcel.parcel)}`}>
                        Open Full Parcel Page
                      </Link>
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
                      style={{ backgroundColor: selectedParcel?.zoning_color ?? "#64748b" }}
                    />
                    <p className="font-medium">{zoningLabel}</p>
                  </div>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <p className="text-xs text-[var(--nantucket-gray)]">Lot Size</p>
                  <p className="mt-1 font-medium">
                    {formatTruncatedAcreage(selectedParcel?.acreage)} acres ({formatNumber(selectedParcel?.lot_area_sqft, 0)} sqft)
                  </p>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <p className="text-xs text-[var(--nantucket-gray)]">Assessed Value</p>
                  <p className="mt-1 font-medium">{formatCurrency(selectedParcel?.assessed_total)}</p>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <p className="text-xs text-[var(--nantucket-gray)]">Tax Map/Parcel</p>
                  <p className="mt-1 font-medium">
                    {selectedParcel?.tax_map ?? "N/A"} / {selectedParcel?.parcel ?? "N/A"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--cedar-shingle)]/25 bg-white p-4">
                {districtMatch ? (
                  <div className="mt-2 space-y-2 text-sm text-[var(--atlantic-navy)]">
                    <p className="font-medium">
                      {districtMatch.code} ({districtMatch.info.name ?? "District details"})
                    </p>
                    <p className="text-xs text-[var(--nantucket-gray)]">
                      Minimum Lot Size: {districtMatch.info.minLotSize ?? "N/A"}
                    </p>
                    <p className="text-xs text-[var(--nantucket-gray)]">
                      Minimum Frontage: {districtMatch.info.frontage ?? "N/A"}
                    </p>
                    <p className="text-xs text-[var(--nantucket-gray)]">
                      Ground Cover Ratio: {districtMatch.info.maxGroundCover ?? "N/A"}
                    </p>
                    <p className="text-xs text-[var(--nantucket-gray)]">
                      Setbacks: {districtMatch.info.frontSetback ?? "N/A"} front, {districtMatch.info.sideSetback ?? "N/A"} side, {districtMatch.info.rearSetback ?? "N/A"} rear
                    </p>
                    {districtMatch.info.notes ? (
                      <p className="text-xs text-[var(--atlantic-navy)]">{districtMatch.info.notes}</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[var(--atlantic-navy)]">
                    No district rule profile found for zoning code {zoningLabel}. Contact Stephen for parcel-specific buildability guidance.
                  </p>
                )}
              </div>
            </div>

            <div
              className={cn(
                "mt-auto border-t bg-white p-4",
                "sticky bottom-0 md:static",
              )}
            >
              <div className="mb-3 rounded-lg border bg-white">
                <div className="border-b px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--nantucket-gray)]">
                    Zoning Uses ({selectedParcel?.zoning ?? "District"})
                  </p>
                </div>
                <div className="max-h-48 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[var(--sandstone)]">
                      <tr>
                        <th className="px-3 py-2 text-left text-[var(--nantucket-gray)]">Use</th>
                        <th className="px-3 py-2 text-left text-[var(--nantucket-gray)]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zoningUseRows.length ? (
                        zoningUseRows.map((row) => (
                          <tr key={row.useName} className="border-t">
                            <td className="px-3 py-2 text-[var(--atlantic-navy)]">{row.useName}</td>
                            <td className="px-3 py-2">
                              <span
                                className={cn(
                                  "inline-flex rounded px-2 py-0.5 font-medium",
                                  row.allowed
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-rose-100 text-rose-700",
                                )}
                                title={(zoningUseChart as { metadata: { legend: Record<string, string> } }).metadata.legend[row.value] ?? row.value}
                              >
                                {row.value}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-3 py-2 text-[var(--nantucket-gray)]" colSpan={2}>
                            No use-chart rows available for this district.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="border-t px-3 py-2 text-[10px] text-[var(--nantucket-gray)]">
                  Source: {(zoningUseChart as { metadata: { source: string } }).metadata.source}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button className="w-full bg-[var(--privet-green)] text-white hover:bg-[var(--brass-hover)]">
                  Get Custom Valuation from Stephen Maury
                </Button>
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" className="w-full">View Nearby Price Trends</Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
