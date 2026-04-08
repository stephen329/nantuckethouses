"use client";

import { useState } from "react";
import { Search, MapPin, AlertTriangle } from "lucide-react";
import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";
import zoningData from "@/data/zoning-districts.json";

type DistrictInfo = {
  name: string;
  minLotSize: string;
  frontage?: string;
  maxGroundCover: string;
  frontSetback: string;
  sideSetback: string;
  rearSetback: string;
  notes: string;
  [key: string]: string | undefined;
};

export default function ZoningLookupPage() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<{ district: string; info: DistrictInfo } | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    // Simple neighborhood matching from address
    const lower = address.toLowerCase();
    const neighborhoodDistricts = (zoningData as any).neighborhoodDistricts ?? {};
    let matchedCodes: string[] = [];

    for (const [neighborhood, codes] of Object.entries(neighborhoodDistricts)) {
      if (lower.includes(neighborhood.toLowerCase())) {
        matchedCodes = codes as string[];
        break;
      }
    }

    // Default to R-1 if no match
    if (matchedCodes.length === 0) matchedCodes = ["R-1"];

    const primaryCode = matchedCodes[0];
    const info = (zoningData.districts as Record<string, DistrictInfo>)[primaryCode];
    setResult(info ? { district: primaryCode, info } : null);
    setSearched(true);

    // Track Klaviyo event
    if (typeof window !== "undefined" && (window as any).klaviyo) {
      (window as any).klaviyo.push(["track", "Zoning_Lookup_Attempt", { address }]);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Regulatory Hub", href: "/regulatory" },
              { label: "Zoning Lookup" },
            ]}
          />
          <h1 className="text-white text-3xl sm:text-4xl">Zoning by Address</h1>
          <p className="text-white/50 mt-2 text-sm max-w-2xl">
            Enter a Nantucket address to see basic zoning district information instantly.
            For a detailed development potential analysis, request a custom summary below.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nantucket-gray)]" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter address (e.g., 12 Main Street, Town)"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--cedar-shingle)]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--privet-green)] bg-white"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-[var(--privet-green)] text-white text-sm font-medium rounded-lg hover:bg-[var(--privet-green)]/90 transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Lookup
              </button>
            </div>
          </form>

          {/* Results */}
          {searched && result && (
            <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 overflow-hidden mb-8">
              <div className="bg-[var(--atlantic-navy)] px-5 py-3">
                <p className="text-white text-sm font-semibold font-sans">
                  District: {result.district} — {result.info.name}
                </p>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-xs text-[var(--nantucket-gray)] font-sans">Min Lot Size</p>
                    <p className="font-semibold text-[var(--atlantic-navy)]">{result.info.minLotSize}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--nantucket-gray)] font-sans">Max Ground Cover</p>
                    <p className="font-semibold text-[var(--atlantic-navy)]">{result.info.maxGroundCover}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--nantucket-gray)] font-sans">Front Setback</p>
                    <p className="font-semibold text-[var(--atlantic-navy)]">{result.info.frontSetback}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--nantucket-gray)] font-sans">Side / Rear Setback</p>
                    <p className="font-semibold text-[var(--atlantic-navy)]">
                      {result.info.sideSetback} / {result.info.rearSetback}
                    </p>
                  </div>
                </div>
                {result.info.frontage && (
                  <p className="text-xs text-[var(--atlantic-navy)]/50 mb-3">Frontage: {result.info.frontage}</p>
                )}
                <p className="text-xs text-[var(--atlantic-navy)]/70 leading-relaxed border-t border-[var(--cedar-shingle)]/10 pt-3">
                  {result.info.notes}
                </p>
              </div>
            </div>
          )}

          {searched && !result && (
            <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-6 text-center mb-8">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-[var(--atlantic-navy)]">
                Could not determine zoning district for this address. Try including the neighborhood name.
              </p>
            </div>
          )}

          {/* Gated Upgrade */}
          {searched && result && (
            <div className="bg-[var(--atlantic-navy)] rounded-lg p-6 text-center">
              <h3 className="text-white text-lg mb-2 font-serif">
                Want the Full Picture?
              </h3>
              <p className="text-white/60 text-sm mb-4">
                Get a custom 1-page development potential summary for this property —
                buildable area, variance likelihood, HDC considerations, and timeline estimate.
              </p>
              <a
                href="https://calendly.com/stephen-maury/gut-check"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[var(--privet-green)] text-white px-6 py-3 text-sm font-medium rounded-md hover:bg-[var(--privet-green)]/90 transition-colors"
              >
                Request Custom Summary
              </a>
            </div>
          )}

          {/* Disclaimer */}
          <p className="mt-6 text-xs text-[var(--nantucket-gray)] text-center">
            This tool provides general zoning district information based on neighborhood.
            Actual zoning may vary by specific parcel. Always verify with the
            Town of Nantucket Building Department before making development decisions.
          </p>
        </div>
      </section>
    </div>
  );
}
