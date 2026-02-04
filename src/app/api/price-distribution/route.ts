import { NextResponse } from "next/server";
import { repliersGet } from "@/lib/repliers";

/**
 * Response type for listings endpoint
 */
type ListingsResponse = {
  count?: number;
  listings?: Array<{
    listPrice?: number;
    mlsNumber?: string;
  }>;
};

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
 * Fetches actual active listings from Repliers and calculates real price distribution.
 * This gives accurate counts per price bracket based on current inventory.
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

    // Fetch active listings - we need actual list prices
    // Request only the fields we need to minimize response size
    // Use county filter to capture ALL Nantucket neighborhoods
    const data = await repliersGet<ListingsResponse>("/listings", {
      county: "Nantucket",  // County captures all island neighborhoods
      status: "A", // Active listings only
      resultsPerPage: 500, // Get all listings
      fields: "listPrice,mlsNumber", // Only fetch price data
    });

    const listings = data.listings || [];
    const prices = listings
      .map(l => l.listPrice)
      .filter((p): p is number => typeof p === "number" && p > 0);

    const totalCount = prices.length;

    // Nantucket-specific luxury market brackets
    const brackets: PriceBracket[] = [
      { label: "Entry (< $2M)", min: 0, max: 2000000, count: 0, percentage: 0 },
      { label: "Core ($2M-$5M)", min: 2000000, max: 5000000, count: 0, percentage: 0 },
      { label: "High-End ($5M-$10M)", min: 5000000, max: 10000000, count: 0, percentage: 0 },
      { label: "Ultra-Luxury ($10M+)", min: 10000000, max: Infinity, count: 0, percentage: 0 },
    ];

    // Count listings in each bracket
    prices.forEach(price => {
      for (const bracket of brackets) {
        if (price >= bracket.min && price < bracket.max) {
          bracket.count++;
          break;
        }
      }
    });

    // Calculate percentages
    brackets.forEach(bracket => {
      bracket.percentage = totalCount > 0 
        ? Math.round((bracket.count / totalCount) * 100) 
        : 0;
    });

    // Filter out empty brackets and format response
    const distribution = brackets
      .filter(b => b.count > 0)
      .map(b => ({
        range: b.label,
        count: b.count,
        percentage: b.percentage,
      }));

    return NextResponse.json({
      data: distribution,
      totalListings: totalCount,
      source: "repliers-active-listings",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Price distribution API error:", message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
