/**
 * LINK `listing_typ` / MLS property type codes → display labels.
 */
const LISTING_TYPE_ENTRIES: [string, string][] = [
  ["C", "Condo"],
  ["L", "Land"],
  ["1F", "Single Family House"],
  ["2F", "Two Family House"],
  ["3F", "Three Family House"],
  ["AP", "Apartment"],
  ["BL", "Building"],
  ["MF", "Multi Family"],
  ["PA", "Parking"],
  ["Cnd", "Condo"],
  ["Com", "Commercial"],
  // Common full `PropertyType` strings from the CNC feed
  ["1 Family", "Single Family House"],
  ["2 Family", "Two Family House"],
  ["3 Family", "Three Family House"],
];

const LISTING_TYPE_TO_LABEL: Record<string, string> = {};
for (const [code, label] of LISTING_TYPE_ENTRIES) {
  LISTING_TYPE_TO_LABEL[code] = label;
  LISTING_TYPE_TO_LABEL[code.toUpperCase()] = label;
}

function labelForListingTypeToken(token: string): string {
  const t = token.trim();
  if (!t) return t;
  if (LISTING_TYPE_TO_LABEL[t]) return LISTING_TYPE_TO_LABEL[t];
  const upper = t.toUpperCase();
  if (LISTING_TYPE_TO_LABEL[upper]) return LISTING_TYPE_TO_LABEL[upper];
  const spaced = t.replace(/\s+/g, " ");
  if (LISTING_TYPE_TO_LABEL[spaced]) return LISTING_TYPE_TO_LABEL[spaced];
  return t;
}

/** Prefer `listing_typ` when present, else `PropertyType` (string or single-element array). */
export function listingTypOrPropertyType(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const lt = r.listing_typ ?? r.listing_TYP;
  if (lt != null && lt !== "") return lt;
  return r.PropertyType;
}

/** Expand type codes for matching (filters, inventory); same mapping as display. */
export function expandListingTypeForFilter(raw: string | null | undefined): string {
  return formatListingTypeDisplay(raw) ?? String(raw ?? "").trim();
}

/** Map codes / short MLS type values to display text; pass through unknown phrases. */
export function formatListingTypeDisplay(raw: unknown): string | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const parts = raw.map((x) => String(x).trim()).filter(Boolean);
    if (!parts.length) return null;
    return parts.map(labelForListingTypeToken).join(", ");
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return null;
    if (/[,;|]/.test(s)) {
      return s
        .split(/[,;|]/)
        .map((x) => x.trim())
        .filter(Boolean)
        .map(labelForListingTypeToken)
        .join(", ");
    }
    return labelForListingTypeToken(s);
  }
  return String(raw);
}
