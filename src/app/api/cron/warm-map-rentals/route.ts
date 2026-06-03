import { NextResponse } from "next/server";

import { warmMapRentalsInventory } from "@/lib/map-rentals-inventory-cache";

export const runtime = "nodejs";

/**
 * GET /api/cron/warm-map-rentals
 * Warms Next.js unstable_cache for the full NR map inventory (see map-rentals-inventory-cache).
 *
 * Vercel Cron: set CRON_SECRET and add schedule in vercel.json. The platform sends
 * Authorization: Bearer <CRON_SECRET> when that env var is set.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }

  try {
    const { count } = await warmMapRentalsInventory();
    return NextResponse.json({ ok: true, activeRows: count });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Warm failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
