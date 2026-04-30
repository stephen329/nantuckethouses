"use client";

import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";
import { OpportunityFormWrapper, FormField, inputClass, textareaClass } from "@/components/opportunities/OpportunityFormWrapper";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";

export default function ForSalePage() {
  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Opportunity Desk", href: "/opportunities" }, { label: "For Sale by Owner" }]} />
          <h1 className="text-white text-2xl sm:text-3xl">Submit a For Sale by Owner Opportunity</h1>
          <p className="text-white/50 mt-1 text-sm">List your property privately — Stephen reviews every submission personally.</p>
        </div>
      </section>

      <OpportunityFormWrapper
        category="for-sale-by-owner"
        title="For Sale by Owner"
        subtitle="List your property privately"
        submitLabel="Submit to Stephen's Desk"
      >
        {({ register }) => (
          <>
            <FormField label="Property Address" required>
              <input type="text" {...register("address")} required className={inputClass} />
            </FormField>
            <FormField label="Neighborhood" required>
              <select {...register("neighborhood")} required className={inputClass}>
                <option value="">Select...</option>
                {NEIGHBORHOODS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </FormField>
            <FormField label="Asking Price" required>
              <input type="number" {...register("askingPrice")} required placeholder="e.g., 3500000" className={inputClass} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Bedrooms">
                <input type="number" {...register("bedrooms")} className={inputClass} />
              </FormField>
              <FormField label="Bathrooms">
                <input type="number" {...register("bathrooms")} step="0.5" className={inputClass} />
              </FormField>
            </div>
            <FormField label="Approx. Square Feet">
              <input type="number" {...register("sqft")} className={inputClass} />
            </FormField>
            <FormField label="Timeline">
              <select {...register("timeline")} className={inputClass}>
                <option value="">Select...</option>
                <option value="ready-now">Ready now</option>
                <option value="spring-2027">Spring 2027</option>
                <option value="fall-2027">Fall 2027</option>
                <option value="flexible">Flexible</option>
              </select>
            </FormField>
            <FormField label="Key Details / Notes">
              <textarea {...register("notes")} placeholder="Anything else Stephen should know..." className={textareaClass} />
            </FormField>
          </>
        )}
      </OpportunityFormWrapper>
    </div>
  );
}
