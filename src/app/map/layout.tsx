import { MapRouteEffects } from "@/components/map/MapRouteEffects";

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MapRouteEffects />
      <div className="map-page-layout flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </>
  );
}
