import { fetchAllListings, fetchListings, median, average } from "@/lib/cnc-api";
import { PulseDashboard } from "@/components/home/PulseDashboard";
import { VibeMeter } from "@/components/home/VibeMeter";
import { WhaleWatch } from "@/components/home/WhaleWatch";
import { BoardWatch } from "@/components/home/BoardWatch";
import { Teasers } from "@/components/home/Teasers";
import { OpportunityDesk } from "@/components/home/OpportunityDesk";
import { NewsletterSignup } from "@/components/home/NewsletterSignup";
import { CTASection } from "@/components/home/CTASection";
import type { PulseStats, VibeMeterData, WhaleWatchSale, StephensTake, BoardWatchData } from "@/types";

// Import fallback data
import vibeMeterFallback from "@/data/vibe-meter.json";
import whaleWatchFallback from "@/data/whale-watch.json";
import boardWatchFallback from "@/data/board-watch.json";

export const revalidate = 3600; // 1 hour for market data

async function getPulseStats(): Promise<PulseStats> {
  try {
    // Active inventory count
    const activeListings = await fetchListings({ status: "A", limit: 1 });

    // Sold listings last 6 months (for median sale price)
    const soldListings6mo = await fetchAllListings({ status: "S", close_date: 180 });
    const closePrices = soldListings6mo
      .map((l) => l.ClosePrice)
      .filter((p): p is number => typeof p === "number" && p > 0);

    // Sold listings last 12 months (for absorption rate)
    const soldListings12mo = await fetchAllListings({ status: "S", close_date: 365 });

    // Group by month to get avg monthly sales
    const monthBuckets = new Map<string, number>();
    for (const l of soldListings12mo) {
      if (!l.CloseDate) continue;
      const d = new Date(l.CloseDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + 1);
    }
    const monthlyCounts = Array.from(monthBuckets.values());
    const avgMonthlySales = monthlyCounts.length > 0
      ? monthlyCounts.reduce((s, c) => s + c, 0) / monthlyCounts.length
      : 0;

    const absorptionRate = avgMonthlySales > 0
      ? activeListings.count / avgMonthlySales
      : null;

    return {
      activeInventory: activeListings.count,
      medianSalePrice6mo: median(closePrices),
      costPerSqFtRange: "$450\u2013$800+",
      absorptionRate: absorptionRate ? Math.round(absorptionRate * 10) / 10 : null,
    };
  } catch (error) {
    console.error("Failed to fetch pulse stats:", error);
    return {
      activeInventory: 0,
      medianSalePrice6mo: null,
      costPerSqFtRange: "$450\u2013$800+",
      absorptionRate: null,
    };
  }
}

async function getWhaleWatchSales(): Promise<WhaleWatchSale[]> {
  try {
    const now = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const daysSinceJan1 = Math.ceil(
      (now.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24)
    );

    const sold = await fetchAllListings({ status: "S", close_date: daysSinceJan1 });

    return sold
      .filter((l) => l.ClosePrice && l.ClosePrice > 0)
      .sort((a, b) => (b.ClosePrice ?? 0) - (a.ClosePrice ?? 0))
      .slice(0, 5)
      .map((l) => ({
        address: [l.StreetNumber, l.StreetName].filter(Boolean).join(" "),
        closePrice: l.ClosePrice!,
        listPrice: l.ListPrice,
        closeDate: l.CloseDate!,
        neighborhood: l.MLSAreaMajor ?? "Unknown",
      }));
  } catch (error) {
    console.error("Failed to fetch whale watch:", error);
    return [];
  }
}

export default async function Home() {
  const [pulseStats, whaleWatchSales] = await Promise.all([
    getPulseStats(),
    getWhaleWatchSales(),
  ]);

  const vibeMeterData: VibeMeterData = vibeMeterFallback as VibeMeterData;
  const stephensTake: StephensTake = whaleWatchFallback.stephensTake as StephensTake;
  const boardWatchData: BoardWatchData = boardWatchFallback as BoardWatchData;

  return (
    <>
      <PulseDashboard stats={pulseStats} />
      <VibeMeter data={vibeMeterData} />
      <WhaleWatch
        sales={whaleWatchSales}
        stephensTake={stephensTake}
        year={new Date().getFullYear()}
      />
      <BoardWatch data={boardWatchData} />
      <Teasers />
      <OpportunityDesk />
      <NewsletterSignup />
      <CTASection />
    </>
  );
}
