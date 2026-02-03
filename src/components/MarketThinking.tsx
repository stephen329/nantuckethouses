import { ArrowRight } from 'lucide-react';

export function MarketThinking() {
  return (
    <section className="py-20 bg-[#FAF8F5]">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="border-l-4 border-[#C9A227] pl-8">
          <p className="text-sm uppercase tracking-wider text-[#C9A227] mb-4 font-medium">
            Current Market Thinking
          </p>
          <h2 className="text-2xl md:text-3xl text-[#1A2A3A] mb-6 leading-relaxed">
            Q1 2026: Inventory remains constrained, but buyer urgency has softened. This is creating opportunities for patient, well-positioned buyers—and risk for sellers who overprice.
          </h2>
          <p className="text-lg opacity-70 mb-8">
            The spread between asking price and final sale price has widened for the first time in three years. I'm advising clients to focus on properties that have been on market 90+ days where sellers may be more motivated.
          </p>
          
          {/* Case Study Teaser */}
          <div className="bg-white p-6 rounded-sm border border-[#D6C8B0] mb-8">
            <p className="text-sm uppercase tracking-wider opacity-50 mb-2">Recent Decision</p>
            <p className="text-[#1A2A3A] mb-4">
              <strong>Situation:</strong> Clients were considering a $4.2M waterfront property with significant deferred maintenance.
            </p>
            <p className="text-[#1A2A3A] mb-4">
              <strong>Decision:</strong> After detailed cost analysis, I recommended walking away—the true cost exceeded $5M.
            </p>
            <p className="text-[#1A2A3A]">
              <strong>Outcome:</strong> Three weeks later, we secured a comparable property for $3.8M with no hidden issues.
            </p>
          </div>

          <a href="#contact" className="inline-flex items-center gap-2 text-[#C9A227] hover:text-[#B89220] transition-colors font-medium">
            Discuss current market conditions
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
