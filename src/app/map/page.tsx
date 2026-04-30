import type { Metadata } from "next";
import { Suspense } from "react";
import { ZoningLookupClient } from "@/components/zoning/ZoningLookupClient";

export const metadata: Metadata = {
  title: "Live Map — Nantucket Rentals & Sales | Nantucket Houses",
  description:
    "Interactive Nantucket property map: vacation rentals, parcel and zoning context, and local expertise. MLS for sale and sold comps coming soon.",
  alternates: {
    canonical: "/map",
  },
};

export default function PropertyMapPage() {
  return (
    <Suspense
      fallback={
        <section className="flex min-h-[40vh] items-center justify-center bg-[var(--sandstone)] text-[var(--nantucket-gray)]">
          Loading property map…
        </section>
      }
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <ZoningLookupClient variant="property-map" />
      </div>
    </Suspense>
  );
}
