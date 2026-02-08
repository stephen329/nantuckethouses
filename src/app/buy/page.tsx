"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/components/ui/utils";

const LIFESTYLES = [
  {
    value: "waterfront-views",
    label: "Waterfront & Water Views",
    description: "Direct water access and expansive views",
  },
  {
    value: "quiet-secluded",
    label: "Quiet & Secluded",
    description: "Privacy in areas with large lots like Polpis and Dionis",
  },
  {
    value: "active-summer",
    label: "Active Summer",
    description: "Proximity to popular south shore beaches (Cisco/Surfside) and bike paths",
  },
] as const;

const AMENITIES = [
  { value: "private-pool", label: "Private Pool" },
  { value: "guest-cottage", label: "Guest Cottage/Studio" },
  { value: "modern-turnkey", label: "Modern/Turnkey Design" },
  { value: "investment-rental", label: "Investment/Rental Potential" },
  { value: "conservation-border", label: "Conservation Land Border" },
] as const;

const PRICE_OPTIONS = [
  {
    value: "2-5",
    label: "$2M – $5M",
    description: "Entry-level seasonal homes and town cottages.",
  },
  {
    value: "5-10",
    label: "$5M – $10M",
    description: "Turnkey residences with pools and water access.",
  },
  {
    value: "10-plus",
    label: "$10M+",
    description: "Luxury estates and premier waterfront opportunities.",
  },
  {
    value: "specific-asset",
    label: "I'm looking for a specific off-market asset.",
    description: null,
  },
] as const;

const TIMELINE_OPTIONS = [
  {
    value: "asap",
    label: "ASAP",
    description: "Ready to move on the right opportunity.",
  },
  {
    value: "3-6-months",
    label: "Next 3-6 Months",
    description: "Planning for the upcoming season.",
  },
  {
    value: "browsing",
    label: "Just Browsing",
    description: "Exploring the island's potential for the future.",
  },
] as const;

type FormStep = 1 | 2 | 3;

export default function BuyPage() {
  const [step, setStep] = useState<FormStep>(1);
  const [lifestyles, setLifestyles] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState("");
  const [timeline, setTimeline] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [textAlerts, setTextAlerts] = useState(false);
  const [scheduleCall, setScheduleCall] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle"
  );

  const toggleLifestyle = (value: string) => {
    setLifestyles((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };
  const toggleAmenity = (value: string) => {
    setAmenities((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const canProceedStep1 = true; // low friction: allow proceeding with no selection
  const canProceedStep2 = !!priceRange && !!timeline;
  const canSubmitStep3 = !!fullName && !!email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/buy-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lifestyles,
          amenities,
          priceRange,
          timeline,
          fullName,
          email,
          phone: phone || undefined,
          textAlerts,
          scheduleCall,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      const params = new URLSearchParams();
      if (textAlerts) params.set("textAlerts", "1");
      if (scheduleCall) params.set("scheduleCall", "1");
      const query = params.toString();
      window.location.href = `/buy/thank-you${query ? `?${query}` : ""}`;
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--parchment)] text-[var(--nantucket-navy)]">
      {/* Hero — above the fold */}
      <section className="relative min-h-[100svh] flex flex-col justify-end pb-16 md:pb-24">
        <div className="absolute inset-0 z-0">
          <Image
            src="/nantucket-houses-hp.webp"
            alt="Nantucket coastline and classic shingle-style estate"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div
            className="absolute inset-0 bg-[var(--nantucket-navy)] opacity-55"
            aria-hidden
          />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-5 md:px-8 text-center text-white">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight drop-shadow-sm mb-6">
            50% Conserved. 100% Unique.
          </h1>
          <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto mb-5 font-normal leading-relaxed">
            Like your time, Nantucket is a finite resource. With half the island permanently protected from development, the opportunity to own here is a vanishingly rare privilege. As conservation efforts expand, the remaining private landscape becomes more exclusive every year.
          </p>
          <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            Don&apos;t just watch the market—secure your piece of the Faraway Island. Through our deep local roots and private off-market network, we provide the expert guidance needed to access Nantucket&apos;s most coveted, unlisted estates.
          </p>
          <a
            href="#concierge"
            className="inline-flex items-center justify-center gap-2 bg-[var(--polished-brass)] hover:bg-[var(--brass-hover)] text-white font-medium px-8 py-4 rounded-md transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-[var(--polished-brass)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--nantucket-navy)]"
          >
            Secure My Piece of Nantucket
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Lead capture form: Dream → Reality → Concierge */}
      <section
        id="concierge"
        className="py-16 md:py-24 bg-white border-t border-[var(--fog-gray)]"
      >
        <div className="max-w-2xl mx-auto px-5 md:px-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step indicator */}
              <div className="flex gap-2" aria-hidden>
                {[1, 2, 3].map((s) => (
                  <span
                    key={s}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      s <= step ? "bg-[var(--polished-brass)]" : "bg-[var(--fog-gray)]"
                    )}
                  />
                ))}
              </div>

              {/* Step 1: The Dream (Lifestyle Alignment) */}
              {step === 1 && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--harbor-blue)] mb-1">
                      Step 1 — The Dream
                    </p>
                    <h2 className="text-xl font-serif font-bold text-[var(--nantucket-navy)] mb-6">
                      Lifestyle alignment
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-medium">
                      Which Nantucket lifestyle speaks to you? (Select all that apply)
                    </Label>
                    <div className="space-y-3">
                      {LIFESTYLES.map((opt) => (
                        <label
                          key={opt.value}
                          className={cn(
                            "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                            lifestyles.includes(opt.value)
                              ? "border-[var(--polished-brass)] bg-[var(--polished-brass)]/5"
                              : "border-[var(--fog-gray)] hover:border-[var(--harbor-blue)]/40"
                          )}
                        >
                          <Checkbox
                            checked={lifestyles.includes(opt.value)}
                            onCheckedChange={() => toggleLifestyle(opt.value)}
                            className="mt-0.5 border-[var(--nantucket-navy)] data-[state=checked]:bg-[var(--polished-brass)] data-[state=checked]:border-[var(--polished-brass)]"
                          />
                          <div>
                            <span className="font-medium text-[var(--nantucket-navy)]">
                              {opt.label}
                            </span>
                            <p className="text-sm text-[var(--nantucket-navy)]/70 mt-0.5">
                              {opt.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-medium">
                      What are your &quot;must-have&quot; amenities? (Tap to select)
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {AMENITIES.map((opt) => (
                        <label
                          key={opt.value}
                          className={cn(
                            "inline-flex items-center gap-2 px-4 py-2.5 rounded-full border cursor-pointer transition-colors text-sm",
                            amenities.includes(opt.value)
                              ? "border-[var(--polished-brass)] bg-[var(--polished-brass)]/10 text-[var(--nantucket-navy)]"
                              : "border-[var(--fog-gray)] hover:border-[var(--harbor-blue)]/40"
                          )}
                        >
                          <Checkbox
                            checked={amenities.includes(opt.value)}
                            onCheckedChange={() => toggleAmenity(opt.value)}
                            className="border-[var(--nantucket-navy)] data-[state=checked]:bg-[var(--polished-brass)] data-[state=checked]:border-[var(--polished-brass)]"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full h-12 bg-[var(--nantucket-navy)] hover:bg-[var(--harbor-blue)] text-white"
                  >
                    Next
                  </Button>
                </div>
              )}

              {/* Step 2: The Reality (Financial & Logistics) */}
              {step === 2 && (
                <div className="space-y-8">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-[var(--harbor-blue)] hover:underline"
                  >
                    ← Back
                  </button>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--harbor-blue)] mb-1">
                      Step 2 — The Reality
                    </p>
                    <h2 className="text-xl font-serif font-bold text-[var(--nantucket-navy)] mb-6">
                      Financial & logistics
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-medium">
                      What is your target price range?
                    </Label>
                    <div className="space-y-2">
                      {PRICE_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={cn(
                            "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                            priceRange === opt.value
                              ? "border-[var(--polished-brass)] bg-[var(--polished-brass)]/5"
                              : "border-[var(--fog-gray)] hover:border-[var(--harbor-blue)]/40"
                          )}
                        >
                          <input
                            type="radio"
                            name="priceRange"
                            value={opt.value}
                            checked={priceRange === opt.value}
                            onChange={() => setPriceRange(opt.value)}
                            className="mt-1 border-[var(--nantucket-navy)] text-[var(--polished-brass)] focus:ring-[var(--polished-brass)]"
                          />
                          <div>
                            <span className="font-medium text-[var(--nantucket-navy)]">
                              {opt.label}
                            </span>
                            {opt.description && (
                              <p className="text-sm text-[var(--nantucket-navy)]/70 mt-0.5">
                                {opt.description}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-medium">
                      What is your ideal purchase timeline?
                    </Label>
                    <div className="space-y-2">
                      {TIMELINE_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={cn(
                            "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                            timeline === opt.value
                              ? "border-[var(--polished-brass)] bg-[var(--polished-brass)]/5"
                              : "border-[var(--fog-gray)] hover:border-[var(--harbor-blue)]/40"
                          )}
                        >
                          <input
                            type="radio"
                            name="timeline"
                            value={opt.value}
                            checked={timeline === opt.value}
                            onChange={() => setTimeline(opt.value)}
                            className="mt-1 border-[var(--nantucket-navy)] text-[var(--polished-brass)] focus:ring-[var(--polished-brass)]"
                          />
                          <div>
                            <span className="font-medium text-[var(--nantucket-navy)]">
                              {opt.label}
                            </span>
                            <p className="text-sm text-[var(--nantucket-navy)]/70 mt-0.5">
                              {opt.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!canProceedStep2}
                    className="w-full h-12 bg-[var(--nantucket-navy)] hover:bg-[var(--harbor-blue)] text-white"
                  >
                    Next
                  </Button>
                </div>
              )}

              {/* Step 3: The Concierge (Contact & Exclusivity) */}
              {step === 3 && (
                <div className="space-y-8">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-sm text-[var(--harbor-blue)] hover:underline"
                  >
                    ← Back
                  </button>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--harbor-blue)] mb-1">
                      Step 3 — Expert Guidance
                    </p>
                    <h2 className="text-xl font-serif font-bold text-[var(--nantucket-navy)] mb-4">
                      How can we reach you?
                    </h2>
                    <p className="text-[var(--nantucket-navy)]/85 leading-relaxed">
                      To provide you with tailored assistance and access to off-market opportunities that match your criteria, how can we reach you?
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Your name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-12 border-[var(--harbor-blue)]/30"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 border-[var(--harbor-blue)]/30"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number (optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 border-[var(--harbor-blue)]/30"
                    />
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer group block">
                    <Checkbox
                      checked={textAlerts}
                      onCheckedChange={(c) => setTextAlerts(!!c)}
                      className="mt-0.5 border-[var(--nantucket-navy)] data-[state=checked]:bg-[var(--polished-brass)] data-[state=checked]:border-[var(--polished-brass)]"
                    />
                    <div>
                      <span className="text-[var(--nantucket-navy)] font-medium group-hover:text-[var(--nantucket-navy)]/90">
                        Text me private listing alerts. *
                      </span>
                      <p className="text-sm text-[var(--nantucket-navy)]/70 mt-1">
                        Receive instant notifications when off-market properties matching your criteria become available. Standard rates apply.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox
                      checked={scheduleCall}
                      onCheckedChange={(c) => setScheduleCall(!!c)}
                      className="mt-0.5 border-[var(--nantucket-navy)] data-[state=checked]:bg-[var(--polished-brass)] data-[state=checked]:border-[var(--polished-brass)]"
                    />
                    <span className="text-[var(--nantucket-navy)] group-hover:text-[var(--nantucket-navy)]/90">
                      I would like to schedule a Private 15-minute Market Strategy Call.
                    </span>
                  </label>

                  {status === "error" && (
                    <p className="text-sm text-red-600">
                      Something went wrong. Please try again or email us directly.
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={!canSubmitStep3 || status === "sending"}
                    className="w-full h-12 bg-[var(--polished-brass)] hover:bg-[var(--brass-hover)] text-white"
                  >
                    {status === "sending" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Get Private Market Access
                        <Check className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
        </div>
      </section>

      {/* Inside track — market insights + exclusive + testimonial */}
      <section className="py-16 md:py-24 bg-[var(--nantucket-navy)] text-white">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-center mb-12">
            The inside track
          </h2>

          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h3 className="font-serif font-bold text-lg mb-2">
                Market insights
              </h3>
              <p className="text-white/85 text-sm leading-relaxed">
                Average sale price in &apos;Sconset and Town continues to lead the
                island. We track trends and composition so you see the full
                picture—not just headlines.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h3 className="font-serif font-bold text-lg mb-2">
                Off-market access
              </h3>
              <p className="text-white/85 text-sm leading-relaxed">
                The best opportunities often never hit the MLS. Pocket listings
                and quiet referrals are how many of our clients find their
                place.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <h3 className="font-serif font-bold text-lg mb-2">
                Discretion & expertise
              </h3>
              <p className="text-white/85 text-sm leading-relaxed italic">
                &ldquo;Stephen understood exactly what we wanted and never pushed.
                When the right property came up off-market, we moved quickly
                and closed without the circus.&rdquo;
              </p>
              <p className="mt-3 text-white/70 text-sm">— Buyer, Town</p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual content blocks */}
      <section className="py-16 md:py-24 bg-[var(--parchment)]">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-center mb-12 text-[var(--nantucket-navy)]">
            What we curate
          </h2>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <article className="group overflow-hidden rounded-lg shadow-lg border border-[var(--fog-gray)] bg-white">
              <div className="aspect-[4/3] relative overflow-hidden">
                <Image
                  src="/DJI_0371.webp"
                  alt="Waterfront estate on Nantucket"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-5">
                <h3 className="font-serif font-bold text-xl text-[var(--nantucket-navy)] mb-1">
                  Waterfront estates
                </h3>
                <p className="text-sm text-[var(--nantucket-navy)]/80">
                  Direct beach access and harbor views for the buyer who wants
                  the water at their doorstep.
                </p>
              </div>
            </article>

            <article className="group overflow-hidden rounded-lg shadow-lg border border-[var(--fog-gray)] bg-white">
              <div className="aspect-[4/3] relative overflow-hidden">
                <Image
                  src="/DJI_0122.webp"
                  alt="Historic town and Main Street Nantucket"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-5">
                <h3 className="font-serif font-bold text-xl text-[var(--nantucket-navy)] mb-1">
                  Historic town charm
                </h3>
                <p className="text-sm text-[var(--nantucket-navy)]/80">
                  Near Main Street—cobblestones, shingle style, and walkable
                  village life.
                </p>
              </div>
            </article>

            <article className="group overflow-hidden rounded-lg shadow-lg border border-[var(--fog-gray)] bg-white">
              <div className="aspect-[4/3] relative overflow-hidden">
                <Image
                  src="/DJI_0488.webp"
                  alt="New construction Nantucket"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-5">
                <h3 className="font-serif font-bold text-xl text-[var(--nantucket-navy)] mb-1">
                  New construction
                </h3>
                <p className="text-sm text-[var(--nantucket-navy)]/80">
                  Modern amenities and build quality inside a classic island
                  envelope.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Footer — minimal, no nav */}
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
