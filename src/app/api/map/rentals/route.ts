import { NextResponse } from "next/server";
import type { NrMapRentalResult } from "@/lib/nr-map-rentals";
import { getMapRentalResultsForBbox } from "@/lib/map-rentals-inventory-cache";

export const runtime = "nodejs";

/**
 * GET /api/map/rentals?bbox=west,south,east,north
 * Proxies active Nantucket Rentals inventory for map pins (public listing API).
 * Full catalog is fetched with pagination once per revalidate window (cached); bbox filter is in-memory.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bboxRaw = searchParams.get("bbox");
  let west: number;
  let south: number;
  let east: number;
  let north: number;
  if (bboxRaw) {
    const parts = bboxRaw.split(",").map((x) => Number.parseFloat(x.trim()));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
      return NextResponse.json({ error: "Invalid bbox. Use west,south,east,north." }, { status: 400 });
    }
    [west, south, east, north] = parts as [number, number, number, number];
  } else {
    west = -70.2;
    south = 41.22;
    east = -69.95;
    north = 41.33;
  }

  const { results, inventoryError } = await getMapRentalResultsForBbox(west, south, east, north);
  if (inventoryError) {
    return NextResponse.json(
      { error: "Failed to fetch rentals", results: [] as NrMapRentalResult[] },
      { status: 502 },
    );
  }

  return NextResponse.json({ results });
}
