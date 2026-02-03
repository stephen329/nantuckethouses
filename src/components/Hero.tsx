import { ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/nantucket-houses-hp.webp"
          alt="Nantucket Houses"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1A2A3A] opacity-50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center text-white">
        <h1 className="mb-4">
          The Only Market Knowledge That Matters<br />is the Kind You Can't Google
        </h1>
        
        <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 font-light tracking-wide opacity-95">
          Market intelligence is everywhere. Judgment is not.
        </p>

        {/* Personal Authority Block */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-4 mb-4">
            <img
              src="/stephen maury.webp"
              alt="Stephen Maury"
              className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
            />
            <div className="text-left">
              <p className="text-lg font-semibold">Led by Stephen Maury</p>
              <p className="text-sm opacity-80">Owner & Principal Broker, Congdon & Coleman Real Estate</p>
            </div>
          </div>
          <p className="text-base max-w-2xl opacity-80 italic">
            Born and raised on Nantucket, I advise buyers, sellers, and families through complex, high-stakes real estate decisions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="bg-[#C9A227] text-white px-8 py-4 rounded-md hover:bg-[#B89220] transition-colors flex items-center gap-2 group">
            <span>Explore The Collection</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="border-2 border-white text-white px-8 py-4 rounded-md hover:bg-white hover:text-[#1A2A3A] transition-all">
            Get the 2026 Market Forecast
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
