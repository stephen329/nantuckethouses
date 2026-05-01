"use client";

import { Calendar, Mail } from "lucide-react";
import Link from "next/link";
import { cn } from "@/components/ui/utils";
import { SCHEDULE_CALL_URL } from "@/lib/schedule-call-url";

type Props = {
  className?: string;
  /** When false, hides phone and email (e.g. mobile slide-up drawer). */
  showContactLinks?: boolean;
  /** When false, hides Privacy / Terms / Disclaimer (e.g. mobile slide-up drawer). */
  showLegalNav?: boolean;
  /**
   * When set, renders **Message Stephen** above the primary CTA (property map mobile drawer).
   * Uses a tight vertical stack with clear visual separation so the two actions are hard to confuse.
   */
  messageStephenMailtoHref?: string;
  /** Defaults to calendar booking; set for vacation-rental pin context (e.g. listing or NR search). */
  primaryCtaHref?: string;
  /** Defaults to “Schedule a Call”. */
  primaryCtaLabel?: string;
};

/** Sticky lead + compliance strip for the property map research hub (desktop sidebar + mobile drawer). */
export function MapResearchHubStickyFooter({
  className,
  showContactLinks = true,
  showLegalNav = true,
  messageStephenMailtoHref,
  primaryCtaHref = SCHEDULE_CALL_URL,
  primaryCtaLabel = "Schedule a Call",
}: Props) {
  const leadMailto = messageStephenMailtoHref?.trim();
  const stackLeadAndPrimary = Boolean(leadMailto);

  const primaryCtaClass = cn(
    "flex w-full min-h-12 items-center justify-center rounded-md bg-[var(--privet-green)] px-4 py-3.5 text-sm font-semibold leading-snug text-white shadow-sm transition-colors hover:bg-[var(--brass-hover)]",
  );

  return (
    <div className={cn("shrink-0 flex w-full flex-col gap-2", className)}>
      {stackLeadAndPrimary ? (
        <div className="flex w-full flex-col gap-2">
          <a
            href={leadMailto!}
            className={cn(
              "flex w-full min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-md border-2 border-[var(--atlantic-navy)]",
              "bg-white px-4 py-2.5 text-sm font-semibold text-[var(--atlantic-navy)] shadow-sm transition-colors",
              "hover:bg-[var(--sandstone)]/35 active:bg-[var(--sandstone)]/50",
            )}
            title="Custom valuation or property tour — opens your email app"
            aria-label="Message Stephen by email about a custom valuation or property tour"
          >
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              Message Stephen
            </span>
            <span className="text-center text-[10px] font-medium leading-tight text-[var(--nantucket-gray)]">
              Opens your email app
            </span>
          </a>
          <a
            href={primaryCtaHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(primaryCtaClass, "min-h-[3.25rem] flex-col gap-0.5 py-2.5")}
            aria-label={`${primaryCtaLabel} — opens a calendar booking page in a new tab`}
          >
            <span className="flex items-center gap-2 text-white">
              <Calendar className="h-4 w-4 shrink-0" aria-hidden />
              {primaryCtaLabel}
            </span>
            <span className="text-center text-[10px] font-medium leading-tight text-white/85">
              New tab · book a time
            </span>
          </a>
        </div>
      ) : (
        <a href={primaryCtaHref} target="_blank" rel="noopener noreferrer" className={primaryCtaClass}>
          {primaryCtaLabel}
        </a>
      )}
      {showContactLinks ? (
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
      ) : null}
      {showLegalNav ? (
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
      ) : null}
    </div>
  );
}
