import { NextResponse } from "next/server";
import { repliersFetch } from "@/lib/repliers";

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

    // This payload uses the Repliers Listings Search with aggregates to compute market stats.
    const body = {
      filters: {
        locations: [
          {
            keywords: [location],
          },
        ],
      },
      aggregates: {
        statistics: [
          "medianListPrice",
          "medianDaysOnMarket",
          "activeListingCount",
          "totalSalesVolume",
        ],
      },
      limit: 0, // no listings needed, just aggregates
    };

    const data = await repliersFetch<unknown>("/v2/listings/search", {
      method: "POST",
      body,
    });

    return NextResponse.json({ data });
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
