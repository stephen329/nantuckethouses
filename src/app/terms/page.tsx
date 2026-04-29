import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | NantucketHouses",
  description: "Terms of Use for NantucketHouses.com.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-white text-3xl sm:text-4xl">Terms of Use</h1>
          <p className="text-white/70 mt-3 text-sm sm:text-base">
            Last updated: April 28, 2026
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/20 p-6 sm:p-8 space-y-6 text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
            <p>
              These Terms of Use are provided as a boilerplate template and should be reviewed with legal
              counsel before final publication.
            </p>

            <div>
              <h2 className="text-base text-[var(--atlantic-navy)] font-semibold mb-2">Acceptance of Terms</h2>
              <p>
                By accessing this website, you agree to use it only for lawful purposes and in accordance with
                these terms.
              </p>
            </div>

            <div>
              <h2 className="text-base text-[var(--atlantic-navy)] font-semibold mb-2">No Professional Advice</h2>
              <p>
                Content is for general informational purposes only and does not constitute legal, tax, or
                investment advice.
              </p>
            </div>

            <div>
              <h2 className="text-base text-[var(--atlantic-navy)] font-semibold mb-2">Intellectual Property</h2>
              <p>
                Site content, branding, and materials are owned by or licensed to NantucketHouses.com and may
                not be reused without permission.
              </p>
            </div>

            <div>
              <h2 className="text-base text-[var(--atlantic-navy)] font-semibold mb-2">Limitation of Liability</h2>
              <p>
                NantucketHouses.com is not liable for any direct or indirect damages arising from use of the
                website or reliance on its content.
              </p>
            </div>

            <div>
              <h2 className="text-base text-[var(--atlantic-navy)] font-semibold mb-2">Contact</h2>
              <p>
                Questions about these terms can be sent to <a className="text-[var(--privet-green)] hover:underline" href="mailto:stephen@nantuckethouses.com">stephen@nantuckethouses.com</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
