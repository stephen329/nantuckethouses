import type { Feature, FeatureCollection, Point } from "geojson";

export type NrMapRentalResult = {
  nrPropertyId: number;
  slug: string;
  streetAddress: string;
  headline: string;
  latitude: number;
  longitude: number;
  thumbUrl: string | null;
};

export type RentalPinProperties = {
  nrPropertyId: string;
  slug: string;
  streetAddress: string;
  headline: string;
  thumbUrl: string | null;
};

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
      },
    })),
  };
}
