import { NextResponse } from "next/server";
import { fetchListings, fetchAllListings, median, average, daysBetween } from "@/lib/cnc-api";

/**
 * GET /api/market-stats
 *
 * Fetches real-time market statistics from the Congdon & Coleman API.
 * Returns: activeListingCount, medianListPrice, avgListPrice, medianDaysOnMarket
 */
export async function GET() {
  try {
    // Fetch active listings to get count and prices
    const activeListings = await fetchAllListings({ status: "A" });

    const listPrices = activeListings
      .map((l) => l.ListPrice)
      .filter((p): p is number => typeof p === "number" && p > 0);

    // Fetch sold listings from the last 12 months for days-on-market stats
    let medianDaysOnMarket: number | null = null;
    try {
      const soldListings = await fetchAllListings({
        status: "S",
        close_date: 365,
      });

      const domValues = soldListings
        .filter((l) => l.OnMarketDate && l.CloseDate)
        .map((l) => daysBetween(l.OnMarketDate!, l.CloseDate!))
        .filter((d) => d >= 0 && d < 1000); // filter unreasonable values

      medianDaysOnMarket = median(domValues);
    } catch (e) {
      console.log("Failed to fetch DOM stats:", e);
    }

    const stats = {
      activeListingCount: activeListings.length,
      medianListPrice: median(listPrices),
      avgListPrice: average(listPrices),
      medianDaysOnMarket,
    };

    return NextResponse.json({
      data: { aggregates: stats },
      source: "cnc-api",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Market stats API error:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
