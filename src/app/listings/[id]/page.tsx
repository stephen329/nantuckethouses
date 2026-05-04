import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { getListingDetailPayload } from "@/lib/get-listing-detail";
import { listingDetailPath } from "@/lib/property-routes";
import { ListingDetailBody } from "@/components/listings/ListingDetailBody";
import { formatMoneyFull } from "@/lib/listing-detail-math";

const listingMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-listing-mono",
  display: "swap",
});

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getListingDetailPayload(id);
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
  const path = listingDetailPath(listing.linkId, listing.addressLine);
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

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getListingDetailPayload(id);
  if (!data) notFound();

  return (
    <div
      className={`${listingMono.variable} listing-detail-root max-w-5xl mx-auto space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8 print:max-w-none print:space-y-4 print:pb-8 print:pt-4`}
    >
      <ListingDetailBody data={data} className="space-y-8 print:space-y-4" />
    </div>
  );
}
