"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";

export type ParcelProperties = {
  parcel_id?: string | null;
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
  className?: string;
};

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const DEFAULT_CENTER: [number, number] = [-70.1, 41.28];
const DEFAULT_ZOOM = 13.5;

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
  className,
}: ZoningMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !mapboxgl.accessToken) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
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
          "fill-color": ["coalesce", ["get", "zoning_color"], "#64748b"],
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
        id: "parcels-selected",
        type: "line",
        source: "parcels",
        paint: {
          "line-color": "#0f172a",
          "line-width": 3,
          "line-opacity": 1,
        },
        filter: ["==", ["coalesce", ["get", "parcel_id"], ""], "__none__"],
      });

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
            padding: { right: 64, left: 64, top: 64, bottom: 64 },
            maxZoom: 17.5,
            duration: 1200,
          });
        }

        onParcelSelect(feature);
      });
    });

    mapRef.current = map;
    return () => {
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
