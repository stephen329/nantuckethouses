import inventoryHistory from "@/data/inventory-history.json";
import { InventoryHistoryChart } from "@/components/charts/InventoryHistoryChart";
import type { InventoryHistoryData } from "@/types";

function fmt(value: number | null): string {
  if (value === null) return "n/a";
  return String(value);
}

export default function InventoryTrackerPage() {
  const data = inventoryHistory as InventoryHistoryData;
  const latest = data.snapshots[data.snapshots.length - 1];
  const rows = [...data.snapshots].reverse();

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-white/60 text-xs uppercase tracking-[0.25em] font-semibold mb-2 font-sans">
            Market Pulse
          </p>
          <h1 className="text-white text-3xl sm:text-4xl">Inventory Tracker</h1>
          <p className="text-white/55 mt-2 text-sm max-w-2xl">
            Monthly inventory activity and absorption snapshots. Updated automatically on
            the 1st for the prior month.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-[var(--nantucket-gray)] mb-3 font-sans">
            Latest month: <span className="text-[var(--atlantic-navy)] font-medium">{latest?.label ?? "-"}</span>
          </p>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="brand-surface p-5">
              <p className="text-xs uppercase tracking-wider text-[var(--nantucket-gray)] font-sans">
                Ending Inventory
              </p>
              <p className="text-xl text-[var(--atlantic-navy)] mt-1">
                {latest?.activity.endingInventory ?? 0}
              </p>
            </div>
            <div className="brand-surface p-5">
              <p className="text-xs uppercase tracking-wider text-[var(--nantucket-gray)] font-sans">
                New Listings
              </p>
              <p className="text-xl text-[var(--atlantic-navy)] mt-1">
                {latest?.activity.newListings ?? 0}
              </p>
            </div>
            <div className="brand-surface p-5">
              <p className="text-xs uppercase tracking-wider text-[var(--nantucket-gray)] font-sans">
                Sold
              </p>
              <p className="text-xl text-[var(--atlantic-navy)] mt-1">
                {latest?.activity.sold ?? 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <InventoryHistoryChart snapshots={data.snapshots} />
          </div>
          <div className="overflow-x-auto bg-white rounded-lg border border-[var(--cedar-shingle)]/15">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--sandstone)]">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">Month</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">Start</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">End</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">New</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">Sold</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">Res Absorb</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">Land Absorb</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">Comm Absorb</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((snapshot) => (
                  <tr key={snapshot.monthKey} className="border-t border-[var(--cedar-shingle)]/10">
                    <td className="px-4 py-3 font-medium text-[var(--atlantic-navy)]">{snapshot.label}</td>
                    <td className="px-4 py-3 text-right text-[var(--atlantic-navy)]/80">{snapshot.activity.startingInventory}</td>
                    <td className="px-4 py-3 text-right text-[var(--atlantic-navy)]/80">{snapshot.activity.endingInventory}</td>
                    <td className="px-4 py-3 text-right text-[var(--atlantic-navy)]/80">{snapshot.activity.newListings}</td>
                    <td className="px-4 py-3 text-right text-[var(--atlantic-navy)]/80">{snapshot.activity.sold}</td>
                    <td className="px-4 py-3 text-right text-[var(--atlantic-navy)]/80">{fmt(snapshot.segments.residential.absorptionMonths)}</td>
                    <td className="px-4 py-3 text-right text-[var(--atlantic-navy)]/80">{fmt(snapshot.segments.land.absorptionMonths)}</td>
                    <td className="px-4 py-3 text-right text-[var(--atlantic-navy)]/80">{fmt(snapshot.segments.commercial.absorptionMonths)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--nantucket-gray)] mt-3">
            Last updated {new Date(data.updatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.
          </p>
        </div>
      </section>
    </div>
  );
}
