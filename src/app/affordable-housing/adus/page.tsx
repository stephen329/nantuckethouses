import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Building2, ClipboardCheck, Hammer, Home, Ruler } from "lucide-react";

export const metadata: Metadata = {
  title: "Accessory Dwelling Units (ADUs) | NantucketHouses",
  description:
    "Essential guidance for Nantucket property owners considering an Accessory Dwelling Unit (ADU), including zoning rights, permitting context, construction paths, and projected cost ranges.",
};

const KEY_FACTS = [
  {
    label: "Placement",
    detail:
      "ADUs can be attached to an existing home (including basement or garage conversions) or built as a detached structure on the same lot.",
  },
  {
    label: "Size Limits",
    detail:
      "Current guidance allows up to 900 square feet of living area, or 50% of the principal dwelling size, whichever is greater.",
  },
  {
    label: "Living Capacity",
    detail:
      "The size allowance can typically support a comfortable two-bedroom, two-bath layout for small families or roommates.",
  },
  {
    label: "Zoning Rights",
    detail:
      "ADUs are permitted by right in zoning districts where a primary dwelling is permitted by right.",
  },
];

export default function AdusPage() {
  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs uppercase tracking-[0.2em] text-white/65 font-semibold">Resources</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold">Accessory Dwelling Units (ADUs)</h1>
          <p className="mt-4 text-sm sm:text-base text-white/80 max-w-3xl leading-relaxed">
            This page provides essential information for property owners considering the addition of an Accessory Dwelling Unit (ADU)
            to their Nantucket property, a key strategy in expanding the island&apos;s year-round housing inventory.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="#definition-history" className="inline-flex items-center rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors">
              Definition &amp; History
            </Link>
            <Link href="#key-facts" className="inline-flex items-center rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors">
              Key Facts
            </Link>
            <Link href="#building-on-nantucket" className="inline-flex items-center rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors">
              Building on Nantucket
            </Link>
            <Link href="#projected-costs" className="inline-flex items-center rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors">
              Projected Costs
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <section id="definition-history" className="bg-white rounded-lg border border-[var(--cedar-shingle)]/20 p-6 sm:p-7 scroll-mt-24">
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center rounded-md bg-[var(--privet-green)]/10 p-2">
              <Home className="w-5 h-5 text-[var(--privet-green)]" />
            </span>
            <div>
              <h2 className="text-xl text-[var(--atlantic-navy)] font-semibold">What is an Accessory Dwelling Unit (ADU)?</h2>
              <h3 className="mt-3 text-sm uppercase tracking-wider text-[var(--nantucket-gray)] font-semibold">Definition and History</h3>
              <p className="mt-2 text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
                An ADU is a self-contained housing unit located within or attached to a single-family home, or built as a detached
                structure on the same lot.
              </p>
              <p className="mt-3 text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
                Historically, these units, often called in-law suites or granny flats, were constrained by local zoning complexity.
                Following the Affordable Homes Act (2024), Massachusetts expanded rights for owners to build ADUs and recognized them
                as an important tool for flexible housing for seniors, young professionals, and local families.
              </p>
            </div>
          </div>
        </section>

        <section id="key-facts" className="bg-white rounded-lg border border-[var(--cedar-shingle)]/20 p-6 sm:p-7 scroll-mt-24">
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center rounded-md bg-[var(--privet-green)]/10 p-2">
              <Ruler className="w-5 h-5 text-[var(--privet-green)]" />
            </span>
            <div>
              <h2 className="text-xl text-[var(--atlantic-navy)] font-semibold">Key Facts and Specifications</h2>
              <p className="mt-2 text-sm text-[var(--atlantic-navy)]/80 leading-relaxed">
                On Nantucket, ADUs are a versatile way to add living space while maintaining neighborhood character.
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {KEY_FACTS.map((item) => (
              <div key={item.label} className="rounded-md border border-[var(--cedar-shingle)]/20 bg-[var(--sandstone)]/55 p-4">
                <h3 className="text-sm font-semibold text-[var(--atlantic-navy)]">{item.label}</h3>
                <p className="mt-1.5 text-sm text-[var(--atlantic-navy)]/80 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="building-on-nantucket" className="bg-white rounded-lg border border-[var(--cedar-shingle)]/20 p-6 sm:p-7 scroll-mt-24">
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center rounded-md bg-[var(--privet-green)]/10 p-2">
              <ClipboardCheck className="w-5 h-5 text-[var(--privet-green)]" />
            </span>
            <div>
              <h2 className="text-xl text-[var(--atlantic-navy)] font-semibold">Building an ADU on Nantucket</h2>
              <p className="mt-2 text-sm text-[var(--atlantic-navy)]/80 leading-relaxed">
                Constructing an ADU on-island requires careful planning and a clear understanding of Nantucket&apos;s regulatory and
                logistical context.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-md border border-[var(--cedar-shingle)]/20 p-4">
              <h3 className="text-sm font-semibold text-[var(--atlantic-navy)]">The Approval Process</h3>
              <p className="mt-1.5 text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
                Exterior construction requires Historic District Commission (HDC) review. The HDC process ensures ADUs align with
                island architectural standards and historic character.
              </p>
            </div>

            <div className="rounded-md border border-[var(--cedar-shingle)]/20 p-4">
              <h3 className="text-sm font-semibold text-[var(--atlantic-navy)]">Navigating Construction Options</h3>
              <ul className="mt-2 space-y-2">
                <li className="text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
                  Prefab challenge: off-island prefab can appear lower-cost at first, but HDC-compliant exterior adjustments can add
                  significant expense beyond base pricing.
                </li>
                <li className="text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
                  Local advantage: experienced island builders and design teams are often faster through approvals and logistics because
                  they work with HDC standards and Nantucket construction constraints daily.
                </li>
              </ul>
              <a
                href="https://mauryassociates.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--privet-green)] hover:underline"
              >
                Maury Associates
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        <section id="projected-costs" className="bg-white rounded-lg border border-[var(--cedar-shingle)]/20 p-6 sm:p-7 scroll-mt-24">
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center rounded-md bg-[var(--privet-green)]/10 p-2">
              <Hammer className="w-5 h-5 text-[var(--privet-green)]" />
            </span>
            <div>
              <h2 className="text-xl text-[var(--atlantic-navy)] font-semibold">Projected Costs</h2>
              <p className="mt-2 text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
                Recent local ranges indicate completed two-bedroom ADU projects typically fall between
                <span className="font-semibold text-[var(--atlantic-navy)]"> $450,000 and $700,000</span>, depending on finishes, site
                work, and utility connections.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--cedar-shingle)]/20 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/70">
            Explore Related Housing Resources
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/affordable-housing/home-ownership"
              className="inline-flex items-center rounded-full border border-[var(--cedar-shingle)]/30 px-3 py-1.5 text-xs font-medium text-[var(--atlantic-navy)] hover:text-[var(--privet-green)] hover:border-[var(--privet-green)]/40 transition-colors"
            >
              Affordable &amp; Workforce Home Ownership
            </Link>
            <Link
              href="/affordable-housing/year-round-rentals"
              className="inline-flex items-center rounded-full border border-[var(--cedar-shingle)]/30 px-3 py-1.5 text-xs font-medium text-[var(--atlantic-navy)] hover:text-[var(--privet-green)] hover:border-[var(--privet-green)]/40 transition-colors"
            >
              Year-Round Rentals
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--cedar-shingle)]/20 bg-[var(--sandstone)] p-5">
          <p className="text-xs text-[var(--nantucket-gray)] leading-relaxed">
            Information on this page is based on public and provided materials about Massachusetts ADU policy and Nantucket
            development conditions. Since regulations and cost assumptions can change, confirm current details with official municipal
            sources and your project team before proceeding.
          </p>
        </section>
      </main>
    </div>
  );
}
