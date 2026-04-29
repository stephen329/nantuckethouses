import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import type { Feature, Geometry } from "geojson";
import { fetchAllListings } from "@/lib/cnc-api";
import {
  buildParcelStreetCentroidIndex,
  linkMapPointsToGeoJson,
  matchLinkListingToPoint,
  type LinkListingMapPoint,
  type LinkListingRow,
  type ParcelProps,
} from "@/lib/link-listings-parcel-match";

const GEOJSON_PATH = path.join(process.cwd(), "src/data/zoning-tool/nantucket-tax-parcels.clean.geojson");

let cachedParcelFeatures: Feature<Geometry, ParcelProps>[] | null = null;

function loadParcelFeatures(): Feature<Geometry, ParcelProps>[] {
  if (cachedParcelFeatures) return cachedParcelFeatures;
  const raw = fs.readFileSync(GEOJSON_PATH, "utf8");
  const gj = JSON.parse(raw) as { features?: Feature<Geometry, ParcelProps>[] };
  cachedParcelFeatures = gj.features ?? [];
  return cachedParcelFeatures;
}

/**
 * GET /api/map/link-listings?bbox=west,south,east,north&pool=active|sold|both&soldDays=1095
 *
 * Active and sold LINK (C&C) listings placed on parcel centroids by normalized street address.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bboxRaw = searchParams.get("bbox");
  const pool = (searchParams.get("pool") ?? "both").toLowerCase();
  const soldDays = Math.min(Math.max(parseInt(searchParams.get("soldDays") ?? "1095", 10), 30), 3650);

  if (!bboxRaw) {
    return NextResponse.json({ error: "Missing bbox (west,south,east,north)" }, { status: 400 });
  }
  const parts = bboxRaw.split(",").map((x) => Number.parseFloat(x.trim()));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    return NextResponse.json({ error: "Invalid bbox" }, { status: 400 });
  }
  const bbox = { west: parts[0]!, south: parts[1]!, east: parts[2]!, north: parts[3]! };

  if (!["active", "sold", "both"].includes(pool)) {
    return NextResponse.json({ error: "pool must be active, sold, or both" }, { status: 400 });
  }

  try {
    const features = loadParcelFeatures();
    const index = buildParcelStreetCentroidIndex(features);

    const wantActive = pool === "active" || pool === "both";
    const wantSold = pool === "sold" || pool === "both";

    const activePoints: LinkListingMapPoint[] = [];
    const soldPoints: LinkListingMapPoint[] = [];

    if (wantActive) {
      const active = await fetchAllListings({ status: "A" });
      for (const row of active) {
        const p = matchLinkListingToPoint(row as LinkListingRow, index, "active", bbox);
        if (p) activePoints.push(p);
      }
    }

    if (wantSold) {
      const sold = await fetchAllListings({ status: "S", close_date: soldDays });
      for (const row of sold) {
        const p = matchLinkListingToPoint(row as LinkListingRow, index, "sold", bbox);
        if (p) soldPoints.push(p);
      }
    }

    return NextResponse.json({
      active: linkMapPointsToGeoJson(activePoints),
      sold: linkMapPointsToGeoJson(soldPoints),
      meta: {
        activeMatched: activePoints.length,
        soldMatched: soldPoints.length,
        pool,
        soldDays,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message, active: { type: "FeatureCollection", features: [] }, sold: { type: "FeatureCollection", features: [] } }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
