import Link from "next/link";
import { Shield, DollarSign, Home, Building, Users, ArrowRight, Calculator } from "lucide-react";
import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";
import housingData from "@/data/affordable-housing.json";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function AffordableHousingPage() {
  const d = housingData;

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      {/* Hero */}
      <section className="bg-[var(--atlantic-navy)] py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Affordable Housing" }]} />
          <p className="text-xs uppercase tracking-[0.25em] font-semibold mb-2 font-sans" style={{ color: "#6dbd8b" }}>
            Live Intelligence
          </p>
          <h1 className="text-white text-3xl sm:text-4xl">Affordable &amp; Workforce Housing</h1>
          <p className="text-white/50 mt-3 text-sm max-w-2xl leading-relaxed">
            Nantucket&apos;s most critical issue, tracked in real time. Safe Harbor status, Covenant Program limits,
            landlord incentives, and the development pipeline — everything developers, year-rounders, and employers need to know.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* ─── Safe Harbor Status ──────────────────────────────── */}
        <section id="safe-harbor">
          <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 overflow-hidden">
            <div className="bg-[var(--privet-green)] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-white" />
                <h2 className="text-white text-lg font-sans font-semibold">Safe Harbor Status</h2>
              </div>
              <span className="bg-white/20 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                {d.safeHarbor.status}
              </span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-xs text-[var(--nantucket-gray)] font-sans">Protected Through</p>
                  <p className="text-lg font-semibold text-[var(--atlantic-navy)]">{d.safeHarbor.expiresDate}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--nantucket-gray)] font-sans">Current SHI</p>
                  <p className="text-lg font-semibold text-[var(--atlantic-navy)]">{d.safeHarbor.currentShi}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--nantucket-gray)] font-sans">Previous SHI</p>
                  <p className="text-lg font-semibold text-[var(--nantucket-gray)]">{d.safeHarbor.previousShi}</p>
                </div>
              </div>
              <p className="text-xs text-[var(--atlantic-navy)]/60 mb-4">
                Key projects: {d.safeHarbor.keyProjects}
              </p>
              <div className="bg-[var(--sandstone)] rounded-lg border-l-4 border-[var(--cedar-shingle)] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cedar-shingle)] mb-2 font-sans">
                  Stephen&apos;s Take
                </p>
                <p className="text-sm text-[var(--atlantic-navy)]/80 leading-relaxed">
                  {d.safeHarbor.stephensTake}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Covenant Program ────────────────────────────────── */}
        <section id="covenant">
          <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-6">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-5 h-5 text-[var(--privet-green)]" />
              <h2 className="text-lg text-[var(--atlantic-navy)] font-sans font-semibold">
                {d.covenantProgram.year} Covenant Program Limits
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-[var(--sandstone)] rounded-lg p-4">
                <p className="text-xs text-[var(--nantucket-gray)] font-sans">Max Sales Price</p>
                <p className="text-xl font-serif text-[var(--atlantic-navy)]">{formatCurrency(d.covenantProgram.maxSalesPrice)}</p>
              </div>
              <div className="bg-[var(--sandstone)] rounded-lg p-4">
                <p className="text-xs text-[var(--nantucket-gray)] font-sans">Income Limit</p>
                <p className="text-xl font-serif text-[var(--atlantic-navy)]">{formatCurrency(d.covenantProgram.householdIncomeLimit)}</p>
              </div>
              <div className="bg-[var(--sandstone)] rounded-lg p-4">
                <p className="text-xs text-[var(--nantucket-gray)] font-sans">Asset Limit</p>
                <p className="text-xl font-serif text-[var(--atlantic-navy)]">{formatCurrency(d.covenantProgram.assetLimit)}</p>
              </div>
              <div className="bg-[var(--sandstone)] rounded-lg p-4">
                <p className="text-xs text-[var(--nantucket-gray)] font-sans">Median Family Income</p>
                <p className="text-xl font-serif text-[var(--atlantic-navy)]">{formatCurrency(d.covenantProgram.medianFamilyIncome)}</p>
              </div>
            </div>
            <p className="text-xs text-[var(--atlantic-navy)]/60">{d.covenantProgram.note}</p>
            <div className="mt-4 pt-4 border-t border-[var(--cedar-shingle)]/10">
              <Link href="/opportunities/for-sale" className="text-sm text-[var(--privet-green)] font-medium hover:underline flex items-center gap-1">
                Own a lot with a second dwelling? Run a &ldquo;Covenant Lot&rdquo; feasibility study <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Lease to Locals ─────────────────────────────────── */}
        <section id="lease-to-locals">
          <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Home className="w-5 h-5 text-[var(--privet-green)]" />
              <div>
                <h2 className="text-lg text-[var(--atlantic-navy)] font-sans font-semibold">Lease to Locals Pilot</h2>
                <p className="text-xs text-[var(--nantucket-gray)]">Updated {d.leaseToLocals.lastUpdated}</p>
              </div>
            </div>
            <p className="text-sm text-[var(--atlantic-navy)]/80 mb-4 leading-relaxed">
              The town is offering cash incentives to landlords who convert short-term rentals to year-round leases.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-[var(--privet-green)]/5 rounded-lg p-4 border border-[var(--privet-green)]/15">
                <p className="text-xs text-[var(--privet-green)] font-semibold font-sans">Incentive</p>
                <p className="text-2xl font-serif text-[var(--atlantic-navy)]">Up to {formatCurrency(d.leaseToLocals.maxIncentive)}</p>
                <p className="text-xs text-[var(--nantucket-gray)]">for a {d.leaseToLocals.unitType} unit</p>
              </div>
              <div className="bg-[var(--sandstone)] rounded-lg p-4">
                <p className="text-xs text-[var(--nantucket-gray)] font-semibold font-sans mb-2">2026 Rent Caps</p>
                {Object.entries(d.leaseToLocals.rentCaps).map(([unit, rent]) => (
                  <div key={unit} className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[var(--atlantic-navy)]/70">{unit}</span>
                    <span className="font-semibold text-[var(--atlantic-navy)]">{formatCurrency(rent as number)}/mo</span>
                  </div>
                ))}
              </div>
            </div>
            <Link href="/opportunities/for-rent" className="text-sm text-[var(--privet-green)] font-medium hover:underline flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5" /> Calculate your &ldquo;Lease to Locals&rdquo; payout — is your unit eligible?
            </Link>
          </div>
        </section>

        {/* ─── Project Pipeline ─────────────────────────────────── */}
        <section id="pipeline">
          <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Building className="w-5 h-5 text-[var(--privet-green)]" />
              <h2 className="text-lg text-[var(--atlantic-navy)] font-sans font-semibold">Active Project Pipeline</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--cedar-shingle)]/10">
                    <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">Project</th>
                    <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">Type</th>
                    <th className="text-center py-2 text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">Units</th>
                    <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">Status (April 2026)</th>
                  </tr>
                </thead>
                <tbody>
                  {d.projectPipeline.map((p) => (
                    <tr key={p.project} className="border-b border-[var(--cedar-shingle)]/5">
                      <td className="py-3 font-semibold text-[var(--atlantic-navy)]">{p.project}</td>
                      <td className="py-3 text-[var(--nantucket-gray)]">{p.type}</td>
                      <td className="py-3 text-center text-[var(--atlantic-navy)]">{p.units}</td>
                      <td className="py-3 text-[var(--atlantic-navy)]/80">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── Housing Tiers ───────────────────────────────────── */}
        <section>
          <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-[var(--privet-green)]" />
              <h2 className="text-lg text-[var(--atlantic-navy)] font-sans font-semibold">Nantucket Housing Tiers (2026)</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {d.housingTiers.map((tier) => (
                <div key={tier.tier} className="bg-[var(--sandstone)] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[var(--atlantic-navy)] font-sans">{tier.tier}</span>
                    <span className="text-xs text-[var(--nantucket-gray)]">{tier.label}</span>
                  </div>
                  <p className="text-lg font-serif text-[var(--atlantic-navy)]">{tier.income}</p>
                  <p className="text-xs text-[var(--atlantic-navy)]/60 mt-1">{tier.typical}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─────────────────────────────────────────────── */}
        <section className="bg-[var(--atlantic-navy)] rounded-lg p-8 text-center">
          <h2 className="text-white text-xl sm:text-2xl mb-3">Have a Workforce Housing Question?</h2>
          <p className="text-white/60 text-sm mb-6 max-w-xl mx-auto">
            Whether you&apos;re a developer exploring Friendly 40B, a landlord considering Lease to Locals,
            or a year-rounder navigating the Covenant Program — Stephen can help.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/opportunities"
              className="inline-block bg-[var(--privet-green)] text-white px-6 py-3 text-sm font-medium rounded-md hover:bg-[var(--privet-green)]/90 transition-colors"
            >
              Submit to Opportunity Desk
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
        </section>

        {/* Source */}
        <p className="text-xs text-[var(--nantucket-gray)] text-center">
          Data sourced from Town of Nantucket Housing Office, HUD 2026 income guidelines, and public meeting records.
          Updated {d.updatedAt}. For official program details, contact the Nantucket Housing Authority.
        </p>
      </div>
    </div>
  );
}
