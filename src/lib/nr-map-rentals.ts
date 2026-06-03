import type { Feature, FeatureCollection, Point } from "geojson";

export type NrMapRentalResult = {
  nrPropertyId: number;
  slug: string;
  streetAddress: string;
  headline: string;
  latitude: number;
  longitude: number;
  thumbUrl: string | null;
  /** Best-effort peak weekly rent from rate rows, else nightly × 7. */
  weeklyRentEstimate: number | null;
  totalBedrooms: number | null;
  totalBathrooms: number | null;
  totalCapacity: number | null;
  hasPool: boolean;
  walkToBeach: boolean;
  averageNightlyRate: number | null;
  /** Keyword / copy heuristic when MLS-style flags are not on the list feed. */
  petFriendlyHint: boolean;
  waterfrontHint: boolean;
  /** Keyword match on headline / highlights for renovated / like-new copy. */
  renovatedHint: boolean;
  /** Keyword match for downtown / in-town positioning. */
  townWalkHint: boolean;
};

export type RentalPinProperties = {
  nrPropertyId: string;
  slug: string;
  streetAddress: string;
  headline: string;
  thumbUrl: string | null;
  /** Short weekly rent label for map pins at high zoom (empty when unknown). */
  priceLabel: string;
};

function rentalWeeklyDisplayLabel(r: NrMapRentalResult): string {
  const w = r.weeklyRentEstimate;
  if (w != null && w > 0 && Number.isFinite(w)) {
    if (w >= 10_000) {
      const k = w / 1000;
      return k % 1 < 0.05 ? `$${Math.round(k)}k/wk` : `$${k.toFixed(1)}k/wk`;
    }
    if (w >= 1000) return `$${Math.round(w / 1000)}k/wk`;
    return `$${Math.round(w)}/wk`;
  }
  const n = r.averageNightlyRate;
  if (n != null && n > 0 && Number.isFinite(n)) {
    const wk = n * 7;
    if (wk >= 10_000) {
      const k = wk / 1000;
      return k % 1 < 0.05 ? `$${Math.round(k)}k/wk` : `$${k.toFixed(1)}k/wk`;
    }
    if (wk >= 1000) return `$${Math.round(wk / 1000)}k/wk`;
    return `$${Math.round(wk)}/wk`;
  }
  return "";
}

export type RentalPinFeature = Feature<Point, RentalPinProperties>;

export function rentalsToGeoJson(results: NrMapRentalResult[]): FeatureCollection<Point, RentalPinProperties> {
  return {
    type: "FeatureCollection",
    features: results.map((r) => ({
      type: "Feature",
      id: `nr:${r.nrPropertyId}`,
      geometry: { type: "Point", coordinates: [r.longitude, r.latitude] },
      properties: {
        nrPropertyId: String(r.nrPropertyId),
        slug: r.slug,
        streetAddress: r.streetAddress,
        headline: r.headline,
        thumbUrl: r.thumbUrl,
        priceLabel: rentalWeeklyDisplayLabel(r),
      },
    })),
  };
}
