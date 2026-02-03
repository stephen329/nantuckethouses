export function Testimonials() {
  const testimonials = [
    {
      quote: "We were about to overbid by $400K on a property with undisclosed drainage issues. Stephen identified the problem during a walkthrough, advised us to walk away, and two weeks later found us a better home for $200K less. That single decision saved us from a costly mistake.",
      author: "Elizabeth & Robert M.",
      location: "Siasconset"
    },
    {
      quote: "Our family had owned the property for three generations. Stephen advised us to wait six months rather than list immediately—against conventional wisdom. When we did sell, we received $800K more than the original offer. His read on the market was exactly right.",
      author: "The Harrison Family",
      location: "Monomoy"
    },
    {
      quote: "We were deciding between two properties and running out of time. Stephen evaluated the zoning implications of each, identified a subdivision restriction on our first choice, and helped us move quickly on the better option before it went to another buyer.",
      author: "Jennifer K.",
      location: "Town Center"
    }
  ];

  return (
    <section className="py-24 bg-[#1A2A3A]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-left mb-16">
          <h2 className="mb-4 text-white">Trusted by Island Families</h2>
          <p className="text-xl max-w-2xl text-white/80">
            Most of this work happens quietly. These are a few public reflections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm p-8 rounded-sm border border-[#D6C8B0]/30">
              <blockquote className="mb-6">
                <p className="text-lg text-white/90 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
              </blockquote>
              <div className="pt-6 border-t border-white/20">
                <p className="text-white font-medium">{testimonial.author}</p>
                <p className="text-sm text-white/60 mt-1">{testimonial.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
