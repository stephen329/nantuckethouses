import Link from "next/link";
import { MapPin } from "lucide-react";
import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";
import { NEIGHBORHOOD_MAP } from "@/lib/neighborhoods";
import neighborhoodProfiles from "@/data/neighborhood-profiles.json";
import vibeMeterData from "@/data/vibe-meter.json";
import zoningData from "@/data/zoning-districts.json";
import type { VibeMeterData, VibeStatus } from "@/types";

const vibe = vibeMeterData as VibeMeterData;

const statusEmoji: Record<VibeStatus, string> = {
  Steamy: "🟢",
  Warm: "🟡",
  Steady: "🟠",
  Chilly: "🔵",
  Cold: "⚪",
};

type Profile = {
  slug: string;
  name: string;
  description: string;
  zoningDistrict: string;
};

export default function NeighborhoodsOverviewPage() {
  const profiles = Object.values(neighborhoodProfiles) as Profile[];

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Neighborhoods" }]} />
          <h1 className="text-white text-3xl sm:text-4xl">Neighborhoods</h1>
          <p className="text-white/50 mt-2 text-sm max-w-2xl">
            Every neighborhood on Nantucket has its own character, zoning rules, and market dynamics.
            Explore each area for local stats, sentiment, shoreline status, and what&apos;s happening on the ground.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => {
              const vibeEntry = vibe.neighborhoods.find(
                (n) => n.neighborhood.replace("'", "").toLowerCase() === profile.name.replace("'", "").toLowerCase()
              );
              const district = (zoningData.districts as Record<string, { name: string }>)[profile.zoningDistrict];

              return (
                <Link
                  key={profile.slug}
                  href={`/neighborhoods/${profile.slug}`}
                  className="group bg-white rounded-lg p-5 border border-[var(--cedar-shingle)]/10 hover:border-[var(--privet-green)]/30 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[var(--nantucket-gray)] group-hover:text-[var(--privet-green)] transition-colors" />
                      <h3 className="text-base font-semibold text-[var(--atlantic-navy)] group-hover:text-[var(--privet-green)] transition-colors font-sans">
                        {profile.name}
                      </h3>
                    </div>
                    {vibeEntry && (
                      <span className="text-xs flex items-center gap-1">
                        {statusEmoji[vibeEntry.status]}
                        <span className="text-[var(--nantucket-gray)]">{vibeEntry.status}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--atlantic-navy)]/70 leading-relaxed mb-3">
                    {profile.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[var(--nantucket-gray)]">
                    {district && (
                      <span className="bg-[var(--sandstone)] px-2 py-0.5 rounded font-sans">
                        {profile.zoningDistrict}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Map teaser */}
          <div className="mt-8 text-center">
            <Link
              href="/regulatory/zoning-map"
              className="text-sm text-[var(--privet-green)] hover:underline"
            >
              Explore on interactive zoning map &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
