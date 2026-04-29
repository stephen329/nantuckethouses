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
};

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const MAP_VIEW_DEBOUNCE_MS = 350;
/** Parcel fill when zoning colors are hidden (single tone over basemap). */
const PARCEL_FILL_NEUTRAL = "#cbd5e1";

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
  const onRentalPinSelectRef = useRef(onRentalPinSelect);
  const onViewportBoundsChangeRef = useRef(onViewportBoundsChange);
  const showRentalPinsRef = useRef(showRentalPins);
  const rentalGeoJsonRef = useRef(rentalGeoJson);
  const linkActiveGeoJsonRef = useRef(linkActiveGeoJson);
  const linkSoldGeoJsonRef = useRef(linkSoldGeoJson);
  const onLinkListingPinSelectRef = useRef(onLinkListingPinSelect);
  const showLinkPinsRef = useRef(showLinkPins);

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
    onLinkListingPinSelectRef.current = onLinkListingPinSelect;
    showLinkPinsRef.current = showLinkPins;
  }, [onLinkListingPinSelect, showLinkPins]);

  useEffect(() => {
    highlightSoldRef.current = highlightSoldParcels;
    soldParcelIdsRef.current = soldParcelIds;
    showZoningColorsRef.current = showZoningColors;
    onRentalPinSelectRef.current = onRentalPinSelect;
    onViewportBoundsChangeRef.current = onViewportBoundsChange;
    showRentalPinsRef.current = showRentalPins;
  }, [highlightSoldParcels, soldParcelIds, showZoningColors, onRentalPinSelect, onViewportBoundsChange, showRentalPins]);

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
      });

      map.addLayer({
        id: "parcels-fill",
        type: "fill",
        source: "parcels",
        paint: {
          "fill-color": showZoningColorsRef.current
            ? mapboxZoningFillColorExpression()
            : PARCEL_FILL_NEUTRAL,
          "fill-opacity": 0.62,
          "fill-outline-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "parcels-line",
        type: "line",
        source: "parcels",
        paint: {
          "line-color": "#334155",
          "line-width": 1.1,
          "line-opacity": 0.85,
        },
      });

      map.addLayer({
        id: "parcels-sold-outline",
        type: "line",
        source: "parcels",
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
          clusterMaxZoom: 14,
          clusterRadius: 52,
        });
        map.addLayer({
          id: "rentals-clusters",
          type: "circle",
          source: "rentals",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#15803d",
            "circle-radius": ["step", ["get", "point_count"], 16, 8, 20, 32, 26],
            "circle-opacity": 0.95,
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
            "circle-radius": 8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
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
            map.easeTo({ center: coords, zoom });
          });
        });
        map.on("click", "rentals-point", (e) => {
          const f = e.features?.[0];
          if (!f || f.geometry.type !== "Point") return;
          onRentalPinSelectRef.current?.(f as unknown as RentalPinFeature);
        });
        map.on("mouseenter", "rentals-point", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "rentals-point", () => {
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
        clusterColor: string,
        pointColor: string,
        initialData: FeatureCollection<Point, LinkListingPinProperties>,
      ) => {
        if (map.getSource(sourceId)) return;
        map.addSource(sourceId, {
          type: "geojson",
          data: initialData,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 52,
        });
        map.addLayer({
          id: `${sourceId}-clusters`,
          type: "circle",
          source: sourceId,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": clusterColor,
            "circle-radius": ["step", ["get", "point_count"], 16, 8, 20, 32, 26],
            "circle-opacity": 0.93,
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
            "circle-color": pointColor,
            "circle-radius": 7,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
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
            map.easeTo({ center: coords, zoom });
          });
        });
        map.on("click", `${sourceId}-point`, (e) => {
          const f = e.features?.[0];
          if (!f || f.geometry.type !== "Point") return;
          onLinkListingPinSelectRef.current?.(f as unknown as LinkListingPinFeature);
        });
        map.on("mouseenter", `${sourceId}-point`, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", `${sourceId}-point`, () => {
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
        attachClusteredPool("link-active", "#1d4ed8", "#2563eb", linkActiveGeoJsonRef.current ?? emptyLinkFc);
        attachClusteredPool("link-sold", "#475569", "#94a3b8", linkSoldGeoJsonRef.current ?? emptyLinkFc);
      }

      map.on("mousemove", "parcels-fill", (event) => {
        if (!event.features?.length || !popupRef.current) return;
        map.getCanvas().style.cursor = "pointer";

        const feature = event.features[0] as ParcelFeature;
        const address = feature.properties?.location ?? "Address unavailable";
        const zoning = feature.properties?.zoning ?? "Unknown zoning";

        popupRef.current
          .setLngLat(event.lngLat)
          .setHTML(`<div style="font-size:12px;"><strong>${address}</strong><br />${zoning}</div>`)
          .addTo(map);
      });

      map.on("mouseleave", "parcels-fill", () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      });

      map.on("click", "parcels-fill", (event) => {
        if (!event.features?.length) return;
        const feature = event.features[0] as ParcelFeature;
        const bounds = getFeatureBounds(feature);

        if (bounds) {
          map.fitBounds(bounds, {
            padding: { right: 20, left: 20, top: 20, bottom: 20 },
            maxZoom: 18,
            duration: 900,
            pitch: 0,
            bearing: 0,
          });
        }

        onParcelSelect(feature);
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

  const soldParcelIdsKey = soldParcelIds.join("\u0001");

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    applySoldParcelHighlight(map);
  }, [highlightSoldParcels, soldParcelIdsKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("parcels-fill")) return;
    map.setPaintProperty(
      "parcels-fill",
      "fill-color",
      showZoningColors ? mapboxZoningFillColorExpression() : PARCEL_FILL_NEUTRAL,
    );
  }, [showZoningColors]);

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
    for (const lid of ["link-active-point", "link-sold-point"] as const) {
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
