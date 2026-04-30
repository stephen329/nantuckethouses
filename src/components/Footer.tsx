import Link from "next/link";
import Image from "next/image";
import { Instagram, Linkedin, Mail } from "lucide-react";
import { navPillars, standaloneNavItems } from "@/lib/navigation";
import { SCHEDULE_CALL_URL } from "@/lib/schedule-call-url";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--atlantic-navy)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Image
              src="/Nantucket Houses_Master_logo.png"
              alt="Nantucket Houses"
              width={160}
              height={42}
              className="h-10 w-auto brightness-0 invert mb-4"
            />
            <p className="text-sm text-white/60 leading-relaxed mb-6">
              Nantucket&apos;s premier real estate intelligence hub. Market data, regulatory insights,
              and neighborhood expertise — interpreted through local judgment.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/nantuckethouses"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md bg-white/10 hover:bg-[var(--privet-green)] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/stephenmaury"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md bg-white/10 hover:bg-[var(--privet-green)] transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="mailto:stephen@maury.net"
                className="p-2 rounded-md bg-white/10 hover:bg-[var(--privet-green)] transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation — Pillars */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4 font-sans">
              Navigate
            </h4>
            <ul className="space-y-2">
              {navPillars.map((pillar) => {
                const pillarHref = pillar.items[0]?.href ?? "/";
                return (
                  <li key={pillar.label}>
                    <Link
                      href={pillarHref}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {pillar.label}
                    </Link>
                  </li>
                );
              })}
              {standaloneNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4 font-sans">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/regulatory" className="text-sm text-white/70 hover:text-white transition-colors">
                  HDC Morning After
                </Link>
              </li>
              <li>
                <Link href="/build-renovate" className="text-sm text-white/70 hover:text-white transition-colors">
                  Cost Calculator
                </Link>
              </li>
              <li>
                <Link href="/regulatory" className="text-sm text-white/70 hover:text-white transition-colors">
                  Interactive Zoning Map
                </Link>
              </li>
              <li>
                <Link href="/market-pulse" className="text-sm text-white/70 hover:text-white transition-colors">
                  Market Reports
                </Link>
              </li>
              <li>
                <Link href="/articles" className="text-sm text-white/70 hover:text-white transition-colors">
                  Guides & How-Tos
                </Link>
              </li>
              <li>
                <Link href="/opportunities" className="text-sm text-white/70 hover:text-white transition-colors">
                  Off-Market & Opportunity Desk
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4 font-sans">
              Connect
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>Stephen Maury</li>
              <li>Congdon &amp; Coleman Real Estate</li>
              <li>
                <a href="tel:+15084510191" className="hover:text-white transition-colors">
                  (508) 451-0191
                </a>
              </li>
              <li>
                <a href="mailto:stephen@maury.net" className="hover:text-white transition-colors">
                  stephen@maury.net
                </a>
              </li>
            </ul>
            <a
              href={SCHEDULE_CALL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 bg-[var(--privet-green)] text-white px-5 py-2.5 text-sm font-medium rounded-md hover:bg-[var(--privet-green)]/90 transition-colors"
            >
              Schedule a Call
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <p>&copy; {currentYear} NantucketHouses.com. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
              <Link href="/disclaimer" className="hover:text-white/60 transition-colors">Disclaimer</Link>
            </div>
          </div>
          <p className="mt-4 text-xs text-white/30 max-w-3xl">
            Stephen Maury, Licensed Real Estate Broker. Congdon &amp; Coleman Real Estate, Est. 1931.
            Market data sourced from Nantucket MLS via Congdon &amp; Coleman. Statistics are calculated
            from transaction data and should not be relied upon as investment advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
