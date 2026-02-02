import { AlertCircle, Clock, FileText, Waves } from 'lucide-react';

export function ISLNewCause() {
  const frictions = [
    {
      icon: Clock,
      title: '18-Month Contractor Lead Times',
      description: 'Buyers see a beautiful home, but imagine the stress of coordinating renovations from off-island.'
    },
    {
      icon: FileText,
      title: '2026 Short-Term Rental Regulations',
      description: 'New community impact fees and compliance requirements create uncertainty about rental income.'
    },
    {
      icon: Waves,
      title: 'Coastal Resiliency Audits',
      description: 'Questions about flood zones, erosion projections, and insurance availability trigger buyer anxiety.'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        {/* Section Label */}
        <div className="mb-12">
          <div className="w-16 h-1 bg-[#D6C8B0] mb-6"></div>
          <h3 className="text-[#0A1A2F] mb-8">The Invisible Problem</h3>
        </div>

        {/* Main Content */}
        <div className="prose prose-lg max-w-none mb-12">
          <p className="text-xl leading-relaxed mb-6 opacity-90">
            What is this barrier? It's called <span className="font-semibold text-[#0A1A2F]">Decision Fatigue for the Turnkey Buyer.</span>
          </p>
          
          <p className="text-xl leading-relaxed mb-6 opacity-90">
            In 2026, the "Nantucket Buyer" has changed. They aren't looking for a project; they are looking for a "Safe Harbor" from a volatile world.
          </p>

          {/* Callout Box */}
          <div className="bg-[#E8E8E8] p-8 rounded-sm my-12 border-l-4 border-[#F28F7D]">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-[#F28F7D] flex-shrink-0 mt-1" />
              <div>
                <p className="text-xl font-semibold text-[#0A1A2F] mb-3">
                  The "New Cause" of failed sales on Nantucket isn't the price—it's Friction.
                </p>
                <p className="text-lg opacity-80">
                  If your home presents even one of these frictions, the modern buyer will simply move on to the next property. You don't have a "price" problem; you have a "friction" problem.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Friction Points */}
        <div className="space-y-6 mb-12">
          <p className="text-lg opacity-75 mb-8">
            The three most common friction points that are silently costing sellers hundreds of thousands:
          </p>
          
          {frictions.map((friction, index) => {
            const Icon = friction.icon;
            return (
              <div key={index} className="bg-[#E8E8E8] p-6 rounded-sm border border-[#D6C8B0]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-sm flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-[#3A5C7E]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-[#0A1A2F] mb-2">
                      {friction.title}
                    </h4>
                    <p className="opacity-80 leading-relaxed">
                      {friction.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
