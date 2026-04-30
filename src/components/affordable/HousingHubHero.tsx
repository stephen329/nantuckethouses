import Link from "next/link";
import { ArrowDown, Heart } from "lucide-react";
import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";

export function HousingHubHero() {
  return (
    <section className="bg-[var(--atlantic-navy)] py-12 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Affordable Housing" }]} />

        <p
          className="text-xs uppercase tracking-[0.25em] font-semibold mb-3 font-sans flex items-center gap-2"
          style={{ color: "#6dbd8b" }}
        >
          <Heart className="w-3.5 h-3.5" />
          Live Intelligence
        </p>

        <h1 className="text-white text-3xl sm:text-5xl leading-tight">
          Nantucket&apos;s Affordable Housing
          <br />
          Intelligence Hub
        </h1>

        <p className="text-white/50 mt-4 text-sm sm:text-base max-w-2xl leading-relaxed">
          Safe Harbor status, Covenant Program limits, landlord incentives, and the development
          pipeline — everything developers, year-rounders, and employers need to know, tracked in
          real time.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--privet-green)]/20 flex items-center justify-center text-white text-sm font-bold">
            SM
          </div>
          <div>
            <p className="text-white text-sm font-medium">
              Curated by Stephen Maury
            </p>
            <p className="text-white/40 text-xs">
              President, Habitat for Humanity Nantucket
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <a
            href="#safe-harbor"
            className="inline-flex items-center justify-center gap-2 bg-[var(--privet-green)] text-white px-6 py-3 text-sm font-medium rounded-md hover:bg-[var(--privet-green)]/90 transition-colors"
          >
            Explore Programs <ArrowDown className="w-4 h-4" />
          </a>
          <Link
            href="/affordable-housing/get-involved"
            className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-6 py-3 text-sm font-medium rounded-md hover:bg-white/20 transition-colors"
          >
            Get Involved with HFHN
          </Link>
        </div>
      </div>
    </section>
  );
}
