import { Instagram, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#1A2A3A] text-white py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <h3 className="text-white mb-4">NantucketHouses</h3>
            <p className="text-white/70 leading-relaxed mb-6 max-w-md">
              Your trusted partner for exceptional real estate experiences on Nantucket Island. Combining proprietary market insights with decades of local expertise.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/stephenmaury_nantucketbroker"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-sm flex items-center justify-center hover:bg-[#C9A227] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-sm flex items-center justify-center hover:bg-[#C9A227] transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:stephen@nantuckethouses.com"
                className="w-10 h-10 bg-white/10 rounded-sm flex items-center justify-center hover:bg-[#C9A227] transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white mb-4 text-sm uppercase tracking-wider font-semibold">Quick Links</h4>
            <ul className="space-y-3 text-white/70">
              <li>
                <a href="#services" className="hover:text-[#D6C8B0] transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#D6C8B0] transition-colors">
                  About Stephen
                </a>
              </li>
              <li>
                <a href="https://calendly.com/stephen-maury/30min" target="_blank" rel="noopener noreferrer" className="hover:text-[#D6C8B0] transition-colors">
                  Request Consultation
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white mb-4 text-sm uppercase tracking-wider font-semibold">Resources</h4>
            <ul className="space-y-3 text-white/70">
              <li>
                <a href="#" className="hover:text-[#D6C8B0] transition-colors">
                  Buyer's Guide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#D6C8B0] transition-colors">
                  Seller's Guide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#D6C8B0] transition-colors">
                  Neighborhood Guide
                </a>
              </li>
              <li>
                <a href="https://calendly.com/stephen-maury/30min" target="_blank" rel="noopener noreferrer" className="hover:text-[#D6C8B0] transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
            <p>© 2026 NantucketHouses.com. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#D6C8B0] transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-[#D6C8B0] transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-[#D6C8B0] transition-colors">
                Accessibility
              </a>
            </div>
          </div>
          <p className="text-xs text-white/40 mt-6 text-center md:text-left">
            Licensed Real Estate Broker | Congdon & Coleman Real Estate | Equal Housing Opportunity
          </p>
        </div>
      </div>
    </footer>
  );
}
