"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/components/ui/utils";

export const PROPERTY_MAP_SECTION_IDS = {
  ourTake: "property-map-section-our-take",
  parcelInfo: "property-map-section-parcel-info",
  zoning: "property-map-section-zoning",
  uses: "property-map-section-uses",
  timeline: "property-map-section-timeline",
  comps: "property-map-section-comps",
} as const;

export type PropertyMapSectionKey = keyof typeof PROPERTY_MAP_SECTION_IDS;

type VisibleMap = Partial<Record<PropertyMapSectionKey, boolean>>;

const CHIP_LABELS: Record<PropertyMapSectionKey, string> = {
  ourTake: "Our Take",
  parcelInfo: "Property Info",
  zoning: "Zoning",
  uses: "Allowable Uses",
  timeline: "Timeline",
  comps: "Comps",
};

const CHIP_ORDER: PropertyMapSectionKey[] = ["ourTake", "parcelInfo", "zoning", "uses", "timeline", "comps"];

/**
 * Sticky bar height budget for scroll spy + section scroll-margin (address + chip row).
 * Keep in sync with `propertyMapSectionScrollClass` (Tailwind needs a literal `scroll-mt-[…]` in source).
 */
const STICKY_NAV_TOP_OFFSET_PX = 92;

function scrollSectionIntoView(id: string) {
  const el = document.getElementById(id);
  const root = el?.closest("[data-property-map-drawer-scroll]") as HTMLElement | null;
  if (!el || !root) return;
  /** Scroll the drawer column only on Y — `scrollIntoView` can nudge the page horizontally on some layouts. */
  const rootRect = root.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const deltaY = elRect.top - rootRect.top - STICKY_NAV_TOP_OFFSET_PX;
  root.scrollBy({ top: deltaY, left: 0, behavior: "smooth" });
}

function visibleChipKeys(visible: VisibleMap): PropertyMapSectionKey[] {
  return CHIP_ORDER.filter((k) => visible[k] !== false);
}

type Props = {
  visible: VisibleMap;
  /** Property headline / street address; shown above chips in the same sticky bar. */
  addressLine?: string | null;
  /** In-app parcel-first property page (`/property/…`) when derivable from MLS or assessor location. */
  propertyDetailHref?: string | null;
  className?: string;
  /** Fires when the highlighted section changes (scroll spy or chip tap). */
  onActiveSectionChange?: (section: PropertyMapSectionKey) => void;
};

/** Horizontal chip strip; sticky within the drawer scroll area, below the hero. */
export function PropertyMapSlideUpSectionNav({
  visible,
  addressLine,
  propertyDetailHref = null,
  className,
  onActiveSectionChange,
}: Props) {
  const navRef = useRef<HTMLDivElement>(null);
  const visibleKeys = useMemo(
    () => visibleChipKeys(visible),
    [visible.ourTake, visible.parcelInfo, visible.zoning, visible.uses, visible.timeline, visible.comps],
  );

  const [activeSection, setActiveSection] = useState<PropertyMapSectionKey>(() => visibleKeys[0] ?? "ourTake");

  useEffect(() => {
    if (!visibleKeys.includes(activeSection)) {
      const next = visibleKeys[0] ?? "ourTake";
      setActiveSection(next);
    }
  }, [visibleKeys, activeSection]);

  useEffect(() => {
    onActiveSectionChange?.(activeSection);
  }, [activeSection, onActiveSectionChange]);

  useEffect(() => {
    const nav = navRef.current;
    const root = nav?.closest("[data-property-map-drawer-scroll]") as HTMLElement | null;
    if (!root || visibleKeys.length === 0) return;

    const ratios = new Map<string, number>();
    let raf = 0;

    const pickBest = () => {
      let best: PropertyMapSectionKey | null = null;
      let bestRatio = 0;
      for (const key of visibleKeys) {
        const id = PROPERTY_MAP_SECTION_IDS[key];
        const r = ratios.get(id) ?? 0;
        if (r > bestRatio) {
          bestRatio = r;
          best = key;
        }
      }
      if (best != null && bestRatio > 0) setActiveSection(best);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target.id) ratios.set(e.target.id, e.intersectionRatio);
        }
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(pickBest);
      },
      {
        root,
        /** Shrink viewport from top (sticky address + chips) and bottom so the “active” section is the one in the reading band. */
        rootMargin: `-${STICKY_NAV_TOP_OFFSET_PX}px 0px -45% 0px`,
        threshold: [0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1],
      },
    );

    for (const key of visibleKeys) {
      const el = document.getElementById(PROPERTY_MAP_SECTION_IDS[key]);
      if (el) io.observe(el);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [visibleKeys]);

  const trimmedAddress = addressLine?.trim() ?? "";

  return (
    <div
      ref={navRef}
      className={cn(
        "sticky top-0 z-20 border-b border-[var(--cedar-shingle)]/15 bg-white/95 px-4 pb-2 pt-2 backdrop-blur-sm",
        className,
      )}
    >
      {trimmedAddress ? (
        <p className="mb-1.5 line-clamp-2 text-left text-sm font-semibold leading-snug text-[var(--atlantic-navy)]">
          {trimmedAddress}
        </p>
      ) : null}
      {propertyDetailHref ? (
        <div className="mb-2">
          <Link
            href={propertyDetailHref}
            className="text-xs font-semibold text-[var(--privet-green)] underline-offset-2 hover:underline"
          >
            Full property page (assessor + MLS context) →
          </Link>
        </div>
      ) : null}
      <div
        className="flex flex-wrap justify-start gap-1.5 pb-0.5"
        role="tablist"
        aria-label={trimmedAddress ? `Parcel sections · ${trimmedAddress}` : "Parcel detail sections"}
      >
        {CHIP_ORDER.map((key) => {
          if (visible[key] === false) return null;
          const id = PROPERTY_MAP_SECTION_IDS[key];
          const isActive = activeSection === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setActiveSection(key);
                scrollSectionIntoView(id);
              }}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold shadow-sm transition-colors",
                isActive
                  ? "border-[var(--atlantic-navy)] bg-[var(--atlantic-navy)] text-white hover:bg-[var(--atlantic-navy)]/92"
                  : "border-[var(--cedar-shingle)]/25 bg-[var(--sandstone)]/50 text-[var(--atlantic-navy)] hover:bg-[var(--sandstone)]/80 active:bg-[var(--sandstone)]",
              )}
            >
              {CHIP_LABELS[key]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function propertyMapSectionScrollClass() {
  return "scroll-mt-[92px]";
}
