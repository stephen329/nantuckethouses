/**
 * Flatten Next.js App Router `searchParams` (page props) to a query string for map URL sync.
 * Matches `useSearchParams().toString()` when the same keys are present.
 */
export function searchParamsRecordToQueryString(
  sp: Record<string, string | string[] | undefined>,
): string {
  const u = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v != null && v !== "") u.append(key, v);
      }
    } else if (value !== "") {
      u.set(key, value);
    }
  }
  return u.toString();
}

/** Default view when no `zoom` / `lat` / `lng` query params are present. */
export const DEFAULT_MAP_CENTER: [number, number] = [-70.1, 41.28];
export const DEFAULT_MAP_ZOOM = 13.5;

const ZOOM_MIN = 10;
const ZOOM_MAX = 18;

/** Loose Nantucket-ish bounds so bad query strings are ignored. */
const LAT_MIN = 40.85;
const LAT_MAX = 41.55;
const LNG_MIN = -70.45;
const LNG_MAX = -69.95;

/**
 * Parse shareable map view from URL. Expects all three: `zoom`, `lat`, `lng`
 * (Mapbox order: lng, lat for center).
 */
export function parseMapViewFromSearchParams(params: URLSearchParams): {
  center: [number, number];
  zoom: number;
} | null {
  const zoomRaw = params.get("zoom");
  const latRaw = params.get("lat");
  const lngRaw = params.get("lng");
  if (zoomRaw === null || latRaw === null || lngRaw === null) return null;

  const zoom = Number(zoomRaw);
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (![zoom, lat, lng].every(Number.isFinite)) return null;
  if (zoom < ZOOM_MIN || zoom > ZOOM_MAX) return null;
  if (lat < LAT_MIN || lat > LAT_MAX) return null;
  if (lng < LNG_MIN || lng > LNG_MAX) return null;

  return { center: [lng, lat], zoom };
}

export function applyMapViewToSearchParams(
  base: URLSearchParams,
  center: { lng: number; lat: number },
  zoom: number,
): URLSearchParams {
  const next = new URLSearchParams(base.toString());
  next.set("zoom", zoom.toFixed(2));
  next.set("lat", center.lat.toFixed(5));
  next.set("lng", center.lng.toFixed(5));
  return next;
}

export function mapViewCloseEnough(
  a: { center: [number, number]; zoom: number },
  b: { center: [number, number]; zoom: number },
): boolean {
  const [lngA, latA] = a.center;
  const [lngB, latB] = b.center;
  return (
    Math.abs(latA - latB) < 1e-5 &&
    Math.abs(lngA - lngB) < 1e-5 &&
    Math.abs(a.zoom - b.zoom) < 0.01
  );
}
