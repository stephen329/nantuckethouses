import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Shield, Clock, Ruler, TreePine, Waves, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";
import { NEIGHBORHOOD_SLUGS, getNeighborhoodName } from "@/lib/neighborhoods";
import neighborhoodProfiles from "@/data/neighborhood-profiles.json";
import vibeMeterData from "@/data/vibe-meter.json";
import zoningData from "@/data/zoning-districts.json";
import type { VibeMeterData, VibeStatus, VibeTrend } from "@/types";

const vibe = vibeMeterData as VibeMeterData;

type Profile = {
  slug: string;
  name: string;
  description: string;
  highlights: string[];
  shoreline?: { status: string; concerns: string; lastUpdated: string };
  whatsHappening: string;
  zoningDistrict: string;
};

type DistrictInfo = {
  name: string;
  minLotSize: string;
  maxGroundCover: string;
  maxHeight: string;
  frontSetback: string;
  sideSetback: string;
  rearSetback: string;
  hdcScrutiny: string;
  typicalPermitLag: string;
  notes: string;
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return NEIGHBORHOOD_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = getNeighborhoodName(slug);
  const profile = (neighborhoodProfiles as Record<string, Profile>)[slug];

  return {
    title: `${name} | Nantucket Neighborhood Guide | NantucketHouses.com`,
    description: profile?.description ?? `Explore ${name} — market stats, zoning, and local insights.`,
    openGraph: {
      title: `${name} — Nantucket Neighborhood Guide`,
      description: profile?.description,
    },
  };
}

const statusConfig: Record<string, { emoji: string; color: string }> = {
  Steamy: { emoji: "🟢", color: "text-[var(--privet-green)]" },
  Warm: { emoji: "🟡", color: "text-amber-600" },
  Steady: { emoji: "🟠", color: "text-orange-600" },
  Chilly: { emoji: "🔵", color: "text-blue-600" },
  Cold: { emoji: "⚪", color: "text-slate-500" },
};

const trendIcons: Record<VibeTrend, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

export default async function NeighborhoodPage({ params }: Props) {
  const { slug } = await params;
  const profile = (neighborhoodProfiles as Record<string, Profile>)[slug];
  if (!profile) return notFound();

  const name = profile.name;
  const vibeEntry = vibe.neighborhoods.find(
    (n) => n.neighborhood.replace("'", "").toLowerCase() === name.replace("'", "").toLowerCase()
  );
  // Support multiple districts per neighborhood
  const neighborhoodDistricts = (zoningData as any).neighborhoodDistricts ?? {};
  const assignedCodes: string[] = neighborhoodDistricts[name] ?? [profile.zoningDistrict];
  const districts = assignedCodes
    .map((code: string) => ({
      code,
      ...(zoningData.districts as Record<string, DistrictInfo>)[code],
    }))
    .filter((d: any) => d.name); // filter out invalid codes

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      {/* Hero */}
      <section className="bg-[var(--atlantic-navy)] py-10 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Neighborhoods", href: "/neighborhoods" },
              { label: name },
            ]}
          />
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-white text-3xl sm:text-4xl">{name}</h1>
              <p className="text-white/50 mt-2 text-sm max-w-xl leading-relaxed">
                {profile.description}
              </p>
            </div>
            {vibeEntry && (
              <div className="shrink-0 text-right">
                <span className="text-2xl">{statusConfig[vibeEntry.status]?.emoji}</span>
                <p className={`text-xs font-semibold uppercase tracking-wider mt-1 ${statusConfig[vibeEntry.status]?.color ?? "text-white/50"}`}>
                  {vibeEntry.status}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Highlights */}
        {profile.highlights && (
          <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-6">
            <h2 className="text-lg text-[var(--atlantic-navy)] mb-4">At a Glance</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--atlantic-navy)]/80">
                  <MapPin className="w-3.5 h-3.5 text-[var(--privet-green)] shrink-0 mt-0.5" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Vibe / Stephen's Take */}
        {vibeEntry && (
          <div className="bg-[var(--sandstone)] rounded-lg border-l-4 border-[var(--cedar-shingle)] p-6">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cedar-shingle)] font-sans">
                Stephen&apos;s Take
              </p>
              {(() => {
                const TrendIcon = trendIcons[vibeEntry.trend];
                const cfg = statusConfig[vibeEntry.status];
                return (
                  <span className={`flex items-center gap-1 text-xs font-semibold ${cfg?.color ?? ""}`}>
                    {vibeEntry.status} <TrendIcon className="w-3 h-3" />
                  </span>
                );
              })()}
            </div>
            <p className="text-sm text-[var(--atlantic-navy)]/80 leading-relaxed italic">
              &ldquo;{vibeEntry.note}&rdquo;
            </p>
            <p className="text-xs text-[var(--nantucket-gray)] mt-2">
              Week of {new Date(vibe.weekOf + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        )}

        {/* Zoning Highlights — supports multiple districts */}
        {districts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg text-[var(--atlantic-navy)]">
              Zoning Districts{districts.length > 1 ? ` (${districts.length})` : ""}
            </h2>
            {districts.map((d: any) => (
              <div key={d.code} className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-6">
                <h3 className="text-sm font-bold text-[var(--atlantic-navy)] font-sans mb-3">
                  {d.code} — {d.name}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-4">
                  <div className="flex items-start gap-2">
                    <Ruler className="w-4 h-4 text-[var(--nantucket-gray)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-[var(--nantucket-gray)] font-sans">Min Lot Size</p>
                      <p className="font-semibold text-[var(--atlantic-navy)]">{d.minLotSize}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <TreePine className="w-4 h-4 text-[var(--nantucket-gray)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-[var(--nantucket-gray)] font-sans">Max Ground Cover</p>
                      <p className="font-semibold text-[var(--atlantic-navy)]">{d.maxGroundCover}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-[var(--nantucket-gray)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-[var(--nantucket-gray)] font-sans">HDC Scrutiny</p>
                      <p className="font-semibold text-[var(--atlantic-navy)]">{d.hdcScrutiny}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--nantucket-gray)] font-sans">Max Height</p>
                    <p className="font-semibold text-[var(--atlantic-navy)]">{d.maxHeight}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--nantucket-gray)] font-sans">Setbacks (F/S/R)</p>
                    <p className="font-semibold text-[var(--atlantic-navy)]">{d.frontSetback} / {d.sideSetback} / {d.rearSetback}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-[var(--nantucket-gray)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-[var(--nantucket-gray)] font-sans">Permit Timeline</p>
                      <p className="font-semibold text-[var(--atlantic-navy)]">{d.typicalPermitLag}</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[var(--atlantic-navy)]/60 border-t border-[var(--cedar-shingle)]/10 pt-3">
                  {d.notes}
                </p>
              </div>
            ))}
            <Link href="/regulatory/zoning-lookup" className="text-xs text-[var(--privet-green)] hover:underline">
              Look up zoning for a specific address &rarr;
            </Link>
          </div>
        )}

        {/* Shoreline & Micro-Climate (coastal only) */}
        {profile.shoreline && (
          <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Waves className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg text-[var(--atlantic-navy)]">Shoreline &amp; Micro-Climate</h2>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                profile.shoreline.status === "Critical" ? "bg-red-100 text-red-700" :
                profile.shoreline.status === "Active" ? "bg-amber-100 text-amber-700" :
                profile.shoreline.status === "Moderate" ? "bg-blue-100 text-blue-700" :
                "bg-green-100 text-green-700"
              }`}>
                {profile.shoreline.status}
              </span>
              <span className="text-xs text-[var(--nantucket-gray)]">
                Updated {profile.shoreline.lastUpdated}
              </span>
            </div>
            <p className="text-sm text-[var(--atlantic-navy)]/80 leading-relaxed">
              {profile.shoreline.concerns}
            </p>
          </div>
        )}

        {/* What's Happening */}
        <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-[var(--cedar-shingle)]" />
            <h2 className="text-lg text-[var(--atlantic-navy)]">What&apos;s Happening</h2>
          </div>
          <p className="text-sm text-[var(--atlantic-navy)]/80 leading-relaxed">
            {profile.whatsHappening}
          </p>
        </div>

        {/* CTA */}
        <div className="bg-[var(--atlantic-navy)] rounded-lg p-6 sm:p-8 text-center">
          <h3 className="text-white text-lg mb-2 font-serif">
            Interested in {name}?
          </h3>
          <p className="text-white/60 text-sm mb-5">
            Get custom neighborhood comps, off-market opportunities, or a development feasibility read.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/opportunities/wanted-to-buy"
              className="inline-block bg-[var(--privet-green)] text-white px-6 py-3 text-sm font-medium rounded-md hover:bg-[var(--privet-green)]/90 transition-colors"
            >
              Submit Buying Criteria
            </Link>
            <a
              href="https://calendly.com/stephen-maury/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white/10 text-white px-6 py-3 text-sm font-medium rounded-md hover:bg-white/20 transition-colors"
            >
              Talk to Stephen
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
