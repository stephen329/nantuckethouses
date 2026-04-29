import { NextResponse } from "next/server";
import type { NrMapRentalResult } from "@/lib/nr-map-rentals";

function getNrListingsApiBase(): string {
  const raw = process.env.NR_LISTINGS_API_BASE ?? "https://api.nantucketrentals.com/api";
  return raw.trim().replace(/\/$/, "");
}

type NrListingRow = {
  nrPropertyId?: number;
  slug?: string;
  streetAddress?: string;
  headline?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  NrPropertyPics?: { nrPropertyPicPath?: string }[];
};

function inBbox(lng: number, lat: number, west: number, south: number, east: number, north: number): boolean {
  return lng >= west && lng <= east && lat >= south && lat <= north;
}

/**
 * GET /api/map/rentals?bbox=west,south,east,north
 * Proxies active Nantucket Rentals inventory for map pins (public listing API).
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
    // Nantucket island-ish bounds when no viewport yet
    west = -70.2;
    south = 41.22;
    east = -69.95;
    north = 41.33;
  }

  const base = getNrListingsApiBase();
  const collected: NrListingRow[] = [];
  let nextUrl: string | null = `${base}/property/nrproperty-listing/?page=1&page_size=500`;

  try {
    while (nextUrl) {
      const res = await fetch(nextUrl, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) {
        return NextResponse.json({ error: `Listings upstream ${res.status}`, results: [] as NrMapRentalResult[] }, { status: 502 });
      }
      const body = (await res.json()) as { results?: NrListingRow[]; next?: string | null };
      for (const row of body.results ?? []) {
        if ((row.status ?? "").toLowerCase() === "active") collected.push(row);
      }
      nextUrl = body.next ?? null;
    }
  } catch {
    return NextResponse.json({ error: "Failed to fetch rentals", results: [] }, { status: 502 });
  }

  const results: NrMapRentalResult[] = [];
  for (const row of collected) {
    const id = row.nrPropertyId;
    const slug = row.slug?.trim();
    const lat = row.latitude;
    const lng = row.longitude;
    if (id == null || !slug || lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) continue;
    if (!inBbox(lng, lat, west, south, east, north)) continue;
    const thumb = row.NrPropertyPics?.[0]?.nrPropertyPicPath ?? null;
    results.push({
      nrPropertyId: id,
      slug,
      streetAddress: String(row.streetAddress ?? "").trim() || slug,
      headline: String(row.headline ?? row.streetAddress ?? slug).trim(),
      latitude: lat,
      longitude: lng,
      thumbUrl: thumb,
    });
  }

  return NextResponse.json({ results });
}
