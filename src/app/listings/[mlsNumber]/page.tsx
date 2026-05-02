import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { getListingDetailPayload } from "@/lib/get-listing-detail";
import { ListingHero } from "@/components/listings/ListingHero";
import { ListingValueScoreHero } from "@/components/listings/ListingValueScoreHero";
import { ListingAllowableUses } from "@/components/listings/ListingAllowableUses";
import { ListingPropertyFacts } from "@/components/listings/ListingPropertyFacts";
import { ListingBenchmarkDashboard } from "@/components/listings/ListingBenchmarkDashboard";
import { ListingCompsTable } from "@/components/listings/ListingCompsTable";
import { ListingExpertContext } from "@/components/listings/ListingExpertContext";
import { ListingDetailFooter } from "@/components/listings/ListingDetailFooter";
import { ListingPrintToolbar } from "@/components/listings/ListingPrintToolbar";
import { formatMoneyFull } from "@/lib/listing-detail-math";

const listingMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-listing-mono",
  display: "swap",
});

type Props = {
  params: Promise<{ mlsNumber: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mlsNumber } = await params;
  const data = await getListingDetailPayload(mlsNumber);
  if (!data) {
    return {
      title: "Listing | NantucketHouses.com",
      description: "Nantucket listing intelligence and benchmarks.",
    };
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
  const title = `${listing.addressLine} ${listing.neighborhood} – ${ppsfSeg} vs Nantucket & neighborhood comps (${monthYear})`;
  const description = `${price}. ${listing.neighborhood} $/SF vs island medians, comps, and Stephen Maury context — NantucketHouses.com.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://nantuckethouses.com/listings/${listing.linkId}`,
    },
  };
}

export default async function ListingDetailPage({ params }: Props) {
  const { mlsNumber } = await params;
  const data = await getListingDetailPayload(mlsNumber);
  if (!data) notFound();

  return (
    <div
      data-printable-listing
      className={`${listingMono.variable} listing-detail-root max-w-5xl mx-auto space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8 print:max-w-none print:space-y-4 print:pb-8 print:pt-4`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <nav className="text-xs text-[var(--nantucket-gray)]">
          <Link href="/" className="hover:text-[var(--privet-green)]">
            Home
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/map" className="hover:text-[var(--privet-green)]">
            Map
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--atlantic-navy)]">MLS Listing {data.listing.linkId}</span>
        </nav>
      </div>

      <div className="listing-print-hide sticky top-0 z-30 -mx-4 mb-1 flex flex-wrap items-center justify-between gap-2 border-b border-[#e8edf4] bg-white/95 px-4 py-2.5 backdrop-blur-sm supports-[backdrop-filter]:bg-white/80 sm:mx-0 sm:mb-0 sm:rounded-lg sm:border sm:shadow-sm print:hidden">
        <a
          href={data.linkMlsDetailUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-md bg-[var(--atlantic-navy)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#0a2d3f]"
        >
          View on LINK
        </a>
        <ListingPrintToolbar />
      </div>

      <ListingHero listing={data.listing} />

      {data.listingValueScore ? <ListingValueScoreHero score={data.listingValueScore} /> : null}

      <ListingPropertyFacts
        sections={data.propertyFactSections}
        derivedMetrics={data.derivedMetrics}
        assessorUrl={data.assessorSearchUrl}
      />

      <ListingAllowableUses block={data.listingAllowableUses} />

      <ListingBenchmarkDashboard payload={data} />

      <ListingCompsTable
        comps={data.comps}
        activePeerComps={data.activePeerComps}
        listing={data.listing}
      />

      <ListingExpertContext payload={data} />

      <ListingDetailFooter
        linkMlsDetailUrl={data.linkMlsDetailUrl}
        assessorSearchUrl={data.assessorSearchUrl}
      />
    </div>
  );
}
