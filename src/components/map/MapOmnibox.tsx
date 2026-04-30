"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Command, CommandGroup, CommandItem, CommandList } from "cmdk";
import { Building2, Home, MapPin, Search, Ship, Trees } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/components/ui/utils";
import type { PropertyMapMode } from "@/lib/property-map-filters";
import type { OmniboxActiveListing, OmniboxResponse, OmniboxRentalHit, OmniboxSoldComp } from "@/lib/map-omnibox-types";
import { pushRecentOmniboxSearch, readRecentOmniboxSearches, type OmniboxRecentEntry } from "@/lib/omnibox-local-storage";

const SLASH_HINT_KEY = "nh-map-omnibox-slash-hint-dismissed";

type MapBounds = { west: number; south: number; east: number; north: number };

type Props = {
  mapMode: PropertyMapMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyNlPreset: (id: string) => void;
  onSelectParcelId: (parcelId: string, fly?: { lat: number; lng: number }) => void;
  onSelectRentalHit: (hit: OmniboxRentalHit) => void;
  onSelectLinkHit: (hit: OmniboxActiveListing | OmniboxSoldComp, pool: "active" | "sold") => void;
  onSelectNeighborhoodSlug: (slug: string) => void;
  /** Current map viewport for GET /api/map/omnibox bounds=… */
  mapBounds: MapBounds | null;
  /** Desktop hover: highlight parcel / pin on map. */
  onPreviewChange?: (preview: { parcelId?: string; lng?: number; lat?: number } | null) => void;
  /** Increment (e.g. suggestion chip) to prefill and open the omnibox. */
  prefillNonce?: number;
  prefillQuery?: string;
};

const QUICK = [
  { slug: "town", label: "Town", icon: Building2 },
  { slug: "sconset", label: "Sconset", icon: Home },
  { slug: "surfside", label: "Surfside", icon: Trees },
] as const;

export function MapOmnibox({
  mapMode,
  open,
  onOpenChange,
  onApplyNlPreset,
  onSelectParcelId,
  onSelectRentalHit,
  onSelectLinkHit,
  onSelectNeighborhoodSlug,
  mapBounds,
  onPreviewChange,
  prefillNonce = 0,
  prefillQuery = "",
}: Props) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OmniboxResponse | null>(null);
  const [recents, setRecents] = useState<OmniboxRecentEntry[]>([]);
  const [showSlashHint, setShowSlashHint] = useState(false);
  const [wideViewport, setWideViewport] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Ignores stale HTTP responses when the query changes faster than the network. */
  const omniboxRequestSeq = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWideViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!prefillQuery.trim() || prefillNonce < 1) return;
    setValue(prefillQuery);
    onOpenChange(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [prefillNonce, prefillQuery, onOpenChange]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShowSlashHint(!localStorage.getItem(SLASH_HINT_KEY));
  }, []);

  useEffect(() => {
    setRecents(readRecentOmniboxSearches());
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select, [contenteditable=true]") && t !== inputRef.current) return;
      e.preventDefault();
      onOpenChange(true);
      requestAnimationFrame(() => inputRef.current?.focus());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  const dismissSlashHint = useCallback(() => {
    setShowSlashHint(false);
    try {
      localStorage.setItem(SLASH_HINT_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const runSearch = useCallback(
    async (q: string, seq: number) => {
      if (q.trim().length < 2) {
        if (omniboxRequestSeq.current === seq) {
          setData(null);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      try {
        const sp = new URLSearchParams({ q: q.trim(), mode: mapMode });
        if (mapBounds) {
          sp.set("bounds", `${mapBounds.west},${mapBounds.south},${mapBounds.east},${mapBounds.north}`);
        }
        const res = await fetch(`/api/map/omnibox?${sp.toString()}`);
        const json = (await res.json()) as OmniboxResponse;
        if (omniboxRequestSeq.current !== seq) return;
        if (!res.ok) {
          setData(json?.query != null ? json : null);
          return;
        }
        setData(json);
      } catch {
        if (omniboxRequestSeq.current === seq) setData(null);
      } finally {
        if (omniboxRequestSeq.current === seq) setLoading(false);
      }
    },
    [mapMode, mapBounds],
  );

  useEffect(() => {
    const seq = ++omniboxRequestSeq.current;
    const t = window.setTimeout(() => {
      void runSearch(value, seq);
    }, 320);
    return () => window.clearTimeout(t);
  }, [value, runSearch]);

  const hitCount = data
    ? data.parcels.length +
      data.neighborhoods.length +
      data.rentals.length +
      data.activeListings.length +
      data.soldComps.length
    : 0;

  const clearPreview = () => onPreviewChange?.(null);

  const applyTopHit = useCallback(() => {
    const q = value.trim();
    if (q.length < 2 || loading || !data) return;
    const qLower = q.toLowerCase();
    const nhExact = data.neighborhoods.find((n) => n.slug.toLowerCase() === qLower);
    if (nhExact) {
      onSelectNeighborhoodSlug(nhExact.slug);
      pushRecentOmniboxSearch(nhExact.name);
      clearPreview();
      onOpenChange(false);
      return;
    }
    if (data.neighborhoods.length === 1) {
      const n = data.neighborhoods[0];
      onSelectNeighborhoodSlug(n.slug);
      pushRecentOmniboxSearch(n.name);
      clearPreview();
      onOpenChange(false);
      return;
    }
    const p0 = data.parcels[0];
    if (p0) {
      onSelectParcelId(p0.parcel_id, { lat: p0.lat, lng: p0.lng });
      pushRecentOmniboxSearch(p0.address);
      clearPreview();
      onOpenChange(false);
      return;
    }
    const r0 = data.rentals[0];
    if (r0) {
      onSelectRentalHit(r0);
      pushRecentOmniboxSearch(r0.headline || r0.address);
      clearPreview();
      onOpenChange(false);
      return;
    }
    const a0 = data.activeListings[0];
    if (a0) {
      onSelectLinkHit(a0, "active");
      pushRecentOmniboxSearch(a0.address);
      clearPreview();
      onOpenChange(false);
      return;
    }
    const s0 = data.soldComps[0];
    if (s0) {
      onSelectLinkHit(s0, "sold");
      pushRecentOmniboxSearch(s0.address);
      clearPreview();
      onOpenChange(false);
    }
  }, [
    value,
    loading,
    data,
    onSelectNeighborhoodSlug,
    onSelectParcelId,
    onSelectRentalHit,
    onSelectLinkHit,
    onOpenChange,
    onPreviewChange,
  ]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) clearPreview();
        onOpenChange(next);
      }}
    >
      <PopoverAnchor asChild>
        <div className="relative w-full overflow-hidden rounded-xl border border-[var(--cedar-shingle)]/25 bg-white shadow-md ring-1 ring-slate-900/[0.06] lg:border-[var(--cedar-shingle)]/30 lg:shadow-lg lg:shadow-slate-900/10">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--nantucket-gray)] lg:left-3.5 lg:h-5 lg:w-5" />
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
              const q = value.trim();
              if (q.length < 2) return;
              e.preventDefault();
              applyTopHit();
            }}
            onFocus={() => {
              dismissSlashHint();
              onOpenChange(true);
            }}
            placeholder={
              wideViewport
                ? "Search address, Tax Map/Parcel, or neighborhood (e.g. Sconset, Polpis)"
                : "Search address, Tax Map/Parcel, or neighborhood…"
            }
            className="h-12 w-full rounded-none border-0 bg-white pl-10 pr-3 text-base text-[var(--atlantic-navy)] shadow-none outline-none ring-0 placeholder:text-[var(--nantucket-gray)] focus-visible:ring-2 focus-visible:ring-[var(--atlantic-navy)]/25 focus-visible:ring-offset-0 lg:h-14 lg:pl-11 lg:pr-4 lg:text-[17px]"
            aria-label="Map search"
            autoComplete="off"
          />
          {showSlashHint ? (
            <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 text-[10px] font-medium text-[var(--nantucket-gray)] opacity-70 sm:inline lg:right-4">
              Press / to search
            </span>
          ) : null}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={12}
        className={cn(
          "z-[60] max-w-none border-[var(--cedar-shingle)]/20 bg-white p-0 text-[var(--atlantic-navy)] shadow-lg",
          "w-[var(--radix-popover-trigger-width)] min-w-[min(100%,18rem)] max-w-[min(calc(100vw-2rem),36rem)] rounded-xl",
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={() => clearPreview()}
      >
        <Command className="rounded-md bg-white" shouldFilter={false}>
          <CommandList className="max-h-[min(70vh,28rem)] overflow-y-auto bg-white p-1">
            {value.trim().length < 2 ? (
              <>
                <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--nantucket-gray)]">Stephen&apos;s quick picks</p>
                {QUICK.map(({ slug, label, icon: Icon }) => (
                  <CommandItem
                    key={slug}
                    value={`pick-${slug}`}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 aria-selected:bg-[var(--sandstone)]"
                    onSelect={() => {
                      onSelectNeighborhoodSlug(slug);
                      pushRecentOmniboxSearch(label);
                      onOpenChange(false);
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[var(--privet-green)]" />
                    <span className="text-sm text-[var(--atlantic-navy)]">{label}</span>
                  </CommandItem>
                ))}
                {recents.length ? (
                  <CommandGroup heading="Recent searches" className="mt-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1">
                    {recents.map((r) => (
                      <CommandItem
                        key={`${r.label}-${r.ts}`}
                        value={r.label}
                        className="cursor-pointer rounded-sm px-2 py-1.5 text-sm aria-selected:bg-[var(--sandstone)]"
                        onSelect={() => {
                          setValue(r.label);
                        }}
                      >
                        {r.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}
              </>
            ) : loading ? (
              <p className="px-3 py-6 text-center text-sm text-[var(--nantucket-gray)]">Searching…</p>
            ) : data ? (
              <>
                {data.suggestions?.length ? (
                  <div className="mb-2 border-b border-[var(--cedar-shingle)]/10 px-2 pb-2">
                    <p className="pb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--nantucket-gray)]">Suggestions</p>
                    <ul className="space-y-1">
                      {data.suggestions.map((s) => (
                        <li key={s} className="text-[11px] leading-snug text-[var(--atlantic-navy)]">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {!loading && hitCount === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-[var(--nantucket-gray)]">No matches for that search.</p>
                ) : null}
                {data.parcels.length ? (
                  <CommandGroup heading="Parcels" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase">
                    {data.parcels.map((p) => (
                      <CommandItem
                        key={p.parcel_id}
                        value={`parcel-${p.parcel_id}`}
                        className="flex cursor-pointer gap-2 rounded-sm px-2 py-2 aria-selected:bg-[var(--sandstone)]"
                        onMouseEnter={() => onPreviewChange?.({ parcelId: p.parcel_id })}
                        onMouseLeave={clearPreview}
                        onSelect={() => {
                          onSelectParcelId(p.parcel_id, { lat: p.lat, lng: p.lng });
                          pushRecentOmniboxSearch(p.address);
                          clearPreview();
                          onOpenChange(false);
                        }}
                      >
                        <MapPin className="h-4 w-4 text-[var(--atlantic-navy)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--atlantic-navy)]">{p.address}</p>
                          <p className="text-xs text-[var(--nantucket-gray)]">
                            {p.taxMap} · {p.parcel}
                            {p.zone ? ` · ${p.zone}` : ""}
                            {p.expansionVerdict ? ` · ${p.expansionVerdict}` : ""}
                          </p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}
                {data.neighborhoods.length ? (
                  <CommandGroup heading="Neighborhoods" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase">
                    {data.neighborhoods.map((n) => (
                      <CommandItem
                        key={n.slug}
                        value={`nh-${n.slug}`}
                        className="flex cursor-pointer gap-2 rounded-sm px-2 py-2 aria-selected:bg-[var(--sandstone)]"
                        onMouseLeave={clearPreview}
                        onSelect={() => {
                          onSelectNeighborhoodSlug(n.slug);
                          pushRecentOmniboxSearch(n.name);
                          onOpenChange(false);
                        }}
                      >
                        <Trees className="h-4 w-4 text-[var(--privet-green)]" />
                        <span className="text-sm text-[var(--atlantic-navy)]">{n.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}
                {data.rentals.length ? (
                  <CommandGroup heading="Vacation rentals" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase">
                    {data.rentals.map((r) => (
                      <CommandItem
                        key={r.nrPropertyId}
                        value={`nr-${r.nrPropertyId}`}
                        className="cursor-pointer rounded-sm px-2 py-2 aria-selected:bg-[var(--sandstone)]"
                        onMouseEnter={() => onPreviewChange?.({ lng: r.lng, lat: r.lat })}
                        onMouseLeave={clearPreview}
                        onSelect={() => {
                          onSelectRentalHit(r);
                          pushRecentOmniboxSearch(r.headline || r.address);
                          clearPreview();
                          onOpenChange(false);
                        }}
                      >
                        <p className="text-sm font-medium text-[var(--atlantic-navy)]">{r.headline}</p>
                        <p className="text-xs text-[var(--nantucket-gray)]">
                          {r.address}
                          {r.priceLabel ? ` · ${r.priceLabel}` : ""}
                        </p>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}
                {data.activeListings.length ? (
                  <CommandGroup heading="LINK — For sale" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase">
                    {data.activeListings.map((l) => (
                      <CommandItem
                        key={l.id}
                        value={`link-a-${l.id}`}
                        className="flex cursor-pointer gap-2 rounded-sm px-2 py-2 aria-selected:bg-[var(--sandstone)]"
                        onMouseEnter={() => {
                          if (l.lat != null && l.lng != null) onPreviewChange?.({ lng: l.lng, lat: l.lat });
                        }}
                        onMouseLeave={clearPreview}
                        onSelect={() => {
                          onSelectLinkHit(l, "active");
                          pushRecentOmniboxSearch(l.address);
                          clearPreview();
                          onOpenChange(false);
                        }}
                      >
                        <Ship className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-[var(--atlantic-navy)]">{l.address}</p>
                          <p className="text-xs text-[var(--nantucket-gray)]">{l.priceLabel}</p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}
                {data.soldComps.length ? (
                  <CommandGroup heading="LINK — Sold" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase">
                    {data.soldComps.map((l) => (
                      <CommandItem
                        key={l.id}
                        value={`link-s-${l.id}`}
                        className="flex cursor-pointer gap-2 rounded-sm px-2 py-2 aria-selected:bg-[var(--sandstone)]"
                        onMouseEnter={() => {
                          if (l.lat != null && l.lng != null) onPreviewChange?.({ lng: l.lng, lat: l.lat });
                        }}
                        onMouseLeave={clearPreview}
                        onSelect={() => {
                          onSelectLinkHit(l, "sold");
                          pushRecentOmniboxSearch(l.address);
                          clearPreview();
                          onOpenChange(false);
                        }}
                      >
                        <Ship className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-sm font-medium text-[var(--atlantic-navy)]">{l.address}</p>
                          <p className="text-xs text-[var(--nantucket-gray)]">
                            {l.priceLabel}
                            {l.closeDate ? ` · ${l.closeDate}` : ""}
                          </p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}
                {data.nlSuggestions.length ? (
                  <div className="mt-2 border-t border-[var(--cedar-shingle)]/15 pt-2">
                    <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--nantucket-gray)]">Try asking</p>
                    {data.nlSuggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="mb-1 w-full rounded-md border border-dashed border-[var(--privet-green)]/35 bg-[var(--privet-green)]/5 px-2 py-2 text-left text-xs text-[var(--atlantic-navy)] hover:bg-[var(--privet-green)]/10"
                        onClick={() => {
                          onApplyNlPreset(s.id);
                          clearPreview();
                          onOpenChange(false);
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : !loading && !data ? (
              <p className="px-3 py-4 text-center text-sm text-[var(--nantucket-gray)]">Search unavailable. Try again.</p>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
