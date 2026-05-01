/**
 * Canonical Nantucket neighborhoods.
 * Slug → display name mapping used across the site.
 */
export const NEIGHBORHOOD_MAP: Record<string, string> = {
  "brant-point": "Brant Point",
  "sconset": "'Sconset",
  "madaket": "Madaket",
  "mid-island": "Mid-Island",
  "town": "Town",
  "cliff": "Cliff",
  "surfside": "Surfside",
  "cisco": "Cisco",          // includes Hummock Pond area
  "dionis": "Dionis",
  "polpis": "Polpis",
  "monomoy": "Monomoy",
  "madequecham": "Madequecham",
};

/** All neighborhood slugs */
export const NEIGHBORHOOD_SLUGS = Object.keys(NEIGHBORHOOD_MAP);

/** All neighborhood display names (for form selects) */
export const NEIGHBORHOODS = [...Object.values(NEIGHBORHOOD_MAP), "Other"] as const;

export type NeighborhoodSlug = keyof typeof NEIGHBORHOOD_MAP;
export type Neighborhood = (typeof NEIGHBORHOODS)[number];

/** Get display name from slug */
export function getNeighborhoodName(slug: string): string {
  return NEIGHBORHOOD_MAP[slug] ?? slug;
}

/** Get slug from display name */
export function getNeighborhoodSlug(name: string): string | undefined {
  return Object.entries(NEIGHBORHOOD_MAP).find(
    ([, displayName]) => displayName.toLowerCase() === name.toLowerCase()
  )?.[0];
}
