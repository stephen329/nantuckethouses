/** Standard Nantucket MLS area names for normalization (shared across benchmarks). */
const NANTUCKET_AREA_ALIASES: Record<string, string> = {
  siasconset: "Sconset",
  "'sconset": "Sconset",
  downtown: "Town",
  center: "Town",
  "nantucket town": "Town",
  "tom nevers": "Tom Nevers",
  "brant point": "Brant Point",
};

export function normalizeNantucketAreaName(area: string): string {
  const trimmed = area.trim();
  const lower = trimmed.toLowerCase();

  if (NANTUCKET_AREA_ALIASES[lower]) {
    return NANTUCKET_AREA_ALIASES[lower]!;
  }

  for (const [alias, normalized] of Object.entries(NANTUCKET_AREA_ALIASES)) {
    if (lower.includes(alias)) {
      return normalized;
    }
  }

  return trimmed
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
