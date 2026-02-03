"use client";

import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { MarketStats } from "@/components/MarketStats";
import { LegacySection } from "@/components/LegacySection";
import { DeveloperEdge } from "@/components/DeveloperEdge";
import { CaseStudy } from "@/components/CaseStudy";
import { Services } from "@/components/Services";
import { Testimonials } from "@/components/Testimonials";
import { StrategicConsultation } from "@/components/StrategicConsultation";
import { MarketThinking } from "@/components/MarketThinking";
import { About } from "@/components/About";
import { ContactCTA } from "@/components/ContactCTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Navigation />
      <Hero />
      <MarketStats />
      <LegacySection />
      <DeveloperEdge />
      <CaseStudy />
      <Testimonials />
      <Services />
      <StrategicConsultation />
      <MarketThinking />
      <About />
      <ContactCTA />
      <Footer />
    </div>
  );
}
