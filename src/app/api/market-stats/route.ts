import { NextResponse } from "next/server";
import { repliersFetch } from "@/lib/repliers";

type Listing = {
  listPrice?: number;
  daysOnMarket?: number;
  listDate?: string;
};

type RepliersResponse = {
  count?: number;
  statistics?: {
    listPrice?: {
      min?: number;
      max?: number;
    };
  };
  listings?: Listing[];
};

// Thin API route to fetch market statistics from Repliers.
// Accepts optional `location` search param (defaults to "Nantucket, MA").
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location") ?? "Nantucket, MA";

  try {
    const apiKey = process.env.REPLIERS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing REPLIERS_API_KEY on the server" },
        { status: 500 }
      );
    }

    // Fetch active listings to calculate market stats
    const body = {
      city: location,
      status: "A", // Active listings
      pageNum: 1,
      resultsPerPage: 100, // Get listings to calculate stats
    };

    const data = await repliersFetch<RepliersResponse>("/listings", {
      method: "POST",
      body,
    });

    // Calculate market statistics from the response
    const listings = data.listings || [];
    const prices = listings
      .map((l) => l.listPrice)
      .filter((p): p is number => typeof p === "number" && p > 0)
      .sort((a, b) => a - b);

    // Calculate days on market from listDate
    const now = new Date();
    const daysOnMarket = listings
      .map((l) => {
        if (!l.listDate) return null;
        const listDate = new Date(l.listDate);
        const days = Math.floor(
          (now.getTime() - listDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return days >= 0 ? days : null;
      })
      .filter((d): d is number => d !== null)
      .sort((a, b) => a - b);

    // Calculate median
    const median = (arr: number[]) => {
      if (arr.length === 0) return null;
      const mid = Math.floor(arr.length / 2);
      return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
    };

    const stats = {
      activeListingCount: data.count || listings.length,
      medianListPrice: median(prices),
      medianDaysOnMarket: median(daysOnMarket),
    };

    return NextResponse.json({ data: { aggregates: stats } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      {
        status: 500,
      }
    );
  }
}
