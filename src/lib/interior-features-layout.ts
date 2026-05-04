import type { CncListing } from "@/lib/cnc-api";

function pickStr(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const t = raw.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
  return t.length ? t : undefined;
}

function interiorFeatureItems(l: CncListing): string[] {
  const v = l.InteriorFeatures;
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

type ParsedFromList = {
  codes: string[];
  floor1?: string;
  floor2?: string;
  floor3?: string;
  studio?: string;
};

/** LINK packs misc tokens into `InteriorFeatures` (e.g. `AC,Ins,Irr,OSh`). AC stays on Cooling only. */
const OTHER_INTERIOR_CODES: Record<string, string> = {
  ins: "Insulation",
  irr: "Irrigation",
  osh: "Outdoor shower",
};

function isAcToken(t: string): boolean {
  const k = t.replace(/\s+/g, "").toLowerCase();
  return k === "ac" || k === "a/c";
}

/** Flatten comma/semicolon-separated tokens from raw `codes` lines. */
function flattenCodeTokens(codes: string[]): string[] {
  const out: string[] = [];
  for (const line of codes) {
    for (const raw of line.split(/[,;]+/)) {
      const t = raw.trim();
      if (t) out.push(t);
    }
  }
  return out;
}

function partitionInteriorCodes(codes: string[]): {
  interiorLines: string[];
  otherFeatureLabels: string[];
} {
  const tokens = flattenCodeTokens(codes);
  const interiorRaw: string[] = [];
  const otherSeen = new Set<string>();
  const otherOrdered: string[] = [];

  for (const t of tokens) {
    if (isAcToken(t)) continue;
    const key = t.replace(/\s+/g, "").toLowerCase();
    const other = OTHER_INTERIOR_CODES[key];
    if (other) {
      if (!otherSeen.has(other)) {
        otherSeen.add(other);
        otherOrdered.push(other);
      }
      continue;
    }
    interiorRaw.push(t);
  }

  const interiorLines =
    interiorRaw.length > 0
      ? [interiorRaw.map((x) => x.replace(/,/g, ", ").trim()).join(", ")]
      : [];

  return { interiorLines, otherFeatureLabels: otherOrdered };
}

/** Pull `Floor n:` lines (and studio-like paragraphs) out of the `InteriorFeatures` list. */
function parseInteriorFeaturesArray(items: string[]): ParsedFromList {
  const codes: string[] = [];
  let floor1: string | undefined;
  let floor2: string | undefined;
  let floor3: string | undefined;
  let studio: string | undefined;

  const floorRe = /^floor\s*(\d+)\s*:\s*(.*)$/i;
  for (const item of items) {
    const fm = item.match(floorRe);
    if (fm) {
      const n = parseInt(fm[1]!, 10);
      const body = fm[2]!.trim();
      if (!body) continue;
      if (n === 1) floor1 = floor1 ?? body;
      else if (n === 2) floor2 = floor2 ?? body;
      else if (n === 3) floor3 = floor3 ?? body;
      continue;
    }
    if (/\bstudio\b/i.test(item) && item.length >= 10) {
      studio = studio ?? item.trim();
      continue;
    }
    codes.push(item);
  }
  return { codes, floor1, floor2, floor3, studio };
}

export type InteriorFeaturesDisplayParts = {
  /** Interior codes + DescFloor / parsed floor / studio (multiline). Excludes Ins/Irr/OSh. */
  interior: string | null;
  /** Mapped labels from coded tokens (Insulation, Irrigation, Outdoor shower). */
  otherFeatures: string | null;
};

/**
 * Interior narrative blocks vs. LINK “other” codes (Ins, Irr, OSh). AC is omitted here (Cooling only).
 */
export function getInteriorFeaturesDisplayParts(l: CncListing): InteriorFeaturesDisplayParts {
  const items = interiorFeatureItems(l);
  const parsed = parseInteriorFeaturesArray(items);

  const floor1 = pickStr(l.DescFloor1) ?? parsed.floor1;
  const floor2 = pickStr(l.DescFloor2) ?? parsed.floor2;
  const floor3 = pickStr(l.DescFloor3) ?? parsed.floor3;
  const studio = pickStr(l.studio) ?? pickStr(l.Studio) ?? parsed.studio;

  const { interiorLines, otherFeatureLabels } = partitionInteriorCodes(parsed.codes);

  const blocks: string[] = [];
  if (interiorLines.length) {
    blocks.push(["Interior features", ...interiorLines].join("\n"));
  }
  if (floor1) blocks.push(["Floor 1", floor1].join("\n"));
  if (floor2) blocks.push(["Floor 2", floor2].join("\n"));
  if (floor3) blocks.push(["Floor 3", floor3].join("\n"));
  if (studio) blocks.push(["Studio", studio].join("\n"));

  const interior = blocks.join("\n\n").trim() || null;
  const otherFeatures =
    otherFeatureLabels.length > 0 ? otherFeatureLabels.join(", ") : null;

  return { interior, otherFeatures };
}
