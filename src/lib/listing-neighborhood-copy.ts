/** Static neighborhood context (not from MLS). Editorial, factual tone. */
export const NEIGHBORHOOD_BENCHMARK_COPY: Record<
  string,
  { traits: string; valueContext?: string }
> = {
  Surfside: {
    traits: "Beach proximity, family-oriented blocks, lower density than Town.",
    valueContext:
      "Surfside often trades a few points below island-average $ per SF while offering larger lots and direct beach access—useful context for family buyers.",
  },
  Sconset: {
    traits: "Historic village core, ocean exposure, premium seasonal demand.",
    valueContext:
      "Sconset frequently commands a premium to Mid-Island on $ per SF; compare lot size and condition, not headline price alone.",
  },
  Town: {
    traits: "Walkable core, harbor access, tighter lots, strong rental and second-home liquidity.",
    valueContext:
      "Town listings often carry higher $ per SF than the island median; parking and lot dimensions drive deltas as much as finish level.",
  },
  Cisco: {
    traits: "Cisco beaches, newer construction clusters, strong summer rental performance.",
    valueContext:
      "Cisco and adjacent pockets often track above island median $ per SF when lot and water proximity align.",
  },
  "Brant Point": {
    traits: "Harbor adjacency, prestige addresses, older stock with selective new builds.",
    valueContext:
      "Brant Point trades on location first; age and renovation status explain wide $ per SF dispersion.",
  },
  Madaket: {
    traits: "Sunset beaches, open lots, distance from Town.",
    valueContext:
      "Madaket can offer more land per dollar; compare commute time and flood construction requirements.",
  },
  "Tom Nevers": {
    traits: "Eastern exposure, larger lots, newer construction mix.",
    valueContext:
      "Tom Nevers often skews newer than island median build year in comparable price tiers.",
  },
};

export function neighborhoodBenchmarkBlurb(area: string | undefined): {
  traits: string;
  valueContext: string;
} {
  if (!area) {
    return {
      traits: "Island-wide MLS area; see map for micro-location.",
      valueContext: "Compare this listing to both neighborhood and island baselines below.",
    };
  }
  const key = Object.keys(NEIGHBORHOOD_BENCHMARK_COPY).find(
    (k) => k.toLowerCase() === area.trim().toLowerCase()
  );
  const hit = key ? NEIGHBORHOOD_BENCHMARK_COPY[key] : undefined;
  if (hit) {
    return {
      traits: hit.traits,
      valueContext: hit.valueContext ?? "",
    };
  }
  return {
    traits: `${area} (MLS area). Use comps and flood/assessor sources to confirm micro-location.`,
    valueContext: "Neighborhood-level MLS stats below are derived from current LINK feed rows in this area label.",
  };
}
