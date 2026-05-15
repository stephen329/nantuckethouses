/**
 * Normalize street text for matching assessor `location` to MLS-style addresses.
 * Mirrors `scripts/build_nr_rental_slugs_by_parcel.py`.
 */

const ABBREV: [RegExp, string][] = [
  [/\bpl\b/g, " place"],
  [/\bpl\.\b/g, " place"],
  [/\bct\b/g, " court"],
  [/\bct\.\b/g, " court"],
  [/\bdr\b/g, " drive"],
  [/\bdr\.\b/g, " drive"],
  [/\bln\b/g, " lane"],
  [/\bln\.\b/g, " lane"],
  [/\brd\b/g, " road"],
  [/\brd\.\b/g, " road"],
  [/\bst\b/g, " street"],
  [/\bst\.\b/g, " street"],
  [/\bave\b/g, " avenue"],
  [/\bave\.\b/g, " avenue"],
  [/\bblvd\b/g, " boulevard"],
  [/\bblvd\.\b/g, " boulevard"],
  [/\bwy\b/g, " way"],
  [/\bwy\.\b/g, " way"],
  [/\bcir\b/g, " circle"],
  [/\bcir\.\b/g, " circle"],
  [/\bci\b/g, " circle"],
  [/\bter\b/g, " terrace"],
  [/\bter\.\b/g, " terrace"],
  [/\bhwy\b/g, " highway"],
  [/\bhwy\.\b/g, " highway"],
];

export function expandStreetAbbrevs(s: string): string {
  let t = s.trim().toLowerCase().split(/\s+/).join(" ");
  for (const [pat, rep] of ABBREV) {
    t = t.replace(pat, rep);
  }
  return t.split(/\s+/).join(" ");
}

/** Lowercased road-type tokens (incl. abbrev forms) after expandStreetAbbrevs. */
const ROAD_TYPE_TOKENS = new Set([
  "road",
  "rd",
  "street",
  "st",
  "avenue",
  "ave",
  "lane",
  "ln",
  "drive",
  "dr",
  "way",
  "wy",
  "circle",
  "cir",
  "terrace",
  "ter",
  "highway",
  "hwy",
  "boulevard",
  "blvd",
  "place",
  "pl",
  "court",
  "ct",
  "path",
]);

function tokenNorm(w: string): string {
  return w.toLowerCase().replace(/\./g, "");
}

/**
 * Remove trailing road-type words so "106 old south road" (assessor) and
 * "106 old south" (user / Fin) share the same key. Only strips when at least
 * two street-name tokens would remain after removal, so "10 water street"
 * does not become "10 water".
 */
function stripOptionalTrailingRoadTypes(key: string): string {
  const parts = key.split(/\s+/).filter(Boolean);
  if (parts.length < 3) return key;

  const m = /^(\d+)([a-z])?$/i.exec(parts[0] ?? "");
  if (m) {
    const num = m[1];
    let rest = parts.slice(1);
    while (rest.length >= 3) {
      const last = tokenNorm(rest[rest.length - 1] ?? "");
      if (!ROAD_TYPE_TOKENS.has(last)) break;
      rest = rest.slice(0, -1);
    }
    return rest.length ? `${num} ${rest.join(" ")}` : num;
  }

  let out = [...parts];
  while (out.length >= 3) {
    const last = tokenNorm(out[out.length - 1] ?? "");
    if (!ROAD_TYPE_TOKENS.has(last)) break;
    out = out.slice(0, -1);
  }
  return out.join(" ");
}

/** Comparable key for listing address vs parcel `location`. */
export function streetMatchKey(raw: string): string {
  let s = expandStreetAbbrevs(raw.trim());
  s = s.replace(/[,'"]/g, " ");
  s = s.split(/\s+/).join(" ").trim();
  if (!s) return "";
  const parts = s.split(/\s+/);
  const first = parts[0] ?? "";
  const m = /^(\d+)([a-z])?$/i.exec(first);
  let key: string;
  if (m) {
    const num = m[1];
    const rest = parts.slice(1).join(" ").trim();
    key = rest ? `${num} ${rest}` : num;
  } else {
    key = s;
  }
  return stripOptionalTrailingRoadTypes(key);
}

export function looksLikeStreetAddress(loc: string): boolean {
  return /\d/.test(loc);
}

/** First segment before comma, e.g. "10 Rudder Lane, Nantucket MA" → "10 Rudder Lane". */
export function listingAddressStem(address: string | undefined, streetNumber?: string, streetName?: string): string {
  const a = address?.split(",")[0]?.trim();
  if (a) return a;
  return [streetNumber, streetName].filter(Boolean).join(" ").trim();
}
