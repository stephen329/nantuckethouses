export function ISLNavigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-sm border-b border-[#E8E8E8]">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h3 className="text-[#0A1A2F] tracking-tight">NantucketHouses</h3>
          </div>

          {/* Simple CTA */}
          <button className="bg-[#3A5C7E] text-white px-6 py-2.5 rounded-md hover:bg-[#2d4860] transition-colors text-sm">
            Request Audit
          </button>
        </div>
      </div>
    </nav>
  );
}
