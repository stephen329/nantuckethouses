import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Ruler, DollarSign, Landmark } from "lucide-react";
import type { FeatureCollection, Geometry } from "geojson";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ZoningMap, type ParcelProperties } from "@/components/zoning/ZoningMap";
import { SaveParcelButton } from "@/components/zoning/SaveParcelButton";
import {
  getComparableParcels,
  getDistrictRule,
  getParcelByMapAndParcel,
  getParcelDataLastUpdatedLabel,
} from "@/lib/parcel-data";
import recentSoldParcels from "@/data/recent-sold-parcels.json";
import { nantucketLinkListingUrl } from "@/lib/link-listing-url";
import { parcelDetailPath } from "@/lib/property-routes";

type Params = {
  taxMap: string;
  parcel: string;
};

function formatCurrency(value: number | null): string {
  if (value === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number | null): string {
  if (value === null) return "N/A";
  return new Intl.NumberFormat("en-US").format(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { taxMap, parcel } = await params;
  const record = await getParcelByMapAndParcel(taxMap, parcel);
  if (!record) return { title: "Parcel Not Found | Nantucket Zoning Lookup" };

  return {
    title: `${record.address} | Nantucket Parcel Intelligence`,
    description: `${record.address} zoning, lot size, assessed value, regulatory profile, and development potential insights.`,
  };
}

export default async function ParcelDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { taxMap, parcel } = await params;
  const record = await getParcelByMapAndParcel(taxMap, parcel);
  if (!record) notFound();

  const districtRule = getDistrictRule(record.zoningCode);
  const comparables = (await getComparableParcels(record.zoningCode, 6)).filter(
    (item) => item.parcelId !== record.parcelId,
  );
  const lastUpdated = await getParcelDataLastUpdatedLabel();

  const mapData: FeatureCollection<Geometry, ParcelProperties> = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: record.geometry,
        properties: {
          parcel_id: record.parcelId,
          tax_map: record.taxMap,
          parcel: record.parcel,
          location: record.address,
          zoning: record.zoningCode,
          zoning_color: record.zoningColor,
          acreage: record.lotSizeAcres,
          lot_area_sqft: record.lotSizeSqft,
          assessed_total: record.assessedValue,
          assessed_price_per_acre: record.assessedPerAcre,
          use: record.primaryUse,
          owner_name: record.owner,
        },
      },
    ],
  };

  const parcelKey = `${record.taxMap}-${record.parcel}`;

  const linkListingFeed = recentSoldParcels as { linkListingByParcelId?: Record<string, string> };
  const linkListingId = record.parcelId ? linkListingFeed.linkListingByParcelId?.[record.parcelId] ?? null : null;

  return (
    <div className="bg-[var(--sandstone)]">
      <section className="relative overflow-hidden">
        <div
          className="h-[340px] w-full bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(7,64,89,0.35), rgba(7,64,89,0.65)), url('/images/banners/large.png')",
          }}
        />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-semibold tracking-tight text-white">{record.address}</h1>
            <p className="mt-2 text-lg text-white/90">{record.subtitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">Tax Map: {record.taxMap}</Badge>
              <Badge variant="secondary">Parcel: {record.parcel}</Badge>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-3 px-4 py-5 lg:grid-cols-4 lg:px-8">
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <p className="text-xs text-[var(--nantucket-gray)]">Zoning</p>
          <p className="mt-1 flex items-center gap-2 font-medium">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: record.zoningColor }} />
            {record.zoningCode || "N/A"}
          </p>
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <p className="text-xs text-[var(--nantucket-gray)]">Lot Size</p>
          <p className="mt-1 font-medium">
            {record.lotSizeAcres?.toFixed(2) ?? "N/A"} acres ({formatNumber(record.lotSizeSqft)} sq ft)
          </p>
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <p className="text-xs text-[var(--nantucket-gray)]">Assessed Value</p>
          <p className="mt-1 font-medium">{formatCurrency(record.assessedValue)}</p>
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <p className="text-xs text-[var(--nantucket-gray)]">Tax Map/Parcel</p>
          <p className="mt-1 font-medium">
            {record.taxMap || "N/A"} / {record.parcel || "N/A"}
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 pb-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:px-8">
        <div className="space-y-4">
          <div className="rounded-xl bg-white p-5">
            <h2 className="text-2xl text-[var(--atlantic-navy)]">
              {districtRule ? `${districtRule.code} (${districtRule.name})` : `${record.zoningCode} District`}
            </h2>
            {districtRule?.notes ? (
              <p className="mt-2 text-sm text-[var(--nantucket-gray)]">{districtRule.notes}</p>
            ) : null}
            <div className="mt-4 overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-[var(--sandstone)] text-left">
                  <tr>
                    <th className="px-3 py-2">Regulation</th>
                    <th className="px-3 py-2">Requirement</th>
                    <th className="px-3 py-2">Status for this Parcel</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-3 py-2" title="Minimum lot area required for zoning compliance.">Minimum Lot Size</td>
                    <td className="px-3 py-2">{districtRule?.minLotSize ?? "N/A"}</td>
                    <td className="px-3 py-2">Review with survey + zoning worksheet</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-3 py-2" title="Required minimum lot width along street frontage.">Minimum Frontage</td>
                    <td className="px-3 py-2">{districtRule?.frontage ?? "N/A"}</td>
                    <td className="px-3 py-2">Confirm frontage at legal lot line</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-3 py-2" title="Maximum percentage of lot that can be covered by structures.">Ground Cover Ratio</td>
                    <td className="px-3 py-2">{districtRule?.maxGroundCover ?? "N/A"}</td>
                    <td className="px-3 py-2">Potential depends on existing footprint</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-3 py-2" title="Distance structures must be set back from lot boundaries.">Setbacks</td>
                    <td className="px-3 py-2">
                      {districtRule?.frontSetback ?? "N/A"} front, {districtRule?.sideSetback ?? "N/A"} side, {districtRule?.rearSetback ?? "N/A"} rear
                    </td>
                    <td className="px-3 py-2">Existing nonconformities may affect options</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-3 py-2">HDC Review</td>
                    <td className="px-3 py-2">{districtRule?.hdcScrutiny ?? "N/A"}</td>
                    <td className="px-3 py-2">Any exterior change likely requires approval</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-[var(--nantucket-gray)]">Last Updated: {lastUpdated}</p>
          </div>

          <div className="rounded-xl bg-white p-5">
            <h3 className="text-lg text-[var(--atlantic-navy)]">Development Potential</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--nantucket-gray)]">
              <li>Assess allowable expansion by combining ground cover limits with existing building footprint.</li>
              <li>Model renovation vs. replacement pathways based on setbacks and HDC scrutiny level.</li>
              <li>Confirm nonconforming status and special permit triggers before design work begins.</li>
            </ul>
          </div>

          <div className="rounded-xl bg-white p-5">
            <h3 className="text-lg text-[var(--atlantic-navy)]">Market Context</h3>
            <div className="mt-3 space-y-2 text-sm">
              {comparables.length ? (
                comparables.map((comp) => (
                  <div key={`${comp.taxMap}-${comp.parcel}`} className="flex items-center justify-between rounded-md border p-2">
                    <span>{comp.address}</span>
                    <span className="font-medium">{formatCurrency(comp.assessedValue)}</span>
                  </div>
                ))
              ) : (
                <p className="text-[var(--nantucket-gray)]">Comparable parcels for this zone will appear here.</p>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-xl bg-white p-3">
              <p className="mb-2 text-sm font-medium text-[var(--atlantic-navy)]">Interactive Parcel Map</p>
              <ZoningMap
                geojson={mapData}
                selectedParcelId={record.parcelId}
                className="h-[260px] w-full rounded-xl"
                onParcelSelect={() => {
                  // one parcel context; no-op
                }}
              />
            </div>

            <div className="rounded-xl bg-white p-4">
              <p className="mb-2 text-sm font-medium text-[var(--atlantic-navy)]">Quick Actions</p>
              <div className="space-y-2">
                <SaveParcelButton parcelKey={parcelKey} />
                <Button asChild variant="outline" className="w-full">
                  <Link href={parcelDetailPath(record.taxMap, record.parcel)}>Parcel profile (shareable)</Link>
                </Button>
                {linkListingId ? (
                  <Button asChild variant="outline" className="w-full">
                    <a href={nantucketLinkListingUrl(linkListingId)} target="_blank" rel="noopener noreferrer">
                      View LINK listing
                    </a>
                  </Button>
                ) : null}
                <Button asChild className="w-full bg-[var(--privet-green)] text-white hover:bg-[var(--brass-hover)]">
                  <Link href="/buy">Contact Stephen for Confidential Analysis</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/map">Back to Property Map</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-xl bg-white p-4 text-sm text-[var(--nantucket-gray)]">
              <p className="mb-2 font-medium text-[var(--atlantic-navy)]">Key Facts</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {record.address}</p>
              <p className="mt-1 flex items-center gap-2"><Ruler className="h-4 w-4" /> {record.lotSizeAcres?.toFixed(2) ?? "N/A"} acres</p>
              <p className="mt-1 flex items-center gap-2"><DollarSign className="h-4 w-4" /> {formatCurrency(record.assessedValue)}</p>
              <p className="mt-1 flex items-center gap-2"><Landmark className="h-4 w-4" /> {record.zoningCode || "N/A"}</p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
