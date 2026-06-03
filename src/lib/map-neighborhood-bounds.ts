/** Approximate map bounds for neighborhood fly-to (Phase 1). Keys match `neighborhood-profiles.json` slugs. */
export const MAP_NEIGHBORHOOD_BOUNDS: Record<
  string,
  { west: number; south: number; east: number; north: number }
> = {
  town: { west: -70.125, south: 41.265, east: -70.075, north: 41.292 },
  "brant-point": { west: -70.105, south: 41.285, east: -70.08, north: 41.305 },
  sconset: { west: -70.02, south: 41.235, east: -69.96, north: 41.27 },
  madaket: { west: -70.14, south: 41.245, east: -70.075, north: 41.28 },
  "mid-island": { west: -70.12, south: 41.255, east: -70.05, north: 41.285 },
  surfside: { west: -70.085, south: 41.245, east: -70.045, north: 41.27 },
  cisco: { west: -70.065, south: 41.255, east: -70.025, north: 41.275 },
  cliff: { west: -70.09, south: 41.285, east: -70.055, north: 41.315 },
  polpis: { west: -70.055, south: 41.265, east: -70.01, north: 41.29 },
  wauwinet: { west: -70.02, south: 41.285, east: -69.975, north: 41.32 },
  dionis: { west: -70.08, south: 41.295, east: -70.035, north: 41.325 },
  monomoy: { west: -70.045, south: 41.255, east: -70.0, north: 41.285 },
  madequecham: { west: -70.12, south: 41.23, east: -70.07, north: 41.26 },
};
