import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E8E8E8]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Image
              src="/Nantucket Houses_Master_logo.png"
              alt="Nantucket Houses"
              width={180}
              height={48}
              priority
              className="h-12 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#properties" className="text-[#1A2A3A] hover:text-[#3A5C7E] transition-colors">
              Properties
            </a>
            <a href="#market-insights" className="text-[#1A2A3A] hover:text-[#3A5C7E] transition-colors">
              Market Insights
            </a>
            <a href="#services" className="text-[#1A2A3A] hover:text-[#3A5C7E] transition-colors">
              Services
            </a>
            <a href="#about" className="text-[#1A2A3A] hover:text-[#3A5C7E] transition-colors">
              About
            </a>
            <button className="bg-[#C9A227] text-white px-6 py-2.5 rounded-md hover:bg-[#B89220] transition-colors">
              Contact
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-[#1A2A3A]"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-6 space-y-4">
            <a href="#properties" className="block text-[#1A2A3A] hover:text-[#3A5C7E] transition-colors">
              Properties
            </a>
            <a href="#market-insights" className="block text-[#1A2A3A] hover:text-[#3A5C7E] transition-colors">
              Market Insights
            </a>
            <a href="#services" className="block text-[#1A2A3A] hover:text-[#3A5C7E] transition-colors">
              Services
            </a>
            <a href="#about" className="block text-[#1A2A3A] hover:text-[#3A5C7E] transition-colors">
              About
            </a>
            <button className="w-full bg-[#C9A227] text-white px-6 py-2.5 rounded-md hover:bg-[#B89220] transition-colors">
              Contact
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
