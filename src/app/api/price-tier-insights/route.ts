import { NextResponse } from "next/server";
import { fetchAllListings } from "@/lib/cnc-api";

type Tier = {
  label: string;
  persona: string;
  min: number;
  max: number;
};

const TIERS: Tier[] = [
  { label: "$0-$2M", persona: "Entry / Workforce / Condo", min: 0, max: 2_000_000 },
  { label: "$2M-$5M", persona: "Core Residential", min: 2_000_000, max: 5_000_000 },
  { label: "$5M-$10M", persona: "Luxury Move-Up", min: 5_000_000, max: 10_000_000 },
  { label: "$10M+", persona: "Trophy / UHNW", min: 10_000_000, max: Number.POSITIVE_INFINITY },
];

function inTier(value: number, tier: Tier): boolean {
  return value >= tier.min && value < tier.max;
}

export async function GET() {
  try {
    const now = new Date();
    const currentWindowStart = new Date(now);
    currentWindowStart.setDate(currentWindowStart.getDate() - 365);

    const previousWindowStart = new Date(currentWindowStart);
    previousWindowStart.setDate(previousWindowStart.getDate() - 365);

    const [activeListings, soldListings] = await Promise.all([
      fetchAllListings({ status: "A" }),
      fetchAllListings({ status: "S", close_date: 730 }),
    ]);

    const activePrices = activeListings
      .map((l) => l.ListPrice)
      .filter((v): v is number => typeof v === "number" && v > 0);
    const activeTotal = activePrices.length;

    const currentSold = soldListings.filter((l) => {
      if (!l.CloseDate || !l.ClosePrice) return false;
      const d = new Date(l.CloseDate);
      return d >= currentWindowStart && d <= now;
    });
    const previousSold = soldListings.filter((l) => {
      if (!l.CloseDate || !l.ClosePrice) return false;
      const d = new Date(l.CloseDate);
      return d >= previousWindowStart && d < currentWindowStart;
    });

    const data = TIERS.map((tier) => {
      const activeCount = activePrices.filter((p) => inTier(p, tier)).length;
      const sharePct =
        activeTotal > 0 ? Math.round((activeCount / activeTotal) * 100) : 0;

      const currentSoldCount = currentSold.filter((l) => inTier(l.ClosePrice!, tier)).length;
      const previousSoldCount = previousSold.filter((l) => inTier(l.ClosePrice!, tier)).length;
      const yoyPct =
        previousSoldCount > 0
          ? Math.round(((currentSoldCount - previousSoldCount) / previousSoldCount) * 100)
          : null;

      return {
        range: tier.label,
        persona: tier.persona,
        activeCount,
        sharePct,
        yoyPct,
      };
    });

    return NextResponse.json({
      data,
      lastUpdated: now.toISOString(),
      source: "link-mls-broker-aggregates",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Price tier insights error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
