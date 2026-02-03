import { FileCheck, Network, MapPin, Search, Landmark } from 'lucide-react';

export function Services() {
  const services = [
    {
      icon: FileCheck,
      title: 'Entitlement & Planning Strategy',
      description: 'Leverage firsthand experience representing projects before the Planning Board to navigate the island\'s most rigorous regulatory hurdles.'
    },
    {
      icon: Network,
      title: 'The Development Ecosystem',
      description: 'Direct access to a vetted network of island attorneys, engineers, and architects to streamline the pre-construction phase and mitigate risk.'
    },
    {
      icon: MapPin,
      title: 'Site Feasibility & Repurposing',
      description: 'From residential subdivisions to brownfield conversions, I identify the hidden potential in complex sites that others overlook.'
    },
    {
      icon: Landmark,
      title: 'Strategic Land Use & Acquisition',
      description: 'I advise on land acquisition strategy, zoning optimization, and long-term asset positioning for developers and investors.'
    },
    {
      icon: Search,
      title: 'Buyer & Seller Advisory',
      description: 'I evaluate properties, advise on timing and structure, and negotiate terms that protect your position—whether buying or selling.'
    }
  ];

  return (
    <section id="services" className="py-24 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-left mb-16">
          <h2 className="mb-4">Where Judgment Makes the Difference</h2>
          <p className="text-xl max-w-2xl opacity-75">
            Access is common. Knowing how and when to act is not.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div key={index} className="group">
                <div className="mb-6">
                  <div className="w-14 h-14 bg-[#E8E8E8] rounded-sm flex items-center justify-center group-hover:bg-[#C9A227] transition-colors">
                    <Icon className="w-7 h-7 text-[#1A2A3A] group-hover:text-white transition-colors" />
                  </div>
                </div>
                <h3 className="mb-3 text-[#1A2A3A]">{service.title}</h3>
                <p className="opacity-75 leading-relaxed">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
