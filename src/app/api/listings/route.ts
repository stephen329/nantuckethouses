import { NextResponse } from "next/server";
import { repliersGet } from "@/lib/repliers";

type ListingResponse = {
  count: number;
  numPages: number;
  listings: Array<{
    mlsNumber: string;
    status: string;
    listPrice: number;
    soldPrice?: number;
    soldDate?: string;
    listDate?: string;
    daysOnMarket?: number;
    address: {
      streetNumber?: string;
      streetName?: string;
      unitNumber?: string;
      area?: string;
      neighborhood?: string;
      city?: string;
      zip?: string;
    };
    details?: {
      numBedrooms?: number;
      numBathrooms?: number;
      numBathroomsPlus?: number;
      sqft?: string;
      propertyType?: string;
      style?: string;
      description?: string;
    };
    lot?: {
      acres?: number;
      squareFeet?: number;
    };
    images?: Array<{ url: string }>;
    photoCount?: number;
  }>;
};

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
 * - area: Filter by neighborhood/area (e.g., "Town", "Sconset", "Madaket")
 * - minPrice: Minimum list price
 * - maxPrice: Maximum list price
 * - bedrooms: Minimum bedrooms
 * - propertyType: Property type filter (e.g., "Single Family", "Condo", "Land")
 * - limit: Number of results (default 10, max 50)
 * - sortBy: Sort field (price, daysOnMarket, bedrooms) - default: price desc
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
    const apiKey = process.env.REPLIERS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing REPLIERS_API_KEY" },
        { status: 500 }
      );
    }

    // Build query parameters
    const params: Record<string, string> = {
      county: "Nantucket",
      status: "A",
      listings: "true",
      resultsPerPage: String(limit),
    };

    // Area/neighborhood filter
    if (area) {
      // Try both area and neighborhood fields
      params.area = area;
    }

    // Price filters
    if (minPrice) {
      params.minListPrice = minPrice;
    }
    if (maxPrice) {
      params.maxListPrice = maxPrice;
    }

    // Bedrooms filter
    if (bedrooms) {
      params.minBeds = bedrooms;
    }

    // Property type filter
    if (propertyType) {
      params.propertyType = propertyType;
    }

    // Sorting - use Repliers valid sort options
    if (sortBy === "priceDesc" || sortBy === "price") {
      params.sortBy = "listPriceDesc";
    } else if (sortBy === "priceAsc") {
      params.sortBy = "listPriceAsc";
    } else if (sortBy === "newest") {
      params.sortBy = "createdOnDesc";
    } else if (sortBy === "oldest") {
      params.sortBy = "createdOnAsc";
    } else if (sortBy === "bedsDesc" || sortBy === "bedrooms") {
      params.sortBy = "bedsDesc";
    } else {
      params.sortBy = "listPriceDesc";
    }

    const data = await repliersGet<ListingResponse>("/listings", params);

    // Simplify listing data for AI consumption
    const listings: SimplifiedListing[] = (data.listings || []).map((l) => {
      const addressParts = [
        l.address?.streetNumber,
        l.address?.streetName,
        l.address?.unitNumber ? `Unit ${l.address.unitNumber}` : null,
      ].filter(Boolean);

      return {
        mlsNumber: l.mlsNumber,
        address: addressParts.join(" ") || "Address not available",
        area: l.address?.area || l.address?.neighborhood || "Unknown",
        listPrice: l.listPrice,
        bedrooms: l.details?.numBedrooms ?? null,
        bathrooms: l.details?.numBathrooms ?? null,
        sqft: l.details?.sqft ?? null,
        propertyType: l.details?.propertyType ?? null,
        lotAcres: l.lot?.acres ?? null,
        daysOnMarket: l.daysOnMarket ?? null,
        photoCount: l.photoCount ?? 0,
      };
    });

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

// Force dynamic rendering - no caching
export const dynamic = "force-dynamic";
