import { NextResponse } from "next/server";
import { fetchAllListings, CncListing } from "@/lib/cnc-api";

type NeighborhoodSales = {
  name: string;
  salesCount: number;
  avgSalePrice: number;
  totalVolume: number;
};

// Standard Nantucket area names for normalization
const NANTUCKET_AREA_ALIASES: Record<string, string> = {
  siasconset: "Sconset",
  "'sconset": "Sconset",
  downtown: "Town",
  center: "Town",
  "nantucket town": "Town",
  "tom nevers": "Tom Nevers",
  "brant point": "Brant Point",
};

/**
 * GET /api/neighborhood-sales
 *
 * Fetches sold listings from the C&C API and aggregates by neighborhood (MLSAreaMajor).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const years = parseInt(searchParams.get("years") ?? "1");

  try {
    const daysBack = years * 365;

    const soldListings = await fetchAllListings({
      status: "S",
      close_date: daysBack,
    });

    // Group by MLSAreaMajor (neighborhood)
    const neighborhoodMap = new Map<
      string,
      { prices: number[]; totalVolume: number }
    >();

    for (const listing of soldListings) {
      const area = listing.MLSAreaMajor;
      if (!area || area.trim() === "") continue;

      const price = listing.ClosePrice ?? listing.ListPrice;
      if (!price || price <= 0) continue;

      const normalizedName = normalizeAreaName(area);

      if (!neighborhoodMap.has(normalizedName)) {
        neighborhoodMap.set(normalizedName, { prices: [], totalVolume: 0 });
      }
      const bucket = neighborhoodMap.get(normalizedName)!;
      bucket.prices.push(price);
      bucket.totalVolume += price;
    }

    const neighborhoods: NeighborhoodSales[] = [];
    for (const [name, bucket] of neighborhoodMap) {
      neighborhoods.push({
        name,
        salesCount: bucket.prices.length,
        avgSalePrice: Math.round(
          bucket.prices.reduce((s, p) => s + p, 0) / bucket.prices.length
        ),
        totalVolume: bucket.totalVolume,
      });
    }

    // Sort by total volume descending, filter to 2+ sales
    neighborhoods.sort((a, b) => b.totalVolume - a.totalVolume);
    const filtered = neighborhoods.filter((n) => n.salesCount >= 2);

    return NextResponse.json({
      data: filtered,
      totalSales: soldListings.length,
      source: "cnc-api",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Neighborhood sales API error:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function normalizeAreaName(area: string): string {
  const trimmed = area.trim();
  const lower = trimmed.toLowerCase();

  if (NANTUCKET_AREA_ALIASES[lower]) {
    return NANTUCKET_AREA_ALIASES[lower];
  }

  for (const [alias, normalized] of Object.entries(NANTUCKET_AREA_ALIASES)) {
    if (lower.includes(alias)) {
      return normalized;
    }
  }

  return trimmed
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
