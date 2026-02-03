import { ArrowRight } from 'lucide-react';

export function CaseStudy() {
  return (
    <section className="py-24 bg-[#FAF8F5]">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[#C9A227] text-sm uppercase tracking-[0.3em] mb-4 font-medium">
            Strategic Case Study
          </p>
          <h2 className="text-[#1A2A3A] text-3xl md:text-4xl mb-4 tracking-tight">
            Stewardship and Adaptive Planning
          </h2>
          <p className="text-xl opacity-70 max-w-2xl mx-auto">
            Navigating complex estate recovery and the future of island housing.
          </p>
        </div>

        {/* Timeline Layout */}
        <div className="bg-white border border-[#D6C8B0] rounded-sm overflow-hidden">
          
          {/* Phase 1: Environmental Restoration */}
          <div className="p-8 md:p-10 border-b border-[#E8E8E8]">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-48 flex-shrink-0">
                <div className="inline-block bg-[#1A2A3A] px-4 py-2 rounded-sm mb-2">
                  <p className="text-[#C9A227] text-xs uppercase tracking-wider font-medium">Phase 1</p>
                </div>
                <p className="text-[#1A2A3A] font-medium">Environmental Restoration</p>
              </div>
              <div className="flex-1">
                <h4 className="text-[#1A2A3A] text-lg font-medium mb-3">The Recovery</h4>
                <p className="text-[#1A2A3A]/70 leading-relaxed">
                  Managing a multi-year family estate, I oversaw the acquisition and environmental restoration of a 5-acre site. By coordinating with the island's leading contractors—including excavation specialists, environmental engineers, and site remediation teams—we cleared years of heavy machinery and structures, returning the land to a developable state ahead of schedule and under budget.
                </p>
              </div>
            </div>
          </div>

          {/* Phase 2: Community Engagement */}
          <div className="p-8 md:p-10 border-b border-[#E8E8E8] bg-[#FAF8F5]/50">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-48 flex-shrink-0">
                <div className="inline-block bg-[#1A2A3A] px-4 py-2 rounded-sm mb-2">
                  <p className="text-[#C9A227] text-xs uppercase tracking-wider font-medium">Phase 2</p>
                </div>
                <p className="text-[#1A2A3A] font-medium">Community Engagement</p>
              </div>
              <div className="flex-1">
                <h4 className="text-[#1A2A3A] text-lg font-medium mb-3">The Civic Dialogue</h4>
                <p className="text-[#1A2A3A]/70 leading-relaxed">
                  Recognizing the island's housing crisis, I proposed an ambitious 36-home workforce neighborhood. Despite failing to secure a 2/3 majority at Town Meeting, this process was vital for understanding neighbor concerns regarding density and character preservation. The dialogue shaped a more refined approach.
                </p>
              </div>
            </div>
          </div>

          {/* Phase 3: Elder Housing Innovation */}
          <div className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-48 flex-shrink-0">
                <div className="inline-block bg-[#C9A227] px-4 py-2 rounded-sm mb-2">
                  <p className="text-[#1A2A3A] text-xs uppercase tracking-wider font-medium">Phase 3</p>
                </div>
                <p className="text-[#1A2A3A] font-medium">Elder Housing Innovation</p>
                <p className="text-[#C9A227] text-sm mt-1 italic">Current Mission</p>
              </div>
              <div className="flex-1">
                <h4 className="text-[#1A2A3A] text-lg font-medium mb-3">The Current Path</h4>
                <p className="text-[#1A2A3A]/70 leading-relaxed">
                  Today, I am pioneering the first development under the island's Elder Housing Bylaw. By dedicating 3 acres to freestanding homes for residents 55+, we are addressing a critical demographic gap while seeking collaborative, zoning-compliant uses for the remaining 2 acres.
                </p>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="bg-[#1A2A3A] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/70 text-center md:text-left">
              Have a complex site or regulatory challenge?
            </p>
            <a 
              href="#contact" 
              className="inline-flex items-center gap-2 text-[#C9A227] hover:text-[#B89220] transition-colors font-medium group"
            >
              Discuss Your Project
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* Site Context */}
        <div className="mt-8 text-center">
          <p className="text-sm opacity-50 italic">
            5-acre site · Mid-Island zone · Active development
          </p>
        </div>
      </div>
    </section>
  );
}
