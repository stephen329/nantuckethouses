/**
 * LINK / CNC sewer codes → display labels.
 */
const SEWER_CODE_ENTRIES: [string, string][] = [
  ["Twn", "Town Sewer"],
  ["Sept", "Septic Tank"],
  ["Sess", "Cesspool"],
];

const SEWER_CODE_TO_LABEL: Record<string, string> = {};
for (const [code, label] of SEWER_CODE_ENTRIES) {
  SEWER_CODE_TO_LABEL[code] = label;
  SEWER_CODE_TO_LABEL[code.toUpperCase()] = label;
}

function sewerTokens(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function labelForSewerToken(token: string): string {
  const t = token.trim();
  if (!t) return t;
  if (SEWER_CODE_TO_LABEL[t]) return SEWER_CODE_TO_LABEL[t];
  const upper = t.toUpperCase();
  if (SEWER_CODE_TO_LABEL[upper]) return SEWER_CODE_TO_LABEL[upper];
  return t;
}

/** Turn RESO `Sewer` (arrays or CSV) into human-readable text. */
export function formatSewerCodes(raw: unknown): string | null {
  const parts = sewerTokens(raw).map(labelForSewerToken).filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}
