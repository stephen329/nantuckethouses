import { NextResponse } from "next/server";
import {
  appendSnapshotIfMissing,
  buildPreviousMonthSnapshot,
  readInventoryHistory,
} from "@/lib/inventory-history";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return unauthorized();
  }

  const now = new Date();
  const isFirstOfMonth = now.getDate() === 1;
  const force = new URL(request.url).searchParams.get("force") === "1";
  if (!isFirstOfMonth && !force) {
    return NextResponse.json({
      skipped: true,
      reason: "Runs on first day of month unless force=1",
    });
  }

  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const history = await readInventoryHistory();
  const lastEndingInventory =
    history.snapshots[history.snapshots.length - 1]?.activity.endingInventory ?? 0;

  const snapshot = await buildPreviousMonthSnapshot(
    previousMonthDate,
    lastEndingInventory,
  );
  const result = await appendSnapshotIfMissing(snapshot);

  return NextResponse.json({
    ok: true,
    written: result.written,
    monthKey: snapshot.monthKey,
    latestCount: result.data.snapshots.length,
  });
}
