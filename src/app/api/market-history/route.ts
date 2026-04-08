import { NextResponse } from "next/server";
import { fetchAllListings, median, average, daysBetween } from "@/lib/cnc-api";

type MonthlyData = {
  month: string;
  year: number;
  monthKey: string;
  medianPrice: number;
  avgPrice: number;
  soldCount: number;
  medianDaysOnMarket: number;
};

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * GET /api/market-history
 *
 * Fetches historical sold data from the C&C API and groups by month.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const years = parseInt(searchParams.get("years") ?? "3");

  try {
    const daysBack = years * 365;

    const soldListings = await fetchAllListings({
      status: "S",
      close_date: daysBack,
    });

    // Group by month using CloseDate
    const monthBuckets: Record<
      string,
      { prices: number[]; domValues: number[] }
    > = {};

    for (const listing of soldListings) {
      if (!listing.CloseDate || !listing.ClosePrice) continue;

      const closeDate = new Date(listing.CloseDate);
      const y = closeDate.getFullYear();
      const m = closeDate.getMonth(); // 0-indexed
      const monthKey = `${y}-${String(m + 1).padStart(2, "0")}`;

      if (!monthBuckets[monthKey]) {
        monthBuckets[monthKey] = { prices: [], domValues: [] };
      }
      monthBuckets[monthKey].prices.push(listing.ClosePrice);

      if (listing.OnMarketDate) {
        const dom = daysBetween(listing.OnMarketDate, listing.CloseDate);
        if (dom >= 0 && dom < 1000) {
          monthBuckets[monthKey].domValues.push(dom);
        }
      }
    }

    const history: MonthlyData[] = Object.entries(monthBuckets)
      .map(([monthKey, bucket]) => {
        const [yearStr, monthStr] = monthKey.split("-");
        const monthIndex = parseInt(monthStr) - 1;

        return {
          month: monthNames[monthIndex],
          year: parseInt(yearStr),
          monthKey,
          medianPrice: median(bucket.prices) ?? 0,
          avgPrice: average(bucket.prices) ?? 0,
          soldCount: bucket.prices.length,
          medianDaysOnMarket: median(bucket.domValues) ?? 0,
        };
      })
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    if (history.length > 0) {
      return NextResponse.json({
        data: history,
        isFallback: false,
        totalSold: soldListings.length,
        overallMedianPrice: median(
          soldListings
            .map((l) => l.ClosePrice)
            .filter((p): p is number => typeof p === "number" && p > 0)
        ),
        source: "cnc-api",
      });
    }

    // Fallback to generated data if API doesn't return sufficient historical data
    const fallbackHistory = generateFallbackHistory(years);
    return NextResponse.json({
      data: fallbackHistory,
      isFallback: true,
      message:
        "Historical sold data not available from API; showing estimated trends",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Market history API error:", message);

    const fallbackHistory = generateFallbackHistory(years);
    return NextResponse.json({
      data: fallbackHistory,
      isFallback: true,
      error: message,
    });
  }
}

/**
 * Generate realistic fallback historical data for Nantucket
 */
function generateFallbackHistory(years: number): MonthlyData[] {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const history: MonthlyData[] = [];

  const basePrice = 2800000;
  const seasonalMultipliers = [
    0.92, 0.94, 0.98, 1.02, 1.08, 1.12, 1.15, 1.12, 1.05, 0.98, 0.95, 0.93,
  ];
  const yearlyAppreciation = 0.05;

  for (let y = currentYear - years; y <= currentYear; y++) {
    const yearFactor = Math.pow(
      1 + yearlyAppreciation,
      y - (currentYear - years)
    );

    for (let m = 0; m < 12; m++) {
      if (y === currentYear && m > currentMonth) break;

      const seasonalPrice = basePrice * yearFactor * seasonalMultipliers[m];
      const variance = (Math.random() - 0.5) * 200000;
      const monthStr = String(m + 1).padStart(2, "0");

      history.push({
        month: monthNames[m],
        year: y,
        monthKey: `${y}-${monthStr}`,
        medianPrice: Math.round(seasonalPrice + variance),
        avgPrice: Math.round((seasonalPrice + variance) * 1.1),
        soldCount: Math.round(
          15 + Math.random() * 20 + seasonalMultipliers[m] * 10
        ),
        medianDaysOnMarket: Math.round(
          90 + (1 - seasonalMultipliers[m]) * 60 + Math.random() * 30
        ),
      });
    }
  }

  return history;
}
