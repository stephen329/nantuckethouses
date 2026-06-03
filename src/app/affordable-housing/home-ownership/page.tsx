import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowUpRight, Building2, HandHeart, Home, Landmark, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Affordable & Workforce Home Ownership | NantucketHouses",
  description:
    "Homeownership pathways for year-round Nantucket residents, including Habitat for Humanity, Covenant Homes, Chapter 40B and Safe Harbor context, deed restriction options, and closing cost assistance.",
};

type ProgramSection = {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  summary: string;
  bullets: string[];
  milestones?: string[];
  futureDevelopment?: string[];
  ctaLabel: string;
  ctaHref: string;
};

const PROGRAM_SECTIONS: ProgramSection[] = [
  {
    id: "habitat-nantucket",
    title: "Habitat for Humanity Nantucket: Building for the Community",
    icon: HandHeart,
    summary:
      "Habitat for Humanity Nantucket builds homes for ownership in partnership with local families, volunteers, and donors. To ensure long-term community stability, all homes are deed-restricted, guaranteeing they remain affordable in perpetuity.",
    bullets: [
      "Founded in 2001 as an affiliate of Habitat for Humanity International.",
      "Uses volunteer labor and homeowner sweat equity to create year-round ownership opportunities.",
      "Welcomes participation from all backgrounds and focuses on expanding access to decent, affordable housing for the Nantucket workforce.",
      "This work is supported through broad community cooperation and meaningful funding from the Nantucket Affordable Housing Trust.",
    ],
    milestones: [
      "Upon completion of 6 new dwellings at 3, 5, and 7 Waitt Drive, Habitat for Humanity Nantucket will have created a total of 22 year-round homes on the island.",
    ],
    futureDevelopment: [
      "Project: 4 new two-bedroom homes.",
      "Timeline: Construction is projected to commence in summer 2026.",
    ],
    ctaLabel: "Visit Habitat for Humanity Nantucket",
    ctaHref: "https://www.habitatnantucket.org/",
  },
  {
    id: "covenant-program",
    title: "Nantucket Housing Needs Covenant Program",
    icon: Home,
    summary:
      "Housing Nantucket's Covenant Program creates permanently affordable homeownership opportunities for moderate-income year-round residents through capped resale pricing.",
    bullets: [
      "Program serves buyers generally up to 150% of median income and has created over 100 permanently affordable homes.",
      "Allows eligible owners to create and sell covenant-restricted dwellings at controlled pricing.",
      "2026 published figures include a max sales cap of $854,171, household income limit of $245,250, and asset cap of $427,085.",
    ],
    ctaLabel: "Review Covenant Homes details",
    ctaHref: "https://housingnantucket.org/covenant-homes/",
  },
  {
    id: "chapter-40b-safe-harbor",
    title: "Chapter 40B and Safe Harbor",
    icon: ShieldCheck,
    summary:
      "Massachusetts Chapter 40B sets a 10% affordable housing benchmark. Nantucket tracks this through its Subsidized Housing Inventory (SHI), with Safe Harbor progress tied to year-round housing production.",
    bullets: [
      "The Housing Department supports the Select Board's goal of creating and maintaining attainable year-round housing.",
      "Town-published SHI data reports 8.03% currently counted toward the 10% target.",
      "Official SHI counts and unit goals are updated with census-based state benchmarks.",
    ],
    ctaLabel: "See Housing Department 40B status",
    ctaHref: "https://www.nantucket-ma.gov/3180/Housing-Dept",
  },
  {
    id: "year-round-deed-restriction",
    title: "Year-Round Deed Restriction Program",
    icon: Building2,
    summary:
      "The Town's pilot deed restriction program provides financial incentives for owners who permanently restrict homes for year-round occupancy and affordability criteria.",
    bullets: [
      "Requires deed restrictions that limit sale/rental to year-round Nantucket households.",
      "Defines year-round residency as at least 10 months in any 12-month period.",
      "Current program guidance references eligibility up to 240% AMI with published household-size limits.",
    ],
    ctaLabel: "View Year-Round Deed Restriction program",
    ctaHref: "https://nantucket-ma.gov/3253/Year-round-Deed-Restriction-Pilot-Progra",
  },
  {
    id: "closing-cost-assistance",
    title: "Closing Cost Assistance Program (CCAP)",
    icon: Landmark,
    summary:
      "CCAP offers eligible buyers a zero-percent deferred loan to help cover closing costs for permanently deed-restricted units and increase attainable homeownership access.",
    bullets: [
      "Provides up to $15,000 toward bona fide closing costs, subject to funding availability.",
      "Applies to eligible buyers generally up to 175% AMI purchasing deed-restricted homes in Nantucket County.",
      "Structured as a subordinate 0% loan typically repaid at transfer, with potential waiver conditions after five years.",
    ],
    ctaLabel: "Open CCAP guidelines and application",
    ctaHref: "https://www.nantucket-ma.gov/2688/Closing-Cost-Assistance-Program---CCAP",
  },
];

export default function AffordableWorkforceHomeOwnershipPage() {
  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs uppercase tracking-[0.2em] text-white/65 font-semibold">Resources</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold">Affordable &amp; Workforce Home Ownership</h1>
          <p className="mt-4 text-sm sm:text-base text-white/80 max-w-3xl leading-relaxed">
            A practical guide to major Nantucket homeownership pathways for year-round residents. Use these programs as a starting
            point, then confirm current eligibility, deadlines, and documentation directly with each provider.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {PROGRAM_SECTIONS.map((section) => (
              <Link
                key={section.id}
                href={`#${section.id}`}
                className="inline-flex items-center rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors"
              >
                {section.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {PROGRAM_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <section
              key={section.id}
              id={section.id}
              className="bg-white rounded-lg border border-[var(--cedar-shingle)]/20 p-6 sm:p-7 scroll-mt-24"
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center rounded-md bg-[var(--privet-green)]/10 p-2">
                  <Icon className="w-5 h-5 text-[var(--privet-green)]" />
                </span>
                <div>
                  <h2 className="text-xl text-[var(--atlantic-navy)] font-semibold">{section.title}</h2>
                  <p className="mt-2 text-sm text-[var(--atlantic-navy)]/80 leading-relaxed">{section.summary}</p>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
                    {bullet}
                  </li>
                ))}
              </ul>

              {section.milestones && (
                <div className="mt-5 rounded-md border border-[var(--cedar-shingle)]/20 bg-[var(--sandstone)]/55 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/65">Recent Milestones</p>
                  <ul className="mt-2 space-y-2">
                    {section.milestones.map((milestone) => (
                      <li key={milestone} className="text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
                        {milestone}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {section.futureDevelopment && (
                <div className="mt-4 rounded-md border border-[var(--cedar-shingle)]/20 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/65">Future Development</p>
                  <ul className="mt-2 space-y-2">
                    {section.futureDevelopment.map((item) => (
                      <li key={item} className="text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <a
                href={section.ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--privet-green)] hover:underline"
              >
                {section.ctaLabel}
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </section>
          );
        })}

        <section className="rounded-lg border border-[var(--cedar-shingle)]/20 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/70">
            Explore Related Housing Resources
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/affordable-housing/year-round-rentals"
              className="inline-flex items-center rounded-full border border-[var(--cedar-shingle)]/30 px-3 py-1.5 text-xs font-medium text-[var(--atlantic-navy)] hover:text-[var(--privet-green)] hover:border-[var(--privet-green)]/40 transition-colors"
            >
              Year-Round Rentals
            </Link>
            <Link
              href="/affordable-housing/adus"
              className="inline-flex items-center rounded-full border border-[var(--cedar-shingle)]/30 px-3 py-1.5 text-xs font-medium text-[var(--atlantic-navy)] hover:text-[var(--privet-green)] hover:border-[var(--privet-green)]/40 transition-colors"
            >
              Accessory Dwelling Units (ADUs)
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--cedar-shingle)]/20 bg-[var(--sandstone)] p-5">
          <p className="text-xs text-[var(--nantucket-gray)] leading-relaxed">
            Information on this page is based on public and provided materials from Habitat for Humanity Nantucket, Housing Nantucket
            and the Town of Nantucket. Since requirements and timelines can change, confirm current details directly with each
            official program source.
          </p>
        </section>
      </main>
    </div>
  );
}
