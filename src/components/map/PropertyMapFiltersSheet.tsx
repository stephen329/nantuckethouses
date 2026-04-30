"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/components/ui/utils";
import {
  countActiveLinkFilters,
  countActiveRentalFilters,
  DEFAULT_LINK_FILTERS,
  DEFAULT_RENTAL_FILTERS,
  LINK_PROPERTY_TYPE_LABELS,
  type LinkFiltersState,
  type LinkPropertyTypeKey,
  type PropertyMapMode,
  type RentalFiltersState,
} from "@/lib/property-map-filters";

export type MapFilterPinSummary = {
  rentalsFiltered: number;
  rentalsInView: number;
  linkActiveFiltered: number;
  linkActiveTotal: number;
  linkSoldFiltered: number;
  linkSoldTotal: number;
};

type Props = {
  mapMode: PropertyMapMode;
  rentalFilters: RentalFiltersState;
  onRentalFiltersChange: (next: RentalFiltersState) => void;
  linkFilters: LinkFiltersState;
  onLinkFiltersChange: (next: LinkFiltersState) => void;
  onClearAll: () => void;
  pinSummary: MapFilterPinSummary;
  trigger?: "floating" | "none";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function toggleTypeKey(keys: LinkPropertyTypeKey[], k: LinkPropertyTypeKey): LinkPropertyTypeKey[] {
  return keys.includes(k) ? keys.filter((x) => x !== k) : [...keys, k];
}

function Chip({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
        selected
          ? "border-blue-800 bg-blue-700 text-white shadow-sm"
          : "border-[var(--cedar-shingle)]/35 bg-white text-[var(--atlantic-navy)] hover:border-[var(--cedar-shingle)]/55 hover:bg-[var(--sandstone)]/80",
        className,
      )}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--nantucket-gray)]">{children}</p>
  );
}

export function PropertyMapFiltersSheet({
  mapMode,
  rentalFilters,
  onRentalFiltersChange,
  linkFilters,
  onLinkFiltersChange,
  onClearAll,
  pinSummary,
  trigger = "floating",
  open: openControlled,
  onOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const isControlled = openControlled !== undefined && onOpenChange !== undefined;
  const open = isControlled ? openControlled : internalOpen;
  const setOpen = (next: boolean) => {
    if (isControlled) onOpenChange!(next);
    else setInternalOpen(next);
  };

  const showRent = mapMode === "rent" || mapMode === "all";
  const showLink = mapMode === "sale" || mapMode === "sold" || mapMode === "all";
  const showSoldTools = mapMode === "sold" || mapMode === "all";

  const badge =
    (showRent ? countActiveRentalFilters(rentalFilters) : 0) + (showLink ? countActiveLinkFilters(linkFilters) : 0);

  const headline = useMemo(() => {
    const parts: string[] = [];
    if (mapMode === "rent") {
      parts.push(`${pinSummary.rentalsFiltered} rental${pinSummary.rentalsFiltered === 1 ? "" : "s"}`);
    } else if (mapMode === "sale") {
      parts.push(`${pinSummary.linkActiveFiltered} for-sale pin${pinSummary.linkActiveFiltered === 1 ? "" : "s"}`);
    } else if (mapMode === "sold") {
      parts.push(`${pinSummary.linkSoldFiltered} sold pin${pinSummary.linkSoldFiltered === 1 ? "" : "s"}`);
    } else {
      parts.push(`${pinSummary.rentalsFiltered} rentals`);
      parts.push(`${pinSummary.linkActiveFiltered} active`);
      parts.push(`${pinSummary.linkSoldFiltered} sold`);
    }
    return parts.join(" · ");
  }, [mapMode, pinSummary]);

  const clearAll = () => {
    onRentalFiltersChange({ ...DEFAULT_RENTAL_FILTERS });
    onLinkFiltersChange({ ...DEFAULT_LINK_FILTERS });
    onClearAll();
    setOpen(false);
  };

  const rentalBedOptions = ["", "2", "3", "4", "5", "6"] as const;
  const rentalBathOptions = ["", "2", "2.5", "3", "4"] as const;
  const occOptions = ["", "4", "6", "8", "10"] as const;

  return (
    <>
      {trigger === "floating" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "absolute bottom-3 left-3 z-20 inline-flex items-center gap-2 rounded-full border border-[var(--cedar-shingle)]/25 bg-white px-4 py-2 text-sm font-medium text-[var(--atlantic-navy)] shadow-md",
            "hover:bg-[var(--sandstone)]",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filters
          {badge > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1.5 text-[11px] font-semibold text-white">
              {badge > 99 ? "99+" : badge}
            </span>
          ) : null}
        </button>
      ) : null}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-t-2xl border-t-2 border-blue-700/35 bg-white p-0 shadow-2xl"
        >
          <SheetHeader className="shrink-0 space-y-2 border-b border-[var(--cedar-shingle)]/15 px-4 pb-3 pt-4 text-left">
            <div className="flex items-start justify-between gap-3 pr-10">
              <div>
                <SheetTitle className="text-lg text-[var(--atlantic-navy)]">Map filters</SheetTitle>
                <p className="mt-1 text-xs leading-snug text-[var(--nantucket-gray)]">
                  <span className="font-semibold text-blue-800">{headline}</span>
                  <span className="text-[var(--nantucket-gray)]"> in current map view</span>
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 px-2 text-xs text-blue-800" onClick={clearAll}>
                Clear all
              </Button>
            </div>
            {badge > 0 ? (
              <p className="rounded-md border border-blue-700/15 bg-blue-50/90 px-2.5 py-1.5 text-[11px] font-medium text-blue-950">
                {badge} active filter{badge === 1 ? "" : "s"} — map updates live as you change criteria.
              </p>
            ) : null}
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4">
            {showRent ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <SectionLabel>Vacation rentals</SectionLabel>
                  <span className="text-[11px] font-medium text-[var(--privet-green)]">
                    {pinSummary.rentalsFiltered}/{pinSummary.rentalsInView} pins
                  </span>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-[var(--atlantic-navy)]">Rate basis</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { v: "weekly" as const, l: "Weekly" },
                        { v: "monthly" as const, l: "Monthly" },
                        { v: "annual" as const, l: "Annual" },
                      ] as const
                    ).map(({ v, l }) => (
                      <Chip
                        key={v}
                        selected={rentalFilters.ratePeriod === v}
                        onClick={() => onRentalFiltersChange({ ...rentalFilters, ratePeriod: v })}
                      >
                        {l}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-[var(--atlantic-navy)]">Weekly rate (custom)</p>
                  <div className="flex items-stretch overflow-hidden rounded-xl border border-[var(--cedar-shingle)]/25 bg-[var(--sandstone)]/30 shadow-inner">
                    <div className="flex min-w-0 flex-1 flex-col border-r border-[var(--cedar-shingle)]/20 px-3 py-2">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--nantucket-gray)]">Min</span>
                      <Input
                        inputMode="numeric"
                        placeholder="$0"
                        value={rentalFilters.minRate}
                        onChange={(e) => onRentalFiltersChange({ ...rentalFilters, minRate: e.target.value })}
                        className="h-8 border-0 bg-transparent p-0 text-sm font-semibold text-[var(--atlantic-navy)] placeholder:text-[var(--nantucket-gray)]/60 focus-visible:ring-0"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col px-3 py-2">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--nantucket-gray)]">Max</span>
                      <Input
                        inputMode="numeric"
                        placeholder="No max"
                        value={rentalFilters.maxRate}
                        onChange={(e) => onRentalFiltersChange({ ...rentalFilters, maxRate: e.target.value })}
                        className="h-8 border-0 bg-transparent p-0 text-sm font-semibold text-[var(--atlantic-navy)] placeholder:text-[var(--nantucket-gray)]/60 focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium text-[var(--atlantic-navy)]">Bedrooms (min)</p>
                    <div className="flex flex-wrap gap-1">
                      {rentalBedOptions.map((v) => (
                        <Chip
                          key={v || "any"}
                          selected={rentalFilters.minBedrooms === v}
                          onClick={() => onRentalFiltersChange({ ...rentalFilters, minBedrooms: v })}
                        >
                          {v === "" ? "Any" : `${v}+`}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium text-[var(--atlantic-navy)]">Baths (min)</p>
                    <div className="flex flex-wrap gap-1">
                      {rentalBathOptions.map((v) => (
                        <Chip
                          key={v || "any-b"}
                          selected={rentalFilters.minBaths === v}
                          onClick={() => onRentalFiltersChange({ ...rentalFilters, minBaths: v })}
                        >
                          {v === "" ? "Any" : `${v}+`}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-[var(--atlantic-navy)]">Sleeps (min)</p>
                  <div className="flex flex-wrap gap-1">
                    {occOptions.map((v) => (
                      <Chip
                        key={v || "any-o"}
                        selected={rentalFilters.minOccupancy === v}
                        onClick={() => onRentalFiltersChange({ ...rentalFilters, minOccupancy: v })}
                      >
                        {v === "" ? "Any" : `${v}+`}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-[var(--atlantic-navy)]">Beach access</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { v: "any" as const, l: "Any" },
                        { v: "walk" as const, l: "Walk to beach" },
                        { v: "not_walk" as const, l: "Exclude walk-to-beach" },
                      ] as const
                    ).map(({ v, l }) => (
                      <Chip
                        key={v}
                        selected={rentalFilters.beachDistance === v}
                        onClick={() => onRentalFiltersChange({ ...rentalFilters, beachDistance: v })}
                      >
                        {l}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--cedar-shingle)]/15 bg-[var(--sandstone)]/40 p-2.5">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-xs font-medium text-[var(--atlantic-navy)] has-[:checked]:border-blue-700/25 has-[:checked]:bg-white">
                    <Checkbox
                      checked={rentalFilters.pool}
                      onCheckedChange={(v) => onRentalFiltersChange({ ...rentalFilters, pool: v === true })}
                    />
                    Pool
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-xs font-medium text-[var(--atlantic-navy)] has-[:checked]:border-blue-700/25 has-[:checked]:bg-white">
                    <Checkbox
                      checked={rentalFilters.waterfront}
                      onCheckedChange={(v) => onRentalFiltersChange({ ...rentalFilters, waterfront: v === true })}
                    />
                    Waterfront / water view
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-xs font-medium text-[var(--atlantic-navy)] has-[:checked]:border-blue-700/25 has-[:checked]:bg-white">
                    <Checkbox
                      checked={rentalFilters.petFriendly}
                      onCheckedChange={(v) => onRentalFiltersChange({ ...rentalFilters, petFriendly: v === true })}
                    />
                    Pet-friendly
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-xs font-medium text-[var(--atlantic-navy)] has-[:checked]:border-blue-700/25 has-[:checked]:bg-white">
                    <Checkbox
                      checked={rentalFilters.renovated}
                      onCheckedChange={(v) => onRentalFiltersChange({ ...rentalFilters, renovated: v === true })}
                    />
                    Renovated / like-new
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-xs font-medium text-[var(--atlantic-navy)] has-[:checked]:border-blue-700/25 has-[:checked]:bg-white">
                    <Checkbox
                      checked={rentalFilters.townWalk}
                      onCheckedChange={(v) => onRentalFiltersChange({ ...rentalFilters, townWalk: v === true })}
                    />
                    Walk to Town
                  </label>
                </div>
              </section>
            ) : null}

            {showLink ? (
              <section className={cn("space-y-4", showRent && "border-t border-[var(--cedar-shingle)]/15 pt-5")}>
                <div className="flex items-center justify-between gap-2">
                  <SectionLabel>LINK listings</SectionLabel>
                  <span className="text-right text-[11px] font-medium leading-tight text-blue-900">
                    {mapMode !== "sold" ? (
                      <span>
                        {pinSummary.linkActiveFiltered}/{pinSummary.linkActiveTotal} active
                      </span>
                    ) : null}
                    {mapMode === "all" ? <span className="mx-1 text-[var(--nantucket-gray)]">·</span> : null}
                    {mapMode !== "sale" ? (
                      <span>
                        {pinSummary.linkSoldFiltered}/{pinSummary.linkSoldTotal} sold
                      </span>
                    ) : null}
                  </span>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-[var(--atlantic-navy)]">Price</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: "" as const, label: "Any" },
                        { id: "1-3" as const, label: "$1M – $3M" },
                        { id: "3-6" as const, label: "$3M – $6M" },
                        { id: "6+" as const, label: "$6M+" },
                      ] as const
                    ).map(({ id, label }) => (
                      <Chip
                        key={label}
                        selected={linkFilters.pricePreset === id}
                        onClick={() =>
                          onLinkFiltersChange({
                            ...linkFilters,
                            pricePreset: id,
                            minPrice: "",
                            maxPrice: "",
                          })
                        }
                      >
                        {label}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-[var(--atlantic-navy)]">Custom price</p>
                  <div className="flex items-stretch overflow-hidden rounded-xl border border-[var(--cedar-shingle)]/25 bg-[var(--sandstone)]/30 shadow-inner">
                    <div className="flex min-w-0 flex-1 flex-col border-r border-[var(--cedar-shingle)]/20 px-3 py-2">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--nantucket-gray)]">Min</span>
                      <Input
                        inputMode="numeric"
                        placeholder="$0"
                        value={linkFilters.minPrice}
                        onChange={(e) => onLinkFiltersChange({ ...linkFilters, minPrice: e.target.value, pricePreset: "" })}
                        className="h-8 border-0 bg-transparent p-0 text-sm font-semibold text-[var(--atlantic-navy)] focus-visible:ring-0"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col px-3 py-2">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--nantucket-gray)]">Max</span>
                      <Input
                        inputMode="numeric"
                        placeholder="No max"
                        value={linkFilters.maxPrice}
                        onChange={(e) => onLinkFiltersChange({ ...linkFilters, maxPrice: e.target.value, pricePreset: "" })}
                        className="h-8 border-0 bg-transparent p-0 text-sm font-semibold text-[var(--atlantic-navy)] focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-[var(--atlantic-navy)]">Value — max $/sqft</p>
                  <p className="mb-1.5 text-[10px] text-[var(--nantucket-gray)]">Uses living area from LINK when present; other listings are hidden while this filter is on.</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip
                      selected={linkFilters.maxPricePerSqft === "1500"}
                      onClick={() =>
                        onLinkFiltersChange({
                          ...linkFilters,
                          maxPricePerSqft: linkFilters.maxPricePerSqft === "1500" ? "" : "1500",
                        })
                      }
                    >
                      Under $1,500/sqft
                    </Chip>
                    <Input
                      inputMode="decimal"
                      placeholder="Custom max $/sqft"
                      value={linkFilters.maxPricePerSqft}
                      onChange={(e) => onLinkFiltersChange({ ...linkFilters, maxPricePerSqft: e.target.value })}
                      className="h-9 max-w-[10rem] rounded-lg border-[var(--cedar-shingle)]/25 text-sm font-medium"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium text-[var(--atlantic-navy)]">Beds (min)</p>
                    <div className="flex flex-wrap gap-1">
                      {(["", "2", "3", "4", "5"] as const).map((v) => (
                        <Chip
                          key={`lb-${v || "a"}`}
                          selected={linkFilters.minBeds === v}
                          onClick={() => onLinkFiltersChange({ ...linkFilters, minBeds: v })}
                        >
                          {v === "" ? "Any" : `${v}+`}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium text-[var(--atlantic-navy)]">Baths (min)</p>
                    <div className="flex flex-wrap gap-1">
                      {(["", "2", "2.5", "3", "4"] as const).map((v) => (
                        <Chip
                          key={`lba-${v || "a"}`}
                          selected={linkFilters.minBaths === v}
                          onClick={() => onLinkFiltersChange({ ...linkFilters, minBaths: v })}
                        >
                          {v === "" ? "Any" : `${v}+`}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-[var(--atlantic-navy)]">Lot size</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { v: "", l: "Any" },
                        { v: "0.5", l: "0.5+ ac" },
                        { v: "1", l: "1+ ac" },
                        { v: "2", l: "2+ ac" },
                      ] as const
                    ).map(({ v, l }) => (
                      <Chip
                        key={l}
                        selected={linkFilters.minLotAcres === v}
                        onClick={() => onLinkFiltersChange({ ...linkFilters, minLotAcres: v })}
                      >
                        {l}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-[var(--atlantic-navy)]">Property type</p>
                  <div className="flex flex-wrap gap-1.5">
                    {LINK_PROPERTY_TYPE_LABELS.map(({ key, label }) => {
                      const on = linkFilters.propertyTypes.includes(key);
                      return (
                        <Chip
                          key={key}
                          selected={on}
                          onClick={() =>
                            onLinkFiltersChange({
                              ...linkFilters,
                              propertyTypes: toggleTypeKey(linkFilters.propertyTypes, key),
                            })
                          }
                        >
                          {label}
                        </Chip>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--cedar-shingle)]/15 bg-blue-50/40 p-2.5">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-xs font-medium text-[var(--atlantic-navy)] has-[:checked]:border-blue-700/30 has-[:checked]:bg-white">
                    <Checkbox
                      checked={linkFilters.waterfront}
                      onCheckedChange={(v) => onLinkFiltersChange({ ...linkFilters, waterfront: v === true })}
                    />
                    Waterfront
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-xs font-medium text-[var(--atlantic-navy)] has-[:checked]:border-blue-700/30 has-[:checked]:bg-white">
                    <Checkbox
                      checked={linkFilters.walkToTown}
                      onCheckedChange={(v) => onLinkFiltersChange({ ...linkFilters, walkToTown: v === true })}
                    />
                    Walk to Town
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-xs font-medium text-[var(--atlantic-navy)] has-[:checked]:border-blue-700/30 has-[:checked]:bg-white">
                    <Checkbox
                      checked={linkFilters.newConstruction}
                      onCheckedChange={(v) => onLinkFiltersChange({ ...linkFilters, newConstruction: v === true })}
                    />
                    New construction
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-xs font-medium text-[var(--atlantic-navy)] has-[:checked]:border-blue-700/30 has-[:checked]:bg-white">
                    <Checkbox
                      checked={linkFilters.renoRecent}
                      onCheckedChange={(v) => onLinkFiltersChange({ ...linkFilters, renoRecent: v === true })}
                    />
                    Recently renovated
                  </label>
                </div>

                <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg border border-[var(--cedar-shingle)]/25 bg-white px-3 py-2 text-left text-xs font-semibold text-[var(--atlantic-navy)] shadow-sm"
                    >
                      Advanced
                      <span className="text-[var(--nantucket-gray)]">{advancedOpen ? "▾" : "▸"}</span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 border-b border-t border-[var(--cedar-shingle)]/10 py-3 data-[state=closed]:animate-out">
                    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-blue-700/15 bg-blue-50/50 p-2.5">
                      <Checkbox
                        checked={linkFilters.highYieldZones}
                        onCheckedChange={(v) => onLinkFiltersChange({ ...linkFilters, highYieldZones: v === true })}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="text-xs font-semibold text-[var(--atlantic-navy)]">Stephen Maury&apos;s high-yield zones</span>
                        <span className="mt-0.5 block text-[10px] leading-snug text-[var(--nantucket-gray)]">
                          Town, Brant Point, Cliff, Surfside, Sconset, Wauwinet, Dionis, Polpis, Madaket, and similar MLS
                          area tags when present on the listing.
                        </span>
                      </span>
                    </label>
                    {showSoldTools ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="mb-1 text-[11px] font-medium text-[var(--atlantic-navy)]">Sold — closed after</p>
                          <Input
                            type="date"
                            value={linkFilters.soldCloseAfter}
                            onChange={(e) => onLinkFiltersChange({ ...linkFilters, soldCloseAfter: e.target.value })}
                            className="h-10 rounded-lg border-[var(--cedar-shingle)]/25 text-sm"
                          />
                        </div>
                        <div>
                          <p className="mb-1 text-[11px] font-medium text-[var(--atlantic-navy)]">Sold — closed before</p>
                          <Input
                            type="date"
                            value={linkFilters.soldCloseBefore}
                            onChange={(e) => onLinkFiltersChange({ ...linkFilters, soldCloseBefore: e.target.value })}
                            className="h-10 rounded-lg border-[var(--cedar-shingle)]/25 text-sm"
                          />
                        </div>
                      </div>
                    ) : null}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="mb-1 text-[11px] font-medium text-[var(--atlantic-navy)]">Days on market (min)</p>
                        <Input
                          inputMode="numeric"
                          placeholder="Any"
                          value={linkFilters.minDom}
                          onChange={(e) => onLinkFiltersChange({ ...linkFilters, minDom: e.target.value })}
                          className="h-10 rounded-lg border-[var(--cedar-shingle)]/25 text-sm"
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-medium text-[var(--atlantic-navy)]">Days on market (max)</p>
                        <Input
                          inputMode="numeric"
                          placeholder="Any"
                          value={linkFilters.maxDom}
                          onChange={(e) => onLinkFiltersChange({ ...linkFilters, maxDom: e.target.value })}
                          className="h-10 rounded-lg border-[var(--cedar-shingle)]/25 text-sm"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] leading-snug text-[var(--nantucket-gray)]">
                      DOM uses LINK on-market date when the feed provides it; sold comps use close date as the end of the
                      window.
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              </section>
            ) : null}
          </div>

          <SheetFooter className="shrink-0 flex-col gap-2 border-t border-[var(--cedar-shingle)]/20 bg-[var(--sandstone)]/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
            <Button type="button" className="h-11 w-full bg-blue-700 text-[15px] font-semibold text-white hover:bg-blue-800" onClick={() => setOpen(false)}>
              Apply filters
            </Button>
            <Button type="button" variant="outline" className="h-10 w-full border-[var(--cedar-shingle)]/35 text-sm font-semibold" asChild>
              <Link href="/buy">Save search &amp; get alerts</Link>
            </Button>
            <Button type="button" variant="ghost" className="h-9 w-full text-xs font-medium text-[var(--nantucket-gray)]" onClick={clearAll}>
              Clear all filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
