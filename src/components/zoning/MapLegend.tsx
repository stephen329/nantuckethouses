"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type MapLegendProps = {
  /** When true, show green dot for active vacation rentals (property map). */
  showRentalsLegend?: boolean;
  /** When true, show LINK active (blue) and sold (gray) pins (property map). */
  showLinkPinsLegend?: boolean;
};

function PinLegendRows({
  showRentalsLegend,
  showLinkPinsLegend,
  soldLabel,
}: {
  showRentalsLegend: boolean;
  showLinkPinsLegend: boolean;
  soldLabel: string;
}) {
  return (
    <>
      {showRentalsLegend ? (
        <div
          className={
            showLinkPinsLegend
              ? "mb-2 flex items-center gap-2 border-b border-[var(--cedar-shingle)]/15 pb-2"
              : "flex items-center gap-2"
          }
        >
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600" />
          <span>Active vacation rentals</span>
        </div>
      ) : null}
      {showLinkPinsLegend ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
            <span>LINK — for sale</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400" />
            <span>{soldLabel}</span>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function MapLegend({ showRentalsLegend = false, showLinkPinsLegend = false }: MapLegendProps) {
  const [open, setOpen] = useState(false);

  if (!showRentalsLegend && !showLinkPinsLegend) {
    return null;
  }

  return (
    <>
      <div className="hidden rounded-md border bg-white/95 p-2 text-xs shadow md:block">
        <p className="mb-2 font-semibold text-[var(--atlantic-navy)]">Pins</p>
        <PinLegendRows
          showRentalsLegend={showRentalsLegend}
          showLinkPinsLegend={showLinkPinsLegend}
          soldLabel="Sold Listings (matched to lot)"
        />
      </div>

      <div className="md:hidden">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen((prev) => !prev)}>
          Legend
        </Button>
        {open ? (
          <div className="mt-2 rounded-md border bg-white p-2 text-xs shadow">
            <p className="mb-2 font-semibold text-[var(--atlantic-navy)]">Pins</p>
            <PinLegendRows
              showRentalsLegend={showRentalsLegend}
              showLinkPinsLegend={showLinkPinsLegend}
              soldLabel="Sold Listings"
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
