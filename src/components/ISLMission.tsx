export function ISLMission() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        {/* Section Label */}
        <div className="mb-12">
          <div className="w-16 h-1 bg-[#D6C8B0] mb-6"></div>
          <h3 className="text-[#0A1A2F] mb-8">The Mission</h3>
        </div>

        {/* Mission Statement */}
        <div className="prose prose-lg max-w-none mb-12">
          <p className="text-xl leading-relaxed mb-6 opacity-90">
            I'm on a mission to help <span className="font-semibold text-[#0A1A2F]">10 Nantucket homeowners this year</span> sell their properties without the "Sheep Pond" price drops or the 200-day wait times.
          </p>
          
          <p className="text-xl leading-relaxed mb-8 opacity-90">
            I'm not asking for a listing agreement. I'm offering a <span className="font-semibold text-[#0A1A2F]">Friction-Free Strategy Session</span>. We will look at your property through the eyes of a 2026 buyer and identify the 3 "invisible leaks" that could cost you $500k+ in your final sale price.
          </p>
        </div>

        {/* Stats Callout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#E8E8E8] p-8 text-center border border-[#D6C8B0] rounded-sm">
            <p className="text-4xl font-bold text-[#0A1A2F] mb-2">10</p>
            <p className="text-sm uppercase tracking-wider opacity-75">Homeowners This Year</p>
          </div>
          <div className="bg-[#E8E8E8] p-8 text-center border border-[#D6C8B0] rounded-sm">
            <p className="text-4xl font-bold text-[#0A1A2F] mb-2">$500k+</p>
            <p className="text-sm uppercase tracking-wider opacity-75">Potential Value Lost</p>
          </div>
          <div className="bg-[#E8E8E8] p-8 text-center border border-[#D6C8B0] rounded-sm">
            <p className="text-4xl font-bold text-[#0A1A2F] mb-2">0</p>
            <p className="text-sm uppercase tracking-wider opacity-75">Pressure or Obligation</p>
          </div>
        </div>

        {/* Supporting Image */}
        <div className="rounded-sm overflow-hidden border border-[#D6C8B0]">
          <img
            src="https://images.unsplash.com/photo-1768116439371-7f5e292b1a71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2FzdGFsJTIwcHJvcGVydHklMjBzdW5zZXR8ZW58MXx8fHwxNzcwMDYxNTM1fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Coastal property at sunset"
            className="w-full h-96 object-cover"
          />
        </div>
      </div>
    </section>
  );
}
