import { Search, TrendingUp, Users, Award, Home, FileText } from 'lucide-react';

export function Services() {
  const services = [
    {
      icon: Search,
      title: 'Buyer Representation',
      description: 'Exclusive access to off-market listings and pre-market opportunities through our extensive island network.'
    },
    {
      icon: TrendingUp,
      title: 'Seller Marketing',
      description: 'Strategic pricing, luxury staging coordination, and multi-channel marketing that reaches qualified buyers.'
    },
    {
      icon: Users,
      title: 'Relocation Services',
      description: 'White-glove concierge service connecting you with trusted island resources, from contractors to yacht clubs.'
    },
    {
      icon: Award,
      title: 'Investment Analysis',
      description: 'Comprehensive market analysis and rental income projections to maximize your Nantucket investment.'
    },
    {
      icon: Home,
      title: 'Property Management',
      description: 'Trusted referrals to premier property management partners for seamless seasonal or year-round care.'
    },
    {
      icon: FileText,
      title: 'Estate Planning',
      description: 'Coordination with legal and tax advisors to navigate complex estate transitions and generational wealth.'
    }
  ];

  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-left mb-16">
          <h2 className="mb-4">A Complete Service Experience</h2>
          <p className="text-xl max-w-2xl opacity-75">
            From first consultation to closing and beyond, every detail is managed with precision and care.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div key={index} className="group">
                <div className="mb-6">
                  <div className="w-14 h-14 bg-[#E8E8E8] rounded-sm flex items-center justify-center group-hover:bg-[#3A5C7E] transition-colors">
                    <Icon className="w-7 h-7 text-[#3A5C7E] group-hover:text-white transition-colors" />
                  </div>
                </div>
                <h3 className="mb-3 text-[#0A1A2F]">{service.title}</h3>
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
