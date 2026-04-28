import type { Metadata } from "next";
import { ZoningLookupClient } from "@/components/zoning/ZoningLookupClient";

export const metadata: Metadata = {
  title: "Nantucket Zoning Lookup | Interactive Parcel Map & Intelligence",
  description:
    "Interactive Nantucket parcel lookup with zoning, ownership, assessed values, lot size, and due-diligence intelligence.",
  alternates: {
    canonical: "/tools/zoning-lookup",
  },
};

export default function ZoningLookupToolPage() {
  return <ZoningLookupClient />;
}
