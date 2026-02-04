"use client";

import { useState } from 'react';
import { ArrowRight, Lock, Shield, FileText, Loader2, CheckCircle } from 'lucide-react';

export function ISLCTA() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    
    const data = {
      name: `${firstName} ${lastName}`.trim(),
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || undefined,
      propertyType: formData.get('propertyLocation') as string || undefined,
      timeline: formData.get('timeline') as string || undefined,
      source: 'Property Friction Audit Form',
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('Failed to submit');
      }

      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again or call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: Lock,
      text: 'Completely confidential - no obligation'
    },
    {
      icon: Shield,
      text: 'No listing agreement required'
    },
    {
      icon: FileText,
      text: 'Data-driven analysis, not a sales pitch'
    }
  ];

  return (
    <section className="py-20 bg-[#0A1A2F]">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        {/* Headline */}
        <div className="text-center mb-12">
          <h2 className="text-white mb-6">
            Request Your Property Friction Audit
          </h2>
          <p className="text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
            A confidential, data-driven analysis of your property's position in the 2026 Nantucket market—with zero pressure and no obligation.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-sm p-10 mb-8">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#C9A227]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-[#C9A227]" />
              </div>
              <h3 className="text-[#0A1A2F] text-2xl font-serif mb-4">
                Audit Request Received
              </h3>
              <p className="text-[#0A1A2F]/70 text-lg max-w-md mx-auto mb-4">
                I'll personally review your property details and reach out within 24 hours.
              </p>
              <p className="text-[#0A1A2F]/50 text-sm italic">
                Your information is kept strictly confidential.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-[#0A1A2F] mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-[#E8E8E8] rounded-sm focus:outline-none focus:border-[#3A5C7E] transition-colors disabled:opacity-50"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-[#0A1A2F] mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-[#E8E8E8] rounded-sm focus:outline-none focus:border-[#3A5C7E] transition-colors disabled:opacity-50"
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#0A1A2F] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-[#E8E8E8] rounded-sm focus:outline-none focus:border-[#3A5C7E] transition-colors disabled:opacity-50"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#0A1A2F] mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-[#E8E8E8] rounded-sm focus:outline-none focus:border-[#3A5C7E] transition-colors disabled:opacity-50"
                  placeholder="(508) 555-0123"
                />
              </div>

              <div>
                <label htmlFor="propertyLocation" className="block text-sm font-medium text-[#0A1A2F] mb-2">
                  Property Location (Optional)
                </label>
                <select
                  id="propertyLocation"
                  name="propertyLocation"
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-[#E8E8E8] rounded-sm focus:outline-none focus:border-[#3A5C7E] transition-colors disabled:opacity-50"
                >
                  <option value="">Select a location...</option>
                  <option>Siasconset</option>
                  <option>Monomoy</option>
                  <option>Town Center</option>
                  <option>Madaket</option>
                  <option>Surfside</option>
                  <option>Cliff</option>
                  <option>Brant Point</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="timeline" className="block text-sm font-medium text-[#0A1A2F] mb-2">
                  Potential Sale Timeline
                </label>
                <select
                  id="timeline"
                  name="timeline"
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-[#E8E8E8] rounded-sm focus:outline-none focus:border-[#3A5C7E] transition-colors disabled:opacity-50"
                >
                  <option>Within 3 months</option>
                  <option>3-6 months</option>
                  <option>6-12 months</option>
                  <option>12+ months</option>
                  <option>Just exploring</option>
                </select>
              </div>

              {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#3A5C7E] text-white px-8 py-4 rounded-md hover:bg-[#2d4860] transition-colors flex items-center justify-center gap-3 group text-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Request Your Confidential Audit</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="space-y-3">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="flex items-center justify-center gap-3 text-white/70 text-sm">
                <Icon className="w-4 h-4 text-[#A8D5C2]" />
                <span>{benefit.text}</span>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 pt-8 border-t border-white/20">
          <p className="text-center text-sm text-white/60 leading-relaxed">
            This is not a high-pressure sales pitch. It is a data-driven analysis of your property's position in the 2026 market. Your information will be kept strictly confidential and will never be shared with third parties.
          </p>
        </div>
      </div>
    </section>
  );
}
