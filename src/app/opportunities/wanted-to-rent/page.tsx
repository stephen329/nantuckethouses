"use client";

import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";
import { OpportunityFormWrapper, FormField, inputClass, textareaClass } from "@/components/opportunities/OpportunityFormWrapper";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";

export default function WantedToRentPage() {
  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Opportunity Desk", href: "/opportunities" }, { label: "Wanted to Rent" }]} />
          <h1 className="text-white text-2xl sm:text-3xl">I&apos;m Looking to Rent</h1>
          <p className="text-white/50 mt-1 text-sm">Private rental request — Stephen matches you directly.</p>
        </div>
      </section>

      <OpportunityFormWrapper category="wanted-to-rent" title="Wanted to Rent" subtitle="Private rental search" submitLabel="Submit Rental Request">
        {({ register }) => (
          <>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Rental Budget" required>
                <input type="number" {...register("budget")} required className={inputClass} />
              </FormField>
              <FormField label="Budget Per">
                <select {...register("budgetPer")} className={inputClass}>
                  <option value="week">Per Week</option>
                  <option value="month">Per Month</option>
                  <option value="season">Per Season</option>
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Dates Needed (From)">
                <input type="date" {...register("dateFrom")} className={inputClass} />
              </FormField>
              <FormField label="Dates Needed (To)">
                <input type="date" {...register("dateTo")} className={inputClass} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Adults">
                <input type="number" {...register("adults")} className={inputClass} />
              </FormField>
              <FormField label="Children">
                <input type="number" {...register("children")} className={inputClass} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Bedrooms Needed">
                <input type="number" {...register("bedrooms")} className={inputClass} />
              </FormField>
              <FormField label="Bathrooms Needed">
                <input type="number" {...register("bathrooms")} step="0.5" className={inputClass} />
              </FormField>
            </div>
            <FormField label="Preferred Neighborhoods">
              <select {...register("neighborhoods")} className={inputClass}>
                <option value="">Any / All</option>
                {NEIGHBORHOODS.filter(n => n !== "Other").map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </FormField>
            <FormField label="Special Requirements">
              <textarea {...register("requirements")} placeholder="Pets, accessibility, proximity preferences, etc." className={textareaClass} />
            </FormField>
          </>
        )}
      </OpportunityFormWrapper>
    </div>
  );
}
