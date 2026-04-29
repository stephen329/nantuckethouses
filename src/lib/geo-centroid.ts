import type { Geometry } from "geojson";

function ringCentroid(ring: number[][]): { lng: number; lat: number } | null {
  if (!ring?.length) return null;
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const p of ring) {
    if (p.length >= 2 && typeof p[0] === "number" && typeof p[1] === "number") {
      sx += p[0];
      sy += p[1];
      n++;
    }
  }
  return n > 0 ? { lng: sx / n, lat: sy / n } : null;
}

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

/** Simple centroid for parcel polygons (Mapbox GeoJSON). */
export function centroidFromGeometry(geom: Geometry): { lng: number; lat: number } | null {
  if (geom.type === "Polygon") {
    const ring = geom.coordinates[0];
    return ring ? ringCentroid(ring) : null;
  }
  if (geom.type === "MultiPolygon") {
    let best: { lng: number; lat: number } | null = null;
    let bestA = 0;
    for (const poly of geom.coordinates) {
      const ring = poly[0];
      if (!ring) continue;
      const c = ringCentroid(ring);
      const a = ringAreaAbs(ring);
      if (c && a > bestA) {
        bestA = a;
        best = c;
      }
    }
    return best;
  }
  return null;
}
