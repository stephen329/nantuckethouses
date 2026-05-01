import type { Geometry } from "geojson";
import polylabel from "polylabel";

function ringAreaAbs(ring: number[][]): number {
  if (ring.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i]!;
    const [x2, y2] = ring[i + 1]!;
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum / 2);
}

/**
 * Best interior point for map pins / labels on tax parcels (lng/lat).
 *
 * Previously we averaged **boundary vertices**, which pulls pins toward dense corners
 * and can sit visibly off the lot interior vs the filled parcel polygon. Polylabel
 * (pole of inaccessibility) maximizes clearance from edges while staying **inside**
 * the polygon (including holes), so pins align with the parcel fill users see.
 */
export function centroidFromGeometry(geom: Geometry): { lng: number; lat: number } | null {
  /** ~1 m at Nantucket lat — tight enough for lots without excessive work. */
  const precision = 1e-5;

  if (geom.type === "Polygon") {
    const rings = geom.coordinates as number[][][];
    if (!rings?.length || !rings[0]?.length) return null;
    const pt = polylabel(rings, precision);
    return { lng: pt[0]!, lat: pt[1]! };
  }

  if (geom.type === "MultiPolygon") {
    let bestCoords: number[][][] | null = null;
    let bestA = 0;
    for (const poly of geom.coordinates) {
      const ring = poly[0];
      if (!ring?.length) continue;
      const a = ringAreaAbs(ring);
      if (a > bestA) {
        bestA = a;
        bestCoords = poly as number[][][];
      }
    }
    if (!bestCoords?.length) return null;
    const pt = polylabel(bestCoords, precision);
    return { lng: pt[0]!, lat: pt[1]! };
  }

  return null;
}
