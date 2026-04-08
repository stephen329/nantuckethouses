import Link from "next/link";
import { Home, MapPin, Users, ArrowRight, ExternalLink } from "lucide-react";
import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";

const projects = [
  {
    name: "Wake Drive (Completed)",
    type: "Ownership",
    units: 12,
    status: "Families moved in",
    description:
      "Twelve single-family homes built in partnership with qualifying Nantucket families. Each homeowner contributed sweat equity alongside HFHN volunteers. These homes are deed-restricted to remain affordable in perpetuity.",
    highlights: ["12 affordable homes", "Sweat-equity model", "Deed-restricted permanently"],
  },
  {
    name: "Future Projects",
    type: "Planning",
    units: "TBD",
    status: "In development",
    description:
      "HFHN is actively working with the Town of Nantucket and community partners to identify sites for additional affordable homeownership opportunities. Stay tuned for announcements.",
    highlights: ["Site identification underway", "Community partnership model", "Focus on year-round families"],
  },
];

export default function HFHNProjectsPage() {
  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-10 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Affordable Housing", href: "/affordable-housing" },
              { label: "HFHN Projects" },
            ]}
          />
          <p
            className="text-xs uppercase tracking-[0.25em] font-semibold mb-2 font-sans"
            style={{ color: "#6dbd8b" }}
          >
            Habitat for Humanity Nantucket
          </p>
          <h1 className="text-white text-3xl sm:text-4xl">HFHN Projects</h1>
          <p className="text-white/50 mt-3 text-sm max-w-2xl leading-relaxed">
            Building affordable homes on Nantucket since 2003. Every HFHN home is built with
            volunteer labor and partner family sweat equity, and remains permanently affordable
            through deed restrictions.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Stephen's Role */}
        <div className="bg-[var(--privet-green)]/5 border border-[var(--privet-green)]/20 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--privet-green)]/20 flex items-center justify-center text-[var(--privet-green)] text-lg font-bold shrink-0">
              SM
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--atlantic-navy)]">Stephen Maury, President</p>
              <p className="text-xs text-[var(--nantucket-gray)] mb-2">Habitat for Humanity Nantucket</p>
              <p className="text-sm text-[var(--atlantic-navy)]/80 leading-relaxed">
                &ldquo;Every HFHN home keeps a Nantucket family on-island year-round. Our model works
                because families invest their own sweat equity alongside our volunteers — it builds
                community ownership from the ground up.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Projects */}
        {projects.map((project) => (
          <div
            key={project.name}
            className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Home className="w-5 h-5 text-[var(--privet-green)]" />
                <div>
                  <h2 className="text-lg font-sans font-semibold text-[var(--atlantic-navy)]">
                    {project.name}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-[var(--nantucket-gray)]">
                    <span>{project.type}</span>
                    <span>·</span>
                    <span>{project.units} units</span>
                    <span>·</span>
                    <span>{project.status}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-[var(--atlantic-navy)]/80 leading-relaxed mb-4">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {project.highlights.map((h) => (
                  <span
                    key={h}
                    className="text-xs bg-[var(--sandstone)] text-[var(--atlantic-navy)]/70 px-3 py-1 rounded-full"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* How HFHN Works */}
        <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-6">
          <h2 className="text-lg font-sans font-semibold text-[var(--atlantic-navy)] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--privet-green)]" />
            How the HFHN Model Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[var(--sandstone)] rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--privet-green)] mb-2 font-sans">
                1. Family Selection
              </p>
              <p className="text-sm text-[var(--atlantic-navy)]/80">
                Qualifying families apply through HFHN. Selection is based on need, ability to
                repay an affordable mortgage, and willingness to partner.
              </p>
            </div>
            <div className="bg-[var(--sandstone)] rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--privet-green)] mb-2 font-sans">
                2. Sweat Equity
              </p>
              <p className="text-sm text-[var(--atlantic-navy)]/80">
                Partner families invest hundreds of hours of their own labor building their home
                alongside HFHN volunteers and skilled tradespeople.
              </p>
            </div>
            <div className="bg-[var(--sandstone)] rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--privet-green)] mb-2 font-sans">
                3. Affordable Mortgage
              </p>
              <p className="text-sm text-[var(--atlantic-navy)]/80">
                Homeowners purchase at cost with a 0% interest mortgage. A deed restriction
                ensures the home remains affordable for future buyers.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <section className="bg-[var(--atlantic-navy)] rounded-lg p-8 text-center">
          <h2 className="text-white text-xl sm:text-2xl mb-3">Want to Get Involved?</h2>
          <p className="text-white/60 text-sm mb-6 max-w-xl mx-auto">
            Volunteer on a build, donate to support affordable housing, or learn how to apply
            for an HFHN home.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/affordable-housing/get-involved"
              className="inline-block bg-[var(--privet-green)] text-white px-6 py-3 text-sm font-medium rounded-md hover:bg-[var(--privet-green)]/90 transition-colors"
            >
              Get Involved <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <a
              href="https://habitatnantucket.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3 text-sm font-medium rounded-md hover:bg-white/20 transition-colors"
            >
              habitatnantucket.org <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
