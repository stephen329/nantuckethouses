/**
 * Unified analytics helpers for GTM dataLayer + Klaviyo event tracking.
 *
 * Usage (client components only):
 *   import { trackEvent } from "@/lib/analytics";
 *   trackEvent("Used_Cost_Calculator", { neighborhood: "Sconset", finishLevel: "Premium" });
 */

type EventPayload = Record<string, string | number | boolean | undefined>;

/** Push an event to GTM dataLayer + Klaviyo */
export function trackEvent(eventName: string, payload?: EventPayload) {
  if (typeof window === "undefined") return;

  // GTM dataLayer
  const dataLayer = (window as any).dataLayer;
  if (Array.isArray(dataLayer)) {
    dataLayer.push({ event: eventName, ...payload });
  }

  // Klaviyo
  const klaviyo = (window as any).klaviyo;
  if (klaviyo) {
    klaviyo.push(["track", eventName, payload ?? {}]);
  }
}

/**
 * Key events to track across the site:
 *
 * - Newsletter_Subscribe_From_Home   (homepage signup)
 * - Clicked_Gut_Check_CTA            (feasibility CTA)
 * - Used_Cost_Calculator             (calculator tool)
 * - Viewed_HDC_Recap                 (scroll depth on recap page)
 * - Zoning_Lookup_Attempt            (zoning tool usage)
 * - Downloaded_Vendor_Rate_Sheet     (gated PDF download)
 * - Downloaded_Market_Report         (gated report download)
 * - Downloaded_Cheat_Sheet           (gated cheat sheet)
 */
