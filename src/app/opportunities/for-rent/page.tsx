"use client";

import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";
import { OpportunityFormWrapper, FormField, inputClass, textareaClass } from "@/components/opportunities/OpportunityFormWrapper";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";

export default function ForRentPage() {
  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Opportunity Desk", href: "/opportunities" }, { label: "For Rent by Owner" }]} />
          <h1 className="text-white text-2xl sm:text-3xl">Submit a For Rent by Owner Opportunity</h1>
          <p className="text-white/50 mt-1 text-sm">Private rental listing — Stephen reviews every submission.</p>
        </div>
      </section>

      <OpportunityFormWrapper category="for-rent-by-owner" title="For Rent" subtitle="Private rental" submitLabel="Submit Rental to Stephen's Desk">
        {({ register }) => (
          <>
            <FormField label="Property Address" required>
              <input type="text" {...register("address")} required className={inputClass} />
            </FormField>
            <FormField label="Neighborhood">
              <select {...register("neighborhood")} className={inputClass}>
                <option value="">Select...</option>
                {NEIGHBORHOODS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Rental Price" required>
                <input type="number" {...register("rentalPrice")} required className={inputClass} />
              </FormField>
              <FormField label="Price Per">
                <select {...register("pricePer")} className={inputClass}>
                  <option value="week">Per Week</option>
                  <option value="month">Per Month</option>
                  <option value="season">Per Season</option>
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Available From">
                <input type="date" {...register("availableFrom")} className={inputClass} />
              </FormField>
              <FormField label="Available To">
                <input type="date" {...register("availableTo")} className={inputClass} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Bedrooms">
                <input type="number" {...register("bedrooms")} className={inputClass} />
              </FormField>
              <FormField label="Bathrooms">
                <input type="number" {...register("bathrooms")} step="0.5" className={inputClass} />
              </FormField>
            </div>
            <FormField label="Minimum Stay">
              <select {...register("minStay")} className={inputClass}>
                <option value="">Select...</option>
                <option value="1-week">1 Week</option>
                <option value="2-weeks">2 Weeks</option>
                <option value="1-month">1 Month</option>
                <option value="seasonal">Seasonal</option>
                <option value="flexible">Flexible</option>
              </select>
            </FormField>
            <FormField label="Pet Policy">
              <select {...register("petPolicy")} className={inputClass}>
                <option value="no-pets">No Pets</option>
                <option value="dogs-ok">Dogs OK</option>
                <option value="cats-ok">Cats OK</option>
                <option value="all-pets">All Pets Welcome</option>
                <option value="case-by-case">Case by Case</option>
              </select>
            </FormField>
            <FormField label="Key Details / Notes">
              <textarea {...register("notes")} placeholder="Special features, restrictions, etc." className={textareaClass} />
            </FormField>
          </>
        )}
      </OpportunityFormWrapper>
    </div>
  );
}
