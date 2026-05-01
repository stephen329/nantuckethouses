function nantucketRentalsWebOrigin(): string {
  return (process.env.NEXT_PUBLIC_NR_RENTALS_WEB_ORIGIN ?? "https://www.nantucketrentals.com").replace(/\/$/, "");
}

/** Public Nantucket Rentals listing URL by site slug (same path as nr-web-fe `/${slug}`). */
export function nantucketVacationRentalListingUrl(slug: string): string {
  const s = slug.trim().replace(/^\/+/, "");
  return `${nantucketRentalsWebOrigin()}/${encodeURIComponent(s)}`;
}

/**
 * NR marketing site property search (`nr-web-fe` `/property-search`).
 * `bedrooms` in the URL becomes `bedroom_min` on the listings API (see `getListingSearchQueriesFromURL`).
 */
export function nantucketRentalsPropertySearchUrl(params: { minBedrooms?: number | null }): string {
  const origin = nantucketRentalsWebOrigin();
  const sp = new URLSearchParams();
  if (params.minBedrooms != null && params.minBedrooms >= 1) {
    sp.set("bedrooms", String(Math.floor(params.minBedrooms)));
  }
  const q = sp.toString();
  return `${origin}/property-search${q ? `?${q}` : ""}`;
}

/**
 * Comparable vacation rental search: `bedrooms` = listing bedroom count + 1 (minimum 1).
 * Omits `bedrooms` when the listing count is unknown.
 */
export function nantucketRentalsComparableSearchUrlFromListingBedrooms(
  baseBedrooms: number | null | undefined,
): string {
  const b = baseBedrooms != null && Number.isFinite(Number(baseBedrooms)) ? Math.floor(Number(baseBedrooms)) : null;
  const minBedrooms = b != null ? Math.max(1, b + 1) : null;
  return nantucketRentalsPropertySearchUrl({ minBedrooms });
}
