import { NextResponse } from "next/server";
import { fetchAllListings } from "@/lib/cnc-api";

type PriceBracket = {
  label: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
};

/**
 * GET /api/price-distribution
 *
 * Fetches active listings from the C&C API and calculates price distribution.
 */
export async function GET() {
  try {
    const activeListings = await fetchAllListings({ status: "A" });

    const prices = activeListings
      .map((l) => l.ListPrice)
      .filter((p): p is number => typeof p === "number" && p > 0);

    const totalCount = prices.length;

    // Nantucket-specific luxury market brackets
    const brackets: PriceBracket[] = [
      { label: "Entry (< $2M)", min: 0, max: 2000000, count: 0, percentage: 0 },
      { label: "Core ($2M-$5M)", min: 2000000, max: 5000000, count: 0, percentage: 0 },
      { label: "High-End ($5M-$10M)", min: 5000000, max: 10000000, count: 0, percentage: 0 },
      { label: "Ultra-Luxury ($10M+)", min: 10000000, max: Infinity, count: 0, percentage: 0 },
    ];

    prices.forEach((price) => {
      for (const bracket of brackets) {
        if (price >= bracket.min && price < bracket.max) {
          bracket.count++;
          break;
        }
      }
    });

    brackets.forEach((bracket) => {
      bracket.percentage =
        totalCount > 0
          ? Math.round((bracket.count / totalCount) * 100)
          : 0;
    });

    const distribution = brackets
      .filter((b) => b.count > 0)
      .map((b) => ({
        range: b.label,
        count: b.count,
        percentage: b.percentage,
      }));

    return NextResponse.json({
      data: distribution,
      totalListings: totalCount,
      source: "cnc-api",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Price distribution API error:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
