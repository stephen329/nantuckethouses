import { ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1578338402915-bd6a1838b746?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxOYW50dWNrZXQlMjBhZXJpYWwlMjBjb2FzdGxpbmV8ZW58MXx8fHwxNzA0MDQ0NzEwfDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Aerial view of Nantucket coastline"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0A1A2F] opacity-50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center text-white">
        <h1 className="mb-6">
          The Nantucket Real Estate<br />Experience You Deserve
        </h1>
        <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-10 font-light tracking-wide opacity-95">
          Proprietary market insights, decades of island expertise, and a commitment to exceptional service for discerning buyers and sellers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="bg-[#3A5C7E] text-white px-8 py-4 rounded-md hover:bg-[#2d4860] transition-colors flex items-center gap-2 group">
            <span>Explore Available Properties</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="border-2 border-white text-white px-8 py-4 rounded-md hover:bg-white hover:text-[#0A1A2F] transition-all">
            Request Market Analysis
          </button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
      </div>
    </section>
  );
}
