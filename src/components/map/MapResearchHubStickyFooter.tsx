"use client";

import Link from "next/link";
import { cn } from "@/components/ui/utils";
import { SCHEDULE_CALL_URL } from "@/lib/schedule-call-url";

type Props = {
  className?: string;
};

/** Sticky lead + compliance strip for the property map research hub (desktop sidebar + mobile drawer). */
export function MapResearchHubStickyFooter({ className }: Props) {
  return (
    <div className={cn("shrink-0 space-y-2", className)}>
      <a
        href={SCHEDULE_CALL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center rounded-md bg-[var(--privet-green)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brass-hover)]"
      >
        Schedule a Call
      </a>
      <p className="flex flex-wrap items-center justify-center gap-x-1 text-center text-[10px] leading-snug text-[var(--nantucket-gray)]/85">
        <a
          href="tel:+15084510191"
          className="inline-flex min-h-10 max-w-full items-center rounded-md px-2 underline-offset-2 hover:underline"
          aria-label="Call Stephen Maury at (508) 451-0191"
        >
          (508) 451-0191
        </a>
        <span className="shrink-0 text-[var(--nantucket-gray)]/45" aria-hidden>
          ·
        </span>
        <a
          href="mailto:stephen@maury.net"
          className="inline-flex min-h-10 max-w-full items-center rounded-md px-2 underline-offset-2 hover:underline"
          aria-label="Email stephen@maury.net"
        >
          stephen@maury.net
        </a>
      </p>
      <nav
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] text-[var(--nantucket-gray)]/55"
        aria-label="Legal and policies"
      >
        <Link href="/privacy" className="hover:text-[var(--atlantic-navy)]/75 hover:underline">
          Privacy
        </Link>
        <span className="text-[var(--nantucket-gray)]/35" aria-hidden>
          ·
        </span>
        <Link href="/terms" className="hover:text-[var(--atlantic-navy)]/75 hover:underline">
          Terms
        </Link>
        <span className="text-[var(--nantucket-gray)]/35" aria-hidden>
          ·
        </span>
        <Link href="/disclaimer" className="hover:text-[var(--atlantic-navy)]/75 hover:underline">
          Disclaimer
        </Link>
      </nav>
    </div>
  );
}
