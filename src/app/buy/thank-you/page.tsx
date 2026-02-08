import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thank You | Nantucket Houses",
  description: "Your request has been received.",
  robots: "noindex, nofollow",
};

type Props = {
  searchParams: Promise<{ textAlerts?: string; scheduleCall?: string }>;
};

export default async function BuyThankYouPage({ searchParams }: Props) {
  const params = await searchParams;
  const textAlerts = params.textAlerts === "1";
  const scheduleCall = params.scheduleCall === "1";

  return (
    <div className="min-h-screen bg-[var(--parchment)] text-[var(--nantucket-navy)]">
      <section className="py-16 md:py-24 px-5 md:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[var(--nantucket-navy)] mb-4">
            Thank you
          </h1>
          <p className="text-lg text-[var(--nantucket-navy)]/85 mb-8">
            We will review your information and be in touch with next steps.
          </p>

          {textAlerts && (
            <div className="mb-8 p-4 rounded-lg bg-[var(--seafoam)]/20 border border-[var(--seafoam)] text-left">
              <p className="text-[var(--nantucket-navy)] font-medium">
                You opted in to private listing alerts.
              </p>
              <p className="text-sm text-[var(--nantucket-navy)]/80 mt-1">
                You will receive a confirmation text message shortly to verify your number.
              </p>
            </div>
          )}

          {scheduleCall && (
            <div className="mt-10 text-left">
              <h2 className="text-xl font-serif font-bold text-[var(--nantucket-navy)] mb-2">
                Schedule your 15-minute Market Strategy Call
              </h2>
              <p className="text-[var(--nantucket-navy)]/80 mb-4">
                Choose a time below that works for you.
              </p>
              <div className="rounded-lg overflow-hidden border border-[var(--fog-gray)] bg-white">
                <iframe
                  src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ1cbyjgyalYVCSaoQyoth12ocFwcZkcylCW8-gWJ0jlTZ2639G-o4S0MRgxawb-laQyjqTwGXM9?gv=true"
                  style={{ border: 0 }}
                  width="100%"
                  height="600"
                  title="Schedule a Market Strategy Call"
                />
              </div>
            </div>
          )}

          {!scheduleCall && (
            <p className="text-sm text-[var(--nantucket-navy)]/70">
              Questions? Reach out anytime.
            </p>
          )}
        </div>
      </section>

      <footer className="py-8 bg-[var(--nantucket-navy)] text-white/70 text-center text-sm">
        <p>
          Nantucket Houses ·{" "}
          <a
            href="https://maury.net"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 hover:text-[var(--polished-brass)] transition-colors underline underline-offset-2"
          >
            Stephen Maury
          </a>
          {" · "}
          <a
            href="https://congdonandcoleman.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 hover:text-[var(--polished-brass)] transition-colors underline underline-offset-2"
          >
            Congdon & Coleman Real Estate
          </a>
        </p>
      </footer>
    </div>
  );
}
