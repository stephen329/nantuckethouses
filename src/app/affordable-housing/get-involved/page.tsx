import Link from "next/link";
import { Hammer, Heart, Home, Mail, ExternalLink } from "lucide-react";
import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";

const ways = [
  {
    icon: Hammer,
    title: "Volunteer on a Build",
    description:
      "No construction experience needed. HFHN organizes build days where community members work alongside partner families and skilled tradespeople. It's one of the most rewarding ways to spend a Saturday on Nantucket.",
    cta: "Sign up for the next build day",
    href: "https://habitatnantucket.org/volunteer",
    external: true,
  },
  {
    icon: Heart,
    title: "Donate",
    description:
      "Every dollar goes directly to building affordable homes on Nantucket. HFHN keeps overhead low and impact high. Donations fund materials, land acquisition, and program operations.",
    cta: "Make a donation",
    href: "https://habitatnantucket.org/donate",
    external: true,
  },
  {
    icon: Home,
    title: "Apply for a Home",
    description:
      "HFHN partners with qualifying Nantucket families to build affordable homes through a sweat-equity model. If you're a year-round resident struggling with housing costs, you may qualify.",
    cta: "Learn about eligibility",
    href: "https://habitatnantucket.org/apply",
    external: true,
  },
  {
    icon: Mail,
    title: "Connect with Stephen",
    description:
      "As President of HFHN and a licensed real estate broker, Stephen can help you navigate affordable housing programs, connect with the right resources, or explore workforce housing opportunities.",
    cta: "Submit to Opportunity Desk",
    href: "/opportunities?category=workforce-housing",
    external: false,
  },
];

export default function GetInvolvedPage() {
  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-10 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Affordable Housing", href: "/affordable-housing" },
              { label: "Get Involved" },
            ]}
          />
          <p
            className="text-xs uppercase tracking-[0.25em] font-semibold mb-2 font-sans"
            style={{ color: "#6dbd8b" }}
          >
            Habitat for Humanity Nantucket
          </p>
          <h1 className="text-white text-3xl sm:text-4xl">Get Involved</h1>
          <p className="text-white/50 mt-3 text-sm max-w-2xl leading-relaxed">
            Affordable housing on Nantucket takes a village. Whether you can swing a hammer,
            write a check, or need a home — there&apos;s a place for you.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Stephen's message */}
        <div className="bg-[var(--privet-green)]/5 border border-[var(--privet-green)]/20 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--privet-green)]/20 flex items-center justify-center text-[var(--privet-green)] text-lg font-bold shrink-0">
              SM
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--atlantic-navy)]">A Note from Stephen</p>
              <p className="text-xs text-[var(--nantucket-gray)] mb-2">President, Habitat for Humanity Nantucket</p>
              <p className="text-sm text-[var(--atlantic-navy)]/80 leading-relaxed">
                &ldquo;Housing is the foundation of everything on Nantucket — our schools, our businesses,
                our community. When we lose a family to the housing crisis, we lose a teacher, a
                firefighter, a small business owner. HFHN exists to make sure that doesn&apos;t happen.
                I&apos;d love your help.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Ways to get involved */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {ways.map((way) => (
            <div
              key={way.title}
              className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-6 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--privet-green)]/10 flex items-center justify-center">
                  <way.icon className="w-5 h-5 text-[var(--privet-green)]" />
                </div>
                <h2 className="text-lg font-sans font-semibold text-[var(--atlantic-navy)]">
                  {way.title}
                </h2>
              </div>
              <p className="text-sm text-[var(--atlantic-navy)]/70 leading-relaxed mb-4 flex-1">
                {way.description}
              </p>
              {way.external ? (
                <a
                  href={way.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--privet-green)] hover:underline"
                >
                  {way.cta} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <Link
                  href={way.href}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--privet-green)] hover:underline"
                >
                  {way.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <section className="bg-[var(--atlantic-navy)] rounded-lg p-8 text-center">
          <h2 className="text-white text-xl sm:text-2xl mb-3">Questions About Affordable Housing?</h2>
          <p className="text-white/60 text-sm mb-6 max-w-xl mx-auto">
            Stephen works at the intersection of real estate and affordable housing every day.
            Reach out through the Opportunity Desk or schedule a call.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/opportunities?category=workforce-housing"
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
      </div>
    </div>
  );
}
