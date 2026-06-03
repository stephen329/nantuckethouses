import Link from "next/link";
import { ArrowRight, Compass, Hammer, Home, MapPinned } from "lucide-react";
import { BoardWatch } from "@/components/home/BoardWatch";
import { getBoardWatchData } from "@/lib/board-watch";

const resourceCards = [
  {
    title: "Regulatory",
    description:
      "Track HDC, Planning Board, and Zoning Board updates with practical tools and quick-reference guides.",
    icon: Compass,
    links: [
      { label: "HDC Morning After", href: "/regulatory/hdc-morning-after" },
      { label: "Planning Board Updates", href: "/regulatory/planning-board" },
      { label: "Zoning Board Updates", href: "/regulatory/zoning-board" },
      { label: "Regulatory Cheat Sheets", href: "/regulatory/cheat-sheets" },
    ],
  },
  {
    title: "Housing & Community",
    description:
      "Navigate affordable and workforce housing programs, project pipeline updates, and community opportunities.",
    icon: Home,
    links: [
      { label: "Affordable Housing Hub", href: "/affordable-housing" },
      { label: "HFHN Projects", href: "/affordable-housing/hfhn-projects" },
      { label: "Safe Harbor + Covenant + Lease-to-Locals", href: "/affordable-housing" },
      { label: "Workforce Housing", href: "/opportunities/workforce-housing" },
    ],
  },
  {
    title: "Build & Renovate",
    description:
      "Construction planning resources, cost guidance, and case studies for Nantucket owners and investors.",
    icon: Hammer,
    links: [
      { label: "Cost Calculator (Coming Soon)" },
      { label: "Building Costs & Guides", href: "/build-renovate" },
      { label: "Local Case Studies", href: "/build-renovate" },
    ],
  },
];

export default async function ResourcesPage() {
  const boardWatchData = await getBoardWatchData();

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.25em] font-semibold text-white/60 mb-2 font-sans">
            Resources
          </p>
          <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl">
            Your Nantucket Regulatory &amp; Construction Command Center
          </h1>
          <p className="text-white/60 mt-3 text-sm sm:text-base max-w-3xl">
            Practical tools and live updates for decisions that require precision:
            permitting, zoning, development feasibility, and housing programs.
          </p>
        </div>
      </section>

      <BoardWatch data={boardWatchData} />

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resourceCards.map((card) => (
              <div key={card.title} className="brand-surface p-6">
                <div className="flex items-center gap-2 mb-3">
                  <card.icon className="w-4 h-4 text-[var(--privet-green)]" />
                  <h2 className="text-lg text-[var(--atlantic-navy)]">{card.title}</h2>
                </div>
                <p className="text-sm text-[var(--nantucket-gray)] leading-relaxed mb-4">
                  {card.description}
                </p>
                <div className="space-y-2">
                  {card.links.map((link) =>
                    link.href ? (
                      <Link
                        key={`${card.title}-${link.href}-${link.label}`}
                        href={link.href}
                        className="flex items-center justify-between text-sm text-[var(--atlantic-navy)] hover:text-[var(--privet-green)] transition-colors"
                      >
                        <span>{link.label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <div
                        key={`${card.title}-nolink-${link.label}`}
                        className="flex items-center justify-between text-sm text-[var(--privet-green)] font-semibold"
                      >
                        <span>{link.label}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="brand-surface p-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPinned className="w-4 h-4 text-[var(--privet-green)]" />
              <h3 className="text-xl text-[var(--atlantic-navy)]">Interactive Zoning Tools</h3>
            </div>
            <p className="text-sm text-[var(--nantucket-gray)] leading-relaxed mb-4">
              Search by address and jump directly into zoning lookup workflows for quick feasibility checks.
            </p>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 brand-btn brand-btn-secondary px-5 py-2.5 text-sm"
            >
              Open Zoning Tools
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="brand-surface p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cedar-shingle)] mb-2 font-sans">
              Coming Soon
            </p>
            <h3 className="text-xl text-[var(--atlantic-navy)] mb-3">Cost Calculator Beta</h3>
            <p className="text-sm text-[var(--nantucket-gray)] leading-relaxed mb-4">
              Join early access for a Nantucket-specific build and renovation calculator with local assumptions.
            </p>
            <a
              href="mailto:stephen@maury.net?subject=Cost%20Calculator%20Beta%20Early%20Access"
              className="inline-flex items-center gap-2 brand-btn brand-btn-primary px-5 py-2.5 text-sm"
            >
              Join Early Access
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
