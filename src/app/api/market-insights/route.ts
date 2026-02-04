import { NextResponse } from "next/server";

type MonthlyData = {
  monthKey: string;
  year: number;
  medianPrice: number;
  soldCount: number;
  medianDaysOnMarket: number;
};

type MarketHistoryResponse = {
  data?: MonthlyData[];
  isFallback?: boolean;
  error?: string;
};

type MarketStatsResponse = {
  data?: {
    aggregates?: {
      activeListingCount?: number;
      medianListPrice?: number;
      medianDaysOnMarket?: number;
    };
  };
  error?: string;
};

export const dynamic = "force-dynamic";

/**
 * GET /api/market-insights
 *
 * Fetches market-stats and market-history, then computes short narrative
 * statements about trends and anomalies for the homepage.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;

  try {
    const [historyRes, statsRes] = await Promise.all([
      fetch(`${origin}/api/market-history?years=2`, { cache: "no-store" }),
      fetch(`${origin}/api/market-stats`, { cache: "no-store" }),
    ]);

    const historyJson = (await historyRes.json()) as MarketHistoryResponse;
    const statsJson = (await statsRes.json()) as MarketStatsResponse;

    const history = historyJson.data ?? [];
    const aggregates = statsJson.data?.aggregates ?? {};
    const insights: { type: "trend" | "anomaly"; statement: string }[] = [];

    if (history.length < 3) {
      return NextResponse.json({
        insights: [
          {
            type: "trend" as const,
            statement:
              "Market insights are being updated as more historical data becomes available from the Repliers feed.",
          },
        ],
        source: "repliers",
      });
    }

    // Sort by date
    const sorted = [...history].sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey)
    );

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1–12

    // --- TRENDS (comparisons vs prior period) ---

    // Last 3 complete months vs same 3 months last year (price)
    const recentMonths = sorted
      .filter((m) => {
        const [y, mo] = m.monthKey.split("-").map(Number);
        return y === currentYear && mo <= currentMonth;
      })
      .slice(-3);
    const last3Keys = recentMonths.map((m) => m.monthKey);
    const last3 = sorted.filter((m) => last3Keys.includes(m.monthKey));
    // Same calendar months, prior year (e.g. 2024-10, 2024-11, 2024-12)
    const priorYearKeys = last3Keys.map(
      (k) => `${currentYear - 1}-${k.split("-")[1]}`
    );
    const priorYear3 = sorted.filter((m) => priorYearKeys.includes(m.monthKey));

    if (last3.length && priorYear3.length) {
      const recentMed =
        last3.reduce((s, m) => s + m.medianPrice, 0) / last3.length;
      const priorMed =
        priorYear3.reduce((s, m) => s + m.medianPrice, 0) / priorYear3.length;
      if (priorMed > 1000) {
        const pctChange = ((recentMed - priorMed) / priorMed) * 100;
        const cappedChange = Math.min(50, Math.max(-50, pctChange));
        const direction =
          cappedChange > 2 ? "up" : cappedChange < -2 ? "down" : "flat";
        if (direction !== "flat") {
          insights.push({
            type: "trend",
            statement: `Median sold price is ${direction === "up" ? "up" : "down"} ${Math.abs(cappedChange).toFixed(1)}% year-over-year for the same three-month period—based on closed sales from the Repliers MLS feed.`,
          });
        }
      }
    }

    // Days on market: recent 3 months vs 12-month average
    // Only compute when we have reliable DOM data (Repliers often returns 0 for recent months until closed)
    const last12 = sorted.slice(-12);
    const avgDom12 =
      last12.reduce((s, m) => s + m.medianDaysOnMarket, 0) / last12.length;
    const recentDom =
      last3.length > 0
        ? last3.reduce((s, m) => s + m.medianDaysOnMarket, 0) / last3.length
        : 0;
    const recentDomValid =
      recentDom >= 7 && avgDom12 >= 7 && last3.some((m) => m.medianDaysOnMarket >= 1);
    if (recentDomValid) {
      const domPct = ((recentDom - avgDom12) / avgDom12) * 100;
      // Cap at 60% so we never show absurd values (e.g. "100% below" from zeros)
      const cappedPct = Math.min(60, Math.max(-60, domPct));
      if (cappedPct <= -15) {
        insights.push({
          type: "trend",
          statement: `Days on market have shortened recently—about ${Math.abs(cappedPct).toFixed(0)}% below the last 12 months' average—suggesting a quicker-moving segment of the market.`,
        });
      } else if (cappedPct >= 15) {
        insights.push({
          type: "trend",
          statement: `Properties are taking longer to sell lately—roughly ${cappedPct.toFixed(0)}% above the 12-month average days on market.`,
        });
      }
    }

    // Current inventory (from market-stats)
    const activeCount = aggregates.activeListingCount;
    if (typeof activeCount === "number") {
      const avgSoldPerMonth =
        last12.length > 0
          ? last12.reduce((s, m) => s + m.soldCount, 0) / last12.length
          : 0;
      if (avgSoldPerMonth >= 1) {
        const monthsSupply = activeCount / avgSoldPerMonth;
        if (monthsSupply <= 4) {
          insights.push({
            type: "trend",
            statement: `At current sales velocity, active listing count suggests a relatively tight market (under ~${Math.round(monthsSupply)} months of supply).`,
          });
        } else if (monthsSupply >= 8) {
          insights.push({
            type: "trend",
            statement: `Current inventory levels imply a more balanced or buyer-friendly pace (roughly ${Math.round(monthsSupply)} months of supply at recent sales rates).`,
          });
        }
      }
    }

    // --- ANOMALIES (unusual data points) ---

    // Price anomaly: any month >25% above or below 12-month rolling median
    const rolling12 = sorted.slice(-12);
    const medianPrice12 =
      rolling12.length > 0
        ? [...rolling12]
            .sort((a, b) => a.medianPrice - b.medianPrice)[
            Math.floor(rolling12.length / 2)
          ].medianPrice
        : 0;
    for (const m of rolling12) {
      if (medianPrice12 <= 0) continue;
      const pct = ((m.medianPrice - medianPrice12) / medianPrice12) * 100;
      if (pct >= 25) {
        insights.push({
          type: "anomaly",
          statement: `${m.monthKey}: median sold price was about ${pct.toFixed(0)}% above the 12-month median—a notable spike that may reflect composition (e.g. high-end closings) or seasonal effects.`,
        });
        break; // one anomaly per type
      }
      if (pct <= -25) {
        insights.push({
          type: "anomaly",
          statement: `${m.monthKey}: median sold price was about ${Math.abs(pct).toFixed(0)}% below the 12-month median—worth watching for seasonal or compositional shifts.`,
        });
        break;
      }
    }

    // Volume anomaly: month with unusually high or low closed count
    const avgCount12 =
      last12.length > 0
        ? last12.reduce((s, m) => s + m.soldCount, 0) / last12.length
        : 0;
    const stdCount =
      last12.length > 1
        ? Math.sqrt(
            last12.reduce(
              (s, m) => s + (m.soldCount - avgCount12) ** 2,
              0
            ) / (last12.length - 1)
          )
        : 0;
    for (const m of last12.slice(-3)) {
      if (stdCount < 1) break;
      const z = (m.soldCount - avgCount12) / stdCount;
      if (z >= 1.8) {
        insights.push({
          type: "anomaly",
          statement: `Closed sales in ${m.monthKey} were well above the recent average—an unusually active month in the Repliers data.`,
        });
        break;
      }
      if (z <= -1.8) {
        insights.push({
          type: "anomaly",
          statement: `Closed sales in ${m.monthKey} were notably below the recent average—a quieter month in the data.`,
        });
        break;
      }
    }

    return NextResponse.json({
      insights,
      source: "repliers",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Market insights API error:", message);
    return NextResponse.json(
      {
        insights: [
          {
            type: "trend" as const,
            statement:
              "Live market insights are temporarily unavailable. Data is powered by the Repliers MLS feed.",
          },
        ],
        error: message,
      },
      { status: 200 }
    );
  }
}
