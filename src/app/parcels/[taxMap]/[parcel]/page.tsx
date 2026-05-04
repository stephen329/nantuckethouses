import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { MapPin, Ruler, DollarSign, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getParcelByMapAndParcel,
  getDistrictRule,
  getParcelDataLastUpdatedLabel,
} from "@/lib/parcel-data";
import { listingDetailPath, zoningLookupToolPath } from "@/lib/property-routes";
import recentSoldParcels from "@/data/recent-sold-parcels.json";

const listingMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-listing-mono",
  display: "swap",
});

type Params = { taxMap: string; parcel: string };

function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { taxMap, parcel } = await params;
  const record = await getParcelByMapAndParcel(taxMap, parcel);
  if (!record) {
    return { title: "Parcel | NantucketHouses.com", description: "Parcel profile and assessor context." };
  }
  const title = `${record.address} · Parcel ${record.taxMap}-${record.parcel} | NantucketHouses.com`;
  const description = `${record.subtitle}. Zoning, lot size, and assessed value — NantucketHouses.com.`;
  const path = `/parcels/${encodeURIComponent(record.taxMap)}/${encodeURIComponent(record.parcel)}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://nantuckethouses.com${path}`,
    },
  };
}

export default async function ParcelProfilePage({ params }: { params: Promise<Params> }) {
  const { taxMap, parcel } = await params;
  const record = await getParcelByMapAndParcel(taxMap, parcel);
  if (!record) notFound();

  const districtRule = getDistrictRule(record.zoningCode);
  const lastUpdated = await getParcelDataLastUpdatedLabel();
  const zoningHref = zoningLookupToolPath(record.taxMap, record.parcel);

  const linkFeed = recentSoldParcels as { linkListingByParcelId?: Record<string, string> };
  const linkListingId = record.parcelId
    ? linkFeed.linkListingByParcelId?.[record.parcelId] ?? null
    : null;

  return (
    <div
      className={`${listingMono.variable} parcel-detail-root min-h-svh bg-[var(--sandstone)] pb-16 pt-6 sm:pt-8`}
    >
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
        <nav className="text-xs text-[var(--nantucket-gray)]">
          <Link href="/" className="hover:text-[var(--privet-green)]">
            Home
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/map" className="hover:text-[var(--privet-green)]">
            Map
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--atlantic-navy)]">
            Parcel {record.taxMap}-{record.parcel}
          </span>
        </nav>

        <header className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-[#0a1628] p-5 text-white shadow-[var(--elevation-1)] sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">Assessor parcel</p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">{record.address}</h1>
          <p className="mt-2 text-sm text-white/85">{record.subtitle}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded bg-white/15 px-2 py-1 backdrop-blur-sm">Map {record.taxMap}</span>
            <span className="rounded bg-white/15 px-2 py-1 backdrop-blur-sm">Parcel {record.parcel}</span>
            {districtRule ? (
              <span className="rounded bg-white/15 px-2 py-1 backdrop-blur-sm">
                {districtRule.code} · {districtRule.name}
              </span>
            ) : null}
          </div>
        </header>

        <section className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
          <h2 className="sr-only">Parcel vitals</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--nantucket-gray)]">
                Zoning
              </dt>
              <dd className="mt-0.5 font-listing-mono text-base font-bold tabular-nums text-[var(--atlantic-navy)] sm:text-lg">
                {record.zoningCode || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--nantucket-gray)]">
                Lot size
              </dt>
              <dd className="mt-0.5 font-listing-mono text-base font-bold tabular-nums text-[var(--atlantic-navy)] sm:text-lg">
                {record.lotSizeAcres != null ? `${record.lotSizeAcres.toFixed(2)} ac` : "—"}
                {record.lotSizeSqft != null ? (
                  <span className="mt-0.5 block text-xs font-semibold normal-case text-[var(--nantucket-gray)]">
                    {formatNumber(record.lotSizeSqft)} sq ft
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--nantucket-gray)]">
                Assessed value
              </dt>
              <dd className="mt-0.5 font-listing-mono text-base font-bold tabular-nums text-[var(--atlantic-navy)] sm:text-lg">
                {formatCurrency(record.assessedValue)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--nantucket-gray)]">
                Primary use
              </dt>
              <dd className="mt-0.5 text-base font-semibold text-[var(--atlantic-navy)] sm:text-lg">
                {record.primaryUse || "—"}
              </dd>
            </div>
          </dl>
          <p className="mt-4 border-t border-[#eef1f5] pt-3 text-[11px] text-[var(--nantucket-gray)]">
            Assessor snapshot · Last updated {lastUpdated}. Confirm taxes and exemptions with the town before
            underwriting.
          </p>
        </section>

        <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild className="bg-[var(--atlantic-navy)] text-white hover:bg-[#0a2d3f]">
            <Link href={zoningHref}>Full zoning worksheet</Link>
          </Button>
          {linkListingId ? (
            <Button asChild variant="outline" className="border-[var(--atlantic-navy)] text-[var(--atlantic-navy)]">
              <Link href={listingDetailPath(linkListingId)}>MLS listing intelligence</Link>
            </Button>
          ) : null}
          <Button asChild variant="secondary">
            <Link href="/map">Property map</Link>
          </Button>
        </section>

        <section className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--atlantic-navy)]">On this parcel</h2>
          <p className="mt-2 text-sm text-[var(--nantucket-gray)]">
            This URL is the site-wide parcel profile for lots that may or may not have an active MLS listing. When a
            home is on the market, use MLS listing intelligence for benchmarks, comps, and narrative; use the zoning
            worksheet for district rules, setbacks, and allowable uses.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--atlantic-navy)]">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--privet-green)]" aria-hidden />
              <span>{record.address}</span>
            </li>
            <li className="flex items-start gap-2">
              <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-[var(--privet-green)]" aria-hidden />
              <span>
                {record.lotSizeAcres != null ? `${record.lotSizeAcres.toFixed(2)} acres` : "—"} (
                {formatNumber(record.lotSizeSqft)} sq ft)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-[var(--privet-green)]" aria-hidden />
              <span>{formatCurrency(record.assessedValue)} assessed</span>
            </li>
            <li className="flex items-start gap-2">
              <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-[var(--privet-green)]" aria-hidden />
              <span>{record.zoningCode || "—"}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
