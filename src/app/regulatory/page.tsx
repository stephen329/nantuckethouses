import Link from "next/link";
import { Calendar, Scale, MapPin, FileText, Search, Download } from "lucide-react";
import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";
import { RecapCard } from "@/components/regulatory/RecapCard";
import { BoardWatch } from "@/components/home/BoardWatch";
import { getBoardWatchData } from "@/lib/board-watch";
import { getLatestPost, listPosts } from "@/lib/content";

const quickLinks = [
  { label: "HDC Morning After", description: "Weekly 2-minute recaps", href: "/regulatory/hdc-morning-after", icon: Scale },
  { label: "Planning Board", description: "Summaries and highlights", href: "/regulatory/planning-board", icon: Calendar },
  { label: "Zoning Board", description: "Appeals and decisions", href: "/regulatory/zoning-board", icon: FileText },
  { label: "Property Map", description: "Rentals, parcels, and zoning", href: "/map", icon: Search },
  { label: "Cheat Sheets", description: "Downloadable guides", href: "/regulatory/cheat-sheets", icon: Download },
  { label: "Zoning Map", description: "Interactive district overlay", href: "/regulatory/zoning-map", icon: MapPin },
];

export default async function RegulatoryHubPage() {
  const latestHdc = getLatestPost("hdc-morning-after");
  const latestPlanning = getLatestPost("planning-board");
  const latestZba = getLatestPost("zoning-board");
  const boardWatchData = await getBoardWatchData();

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      {/* Header */}
      <section className="bg-[var(--atlantic-navy)] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Regulatory Hub" }]} />
          <p className="text-[var(--cedar-shingle)] text-xs uppercase tracking-[0.25em] font-semibold mb-2 font-sans" style={{ color: "#a89080" }}>
            Your Strongest Resource
          </p>
          <h1 className="text-white text-3xl sm:text-4xl">Regulatory Hub</h1>
          <p className="text-white/50 mt-2 text-sm max-w-2xl">
            Board meeting recaps, zoning intelligence, and regulatory cheat sheets.
            Everything developers, architects, and homeowners need to navigate
            Nantucket&apos;s unique approval landscape.
          </p>
        </div>
      </section>

      {/* Board Watch */}
      <BoardWatch data={boardWatchData} />

      {/* Latest Recaps */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl text-[var(--atlantic-navy)] mb-6">
            Latest Board Recaps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {latestHdc && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cedar-shingle)] mb-2 font-sans">
                  HDC Morning After
                </p>
                <RecapCard post={latestHdc} basePath="/regulatory/hdc-morning-after" />
              </div>
            )}
            {latestPlanning && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cedar-shingle)] mb-2 font-sans">
                  Planning Board
                </p>
                <RecapCard post={latestPlanning} basePath="/regulatory/planning-board" />
              </div>
            )}
            {latestZba && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cedar-shingle)] mb-2 font-sans">
                  Zoning Board
                </p>
                <RecapCard post={latestZba} basePath="/regulatory/zoning-board" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Links Grid */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl text-[var(--atlantic-navy)] mb-6">
            Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-start gap-4 bg-[var(--sandstone)] rounded-lg p-5 border border-[var(--cedar-shingle)]/10 hover:border-[var(--privet-green)]/30 hover:shadow-md transition-all"
              >
                <div className="p-2 rounded-md bg-[var(--atlantic-navy)]/5 group-hover:bg-[var(--privet-green)]/10 transition-colors shrink-0">
                  <link.icon className="w-5 h-5 text-[var(--atlantic-navy)] group-hover:text-[var(--privet-green)] transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[var(--atlantic-navy)] group-hover:text-[var(--privet-green)] transition-colors">
                    {link.label}
                  </p>
                  <p className="text-xs text-[var(--nantucket-gray)] mt-0.5">
                    {link.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-[var(--atlantic-navy)]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-white text-2xl mb-3">Need a Feasibility Assessment?</h2>
          <p className="text-white/60 text-sm mb-6">
            Before you file with any board, get a straight read on your project&apos;s
            viability — zoning constraints, HDC likelihood, and timeline expectations.
          </p>
          <a
            href="https://calendly.com/stephen-maury/gut-check"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[var(--privet-green)] text-white px-8 py-3 text-sm font-medium rounded-md hover:bg-[var(--privet-green)]/90 transition-colors"
          >
            Project Feasibility Gut Check
          </a>
        </div>
      </section>
    </div>
  );
}
