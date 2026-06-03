"use client";

import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";
import { OpportunityFormWrapper, FormField, inputClass, textareaClass } from "@/components/opportunities/OpportunityFormWrapper";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";

export default function WantedToBuyPage() {
  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Opportunity Desk", href: "/opportunities" }, { label: "Wanted to Buy" }]} />
          <h1 className="text-white text-2xl sm:text-3xl">I&apos;m Looking to Buy</h1>
          <p className="text-white/50 mt-1 text-sm">Tell us what you&apos;re seeking — Stephen will match you with off-market opportunities.</p>
        </div>
      </section>

      <OpportunityFormWrapper category="wanted-to-buy" title="Wanted to Buy" subtitle="Off-market search" submitLabel="Submit My Buying Criteria">
        {({ register }) => (
          <>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Budget Min" required>
                <input type="number" {...register("budgetMin")} required placeholder="e.g., 2000000" className={inputClass} />
              </FormField>
              <FormField label="Budget Max" required>
                <input type="number" {...register("budgetMax")} required placeholder="e.g., 5000000" className={inputClass} />
              </FormField>
            </div>
            <FormField label="Preferred Neighborhoods">
              <select {...register("neighborhoods")} className={inputClass}>
                <option value="">Any / All</option>
                {NEIGHBORHOODS.filter(n => n !== "Other").map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Bedrooms Needed">
                <input type="number" {...register("bedrooms")} className={inputClass} />
              </FormField>
              <FormField label="Bathrooms Needed">
                <input type="number" {...register("bathrooms")} step="0.5" className={inputClass} />
              </FormField>
            </div>
            <FormField label="Property Type">
              <select {...register("propertyType")} className={inputClass}>
                <option value="">Any</option>
                <option value="single-family">Single Family</option>
                <option value="guest-house">Guest House</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
                <option value="other">Other</option>
              </select>
            </FormField>
            <FormField label="Timeline">
              <select {...register("timeline")} className={inputClass}>
                <option value="">Select...</option>
                <option value="now">Now</option>
                <option value="3-6-months">Next 3-6 Months</option>
                <option value="2027">2027</option>
                <option value="flexible">Flexible</option>
              </select>
            </FormField>
            <FormField label="Must-Haves">
              <textarea {...register("mustHaves")} placeholder="e.g., ocean view, walking distance to town, pool..." className={textareaClass} />
            </FormField>
            <FormField label="Nice-to-Haves">
              <textarea {...register("niceToHaves")} placeholder="e.g., guest house, garage, outdoor shower..." className={textareaClass} />
            </FormField>
          </>
        )}
      </OpportunityFormWrapper>
    </div>
  );
}
