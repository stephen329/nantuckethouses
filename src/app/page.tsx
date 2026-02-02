"use client";

import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { MarketStats } from "@/components/MarketStats";
import { Services } from "@/components/Services";
import { FeaturedProperties } from "@/components/FeaturedProperties";
import { Testimonials } from "@/components/Testimonials";
import { About } from "@/components/About";
import { ContactCTA } from "@/components/ContactCTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <MarketStats />
      <Services />
      <FeaturedProperties />
      <Testimonials />
      <About />
      <ContactCTA />
      <Footer />
    </div>
  );
}
