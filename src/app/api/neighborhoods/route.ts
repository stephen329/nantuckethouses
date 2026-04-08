import { NextResponse } from "next/server";
import { fetchAllListings, median, average } from "@/lib/cnc-api";

type NeighborhoodStats = {
  name: string;
  activeListings: number;
  medianPrice: number;
  avgPrice: number;
  medianDaysOnMarket: number;
};

// Standard Nantucket area names for normalization
const NANTUCKET_AREA_ALIASES: Record<string, string> = {
  siasconset: "Sconset",
  downtown: "Town",
  center: "Town",
  "nantucket town": "Town",
  "tom nevers": "Tom Nevers",
  "brant point": "Brant Point",
};

/**
 * GET /api/neighborhoods
 *
 * Fetches active listings from C&C API and aggregates stats by neighborhood (MLSAreaMajor).
 */
export async function GET() {
  try {
    const activeListings = await fetchAllListings({ status: "A" });

    // Group by MLSAreaMajor
    const areaMap = new Map<string, number[]>();

    for (const listing of activeListings) {
      const area = listing.MLSAreaMajor;
      if (!area || area.trim() === "") continue;

      const normalizedName = normalizeAreaName(area);
      if (!areaMap.has(normalizedName)) {
        areaMap.set(normalizedName, []);
      }
      if (listing.ListPrice > 0) {
        areaMap.get(normalizedName)!.push(listing.ListPrice);
      }
    }

    const neighborhoods: NeighborhoodStats[] = [];
    for (const [name, prices] of areaMap) {
      if (prices.length < 2) continue;

      neighborhoods.push({
        name,
        activeListings: prices.length,
        medianPrice: median(prices) ?? 0,
        avgPrice: average(prices) ?? 0,
        medianDaysOnMarket: 0, // DOM requires sold data
      });
    }

    neighborhoods.sort((a, b) => b.activeListings - a.activeListings);

    if (neighborhoods.length > 0) {
      return NextResponse.json({
        data: neighborhoods,
        isFallback: false,
        source: "cnc-api",
      });
    }

    return NextResponse.json({
      data: generateFallbackNeighborhoods(),
      isFallback: true,
      message:
        "Neighborhood breakdown not available from API; showing market estimates",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Neighborhoods API error:", message);

    return NextResponse.json({
      data: generateFallbackNeighborhoods(),
      isFallback: true,
      error: message,
    });
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

function generateFallbackNeighborhoods(): NeighborhoodStats[] {
  return [
    { name: "Town", activeListings: 24, medianPrice: 3200000, avgPrice: 3850000, medianDaysOnMarket: 95 },
    { name: "Sconset", activeListings: 18, medianPrice: 4500000, avgPrice: 5200000, medianDaysOnMarket: 120 },
    { name: "Monomoy", activeListings: 12, medianPrice: 5800000, avgPrice: 6500000, medianDaysOnMarket: 145 },
    { name: "Cliff", activeListings: 8, medianPrice: 6200000, avgPrice: 7100000, medianDaysOnMarket: 160 },
    { name: "Brant Point", activeListings: 6, medianPrice: 4100000, avgPrice: 4600000, medianDaysOnMarket: 110 },
    { name: "Madaket", activeListings: 10, medianPrice: 2800000, avgPrice: 3200000, medianDaysOnMarket: 85 },
    { name: "Surfside", activeListings: 14, medianPrice: 2400000, avgPrice: 2800000, medianDaysOnMarket: 75 },
    { name: "Cisco", activeListings: 8, medianPrice: 2600000, avgPrice: 3000000, medianDaysOnMarket: 80 },
  ];
}
