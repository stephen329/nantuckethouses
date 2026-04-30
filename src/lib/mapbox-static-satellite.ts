/** Mapbox Static Images API — satellite context for parcel / listing heroes. */

export function mapboxSatelliteStaticUrl(opts: {
  lng: number;
  lat: number;
  /** Mapbox accepts integer zoom in static URLs; 17–18 works well for lot context. */
  zoom?: number;
  width: number;
  height: number;
  retina?: boolean;
}): string | null {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
  if (!token) return null;
  const { lng, lat, width, height } = opts;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  const z = Math.round(opts.zoom ?? 18);
  const bearing = 0;
  const pitch = 0;
  const retina = opts.retina ? "@2x" : "";
  const w = Math.min(Math.max(1, Math.round(width)), 1280);
  const h = Math.min(Math.max(1, Math.round(height)), 1280);
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lng},${lat},${z},${bearing},${pitch}/${w}x${h}${retina}?access_token=${encodeURIComponent(token)}`;
}
