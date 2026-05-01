import type { Feature, FeatureCollection, Geometry, Point } from "geojson";
import { centroidFromGeometry } from "@/lib/geo-centroid";
import { listingAddressStem, looksLikeStreetAddress, streetMatchKey } from "@/lib/address-street-key";

export type ParcelProps = {
  parcel_id?: string | null;
  location?: string | null;
  tax_map?: string | null;
  parcel?: string | null;
};

export type LinkListingRow = {
  link_id?: number;
  Address?: string;
  StreetNumber?: string;
  StreetName?: string;
  ListPrice?: number;
  ClosePrice?: number;
  CloseDate?: string;
  MlsStatus?: string;
  Slug?: string;
  link_images?: { url?: string; small_url?: string }[];
  LotSizeAcres?: number;
  YearBuilt?: number;
  BedroomsTotal?: number;
  BathroomsTotalDecimal?: number;
  PropertyType?: string;
  PublicRemarks?: string;
  LINK_descr?: string;
  TitleTag?: string;
  View?: string[];
  MLSAreaMajor?: string;
  OnMarketDate?: string;
  LivingArea?: number;
  BuildingAreaTotal?: number;
};

export type LinkListingMapPoint = {
  linkId: number;
  /** Assessor parcel_id when the listing street matched a parcel centroid in the index. */
  parcel_id: string;
  longitude: number;
  latitude: number;
  address: string;
  listPrice: number;
  closePrice: number | null;
  closeDate: string | null;
  pool: "active" | "sold";
  thumbUrl: string | null;
  slug: string | null;
  bedrooms: number | null;
  baths: number | null;
  lotAcres: number | null;
  waterfront: boolean;
  newConstruction: boolean;
  propertyType: string | null;
  mlsArea: string | null;
  onMarketDate: string | null;
  livingAreaSqft: number | null;
  renoHint: boolean;
  townWalkHint: boolean;
  /** Heuristic from remarks / marketing (not a dedicated MLS pool field). */
  hasPool: boolean;
};

export type LinkListingPinProperties = {
  linkId: string;
  pool: "active" | "sold";
  address: string;
  listPrice: string;
  listPriceNum: number;
  closePrice: string;
  closePriceNum: number;
  /** Map pin label: `$###k` below $1M, else `$#.##M`; empty when price unknown. */
  priceCompact: string;
  closeDate: string;
  thumbUrl: string | null;
  slug: string | null;
  bedrooms: number | null;
  baths: number | null;
  lotAcres: number | null;
  waterfront: boolean;
  newConstruction: boolean;
  propertyType: string | null;
  mlsArea: string | null;
  onMarketDate: string | null;
  livingAreaSqft: number | null;
  renoHint: boolean;
  townWalkHint: boolean;
  hasPool: boolean;
  /** Parcel centroid pin — used for satellite hero when listing has no photo. */
  longitude?: number | null;
  latitude?: number | null;
};

export type LinkListingPinFeature = Feature<Point, LinkListingPinProperties>;

function inBbox(lng: number, lat: number, west: number, south: number, east: number, north: number): boolean {
  return lng >= west && lng <= east && lat >= south && lat <= north;
}

function formatMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/** LINK map pin (active or sold): `$###k` below $1M, otherwise `$#.##M` (two decimals). */
export function formatPriceCompactMapPin(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n) || n <= 0) return "";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  const k = Math.round(n / 1000);
  if (k <= 0) return "";
  if (k >= 1000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${k}k`;
}

function linkMarketingBlob(row: LinkListingRow): string {
  const views = (row.View ?? []).join(" ");
  return [row.PublicRemarks, row.LINK_descr, row.TitleTag, views, row.PropertyType].filter(Boolean).join(" ");
}

function linkWaterfront(row: LinkListingRow): boolean {
  return /\b(waterfront|oceanfront|harbor front|sound front|on the harbor|direct water|beachfront)\b/i.test(linkMarketingBlob(row));
}

function linkNewConstruction(row: LinkListingRow): boolean {
  const y = row.YearBuilt;
  const currentY = new Date().getFullYear();
  if (typeof y === "number" && !Number.isNaN(y) && y >= currentY - 1) return true;
  return /\bnew construction\b/i.test(linkMarketingBlob(row));
}

function linkRenovatedRecent(row: LinkListingRow): boolean {
  return /\b(renovated|renovation|fully updated|gut renovated|like new|newly renovated|designer|restored)\b/i.test(
    linkMarketingBlob(row),
  );
}

function linkTownWalkHint(row: LinkListingRow): boolean {
  return /\b(downtown|in town|in-town|town center|center of town|historic district|main street|steps to town|walk to town)\b/i.test(
    linkMarketingBlob(row),
  );
}

function linkPoolHint(row: LinkListingRow): boolean {
  return /\b(pool|heated pool|in-?ground pool|swimming pool|gunite pool|pool & spa|pool and spa)\b/i.test(
    linkMarketingBlob(row),
  );
}

function pickLivingAreaSqft(row: LinkListingRow): number | null {
  const la = row.LivingArea;
  if (typeof la === "number" && !Number.isNaN(la) && la > 0) return la;
  const bt = row.BuildingAreaTotal;
  if (typeof bt === "number" && !Number.isNaN(bt) && bt > 0) return bt;
  return null;
}

/** Build first-match street key → centroid from parcel GeoJSON features. */
export function buildParcelStreetCentroidIndex(
  features: Feature<Geometry, ParcelProps>[],
): Map<string, { lng: number; lat: number; parcel_id: string }> {
  const index = new Map<string, { lng: number; lat: number; parcel_id: string }>();
  for (const feat of features) {
    const loc = feat.properties?.location;
    const pid = feat.properties?.parcel_id;
    if (loc == null || pid == null || String(loc).trim() === "" || String(pid).trim() === "") continue;
    const locS = String(loc).trim();
    if (!looksLikeStreetAddress(locS)) continue;
    const key = streetMatchKey(locS);
    if (!key || index.has(key)) continue;
    const c = centroidFromGeometry(feat.geometry);
    if (!c) continue;
    index.set(key, { ...c, parcel_id: String(pid).trim() });
  }
  return index;
}

export function matchLinkListingToPoint(
  row: LinkListingRow,
  index: Map<string, { lng: number; lat: number; parcel_id: string }>,
  pool: "active" | "sold",
  bbox: { west: number; south: number; east: number; north: number },
  /** When set, only accept listings whose street index resolves to this assessor parcel_id. */
  requireParcelId?: string | null,
): LinkListingMapPoint | null {
  const id = row.link_id;
  if (id == null) return null;
  const stem = listingAddressStem(row.Address, row.StreetNumber, row.StreetName);
  if (!stem) return null;
  const key = streetMatchKey(stem);
  if (!key) return null;
  const hit = index.get(key);
  if (!hit) return null;
  const req = requireParcelId?.trim();
  if (req && String(hit.parcel_id).trim() !== req) return null;
  if (!inBbox(hit.lng, hit.lat, bbox.west, bbox.south, bbox.east, bbox.north)) return null;
  const img = row.link_images?.[0];
  const thumb = img?.small_url ?? img?.url ?? null;
  const beds = row.BedroomsTotal;
  const bathsRaw = row.BathroomsTotalDecimal;
  const lot = row.LotSizeAcres;
  const pt = String(row.PropertyType ?? "").trim();
  const area = String(row.MLSAreaMajor ?? "").trim();
  return {
    linkId: id,
    parcel_id: String(hit.parcel_id).trim(),
    longitude: hit.lng,
    latitude: hit.lat,
    address: stem,
    listPrice: row.ListPrice ?? 0,
    closePrice: row.ClosePrice ?? null,
    closeDate: row.CloseDate ?? null,
    pool,
    thumbUrl: thumb,
    slug: row.Slug ?? null,
    bedrooms: typeof beds === "number" && !Number.isNaN(beds) ? beds : null,
    baths: typeof bathsRaw === "number" && !Number.isNaN(bathsRaw) ? bathsRaw : null,
    lotAcres: typeof lot === "number" && !Number.isNaN(lot) && lot > 0 ? lot : null,
    waterfront: linkWaterfront(row),
    newConstruction: linkNewConstruction(row),
    propertyType: pt || null,
    mlsArea: area || null,
    onMarketDate: row.OnMarketDate?.trim() ? row.OnMarketDate : null,
    livingAreaSqft: pickLivingAreaSqft(row),
    renoHint: linkRenovatedRecent(row),
    townWalkHint: linkTownWalkHint(row),
    hasPool: linkPoolHint(row),
  };
}

function haversineMeters(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Parcel-associated LINK row from viewport GeoJSON (property map). */
export type ParcelMapLinkListingMatch = {
  linkId: string;
  pool: "active" | "sold";
  thumbUrl: string | null;
  /** Formatted list price (active); may be empty for some sold rows. */
  listPrice: string;
  listPriceNum: number;
  /** Formatted close price when sold. */
  closePrice: string;
  /** ISO-ish MLS on-market date when present (DOM). */
  onMarketDate: string | null;
  /** Close date when sold (DOM through close). */
  closeDate: string | null;
  /** MLS area / neighborhood (e.g. Tom Nevers). */
  mlsArea: string | null;
  /** LINK MLS property type (e.g. Single Family, Land, Commercial). */
  propertyType: string | null;
  /** MLS bedrooms when present (for deep links to NR search). */
  bedrooms: number | null;
  /** Pin / parcel centroid (for map hero framing). */
  longitude?: number | null;
  latitude?: number | null;
};

/** Build panel/API payload from a matched map point (server or client). */
export function parcelMapListingMatchFromMapPoint(p: LinkListingMapPoint): ParcelMapLinkListingMatch {
  return {
    linkId: String(p.linkId),
    pool: p.pool,
    thumbUrl: p.thumbUrl,
    listPrice: formatMoney(p.listPrice),
    listPriceNum: p.listPrice,
    closePrice: p.closePrice != null ? formatMoney(p.closePrice) : "",
    onMarketDate: p.onMarketDate,
    closeDate: p.closeDate?.trim() ? p.closeDate : null,
    mlsArea: p.mlsArea,
    propertyType: p.propertyType ?? null,
    bedrooms: p.bedrooms ?? null,
    longitude: p.longitude,
    latitude: p.latitude,
  };
}

function featureToParcelMatch(f: Feature<Point, LinkListingPinProperties>): ParcelMapLinkListingMatch {
  const p = f.properties;
  const [lng, lat] = f.geometry.coordinates;
  return {
    linkId: p.linkId,
    pool: p.pool,
    thumbUrl: p.thumbUrl,
    listPrice: p.listPrice,
    listPriceNum: p.listPriceNum,
    closePrice: p.closePrice,
    onMarketDate: p.onMarketDate,
    closeDate: p.closeDate?.trim() ? p.closeDate : null,
    mlsArea: p.mlsArea,
    propertyType: p.propertyType ?? null,
    bedrooms: p.bedrooms ?? null,
    longitude: p.longitude ?? lng,
    latitude: p.latitude ?? lat,
  };
}

function nearestInFc(
  parcelCenter: { lng: number; lat: number },
  fc: FeatureCollection<Point, LinkListingPinProperties>,
  maxM: number,
): Feature<Point, LinkListingPinProperties> | null {
  for (const f of fc.features) {
    const [lng, lat] = f.geometry.coordinates;
    if (haversineMeters(parcelCenter.lng, parcelCenter.lat, lng, lat) <= maxM) return f;
  }
  return null;
}

/**
 * LINK listing tied to a selected parcel: prefer **active** pin at parcel centroid, then
 * static `linkListingByParcelId`, then sold pin at centroid. Same geometry rules as
 * `/api/map/link-listings`.
 */
export function linkListingMatchForParcelMapSelection(
  parcelCenter: { lng: number; lat: number } | null,
  linkListingIdFromFeed: string | null,
  activeFc: FeatureCollection<Point, LinkListingPinProperties>,
  soldFc: FeatureCollection<Point, LinkListingPinProperties>,
  options?: { maxMeters?: number },
): ParcelMapLinkListingMatch | null {
  const maxM = options?.maxMeters ?? 28;
  if (parcelCenter) {
    const activeNear = nearestInFc(parcelCenter, activeFc, maxM);
    if (activeNear) return featureToParcelMatch(activeNear);
  }
  const lid = linkListingIdFromFeed?.trim();
  if (lid) {
    const hitActive = activeFc.features.find((f) => f.properties.linkId === lid);
    if (hitActive) return featureToParcelMatch(hitActive);
    const hitSold = soldFc.features.find((f) => f.properties.linkId === lid);
    if (hitSold) return featureToParcelMatch(hitSold);
  }
  if (parcelCenter) {
    const soldNear = nearestInFc(parcelCenter, soldFc, maxM);
    if (soldNear) return featureToParcelMatch(soldNear);
  }
  return null;
}

export function linkListingThumbForParcelMapSelection(
  parcelCenter: { lng: number; lat: number } | null,
  linkListingIdFromFeed: string | null,
  activeFc: FeatureCollection<Point, LinkListingPinProperties>,
  soldFc: FeatureCollection<Point, LinkListingPinProperties>,
  options?: { maxMeters?: number },
): string | null {
  return linkListingMatchForParcelMapSelection(
    parcelCenter,
    linkListingIdFromFeed,
    activeFc,
    soldFc,
    options,
  )?.thumbUrl ?? null;
}

export function linkMapPointsToGeoJson(points: LinkListingMapPoint[]): FeatureCollection<Point, LinkListingPinProperties> {
  return {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature" as const,
      id: `link:${p.linkId}`,
      geometry: { type: "Point" as const, coordinates: [p.longitude, p.latitude] },
      properties: {
        linkId: String(p.linkId),
        pool: p.pool,
        address: p.address,
        listPrice: formatMoney(p.listPrice),
        listPriceNum: p.listPrice,
        closePrice: p.closePrice != null ? formatMoney(p.closePrice) : "",
        closePriceNum: p.closePrice != null && !Number.isNaN(p.closePrice) ? p.closePrice : 0,
        priceCompact:
          p.pool === "sold"
            ? formatPriceCompactMapPin(
                p.closePrice != null && !Number.isNaN(p.closePrice) && p.closePrice > 0
                  ? p.closePrice
                  : p.listPrice > 0
                    ? p.listPrice
                    : null,
              )
            : formatPriceCompactMapPin(p.listPrice > 0 ? p.listPrice : null),
        closeDate: p.closeDate ?? "",
        thumbUrl: p.thumbUrl,
        slug: p.slug,
        bedrooms: p.bedrooms,
        baths: p.baths,
        lotAcres: p.lotAcres,
        waterfront: p.waterfront,
        newConstruction: p.newConstruction,
        propertyType: p.propertyType,
        mlsArea: p.mlsArea,
        onMarketDate: p.onMarketDate,
        livingAreaSqft: p.livingAreaSqft,
        renoHint: p.renoHint,
        townWalkHint: p.townWalkHint,
        hasPool: p.hasPool,
        longitude: p.longitude,
        latitude: p.latitude,
      },
    })),
  };
}
