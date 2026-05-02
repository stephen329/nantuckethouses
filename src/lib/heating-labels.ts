/**
 * LINK / CNC heating feature codes → display labels (Congdon & Coleman convention).
 */
const HEATING_CODE_TO_LABEL: Record<string, string> = {
  E: "Electric",
  F: "Forced Air",
  N: "None",
  O: "Other",
  P: "Heat Pump",
  S: "Space Heater",
  W: "Hot Water",
  GFHA: "Gas Forced Hot Air",
  GFHW: "Gas Forced Hot Water",
  OFHA: "Oil Forced Hot Air",
  OFHW: "Oil Forced Hot Water",
  RadE: "Radiant Electric",
  RadH: "Radiant Heat",
  Monitor: "Monitor",
  Propane: "Propane",
  HeatPump: "Heat Pump",
  PMonitor: "PMonitor",
};

function heatingTokens(raw: unknown): string[] {
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

function labelForHeatingToken(token: string): string {
  const t = token.trim();
  if (!t) return t;
  if (HEATING_CODE_TO_LABEL[t]) return HEATING_CODE_TO_LABEL[t];
  const upper = t.toUpperCase();
  if (HEATING_CODE_TO_LABEL[upper]) return HEATING_CODE_TO_LABEL[upper];
  const spaced = t.replace(/\s+/g, " ");
  if (HEATING_CODE_TO_LABEL[spaced]) return HEATING_CODE_TO_LABEL[spaced];
  return t;
}

/** Turn RESO `Heating` / fuel codes (arrays or CSV) into human-readable text. */
export function formatHeatingCodes(raw: unknown): string | null {
  const parts = heatingTokens(raw).map(labelForHeatingToken).filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}
