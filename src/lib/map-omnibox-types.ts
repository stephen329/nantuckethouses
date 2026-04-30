export type ExpansionVerdictOmnibox = "HIGH" | "MODERATE" | "MAXED";

/** When a LINK or NR rental row maps to this parcel, omnibox shows one parcel row (no duplicate listing rows). */
export type OmniboxParcelListingMatch = {
  kind: "link_active" | "link_sold" | "rental";
  linkId?: string;
  nrPropertyId?: number;
  rentalSlug?: string | null;
  priceLabel: string;
  statusLabel: string;
};

export type OmniboxActiveListing = {
  id: string;
  address: string;
  price: number;
  priceLabel: string;
  lat: number | null;
  lng: number | null;
  /** Assessor parcel_id when street matched parcel centroid index (omnibox may merge into parcel row). */
  parcelId?: string | null;
  source: "LINK";
  status: "for_sale";
};

export type OmniboxSoldComp = {
  id: string;
  address: string;
  price: number;
  priceLabel: string;
  closeDate: string | null;
  lat: number | null;
  lng: number | null;
  parcelId?: string | null;
  source: "LINK";
  status: "sold";
};

export type OmniboxParcelHit = {
  parcel_id: string;
  taxMap: string;
  parcel: string;
  address: string;
  lat: number;
  lng: number;
  /** Normalized zoning code when available from parcel GIS. */
  zone?: string | null;
  expansionVerdict?: ExpansionVerdictOmnibox | null;
  /** Highest-priority listing/rental merged into this parcel row (active LINK beats sold beats rental). */
  matchedListing?: OmniboxParcelListingMatch | null;
};

export type OmniboxNeighborhoodHit = {
  name: string;
  slug: string;
  countActive: number | null;
  countRentals: number | null;
  bounds: { west: number; south: number; east: number; north: number };
};

export type OmniboxRentalHit = {
  nrPropertyId: number;
  /** Present when upstream listing row includes a site slug (required for deep links). */
  slug?: string | null;
  address: string;
  headline: string;
  priceLabel: string | null;
  lat: number;
  lng: number;
  parcelId?: string | null;
};

export type OmniboxNlSuggestion = {
  id: string;
  label: string;
};

/** Phase-1 contract: grouped categories for instant rendering (mirrors flat arrays). */
export type OmniboxCategories = {
  listings: Array<{
    id: string;
    type: "listing";
    label: string;
    price: string;
    status: string;
    lat: number | null;
    lng: number | null;
  }>;
  sold: Array<{
    id: string;
    type: "sold";
    label: string;
    price: string;
    status: string;
    lat: number | null;
    lng: number | null;
  }>;
  parcels: Array<{
    id: string;
    type: "parcel";
    label: string;
    zone: string;
    expansionVerdict: ExpansionVerdictOmnibox | null;
    lat: number;
    lng: number;
    matchedListing: OmniboxParcelListingMatch | null;
  }>;
  neighborhoods: Array<{
    id: string;
    type: "neighborhood";
    label: string;
    countListings: number | null;
    countRentals: number | null;
  }>;
};

export type OmniboxResponse = {
  query: string;
  /** Short NL-style prompts for chips (Phase 1 contract). */
  suggestions: string[];
  categories: OmniboxCategories;
  activeListings: OmniboxActiveListing[];
  soldComps: OmniboxSoldComp[];
  parcels: OmniboxParcelHit[];
  neighborhoods: OmniboxNeighborhoodHit[];
  rentals: OmniboxRentalHit[];
  nlSuggestions: OmniboxNlSuggestion[];
  message?: string;
};
