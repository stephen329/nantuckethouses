export function Testimonials() {
  const testimonials = [
    {
      quote: "Stephen's knowledge of the Nantucket market is unparalleled. He helped us navigate a competitive bidding situation with grace and strategy, ultimately securing our dream home.",
      author: "Elizabeth & Robert M.",
      location: "Siasconset"
    },
    {
      quote: "When it came time to sell our family estate, we needed someone who understood not just the property value, but the emotional significance. Stephen exceeded every expectation.",
      author: "The Harrison Family",
      location: "Monomoy"
    },
    {
      quote: "As first-time island buyers, we were overwhelmed. Stephen's concierge approach made the entire process seamless, from property search to connecting us with island resources.",
      author: "Jennifer K.",
      location: "Town Center"
    }
  ];

  return (
    <section className="py-24 bg-[#0A1A2F]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-left mb-16">
          <h2 className="mb-4 text-white">Trusted by Island Families</h2>
          <p className="text-xl max-w-2xl text-white/80">
            Building lasting relationships through exceptional service and results.
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
