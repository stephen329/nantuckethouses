"use client";

import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/components/ui/utils";

type Props = {
  className?: string;
};

export function MapLegalNoticeButton({ className }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--cedar-shingle)]/35 bg-white/95 text-[var(--atlantic-navy)] shadow-sm hover:bg-[var(--sandstone)]",
            className,
          )}
          aria-label="Site information and legal"
        >
          <Info className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(calc(100vw-2rem),20rem)] space-y-2 text-left text-xs leading-snug">
        <p className="font-semibold text-[var(--atlantic-navy)]">© {new Date().getFullYear()} NantucketHouses.com</p>
        <p className="text-[var(--nantucket-gray)]">
          Stephen Maury, Licensed Broker, Owner Congdon &amp; Coleman Real Estate
        </p>
        <p className="text-[var(--nantucket-gray)]">
          Data sources from LINK MLS, Town of Nantucket and proprietary data.
        </p>
        <p className="text-[var(--nantucket-gray)]">
          Tools are for research only and are not a substitute for professional advice.
        </p>
      </PopoverContent>
    </Popover>
  );
}
