"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  LINK_FILTERS_SOLD_IN_LAST_OPTIONS,
  LINK_PROPERTY_TYPE_LABELS,
  type LinkFiltersSoldInLast,
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

type FilterSheetTab = "rent" | "sale" | "sold";

type Props = {
  mapMode: PropertyMapMode;
  selectedModes?: Array<Exclude<PropertyMapMode, "all">>;
  rentalFilters: RentalFiltersState;
  onRentalFiltersChange: (next: RentalFiltersState) => void;
  linkFilters: LinkFiltersState;
  onLinkFiltersChange: (next: LinkFiltersState) => void;
  onClearAll: () => void;
  pinSummary: MapFilterPinSummary;
  trigger?: "floating" | "none";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Drawer edge; mobile map uses top drawer. */
  side?: "top" | "bottom";
};

function toggleTypeKey(keys: LinkPropertyTypeKey[], k: LinkPropertyTypeKey): LinkPropertyTypeKey[] {
  return keys.includes(k) ? keys.filter((x) => x !== k) : [...keys, k];
}

function Chip({
  selected,
  onClick,
  children,
  className,
  title,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
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
  selectedModes,
  rentalFilters,
  onRentalFiltersChange,
  linkFilters,
  onLinkFiltersChange,
  onClearAll,
  pinSummary,
  trigger = "floating",
  open: openControlled,
  onOpenChange,
  side = "bottom",
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openControlled !== undefined && onOpenChange !== undefined;
  const open = isControlled ? openControlled : internalOpen;
  const setOpen = (next: boolean) => {
    if (isControlled) onOpenChange!(next);
    else setInternalOpen(next);
  };

  const selected = new Set<Exclude<PropertyMapMode, "all">>(
    Array.isArray(selectedModes) && selectedModes.length === 0
      ? []
      : selectedModes?.length
        ? selectedModes
        : mapMode === "all"
          ? ["rent", "sale", "sold"]
          : [mapMode as Exclude<PropertyMapMode, "all">],
  );
  const showRent = selected.has("rent");
  const showSale = selected.has("sale");
  const showSold = selected.has("sold");
  const showLink = showSale || showSold;
  const showSoldTools = showSold;

  /** Tabs left → right: For sale, Sold, then Vacation Rentals (rent). */
  const tabIds = useMemo((): FilterSheetTab[] => {
    const ids: FilterSheetTab[] = [];
    if (showSale) ids.push("sale");
    if (showSold) ids.push("sold");
    if (showRent) ids.push("rent");
    return ids;
  }, [showRent, showSale, showSold]);

  const [activeTab, setActiveTab] = useState<FilterSheetTab>("rent");

  useEffect(() => {
    if (tabIds.length === 0) return;
    if (!tabIds.includes(activeTab)) setActiveTab(tabIds[0]!);
  }, [tabIds, activeTab]);

  /** Sold date UI only on Sold tab (or single-mode sold). */
  const showSoldDateControls = showSoldTools && (tabIds.length === 1 || activeTab === "sold");
  const showDomControls = activeTab !== "sold";

  const rentBadge = showRent ? countActiveRentalFilters(rentalFilters) : 0;
  const linkBadge = showLink ? countActiveLinkFilters(linkFilters) : 0;

  const viewingRent = showRent && (tabIds.length === 1 ? tabIds[0] === "rent" : activeTab === "rent");
  const viewingLink =
    showLink && (tabIds.length === 1 ? tabIds[0] === "sale" || tabIds[0] === "sold" : activeTab === "sale" || activeTab === "sold");

  const badge = rentBadge + linkBadge;

  const headline = useMemo(() => {
    if (!showRent && !showSale && !showSold) {
      return "No listing types selected — turn on For sale, Sold, and/or Vacation Rentals above";
    }
    const parts: string[] = [];
    if (showRent && !showLink) {
      parts.push(`${pinSummary.rentalsFiltered} rental${pinSummary.rentalsFiltered === 1 ? "" : "s"}`);
    } else if (!showRent && showSale && !showSold) {
      parts.push(`${pinSummary.linkActiveFiltered} for-sale pin${pinSummary.linkActiveFiltered === 1 ? "" : "s"}`);
    } else if (!showRent && !showSale && showSold) {
      parts.push(`${pinSummary.linkSoldFiltered} sold pin${pinSummary.linkSoldFiltered === 1 ? "" : "s"}`);
    } else {
      if (showRent) parts.push(`${pinSummary.rentalsFiltered} rentals`);
      if (showSale) parts.push(`${pinSummary.linkActiveFiltered} active`);
      if (showSold) parts.push(`${pinSummary.linkSoldFiltered} sold`);
    }
    return parts.join(" · ");
  }, [showRent, showSale, showSold, showLink, pinSummary]);

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
          side={side}
          className={cn(
            "flex max-h-[90dvh] w-full max-w-[100vw] flex-col gap-0 overflow-x-hidden overflow-y-hidden bg-white p-0 shadow-2xl",
            side === "top"
              ? "rounded-b-2xl border-b-2 border-blue-700/35"
              : "rounded-t-2xl border-t-2 border-blue-700/35",
          )}
        >
          <SheetHeader className="shrink-0 space-y-2 border-b border-[var(--cedar-shingle)]/15 px-4 pb-3 pt-4 text-left">
            <div className="flex min-w-0 items-start justify-between gap-3 pr-10">
              <div className="min-w-0 flex-1">
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

          {tabIds.length > 1 ? (
            <div
              role="tablist"
              aria-label="Listing type filters"
              className="flex min-w-0 shrink-0 gap-0 border-b border-[var(--cedar-shingle)]/15 px-2"
            >
              {tabIds.map((id) => {
                const selectedTab = activeTab === id;
                const label = id === "rent" ? "Vacation Rentals" : id === "sale" ? "For sale" : "Sold";
                const tabBadge =
                  id === "rent" && rentBadge > 0 ? rentBadge : (id === "sale" || id === "sold") && linkBadge > 0 ? linkBadge : 0;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={selectedTab}
                    onClick={() => setActiveTab(id)}
                    className={cn(
                      "relative min-h-11 min-w-0 flex-1 px-1.5 py-2.5 text-center text-[11px] font-semibold leading-tight transition-colors sm:px-2 sm:text-xs",
                      selectedTab
                        ? "text-blue-800 after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-blue-700"
                        : "text-[var(--nantucket-gray)] hover:text-[var(--atlantic-navy)]",
                    )}
                  >
                    <span className="inline-flex max-w-full flex-col items-center gap-0.5">
                      <span className="line-clamp-2 break-words">{label}</span>
                      {tabBadge > 0 ? (
                        <span className="rounded-full bg-blue-700 px-1.5 py-px text-[10px] font-bold leading-none text-white">
                          {tabBadge > 99 ? "99+" : tabBadge}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-4 py-4">
            {tabIds.length === 0 ? (
              <p className="rounded-md border border-[var(--cedar-shingle)]/20 bg-[var(--sandstone)]/40 px-3 py-2 text-xs leading-snug text-[var(--atlantic-navy)]">
                Select at least one listing type using the chips on the map toolbar to filter pins here.
              </p>
            ) : null}
            {viewingRent ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <SectionLabel>Vacation rentals</SectionLabel>
                  <span className="text-[11px] font-medium text-[var(--privet-green)]">
                    {pinSummary.rentalsFiltered}/{pinSummary.rentalsInView} pins
                  </span>
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

            {viewingLink ? (
              <section className="space-y-4">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <SectionLabel>MLS Listings</SectionLabel>
                  <span className="min-w-0 shrink text-right text-[11px] font-medium leading-tight text-blue-900">
                    {showSale ? (
                      <span>
                        {pinSummary.linkActiveFiltered}/{pinSummary.linkActiveTotal} active
                      </span>
                    ) : null}
                    {showSale && showSold ? <span className="mx-1 text-[var(--nantucket-gray)]">·</span> : null}
                    {showSold ? (
                      <span>
                        {pinSummary.linkSoldFiltered}/{pinSummary.linkSoldTotal} sold
                      </span>
                    ) : null}
                  </span>
                </div>

                {showSoldDateControls ? (
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[11px] font-medium text-[var(--atlantic-navy)]">Sold in last:</span>
                    <select
                      value={linkFilters.soldInLast}
                      onChange={(e) =>
                        onLinkFiltersChange({
                          ...linkFilters,
                          soldInLast: e.target.value as LinkFiltersSoldInLast,
                        })
                      }
                      className="h-10 w-full min-w-0 max-w-full rounded-lg border border-[var(--cedar-shingle)]/25 bg-white px-3 text-sm text-[var(--atlantic-navy)] shadow-sm"
                    >
                      <option value="" hidden>
                        &#8203;
                      </option>
                      {LINK_FILTERS_SOLD_IN_LAST_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

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
                      checked={linkFilters.pool}
                      onCheckedChange={(v) => onLinkFiltersChange({ ...linkFilters, pool: v === true })}
                    />
                    Pool
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-xs font-medium text-[var(--atlantic-navy)] has-[:checked]:border-blue-700/30 has-[:checked]:bg-white">
                    <Checkbox
                      checked={linkFilters.newConstruction}
                      onCheckedChange={(v) => onLinkFiltersChange({ ...linkFilters, newConstruction: v === true })}
                    />
                    New construction
                  </label>
                </div>

                {showDomControls ? (
                  <div className="grid min-w-0 max-w-full grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="min-w-0">
                      <p className="mb-1 text-[11px] font-medium text-[var(--atlantic-navy)]">Days on market (min)</p>
                      <Input
                        inputMode="numeric"
                        placeholder="Any"
                        value={linkFilters.minDom}
                        onChange={(e) => onLinkFiltersChange({ ...linkFilters, minDom: e.target.value })}
                        className="h-10 w-full min-w-0 max-w-full rounded-lg border-[var(--cedar-shingle)]/25 text-sm"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 text-[11px] font-medium text-[var(--atlantic-navy)]">Days on market (max)</p>
                      <Input
                        inputMode="numeric"
                        placeholder="Any"
                        value={linkFilters.maxDom}
                        onChange={(e) => onLinkFiltersChange({ ...linkFilters, maxDom: e.target.value })}
                        className="h-10 w-full min-w-0 max-w-full rounded-lg border-[var(--cedar-shingle)]/25 text-sm"
                      />
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>

          <SheetFooter className="shrink-0 flex-col gap-2 border-t border-[var(--cedar-shingle)]/20 bg-[var(--sandstone)]/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
            <Button type="button" className="h-11 w-full bg-blue-700 text-[15px] font-semibold text-white hover:bg-blue-800" onClick={() => setOpen(false)}>
              Apply filters
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
