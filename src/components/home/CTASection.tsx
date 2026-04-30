import { Phone, ClipboardCheck } from "lucide-react";
import { SCHEDULE_CALL_URL } from "@/lib/schedule-call-url";

export function CTASection() {
  return (
    <section className="brand-section bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-[var(--atlantic-navy)] text-2xl sm:text-3xl mb-3">
          Ready to Talk?
        </h2>
        <p className="text-[var(--nantucket-gray)] text-sm sm:text-base mb-10 max-w-2xl mx-auto">
          Whether you&apos;re evaluating a purchase, planning a build, or need an honest read
          on the market — Stephen&apos;s calendar is open for a direct conversation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={SCHEDULE_CALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 brand-btn brand-btn-primary px-8 py-4 text-sm"
          >
            <Phone className="w-4 h-4" />
            Talk to Stephen
          </a>
          <a
            href="https://calendly.com/stephen-maury/gut-check"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 brand-btn brand-btn-secondary px-8 py-4 text-sm"
          >
            <ClipboardCheck className="w-4 h-4" />
            Project Feasibility Gut Check
          </a>
        </div>

        <p className="mt-6 text-xs text-[var(--nantucket-gray)]">
          No obligation. No pitch. Just a straight conversation about your situation.
        </p>
      </div>
    </section>
  );
}
