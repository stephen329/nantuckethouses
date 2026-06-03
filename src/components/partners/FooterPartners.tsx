import Link from "next/link";
import type { Partner } from "@/types";

export function FooterPartners({ partners }: { partners: Partner[] }) {
  return (
    <div className="border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-xs text-white/40 font-sans font-semibold uppercase tracking-wider mb-3">
          Our Partners
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {partners.map((p) => {
            const isExternal = p.ctaLink.startsWith("http");
            return isExternal ? (
              <a
                key={p.id}
                href={p.ctaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {p.name}
              </a>
            ) : (
              <Link
                key={p.id}
                href={p.ctaLink}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {p.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
