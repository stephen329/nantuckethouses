import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { getListingDetailPayload } from "@/lib/get-listing-detail";
import {
  displayTitleFromListings,
  listingsToPropertyHistoryRows,
  loadPropertyListingsForUrlSlug,
  propertySaleNeighborsChronological,
} from "@/lib/get-property-timeline";
import { getPropertyV3Payload } from "@/lib/property-v3-data";
import { propertyBasePath, propertyInstancePath } from "@/lib/property-routes";
import { ListingDetailBody } from "@/components/listings/ListingDetailBody";
import { PropertyV3View } from "@/components/property-v3/PropertyV3View";
import { formatMoneyFull } from "@/lib/listing-detail-math";

const SITE_ORIGIN = "https://nantuckethouses.com";

const listingMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-listing-mono",
  display: "swap",
});

type Props = { params: Promise<{ slug: string }> };

function v3ExpectedTail(data: Awaited<ReturnType<typeof getPropertyV3Payload>>): string {
  if (!data) return "";
  if (data.listingInstanceId != null) {
    return `${data.canonicalAddressSlug}-${data.listingInstanceId}`.toLowerCase();
  }
  return data.canonicalAddressSlug.toLowerCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const v3 = await getPropertyV3Payload(slug);
  if (v3) {
    const title = `${v3.parcel.location} | Nantucket property`;
    const description = `Assessor parcel ${v3.parcel.parcelId}. ${v3.mlsAreaPrimary ? `MLS area: ${v3.mlsAreaPrimary}. ` : ""}Market rankings, projections, and MLS history.`;
    return {
      title,
      description,
      alternates: { canonical: `${SITE_ORIGIN}${v3.canonicalPath}` },
      openGraph: {
        title,
        description,
        type: "article",
        url: `${SITE_ORIGIN}/property/${encodeURIComponent(slug)}`,
      },
    };
  }

  const ctx = await loadPropertyListingsForUrlSlug(slug);
  const { baseSlug, linkId, listings, streetKey, expectedBaseForInstance } = ctx;

  if (!listings.length) {
    return { title: "Property | NantucketHouses.com", description: "Nantucket MLS listing intelligence." };
  }

  if (linkId) {
    if (!expectedBaseForInstance || expectedBaseForInstance !== baseSlug) {
      return { title: "Property | NantucketHouses.com", description: "Nantucket MLS listing intelligence." };
    }
    const data = await getListingDetailPayload(linkId);
    if (!data) {
      return { title: "Property | NantucketHouses.com", description: "Nantucket MLS listing intelligence." };
    }
    const { listing } = data;
    const price =
      listing.status === "Sold" && listing.closePrice != null
        ? formatMoneyFull(listing.closePrice)
        : listing.listPrice != null
          ? formatMoneyFull(listing.listPrice)
          : "Price on request";
    const ppsf =
      listing.status === "Sold"
        ? listing.dollarPerSfClose ?? listing.dollarPerSfList
        : listing.dollarPerSfList;
    const ppsfSeg = ppsf != null ? `$${ppsf.toLocaleString()}/SF benchmark` : "$/SF benchmark";
    const monthYear = data.dataAsOfDateLabel.replace(/ \d{1,2},/, " ");
    const title = `${listing.addressLine} (${listing.linkId}) – ${ppsfSeg} (${monthYear})`;
    const description = `${price}. Archived MLS instance — full sales history on the main address page.`;
    const canonical = `${SITE_ORIGIN}${propertyBasePath(baseSlug)}`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        type: "article",
        url: `${SITE_ORIGIN}${propertyInstancePath(baseSlug, linkId)}`,
      },
    };
  }

  const titleBase = displayTitleFromListings(listings, streetKey);
  const title = `${titleBase} · Sales & Listing History | NantucketHouses.com`;
  const description = `MLS sales and listing timeline for ${titleBase} — prices, status, and intelligence on NantucketHouses.com.`;
  const path = propertyBasePath(baseSlug);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${SITE_ORIGIN}${path}`,
    },
  };
}

function PropertyV3JsonLd({ data }: { data: NonNullable<Awaited<ReturnType<typeof getPropertyV3Payload>>> }) {
  const sameAs = [data.assessorDatabaseUrl];
  if (data.currentActive) sameAs.push(data.currentActive.linkMlsUrl);
  const json = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: data.parcel.location,
    address: {
      "@type": "PostalAddress",
      streetAddress: data.parcel.location,
      addressLocality: "Nantucket",
      addressRegion: "MA",
      addressCountry: "US",
    },
    ...(data.parcel.lat != null && data.parcel.lng != null
      ? { geo: { "@type": "GeoCoordinates", latitude: data.parcel.lat, longitude: data.parcel.lng } }
      : {}),
    ...(data.currentActive && data.currentActive.listPrice
      ? {
          offers: {
            "@type": "Offer",
            price: data.currentActive.listPrice,
            priceCurrency: "USD",
            url: data.currentActive.linkMlsUrl,
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
    sameAs,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

export default async function PropertySlugPage({ params }: Props) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug).trim().toLowerCase();

  const v3 = await getPropertyV3Payload(slug);
  if (v3) {
    if (decoded !== v3ExpectedTail(v3)) {
      const target =
        v3.listingInstanceId != null
          ? propertyInstancePath(v3.canonicalAddressSlug, v3.listingInstanceId)
          : v3.canonicalPath;
      permanentRedirect(target);
    }
    return (
      <>
        <PropertyV3JsonLd data={v3} />
        <PropertyV3View data={v3} />
      </>
    );
  }

  const { baseSlug, linkId, listings, streetKey, expectedBaseForInstance } =
    await loadPropertyListingsForUrlSlug(slug);

  if (!listings.length) notFound();

  if (linkId) {
    if (!expectedBaseForInstance || expectedBaseForInstance !== baseSlug) notFound();
    const data = await getListingDetailPayload(linkId);
    if (!data) notFound();

    const historyHref = propertyBasePath(baseSlug);
    const { prevLinkId, nextLinkId } = propertySaleNeighborsChronological(listings, linkId);

    return (
      <div
        className={`${listingMono.variable} listing-detail-root max-w-5xl mx-auto space-y-6 px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8 print:max-w-none print:space-y-4 print:pb-8 print:pt-4`}
      >
        <div className="flex flex-col gap-3 rounded-lg border border-[#dbe4f0] bg-[#f4f7fb] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-sm text-[var(--atlantic-navy)]">
            <History className="mt-0.5 h-4 w-4 shrink-0 text-[var(--privet-green)]" aria-hidden />
            <span>
              You are viewing a specific MLS instance.{" "}
              <Link href={historyHref} className="font-semibold text-[var(--privet-green)] underline-offset-2 hover:underline">
                View full property history
              </Link>{" "}
              for every sale and listing at this address.
            </span>
          </div>
          <Link
            href={historyHref}
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-[var(--atlantic-navy)] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0a2d3f]"
          >
            View full property history
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex flex-wrap gap-2">
            {prevLinkId ? (
              <Link
                href={propertyInstancePath(baseSlug, prevLinkId)}
                className="inline-flex items-center gap-1 rounded-md border border-[#dbe4f0] bg-white px-3 py-1.5 text-sm font-medium text-[var(--atlantic-navy)] hover:border-[var(--privet-green)] hover:text-[var(--privet-green)]"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Previous Sale
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-[#e0e6ef] px-3 py-1.5 text-sm text-[var(--nantucket-gray)]">
                <ChevronLeft className="h-4 w-4 opacity-50" aria-hidden />
                Previous Sale
              </span>
            )}
            {nextLinkId ? (
              <Link
                href={propertyInstancePath(baseSlug, nextLinkId)}
                className="inline-flex items-center gap-1 rounded-md border border-[#dbe4f0] bg-white px-3 py-1.5 text-sm font-medium text-[var(--atlantic-navy)] hover:border-[var(--privet-green)] hover:text-[var(--privet-green)]"
              >
                Next Sale
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-[#e0e6ef] px-3 py-1.5 text-sm text-[var(--nantucket-gray)]">
                Next Sale
                <ChevronRight className="h-4 w-4 opacity-50" aria-hidden />
              </span>
            )}
          </div>
        </div>

        <ListingDetailBody
          data={data}
          className="space-y-8"
          breadcrumbTail={<>MLS listing {data.listing.linkId}</>}
        />
      </div>
    );
  }

  const title = displayTitleFromListings(listings, streetKey);
  const rows = listingsToPropertyHistoryRows(listings);
  const activeRow = rows.find((r) => r.status === "Active");
  const activePayload = activeRow ? await getListingDetailPayload(activeRow.linkId) : null;

  return (
    <div
      className={`${listingMono.variable} min-h-svh bg-[var(--sandstone)] pb-16 pt-6 sm:pt-8 print:bg-white`}
    >
      <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6 lg:px-8">
        <nav className="text-xs text-[var(--nantucket-gray)] print:hidden">
          <Link href="/" className="hover:text-[var(--privet-green)]">
            Home
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/map" className="hover:text-[var(--privet-green)]">
            Map
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--atlantic-navy)]">{title}</span>
        </nav>

        <header className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-[#0a1628] p-5 text-white shadow-[var(--elevation-1)] sm:p-6 print:border print:bg-white print:text-[var(--atlantic-navy)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60 print:text-[var(--nantucket-gray)]">
            Property address
          </p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-white/85 print:text-[var(--nantucket-gray)]">
            Sales & Listing History — every MLS instance at this location with links to archived listing detail.
          </p>
        </header>

        {activePayload ? (
          <section className="space-y-3 print:space-y-2">
            <h2 className="text-lg font-semibold text-[var(--atlantic-navy)] print:text-base">Current listing</h2>
            <div className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-white p-4 shadow-sm sm:p-6 print:border-0 print:shadow-none">
              <ListingDetailBody
                data={activePayload}
                className="listing-detail-root space-y-8 print:space-y-4"
                breadcrumbTail={<>Active MLS {activePayload.listing.linkId}</>}
              />
            </div>
          </section>
        ) : null}

        <section className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-white px-4 py-5 shadow-sm sm:px-6 sm:py-6 print:border print:shadow-none">
          <h2 className="text-lg font-semibold text-[var(--atlantic-navy)]">Sales & Listing History</h2>
          <p className="mt-2 text-sm text-[var(--nantucket-gray)]">
            Date reflects close for sold listings and list date context for active / under agreement rows. MLS ID is
            the numeric LINK listing key for that instance.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#e8edf4] text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--nantucket-gray)]">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Price</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">MLS ID</th>
                  <th className="py-2">Detail</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.linkId} className="border-b border-[#f0f3f7] last:border-0">
                    <td className="py-2.5 pr-3 font-listing-mono tabular-nums text-[var(--atlantic-navy)]">
                      {r.primaryDate ?? "—"}
                    </td>
                    <td className="py-2.5 pr-3 font-listing-mono font-semibold tabular-nums text-[var(--atlantic-navy)]">
                      {r.priceDisplay}
                    </td>
                    <td className="py-2.5 pr-3 text-[var(--atlantic-navy)]">{r.status}</td>
                    <td className="py-2.5 pr-3 font-listing-mono tabular-nums text-[var(--nantucket-gray)]">{r.linkId}</td>
                    <td className="py-2.5">
                      <Link
                        href={propertyInstancePath(baseSlug, r.linkId)}
                        className="font-medium text-[var(--privet-green)] underline-offset-2 hover:underline"
                      >
                        Open instance
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
