"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { Partner } from "@/types";

function PartnerCard({ partner }: { partner: Partner }) {
  const isExternal = partner.ctaLink.startsWith("http");

  return (
    <div className="bg-white rounded-lg p-6 border border-[var(--cedar-shingle)]/10 hover:border-[var(--privet-green)]/30 hover:shadow-md transition-all h-full flex flex-col">
      <h3 className="text-lg text-[var(--atlantic-navy)] font-sans font-semibold mb-2">
        {partner.name}
      </h3>
      <p className="text-sm text-[var(--nantucket-gray)] leading-relaxed flex-1">
        {partner.tagline}
      </p>
      {isExternal ? (
        <a
          href={partner.ctaLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-sm text-[var(--privet-green)] font-medium hover:underline inline-flex items-center gap-1"
        >
          {partner.ctaText} <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <Link
          href={partner.ctaLink}
          className="mt-4 text-sm text-[var(--privet-green)] font-medium hover:underline inline-flex items-center gap-1"
        >
          {partner.ctaText} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

export function PartnersCarousel({ partners }: { partners: Partner[] }) {
  return (
    <section className="py-12 sm:py-16 bg-[var(--sandstone)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-[var(--cedar-shingle)] text-xs uppercase tracking-[0.25em] font-semibold mb-2 font-sans">
          Partners & Initiatives
        </p>
        <h2 className="text-[var(--atlantic-navy)] text-2xl sm:text-3xl font-serif">
          Working Together for Nantucket
        </h2>

        {/* Desktop: grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-4 lg:gap-6 mt-8">
          {partners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>

        {/* Mobile: carousel */}
        <div className="md:hidden mt-8">
          <Carousel opts={{ align: "start" }}>
            <CarouselContent>
              {partners.map((partner) => (
                <CarouselItem key={partner.id} className="basis-[85%]">
                  <PartnerCard partner={partner} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
}
