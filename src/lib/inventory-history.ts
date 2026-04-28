import fs from "node:fs/promises";
import path from "node:path";
import { fetchAllListings } from "@/lib/cnc-api";
import type {
  InventoryHistoryData,
  MonthlyInventorySnapshot,
  InventoryActivitySnapshot,
} from "@/types";
import inventoryHistorySeed from "@/data/inventory-history.json";

const INVENTORY_HISTORY_PATH = path.join(
  process.cwd(),
  "src/data/inventory-history.json",
);

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function inMonth(dateStr: string | undefined, start: Date, end: Date): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start && d < end;
}

function asActivityWithZeros(
  partial: Partial<InventoryActivitySnapshot>,
): InventoryActivitySnapshot {
  return {
    startingInventory: partial.startingInventory ?? 0,
    endingInventory: partial.endingInventory ?? 0,
    newListings: partial.newListings ?? 0,
    returnToMarket: partial.returnToMarket ?? 0,
    priceChanges: partial.priceChanges ?? 0,
    offMarket: partial.offMarket ?? 0,
    offerToPurchase: partial.offerToPurchase ?? 0,
    pAndS: partial.pAndS ?? 0,
    sold: partial.sold ?? 0,
    foreclosures: partial.foreclosures ?? 0,
  };
}

export async function readInventoryHistory(): Promise<InventoryHistoryData> {
  try {
    const raw = await fs.readFile(INVENTORY_HISTORY_PATH, "utf-8");
    return JSON.parse(raw) as InventoryHistoryData;
  } catch {
    return inventoryHistorySeed as InventoryHistoryData;
  }
}

export async function writeInventoryHistory(data: InventoryHistoryData): Promise<void> {
  await fs.writeFile(INVENTORY_HISTORY_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function classifyPropertyType(type: string | undefined): "residential" | "land" | "commercial" {
  const value = (type ?? "").toLowerCase();
  if (value.includes("land") || value.includes("lot")) return "land";
  if (value.includes("commercial")) return "commercial";
  return "residential";
}

export async function buildPreviousMonthSnapshot(
  priorMonthDate: Date,
  startingInventory: number,
): Promise<MonthlyInventorySnapshot> {
  const start = new Date(priorMonthDate.getFullYear(), priorMonthDate.getMonth(), 1);
  const end = new Date(priorMonthDate.getFullYear(), priorMonthDate.getMonth() + 1, 1);

  const [active, soldRecent] = await Promise.all([
    fetchAllListings({ status: "A" }),
    fetchAllListings({ status: "S", close_date: 400 }),
  ]);

  const soldInMonth = soldRecent.filter((l) => inMonth(l.CloseDate, start, end));
  const newListingsInMonth = [...active, ...soldRecent].filter((l) =>
    inMonth(l.OnMarketDate, start, end),
  );

  const residentialInventory = active.filter(
    (l) => classifyPropertyType(l.PropertyType) === "residential",
  ).length;
  const landInventory = active.filter(
    (l) => classifyPropertyType(l.PropertyType) === "land",
  ).length;
  const commercialInventory = active.filter(
    (l) => classifyPropertyType(l.PropertyType) === "commercial",
  ).length;

  const endingInventory = active.length;
  const soldCount = soldInMonth.length;

  return {
    monthKey: monthKey(start),
    label: monthLabel(start),
    source: "auto-monthly",
    activity: asActivityWithZeros({
      startingInventory,
      endingInventory,
      newListings: newListingsInMonth.length,
      sold: soldCount,
    }),
    segments: {
      residential: {
        inventoryCount: residentialInventory,
        absorptionMonths:
          soldCount > 0 ? Number((residentialInventory / soldCount).toFixed(1)) : null,
      },
      land: {
        inventoryCount: landInventory,
        absorptionMonths: soldCount > 0 ? Number((landInventory / soldCount).toFixed(1)) : null,
      },
      commercial: {
        inventoryCount: commercialInventory,
        absorptionMonths:
          soldCount > 0 ? Number((commercialInventory / soldCount).toFixed(1)) : null,
      },
    },
  };
}

export async function appendSnapshotIfMissing(
  snapshot: MonthlyInventorySnapshot,
): Promise<{ written: boolean; data: InventoryHistoryData }> {
  const current = await readInventoryHistory();
  if (current.snapshots.some((s) => s.monthKey === snapshot.monthKey)) {
    return { written: false, data: current };
  }

  const next: InventoryHistoryData = {
    updatedAt: new Date().toISOString(),
    snapshots: [...current.snapshots, snapshot].sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey),
    ),
  };
  await writeInventoryHistory(next);
  return { written: true, data: next };
}
