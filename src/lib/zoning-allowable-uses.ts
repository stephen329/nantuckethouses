import zoningUseChart from "@/data/zoning-use-chart.json";

/** Same shape as `ParcelZoningUsesSection` / Property Map allowable-uses rows. */
export type ZoningUseRow = { category: string; useName: string; value: string; allowed: boolean };

type UsePermission = { value: string; allowed: boolean };

function normalizeDistrictCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "").replace(/-/g, "");
}

/**
 * Build zoning use rows for a district code — same logic as the Property Map allowable-uses panel
 * (`ZoningLookupClient` + `ParcelZoningUsesSection`).
 */
export function buildZoningUseRowsForDistrict(zoningCode: string): ZoningUseRow[] {
  const normalizedSelected = normalizeDistrictCode(zoningCode);
  if (!normalizedSelected) return [];
  const chart = zoningUseChart as Record<string, unknown>;
  const rows: ZoningUseRow[] = [];
  for (const [category, uses] of Object.entries(chart)) {
    if (category === "metadata") continue;
    for (const [useName, districtMap] of Object.entries(uses as Record<string, Record<string, UsePermission>>)) {
      const match = Object.entries(districtMap).find(
        ([districtCode]) => normalizeDistrictCode(districtCode) === normalizedSelected,
      );
      if (!match) continue;
      const [, permission] = match;
      rows.push({ category, useName, value: permission.value, allowed: permission.allowed });
    }
  }
  return rows;
}

export function zoningUseChartLegendAndSource(): {
  legend: Record<string, string>;
  chartSource: string;
} {
  const meta = (zoningUseChart as { metadata: { legend: Record<string, string>; source: string } }).metadata;
  return { legend: meta.legend, chartSource: meta.source };
}

/** Serializable slice for listing pages (Property Map–aligned allowable uses). */
export type ListingAllowableUsesModule =
  | {
      matched: true;
      zoningCode: string;
      districtName: string | null;
      zoningLookupPath: string | null;
      rows: ZoningUseRow[];
      legend: Record<string, string>;
      chartSource: string;
    }
  | { matched: false };
