"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Feature, FeatureCollection, Geometry, Point } from "geojson";
import type { LinkListingPinFeature, LinkListingPinProperties } from "@/lib/link-listings-parcel-match";
import type { RentalPinFeature, RentalPinProperties } from "@/lib/nr-map-rentals";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  applyMapViewToSearchParams,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  mapViewCloseEnough,
  parseMapViewFromSearchParams,
} from "@/lib/map-view-url";
import { mapboxZoningFillColorExpression } from "@/lib/zoning-colors";
import {
  reDistrictFillColorExpression,
  reDistrictPolygonsToBoundaryLines,
  reDistrictPolygonsToLabelPoints,
} from "@/lib/re-districts-map";

/** Parcel fill + optional RE (MLS-style) market polygons under parcels. */
export type ParcelBaseMapLayer = "tax_zoning" | "re_market_areas" | "none";

export type ParcelProperties = {
  parcel_id?: string | null;
  internal_id?: string | number | null;
  tax_map?: string | null;
  parcel?: string | null;
  alt_parcel_id?: string | null;
  location?: string | null;
  zoning?: string | null;
  zoning_color?: string | null;
  acreage?: number | null;
  lot_area_sqft?: number | null;
  assessed_total?: number | null;
  assessed_price_per_acre?: number | null;
  primary_use?: string | number | null;
  use?: string | null;
  owner_name?: string | null;
  utilities?: string | null;
};

type ParcelFeature = Feature<Geometry, ParcelProperties>;

type ZoningMapProps = {
  geojson: FeatureCollection<Geometry, ParcelProperties> | null;
  selectedParcelId?: string | null;
  onParcelSelect: (feature: ParcelFeature) => void;
  /** When true, draws an outline on parcels whose `parcel_id` is in `soldParcelIds`. */
  highlightSoldParcels?: boolean;
  soldParcelIds?: readonly string[];
  /** When false, parcel fill uses a neutral color instead of zoning palette. */
  showZoningColors?: boolean;
  className?: string;
  /** Property map: green clustered pins for Nantucket Rentals listings. */
  showRentalPins?: boolean;
  rentalGeoJson?: FeatureCollection<Point, RentalPinProperties> | null;
  selectedRentalFeatureId?: string | null;
  onRentalPinSelect?: (feature: RentalPinFeature) => void;
  /** Fires after pan/zoom (debounced) with current map bounds for API queries. */
  onViewportBoundsChange?: (bounds: { west: number; south: number; east: number; north: number }) => void;
  /** Property map: LINK MLS active (blue) and sold (gray) pins on parcel centroids. */
  showLinkPins?: boolean;
  linkActiveGeoJson?: FeatureCollection<Point, LinkListingPinProperties> | null;
  linkSoldGeoJson?: FeatureCollection<Point, LinkListingPinProperties> | null;
  selectedLinkListingId?: string | null;
  onLinkListingPinSelect?: (feature: LinkListingPinFeature) => void;
  /**
   * Increment `id` on each jump so the map re-runs navigation.
   * Use `bounds` for neighborhood framing; otherwise `lng`/`lat`/`zoom`.
   */
  flyTo?:
    | { id: number; lng: number; lat: number; zoom: number }
    | { id: number; bounds: { west: number; south: number; east: number; north: number } }
    | null;
  /** MLS-style market polygons (RE_Districts). Shown when `parcelBaseLayer` is `re_market_areas`. */
  reDistrictsGeoJson?: FeatureCollection<Geometry, { Abbrv?: string; District?: string }> | null;
  parcelBaseLayer?: ParcelBaseMapLayer;
  /** Dim other market areas when set (Abbrv, e.g. SURF). */
  highlightedReDistrictAbbrv?: string | null;
  /** Omnibox hover: temporary parcel outline. */
  omniboxPreviewParcelId?: string | null;
  /** Omnibox hover: pulse at listing/rental coordinates. */
  omniboxPreviewPoint?: { lng: number; lat: number } | null;
  /** Tap on map canvas with no parcel / pin / cluster hit (e.g. water, roads). */
  onMapNonFeatureInteraction?: () => void;
};

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const MAP_VIEW_DEBOUNCE_MS = 350;
/** GeoJSON clusters stop merging above this zoom; individual circles appear at higher zoom. */
const CLUSTER_MAX_ZOOM = 16;
const CLUSTER_RADIUS = 56;
/** Price labels on individual pins (rentals + LINK) only at street-ish zoom. */
const MIN_ZOOM_PIN_PRICE_LABEL = 17;
/** Lot outlines / selection ring hidden below this zoom (reduces clutter; cluster taps stay zoom-only). */
const PARCEL_OUTLINE_MIN_ZOOM = 15;
/** Parcel fill when zoning colors are hidden (single tone over basemap). */
const PARCEL_FILL_NEUTRAL = "#cbd5e1";

/** MLS (RE) district polygon fill — scaled down 30% from prior tuning for a lighter overlay. */
const RE_DISTRICT_FILL_OPACITY_SCALE = 0.7;
const RE_DISTRICT_FILL_OPACITY_INITIAL = 0.55 * RE_DISTRICT_FILL_OPACITY_SCALE;
const RE_DISTRICT_FILL_OPACITY_DEFAULT = 0.62 * RE_DISTRICT_FILL_OPACITY_SCALE;
const RE_DISTRICT_FILL_OPACITY_HIGHLIGHT = 0.78 * RE_DISTRICT_FILL_OPACITY_SCALE;
const RE_DISTRICT_FILL_OPACITY_DIM = 0.42 * RE_DISTRICT_FILL_OPACITY_SCALE;

/** Between-MLS-area borders — half the prior zoom-based line widths. */
const RE_DISTRICT_BOUNDARY_LINE_WIDTH: mapboxgl.ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  10,
  1,
  12,
  1.5,
  14,
  2,
  16,
  2.75,
];

function listingOverlayLayerIds(map: mapboxgl.Map): string[] {
  const ids = [
    "rentals-clusters",
    "rentals-cluster-count",
    "rentals-point",
    "rentals-point-price",
    "link-active-clusters",
    "link-active-count",
    "link-active-point",
    "link-active-point-price",
    "link-sold-clusters",
    "link-sold-count",
    "link-sold-point",
    "link-sold-point-price",
  ];
  return ids.filter((id) => !!map.getLayer(id));
}

function hitListingOrClusterAtPoint(map: mapboxgl.Map, point: mapboxgl.PointLike): boolean {
  const layers = listingOverlayLayerIds(map);
  if (!layers.length) return false;
  return map.queryRenderedFeatures(point, { layers }).length > 0;
}

function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]![0];
    const yi = ring[i]![1];
    const xj = ring[j]![0];
    const yj = ring[j]![1];
    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygonGeometry(lng: number, lat: number, geom: Geometry): boolean {
  if (geom.type === "Polygon") {
    const rings = geom.coordinates;
    const outer = rings[0];
    if (!outer || !pointInRing(lng, lat, outer)) return false;
    for (let h = 1; h < rings.length; h++) {
      if (pointInRing(lng, lat, rings[h]!)) return false;
    }
    return true;
  }
  if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) {
      const outer = poly[0];
      if (!outer || !pointInRing(lng, lat, outer)) continue;
      let inHole = false;
      for (let hi = 1; hi < poly.length; hi++) {
        if (pointInRing(lng, lat, poly[hi]!)) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return true;
    }
  }
  return false;
}

/** Full MLS market area name only (`District`); never the short code (`Abbrv`). */
function mlsDistrictNameForPoint(
  lng: number,
  lat: number,
  fc: FeatureCollection<Geometry, { Abbrv?: string; District?: string }> | null,
): string | null {
  if (!fc?.features?.length) return null;
  for (const feature of fc.features) {
    if (!feature.geometry) continue;
    if (!pointInPolygonGeometry(lng, lat, feature.geometry)) continue;
    const district = String(feature.properties?.District ?? "").trim();
    if (district) return district;
  }
  return null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Fill opacity with hover lift (requires `promoteId: "parcel_id"` + feature-state). */
const PARCEL_FILL_OPACITY_HOVER: mapboxgl.ExpressionSpecification = [
  "case",
  ["boolean", ["feature-state", "hover"], false],
  0.82,
  0.62,
];

/** `re-districts-boundary` must insert below parcel line work; prefer sold-outline slot when present. */
function reDistrictBoundaryInsertBefore(map: mapboxgl.Map): string {
  if (map.getLayer("parcels-sold-outline")) return "parcels-sold-outline";
  if (map.getLayer("parcels-line")) return "parcels-line";
  return "parcels-fill";
}

function syncParcelAndReOverlay(
  map: mapboxgl.Map,
  opts: {
    showZoningColors: boolean;
    parcelBaseLayer: ParcelBaseMapLayer;
    highlightedReDistrictAbbrv: string | null;
  },
) {
  if (!map.getLayer("parcels-fill")) return;
  const wantsRe = opts.parcelBaseLayer === "re_market_areas";
  const reLayersReady = !!map.getLayer("re-districts-fill");
  /** District polygons sit below parcel fills; use transparent parcel fill so colors read through. */
  const showReOverlay = wantsRe && reLayersReady;

  if (showReOverlay) {
    map.setPaintProperty("parcels-fill", "fill-color", PARCEL_FILL_NEUTRAL);
    map.setPaintProperty("parcels-fill", "fill-opacity", 0);
  } else {
    const zoningTint = opts.parcelBaseLayer === "tax_zoning" && opts.showZoningColors;
    map.setPaintProperty(
      "parcels-fill",
      "fill-color",
      zoningTint ? mapboxZoningFillColorExpression() : PARCEL_FILL_NEUTRAL,
    );
    map.setPaintProperty("parcels-fill", "fill-opacity", PARCEL_FILL_OPACITY_HOVER);
  }

  if (map.getLayer("parcels-line")) {
    map.setPaintProperty("parcels-line", "line-opacity", showReOverlay ? 0.5 : 0.85);
  }

  if (!map.getLayer("re-districts-fill")) return;
  map.setLayoutProperty("re-districts-fill", "visibility", showReOverlay ? "visible" : "none");
  if (map.getLayer("re-districts-boundary")) {
    map.setLayoutProperty("re-districts-boundary", "visibility", showReOverlay ? "visible" : "none");
  }
  if (map.getLayer("re-districts-outline")) {
    map.setLayoutProperty("re-districts-outline", "visibility", "none");
  }
  if (map.getLayer("re-districts-label")) {
    map.setLayoutProperty("re-districts-label", "visibility", showReOverlay ? "visible" : "none");
  }
  if (showReOverlay) {
    const hi = (opts.highlightedReDistrictAbbrv ?? "").trim();
    if (hi) {
      map.setPaintProperty("re-districts-fill", "fill-opacity", [
        "case",
        ["==", ["get", "Abbrv"], hi],
        RE_DISTRICT_FILL_OPACITY_HIGHLIGHT,
        RE_DISTRICT_FILL_OPACITY_DIM,
      ]);
    } else {
      map.setPaintProperty("re-districts-fill", "fill-opacity", RE_DISTRICT_FILL_OPACITY_DEFAULT);
    }
  }
}

function getFeatureCoordinates(feature: ParcelFeature): [number, number][] {
  const geometry = feature.geometry;
  if (!geometry) return [];

  const coords: [number, number][] = [];

  const collectCoordinates = (value: unknown) => {
    if (!Array.isArray(value)) return;
    if (
      value.length >= 2 &&
      typeof value[0] === "number" &&
      typeof value[1] === "number"
    ) {
      coords.push([value[0], value[1]]);
      return;
    }
    for (const child of value) {
      collectCoordinates(child);
    }
  };

  if ("coordinates" in geometry) {
    collectCoordinates(geometry.coordinates);
  } else if ("geometries" in geometry) {
    for (const subGeometry of geometry.geometries) {
      if ("coordinates" in subGeometry) {
        collectCoordinates(subGeometry.coordinates);
      }
    }
  }
  return coords;
}

function getFeatureBounds(feature: ParcelFeature): mapboxgl.LngLatBounds | null {
  const coords = getFeatureCoordinates(feature);
  if (coords.length === 0) return null;

  const bounds = new mapboxgl.LngLatBounds(coords[0], coords[0]);
  for (const coordinate of coords) {
    bounds.extend(coordinate);
  }
  return bounds;
}

export function ZoningMap({
  geojson,
  onParcelSelect,
  selectedParcelId,
  highlightSoldParcels = false,
  soldParcelIds = [],
  showZoningColors = true,
  className,
  showRentalPins = false,
  rentalGeoJson = null,
  selectedRentalFeatureId = null,
  onRentalPinSelect,
  onViewportBoundsChange,
  showLinkPins = false,
  linkActiveGeoJson = null,
  linkSoldGeoJson = null,
  selectedLinkListingId = null,
  onLinkListingPinSelect,
  flyTo = null,
  reDistrictsGeoJson = null,
  parcelBaseLayer = "tax_zoning",
  highlightedReDistrictAbbrv = null,
  omniboxPreviewParcelId = null,
  omniboxPreviewPoint = null,
  onMapNonFeatureInteraction,
}: ZoningMapProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routerRef = useRef(router);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    routerRef.current = router;
    pathnameRef.current = pathname;
  }, [router, pathname]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const moveEndUrlCleanupRef = useRef<(() => void) | null>(null);
  const highlightSoldRef = useRef(highlightSoldParcels);
  const soldParcelIdsRef = useRef(soldParcelIds);
  const showZoningColorsRef = useRef(showZoningColors);
  const parcelBaseLayerRef = useRef(parcelBaseLayer);
  const highlightedReDistrictAbbrvRef = useRef(highlightedReDistrictAbbrv);
  const onRentalPinSelectRef = useRef(onRentalPinSelect);
  const onViewportBoundsChangeRef = useRef(onViewportBoundsChange);
  const showRentalPinsRef = useRef(showRentalPins);
  const rentalGeoJsonRef = useRef(rentalGeoJson);
  const linkActiveGeoJsonRef = useRef(linkActiveGeoJson);
  const linkSoldGeoJsonRef = useRef(linkSoldGeoJson);
  const onLinkListingPinSelectRef = useRef(onLinkListingPinSelect);
  const showLinkPinsRef = useRef(showLinkPins);
  const reDistrictsGeoJsonRef = useRef(reDistrictsGeoJson);

  useEffect(() => {
    rentalGeoJsonRef.current = rentalGeoJson ?? null;
  }, [rentalGeoJson]);

  useEffect(() => {
    linkActiveGeoJsonRef.current = linkActiveGeoJson ?? null;
  }, [linkActiveGeoJson]);

  useEffect(() => {
    linkSoldGeoJsonRef.current = linkSoldGeoJson ?? null;
  }, [linkSoldGeoJson]);

  useEffect(() => {
    reDistrictsGeoJsonRef.current = reDistrictsGeoJson ?? null;
  }, [reDistrictsGeoJson]);

  useEffect(() => {
    onLinkListingPinSelectRef.current = onLinkListingPinSelect;
    showLinkPinsRef.current = showLinkPins;
  }, [onLinkListingPinSelect, showLinkPins]);

  const onMapNonFeatureInteractionRef = useRef(onMapNonFeatureInteraction);
  useEffect(() => {
    onMapNonFeatureInteractionRef.current = onMapNonFeatureInteraction;
  }, [onMapNonFeatureInteraction]);

  useEffect(() => {
    highlightSoldRef.current = highlightSoldParcels;
    soldParcelIdsRef.current = soldParcelIds;
    showZoningColorsRef.current = showZoningColors;
    parcelBaseLayerRef.current = parcelBaseLayer;
    highlightedReDistrictAbbrvRef.current = highlightedReDistrictAbbrv;
    onRentalPinSelectRef.current = onRentalPinSelect;
    onViewportBoundsChangeRef.current = onViewportBoundsChange;
    showRentalPinsRef.current = showRentalPins;
  }, [
    highlightSoldParcels,
    soldParcelIds,
    showZoningColors,
    parcelBaseLayer,
    highlightedReDistrictAbbrv,
    onRentalPinSelect,
    onViewportBoundsChange,
    showRentalPins,
  ]);

  const applySoldParcelHighlight = (map: mapboxgl.Map) => {
    if (!map.getLayer("parcels-sold-outline")) return;
    const on = highlightSoldRef.current;
    const ids = soldParcelIdsRef.current;
    if (!on || ids.length === 0) {
      map.setLayoutProperty("parcels-sold-outline", "visibility", "none");
      return;
    }
    map.setFilter("parcels-sold-outline", ["in", ["get", "parcel_id"], ["literal", [...ids]]]);
    map.setLayoutProperty("parcels-sold-outline", "visibility", "visible");
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !mapboxgl.accessToken) return;

    const initialFromUrl =
      typeof window !== "undefined"
        ? parseMapViewFromSearchParams(new URLSearchParams(window.location.search))
        : null;
    const initial = initialFromUrl ?? { center: DEFAULT_MAP_CENTER, zoom: DEFAULT_MAP_ZOOM };

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: initial.center,
      zoom: initial.zoom,
      minZoom: 10,
      maxZoom: 18,
    });

    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    });

    map.on("load", () => {
      map.addSource("parcels", {
        type: "geojson",
        data: geojson ?? { type: "FeatureCollection", features: [] },
        promoteId: "parcel_id",
      });

      map.addLayer({
        id: "parcels-fill",
        type: "fill",
        source: "parcels",
        paint: {
          "fill-color": showZoningColorsRef.current
            ? mapboxZoningFillColorExpression()
            : PARCEL_FILL_NEUTRAL,
          "fill-opacity": PARCEL_FILL_OPACITY_HOVER,
          "fill-outline-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "parcels-line",
        type: "line",
        source: "parcels",
        minzoom: PARCEL_OUTLINE_MIN_ZOOM,
        paint: {
          "line-color": ["case", ["boolean", ["feature-state", "hover"], false], "#0f172a", "#334155"],
          "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2.4, 1.1],
          "line-opacity": 0.85,
        },
      });

      map.addLayer({
        id: "parcels-sold-outline",
        type: "line",
        source: "parcels",
        minzoom: PARCEL_OUTLINE_MIN_ZOOM,
        layout: { visibility: "none" },
        filter: ["literal", false],
        paint: {
          "line-color": "#c2410c",
          "line-width": 3.2,
          "line-opacity": 0.95,
        },
      });

      map.addLayer({
        id: "parcels-selected",
        type: "line",
        source: "parcels",
        minzoom: PARCEL_OUTLINE_MIN_ZOOM,
        paint: {
          "line-color": "#22c55e",
          "line-width": 4,
          "line-opacity": 0.9,
        },
        filter: ["==", ["coalesce", ["get", "parcel_id"], ""], "__none__"],
      });

      if (showRentalPinsRef.current) {
        map.addSource("rentals", {
          type: "geojson",
          data: rentalGeoJsonRef.current ?? { type: "FeatureCollection", features: [] },
          cluster: true,
          clusterMaxZoom: CLUSTER_MAX_ZOOM,
          clusterRadius: CLUSTER_RADIUS,
        });
        map.addLayer({
          id: "rentals-clusters",
          type: "circle",
          source: "rentals",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#15803d",
            "circle-radius": ["step", ["get", "point_count"], 18, 8, 24, 24, 32, 48, 38, 96, 44],
            "circle-opacity": 0.95,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#bbf7d0",
            "circle-blur": 0.12,
          },
        });
        map.addLayer({
          id: "rentals-cluster-count",
          type: "symbol",
          source: "rentals",
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["to-string", ["get", "point_count"]],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 11,
          },
          paint: { "text-color": "#ffffff" },
        });
        map.addLayer({
          id: "rentals-point",
          type: "circle",
          source: "rentals",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "#22c55e",
            "circle-radius": 9,
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#ffffff",
            "circle-blur": 0.1,
          },
        });
        map.addLayer({
          id: "rentals-point-price",
          type: "symbol",
          source: "rentals",
          minzoom: MIN_ZOOM_PIN_PRICE_LABEL,
          filter: ["all", ["!", ["has", "point_count"]], [">", ["length", ["get", "priceLabel"]], 0]],
          layout: {
            "text-field": ["get", "priceLabel"],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 11,
            "text-offset": [0, 1.35],
            "text-anchor": "top",
            "text-allow-overlap": false,
            "text-ignore-placement": false,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "#15803d",
            "text-halo-width": 1.5,
          },
        });

        map.on("click", "rentals-clusters", (e) => {
          const feats = map.queryRenderedFeatures(e.point, { layers: ["rentals-clusters"] });
          if (!feats.length) return;
          const src = map.getSource("rentals") as mapboxgl.GeoJSONSource;
          const cid = feats[0].properties?.cluster_id as number;
          const coords = (feats[0].geometry as Point).coordinates as [number, number];
          src.getClusterExpansionZoom(cid, (err, zoom) => {
            if (err || zoom == null) return;
            map.easeTo({ center: coords, zoom, duration: 1600 });
          });
        });
        const onRentalPointClick = (e: mapboxgl.MapLayerMouseEvent) => {
          const f = e.features?.[0];
          if (!f || f.geometry.type !== "Point") return;
          onRentalPinSelectRef.current?.(f as unknown as RentalPinFeature);
        };
        map.on("click", "rentals-point", onRentalPointClick);
        map.on("click", "rentals-point-price", onRentalPointClick);
        map.on("mouseenter", "rentals-point", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseenter", "rentals-point-price", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "rentals-point", () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("mouseleave", "rentals-point-price", () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("mouseenter", "rentals-clusters", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "rentals-clusters", () => {
          map.getCanvas().style.cursor = "";
        });
      }

      const emptyLinkFc: FeatureCollection<Point, LinkListingPinProperties> = { type: "FeatureCollection", features: [] };

      const attachClusteredPool = (
        sourceId: string,
        clusterFill: string,
        clusterStroke: string,
        pointFill: string,
        initialData: FeatureCollection<Point, LinkListingPinProperties>,
        priceMode: "active" | "sold",
      ) => {
        if (map.getSource(sourceId)) return;
        map.addSource(sourceId, {
          type: "geojson",
          data: initialData,
          cluster: true,
          clusterMaxZoom: CLUSTER_MAX_ZOOM,
          clusterRadius: CLUSTER_RADIUS,
        });
        map.addLayer({
          id: `${sourceId}-clusters`,
          type: "circle",
          source: sourceId,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": clusterFill,
            "circle-radius": ["step", ["get", "point_count"], 18, 8, 22, 24, 30, 48, 36, 96, 42],
            "circle-opacity": 0.93,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": clusterStroke,
            "circle-blur": 0.08,
          },
        });
        map.addLayer({
          id: `${sourceId}-count`,
          type: "symbol",
          source: sourceId,
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["to-string", ["get", "point_count"]],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 10,
          },
          paint: { "text-color": "#ffffff" },
        });
        map.addLayer({
          id: `${sourceId}-point`,
          type: "circle",
          source: sourceId,
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": pointFill,
            "circle-radius": 7,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        const priceTextField: mapboxgl.ExpressionSpecification =
          priceMode === "active"
            ? (["coalesce", ["get", "listPrice"], ""] as mapboxgl.ExpressionSpecification)
            : ([
                "case",
                [">", ["length", ["coalesce", ["get", "closePrice"], ""]], 0],
                ["get", "closePrice"],
                ["coalesce", ["get", "listPrice"], ""],
              ] as mapboxgl.ExpressionSpecification);

        const priceFilter: mapboxgl.FilterSpecification =
          priceMode === "active"
            ? (["all", ["!", ["has", "point_count"]], [">", ["length", ["coalesce", ["get", "listPrice"], ""]], 0]] as mapboxgl.FilterSpecification)
            : ([
                "all",
                ["!", ["has", "point_count"]],
                [
                  "any",
                  [">", ["length", ["coalesce", ["get", "closePrice"], ""]], 0],
                  [">", ["length", ["coalesce", ["get", "listPrice"], ""]], 0],
                ],
              ] as mapboxgl.FilterSpecification);

        map.addLayer({
          id: `${sourceId}-point-price`,
          type: "symbol",
          source: sourceId,
          minzoom: MIN_ZOOM_PIN_PRICE_LABEL,
          filter: priceFilter,
          layout: {
            "text-field": priceTextField,
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 10,
            "text-offset": [0, 1.2],
            "text-anchor": "top",
            "text-allow-overlap": false,
            "text-ignore-placement": false,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": pointFill,
            "text-halo-width": 1.25,
          },
        });

        map.on("click", `${sourceId}-clusters`, (e) => {
          const feats = map.queryRenderedFeatures(e.point, { layers: [`${sourceId}-clusters`] });
          if (!feats.length) return;
          const src = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
          const cid = feats[0].properties?.cluster_id as number;
          const coords = (feats[0].geometry as Point).coordinates as [number, number];
          src.getClusterExpansionZoom(cid, (err, zoom) => {
            if (err || zoom == null) return;
            map.easeTo({ center: coords, zoom, duration: 1600 });
          });
        });
        const onLinkPointClick = (e: mapboxgl.MapLayerMouseEvent) => {
          const f = e.features?.[0];
          if (!f || f.geometry.type !== "Point") return;
          onLinkListingPinSelectRef.current?.(f as unknown as LinkListingPinFeature);
        };
        map.on("click", `${sourceId}-point`, onLinkPointClick);
        map.on("click", `${sourceId}-point-price`, onLinkPointClick);
        map.on("mouseenter", `${sourceId}-point`, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseenter", `${sourceId}-point-price`, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", `${sourceId}-point`, () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("mouseleave", `${sourceId}-point-price`, () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("mouseenter", `${sourceId}-clusters`, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", `${sourceId}-clusters`, () => {
          map.getCanvas().style.cursor = "";
        });
      };

      if (showLinkPinsRef.current) {
        attachClusteredPool(
          "link-active",
          "#1d4ed8",
          "#bfdbfe",
          "#2563eb",
          linkActiveGeoJsonRef.current ?? emptyLinkFc,
          "active",
        );
        attachClusteredPool(
          "link-sold",
          "#475569",
          "#e2e8f0",
          "#94a3b8",
          linkSoldGeoJsonRef.current ?? emptyLinkFc,
          "sold",
        );
      }

      map.addLayer({
        id: "parcels-omnibox-hover",
        type: "line",
        source: "parcels",
        minzoom: PARCEL_OUTLINE_MIN_ZOOM,
        layout: { visibility: "visible" },
        paint: {
          "line-color": "#f59e0b",
          "line-width": 4.5,
          "line-opacity": 0,
          "line-blur": 0.4,
        },
        filter: ["==", ["coalesce", ["get", "parcel_id"], ""], "__omnibox_none__"],
      });

      map.addSource("omnibox-preview", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "omnibox-preview-glow",
        type: "circle",
        source: "omnibox-preview",
        paint: {
          "circle-radius": 22,
          "circle-color": "#fbbf24",
          "circle-opacity": 0,
          "circle-blur": 0.8,
        },
      });
      map.addLayer({
        id: "omnibox-preview-dot",
        type: "circle",
        source: "omnibox-preview",
        paint: {
          "circle-radius": 9,
          "circle-color": "#f59e0b",
          "circle-opacity": 0,
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ffffff",
        },
      });

      let hoveredParcelId: string | null = null;
      const clearParcelHover = () => {
        if (hoveredParcelId == null) return;
        try {
          map.removeFeatureState({ source: "parcels", id: hoveredParcelId }, "hover");
        } catch {
          /* ignore */
        }
        hoveredParcelId = null;
      };

      map.on("mousemove", "parcels-fill", (event) => {
        if (!event.features?.length) return;
        if (map.getZoom() < PARCEL_OUTLINE_MIN_ZOOM && hitListingOrClusterAtPoint(map, event.point)) {
          clearParcelHover();
          map.getCanvas().style.cursor = "";
          popupRef.current?.remove();
          return;
        }
        map.getCanvas().style.cursor = "pointer";

        const feature = event.features[0] as ParcelFeature;
        const rawPid = feature.properties?.parcel_id;
        const pid = rawPid != null && String(rawPid).trim() !== "" ? String(rawPid) : null;
        if (pid !== hoveredParcelId) {
          clearParcelHover();
          if (pid) {
            try {
              map.setFeatureState({ source: "parcels", id: pid }, { hover: true });
              hoveredParcelId = pid;
            } catch {
              hoveredParcelId = null;
            }
          }
        }

        if (!popupRef.current) return;
        const addressRaw = String(feature.properties?.location ?? "").trim() || "Address unavailable";
        const zoningRaw = String(feature.properties?.zoning ?? "").trim() || "Unknown";
        const mlsDistrict =
          mlsDistrictNameForPoint(event.lngLat.lng, event.lngLat.lat, reDistrictsGeoJsonRef.current) ?? "Unknown";
        const address = escapeHtml(addressRaw);
        const zoning = escapeHtml(zoningRaw);
        const mlsArea = escapeHtml(mlsDistrict);

        popupRef.current
          .setLngLat(event.lngLat)
          .setHTML(
            `<div style="font-size:12px;">
              <div><strong>Address:</strong> ${address}</div>
              <div><strong>MLS Area:</strong> ${mlsArea}</div>
              <div><strong>Zoning:</strong> ${zoning}</div>
            </div>`,
          )
          .addTo(map);
      });

      map.on("mouseleave", "parcels-fill", () => {
        clearParcelHover();
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      });

      map.on("click", "parcels-fill", (event) => {
        if (!event.features?.length) return;
        if (hitListingOrClusterAtPoint(map, event.point)) return;

        const feature = event.features[0] as ParcelFeature;
        const bounds = getFeatureBounds(feature);
        const z = map.getZoom();

        if (bounds && z < PARCEL_OUTLINE_MIN_ZOOM) {
          map.fitBounds(bounds, {
            padding: { right: 28, left: 28, top: 28, bottom: 28 },
            maxZoom: PARCEL_OUTLINE_MIN_ZOOM,
            duration: 2200,
            pitch: 0,
            bearing: 0,
          });
        }

        onParcelSelect(feature);
      });

      map.on("click", (e) => {
        const cb = onMapNonFeatureInteractionRef.current;
        if (!cb) return;
        const layers: string[] = ["parcels-fill"];
        for (const id of [
          "rentals-point",
          "rentals-point-price",
          "rentals-clusters",
          "link-active-point",
          "link-active-point-price",
          "link-active-clusters",
          "link-sold-point",
          "link-sold-point-price",
          "link-sold-clusters",
        ] as const) {
          if (map.getLayer(id)) layers.push(id);
        }
        const hits = map.queryRenderedFeatures(e.point, { layers });
        if (hits.length === 0) cb();
      });

      let moveEndDebounce: ReturnType<typeof setTimeout> | undefined;
      const flushMapViewToUrl = () => {
        const c = map.getCenter();
        const z = map.getZoom();
        const base = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
        const next = applyMapViewToSearchParams(base, c, z);
        const qs = next.toString();
        const current = typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "";
        if (qs === current) return;
        const path = pathnameRef.current;
        routerRef.current.replace(`${path}${qs ? `?${qs}` : ""}`, { scroll: false });
      };

      const flushViewportSideEffects = () => {
        flushMapViewToUrl();
        if (onViewportBoundsChangeRef.current) {
          const b = map.getBounds();
          if (!b) return;
          onViewportBoundsChangeRef.current({
            west: b.getWest(),
            south: b.getSouth(),
            east: b.getEast(),
            north: b.getNorth(),
          });
        }
      };

      const onMoveEndForUrl = () => {
        clearTimeout(moveEndDebounce);
        moveEndDebounce = setTimeout(flushViewportSideEffects, MAP_VIEW_DEBOUNCE_MS);
      };

      map.on("moveend", onMoveEndForUrl);
      moveEndUrlCleanupRef.current = () => {
        clearTimeout(moveEndDebounce);
        map.off("moveend", onMoveEndForUrl);
        moveEndUrlCleanupRef.current = null;
      };

      applySoldParcelHighlight(map);

      window.setTimeout(flushViewportSideEffects, 600);

      /** First idle after base layers — MLS RE effect may attach on same tick; re-sync overlay visibility. */
      map.once("idle", () => {
        try {
          syncParcelAndReOverlay(map, {
            showZoningColors: showZoningColorsRef.current,
            parcelBaseLayer: parcelBaseLayerRef.current,
            highlightedReDistrictAbbrv: highlightedReDistrictAbbrvRef.current,
          });
        } catch {
          /* ignore */
        }
      });
    });

    mapRef.current = map;
    return () => {
      moveEndUrlCleanupRef.current?.();
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [geojson, onParcelSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource("parcels")) return;
    const source = map.getSource("parcels") as mapboxgl.GeoJSONSource;
    source.setData(geojson ?? { type: "FeatureCollection", features: [] });
  }, [geojson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("parcels-selected")) return;

    map.setFilter("parcels-selected", [
      "==",
      ["coalesce", ["get", "parcel_id"], ""],
      selectedParcelId ?? "__none__",
    ]);
  }, [selectedParcelId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer("parcels-omnibox-hover")) return;
    const pid = (omniboxPreviewParcelId ?? "").trim();
    if (!pid) {
      map.setFilter("parcels-omnibox-hover", ["==", ["coalesce", ["get", "parcel_id"], ""], "__omnibox_none__"]);
      map.setPaintProperty("parcels-omnibox-hover", "line-opacity", 0);
      return;
    }
    map.setFilter("parcels-omnibox-hover", ["==", ["coalesce", ["get", "parcel_id"], ""], pid]);
    map.setPaintProperty("parcels-omnibox-hover", "line-opacity", 0.92);
  }, [omniboxPreviewParcelId]);

  useEffect(() => {
    const map = mapRef.current;
    const src = map?.getSource("omnibox-preview") as mapboxgl.GeoJSONSource | undefined;
    if (!map || !src || !map.getLayer("omnibox-preview-dot")) return;
    const pt = omniboxPreviewPoint;
    if (!pt || Number.isNaN(pt.lng) || Number.isNaN(pt.lat)) {
      src.setData({ type: "FeatureCollection", features: [] });
      map.setPaintProperty("omnibox-preview-dot", "circle-opacity", 0);
      map.setPaintProperty("omnibox-preview-glow", "circle-opacity", 0);
      return;
    }
    src.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: [pt.lng, pt.lat] },
        },
      ],
    });
    map.setPaintProperty("omnibox-preview-dot", "circle-opacity", 0.95);
    map.setPaintProperty("omnibox-preview-glow", "circle-opacity", 0.38);
  }, [omniboxPreviewPoint]);

  const soldParcelIdsKey = soldParcelIds.join("\u0001");

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    applySoldParcelHighlight(map);
  }, [highlightSoldParcels, soldParcelIdsKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const runSync = () =>
      syncParcelAndReOverlay(map, {
        showZoningColors: showZoningColorsRef.current,
        parcelBaseLayer: parcelBaseLayerRef.current,
        highlightedReDistrictAbbrv: highlightedReDistrictAbbrvRef.current,
      });
    runSync();
    /** MLS overlay needs RE layers; they may land a frame after `parcelBaseLayer` updates — bump sync. */
    if (parcelBaseLayer !== "re_market_areas") return;
    const bump = () => runSync();
    const rafId = requestAnimationFrame(bump);
    map.once("idle", bump);
    return () => {
      cancelAnimationFrame(rafId);
      map.off("idle", bump);
    };
  }, [showZoningColors, parcelBaseLayer, highlightedReDistrictAbbrv]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !reDistrictsGeoJson?.features?.length) return;

    let cancelled = false;

    /** Returns true once MLS district sources/layers are in place (or already were). */
    const ensureLayers = (): boolean => {
      if (cancelled) return false;
      if (!map.isStyleLoaded() || !map.getLayer("parcels-fill")) return false;
      const data = reDistrictsGeoJsonRef.current;
      if (!data?.features?.length) return false;

      const boundaryBefore = reDistrictBoundaryInsertBefore(map);
      const boundaryLines = reDistrictPolygonsToBoundaryLines(
        data as FeatureCollection<Geometry, Record<string, unknown>>,
      );
      const labelPoints = reDistrictPolygonsToLabelPoints(
        data as FeatureCollection<Geometry, Record<string, unknown>>,
      );

      const upsertReDistrictLabelLayer = () => {
        const textField: mapboxgl.ExpressionSpecification = [
          "case",
          [">", ["length", ["coalesce", ["get", "District"], ""]], 0],
          ["get", "District"],
          ["coalesce", ["get", "Abbrv"], ""],
        ];
        if (!map.getSource("re-districts-labels")) {
          map.addSource("re-districts-labels", { type: "geojson", data: labelPoints });
          map.addLayer(
            {
              id: "re-districts-label",
              type: "symbol",
              source: "re-districts-labels",
              minzoom: 10,
              layout: {
                visibility: "none",
                "text-field": textField,
                "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
                "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 12, 11, 14, 12.5, 16, 13.5],
                "text-allow-overlap": true,
                "text-padding": 4,
              },
              paint: {
                "text-color": "#0f172a",
                "text-halo-color": "#ffffff",
                "text-halo-width": 3,
                "text-halo-blur": 0.35,
                "text-opacity": ["interpolate", ["linear"], ["zoom"], 9.5, 0, 10, 1],
              },
            },
            "parcels-fill",
          );
        } else {
          (map.getSource("re-districts-labels") as mapboxgl.GeoJSONSource).setData(labelPoints);
          if (!map.getLayer("re-districts-label")) {
            map.addLayer(
              {
                id: "re-districts-label",
                type: "symbol",
                source: "re-districts-labels",
                minzoom: 10,
                layout: {
                  visibility: "none",
                  "text-field": textField,
                  "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
                  "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 12, 11, 14, 12.5, 16, 13.5],
                  "text-allow-overlap": true,
                  "text-padding": 4,
                },
                paint: {
                  "text-color": "#0f172a",
                  "text-halo-color": "#ffffff",
                  "text-halo-width": 3,
                  "text-halo-blur": 0.35,
                  "text-opacity": ["interpolate", ["linear"], ["zoom"], 9.5, 0, 10, 1],
                },
              },
              "parcels-fill",
            );
          }
        }
      };

      if (!map.getSource("re-districts")) {
        if (map.getLayer("re-districts-outline")) map.removeLayer("re-districts-outline");
        if (map.getLayer("re-districts-boundary")) map.removeLayer("re-districts-boundary");
        if (map.getSource("re-districts-boundaries")) map.removeSource("re-districts-boundaries");

        map.addSource("re-districts", { type: "geojson", data });
        map.addSource("re-districts-boundaries", { type: "geojson", data: boundaryLines });
        map.addLayer(
          {
            id: "re-districts-fill",
            type: "fill",
            source: "re-districts",
            layout: { visibility: "none" },
            paint: {
              "fill-color": reDistrictFillColorExpression() as mapboxgl.ExpressionSpecification,
              "fill-opacity": RE_DISTRICT_FILL_OPACITY_INITIAL,
            },
          },
          "parcels-fill",
        );
        /** LineString source — Mapbox ignores Polygon geometry on `line` layers. */
        map.addLayer(
          {
            id: "re-districts-boundary",
            type: "line",
            source: "re-districts-boundaries",
            layout: { visibility: "none" },
            paint: {
              "line-color": "#0f172a",
              "line-width": RE_DISTRICT_BOUNDARY_LINE_WIDTH,
              "line-opacity": 0.95,
            },
          },
          boundaryBefore,
        );
        upsertReDistrictLabelLayer();
      } else {
        (map.getSource("re-districts") as mapboxgl.GeoJSONSource).setData(data);
        let lineSrc = map.getSource("re-districts-boundaries") as mapboxgl.GeoJSONSource | undefined;
        if (!lineSrc) {
          map.addSource("re-districts-boundaries", { type: "geojson", data: boundaryLines });
          lineSrc = map.getSource("re-districts-boundaries") as mapboxgl.GeoJSONSource;
        } else {
          lineSrc.setData(boundaryLines);
        }
        const boundaryLayer = map.getLayer("re-districts-boundary");
        const wrongSource =
          boundaryLayer &&
          "source" in boundaryLayer &&
          boundaryLayer.source !== "re-districts-boundaries";
        if (wrongSource) {
          map.removeLayer("re-districts-boundary");
        }
        if (!map.getLayer("re-districts-boundary")) {
          map.addLayer(
            {
              id: "re-districts-boundary",
              type: "line",
              source: "re-districts-boundaries",
              layout: { visibility: "none" },
              paint: {
                "line-color": "#0f172a",
                "line-width": RE_DISTRICT_BOUNDARY_LINE_WIDTH,
                "line-opacity": 0.95,
              },
            },
            boundaryBefore,
          );
        }
        if (map.getLayer("re-districts-outline")) map.removeLayer("re-districts-outline");
        upsertReDistrictLabelLayer();
      }
      syncParcelAndReOverlay(map, {
        showZoningColors: showZoningColorsRef.current,
        parcelBaseLayer: parcelBaseLayerRef.current,
        highlightedReDistrictAbbrv: highlightedReDistrictAbbrvRef.current,
      });
      return true;
    };

    /**
     * RE GeoJSON can resolve before `parcels-fill` exists, or `idle` can be scarce during motion.
     * Use a short polling interval plus one-shot `load`/`idle` hooks until attach succeeds (bounded).
     */
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let attempts = 0;
    const maxAttempts = 80;

    const tryAttach = (): boolean => {
      if (cancelled) return true;
      attempts += 1;
      if (attempts > maxAttempts) {
        if (intervalId) clearInterval(intervalId);
        intervalId = undefined;
        return true;
      }
      if (ensureLayers()) {
        if (intervalId) clearInterval(intervalId);
        intervalId = undefined;
        return true;
      }
      return false;
    };

    const onStyleReady = () => {
      tryAttach();
    };

    if (!tryAttach()) {
      map.once("idle", onStyleReady);
      map.once("load", onStyleReady);
      intervalId = setInterval(() => {
        if (tryAttach()) {
          if (intervalId) clearInterval(intervalId);
          intervalId = undefined;
        }
      }, 120);
    }

    return () => {
      cancelled = true;
      map.off("idle", onStyleReady);
      map.off("load", onStyleReady);
      if (intervalId) clearInterval(intervalId);
    };
  }, [reDistrictsGeoJson, showZoningColors, parcelBaseLayer, highlightedReDistrictAbbrv]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource("rentals")) return;
    const source = map.getSource("rentals") as mapboxgl.GeoJSONSource;
    source.setData(rentalGeoJson ?? { type: "FeatureCollection", features: [] });
  }, [rentalGeoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer("rentals-point")) return;
    const sel = selectedRentalFeatureId ?? "__none__";
    map.setPaintProperty("rentals-point", "circle-stroke-color", [
      "case",
      ["==", ["get", "nrPropertyId"], sel],
      "#14532d",
      "#ffffff",
    ]);
    map.setPaintProperty("rentals-point", "circle-stroke-width", [
      "case",
      ["==", ["get", "nrPropertyId"], sel],
      3,
      2,
    ]);
    if (map.getLayer("rentals-point-price")) {
      map.setPaintProperty("rentals-point-price", "text-halo-color", [
        "case",
        ["==", ["get", "nrPropertyId"], sel],
        "#14532d",
        "#15803d",
      ]);
    }
  }, [selectedRentalFeatureId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource("link-active")) return;
    (map.getSource("link-active") as mapboxgl.GeoJSONSource).setData(
      linkActiveGeoJson ?? { type: "FeatureCollection", features: [] },
    );
  }, [linkActiveGeoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource("link-sold")) return;
    (map.getSource("link-sold") as mapboxgl.GeoJSONSource).setData(
      linkSoldGeoJson ?? { type: "FeatureCollection", features: [] },
    );
  }, [linkSoldGeoJson]);

  useEffect(() => {
    const map = mapRef.current;
    const sel = selectedLinkListingId ?? "__none__";
    for (const base of ["link-active", "link-sold"] as const) {
      const pointHalo = base === "link-active" ? "#2563eb" : "#94a3b8";
      const lid = `${base}-point`;
      if (!map?.getLayer(lid)) continue;
      map.setPaintProperty(lid, "circle-stroke-color", [
        "case",
        ["==", ["get", "linkId"], sel],
        "#0f172a",
        "#ffffff",
      ]);
      map.setPaintProperty(lid, "circle-stroke-width", [
        "case",
        ["==", ["get", "linkId"], sel],
        3,
        2,
      ]);
      const priceLid = `${base}-point-price`;
      if (map.getLayer(priceLid)) {
        map.setPaintProperty(priceLid, "text-halo-color", [
          "case",
          ["==", ["get", "linkId"], sel],
          "#0f172a",
          pointHalo,
        ]);
      }
    }
  }, [selectedLinkListingId]);

  const mapViewQueryKey = searchParams.toString();

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const parsed = parseMapViewFromSearchParams(new URLSearchParams(mapViewQueryKey));
    if (!parsed) return;

    const c = map.getCenter();
    const current = { center: [c.lng, c.lat] as [number, number], zoom: map.getZoom() };
    if (mapViewCloseEnough(current, parsed)) return;

    map.jumpTo({ center: parsed.center, zoom: parsed.zoom });
  }, [mapViewQueryKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyTo) return;

    const apply = (): boolean => {
      if (!map.isStyleLoaded()) return false;
      if ("bounds" in flyTo) {
        const { west, south, east, north } = flyTo.bounds;
        map.fitBounds(
          [
            [west, south],
            [east, north],
          ],
          { padding: { top: 72, bottom: 100, left: 40, right: 40 }, duration: 2000, maxZoom: 15 },
        );
      } else {
        map.easeTo({
          center: [flyTo.lng, flyTo.lat],
          zoom: flyTo.zoom,
          duration: 2000,
        });
      }
      return true;
    };

    if (apply()) return undefined;

    let done = false;
    const onIdle = () => {
      if (done) return;
      if (apply()) {
        done = true;
        map.off("idle", onIdle);
      }
    };
    map.on("idle", onIdle);
    return () => {
      done = true;
      map.off("idle", onIdle);
    };
  }, [flyTo]);

  if (!mapboxgl.accessToken) {
    return (
      <div className="min-h-[560px] w-full rounded-xl border border-dashed border-[var(--cedar-shingle)]/35 bg-white p-8 text-sm text-[var(--nantucket-gray)]">
        Add `NEXT_PUBLIC_MAPBOX_TOKEN` to enable the parcel map.
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className={className ?? "min-h-[620px] w-full rounded-xl"}
    />
  );
}
