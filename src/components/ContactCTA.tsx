"use client";

import { useState } from 'react';
import { Mail, Phone, Instagram, Home, TrendingUp, Key, ArrowLeft } from 'lucide-react';

type InterestType = 'buy' | 'sell' | 'rent' | null;

export function ContactCTA() {
  const [step, setStep] = useState<1 | 2>(1);
  const [interest, setInterest] = useState<InterestType>(null);

  const handleInterestSelect = (type: InterestType) => {
    setInterest(type);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const interestLabels: Record<NonNullable<InterestType>, string> = {
    buy: 'Buying a Property',
    sell: 'Selling a Property',
    rent: 'Renting a Property',
  };

  return (
    <section className="py-24 bg-[#FAF8F5]">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="bg-[#1A2A3A] rounded-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Column - CTA */}
            <div className="p-12 lg:p-16">
              <h2 className="text-white mb-6">Request a Private Market Discussion</h2>
              <p className="text-white/80 text-lg mb-4 leading-relaxed">
                Whether you're ready to buy, sell, or navigating a complex decision, I'm here to provide confidential guidance.
              </p>
              <p className="text-white/60 text-sm mb-8 italic">
                Best suited for clients making meaningful decisions in the next 6–24 months.
              </p>
              
              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-4 text-white/90">
                  <Phone className="w-5 h-5 text-[#C9A227]" />
                  <a href="tel:+15089901234" className="hover:text-[#C9A227] transition-colors">
                    (508) 990-1234
                  </a>
                </div>
                <div className="flex items-center gap-4 text-white/90">
                  <Mail className="w-5 h-5 text-[#C9A227]" />
                  <a href="mailto:stephen@nantuckethouses.com" className="hover:text-[#C9A227] transition-colors">
                    stephen@nantuckethouses.com
                  </a>
                </div>
                <div className="flex items-center gap-4 text-white/90">
                  <Instagram className="w-5 h-5 text-[#C9A227]" />
                  <a href="https://instagram.com/stephenmaury_nantucketbroker" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A227] transition-colors">
                    @stephenmaury_nantucketbroker
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column - Multi-Step Form */}
            <div className="bg-white p-12 lg:p-16">
              {step === 1 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[#1A2A3A] text-xl mb-2">What decision are you trying to make?</h3>
                    <p className="text-[#1A2A3A]/60 text-sm">Select one to get started</p>
                  </div>
                  
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => handleInterestSelect('buy')}
                      className="w-full flex items-center gap-4 p-6 border-2 border-[#E8E8E8] rounded-sm hover:border-[#C9A227] hover:bg-[#C9A227]/5 transition-all group"
                    >
                      <div className="w-12 h-12 bg-[#E8E8E8] rounded-full flex items-center justify-center group-hover:bg-[#C9A227]/20 transition-colors">
                        <Home className="w-6 h-6 text-[#1A2A3A] group-hover:text-[#C9A227] transition-colors" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-[#1A2A3A]">I'm considering a purchase</p>
                        <p className="text-sm text-[#1A2A3A]/60">Evaluating opportunities on Nantucket</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInterestSelect('sell')}
                      className="w-full flex items-center gap-4 p-6 border-2 border-[#E8E8E8] rounded-sm hover:border-[#C9A227] hover:bg-[#C9A227]/5 transition-all group"
                    >
                      <div className="w-12 h-12 bg-[#E8E8E8] rounded-full flex items-center justify-center group-hover:bg-[#C9A227]/20 transition-colors">
                        <TrendingUp className="w-6 h-6 text-[#1A2A3A] group-hover:text-[#C9A227] transition-colors" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-[#1A2A3A]">I'm considering a sale</p>
                        <p className="text-sm text-[#1A2A3A]/60">Evaluating timing and positioning</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInterestSelect('rent')}
                      className="w-full flex items-center gap-4 p-6 border-2 border-[#E8E8E8] rounded-sm hover:border-[#C9A227] hover:bg-[#C9A227]/5 transition-all group"
                    >
                      <div className="w-12 h-12 bg-[#E8E8E8] rounded-full flex items-center justify-center group-hover:bg-[#C9A227]/20 transition-colors">
                        <Key className="w-6 h-6 text-[#1A2A3A] group-hover:text-[#C9A227] transition-colors" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-[#1A2A3A]">I have a complex decision</p>
                        <p className="text-sm text-[#1A2A3A]/60">Estate, timing, or structure questions</p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <form className="space-y-5">
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="p-2 hover:bg-[#E8E8E8] rounded-full transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-[#1A2A3A]" />
                    </button>
                    <div>
                      <p className="text-sm text-[#1A2A3A]/60">You selected</p>
                      <p className="font-medium text-[#1A2A3A]">{interest && interestLabels[interest]}</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[#1A2A3A] mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="w-full px-4 py-3 border border-[#E8E8E8] rounded-sm focus:outline-none focus:border-[#C9A227] transition-colors"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#1A2A3A] mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-3 border border-[#E8E8E8] rounded-sm focus:outline-none focus:border-[#C9A227] transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-[#1A2A3A] mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      className="w-full px-4 py-3 border border-[#E8E8E8] rounded-sm focus:outline-none focus:border-[#C9A227] transition-colors"
                      placeholder="(508) 555-0123"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#C9A227] text-white px-8 py-4 rounded-md hover:bg-[#B89220] transition-colors"
                  >
                    Request Discussion
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
