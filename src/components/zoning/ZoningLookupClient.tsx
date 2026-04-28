"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { Download, MapPinned, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";
import { ParcelProperties, ZoningMap } from "@/components/zoning/ZoningMap";

type ParcelFeatureCollection = FeatureCollection<Geometry, ParcelProperties>;

function formatCurrency(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value?: number | null, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

export function ZoningLookupClient() {
  const [geojson, setGeojson] = useState<ParcelFeatureCollection | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<ParcelProperties | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleSearch = useCallback(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      setSearchStatus("Enter an address, MAP_PAR_ID, or owner to search.");
      return;
    }

    const match = features.find((feature) => {
      const properties = feature.properties ?? {};
      return [properties.location, properties.parcel_id, properties.owner_name, properties.alt_parcel_id]
        .filter(Boolean)
        .some((candidate) => String(candidate).toLowerCase().includes(query));
    });

    if (!match?.properties) {
      setSearchStatus("No parcel match found in this sample set yet.");
      return;
    }

    setSelectedParcel(match.properties);
    setSearchStatus(`Found: ${match.properties.location ?? match.properties.parcel_id ?? "Parcel"}`);
  }, [features, searchTerm]);

  const zoningLabel = selectedParcel?.zoning ?? "Unknown";
  const primaryUse = selectedParcel?.use ?? selectedParcel?.primary_use ?? "Unknown";

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
              <Input
                placeholder="Search by address, MAP_PAR_ID, or owner..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSearch();
                  }
                }}
                className="h-11 bg-white"
                aria-label="Search parcels"
              />
              <Button onClick={handleSearch} className="h-11 bg-[var(--privet-green)] px-5 text-white hover:bg-[var(--brass-hover)]">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="h-8 bg-white text-[var(--atlantic-navy)]">
                Last Updated: May 2025 • Town of Nantucket Assessors
              </Badge>
              <Button asChild variant="outline" className="h-8 bg-white">
                <a href="/api/tools/zoning-lookup/parcels?download=1">
                  <Download className="mr-1 h-4 w-4" />
                  Download Full Report
                </a>
              </Button>
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
                <h2 className="mt-1 text-2xl text-[var(--atlantic-navy)]">
                  {selectedParcel?.location ?? "Select a parcel on the map"}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">MAP_PAR_ID: {selectedParcel?.parcel_id ?? "N/A"}</Badge>
                  <Badge variant="outline">Alt Parcel: {selectedParcel?.alt_parcel_id ?? "N/A"}</Badge>
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
                    {formatNumber(selectedParcel?.acreage, 3)} acres ({formatNumber(selectedParcel?.lot_area_sqft, 0)} sqft)
                  </p>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <p className="text-xs text-[var(--nantucket-gray)]">Assessed Value</p>
                  <p className="mt-1 font-medium">{formatCurrency(selectedParcel?.assessed_total)}</p>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <p className="text-xs text-[var(--nantucket-gray)]">$/Acre</p>
                  <p className="mt-1 font-medium">{formatCurrency(selectedParcel?.assessed_price_per_acre)}</p>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <p className="text-xs text-[var(--nantucket-gray)]">Primary Use</p>
                  <p className="mt-1 font-medium">{String(primaryUse)}</p>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <p className="text-xs text-[var(--nantucket-gray)]">Owner</p>
                  <p className="mt-1 font-medium">{selectedParcel?.owner_name ?? "Unknown"}</p>
                </div>
                <div className="col-span-2 rounded-lg border bg-white p-3">
                  <p className="text-xs text-[var(--nantucket-gray)]">Utilities</p>
                  <p className="mt-1 font-medium">{selectedParcel?.utilities ?? "Not provided"}</p>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--cedar-shingle)]/25 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--nantucket-gray)]">Local Insight (Phase 1)</p>
                <p className="mt-2 text-sm text-[var(--atlantic-navy)]">
                  This {zoningLabel} zoning in the Town core is highly restrictive. Contact Stephen for buildable square footage guidance.
                </p>
              </div>
            </div>

            <div
              className={cn(
                "mt-auto border-t bg-white p-4",
                "sticky bottom-0 md:static",
              )}
            >
              <div className="flex flex-col gap-2">
                <Button className="w-full bg-[var(--privet-green)] text-white hover:bg-[var(--brass-hover)]">
                  Get Custom Valuation from Stephen Maury
                </Button>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Button variant="outline" className="w-full">Run Build Cost Estimate</Button>
                  <Button variant="outline" className="w-full">View Nearby Price Trends</Button>
                  <Button variant="outline" className="w-full">
                    <MapPinned className="mr-1 h-4 w-4" />
                    Export PDF Report
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
