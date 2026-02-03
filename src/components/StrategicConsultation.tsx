"use client";

import { useState } from 'react';
import { ArrowRight, ArrowLeft, Home, Building2, Castle, TrendingUp, CheckCircle } from 'lucide-react';

type ObjectiveType = 'residential' | 'development' | 'compound' | 'investment' | null;

export function StrategicConsultation() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [objective, setObjective] = useState<ObjectiveType>(null);
  const [technicalNeeds, setTechnicalNeeds] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add actual form submission logic here
    setSubmitted(true);
  };

  const objectives = [
    {
      id: 'residential' as const,
      icon: Home,
      title: 'Residential Sanctuary',
      description: 'A primary or seasonal home for personal use',
    },
    {
      id: 'development' as const,
      icon: Building2,
      title: 'Development / Subdivision Potential',
      description: 'Land or properties with buildable opportunities',
    },
    {
      id: 'compound' as const,
      icon: Castle,
      title: 'Compound Expansion / Historic Restoration',
      description: 'Multi-structure estates or preservation projects',
    },
    {
      id: 'investment' as const,
      icon: TrendingUp,
      title: 'Strategic Investment / Portfolio Diversification',
      description: 'Asset-focused acquisition for long-term value',
    },
  ];

  const handleObjectiveSelect = (type: ObjectiveType) => {
    setObjective(type);
    setStep(2);
  };

  const handleTechnicalSubmit = () => {
    setStep(3);
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const objectiveLabels: Record<NonNullable<ObjectiveType>, string> = {
    residential: 'Residential Sanctuary',
    development: 'Development / Subdivision',
    compound: 'Compound / Historic Restoration',
    investment: 'Strategic Investment',
  };

  return (
    <section id="consultation" className="py-24 bg-[#FAF8F5]">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[#C9A227] text-sm uppercase tracking-[0.3em] mb-4 font-medium">
            Private Advisory · Est. 1931
          </p>
          <h2 className="text-[#1A2A3A] text-4xl md:text-5xl mb-6 font-serif tracking-tight">
            Refined Acquisition.
          </h2>
          <p className="text-xl text-[#1A2A3A]/70 max-w-3xl mx-auto leading-relaxed">
            Nantucket's most significant opportunities often exist outside the public domain. For buyers seeking a strategic approach to acquisition—leveraging decades of planning, development, and fiscal expertise—please share your requirements for a private consultation.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-3 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step >= s
                    ? 'bg-[#C9A227] text-white'
                    : 'bg-[#E8E8E8] text-[#1A2A3A]/40'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-px transition-all ${
                    step > s ? 'bg-[#C9A227]' : 'bg-[#E8E8E8]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-white border border-[#D6C8B0] rounded-sm p-8 md:p-12">
          {/* Step 1: The Objective */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-[#1A2A3A] text-2xl font-serif mb-2">
                  What is your primary focus for this acquisition?
                </h3>
                <p className="text-[#1A2A3A]/60 text-sm uppercase tracking-wider">
                  Select one to continue
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {objectives.map((obj) => {
                  const Icon = obj.icon;
                  return (
                    <button
                      key={obj.id}
                      type="button"
                      onClick={() => handleObjectiveSelect(obj.id)}
                      className="flex items-start gap-4 p-6 border-2 border-[#E8E8E8] rounded-sm hover:border-[#C9A227] hover:bg-[#C9A227]/5 transition-all group text-left"
                    >
                      <div className="w-12 h-12 bg-[#E8E8E8] rounded-sm flex items-center justify-center group-hover:bg-[#C9A227]/20 transition-colors flex-shrink-0">
                        <Icon className="w-6 h-6 text-[#1A2A3A] group-hover:text-[#C9A227] transition-colors" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1A2A3A] mb-1">{obj.title}</p>
                        <p className="text-sm text-[#1A2A3A]/60">{obj.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Technical Needs */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-2 hover:bg-[#E8E8E8] rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-[#1A2A3A]" />
                </button>
                <div>
                  <p className="text-sm text-[#1A2A3A]/60 uppercase tracking-wider">Selected Focus</p>
                  <p className="font-medium text-[#1A2A3A]">{objective && objectiveLabels[objective]}</p>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-[#1A2A3A] text-2xl font-serif mb-2">
                  Are there specific planning or zoning complexities we should consider?
                </h3>
                <p className="text-[#1A2A3A]/60 text-sm">
                  Share any regulatory, environmental, or structural considerations
                </p>
              </div>

              <div>
                <textarea
                  value={technicalNeeds}
                  onChange={(e) => setTechnicalNeeds(e.target.value)}
                  placeholder="Examples: subdivision potential, historic district requirements, wetland setbacks, HDC approvals, septic limitations..."
                  className="w-full h-40 px-0 py-4 border-0 border-b-2 border-[#E8E8E8] focus:border-[#C9A227] focus:outline-none transition-colors resize-none bg-transparent text-[#1A2A3A] placeholder:text-[#1A2A3A]/40"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleTechnicalSubmit}
                  className="inline-flex items-center gap-2 bg-[#C9A227] text-white px-8 py-4 rounded-md hover:bg-[#B89220] transition-colors group"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Contact Information */}
          {step === 3 && !submitted && (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-2 hover:bg-[#E8E8E8] rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-[#1A2A3A]" />
                </button>
                <div>
                  <p className="text-sm text-[#1A2A3A]/60 uppercase tracking-wider">Almost there</p>
                  <p className="font-medium text-[#1A2A3A]">Your contact information</p>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-[#1A2A3A] text-2xl font-serif mb-2">
                  How may I reach you?
                </h3>
                <p className="text-[#1A2A3A]/60 text-sm">
                  I personally review each inquiry within 24 hours
                </p>
              </div>

              <div className="space-y-6 max-w-md mx-auto">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#1A2A3A]/60 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-0 py-3 border-0 border-b-2 border-[#E8E8E8] focus:border-[#C9A227] focus:outline-none transition-colors bg-transparent text-[#1A2A3A] placeholder:text-[#1A2A3A]/40"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#1A2A3A]/60 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-0 py-3 border-0 border-b-2 border-[#E8E8E8] focus:border-[#C9A227] focus:outline-none transition-colors bg-transparent text-[#1A2A3A] placeholder:text-[#1A2A3A]/40"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#1A2A3A]/60 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="w-full px-0 py-3 border-0 border-b-2 border-[#E8E8E8] focus:border-[#C9A227] focus:outline-none transition-colors bg-transparent text-[#1A2A3A] placeholder:text-[#1A2A3A]/40"
                    placeholder="(508) 555-0123"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-[#C9A227] text-white px-8 py-5 rounded-md hover:bg-[#B89220] transition-colors flex items-center justify-center gap-2 group text-lg"
                >
                  <span>Request a Preliminary Consultation</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <p className="text-center text-sm text-[#1A2A3A]/50 italic">
                All inquiries are handled with complete confidentiality.
              </p>
            </form>
          )}

          {/* Confirmation State */}
          {submitted && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#C9A227]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-[#C9A227]" />
              </div>
              <h3 className="text-[#1A2A3A] text-2xl font-serif mb-4">
                Inquiry Received
              </h3>
              <p className="text-[#1A2A3A]/70 text-lg max-w-md mx-auto mb-6">
                Your inquiry has been received. Our office will reach out shortly for a private consultation.
              </p>
              <p className="text-[#1A2A3A]/50 text-sm italic">
                Typical response time: within 24 hours
              </p>
            </div>
          )}
        </div>

        {/* 90-Year Network Note */}
        <p className="text-center text-sm text-[#1A2A3A]/60 mt-8">
          Leveraging 90 years of institutional relationships and off-market access.
        </p>
      </div>
    </section>
  );
}
