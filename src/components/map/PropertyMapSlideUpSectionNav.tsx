"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/components/ui/utils";

export const PROPERTY_MAP_SECTION_IDS = {
  ourTake: "property-map-section-our-take",
  parcelInfo: "property-map-section-parcel-info",
  zoning: "property-map-section-zoning",
  uses: "property-map-section-uses",
  timeline: "property-map-section-timeline",
} as const;

export type PropertyMapSectionKey = keyof typeof PROPERTY_MAP_SECTION_IDS;

type VisibleMap = Partial<Record<PropertyMapSectionKey, boolean>>;

const CHIP_LABELS: Record<PropertyMapSectionKey, string> = {
  ourTake: "Our Take",
  parcelInfo: "Parcel Info",
  zoning: "Zoning",
  uses: "Allowable Uses",
  timeline: "Timeline",
};

const CHIP_ORDER: PropertyMapSectionKey[] = ["ourTake", "parcelInfo", "zoning", "uses", "timeline"];

function scrollSectionIntoView(id: string) {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function visibleChipKeys(visible: VisibleMap): PropertyMapSectionKey[] {
  return CHIP_ORDER.filter((k) => visible[k] !== false);
}

type Props = {
  visible: VisibleMap;
  className?: string;
  /** Fires when the highlighted section changes (scroll spy or chip tap). */
  onActiveSectionChange?: (section: PropertyMapSectionKey) => void;
};

/** Horizontal chip strip; sticky within the drawer scroll area, below the hero. */
export function PropertyMapSlideUpSectionNav({ visible, className, onActiveSectionChange }: Props) {
  const navRef = useRef<HTMLDivElement>(null);
  const visibleKeys = useMemo(
    () => visibleChipKeys(visible),
    [visible.ourTake, visible.parcelInfo, visible.zoning, visible.uses, visible.timeline],
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
        /** Shrink viewport from top (sticky chips) and bottom so the “active” section is the one in the reading band. */
        rootMargin: "-52px 0px -45% 0px",
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

  return (
    <div
      ref={navRef}
      className={cn(
        "sticky top-0 z-20 -mx-4 border-b border-[var(--cedar-shingle)]/15 bg-white/95 px-4 py-2 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex flex-wrap justify-center gap-1.5 pb-0.5" role="tablist" aria-label="Parcel detail sections">
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
  return "scroll-mt-[52px]";
}
