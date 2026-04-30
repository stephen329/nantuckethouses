import { NextResponse } from "next/server";
import { fetchAllListings, fetchListings, median } from "@/lib/cnc-api";

export async function GET() {
  try {
    const activeListings = await fetchListings({ status: "A", limit: 1 });

    const soldListings6mo = await fetchAllListings({ status: "S", close_date: 180 });
    const closePrices = soldListings6mo
      .map((l) => l.ClosePrice)
      .filter((p): p is number => typeof p === "number" && p > 0);

    const soldListings12mo = await fetchAllListings({ status: "S", close_date: 365 });
    const domValues = soldListings12mo
      .filter((l) => l.OnMarketDate && l.CloseDate)
      .map((l) => {
        const ms = new Date(l.CloseDate!).getTime() - new Date(l.OnMarketDate!).getTime();
        return Math.round(ms / (1000 * 60 * 60 * 24));
      })
      .filter((d) => d >= 0 && d < 1000);

    const monthBuckets = new Map<string, number>();
    for (const l of soldListings12mo) {
      if (!l.CloseDate) continue;
      const d = new Date(l.CloseDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + 1);
    }
    const monthlyCounts = Array.from(monthBuckets.values());
    const avgMonthlySales =
      monthlyCounts.length > 0
        ? monthlyCounts.reduce((sum, count) => sum + count, 0) / monthlyCounts.length
        : 0;

    const absorptionRate =
      avgMonthlySales > 0 ? activeListings.count / avgMonthlySales : null;

    return NextResponse.json({
      data: {
        activeInventory: activeListings.count,
        medianSalePrice6mo: median(closePrices),
        medianDaysOnMarket12mo: median(domValues),
        absorptionRate: absorptionRate ? Math.round(absorptionRate * 10) / 10 : null,
      },
      source: "cnc-api",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Pulse summary error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
