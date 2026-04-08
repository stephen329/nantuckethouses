import Image from "next/image";
import { ComingSoonGate } from "@/components/ComingSoonGate";

export default function ComingSoonPage() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--atlantic-navy)] overflow-auto">
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center space-y-10">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/Nantucket Houses_Master_logo.png"
            alt="Nantucket Houses"
            width={220}
            height={58}
            priority
            className="brightness-0 invert"
          />
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl text-white font-serif">
            Something Special Is Coming
          </h1>
          <p className="text-white/50 text-sm leading-relaxed max-w-md mx-auto">
            We&apos;re building Nantucket&apos;s premier real estate intelligence
            hub &mdash; a single destination for everything you need to buy, build,
            and invest on the island.
          </p>
        </div>

        {/* Feature list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <Feature
            title="Live Market Pulse"
            desc="Real-time inventory, median prices, and absorption rates"
          />
          <Feature
            title="Regulatory Hub"
            desc="HDC decisions, zoning updates, and permitting guidance"
          />
          <Feature
            title="Neighborhood Intel"
            desc="Block-by-block expertise across all 13 neighborhoods"
          />
          <Feature
            title="Building Costs"
            desc="Current per-square-foot data for new construction"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Password gate */}
        <ComingSoonGate />
      </div>
      </div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <h3 className="text-sm font-sans font-semibold text-white mb-1">
        {title}
      </h3>
      <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
    </div>
  );
}
