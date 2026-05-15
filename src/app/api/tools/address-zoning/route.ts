import { NextRequest, NextResponse } from "next/server";
import { getDistrictRule, matchAssessorParcelByListingAddress } from "@/lib/parcel-data";
import { zoningLookupToolPath } from "@/lib/property-routes";

/**
 * GET /api/tools/address-zoning?address=<street line>
 *
 * Small JSON for external callers (e.g. Intercom Fin) — explicit zoning from
 * assessor parcel match. Uses the same resolver as listing detail.
 */
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address")?.trim() ?? "";

  if (address.length < 2) {
    return NextResponse.json({
      matched: false,
      query: address,
      zoningCode: null,
      districtName: null,
      parcelId: null,
      taxMap: null,
      parcel: null,
      zoningLookupPath: null,
      message:
        "Missing or short address. Use ?address= with at least 2 characters (e.g. a full Nantucket street line).",
    });
  }

  const hit = await matchAssessorParcelByListingAddress(address);
  if (!hit) {
    return NextResponse.json({
      matched: false,
      query: address,
      zoningCode: null,
      districtName: null,
      parcelId: null,
      taxMap: null,
      parcel: null,
      zoningLookupPath: null,
      message:
        "No assessor parcel match for that address. Try a fuller street line (number + street name) as used on Nantucket.",
    });
  }

  const rule = getDistrictRule(hit.zoningCode);
  const zoningLookupPath = zoningLookupToolPath(hit.taxMap, hit.parcel);

  return NextResponse.json({
    matched: true,
    query: address,
    zoningCode: hit.zoningCode,
    districtName: rule?.name ?? null,
    parcelId: hit.parcelId,
    taxMap: hit.taxMap,
    parcel: hit.parcel,
    zoningLookupPath,
    message: null,
  });
}
