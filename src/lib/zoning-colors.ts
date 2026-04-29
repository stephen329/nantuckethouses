import type { ExpressionSpecification } from "mapbox-gl";

/** Hex colors from Town use chart (September 2024, Sheet2). */
export const DEFAULT_ZONING_COLOR = "#DDDDDD";

/** Canonical chart codes (hyphenated) plus assessor-style aliases (e.g. `R40` → same as `R-40`). */
export const ZONING_COLOR_MAP: Record<string, string> = {
  AH: "#FFFF73",
  ALC: "#EFB6FC",
  CDT: "#A80000",
  CI: "#BE6666",
  CMI: "#868885",
  CN: "#88C27F",
  CTEC: "#FCC2B3",
  LC: "#898945",
  "LUG-1": "#C19ED7",
  "LUG-2": "#FBFCC5",
  "LUG-3": "#E8CF70",
  MMD: "#B4D79E",
  OIH: "#4DE603",
  "R-1": "#FFBEBE",
  "R-5": "#FDBF6F",
  "R-5L": "#FDBF6F",
  "R-10": "#CDF57A",
  "R-10L": "#D7D79E",
  "R-20": "#F5A27A",
  "R-40": "#448970",
  RC: "#73FFDE",
  "RC-2": "#FFAA01",
  ROH: "#BED2FF",
  SOH: "#BED2FF",
  "SR-1": "#FFBEBE",
  "SR-10": "#CDF57A",
  "SR-20": "#F5A27A",
  VN: "#CC6699",
  VR: "#66CDAB",
  VTEC: "#D79E9D",
  // Assessor / MassGIS-style codes (no hyphens) — same colors as chart districts.
  LUG1: "#C19ED7",
  LUG2: "#FBFCC5",
  LUG3: "#E8CF70",
  R1: "#FFBEBE",
  R5: "#FDBF6F",
  R5L: "#FDBF6F",
  R10: "#CDF57A",
  R10L: "#D7D79E",
  R20: "#F5A27A",
  R40: "#448970",
  RC2: "#FFAA01",
  /** Composite / edge case in parcel export; treat as RC-2. */
  RC2M: "#FFAA01",
  SR1: "#FFBEBE",
  SR10: "#CDF57A",
  SR20: "#F5A27A",
};

function normalizeZoningCode(value: string): string {
  return value.trim().toUpperCase();
}

/** Mapbox `fill-color`: match on `zoning` (uppercased), then feature `zoning_color`, then default. */
export function mapboxZoningFillColorExpression(): ExpressionSpecification {
  const pairs = Object.entries(ZONING_COLOR_MAP).flatMap(([code, color]) => [code, color]);
  return [
    "match",
    ["upcase", ["to-string", ["coalesce", ["get", "zoning"], ""]]],
    ...pairs,
    ["coalesce", ["get", "zoning_color"], DEFAULT_ZONING_COLOR],
  ] as ExpressionSpecification;
}

export function getZoningColor(zoning?: string | null, existingColor?: string | null): string {
  if (zoning?.trim()) {
    const key = normalizeZoningCode(zoning);
    return ZONING_COLOR_MAP[key] ?? existingColor?.trim() ?? DEFAULT_ZONING_COLOR;
  }
  return existingColor?.trim() ?? DEFAULT_ZONING_COLOR;
}
