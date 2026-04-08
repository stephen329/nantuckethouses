import Link from "next/link";
import { Scale, Calculator, MapPin } from "lucide-react";

const teasers = [
  {
    title: "HDC Morning After",
    description:
      "Weekly 2-minute recaps of the Historic District Commission. What got approved, what got denied, and what it means for your project.",
    href: "/regulatory",
    icon: Scale,
    tag: "Regulatory",
  },
  {
    title: "Truth in Building Cost",
    description:
      "The only calculator built for Nantucket's reality — ferry surcharges, seasonal labor, and HDC complexity baked in.",
    href: "/build-renovate",
    icon: Calculator,
    tag: "Tools",
  },
  {
    title: "Neighborhood Intel",
    description:
      "Micro-climate updates, shoreline status, zoning highlights, and what's quietly changing block by block.",
    href: "/neighborhoods",
    icon: MapPin,
    tag: "Local",
  },
];

export function Teasers() {
  return (
    <section className="py-12 sm:py-16 bg-[var(--sandstone)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-[var(--cedar-shingle)] text-xs uppercase tracking-[0.25em] font-semibold mb-2 font-sans">
            Explore
          </p>
          <h2 className="text-[var(--atlantic-navy)]">Intelligence Hub</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {teasers.map((teaser) => (
            <Link
              key={teaser.href}
              href={teaser.href}
              className="group bg-white rounded-lg p-6 border border-[var(--cedar-shingle)]/10 hover:border-[var(--privet-green)]/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-md bg-[var(--atlantic-navy)]/5 group-hover:bg-[var(--privet-green)]/10 transition-colors">
                  <teaser.icon className="w-5 h-5 text-[var(--atlantic-navy)] group-hover:text-[var(--privet-green)] transition-colors" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--nantucket-gray)] font-sans">
                  {teaser.tag}
                </span>
              </div>
              <h3 className="text-lg text-[var(--atlantic-navy)] mb-2 group-hover:text-[var(--privet-green)] transition-colors">
                {teaser.title}
              </h3>
              <p className="text-sm text-[var(--nantucket-gray)] leading-relaxed">
                {teaser.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
