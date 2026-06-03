"use client";

import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";
import { OpportunityFormWrapper, FormField, inputClass, textareaClass } from "@/components/opportunities/OpportunityFormWrapper";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Opportunity Desk", href: "/opportunities" }, { label: "Services" }]} />
          <h1 className="text-white text-2xl sm:text-3xl">Services Offered or Needed</h1>
          <p className="text-white/50 mt-1 text-sm">Post a service or request one — Stephen&apos;s vetted network.</p>
        </div>
      </section>

      <OpportunityFormWrapper category="services" title="Services" subtitle="Offer or request a service" submitLabel="Submit to Stephen's Desk">
        {({ register }) => (
          <>
            <FormField label="I am a..." required>
              <select {...register("role")} required className={inputClass}>
                <option value="">Select...</option>
                <option value="provider">Service Provider</option>
                <option value="seeker">Property Owner Seeking Service</option>
              </select>
            </FormField>
            <FormField label="Service Type" required>
              <select {...register("serviceType")} required className={inputClass}>
                <option value="">Select...</option>
                <option value="architect">Architect</option>
                <option value="general-contractor">General Contractor</option>
                <option value="landscape">Landscape Design</option>
                <option value="property-management">Property Management</option>
                <option value="interior-design">Interior Design</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="painting">Painting</option>
                <option value="cleaning">Cleaning / Housekeeping</option>
                <option value="caretaking">Caretaking</option>
                <option value="other">Other</option>
              </select>
            </FormField>
            <FormField label="Location Served">
              <select {...register("location")} className={inputClass}>
                <option value="island-wide">Island-Wide</option>
                {NEIGHBORHOODS.filter(n => n !== "Other").map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </FormField>
            <FormField label="Availability">
              <input type="text" {...register("availability")} placeholder="e.g., Immediate, Summer 2026, Year-round" className={inputClass} />
            </FormField>
            <FormField label="Short Description" required>
              <textarea {...register("description")} required maxLength={280} placeholder="Brief description of your service or what you need (280 chars max)" className={textareaClass} />
            </FormField>
          </>
        )}
      </OpportunityFormWrapper>
    </div>
  );
}
