/** Shared list of Nantucket neighborhoods for form selects */
export const NEIGHBORHOODS = [
  "Brant Point",
  "'Sconset",
  "Cisco",
  "Cliff",
  "Dionis",
  "Madaket",
  "Mid-Island",
  "Monomoy",
  "Polpis",
  "Surfside",
  "Tom Nevers",
  "Town",
  "Other",
] as const;

export type Neighborhood = (typeof NEIGHBORHOODS)[number];
