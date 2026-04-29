import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | NantucketHouses",
  description: "Privacy Policy for NantucketHouses.com.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-white text-3xl sm:text-4xl">Privacy Policy</h1>
          <p className="text-white/70 mt-3 text-sm sm:text-base">
            Last updated: April 28, 2026
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/20 p-6 sm:p-8 space-y-6 text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
            <p>
              NantucketHouses.com respects your privacy. This page is a boilerplate policy and should be
              reviewed with legal counsel before final publication.
            </p>

            <div>
              <h2 className="text-base text-[var(--atlantic-navy)] font-semibold mb-2">Information We Collect</h2>
              <p>
                We may collect information you submit directly (such as name, email, phone, and property
                details), as well as standard analytics and device usage data.
              </p>
            </div>

            <div>
              <h2 className="text-base text-[var(--atlantic-navy)] font-semibold mb-2">How We Use Information</h2>
              <p>
                Information may be used to respond to inquiries, provide requested services, improve site
                performance, and communicate relevant updates.
              </p>
            </div>

            <div>
              <h2 className="text-base text-[var(--atlantic-navy)] font-semibold mb-2">Sharing and Disclosure</h2>
              <p>
                We do not sell personal information. Data may be shared with service providers that support
                website operations, analytics, communication, and security.
              </p>
            </div>

            <div>
              <h2 className="text-base text-[var(--atlantic-navy)] font-semibold mb-2">Cookies and Tracking</h2>
              <p>
                This site may use cookies and similar technologies for analytics, advertising attribution, and
                performance monitoring.
              </p>
            </div>

            <div>
              <h2 className="text-base text-[var(--atlantic-navy)] font-semibold mb-2">Contact</h2>
              <p>
                For privacy-related questions, contact <a className="text-[var(--privet-green)] hover:underline" href="mailto:stephen@nantuckethouses.com">stephen@nantuckethouses.com</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
