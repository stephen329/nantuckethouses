declare module "polylabel" {
  /** GeoJSON-style polygon: outer ring + holes; coordinates in map CRS (lng, lat). */
  export default function polylabel(
    polygon: number[][][],
    precision?: number,
    debug?: boolean,
  ): [number, number] & { distance?: number };
}
