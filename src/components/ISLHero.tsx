export function ISLHero() {
  return (
    <section className="pt-32 pb-20 bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Eyebrow */}
        <div className="text-center mb-8">
          <span className="inline-block text-sm uppercase tracking-widest text-[#3A5C7E] border-b-2 border-[#D6C8B0] pb-2">
            Special Report for Nantucket Homeowners
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-center mb-8 leading-tight">
          The "Sheep Pond Effect": Why Some Nantucket Properties Are Losing Millions in Hidden Value
        </h1>
        
        {/* Sub-headline */}
        <p className="text-center text-2xl text-[#3A5C7E] mb-12 leading-relaxed max-w-3xl mx-auto">
          (And It's Not Just Erosion)
        </p>

        {/* Intro paragraph */}
        <div className="max-w-2xl mx-auto">
          <p className="text-xl leading-relaxed text-center opacity-80 mb-8">
            Most homeowners believe the market is "stuck" due to interest rates or seasonality. The truth is much more invisible—and much more expensive.
          </p>
        </div>

        {/* Featured Image */}
        <div className="mt-12 rounded-sm overflow-hidden border border-[#D6C8B0]">
          <img
            src="https://images.unsplash.com/photo-1564440354048-2c20d2dbad68?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxOYW50dWNrZXQlMjBiZWFjaCUyMGhvdXNlJTIwZXh0ZXJpb3J8ZW58MXx8fHwxNzcwMDYxNTMyfDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Nantucket coastal property"
            className="w-full h-[500px] object-cover"
          />
        </div>
      </div>
    </section>
  );
}
