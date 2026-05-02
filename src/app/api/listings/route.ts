import { NextResponse } from "next/server";
import { fetchListings, CncListing, daysBetween } from "@/lib/cnc-api";
import { formatListingTypeDisplay, listingTypOrPropertyType } from "@/lib/listing-type-labels";

type SimplifiedListing = {
  mlsNumber: string;
  address: string;
  area: string;
  listPrice: number;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: string | null;
  propertyType: string | null;
  lotAcres: number | null;
  daysOnMarket: number | null;
  photoCount: number;
};

/**
 * GET /api/listings
 *
 * Search and browse active listings with optional filters.
 *
 * Query params:
 * - area: Filter by neighborhood/area
 * - minPrice: Minimum list price
 * - maxPrice: Maximum list price
 * - bedrooms: Minimum bedrooms
 * - propertyType: Property type filter
 * - limit: Number of results (default 10, max 50)
 * - sortBy: Sort field (price, priceAsc, newest, oldest, bedrooms)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const area = searchParams.get("area");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const bedrooms = searchParams.get("bedrooms");
  const propertyType = searchParams.get("propertyType");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);
  const sortBy = searchParams.get("sortBy") ?? "price";

  try {
    const params: Record<string, string | number> = {
      status: "A",
      limit,
      offset: 0,
    };

    if (area) params.area = area;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (bedrooms) params.minBeds = bedrooms;
    if (propertyType) params.propertyType = propertyType;

    // Sorting
    if (sortBy === "priceAsc") {
      params.ordering = "ListPrice";
    } else if (sortBy === "newest") {
      params.ordering = "-OnMarketDate";
    } else if (sortBy === "oldest") {
      params.ordering = "OnMarketDate";
    } else if (sortBy === "bedsDesc" || sortBy === "bedrooms") {
      params.ordering = "-BedroomsTotal";
    } else {
      params.ordering = "-ListPrice";
    }

    const data = await fetchListings(params);

    const listings: SimplifiedListing[] = (data.results || []).map(
      (l: CncListing) => {
        const addressParts = [l.StreetNumber, l.StreetName].filter(Boolean);

        let dom: number | null = null;
        if (l.OnMarketDate) {
          dom = daysBetween(l.OnMarketDate, new Date().toISOString());
          if (dom < 0) dom = null;
        }

        const bat =
          typeof l.BuildingAreaTotal === "number" && l.BuildingAreaTotal > 0
            ? String(Math.round(l.BuildingAreaTotal))
            : null;
        const acres =
          typeof l.LotSizeAcres === "number" && l.LotSizeAcres > 0 ? l.LotSizeAcres : null;

        return {
          mlsNumber: String(l.link_id ?? ""),
          address: addressParts.join(" ") || "Address not available",
          area: l.MLSAreaMajor || "Unknown",
          listPrice: l.ListPrice,
          bedrooms: l.BedroomsTotal ?? null,
          bathrooms: l.BathroomsTotalDecimal ?? null,
          sqft: bat,
          propertyType: formatListingTypeDisplay(listingTypOrPropertyType(l)) ?? l.PropertyType ?? null,
          lotAcres: acres,
          daysOnMarket: dom,
          photoCount: Array.isArray(l.link_images) ? l.link_images.length : 0,
        };
      }
    );

    return NextResponse.json(
      {
        count: data.count,
        listings,
        filters: {
          area: area || "all",
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
          bedrooms: bedrooms || null,
          propertyType: propertyType || null,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Listings API error:", message);

    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}

export const dynamic = "force-dynamic";
