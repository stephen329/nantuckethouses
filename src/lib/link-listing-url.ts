/** Public LINK (Nantucket MLS) listing detail URL by numeric listing id. */
export function nantucketLinkListingUrl(listingId: string): string {
  const id = listingId.trim();
  return `https://nantucket.mylinkmls.com/PropertyListing.aspx?listingId=${encodeURIComponent(id)}`;
}
