"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    try {
      // Klaviyo Subscribe API (Back in Stock / List Subscribe)
      // Uses the Klaviyo public API key embedded in the site
      const response = await fetch(
        "https://a.klaviyo.com/client/subscriptions/?company_id=WysYSe",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", revision: "2024-02-15" },
          body: JSON.stringify({
            data: {
              type: "subscription",
              attributes: {
                custom_source: "NantucketHouses.com Homepage",
                profile: {
                  data: {
                    type: "profile",
                    attributes: { email },
                  },
                },
              },
              relationships: {
                list: {
                  data: {
                    type: "list",
                    id: "Wys4Bx", // Replace with actual Klaviyo list ID
                  },
                },
              },
            },
          }),
        }
      );

      if (response.ok || response.status === 202) {
        setStatus("success");
        setEmail("");

        // Track Klaviyo event
        if (typeof window !== "undefined" && (window as any).klaviyo) {
          (window as any).klaviyo.push(["track", "Newsletter_Subscribe_From_Home", { source: "homepage" }]);
        }
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="py-12 sm:py-16 bg-[var(--atlantic-navy)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs uppercase tracking-[0.25em] font-semibold mb-2 font-sans"
           style={{ color: "#6dbd8b" }}>
          Stay Informed
        </p>
        <h2 className="text-white text-2xl sm:text-3xl mb-3">Get the Weekly Pulse</h2>
        <p className="text-white/60 text-sm sm:text-base mb-8 max-w-xl mx-auto">
          Market moves, HDC decisions, and insider takes — delivered every Friday morning.
          No spam. Unsubscribe anytime.
        </p>

        {status === "success" ? (
          <div className="flex items-center justify-center gap-2 text-[var(--privet-green)]"
               style={{ color: "#6dbd8b" }}>
            <CheckCircle className="w-5 h-5" />
            <p className="text-sm font-medium">Welcome to the Pulse. Check your inbox.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-4 py-3 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--privet-green)] focus:border-transparent"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-6 py-3 bg-[var(--privet-green)] text-white text-sm font-medium rounded-md hover:bg-[var(--privet-green)]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                "Subscribing..."
              ) : (
                <>
                  Subscribe <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="mt-3 text-xs text-red-400">
            Something went wrong. Please try again or email stephen@nantuckethouses.com directly.
          </p>
        )}
      </div>
    </section>
  );
}
