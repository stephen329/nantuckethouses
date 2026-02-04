import { NextResponse } from "next/server";
import { repliersGet } from "@/lib/repliers";

/**
 * Statistics response from Repliers API
 * @see https://help.repliers.com/en/article/real-time-market-statistics-implementation-guide-l3b1uy/
 */
type StatisticsResponse = {
  count?: number;
  statistics?: {
    listPrice?: {
      med?: number;
      avg?: number;
      min?: number;
      max?: number;
    };
    daysOnMarket?: {
      med?: number;
      avg?: number;
      min?: number;
      max?: number;
    };
  };
};

/**
 * GET /api/market-stats
 * 
 * Fetches real-time market statistics from Repliers using their statistics API.
 * Returns: activeListingCount, medianListPrice, medianDaysOnMarket
 * 
 * Note: Days on market stats require sold listings (status=U), 
 * so we make two separate calls.
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

    // Fetch ACTIVE listing stats (count and list prices)
    // Note: daysOnMarket stats require status=U (sold listings)
    // Use county filter to capture ALL Nantucket neighborhoods
    const activeData = await repliersGet<StatisticsResponse>("/listings", {
      county: "Nantucket",      // County captures all island neighborhoods
      status: "A", // Active listings
      statistics: "med-listPrice,avg-listPrice",
      listings: "false",
    });

    // Fetch SOLD listing stats for days on market
    // Using last 12 months for representative DOM data
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    const minSoldDate = oneYearAgo.toISOString().split("T")[0];

    let medianDaysOnMarket: number | null = null;
    try {
      const soldData = await repliersGet<StatisticsResponse>("/listings", {
        county: "Nantucket",  // County captures all island neighborhoods
        status: "U",  // Unavailable (completed transactions)
        minSoldDate: minSoldDate,
        statistics: "med-daysOnMarket,avg-daysOnMarket",
        listings: "false",
      });
      medianDaysOnMarket = soldData.statistics?.daysOnMarket?.med ?? null;
    } catch (e) {
      console.log("Failed to fetch DOM stats:", e);
    }

    const stats = {
      activeListingCount: activeData.count ?? 0,
      medianListPrice: activeData.statistics?.listPrice?.med ?? null,
      avgListPrice: activeData.statistics?.listPrice?.avg ?? null,
      medianDaysOnMarket: medianDaysOnMarket,
    };

    return NextResponse.json({ 
      data: { aggregates: stats },
      source: "repliers-statistics-api"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Market stats API error:", message);
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
