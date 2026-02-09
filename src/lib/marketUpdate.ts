/**
 * Build a Facebook/Meta-ready market update post from Repliers-derived stats and insights.
 * Used by /api/meta-market-update to generate and optionally post to Meta.
 */

export type MarketUpdateInput = {
  activeListingCount: number | null;
  medianListPrice: number | null;
  medianDaysOnMarket: number | null;
  insights: Array<{ type: "trend" | "anomaly"; statement: string }>;
};

const SITE_URL = "https://nantuckethouses.com";

function formatPrice(n: number): string {
  if (n >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `$${(n / 1_000).toFixed(0)}K`;
  }
  return `$${n.toLocaleString()}`;
}

/**
 * Build a short, post-ready market update (1–3 sentences + optional link).
 * Kept concise for social; you can add a second paragraph if needed.
 */
export function buildMarketUpdatePost(input: MarketUpdateInput): string {
  const parts: string[] = [];
  const { activeListingCount, medianListPrice, medianDaysOnMarket, insights } =
    input;

  // Opening: current snapshot
  const statsLine: string[] = [];
  if (typeof activeListingCount === "number") {
    statsLine.push(`${activeListingCount} active listing${activeListingCount !== 1 ? "s" : ""} on the island`);
  }
  if (typeof medianListPrice === "number" && medianListPrice > 0) {
    statsLine.push(`median list price ${formatPrice(medianListPrice)}`);
  }
  if (statsLine.length > 0) {
    parts.push(
      `Nantucket market update: ${statsLine.join(", ")}.`
    );
  } else {
    parts.push("Nantucket market update:");
  }

  // One insight (prefer trend over anomaly)
  const trend = insights.find((i) => i.type === "trend");
  const anomaly = insights.find((i) => i.type === "anomaly");
  const insight = trend ?? anomaly;
  if (insight) {
    // Shorten for social: remove "—based on closed sales from the Repliers MLS feed" if present
    let sentence = insight.statement.replace(
      /—based on closed sales from the Repliers MLS feed\.?$/i,
      ""
    ).trim();
    if (sentence && !/\.$/.test(sentence)) sentence += ".";
    if (sentence) parts.push(sentence);
  }

  if (typeof medianDaysOnMarket === "number" && medianDaysOnMarket >= 1) {
    parts.push(`Median days on market: ${Math.round(medianDaysOnMarket)}.`);
  }

  parts.push(`Data via Repliers MLS.`);
  parts.push(`${SITE_URL}`);

  return parts.filter(Boolean).join(" ");
}
