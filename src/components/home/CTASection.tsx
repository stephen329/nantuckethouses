import { Phone, ClipboardCheck } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-12 sm:py-16 bg-white">
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
            href="https://calendly.com/stephen-maury/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[var(--privet-green)] text-white px-8 py-4 text-sm font-medium rounded-md hover:bg-[var(--privet-green)]/90 transition-colors"
          >
            <Phone className="w-4 h-4" />
            Talk to Stephen
          </a>
          <a
            href="https://calendly.com/stephen-maury/gut-check"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[var(--atlantic-navy)] text-white px-8 py-4 text-sm font-medium rounded-md hover:bg-[var(--atlantic-navy)]/90 transition-colors"
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
