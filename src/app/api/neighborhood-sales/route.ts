import { NextResponse } from "next/server";
import { repliersGet } from "@/lib/repliers";

/**
 * Response type for neighborhood sales aggregation
 */
type StatisticsResponse = {
  count?: number;
  statistics?: {
    soldPrice?: {
      med?: number;
      avg?: number;
      sum?: number;
      aggregates?: {
        address?: {
          neighborhood?: Record<string, {
            count: number;
            med?: number;
            avg?: number;
            sum?: number;
          }>;
          area?: Record<string, {
            count: number;
            med?: number;
            avg?: number;
            sum?: number;
          }>;
        };
      };
    };
  };
};

type NeighborhoodSales = {
  name: string;
  salesCount: number;
  avgSalePrice: number;
  totalVolume: number;
};

// Standard Nantucket area names for normalization
const NANTUCKET_AREA_ALIASES: Record<string, string> = {
  "siasconset": "Sconset",
  "'sconset": "Sconset",
  "downtown": "Town",
  "center": "Town",
  "nantucket town": "Town",
  "tom nevers": "Tom Nevers",
  "brant point": "Brant Point",
};

/**
 * GET /api/neighborhood-sales
 * 
 * Fetches sold transaction data aggregated by neighborhood.
 * Returns: name, salesCount, avgSalePrice, totalVolume
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const years = parseInt(searchParams.get("years") ?? "1");

  try {
    const apiKey = process.env.REPLIERS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing REPLIERS_API_KEY on the server" },
        { status: 500 }
      );
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - years);
    const minSoldDate = startDate.toISOString().split("T")[0];
    const maxSoldDate = new Date().toISOString().split("T")[0];

    // Fetch sold listings aggregated by neighborhood
    // Note: status=U required when using soldPrice statistics
    const data = await repliersGet<StatisticsResponse>("/listings", {
      county: "Nantucket",
      status: "U",  // Required for sold price statistics
      minSoldDate: minSoldDate,
      maxSoldDate: maxSoldDate,
      statistics: "avg-soldPrice,sum-soldPrice,cnt-closed",
      aggregateStatistics: "true",
      aggregates: "address.neighborhood",
      listings: "false",
    });

    // Extract neighborhood aggregates
    const priceAggregates = data.statistics?.soldPrice?.aggregates?.address?.neighborhood;
    
    const neighborhoods: NeighborhoodSales[] = [];

    if (priceAggregates && Object.keys(priceAggregates).length > 0) {
      Object.entries(priceAggregates).forEach(([name, salesData]) => {
        // Skip empty names
        if (!name || name.trim() === "") return;
        
        const normalizedName = normalizeAreaName(name);
        
        neighborhoods.push({
          name: normalizedName,
          salesCount: salesData.count || 0,
          avgSalePrice: salesData.avg || 0,
          totalVolume: salesData.sum || 0,
        });
      });

      // Merge duplicate normalized names
      const merged = mergeNeighborhoods(neighborhoods);
      
      // Sort by total volume descending
      merged.sort((a, b) => b.totalVolume - a.totalVolume);

      // Filter to neighborhoods with at least 2 sales
      const filtered = merged.filter((n) => n.salesCount >= 2);

      if (filtered.length > 0) {
        return NextResponse.json({
          data: filtered,
          totalSales: data.count,
          source: "repliers-statistics-api",
        });
      }
    }

    // Try area aggregation if neighborhood doesn't work
    const areaData = await repliersGet<StatisticsResponse>("/listings", {
      county: "Nantucket",
      status: "U",  // Required for sold price statistics
      minSoldDate: minSoldDate,
      maxSoldDate: maxSoldDate,
      statistics: "avg-soldPrice,sum-soldPrice,cnt-closed",
      aggregateStatistics: "true",
      aggregates: "address.area",
      listings: "false",
    });

    const areaAggregates = areaData.statistics?.soldPrice?.aggregates?.address?.area;

    if (areaAggregates && Object.keys(areaAggregates).length > 0) {
      const areaNeighborhoods: NeighborhoodSales[] = [];
      
      Object.entries(areaAggregates).forEach(([name, salesData]) => {
        if (!name || name.trim() === "") return;
        
        const normalizedName = normalizeAreaName(name);
        
        areaNeighborhoods.push({
          name: normalizedName,
          salesCount: salesData.count || 0,
          avgSalePrice: salesData.avg || 0,
          totalVolume: salesData.sum || 0,
        });
      });

      const merged = mergeNeighborhoods(areaNeighborhoods);
      merged.sort((a, b) => b.totalVolume - a.totalVolume);
      const filtered = merged.filter((n) => n.salesCount >= 2);

      if (filtered.length > 0) {
        return NextResponse.json({
          data: filtered,
          totalSales: areaData.count,
          source: "repliers-statistics-api",
        });
      }
    }

    // Return empty if no data available
    return NextResponse.json({
      data: [],
      totalSales: 0,
      message: "No neighborhood sales data available",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Neighborhood sales API error:", message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * Normalize area names to standard Nantucket neighborhoods
 */
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

/**
 * Merge neighborhoods with the same normalized name
 */
function mergeNeighborhoods(neighborhoods: NeighborhoodSales[]): NeighborhoodSales[] {
  const merged = new Map<string, NeighborhoodSales>();

  neighborhoods.forEach((n) => {
    const existing = merged.get(n.name);
    if (existing) {
      const totalCount = existing.salesCount + n.salesCount;
      existing.avgSalePrice = Math.round(
        (existing.avgSalePrice * existing.salesCount + n.avgSalePrice * n.salesCount) / totalCount
      );
      existing.totalVolume = existing.totalVolume + n.totalVolume;
      existing.salesCount = totalCount;
    } else {
      merged.set(n.name, { ...n });
    }
  });

  return Array.from(merged.values());
}
