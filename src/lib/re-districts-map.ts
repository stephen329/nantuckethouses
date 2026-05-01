import type { Feature, FeatureCollection, Geometry, LineString, MultiPolygon, Point, Polygon } from "geojson";

/**
 * Mapbox `line` layers only render LineString / MultiLineString — not Polygon rings.
 * Convert each polygon exterior to a LineString so boundaries actually draw.
 */
export function reDistrictPolygonsToBoundaryLines<P extends Record<string, unknown>>(
  fc: FeatureCollection<Geometry, P>,
): FeatureCollection<LineString, P> {
  const features: Feature<LineString, P>[] = [];
  for (const f of fc.features) {
    const props = (f.properties ?? {}) as P;
    const g = f.geometry;
    if (!g) continue;
    if (g.type === "Polygon") {
      const ring = g.coordinates[0];
      if (ring && ring.length >= 2) {
        features.push({
          type: "Feature",
          properties: props,
          geometry: { type: "LineString", coordinates: ring },
        });
      }
    } else if (g.type === "MultiPolygon") {
      for (const poly of g.coordinates) {
        const ring = poly[0];
        if (ring && ring.length >= 2) {
          features.push({
            type: "Feature",
            properties: props,
            geometry: { type: "LineString", coordinates: ring },
          });
        }
      }
    }
  }
  return { type: "FeatureCollection", features };
}

/** Shoelace centroid of one ring (lng/lat); falls back to vertex average for degenerate rings. */
function centroidOfRingLngLat(ring: number[][]): [number, number] {
  const n = ring.length;
  if (n < 3) return [(ring[0]?.[0] ?? 0) as number, (ring[0]?.[1] ?? 0) as number];
  let twice = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const p = ring[i]!;
    const q = ring[j]!;
    const cr = q[0] * p[1] - p[0] * q[1];
    twice += cr;
    cx += (p[0] + q[0]) * cr;
    cy += (p[1] + q[1]) * cr;
  }
  if (Math.abs(twice) < 1e-18) {
    let sx = 0;
    let sy = 0;
    let c = 0;
    for (const pt of ring) {
      if (pt.length >= 2) {
        sx += pt[0];
        sy += pt[1];
        c += 1;
      }
    }
    return c ? [sx / c, sy / c] : [0, 0];
  }
  const a = twice / 2;
  return [cx / (6 * a), cy / (6 * a)];
}

function ringBBoxAreaLngLat(ring: number[][]): number {
  const b = ringBounds(ring);
  if (!b) return 0;
  return (b[2] - b[0]) * (b[3] - b[1]);
}

/**
 * One Point feature per district (polygon centroid) for symbol labels.
 * MultiPolygon: uses the exterior ring of the largest bbox sub-polygon.
 */
export function reDistrictPolygonsToLabelPoints<P extends Record<string, unknown>>(
  fc: FeatureCollection<Geometry, P>,
): FeatureCollection<Point, P> {
  const features: Feature<Point, P>[] = [];
  for (const f of fc.features) {
    const props = (f.properties ?? {}) as P;
    const g = f.geometry;
    if (!g) continue;
    if (g.type === "Polygon") {
      const ring = g.coordinates[0];
      if (ring?.length) {
        const c = centroidOfRingLngLat(ring);
        features.push({ type: "Feature", properties: props, geometry: { type: "Point", coordinates: c } });
      }
    } else if (g.type === "MultiPolygon") {
      let bestRing: number[][] | null = null;
      let bestA = -1;
      for (const poly of g.coordinates) {
        const ring = poly[0];
        if (!ring?.length) continue;
        const ar = ringBBoxAreaLngLat(ring);
        if (ar > bestA) {
          bestA = ar;
          bestRing = ring;
        }
      }
      if (bestRing) {
        const c = centroidOfRingLngLat(bestRing);
        features.push({ type: "Feature", properties: props, geometry: { type: "Point", coordinates: c } });
      }
    }
  }
  return { type: "FeatureCollection", features };
}

/** LINK / MLS-style market areas (from RE_Districts shapefile → public GeoJSON). */
export const RE_MARKET_DISTRICTS: { district: string; abbrv: string }[] = [
  { district: "Airport", abbrv: "ARPT" },
  { district: "Beach Plum", abbrv: "BPLM" },
  { district: "Brant Point", abbrv: "BRAN" },
  { district: "Cisco", abbrv: "CISC" },
  { district: "Cliff", abbrv: "CLIF" },
  { district: "Dionis", abbrv: "DION" },
  { district: "Eel Point", abbrv: "ELPT" },
  { district: "Fishers Landing", abbrv: "FLDG" },
  { district: "Hummock", abbrv: "HUMM" },
  { district: "Madaket", abbrv: "MADA" },
  { district: "Madequecham", abbrv: "MADQ" },
  { district: "Miacomet", abbrv: "MIAC" },
  { district: "Mid Island", abbrv: "MIDI" },
  { district: "Middle Moors", abbrv: "MM" },
  { district: "Monomoy", abbrv: "MONO" },
  { district: "Nashaquisset", abbrv: "NASH" },
  { district: "Naushop", abbrv: "NAUS" },
  { district: "Pocomo", abbrv: "POCO" },
  { district: "Polpis", abbrv: "POLP" },
  { district: "Quaise", abbrv: "QUAS" },
  { district: "Quidnet", abbrv: "QUID" },
  { district: "Sandpiper", abbrv: "SAND" },
  { district: "Sconset", abbrv: "SCON" },
  { district: "Shawkemo", abbrv: "SHAW" },
  { district: "Shimmo", abbrv: "SHIM" },
  { district: "South Town", abbrv: "STWN" },
  { district: "Squam", abbrv: "SQUM" },
  { district: "Surfside", abbrv: "SURF" },
  { district: "Tom Nevers", abbrv: "TNVR" },
  { district: "Town", abbrv: "TOWN" },
  { district: "Wauwinet", abbrv: "WAUW" },
  { district: "West Town", abbrv: "WTWN" },
];

const PALETTE = [
  "#5b7fd1",
  "#3d9b84",
  "#c97b3a",
  "#8b5cf6",
  "#d9468f",
  "#2d9cdb",
  "#7cb342",
  "#e53935",
  "#00897b",
  "#fbc02d",
  "#5c6bc0",
  "#43a047",
  "#ff7043",
  "#26a69a",
  "#ab47bc",
  "#78909c",
  "#3949ab",
  "#d4a017",
  "#6d4c41",
  "#1e88e5",
  "#546e7a",
  "#00acc1",
  "#8e24aa",
  "#c62828",
  "#558b2f",
  "#f4511e",
  "#00695c",
  "#6a1b9a",
  "#ad1457",
  "#283593",
  "#ef6c00",
  "#2e7d32",
  "#4527a0",
];

/** Mapbox `fill-color` expression keyed on `Abbrv`. */
export function reDistrictFillColorExpression(): unknown[] {
  const pairs: unknown[] = [];
  RE_MARKET_DISTRICTS.forEach(({ abbrv }, i) => {
    pairs.push(abbrv, PALETTE[i % PALETTE.length]);
  });
  return ["match", ["get", "Abbrv"], ...pairs, "#94a3b8"];
}

function extendBounds(
  west: number,
  south: number,
  east: number,
  north: number,
  lng: number,
  lat: number,
): [number, number, number, number] {
  return [Math.min(west, lng), Math.min(south, lat), Math.max(east, lng), Math.max(north, lat)];
}

function ringBounds(ring: number[][]): [number, number, number, number] | null {
  if (!ring.length) return null;
  let w = ring[0][0];
  let s = ring[0][1];
  let e = ring[0][0];
  let n = ring[0][1];
  for (const c of ring) {
    if (c.length < 2) continue;
    [w, s, e, n] = extendBounds(w, s, e, n, c[0], c[1]);
  }
  return [w, s, e, n];
}

function mergeBbox(
  a: [number, number, number, number],
  b: [number, number, number, number],
): [number, number, number, number] {
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
}

function boundsFromPolygonRings(coords: number[][][]): [number, number, number, number] | null {
  let b: [number, number, number, number] | null = null;
  for (const ring of coords) {
    const rb = ringBounds(ring);
    if (!rb) continue;
    b = b ? mergeBbox(b, rb) : rb;
  }
  return b;
}

/** Web Mercator / WGS84 bbox for one district abbreviation. */
export function bboxForReDistrictAbbrv(
  fc: FeatureCollection<Geometry, { Abbrv?: string }>,
  abbrv: string,
): { west: number; south: number; east: number; north: number } | null {
  const key = abbrv.trim().toUpperCase();
  let b: [number, number, number, number] | null = null;
  for (const f of fc.features) {
    const a = String(f.properties?.Abbrv ?? "").toUpperCase();
    if (a !== key) continue;
    const g = f.geometry as Polygon | MultiPolygon | null;
    if (!g) continue;
    let pb: [number, number, number, number] | null = null;
    if (g.type === "Polygon") {
      pb = boundsFromPolygonRings(g.coordinates);
    } else if (g.type === "MultiPolygon") {
      for (const poly of g.coordinates) {
        const nb = boundsFromPolygonRings(poly);
        if (!nb) continue;
        pb = pb ? mergeBbox(pb, nb) : nb;
      }
    }
    if (!pb) continue;
    b = b ? mergeBbox(b, pb) : pb;
  }
  if (!b) return null;
  return { west: b[0], south: b[1], east: b[2], north: b[3] };
}
