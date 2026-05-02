/**
 * LINK / CNC view codes → display labels.
 */
const VIEW_CODE_ENTRIES: [string, string][] = [
  ["Oc", "Ocean"],
  ["Hbr", "Harbor"],
  ["Pnd", "Pond"],
  ["Snd", "Nantucket Sound"],
  ["D/Oc", "Distant Ocean"],
  ["None", "None"],
  ["D/Hbr", "Distant Harbor"],
  ["D/Pnd", "Distant Pond"],
  ["D/Snd", "Distant Sound"],
];

const VIEW_CODE_TO_LABEL: Record<string, string> = {};
for (const [code, label] of VIEW_CODE_ENTRIES) {
  VIEW_CODE_TO_LABEL[code] = label;
  VIEW_CODE_TO_LABEL[code.toUpperCase()] = label;
}

function viewTokens(raw: unknown): string[] {
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

function labelForViewToken(token: string): string {
  const t = token.trim();
  if (!t) return t;
  if (VIEW_CODE_TO_LABEL[t]) return VIEW_CODE_TO_LABEL[t];
  const upper = t.toUpperCase();
  if (VIEW_CODE_TO_LABEL[upper]) return VIEW_CODE_TO_LABEL[upper];
  return t;
}

/** Turn RESO `View` (arrays or CSV) into human-readable text. */
export function formatViewCodes(raw: unknown): string | null {
  const parts = viewTokens(raw).map(labelForViewToken).filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}
