"use client";

import { Building2, CircleHelp, MapPinned, SlidersHorizontal } from "lucide-react";
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

function layerPillActiveSoft() {
  return cn(
    layerPillBase,
    "border-[var(--privet-green)]/40 bg-[var(--sandstone)] text-[var(--atlantic-navy)] hover:border-[var(--privet-green)]/55 hover:bg-[var(--fog-gray)]",
  );
}

export function MapLayersHowToText() {
  return (
    <div className="space-y-2 text-xs leading-relaxed text-[var(--nantucket-gray)]">
      <p>
        <span className="font-semibold text-[var(--atlantic-navy)]">Tax zoning</span> follows assessor district codes on each lot
        (R-10, ROH, LUG…).
      </p>
      <p>
        <span className="font-semibold text-[var(--atlantic-navy)]">LINK market areas</span> group neighborhoods the way buyers search
        (Surfside, Town, Sconset…).
      </p>
      <p>
        Turn <span className="font-semibold text-[var(--atlantic-navy)]">Zoning Districts</span> tint on to compare districts; turn it off
        for a neutral basemap when pins need to stand out.
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
};

export function PropertyMapLayerPillsRow({
  layout = "row",
  showZoningColors,
  onShowZoningColors,
  parcelBaseLayer,
  onParcelBaseLayer,
  onOpenFilters,
  filterBadgeCount,
}: LayerPillsProps) {
  const taxSelected = parcelBaseLayer === "tax_zoning";
  const linkMarketSelected = parcelBaseLayer === "re_market_areas";

  const onZoningDistrictsClick = () => {
    if (!taxSelected) {
      onParcelBaseLayer("tax_zoning");
      onShowZoningColors(true);
      return;
    }
    onShowZoningColors(!showZoningColors);
  };

  const zoningTintOn = taxSelected && showZoningColors;
  const zoningTaxNoTint = taxSelected && !showZoningColors;
  const zoningPillClass = zoningTintOn ? layerPillActiveSolid() : zoningTaxNoTint ? layerPillActiveSoft() : layerPillInactive();

  const filtersActive = filterBadgeCount > 0;

  const zoningIconClass = zoningTintOn
    ? "text-white"
    : zoningTaxNoTint
      ? "text-[var(--privet-green)]"
      : "text-[var(--cedar-shingle)]";
  const marketIconClass = linkMarketSelected ? "text-white" : "text-[var(--cedar-shingle)]";
  const filtersIconClass = filtersActive ? "text-white" : "text-[var(--cedar-shingle)]";

  return (
    <div className={cn("flex gap-1.5", layout === "stack" ? "flex-col items-stretch" : "flex-row flex-wrap items-center")}>
      <button
        type="button"
        onClick={onZoningDistrictsClick}
        className={cn(zoningPillClass, layout === "stack" && "justify-center")}
        aria-pressed={taxSelected}
        title={taxSelected && !showZoningColors ? "Tax lots — tap again for district colors" : undefined}
      >
        <Building2 className={cn("h-3.5 w-3.5 shrink-0 stroke-[2]", zoningIconClass)} aria-hidden />
        Zoning
      </button>
      <button
        type="button"
        onClick={() => onParcelBaseLayer("re_market_areas")}
        className={cn(
          linkMarketSelected ? layerPillActiveSolid() : layerPillInactive(),
          layout === "stack" && "justify-center",
        )}
        aria-pressed={linkMarketSelected}
      >
        <MapPinned className={cn("h-3.5 w-3.5 shrink-0 stroke-[2]", marketIconClass)} aria-hidden />
        Market
      </button>
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
