import Link from "next/link";
import { Briefcase } from "lucide-react";

export function OpportunityDesk() {
  return (
    <section className="brand-section bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[var(--atlantic-navy)] rounded-[var(--radius-card)] p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-[var(--elevation-1)]">
          <div className="p-3 rounded-lg bg-white/10 shrink-0">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-white text-xl sm:text-2xl mb-2">
              Off-Market &amp; Opportunity Desk
            </h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-xl">
              Don&apos;t see what you&apos;re looking for on the MLS?
              Submit your requirement to our private desk. Stephen reviews every
              request personally and matches you with hidden supply or qualified buyers.
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Link href="/opportunities" className="inline-block brand-btn brand-btn-primary px-6 py-3 text-sm text-center">
              Submit an Opportunity
            </Link>
            <Link
              href="/opportunities"
              className="text-xs text-white/40 hover:text-white/60 transition-colors text-center"
            >
              Learn how the private desk works &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
