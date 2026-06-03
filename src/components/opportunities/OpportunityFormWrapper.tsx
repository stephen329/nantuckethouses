"use client";

import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import type { OpportunityCategory } from "@/types";

type Props = {
  category: OpportunityCategory;
  title: string;
  subtitle: string;
  submitLabel: string;
  children: (props: { register: (name: string) => { name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void } }) => React.ReactNode;
};

export function OpportunityFormWrapper({ category, title, subtitle, submitLabel, children }: Props) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const register = (fieldName: string) => ({
    name: fieldName,
    value: formData[fieldName] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [fieldName]: e.target.value }));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, data: formData, name, email, phone }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Submission failed");

      setStatus("success");

      // Track Klaviyo event
      if (typeof window !== "undefined" && (window as any).klaviyo) {
        (window as any).klaviyo.push(["track", "Opportunity_Submitted", {
          category,
          email,
          name,
        }]);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--privet-green)]/10 mb-6">
          <CheckCircle className="w-8 h-8 text-[var(--privet-green)]" />
        </div>
        <h2 className="text-[var(--atlantic-navy)] text-2xl mb-3">Thank You</h2>
        <p className="text-[var(--nantucket-gray)] text-sm leading-relaxed">
          Stephen has been notified and will review your submission personally within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Info */}
        <div className="brand-surface p-6">
          <h3 className="text-sm font-semibold text-[var(--atlantic-navy)] mb-4 font-sans">
            Your Contact Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--atlantic-navy)]/60 mb-1 font-sans">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="brand-input px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--atlantic-navy)]/60 mb-1 font-sans">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="brand-input px-3 py-2.5 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[var(--atlantic-navy)]/60 mb-1 font-sans">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="brand-input px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Form-specific Fields */}
        <div className="brand-surface p-6">
          <h3 className="text-sm font-semibold text-[var(--atlantic-navy)] mb-4 font-sans">
            Details
          </h3>
          <div className="space-y-4">
            {children({ register })}
          </div>
        </div>

        {errorMsg && (
          <p className="text-sm text-red-600">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full py-3 brand-btn brand-btn-secondary text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            submitLabel
          )}
        </button>
      </form>
    </div>
  );
}

/** Reusable form field components */
export function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--atlantic-navy)]/60 mb-1 font-sans">
        {label} {required && "*"}
      </label>
      {children}
    </div>
  );
}

export const inputClass = "brand-input px-3 py-2.5 text-sm";
export const textareaClass = "brand-input px-3 py-2.5 text-sm min-h-[80px]";
