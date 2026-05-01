"use client";

import { useState } from "react";
import { Ban, Building2, ChevronDown, CircleHelp, MapPinned, SlidersHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/components/ui/utils";
import type { ParcelBaseMapLayer } from "@/components/zoning/ZoningMap";
import { RE_MARKET_DISTRICTS } from "@/lib/re-districts-map";

const layerPillBase =
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm transition-colors";

function layerPillInactive() {
  return cn(
    layerPillBase,
    "border-[var(--cedar-shingle)]/35 bg-white/95 text-[var(--atlantic-navy)] hover:border-[var(--cedar-shingle)]/55 hover:bg-[var(--sandstone)]/90",
  );
}

function layerPillActiveSolid() {
  return cn(
    layerPillBase,
    "border-[var(--atlantic-navy)] bg-[var(--atlantic-navy)] text-white hover:border-[var(--brass-hover)] hover:bg-[var(--brass-hover)]",
  );
}

export function MapLayersHowToText() {
  return (
    <div className="space-y-2 text-xs leading-relaxed text-[var(--nantucket-gray)]">
      <p>
        <span className="font-semibold text-[var(--atlantic-navy)]">MLS Areas</span> shows neighborhood-style polygons (Surfside, Town,
        Sconset…). <span className="font-semibold text-[var(--atlantic-navy)]">Zoning</span> tints lots by assessor district code (R-10,
        ROH, LUG…). <span className="font-semibold text-[var(--atlantic-navy)]">None</span> hides both overlays so pins stand out on a
        neutral basemap.
      </p>
    </div>
  );
}

export function ZoningLookupColorsHelpText() {
  return (
    <p className="text-xs leading-relaxed text-[var(--nantucket-gray)]">
      When <span className="font-semibold text-[var(--atlantic-navy)]">District colors</span> is on, each parcel is tinted by zoning
      district. Turn it off for a neutral map while you compare locations.
    </p>
  );
}

type ReMarketSelectProps = {
  reMarketAreaAbbrv: string;
  onReMarketAreaChange: (v: string) => void;
  onRequestFlyToReDistrict: (abbrv: string) => void;
};

export function PropertyMapReMarketFocusSelect({
  reMarketAreaAbbrv,
  onReMarketAreaChange,
  onRequestFlyToReDistrict,
}: ReMarketSelectProps) {
  return (
    <label className="block min-w-0 max-w-xs text-[11px] font-medium text-[var(--atlantic-navy)]">
      Focus area
      <select
        className="mt-1 w-full max-w-full rounded-md border border-[var(--cedar-shingle)]/30 bg-white px-2 py-1.5 text-xs text-[var(--atlantic-navy)]"
        value={reMarketAreaAbbrv}
        onChange={(e) => {
          const v = e.target.value;
          onReMarketAreaChange(v);
          onRequestFlyToReDistrict(v);
        }}
      >
        <option value="">All areas</option>
        {RE_MARKET_DISTRICTS.map(({ district, abbrv }) => (
          <option key={abbrv} value={abbrv}>
            {district} ({abbrv})
          </option>
        ))}
      </select>
    </label>
  );
}

type LayerPillsProps = {
  layout?: "row" | "stack";
  showZoningColors: boolean;
  onShowZoningColors: (v: boolean) => void;
  parcelBaseLayer: ParcelBaseMapLayer;
  onParcelBaseLayer: (v: ParcelBaseMapLayer) => void;
  onOpenFilters: () => void;
  filterBadgeCount: number;
  /** When false, hide the Filters control (e.g. no listing-type chip selected). */
  showFiltersButton?: boolean;
};

const OVERLAY_OPTIONS = [
  { layer: "re_market_areas" as const, label: "MLS Areas", icon: MapPinned },
  { layer: "tax_zoning" as const, label: "Zoning", icon: Building2 },
  { layer: "none" as const, label: "None", icon: Ban },
];

function overlayOptionLabel(layer: ParcelBaseMapLayer): string {
  return OVERLAY_OPTIONS.find((o) => o.layer === layer)?.label ?? "Zoning";
}

type OverlayChipProps = {
  parcelBaseLayer: ParcelBaseMapLayer;
  onParcelBaseLayer: (v: ParcelBaseMapLayer) => void;
  layout?: "row" | "stack";
  /** Classes on outer wrapper (e.g. responsive visibility). */
  className?: string;
  /** Extra classes merged onto the trigger button. */
  triggerClassName?: string;
};

/** Single control: shows `Overlay: …` and opens a menu for MLS Areas / Zoning / None. */
export function PropertyMapOverlayChip({
  parcelBaseLayer,
  onParcelBaseLayer,
  layout = "row",
  className,
  triggerClassName,
}: OverlayChipProps) {
  const [open, setOpen] = useState(false);
  const currentLabel = overlayOptionLabel(parcelBaseLayer);

  return (
    <div className={cn(className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--cedar-shingle)]/35 bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold normal-case text-[var(--atlantic-navy)] shadow-sm transition-colors hover:border-[var(--cedar-shingle)]/55 hover:bg-[var(--sandstone)]/90",
              layout === "stack" && "w-full justify-center",
              triggerClassName,
            )}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={`Map overlay: ${currentLabel}. Change overlay.`}
          >
            <span className="max-w-[11rem] truncate sm:max-w-[14rem]">
              Overlay: {currentLabel}
            </span>
            <ChevronDown
              className={cn("h-3.5 w-3.5 shrink-0 opacity-70 transition-transform", open && "rotate-180")}
              aria-hidden
            />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(100vw-2rem,14rem)] border-[var(--cedar-shingle)]/20 p-1" sideOffset={6}>
          <p className="px-2 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--nantucket-gray)]">Overlay</p>
          <div role="listbox" aria-label="Map overlay" className="flex flex-col gap-0.5">
            {OVERLAY_OPTIONS.map(({ layer, label, icon: Icon }) => {
              const selected = parcelBaseLayer === layer;
              return (
                <button
                  key={layer}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onParcelBaseLayer(layer);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors",
                    selected
                      ? "bg-blue-50 text-blue-950"
                      : "text-[var(--atlantic-navy)] hover:bg-[var(--sandstone)]/80",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function PropertyMapLayerPillsRow({
  layout = "row",
  showZoningColors: _showZoningColors,
  onShowZoningColors: _onShowZoningColors,
  parcelBaseLayer,
  onParcelBaseLayer,
  onOpenFilters,
  filterBadgeCount,
  showFiltersButton = true,
}: LayerPillsProps) {
  const filtersActive = filterBadgeCount > 0;
  const filtersIconClass = filtersActive ? "text-white" : "text-[var(--cedar-shingle)]";

  return (
    <div
      className={cn(
        "flex min-w-0 gap-1.5",
        layout === "stack" ? "flex-col items-stretch" : "flex-row flex-wrap items-center",
      )}
    >
      <PropertyMapOverlayChip parcelBaseLayer={parcelBaseLayer} onParcelBaseLayer={onParcelBaseLayer} layout={layout} />
      {showFiltersButton ? (
        <button
          type="button"
          onClick={onOpenFilters}
          className={cn(
            filtersActive ? layerPillActiveSolid() : layerPillInactive(),
            "gap-1",
            layout === "stack" && "justify-center",
          )}
        >
          <SlidersHorizontal className={cn("h-3.5 w-3.5 shrink-0 stroke-[2]", filtersIconClass)} aria-hidden />
          Filters
          {filterBadgeCount > 0 ? (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white/25 px-1 text-[9px] font-bold text-white">
              {filterBadgeCount > 99 ? "99+" : filterBadgeCount}
            </span>
          ) : null}
        </button>
      ) : null}
    </div>
  );
}

type HelpProps = {
  className?: string;
};

export function PropertyMapLayerHelpTrigger({ className }: HelpProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--cedar-shingle)]/25 bg-white/95 text-[var(--privet-green)] shadow-sm transition-colors hover:bg-[var(--sandstone)]",
            className,
          )}
          aria-label="How to read the map"
        >
          <CircleHelp className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-2 border-[var(--cedar-shingle)]/20 p-3 text-left">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--atlantic-navy)]">How to read the map</p>
        <MapLayersHowToText />
      </PopoverContent>
    </Popover>
  );
}

type DesktopBarProps = {
  showZoningColors: boolean;
  onShowZoningColors: (v: boolean) => void;
  parcelBaseLayer: ParcelBaseMapLayer;
  onParcelBaseLayer: (v: ParcelBaseMapLayer) => void;
  reMarketAreaAbbrv: string;
  onReMarketAreaChange: (v: string) => void;
  onRequestFlyToReDistrict: (abbrv: string) => void;
  onOpenFilters: () => void;
  filterBadgeCount: number;
  showFiltersButton?: boolean;
};

export function PropertyMapDesktopLayerBar({
  showZoningColors,
  onShowZoningColors,
  parcelBaseLayer,
  onParcelBaseLayer,
  reMarketAreaAbbrv,
  onReMarketAreaChange,
  onRequestFlyToReDistrict,
  onOpenFilters,
  filterBadgeCount,
  showFiltersButton = true,
}: DesktopBarProps) {
  const showFocus = parcelBaseLayer === "re_market_areas";

  return (
    <div className="flex flex-col gap-2 py-1 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <PropertyMapLayerPillsRow
          showZoningColors={showZoningColors}
          onShowZoningColors={onShowZoningColors}
          parcelBaseLayer={parcelBaseLayer}
          onParcelBaseLayer={onParcelBaseLayer}
          onOpenFilters={onOpenFilters}
          filterBadgeCount={filterBadgeCount}
          showFiltersButton={showFiltersButton}
        />
        <PropertyMapLayerHelpTrigger />
      </div>
      {showFocus ? (
        <PropertyMapReMarketFocusSelect
          reMarketAreaAbbrv={reMarketAreaAbbrv}
          onReMarketAreaChange={onReMarketAreaChange}
          onRequestFlyToReDistrict={onRequestFlyToReDistrict}
        />
      ) : null}
    </div>
  );
}

type SheetBodyProps = {
  showZoningColors: boolean;
  onShowZoningColors: (v: boolean) => void;
  parcelBaseLayer: ParcelBaseMapLayer;
  onParcelBaseLayer: (v: ParcelBaseMapLayer) => void;
  reMarketAreaAbbrv: string;
  onReMarketAreaChange: (v: string) => void;
  onRequestFlyToReDistrict: (abbrv: string) => void;
  onOpenFilters: () => void;
  filterBadgeCount: number;
  showFiltersButton?: boolean;
};

export function PropertyMapLayersSheetBody({
  showZoningColors,
  onShowZoningColors,
  parcelBaseLayer,
  onParcelBaseLayer,
  reMarketAreaAbbrv,
  onReMarketAreaChange,
  onRequestFlyToReDistrict,
  onOpenFilters,
  filterBadgeCount,
  showFiltersButton = true,
}: SheetBodyProps) {
  const showFocus = parcelBaseLayer === "re_market_areas";

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--atlantic-navy)]">Layers</p>
          <PropertyMapLayerHelpTrigger className="h-7 w-7" />
        </div>
        <PropertyMapLayerPillsRow
          layout="row"
          showZoningColors={showZoningColors}
          onShowZoningColors={onShowZoningColors}
          parcelBaseLayer={parcelBaseLayer}
          onParcelBaseLayer={onParcelBaseLayer}
          onOpenFilters={onOpenFilters}
          filterBadgeCount={filterBadgeCount}
          showFiltersButton={showFiltersButton}
        />
      </div>
      {showFocus ? (
        <PropertyMapReMarketFocusSelect
          reMarketAreaAbbrv={reMarketAreaAbbrv}
          onReMarketAreaChange={onReMarketAreaChange}
          onRequestFlyToReDistrict={onRequestFlyToReDistrict}
        />
      ) : null}
      <div className="border-t border-[var(--cedar-shingle)]/15 pt-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--atlantic-navy)]">How to read the map</p>
        <MapLayersHowToText />
      </div>
    </div>
  );
}

type ZoningStripProps = {
  showZoningColors: boolean;
  onShowZoningColors: (v: boolean) => void;
  className?: string;
};

export function ZoningLookupColorsStrip({ showZoningColors, onShowZoningColors, className }: ZoningStripProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        onClick={() => onShowZoningColors(!showZoningColors)}
        className={showZoningColors ? layerPillActiveSolid() : layerPillInactive()}
        aria-pressed={showZoningColors}
      >
        <Building2
          className={cn(
            "h-3.5 w-3.5 shrink-0 stroke-[2]",
            showZoningColors ? "text-white" : "text-[var(--cedar-shingle)]",
          )}
          aria-hidden
        />
        District colors
      </button>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--cedar-shingle)]/25 bg-white/95 text-[var(--privet-green)] shadow-sm transition-colors hover:bg-[var(--sandstone)]"
            aria-label="About district colors"
          >
            <CircleHelp className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" side="right" className="w-72 border-[var(--cedar-shingle)]/20 p-3 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--atlantic-navy)]">District colors</p>
          <div className="mt-2">
            <ZoningLookupColorsHelpText />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
