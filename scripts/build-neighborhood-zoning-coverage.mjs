/**
 * Builds src/data/neighborhood-zoning-coverage.json from:
 * - Assessor parcels (zoning field + geometry) — same source as the property map
 * - LINK RE market polygons — same source as /data/re-districts.geojson on the map
 *
 * Run from repo root: node scripts/build-neighborhood-zoning-coverage.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import polylabel from "polylabel";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const PARCEL_PATH = path.join(ROOT, "src/data/zoning-tool/nantucket-tax-parcels.clean.geojson");
const RE_PATH = path.join(ROOT, "public/data/re-districts.geojson");
const DISTRICTS_PATH = path.join(ROOT, "src/data/zoning-districts.json");
const OUT_PATH = path.join(ROOT, "src/data/neighborhood-zoning-coverage.json");

/** Site neighborhood slug → RE `Abbrv` values that define MLS coverage for that guide page. */
const SLUG_TO_RE_ABBRV = {
  "brant-point": ["BRAN"],
  sconset: ["SCON"],
  madaket: ["MADA", "ELPT"],
  "mid-island": ["MIDI", "SHIM", "ARPT", "MIAC", "MM"],
  town: ["TOWN", "STWN", "WTWN"],
  cliff: ["CLIF"],
  surfside: ["SURF"],
  cisco: ["CISC", "HUMM"],
  dionis: ["DION"],
  polpis: ["POLP", "POCO"],
  monomoy: ["MONO"],
  madequecham: ["MADQ"],
};

function ringSignedArea(ring) {
  if (!ring || ring.length < 3) return 0;
  let sum = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const p = ring[i];
    const q = ring[(i + 1) % n];
    sum += p[0] * q[1] - q[0] * p[1];
  }
  return sum / 2;
}

function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-30) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygonGeometry(lng, lat, geom) {
  if (!geom) return false;
  if (geom.type === "Polygon") {
    const rings = geom.coordinates;
    const outer = rings[0];
    if (!outer || !pointInRing(lng, lat, outer)) return false;
    for (let h = 1; h < rings.length; h++) {
      if (pointInRing(lng, lat, rings[h])) return false;
    }
    return true;
  }
  if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) {
      const outer = poly[0];
      if (!outer || !pointInRing(lng, lat, outer)) continue;
      let inHole = false;
      for (let hi = 1; hi < poly.length; hi++) {
        if (pointInRing(lng, lat, poly[hi])) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return true;
    }
    return false;
  }
  return false;
}

function labelPointForParcelGeometry(geom) {
  const precision = 1e-5;
  if (geom.type === "Polygon") {
    const rings = geom.coordinates;
    if (!rings?.[0]?.length) return null;
    const pt = polylabel(rings, precision);
    return { lng: pt[0], lat: pt[1] };
  }
  if (geom.type === "MultiPolygon") {
    let bestPoly = null;
    let bestA = 0;
    for (const poly of geom.coordinates) {
      const outer = poly[0];
      if (!outer?.length) continue;
      const a = Math.abs(ringSignedArea(outer));
      if (a > bestA) {
        bestA = a;
        bestPoly = poly;
      }
    }
    if (!bestPoly) return null;
    const pt = polylabel(bestPoly, precision);
    return { lng: pt[0], lat: pt[1] };
  }
  return null;
}

function loadDistrictKeys() {
  const raw = JSON.parse(fs.readFileSync(DISTRICTS_PATH, "utf8"));
  return new Set(Object.keys(raw.districts ?? {}));
}

function normalizeZoning(raw, districtKeys) {
  const id = String(raw ?? "").trim();
  if (!id) return null;
  const upper = id.toUpperCase();
  const hard = {
    R1: "R-1",
    R5: "R-5",
    R10: "R-10",
    R10L: "R-10L",
    R20: "R-20",
    R40: "R-40",
    R2: "R-5",
    SR1: "SR-1",
    SR10: "SR-10",
    SR20: "SR-20",
    LUG1: "LUG-1",
    LUG2: "LUG-2",
    LUG3: "LUG-3",
    RC2: "RC-2",
    RC2M: "RC-2",
  };
  if (hard[upper]) return districtKeys.has(hard[upper]) ? hard[upper] : null;
  if (districtKeys.has(upper)) return upper;
  const withHyphen = upper.replace(/^([A-Z]+)(\d+[A-Z]?)$/i, (_, a, b) => `${a}-${b}`);
  if (districtKeys.has(withHyphen)) return withHyphen;
  const compact = upper.replace(/-/g, "");
  for (const k of districtKeys) {
    if (k.replace(/-/g, "") === compact) return k;
  }
  return null;
}

function findReAbbrvForPoint(lng, lat, reFeatures) {
  let bestAbbrv = null;
  let bestArea = Infinity;
  for (const f of reFeatures) {
    const abbrv = String(f.properties?.Abbrv ?? "").trim();
    if (!abbrv || !f.geometry) continue;
    if (!pointInPolygonGeometry(lng, lat, f.geometry)) continue;
    const area = Number(f.properties?.Shape_Area);
    const a = Number.isFinite(area) && area > 0 ? area : 1e20;
    if (a < bestArea) {
      bestArea = a;
      bestAbbrv = abbrv;
    }
  }
  return bestAbbrv;
}

function main() {
  const districtKeys = loadDistrictKeys();
  const parcels = JSON.parse(fs.readFileSync(PARCEL_PATH, "utf8"));
  const reFc = JSON.parse(fs.readFileSync(RE_PATH, "utf8"));
  const reFeatures = (reFc.features ?? []).filter((f) => f?.geometry);

  /** @type {Map<string, Set<string>>} */
  const byRe = new Map();
  for (const f of reFeatures) {
    const a = String(f.properties?.Abbrv ?? "").trim();
    if (a) byRe.set(a, new Set());
  }

  let labeled = 0;
  let skippedNoGeom = 0;
  let skippedNoRe = 0;
  let skippedNoZoning = 0;

  for (const feat of parcels.features ?? []) {
    const geom = feat.geometry;
    const zoningRaw = feat.properties?.zoning;
    if (!geom) {
      skippedNoGeom++;
      continue;
    }
    const pt = labelPointForParcelGeometry(geom);
    if (!pt) {
      skippedNoGeom++;
      continue;
    }
    const abbrv = findReAbbrvForPoint(pt.lng, pt.lat, reFeatures);
    if (!abbrv) {
      skippedNoRe++;
      continue;
    }
    const key = normalizeZoning(zoningRaw, districtKeys);
    if (!key) {
      skippedNoZoning++;
      continue;
    }
    if (!byRe.has(abbrv)) byRe.set(abbrv, new Set());
    byRe.get(abbrv).add(key);
    labeled++;
  }

  const byReAbbrv = {};
  for (const [abbrv, set] of byRe.entries()) {
    byReAbbrv[abbrv] = [...set].sort();
  }

  const bySlug = {};
  for (const [slug, abbrvs] of Object.entries(SLUG_TO_RE_ABBRV)) {
    const merged = new Set();
    for (const ab of abbrvs) {
      const codes = byReAbbrv[ab] ?? [];
      for (const c of codes) merged.add(c);
    }
    bySlug[slug] = {
      reDistrictAbbrvs: abbrvs,
      zoningDistrictCodes: [...merged].sort(),
    };
  }

  const out = {
    generatedAt: new Date().toISOString(),
    method:
      "Interior label point per parcel (polylabel) ∩ RE market polygon; assessor `zoning` normalized to keys in zoning-districts.json.",
    parcelFile: "src/data/zoning-tool/nantucket-tax-parcels.clean.geojson",
    reDistrictsFile: "public/data/re-districts.geojson",
    stats: {
      parcelsLabeled: labeled,
      skippedNoGeometry: skippedNoGeom,
      skippedNoReDistrict: skippedNoRe,
      skippedUnmappedZoning: skippedNoZoning,
    },
    byReAbbrv,
    bySlug,
  };

  fs.writeFileSync(OUT_PATH, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(`Wrote ${OUT_PATH}`);
  console.log(JSON.stringify(out.stats, null, 2));
}

main();
