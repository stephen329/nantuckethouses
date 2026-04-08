import Link from "next/link";
import { ExternalLink, ArrowRight } from "lucide-react";
import type { Partner } from "@/types";

export function FeaturedPartnerBanner({ partner }: { partner: Partner }) {
  const isExternal = partner.ctaLink.startsWith("http");

  return (
    <div className="bg-[var(--privet-green)]/5 border border-[var(--privet-green)]/20 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 bg-[var(--privet-green)] px-6 py-2.5">
        <span className="text-white text-xs font-bold uppercase tracking-wider font-sans">
          Featured Partner
        </span>
        <span className="text-white/50 text-xs">|</span>
        <span className="text-white/80 text-xs font-sans">
          {partner.name}
        </span>
      </div>

      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-sans font-semibold text-[var(--atlantic-navy)] mb-2">
              {partner.tagline}
            </h3>
            <p className="text-sm text-[var(--atlantic-navy)]/70 leading-relaxed mb-4">
              {partner.description}
            </p>

            {partner.stephenNote && (
              <div className="bg-[var(--sandstone)] rounded-lg border-l-4 border-[var(--privet-green)] p-4 mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--privet-green)] mb-1.5 font-sans">
                  From Stephen
                </p>
                <p className="text-sm text-[var(--atlantic-navy)]/80 leading-relaxed italic">
                  &ldquo;{partner.stephenNote}&rdquo;
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {isExternal ? (
                <a
                  href={partner.ctaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--privet-green)] hover:underline"
                >
                  {partner.ctaText} <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <Link
                  href={partner.ctaLink}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--privet-green)] hover:underline"
                >
                  {partner.ctaText} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
              {partner.externalUrl && !isExternal && (
                <a
                  href={partner.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--nantucket-gray)] hover:text-[var(--atlantic-navy)]"
                >
                  {new URL(partner.externalUrl).hostname} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
