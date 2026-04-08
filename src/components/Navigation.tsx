"use client";

import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navPillars, standaloneNavItems } from "@/lib/navigation";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [openPillar, setOpenPillar] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#e8e8e8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0" onClick={() => setIsOpen(false)}>
            <Image
              src="/Nantucket Houses_Master_logo.png"
              alt="Nantucket Houses"
              width={160}
              height={42}
              priority
              className="h-10 lg:h-12 w-auto"
            />
          </Link>

          {/* Desktop: 4 Pillar Dropdowns + Standalone Links + CTA */}
          <div className="hidden lg:flex items-center gap-1">
            {navPillars.map((pillar) => (
              <div key={pillar.label} className="relative group">
                <button className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--atlantic-navy)] hover:text-[var(--privet-green)] rounded-md hover:bg-[var(--sandstone)]/50 transition-colors">
                  {pillar.label}
                  <ChevronDown className="w-3 h-3 opacity-50 transition-transform group-hover:rotate-180" />
                </button>

                {/* Dropdown */}
                <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white rounded-lg border border-[#e8e8e8] shadow-lg p-2 min-w-[260px]">
                    {pillar.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block px-3 py-2.5 rounded-md text-sm transition-colors ${
                          pathname === item.href
                            ? "text-[var(--privet-green)] bg-[var(--sandstone)]"
                            : "text-[var(--atlantic-navy)] hover:bg-[var(--sandstone)]/60"
                        }`}
                      >
                        <span className="font-medium">{item.label}</span>
                        {item.description && (
                          <span className="block text-xs text-[var(--nantucket-gray)] mt-0.5">
                            {item.description}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Standalone links */}
            {standaloneNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  pathname === item.href
                    ? "text-[var(--privet-green)] bg-[var(--sandstone)]"
                    : "text-[var(--atlantic-navy)] hover:text-[var(--privet-green)] hover:bg-[var(--sandstone)]/50"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* CTA */}
            <a
              href="https://calendly.com/stephen-maury/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 bg-[var(--privet-green)] text-white px-5 py-2 text-sm font-medium rounded-md hover:bg-[var(--privet-green)]/90 transition-colors"
            >
              Talk to Stephen
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-[var(--atlantic-navy)]"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div className="lg:hidden border-t border-[#e8e8e8] bg-white max-h-[80vh] overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-3">
            {/* Collapsible Pillars */}
            {navPillars.map((pillar) => (
              <div key={pillar.label} className="border-b border-[#e8e8e8] last:border-b-0">
                <button
                  onClick={() =>
                    setOpenPillar(openPillar === pillar.label ? null : pillar.label)
                  }
                  className="flex items-center justify-between w-full px-3 py-3 text-sm font-semibold text-[var(--atlantic-navy)]"
                >
                  {pillar.label}
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--nantucket-gray)] transition-transform ${
                      openPillar === pillar.label ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openPillar === pillar.label && (
                  <div className="pb-2 pl-3">
                    {pillar.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="block px-3 py-2 text-sm text-[var(--atlantic-navy)]/80 hover:text-[var(--privet-green)] rounded-md"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Standalone */}
            {standaloneNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-3 text-sm font-semibold text-[var(--atlantic-navy)] border-b border-[#e8e8e8]"
              >
                {item.label}
              </Link>
            ))}

            {/* CTA */}
            <div className="pt-3">
              <a
                href="https://calendly.com/stephen-maury/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-[var(--privet-green)] text-white px-5 py-3 text-sm font-medium rounded-md"
              >
                Talk to Stephen
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
