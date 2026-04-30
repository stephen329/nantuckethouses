/** Public Nantucket Rentals listing URL by site slug (same path as nr-web-fe `/${slug}`). */
export function nantucketVacationRentalListingUrl(slug: string): string {
  const s = slug.trim().replace(/^\/+/, "");
  const origin = (process.env.NEXT_PUBLIC_NR_RENTALS_WEB_ORIGIN ?? "https://www.nantucketrentals.com").replace(/\/$/, "");
  return `${origin}/${encodeURIComponent(s)}`;
}
