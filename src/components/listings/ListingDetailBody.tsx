import type { ReactNode } from "react";
import Link from "next/link";
import type { ListingDetailPayload } from "@/lib/get-listing-detail";
import { ListingHero } from "@/components/listings/ListingHero";
import { ListingValueScoreHero } from "@/components/listings/ListingValueScoreHero";
import { ListingAllowableUses } from "@/components/listings/ListingAllowableUses";
import { ListingPropertyFacts } from "@/components/listings/ListingPropertyFacts";
import { ListingBenchmarkDashboard } from "@/components/listings/ListingBenchmarkDashboard";
import { ListingCompsTable } from "@/components/listings/ListingCompsTable";
import { ListingExpertContext } from "@/components/listings/ListingExpertContext";
import { ListingDetailFooter } from "@/components/listings/ListingDetailFooter";
import { ListingPrintToolbar } from "@/components/listings/ListingPrintToolbar";

type Props = {
  data: ListingDetailPayload;
  className?: string;
  /** When set, replaces the default “MLS Listing {id}” breadcrumb tail. */
  breadcrumbTail?: ReactNode;
};

export function ListingDetailBody({ data, className, breadcrumbTail }: Props) {
  return (
    <div data-printable-listing className={className}>
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
          <span className="text-[var(--atlantic-navy)]">
            {breadcrumbTail ?? `MLS Listing ${data.listing.linkId}`}
          </span>
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
        compSet={data.compSet}
      />

      <ListingExpertContext payload={data} />

      <ListingDetailFooter
        linkMlsDetailUrl={data.linkMlsDetailUrl}
        assessorSearchUrl={data.assessorSearchUrl}
      />
    </div>
  );
}
