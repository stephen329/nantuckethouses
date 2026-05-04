import { NextResponse } from "next/server";
import { getListingDetailPayload } from "@/lib/get-listing-detail";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/listings/:id/detail
 *
 * Full listing + benchmark payload for the intelligence detail page (mobile / client refetch).
 * `id` is the numeric LINK listing id (same as /listings/[id]).
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const data = await getListingDetailPayload(id);
    if (!data) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("listing detail API:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
