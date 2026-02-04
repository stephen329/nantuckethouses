import { NextResponse } from "next/server";
import { repliersGet } from "@/lib/repliers";

/**
 * Monthly statistics from Repliers grouped API response
 * @see https://help.repliers.com/en/article/real-time-market-statistics-implementation-guide-l3b1uy/
 */
type MonthData = {
  med?: number;
  avg?: number;
  count?: number;
  min?: number;
  max?: number;
};

type StatisticsResponse = {
  count?: number;
  statistics?: {
    soldPrice?: {
      med?: number;
      avg?: number;
      mth?: Record<string, MonthData>;
    };
    listPrice?: {
      med?: number;
      avg?: number;
      mth?: Record<string, MonthData>;
    };
    daysOnMarket?: {
      med?: number;
      avg?: number;
      mth?: Record<string, MonthData>;
    };
  };
};

type MonthlyData = {
  month: string;
  year: number;
  monthKey: string;
  medianPrice: number;
  avgPrice: number;
  soldCount: number;
  medianDaysOnMarket: number;
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * GET /api/market-history
 * 
 * Fetches historical market statistics using Repliers' grp-mth grouping.
 * For sold data, uses status=U&lastStatus=Sld to get accurate historical sold prices.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const years = parseInt(searchParams.get("years") ?? "3");
  const city = searchParams.get("city") ?? "Nantucket";

  try {
    const apiKey = process.env.REPLIERS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing REPLIERS_API_KEY on the server" },
        { status: 500 }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - years);
    const minSoldDate = startDate.toISOString().split("T")[0];

    // Fetch SOLD listings with monthly grouping
    // status=U is REQUIRED for soldPrice statistics per Repliers API
    // grp-mth groups the statistics by month
    // Use county filter to capture ALL Nantucket neighborhoods
    const soldData = await repliersGet<StatisticsResponse>("/listings", {
      county: "Nantucket",      // County captures all island neighborhoods
      status: "U",              // Required: Only sold/unavailable listings
      minSoldDate: minSoldDate, // Filter by sold date range
      maxSoldDate: new Date().toISOString().split("T")[0],
      statistics: "med-soldPrice,avg-soldPrice,med-daysOnMarket,cnt-closed,grp-mth",
      listings: "false",        // Statistics only, faster response
    });

    // Also fetch active listing stats grouped by month for comparison
    // This uses listDate for grouping
    let activeData: StatisticsResponse = { statistics: {} };
    try {
      activeData = await repliersGet<StatisticsResponse>("/listings", {
        county: "Nantucket",  // County captures all island neighborhoods
        status: "A",
        minListDate: minSoldDate,
        statistics: "med-listPrice,avg-listPrice,cnt-new,grp-mth",
        listings: "false",
      });
    } catch (e) {
      console.log("Active data fetch failed, continuing with sold only:", e);
    }

    // Merge monthly data from sold statistics
    const history: MonthlyData[] = [];
    const soldMonthly = soldData.statistics?.soldPrice?.mth;

    if (soldMonthly && Object.keys(soldMonthly).length > 0) {
      // Process monthly sold data
      Object.entries(soldMonthly).forEach(([monthKey, data]) => {
        // monthKey format: "YYYY-MM"
        const [yearStr, monthStr] = monthKey.split("-");
        const year = parseInt(yearStr);
        const monthIndex = parseInt(monthStr) - 1;

        // Get days on market for this month if available
        const domMonthly = soldData.statistics?.daysOnMarket?.mth;
        const domData = domMonthly?.[monthKey];

        history.push({
          month: monthNames[monthIndex],
          year: year,
          monthKey: monthKey,
          medianPrice: data.med ?? 0,
          avgPrice: data.avg ?? 0,
          soldCount: data.count ?? 0,
          medianDaysOnMarket: domData?.med ?? 0,
        });
      });

      // Sort by date
      history.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    }

    // If we got good data, return it
    if (history.length > 0) {
      return NextResponse.json({
        data: history,
        isFallback: false,
        totalSold: soldData.count,
        overallMedianPrice: soldData.statistics?.soldPrice?.med,
        source: "repliers-statistics-api",
      });
    }

    // Fallback to generated data if API doesn't return sufficient historical data
    const fallbackHistory = generateFallbackHistory(years);
    return NextResponse.json({
      data: fallbackHistory,
      isFallback: true,
      message: "Historical sold data not available from API; showing estimated trends",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Market history API error:", message);

    // Return fallback data on error
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
 * Used when API doesn't have sufficient historical depth
 */
function generateFallbackHistory(years: number): MonthlyData[] {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const history: MonthlyData[] = [];

  // Base values (realistic for Nantucket luxury market)
  const basePrice = 2800000;
  const seasonalMultipliers = [0.92, 0.94, 0.98, 1.02, 1.08, 1.12, 1.15, 1.12, 1.05, 0.98, 0.95, 0.93];
  const yearlyAppreciation = 0.05; // 5% annual appreciation

  for (let y = currentYear - years; y <= currentYear; y++) {
    const yearFactor = Math.pow(1 + yearlyAppreciation, y - (currentYear - years));

    for (let m = 0; m < 12; m++) {
      // Don't include future months
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
        soldCount: Math.round(15 + Math.random() * 20 + seasonalMultipliers[m] * 10),
        medianDaysOnMarket: Math.round(90 + (1 - seasonalMultipliers[m]) * 60 + Math.random() * 30),
      });
    }
  }

  return history;
}
