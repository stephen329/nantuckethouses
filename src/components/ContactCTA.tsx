import { Mail, Phone, Instagram } from 'lucide-react';

export function ContactCTA() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="bg-[#0A1A2F] rounded-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Column - CTA */}
            <div className="p-12 lg:p-16">
              <h2 className="text-white mb-6">Let's Start the Conversation</h2>
              <p className="text-white/80 text-lg mb-8 leading-relaxed">
                Whether you're ready to buy, sell, or simply exploring the Nantucket market, I'm here to provide insights and guidance.
              </p>
              
              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-4 text-white/90">
                  <Phone className="w-5 h-5 text-[#D6C8B0]" />
                  <a href="tel:+15089901234" className="hover:text-[#D6C8B0] transition-colors">
                    (508) 990-1234
                  </a>
                </div>
                <div className="flex items-center gap-4 text-white/90">
                  <Mail className="w-5 h-5 text-[#D6C8B0]" />
                  <a href="mailto:stephen@nantuckethouses.com" className="hover:text-[#D6C8B0] transition-colors">
                    stephen@nantuckethouses.com
                  </a>
                </div>
                <div className="flex items-center gap-4 text-white/90">
                  <Instagram className="w-5 h-5 text-[#D6C8B0]" />
                  <a href="https://instagram.com/stephenmaury_nantucketbroker" target="_blank" rel="noopener noreferrer" className="hover:text-[#D6C8B0] transition-colors">
                    @stephenmaury_nantucketbroker
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="bg-white p-12 lg:p-16">
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#0A1A2F] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 border border-[#E8E8E8] rounded-sm focus:outline-none focus:border-[#3A5C7E] transition-colors"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#0A1A2F] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 border border-[#E8E8E8] rounded-sm focus:outline-none focus:border-[#3A5C7E] transition-colors"
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
                    className="w-full px-4 py-3 border border-[#E8E8E8] rounded-sm focus:outline-none focus:border-[#3A5C7E] transition-colors"
                    placeholder="(508) 555-0123"
                  />
                </div>

                <div>
                  <label htmlFor="interest" className="block text-sm font-medium text-[#0A1A2F] mb-2">
                    I'm interested in...
                  </label>
                  <select
                    id="interest"
                    className="w-full px-4 py-3 border border-[#E8E8E8] rounded-sm focus:outline-none focus:border-[#3A5C7E] transition-colors"
                  >
                    <option>Buying a Property</option>
                    <option>Selling a Property</option>
                    <option>Market Analysis</option>
                    <option>Investment Opportunities</option>
                    <option>General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-[#0A1A2F] mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-4 py-3 border border-[#E8E8E8] rounded-sm focus:outline-none focus:border-[#3A5C7E] transition-colors resize-none"
                    placeholder="Tell me about your goals..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#3A5C7E] text-white px-8 py-4 rounded-md hover:bg-[#2d4860] transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
