/** Shared buy-side $/SF signal logic for listing benchmark UI and server payload. */

export type BuyerSignal = "favorable" | "neutral" | "caution" | "premium";

export function pctDiffNum(a: number | null, b: number | null): number | null {
  if (a == null || b == null || b === 0) return null;
  return ((a - b) / b) * 100;
}

export function formatPctSignedOneDecimal(p: number): string {
  const v = Math.round(p * 10) / 10;
  return `${v >= 0 ? "+" : ""}${v}%`;
}

export function buyerSignalVsBench(subject: number | null, bench: number | null): BuyerSignal {
  const d = pctDiffNum(subject, bench);
  if (d == null) return "neutral";
  if (d < -0.5) return "favorable";
  if (d <= 0.5) return "neutral";
  if (d <= 18) return "caution";
  return "premium";
}

export function signalToneClasses(signal: BuyerSignal): { wrap: string; text: string } {
  switch (signal) {
    case "favorable":
      return {
        wrap: "bg-emerald-100 text-emerald-950 ring-1 ring-emerald-400/90",
        text: "text-emerald-950",
      };
    case "caution":
      return {
        wrap: "bg-amber-100 text-amber-950 ring-1 ring-amber-400/90",
        text: "text-amber-950",
      };
    case "premium":
      return {
        wrap: "bg-rose-100 text-rose-950 ring-1 ring-rose-400/90",
        text: "text-rose-950",
      };
    default:
      return {
        wrap: "bg-slate-200/90 text-slate-950 ring-1 ring-slate-400/80",
        text: "text-slate-950",
      };
  }
}

export type ListingIslandValueScore = {
  p: number;
  sentence: string;
  signal: BuyerSignal;
};

/** Island benchmark: sold 12 mo avg when present, else active island avg (same as benchmark dashboard). */
export function computeIslandValueScoreSnapshot(
  thisPpsfHighlight: number | null,
  islandSoldAvg: number | null,
  islandActiveAvg: number | null,
): ListingIslandValueScore | null {
  const bench = islandSoldAvg ?? islandActiveAvg;
  if (thisPpsfHighlight == null || bench == null || bench <= 0) return null;
  const pVal = ((thisPpsfHighlight - bench) / bench) * 100;
  const kind = islandSoldAvg != null ? ("sold (12 mo)" as const) : ("active" as const);
  const abs = Math.abs(Math.round(pVal * 10) / 10);
  let sentence: string;
  if (Math.abs(pVal) < 0.75) {
    sentence = `About in line with the island-wide ${kind} average on a price-per-square-foot basis.`;
  } else if (pVal < 0) {
    sentence = `This home is priced ${abs}% lower per square foot than the island-wide ${kind} average.`;
  } else {
    sentence = `This home is priced ${abs}% higher per square foot than the island-wide ${kind} average.`;
  }
  return {
    p: pVal,
    sentence,
    signal: buyerSignalVsBench(thisPpsfHighlight, bench),
  };
}
