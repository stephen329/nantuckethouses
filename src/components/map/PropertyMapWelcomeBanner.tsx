"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "nh-property-map-welcome-dismissed";

export function PropertyMapWelcomeBanner() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        if (typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY) === "1") {
          setHidden(true);
        }
      } catch {
        /* ignore */
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  if (hidden) return null;

  return (
    <div className="relative rounded-lg border border-[var(--privet-green)]/35 bg-white px-4 py-3 pr-12 text-sm text-[var(--atlantic-navy)] shadow-sm">
      <p className="font-medium">Welcome to the new Nantucket Property Map</p>
      <p className="mt-1 text-[var(--nantucket-gray)]">
        Live vacation rentals, your familiar parcel and zoning overlays, and (soon) MLS for sale and sold comps — all in one place.
      </p>
      <p className="mt-2">
        <Link href="#parcel-zoning-panel" className="text-[var(--privet-green)] underline hover:no-underline">
          Still need just zoning?
        </Link>{" "}
        <span className="text-[var(--nantucket-gray)]">
          — use the parcel panel on the right (desktop) after you tap a lot on the map.
        </span>
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8 text-[var(--nantucket-gray)]"
        onClick={dismiss}
        aria-label="Dismiss welcome message"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
