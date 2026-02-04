import { NextResponse } from "next/server";
import { repliersGet } from "@/lib/repliers";

/**
 * Aggregated statistics response from Repliers API
 * @see https://help.repliers.com/en/article/real-time-market-statistics-implementation-guide-l3b1uy/
 */
type NeighborhoodAggregates = Record<string, {
  count: number;
  med?: number;
  avg?: number;
}>;

type StatisticsResponse = {
  count?: number;
  statistics?: {
    listPrice?: {
      med?: number;
      avg?: number;
      aggregates?: {
        address?: {
          neighborhood?: NeighborhoodAggregates;
          area?: NeighborhoodAggregates;
        };
      };
    };
    daysOnMarket?: {
      med?: number;
      avg?: number;
      aggregates?: {
        address?: {
          neighborhood?: NeighborhoodAggregates;
          area?: NeighborhoodAggregates;
        };
      };
    };
  };
};

type NeighborhoodStats = {
  name: string;
  activeListings: number;
  medianPrice: number;
  avgPrice: number;
  medianDaysOnMarket: number;
};

// Standard Nantucket area names for normalization
const NANTUCKET_AREA_ALIASES: Record<string, string> = {
  "siasconset": "Sconset",
  "downtown": "Town",
  "center": "Town",
  "nantucket town": "Town",
  "tom nevers": "Tom Nevers",
  "brant point": "Brant Point",
};

/**
 * GET /api/neighborhoods
 * 
 * Fetches market statistics aggregated by neighborhood using Repliers' aggregateStatistics feature.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? "Nantucket";

  try {
    const apiKey = process.env.REPLIERS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing REPLIERS_API_KEY on the server" },
        { status: 500 }
      );
    }

    // Fetch active listing statistics aggregated by neighborhood
    // Uses aggregateStatistics=true with aggregates=address.neighborhood
    // Note: daysOnMarket requires status=U, so we only fetch price stats for active
    // Use county filter to capture ALL Nantucket neighborhoods
    const data = await repliersGet<StatisticsResponse>("/listings", {
      county: "Nantucket",  // County captures all island neighborhoods
      status: "A",
      statistics: "med-listPrice,avg-listPrice",
      aggregateStatistics: "true",
      aggregates: "address.neighborhood",
      listings: "false",
    });

    // Extract neighborhood aggregates from the response
    const priceAggregates = data.statistics?.listPrice?.aggregates?.address?.neighborhood;

    const neighborhoods: NeighborhoodStats[] = [];

    if (priceAggregates && Object.keys(priceAggregates).length > 0) {
      Object.entries(priceAggregates).forEach(([name, priceData]) => {
        // Skip empty or blank names
        if (!name || name.trim() === "") return;
        
        // Normalize neighborhood name
        const normalizedName = normalizeAreaName(name);

        neighborhoods.push({
          name: normalizedName,
          activeListings: priceData.count,
          medianPrice: priceData.med ?? 0,
          avgPrice: priceData.avg ?? 0,
          // Note: DOM requires status=U (sold listings), not available for active listings
          medianDaysOnMarket: 0,
        });
      });

      // Merge duplicate normalized names
      const mergedNeighborhoods = mergeNeighborhoods(neighborhoods);

      // Sort by listing count descending
      mergedNeighborhoods.sort((a, b) => b.activeListings - a.activeListings);

      // Filter to neighborhoods with at least 2 listings and non-empty names
      const filtered = mergedNeighborhoods.filter((n) => n.activeListings >= 2 && n.name.trim() !== "");

      if (filtered.length > 0) {
        return NextResponse.json({
          data: filtered,
          isFallback: false,
          source: "repliers-statistics-api",
        });
      }
    }

    // Try aggregating by area if neighborhood doesn't work
    const areaData = await repliersGet<StatisticsResponse>("/listings", {
      county: "Nantucket",  // County captures all island neighborhoods
      status: "A",
      statistics: "med-listPrice,avg-listPrice",
      aggregateStatistics: "true",
      aggregates: "address.area",
      listings: "false",
    });

    const areaPriceAggregates = areaData.statistics?.listPrice?.aggregates?.address?.area;

    if (areaPriceAggregates && Object.keys(areaPriceAggregates).length > 0) {
      const areaNeighborhoods: NeighborhoodStats[] = [];
      
      Object.entries(areaPriceAggregates).forEach(([name, priceData]) => {
        // Skip empty or blank names
        if (!name || name.trim() === "") return;
        
        const normalizedName = normalizeAreaName(name);

        areaNeighborhoods.push({
          name: normalizedName,
          activeListings: priceData.count,
          medianPrice: priceData.med ?? 0,
          avgPrice: priceData.avg ?? 0,
          // Note: DOM requires status=U (sold listings), not available for active listings
          medianDaysOnMarket: 0,
        });
      });

      const merged = mergeNeighborhoods(areaNeighborhoods);
      merged.sort((a, b) => b.activeListings - a.activeListings);
      const filtered = merged.filter((n) => n.activeListings >= 2 && n.name.trim() !== "");

      if (filtered.length > 0) {
        return NextResponse.json({
          data: filtered,
          isFallback: false,
          source: "repliers-statistics-api",
        });
      }
    }

    // Return fallback with realistic Nantucket neighborhood estimates
    // This is used when API doesn't provide neighborhood-level breakdown
    return NextResponse.json({
      data: generateFallbackNeighborhoods(),
      isFallback: true,
      message: "Neighborhood breakdown not available from MLS data; showing market estimates",
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

/**
 * Normalize area names to standard Nantucket neighborhoods
 */
function normalizeAreaName(area: string): string {
  const trimmed = area.trim();
  const lower = trimmed.toLowerCase();

  // Check aliases
  if (NANTUCKET_AREA_ALIASES[lower]) {
    return NANTUCKET_AREA_ALIASES[lower];
  }

  // Check partial matches in aliases
  for (const [alias, normalized] of Object.entries(NANTUCKET_AREA_ALIASES)) {
    if (lower.includes(alias)) {
      return normalized;
    }
  }

  // Capitalize first letter of each word
  return trimmed
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Merge neighborhoods with the same normalized name
 */
function mergeNeighborhoods(neighborhoods: NeighborhoodStats[]): NeighborhoodStats[] {
  const merged = new Map<string, NeighborhoodStats>();

  neighborhoods.forEach((n) => {
    const existing = merged.get(n.name);
    if (existing) {
      // Weight averages by listing count
      const totalCount = existing.activeListings + n.activeListings;
      existing.medianPrice = Math.round(
        (existing.medianPrice * existing.activeListings + n.medianPrice * n.activeListings) / totalCount
      );
      existing.avgPrice = Math.round(
        (existing.avgPrice * existing.activeListings + n.avgPrice * n.activeListings) / totalCount
      );
      existing.medianDaysOnMarket = Math.round(
        (existing.medianDaysOnMarket * existing.activeListings + n.medianDaysOnMarket * n.activeListings) / totalCount
      );
      existing.activeListings = totalCount;
    } else {
      merged.set(n.name, { ...n });
    }
  });

  return Array.from(merged.values());
}

/**
 * Generate realistic fallback neighborhood data
 */
function generateFallbackNeighborhoods(): NeighborhoodStats[] {
  return [
    {
      name: "Town",
      activeListings: 24,
      medianPrice: 3200000,
      avgPrice: 3850000,
      medianDaysOnMarket: 95,
    },
    {
      name: "Sconset",
      activeListings: 18,
      medianPrice: 4500000,
      avgPrice: 5200000,
      medianDaysOnMarket: 120,
    },
    {
      name: "Monomoy",
      activeListings: 12,
      medianPrice: 5800000,
      avgPrice: 6500000,
      medianDaysOnMarket: 145,
    },
    {
      name: "Cliff",
      activeListings: 8,
      medianPrice: 6200000,
      avgPrice: 7100000,
      medianDaysOnMarket: 160,
    },
    {
      name: "Brant Point",
      activeListings: 6,
      medianPrice: 4100000,
      avgPrice: 4600000,
      medianDaysOnMarket: 110,
    },
    {
      name: "Madaket",
      activeListings: 10,
      medianPrice: 2800000,
      avgPrice: 3200000,
      medianDaysOnMarket: 85,
    },
    {
      name: "Surfside",
      activeListings: 14,
      medianPrice: 2400000,
      avgPrice: 2800000,
      medianDaysOnMarket: 75,
    },
    {
      name: "Cisco",
      activeListings: 8,
      medianPrice: 2600000,
      avgPrice: 3000000,
      medianDaysOnMarket: 80,
    },
  ];
}
