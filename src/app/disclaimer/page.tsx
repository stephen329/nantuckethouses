import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer | NantucketHouses",
  description: "Disclaimer for NantucketHouses.com.",
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-white text-3xl sm:text-4xl">Disclaimer</h1>
          <p className="text-white/70 mt-3 text-sm sm:text-base">
            Last updated: April 28, 2026
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/20 p-6 sm:p-8 space-y-6 text-sm text-[var(--atlantic-navy)]/85 leading-relaxed">
            <div>
              <h2 className="text-base text-[var(--atlantic-navy)] font-semibold mb-2">Market Information</h2>
              <p>
                Market statistics, projections, and commentary on this site are informational only. Data may be
                delayed, incomplete, or subject to revision.
              </p>
            </div>

            <div>
              <h2 className="text-base text-[var(--atlantic-navy)] font-semibold mb-2">No Guarantees</h2>
              <p>
                NantucketHouses.com makes no guarantees regarding outcomes, valuations, investment performance,
                or transaction results based on site content.
              </p>
            </div>

            <div>
              <h2 className="text-base text-[var(--atlantic-navy)] font-semibold mb-2">Third-Party Links</h2>
              <p>
                External links are provided for convenience. We are not responsible for the content, accuracy,
                or policies of third-party websites.
              </p>
            </div>

            <div>
              <h2 className="text-base text-[var(--atlantic-navy)] font-semibold mb-2">Equal Housing and Licensing</h2>
              <p>
                Real estate services are subject to applicable fair housing laws and licensing requirements.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
