"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ZONING_COLOR_MAP } from "@/lib/zoning-colors";

const LEGEND_ITEMS = [
  { label: "R-40", color: ZONING_COLOR_MAP["R-40"] },
  { label: "R-10", color: ZONING_COLOR_MAP["R-10"] },
  { label: "R-5", color: ZONING_COLOR_MAP["R-5"] },
  { label: "ROH", color: ZONING_COLOR_MAP.ROH },
  { label: "LUG-1", color: ZONING_COLOR_MAP["LUG-1"] },
  { label: "LUG-2", color: ZONING_COLOR_MAP["LUG-2"] },
  { label: "CN", color: ZONING_COLOR_MAP.CN },
  { label: "RC", color: ZONING_COLOR_MAP.RC },
];

type MapLegendProps = {
  /** When true, show green dot for active vacation rentals (property map). */
  showRentalsLegend?: boolean;
  /** When true, show LINK active (blue) and sold (gray) pins (property map). */
  showLinkPinsLegend?: boolean;
};

export function MapLegend({ showRentalsLegend = false, showLinkPinsLegend = false }: MapLegendProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hidden rounded-md border bg-white/95 p-2 text-xs shadow md:block">
        <p className="mb-2 font-semibold text-[var(--atlantic-navy)]">Zoning Legend</p>
        {showRentalsLegend ? (
          <div className="mb-2 flex items-center gap-2 border-b border-[var(--cedar-shingle)]/15 pb-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600" />
            <span>Active vacation rentals</span>
          </div>
        ) : null}
        {showLinkPinsLegend ? (
          <div className="mb-2 space-y-1 border-b border-[var(--cedar-shingle)]/15 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
              <span>LINK — for sale</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400" />
              <span>LINK — sold (matched to lot)</span>
            </div>
          </div>
        ) : null}
        <div className="space-y-1">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="md:hidden">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen((prev) => !prev)}>
          Legend
        </Button>
        {open ? (
          <div className="mt-2 rounded-md border bg-white p-2 text-xs shadow">
            {showRentalsLegend ? (
              <div className="mb-2 flex items-center gap-2 border-b border-[var(--cedar-shingle)]/15 pb-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600" />
                <span>Active vacation rentals</span>
              </div>
            ) : null}
            {showLinkPinsLegend ? (
              <div className="mb-2 space-y-1 border-b border-[var(--cedar-shingle)]/15 pb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                  <span>LINK — for sale</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400" />
                  <span>LINK — sold</span>
                </div>
              </div>
            ) : null}
            <div className="space-y-1">
              {LEGEND_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
