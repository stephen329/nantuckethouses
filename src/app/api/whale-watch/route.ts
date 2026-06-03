import { NextResponse } from "next/server";
import { fetchAllListings } from "@/lib/cnc-api";

export const revalidate = 86400; // 24 hours

/**
 * GET /api/whale-watch
 *
 * Returns the top 5 highest-priced sales YTD from the C&C API.
 */
export async function GET() {
  try {
    // Calculate days since Jan 1 of current year
    const now = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const daysSinceJan1 = Math.ceil(
      (now.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24)
    );

    const sold = await fetchAllListings({
      status: "S",
      close_date: daysSinceJan1,
    });

    const top5 = sold
      .filter((l) => l.ClosePrice && l.ClosePrice > 0)
      .sort((a, b) => (b.ClosePrice ?? 0) - (a.ClosePrice ?? 0))
      .slice(0, 5)
      .map((l) => ({
        address: [l.StreetNumber, l.StreetName].filter(Boolean).join(" "),
        closePrice: l.ClosePrice!,
        listPrice: l.ListPrice,
        closeDate: l.CloseDate!,
        neighborhood: l.MLSAreaMajor ?? "Unknown",
        linkListingId:
          l.link_id != null && l.link_id > 0 ? String(l.link_id) : undefined,
      }));

    return NextResponse.json({
      data: top5,
      year: now.getFullYear(),
      totalYtdSales: sold.length,
      source: "cnc-api",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Whale watch API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
