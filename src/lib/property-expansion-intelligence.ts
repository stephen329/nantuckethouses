import zoningData from "@/data/zoning-districts.json";

export type ExpansionParcelInput = {
  /** Lot area in square feet (assessor / parcel layer). */
  lotSizeSqft: number;
  /**
   * Measured or modeled existing ground-cover footprint (sq ft). Not in public parcel GeoJSON today —
   * when omitted, utilization is not computed and remaining shows full zoning envelope.
   */
  currentGroundCoverSqFt?: number | null;
};

export type ExpansionRule = {
  maxCover: number;
  secondaryMaxSqft: number;
  minLotSqft: number;
  hdcHeavy: boolean;
};

/** HIGH = strong headroom; MODERATE = middle; MAXED = at/near zoning ground-cover cap (≈98%+ when measured). */
export type ExpansionVerdictLevel = "HIGH" | "MODERATE" | "MAXED";

export type ExpansionIntelligence = {
  zoneCodeResolved: string;
  rule: ExpansionRule;
  allowedSqFt: number;
  usedSqFt: number | null;
  remainingSqFt: number;
  percentUtilized: number | null;
  verdictLevel: ExpansionVerdictLevel;
  verdictLine: string;
  canAddGuestHouse: boolean;
  canAddPool: boolean;
  hdcNote: string | null;
  mauryInsight: string;
  /** When true, utilization % is unknown; bar shows illustrative split only. */
  footprintUnknown: boolean;
};

type DistrictRow = {
  name?: string;
  minLotSize?: string;
  maxGroundCover?: string;
  hdcScrutiny?: string;
};

function parseGroundCoverRatio(s: string | undefined): number {
  if (!s) return 0.25;
  const m = s.match(/(\d+(?:\.\d+)?)\s*%/);
  return m ? Number(m[1]) / 100 : 0.25;
}

function parseMinLotSqft(s: string | undefined): number {
  if (!s) return 10_000;
  if (/\bacres?\b/i.test(s)) {
    const m = s.match(/([\d.]+)/);
    if (m) return Math.round(Number(m[1]) * 43_560);
  }
  const digits = s.replace(/,/g, "").match(/(\d+)/);
  return digits ? Number(digits[1]) : 10_000;
}

function hdcHeavyForDistrict(code: string, scrutiny: string | undefined): boolean {
  if (scrutiny === "Very High") return true;
  return ["ROH", "SOH", "CDT"].includes(code);
}

/** Guest-house style accessory cap (illustrative planning envelope, not a legal determination). */
function secondaryMaxForDistrict(code: string): number {
  if (code === "R-5") return 800;
  if (["CDT", "CI", "CMI"].includes(code)) return 0;
  return 600;
}

const districts = zoningData.districts as Record<string, DistrictRow>;

function buildRules(): Record<string, ExpansionRule> {
  const out: Record<string, ExpansionRule> = {};
  for (const [code, row] of Object.entries(districts)) {
    out[code] = {
      maxCover: parseGroundCoverRatio(row.maxGroundCover),
      minLotSqft: parseMinLotSqft(row.minLotSize),
      secondaryMaxSqft: secondaryMaxForDistrict(code),
      hdcHeavy: hdcHeavyForDistrict(code, row.hdcScrutiny),
    };
  }
  return out;
}

export const EXPANSION_RULES: Record<string, ExpansionRule> = buildRules();

const FALLBACK_RULE: ExpansionRule = {
  maxCover: 0.25,
  secondaryMaxSqft: 600,
  minLotSqft: 10_000,
  hdcHeavy: true,
};

export function normalizeZoningCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const u = String(raw).trim().toUpperCase().replace(/\s+/g, "");
  if (EXPANSION_RULES[u]) return u;
  const hyphen = u.replace(/-/g, "");
  if (districts[u]) return u;
  if (districts[hyphen]) return hyphen;
  const lug = u.match(/^LUG(\d)$/);
  if (lug) {
    const key = `LUG-${lug[1]}`;
    if (EXPANSION_RULES[key]) return key;
  }
  for (const code of Object.keys(EXPANSION_RULES)) {
    if (u === code.replace(/-/g, "")) return code;
  }
  return null;
}

/** Curated copy keyed by normalized zoning code (subset of island). */
export const MAURY_ZONE_INSIGHTS: Record<string, string> = {
  ROH:
    "Historic Town fabric: buyers pay for walkability and charm. Exterior changes are scrutinized — plan budget and timeline for HDC before underwriting upside.",
  SOH:
    "Special Old Historic allows slightly more ground cover than ROH; still expect full HDC choreography on anything visible from the street.",
  "R-10":
    "R-10 is the island’s liquidity sweet spot for many families — strong rental weeks, sensible setbacks, and predictable resale when improvements respect the envelope.",
  "R-20":
    "Half-acre+ lots: room for pools and guest programs, but ground cover caps are tight — expansion is often about smarter massing, not bigger boxes.",
  "R-40":
    "Near-acre zoning favors privacy and long views. Premium buyers expect landscape architecture and pool placement that respects low ground-cover ratios.",
  "R-5":
    "R-5 corridors (Monomoy, Sconset edges) reward pool + guest combinations when lot coverage is managed — weekly rents can jump materially with the right outdoor program.",
  "LUG-1":
    "LUG-1 is where many ‘estate lite’ plays live — check frontage, wetlands buffers, and septic before assuming pool + guest house both fit economically.",
  "LUG-2":
    "LUG-2 is mid-island volume and workforce-housing politics. Underwrite permitting and neighbor optics as carefully as dirt value.",
  "LUG-3":
    "LUG-3 is rural Nantucket — low ground cover and large frontage mean expansion math is usually about viewsheds and conservation, not maximized footprint.",
  CDT:
    "Downtown commercial: high ground cover but extreme HDC friction. Story-driven underwriting beats spreadsheet cap rates.",
};

function verdictFromRemaining(
  remaining: number,
  allowedSqFt: number,
  canGuest: boolean,
  percentUtilized: number | null,
): { level: ExpansionVerdictLevel; line: string } {
  if (percentUtilized != null && percentUtilized >= 98) {
    return {
      level: "MAXED",
      line: "Within ~2% of max ground cover — new mass is a variance or teardown story, not a simple add-on.",
    };
  }
  const headroom = allowedSqFt > 0 ? remaining / allowedSqFt : 0;
  if (headroom > 0.25 || canGuest) {
    return {
      level: "HIGH",
      line: "Strong expansion headroom (>25% envelope remaining or guest-house path under typical assumptions).",
    };
  }
  if (remaining > 600) {
    return {
      level: "MODERATE",
      line: "Room for selective additions — balance guest program, pool, and coverage carefully.",
    };
  }
  return {
    level: "MAXED",
    line: "Tight envelope — expect redesign, subsurface, or variance risk for material new mass.",
  };
}

function insightForZone(zoneCode: string, parcel: ExpansionParcelInput): string {
  const direct = MAURY_ZONE_INSIGHTS[zoneCode];
  if (direct) return direct;
  const lotK = parcel.lotSizeSqft / 1000;
  return `This ${lotK.toFixed(0)}k sq ft lot sits in ${zoneCode}. Confirm ground-cover baselines with a measured plan — parcel GIS does not include existing structure footprints yet.`;
}

export function getExpansionIntelligence(
  parcel: ExpansionParcelInput,
  zoneCodeRaw: string | null | undefined,
): ExpansionIntelligence {
  const zoneCodeResolved = normalizeZoningCode(zoneCodeRaw) ?? "R-10";
  const rule = EXPANSION_RULES[zoneCodeResolved] ?? FALLBACK_RULE;

  const lot = Math.max(0, parcel.lotSizeSqft);
  const allowedSqFt = Math.round(lot * rule.maxCover);
  const footprintUnknown = parcel.currentGroundCoverSqFt == null || Number.isNaN(parcel.currentGroundCoverSqFt);
  const usedSqFt = footprintUnknown ? null : Math.max(0, Math.min(parcel.currentGroundCoverSqFt as number, allowedSqFt));
  const remainingSqFt = footprintUnknown ? allowedSqFt : Math.max(0, allowedSqFt - (usedSqFt as number));
  const percentUtilized =
    !footprintUnknown && allowedSqFt > 0 ? Math.round(((usedSqFt as number) / allowedSqFt) * 100) : null;

  const canAddGuestHouse =
    rule.secondaryMaxSqft > 0 && remainingSqFt >= rule.secondaryMaxSqft && lot >= rule.minLotSqft * 1.15;
  const canAddPool = remainingSqFt > 650;

  const { level, line } = footprintUnknown
    ? {
        level: "MODERATE" as ExpansionVerdictLevel,
        line: "Zoning envelope is favorable — add a measured footprint to score true utilization.",
      }
    : verdictFromRemaining(remainingSqFt, allowedSqFt, canAddGuestHouse, percentUtilized);
  const hdcNote = rule.hdcHeavy
    ? "HDC review is likely for exterior work visible from public ways — confirm scope with the commission early."
    : null;

  return {
    zoneCodeResolved,
    rule,
    allowedSqFt,
    usedSqFt,
    remainingSqFt,
    percentUtilized,
    verdictLevel: level,
    verdictLine: line,
    canAddGuestHouse,
    canAddPool,
    hdcNote,
    mauryInsight: insightForZone(zoneCodeResolved, parcel),
    footprintUnknown,
  };
}

export function formatExpansionIdea(exp: ExpansionIntelligence): string {
  const parts: string[] = [];
  if (exp.canAddGuestHouse) parts.push(`${exp.rule.secondaryMaxSqft} sq ft guest program`);
  if (exp.canAddPool) parts.push("18×36 pool envelope");
  if (!parts.length) return "Focus on interior reconfiguration and landscape before adding new mass.";
  return `→ Ideal for ${parts.join(" + ")}`;
}
