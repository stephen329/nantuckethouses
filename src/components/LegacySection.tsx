import { ArrowRight } from 'lucide-react';

export function LegacySection() {
  const milestones = [
    {
      year: '1931',
      title: 'Congdon & Coleman Founded',
      description: 'The island\'s longest-standing real estate brokerage opens its doors.',
      highlight: true,
    },
    {
      year: '1946',
      title: 'The Emporium Opens',
      description: 'The Maury family establishes roots on Main Street with a beloved home goods store.',
      highlight: false,
    },
    {
      year: '1960s',
      title: 'Transition to Real Estate',
      description: 'Grandparents pioneer the family\'s entry into Nantucket brokerage.',
      highlight: false,
    },
    {
      year: '1978',
      title: 'Development Begins',
      description: 'Father launches general contracting, developing the island\'s most significant neighborhoods through the \'80s and \'90s.',
      highlight: true,
    },
    {
      year: 'Today',
      title: 'The Legacy Continues',
      description: 'Stephen leads Congdon & Coleman; brother continues Maury Associates contracting.',
      highlight: true,
    },
  ];

  return (
    <section className="py-24 bg-[#1A2A3A]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[#C9A227] text-sm uppercase tracking-[0.3em] mb-4 font-medium">
            Est. 1931
          </p>
          <h2 className="text-white text-4xl md:text-5xl mb-6 tracking-tight">
            A Century of Stewardship
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto font-light tracking-wide">
            Congdon & Coleman · The Island's Longest-Standing Brokerage
          </p>
        </div>

        {/* Timeline */}
        <div className="relative mb-16">
          {/* Timeline line */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A227]/40 to-transparent"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="relative text-center">
                {/* Timeline dot */}
                <div className={`hidden md:flex w-4 h-4 rounded-full mx-auto mb-6 ${
                  milestone.highlight 
                    ? 'bg-[#C9A227]' 
                    : 'bg-[#C9A227]/40'
                }`}></div>
                
                {/* Year */}
                <p className={`text-2xl font-serif mb-2 ${
                  milestone.highlight 
                    ? 'text-[#C9A227]' 
                    : 'text-[#C9A227]/70'
                }`}>
                  {milestone.year}
                </p>
                
                {/* Title */}
                <h3 className="text-white text-lg font-medium mb-2">
                  {milestone.title}
                </h3>
                
                {/* Description */}
                <p className="text-white/60 text-sm leading-relaxed">
                  {milestone.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Narrative Block */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm p-10 md:p-12 rounded-sm border border-[#C9A227]/20">
            <div className="space-y-6 text-white/80 text-lg leading-relaxed">
              <p>
                My family's roots on Nantucket began in 1946 with The Emporium, a Main Street staple for home goods. By the early 1960s, my grandparents transitioned into real estate, followed by my father, who began developing the island's most significant residential neighborhoods in 1978—a legacy my brother carries forward today at Maury Associates.
              </p>
              <p>
                Today, I lead <span className="text-white font-medium">Congdon & Coleman</span>, the island's longest-standing real estate brokerage, founded in 1931. We don't just track the market; <span className="text-[#C9A227] italic">we have been its keepers for nearly a century</span>.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <button className="bg-[#C9A227] text-white px-10 py-5 rounded-md hover:bg-[#B89220] transition-colors inline-flex items-center gap-3 group text-lg">
            <span>Access the Island's Oldest Network</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-white/50 text-sm mt-4 italic">
            Inquire for Private Opportunities from our 90-year Institutional Database
          </p>
        </div>
      </div>
    </section>
  );
}
