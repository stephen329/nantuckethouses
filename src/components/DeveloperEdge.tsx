import { ArrowRight } from 'lucide-react';

export function DeveloperEdge() {
  return (
    <section className="py-24 bg-[#1A2A3A]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[#C9A227] text-sm uppercase tracking-[0.3em] mb-4 font-medium">
            Development Advisory
          </p>
          <h2 className="text-white text-4xl md:text-5xl mb-6 tracking-tight">
            The Developer's Edge
          </h2>
        </div>

        {/* Hero Pitch */}
        <div className="max-w-4xl mx-auto mb-16">
          <blockquote className="text-white/90 text-xl md:text-2xl leading-relaxed text-center font-light italic">
            "Owning the island's longest-standing brokerage gives me the history; developing its most complex sites gives me the edge. I don't just find Nantucket homes—I navigate the legal, technical, and social landscape required to create them."
          </blockquote>
        </div>

        {/* Value Propositions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          {/* Regulatory Navigation - Highlighted */}
          <div className="bg-white/5 backdrop-blur-sm p-8 rounded-sm border border-[#C9A227]/30">
            <p className="text-[#C9A227] text-sm uppercase tracking-wider font-medium mb-4">
              Regulatory Navigation
            </p>
            <div className="mb-6">
              <p className="text-white text-4xl font-light mb-1">15+</p>
              <p className="text-white/60 text-sm">Years preparing client and personal projects for town review</p>
            </div>
            <ul className="space-y-3 text-white/70 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#C9A227] mt-1">•</span>
                Planning Board presentations
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C9A227] mt-1">•</span>
                Historic District Commission reviews
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C9A227] mt-1">•</span>
                Conservation Commission approvals
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C9A227] mt-1">•</span>
                Zoning Board of Appeals hearings
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C9A227] mt-1">•</span>
                12 years Finance Committee fiscal oversight
              </li>
            </ul>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-8 rounded-sm border border-white/10">
            <p className="text-[#C9A227] text-sm uppercase tracking-wider font-medium mb-4">
              Vetted Professionals
            </p>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              Instant access to the island's top attorneys, engineers, surveyors, and architects—professionals I've worked with across dozens of complex projects.
            </p>
            <p className="text-white/50 text-sm italic">
              The right team, assembled before you need them.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-8 rounded-sm border border-white/10">
            <p className="text-[#C9A227] text-sm uppercase tracking-wider font-medium mb-4">
              Hidden Potential
            </p>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              I identify value in complex sites that others overlook or avoid—from subdivision opportunities to brownfield conversions.
            </p>
            <p className="text-white/50 text-sm italic">
              The best deals rarely look like deals at first.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a href="https://calendly.com/stephen-maury/30min" target="_blank" rel="noopener noreferrer" className="bg-[#C9A227] text-[#1A2A3A] px-10 py-5 rounded-md hover:bg-[#B89220] transition-colors inline-flex items-center gap-3 group text-lg font-medium">
            <span>Consult on Project Feasibility</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <p className="text-white/40 text-sm mt-4">
            For developers, investors, and landowners navigating complex Nantucket projects.
          </p>
        </div>
      </div>
    </section>
  );
}
