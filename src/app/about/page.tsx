import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Eye, Handshake, Landmark, ShieldCheck, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About | NantucketHouses.com",
  description:
    "Learn about Stephen Maury, Congdon & Coleman Real Estate, and the NantucketHouses.com market intelligence platform.",
  keywords:
    "Stephen Maury Nantucket, Congdon & Coleman Real Estate, Nantucket real estate expert, Nantucket market intelligence",
  alternates: {
    canonical: "/about",
  },
};

const stats = [
  { label: "Year Congdon & Coleman was established", value: "1931" },
  { label: "Years of active Nantucket real estate experience", value: "20+" },
  { label: "Residential development volume led", value: "$X Million" },
  { label: "Years on Nantucket Finance Committee", value: "11+" },
  { label: "Successful transactions across all tiers", value: "Hundreds" },
];

const differentiators = [
  {
    title: "Insight Over Information",
    icon: Eye,
    body:
      "We do not just scrape data. We scrub, contextualize, and interpret it using real-time MLS feeds, development cost intelligence, and on-island relationships.",
  },
  {
    title: "Access Over Visibility",
    icon: Handshake,
    body:
      "Off-market opportunities, Whale Watch signals, and pre-listing intelligence are surfaced through this platform and the Congdon & Coleman network.",
  },
  {
    title: "Community Over Commission",
    icon: Users,
    body:
      "Stewardship means protecting Nantucket's long-term vitality through civic engagement and attainable housing efforts, not only short-term transactions.",
  },
];

export default function AboutPage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        name: "Stephen Maury",
        jobTitle: "Owner and Principal Broker",
        url: "https://nantuckethouses.com/about",
        worksFor: { "@id": "https://nantuckethouses.com/#congdon-coleman" },
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://nantuckethouses.com/#congdon-coleman",
        name: "Congdon & Coleman Real Estate",
        foundingDate: "1931",
        url: "https://nantuckethouses.com",
      },
      {
        "@type": "RealEstateAgent",
        name: "Stephen Maury",
        url: "https://nantuckethouses.com/about",
        areaServed: "Nantucket, Massachusetts",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <section className="bg-[var(--atlantic-navy)] py-14 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <p className="text-white/60 text-xs uppercase tracking-[0.25em] font-semibold mb-3 font-sans">
            About
          </p>
          <h1 className="text-white text-3xl sm:text-5xl max-w-4xl">
            Decades of Perspective. Every Angle of the Island.
          </h1>
          <p className="text-white/70 mt-4 text-sm sm:text-base max-w-3xl leading-relaxed">
            NantucketHouses.com is the island&apos;s premier real estate intelligence platform
            powered by the century-old brokerage expertise of Congdon &amp; Coleman Real Estate
            (est. 1931) and the boots-on-the-ground perspective of lifelong Nantucketer
            Stephen Maury.
          </p>
          <a
            href="https://calendly.com/stephen-maury/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex mt-6 brand-btn brand-btn-primary px-6 py-3 text-sm"
          >
            Connect with Stephen
          </a>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-[var(--atlantic-navy)] text-2xl mb-4">The Nantucket Standard</h2>
          <p className="text-[var(--atlantic-navy)]/80 text-sm sm:text-base leading-relaxed">
            NantucketHouses.com was created to bring unprecedented transparency to one of
            America&apos;s most exclusive and complex real estate markets. While other platforms
            deliver raw data, we deliver context, insight, and access — the true Nantucket
            Premium. Every trend, statistic, and opportunity on this site is interpreted through
            deep local knowledge, active development experience, and town-level fiscal
            understanding.
          </p>
        </div>
      </section>

      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-[var(--atlantic-navy)] text-2xl mb-5">
            Stephen Maury - Steward of a Century-Old Legacy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="brand-surface p-5 min-h-[160px]">
              <p className="text-xs uppercase tracking-wider text-[var(--nantucket-gray)] font-sans mb-2">
                Historic Legacy
              </p>
              <div className="h-[100px] rounded-md bg-[var(--sandstone)] border border-[var(--cedar-shingle)]/15 flex items-center justify-center text-xs text-[var(--nantucket-gray)]">
                Historic Congdon &amp; Coleman / Maury archival visual
              </div>
            </div>
            <div className="brand-surface p-5 min-h-[160px]">
              <p className="text-xs uppercase tracking-wider text-[var(--nantucket-gray)] font-sans mb-2">
                Modern Development
              </p>
              <div className="h-[100px] rounded-md bg-[var(--sandstone)] border border-[var(--cedar-shingle)]/15 flex items-center justify-center text-xs text-[var(--nantucket-gray)]">
                Grey Lady Lane or current development visual
              </div>
            </div>
          </div>
          <div className="brand-surface p-6">
            <p className="text-[var(--atlantic-navy)]/80 text-sm sm:text-base leading-relaxed">
              A lifelong Nantucket resident and 2002 graduate of Nantucket High School, Stephen
              Maury represents the rare intersection of Old Nantucket tradition and modern market
              intelligence. His grandparents founded Maury Real Estate (now Maury People
              Sotheby&apos;s). His father, Larry Maury, was a prominent general contractor and
              developer whose projects helped shape neighborhoods across the island.
            </p>
            <p className="text-[var(--atlantic-navy)]/80 text-sm sm:text-base leading-relaxed mt-4">
              Stephen carries both legacies forward as Owner and Principal Broker of Congdon &amp;
              Coleman Real Estate, established in 1931. Beyond brokerage, he leads residential
              development through Nantucket Woodland LP and has served on the Town of Nantucket
              Finance Committee since 2014. He has also been actively involved with Habitat for
              Humanity Nantucket, supporting attainable housing initiatives that strengthen the
              island&apos;s long-term vitality.
            </p>
            <p className="text-[var(--atlantic-navy)]/80 text-sm sm:text-base leading-relaxed mt-4">
              This complete ecosystem — building, governing, transacting, and giving back — gives
              Stephen a 360-degree view of the Nantucket market that no algorithm or off-island
              platform can replicate.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-[var(--atlantic-navy)] text-2xl mb-5">By the Numbers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((item) => (
              <div key={item.label} className="brand-surface p-5">
                <p className="text-2xl text-[var(--atlantic-navy)]">{item.value}</p>
                <p className="text-xs text-[var(--nantucket-gray)] mt-2 leading-relaxed">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-[var(--atlantic-navy)] text-2xl mb-5">Transparency is the New Luxury</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {differentiators.map((item) => (
              <div key={item.title} className="brand-surface p-5">
                <div className="flex items-center gap-2 mb-3">
                  <item.icon className="w-4 h-4 text-[var(--privet-green)]" />
                  <h3 className="text-[var(--atlantic-navy)] text-lg">{item.title}</h3>
                </div>
                <p className="text-sm text-[var(--atlantic-navy)]/80 leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[var(--atlantic-navy)] rounded-lg p-6 sm:p-8 text-white">
            <h2 className="text-2xl sm:text-3xl mb-2">
              Ready to navigate Nantucket&apos;s market with confidence?
            </h2>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <Link
                href="/market-pulse"
                className="inline-flex items-center justify-center brand-btn brand-btn-primary px-5 py-2.5 text-sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View the Current Market Pulse
              </Link>
              <Link
                href="/opportunities/wanted-to-buy"
                className="inline-flex items-center justify-center bg-white/10 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-white/20 transition-colors"
              >
                <Landmark className="w-4 h-4 mr-2" />
                Request a Custom Valuation Report
              </Link>
              <a
                href="https://calendly.com/stephen-maury/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-white/10 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-white/20 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Schedule a Conversation with Stephen
              </a>
            </div>
          </div>

          <p className="text-xs text-[var(--nantucket-gray)] mt-4">
            NantucketHouses.com is the independent digital intelligence platform powered by the
            brokerage expertise and local network of Congdon &amp; Coleman Real Estate.
          </p>
        </div>
      </section>
    </div>
  );
}
