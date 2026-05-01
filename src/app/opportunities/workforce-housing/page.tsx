"use client";

import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";
import { OpportunityFormWrapper, FormField, inputClass, textareaClass } from "@/components/opportunities/OpportunityFormWrapper";

export default function WorkforceHousingPage() {
  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Opportunity Desk", href: "/opportunities" }, { label: "Workforce Housing" }]} />
          <h1 className="text-white text-2xl sm:text-3xl">Workforce Housing Inquiry</h1>
          <p className="text-white/50 mt-1 text-sm">
            Exploring Covenant Program, Lease to Locals, Friendly 40B, or year-round housing?
            Stephen can help navigate the options.
          </p>
        </div>
      </section>

      <OpportunityFormWrapper category="workforce-housing" title="Workforce Housing" subtitle="Housing inquiry" submitLabel="Submit Housing Inquiry">
        {({ register }) => (
          <>
            <FormField label="I am a..." required>
              <select {...register("role")} required className={inputClass}>
                <option value="">Select...</option>
                <option value="year-round-resident">Year-Round Resident (seeking housing)</option>
                <option value="landlord">Landlord (considering Lease to Locals)</option>
                <option value="developer">Developer (exploring 40B or Covenant projects)</option>
                <option value="employer">Employer (housing for workforce)</option>
                <option value="lot-owner">Lot Owner (Covenant lot feasibility)</option>
                <option value="other">Other</option>
              </select>
            </FormField>
            <FormField label="Area of Interest" required>
              <select {...register("interest")} required className={inputClass}>
                <option value="">Select...</option>
                <option value="covenant-program">Covenant Program (buying)</option>
                <option value="lease-to-locals">Lease to Locals (renting/converting)</option>
                <option value="friendly-40b">Friendly 40B Development</option>
                <option value="year-round-rental">Year-Round Rental Search</option>
                <option value="lot-feasibility">Covenant Lot Feasibility</option>
                <option value="general">General Workforce Housing Question</option>
              </select>
            </FormField>
            <FormField label="Household Size">
              <select {...register("householdSize")} className={inputClass}>
                <option value="">Select...</option>
                <option value="1">1 person</option>
                <option value="2">2 people</option>
                <option value="3">3 people</option>
                <option value="4">4 people</option>
                <option value="5+">5+</option>
              </select>
            </FormField>
            <FormField label="Approximate Household Income">
              <select {...register("incomeRange")} className={inputClass}>
                <option value="">Prefer not to say</option>
                <option value="under-130k">Under $130,800 (80% AMI)</option>
                <option value="130-163k">$130,800 - $163,500 (100% AMI)</option>
                <option value="163-245k">$163,500 - $245,250 (150% AMI)</option>
                <option value="245-327k">$245,250 - $327,000 (200% AMI)</option>
                <option value="over-327k">Over $327,000</option>
              </select>
            </FormField>
            <FormField label="Timeline">
              <select {...register("timeline")} className={inputClass}>
                <option value="">Select...</option>
                <option value="immediate">Immediate need</option>
                <option value="3-6-months">Next 3-6 months</option>
                <option value="2027">2027</option>
                <option value="exploring">Just exploring options</option>
              </select>
            </FormField>
            <FormField label="Tell us more" required>
              <textarea {...register("details")} required placeholder="Describe your situation — what are you looking for, what challenges are you facing?" className={textareaClass} />
            </FormField>
          </>
        )}
      </OpportunityFormWrapper>
    </div>
  );
}
