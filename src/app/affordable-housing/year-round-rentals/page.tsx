import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Building2, Home, KeyRound, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Year-Round Rentals | NantucketHouses",
  description:
    "An overview of Nantucket's year-round rental market and key support programs: Housing Nantucket Affordable Rentals, Lease to Locals, and Rental Preservation (Rooted Renters).",
};

const CRISIS_POINTS = [
  {
    title: "Dwindling Supply",
    body: "Since 2015, Nantucket has lost over 200 year-round rental units, even as the population continues to grow.",
  },
  {
    title: "Soaring Costs",
    body: "Median rent has increased by more than 70% since 2017. A household would now need an income of roughly $1.4 million to purchase a median-priced home, making long-term renting the only viable option for much of the workforce.",
  },
  {
    title: "Widespread Burden",
    body: "Approximately 44% of island households are cost-burdened (spending more than 30% of income on housing), and 15% of renter households are living in overcrowded conditions that exceed state sanitary codes.",
  },
  {
    title: "The Gap",
    body: "There is an estimated shortage of nearly 1,000 year-round rental units needed to meet current demand and stabilize the community.",
  },
];

export default function YearRoundRentalsPage() {
  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs uppercase tracking-[0.2em] text-white/65 font-semibold">Resources</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold">Year-Round Rentals</h1>
          <p className="mt-4 text-sm sm:text-base text-white/80 max-w-3xl leading-relaxed">
            This page provides a comprehensive overview of the current rental landscape on Nantucket and the specific programs
            available to help year-round residents find and maintain stable housing.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="#rental-crisis" className="inline-flex items-center rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors">
              Rental Crisis
            </Link>
            <Link href="#housing-nantucket-rentals" className="inline-flex items-center rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors">
              Housing Nantucket
            </Link>
            <Link href="#lease-to-locals" className="inline-flex items-center rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors">
              Lease to Locals
            </Link>
            <Link href="#rooted-renters" className="inline-flex items-center rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition-colors">
              Rooted Renters
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <section id="rental-crisis" className="bg-white rounded-lg border border-[var(--cedar-shingle)]/20 p-6 sm:p-7 scroll-mt-24">
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center rounded-md bg-[var(--privet-green)]/10 p-2">
              <Shield className="w-5 h-5 text-[var(--privet-green)]" />
            </span>
            <div>
              <h2 className="text-xl text-[var(--atlantic-navy)] font-semibold">The Nantucket Rental Crisis: A Community at a Crossroads</h2>
              <p className="mt-2 text-sm text-[var(--atlantic-navy)]/80 leading-relaxed">
                According to the 2024 Housing Needs Assessment, Nantucket&apos;s housing crisis has reached unprecedented levels,
                threatening the stability of the island&apos;s year-round community.
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CRISIS_POINTS.map((point) => (
              <div key={point.title} className="rounded-md border border-[var(--cedar-shingle)]/20 bg-[var(--sandstone)]/55 p-4">
                <h3 className="text-sm font-semibold text-[var(--atlantic-navy)]">{point.title}</h3>
                <p className="mt-1.5 text-sm text-[var(--atlantic-navy)]/80 leading-relaxed">{point.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-[var(--atlantic-navy)]/80 leading-relaxed">
            In response to these challenges, the organizations and programs below provide essential support for year-round renters.
          </p>
        </section>

        <section id="housing-nantucket-rentals" className="bg-white rounded-lg border border-[var(--cedar-shingle)]/20 p-6 sm:p-7 scroll-mt-24">
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center rounded-md bg-[var(--privet-green)]/10 p-2">
              <Home className="w-5 h-5 text-[var(--privet-green)]" />
            </span>
            <div>
              <h2 className="text-xl text-[var(--atlantic-navy)] font-semibold">Housing Nantucket: Affordable Rental Program</h2>
              <p className="mt-2 text-sm text-[var(--atlantic-navy)]/80 leading-relaxed">
                Housing Nantucket manages scattered-site rental units across the island, ranging from studios to four-bedroom homes.
                These units are reserved for the island&apos;s low-to-middle-income workforce.
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            <li className="text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
              Eligibility: units are generally available to residents earning between 50% and 150% of Area Median Income (AMI).
            </li>
            <li className="text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
              Ready-to-Rent list: applicants are not selected strictly first-come, first-served; placements are balanced by income
              bracket to preserve portfolio-wide affordability.
            </li>
            <li className="text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
              Deed restrictions: units are deed-restricted to remain affordable in perpetuity.
            </li>
            <li className="text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
              How to apply: complete a formal rental application to be placed on the Ready-to-Rent list.
            </li>
          </ul>
          <a
            href="https://housingnantucket.org/affordable-rentals/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--privet-green)] hover:underline"
          >
            Housing Nantucket Rental Program
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </section>

        <section id="lease-to-locals" className="bg-white rounded-lg border border-[var(--cedar-shingle)]/20 p-6 sm:p-7 scroll-mt-24">
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center rounded-md bg-[var(--privet-green)]/10 p-2">
              <KeyRound className="w-5 h-5 text-[var(--privet-green)]" />
            </span>
            <div>
              <h2 className="text-xl text-[var(--atlantic-navy)] font-semibold">Lease to Locals (Placemate)</h2>
              <p className="mt-2 text-sm text-[var(--atlantic-navy)]/80 leading-relaxed">
                Lease to Locals, funded by the Nantucket Affordable Housing Trust and administered with Placemate, provides financial
                incentives to property owners who convert short-term rentals or vacant space into year-round housing.
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            <li className="text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
              For renters: at least half of adults in a household must be Qualified Tenants, usually year-round workers (30+ hours
              weekly for a Nantucket employer) or other qualifying local residents.
            </li>
            <li className="text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
              Impact: the program creates new year-round inventory by shifting homes away from the vacation rental market.
            </li>
          </ul>
          <div className="mt-4 rounded-md border border-[var(--cedar-shingle)]/20 bg-[var(--sandstone)]/55 p-4">
            <h3 className="text-sm font-semibold text-[var(--atlantic-navy)]">Tenant Rent Caps</h3>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <p className="text-sm text-[var(--atlantic-navy)]/85">1 Bedroom: $2,700/mo</p>
              <p className="text-sm text-[var(--atlantic-navy)]/85">2 Bedroom: $3,500/mo</p>
              <p className="text-sm text-[var(--atlantic-navy)]/85">3+ Bedroom: $4,000/mo</p>
            </div>
          </div>
          <a
            href="https://placemate.com/nantucket/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--privet-green)] hover:underline"
          >
            Lease to Locals Nantucket
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </section>

        <section id="rooted-renters" className="bg-white rounded-lg border border-[var(--cedar-shingle)]/20 p-6 sm:p-7 scroll-mt-24">
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center rounded-md bg-[var(--privet-green)]/10 p-2">
              <Building2 className="w-5 h-5 text-[var(--privet-green)]" />
            </span>
            <div>
              <h2 className="text-xl text-[var(--atlantic-navy)] font-semibold">Rental Preservation Program (Rooted Renters)</h2>
              <p className="mt-2 text-sm text-[var(--atlantic-navy)]/80 leading-relaxed">
                The Rental Preservation Program, often called Rooted Renters, is a pilot initiative focused on preventing the loss of
                existing year-round rentals by supporting landlords who already rent affordably to local tenants.
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            <li className="text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
              Goal: stabilize current rental supply with incentives up to $18,000 over three years.
            </li>
            <li className="text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
              Tenant protection: participating landlords commit to a 3-year year-round rental period and capped annual rent increases
              (typically 3%) to keep units attainable for current tenants.
            </li>
            <li className="text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
              Focus: supports accidental landlords and long-term owners who want to keep local tenants in place despite rising costs.
            </li>
          </ul>
          <a
            href="https://nantucket-ma.gov/3830/Rental-Preservation-Program"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--privet-green)] hover:underline"
          >
            Nantucket Rental Preservation Program
            <ArrowUpRight className="w-4 h-4" />
          </a>
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
              href="/affordable-housing/adus"
              className="inline-flex items-center rounded-full border border-[var(--cedar-shingle)]/30 px-3 py-1.5 text-xs font-medium text-[var(--atlantic-navy)] hover:text-[var(--privet-green)] hover:border-[var(--privet-green)]/40 transition-colors"
            >
              Accessory Dwelling Units (ADUs)
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--cedar-shingle)]/20 bg-[var(--sandstone)] p-5">
          <p className="text-xs text-[var(--nantucket-gray)] leading-relaxed">
            Information on this page is based on public and provided materials from Housing Nantucket, Placemate, and the Town of
            Nantucket. Since program requirements and availability can change, confirm current details directly with each official
            source.
          </p>
        </section>
      </main>
    </div>
  );
}
