import { Bed, Bath, Square, MapPin } from 'lucide-react';

export function FeaturedProperties() {
  const properties = [
    {
      image: 'https://images.unsplash.com/photo-1769737122085-97b1ee5ab104?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjb2FzdGFsJTIwaG9tZSUyMGludGVyaW9yfGVufDF8fHx8MTcwNDA0NDcxMHww&ixlib=rb-4.1.0&q=80&w=1080',
      location: 'Siasconset',
      price: '$4,950,000',
      beds: 5,
      baths: 4.5,
      sqft: '4,200',
      status: 'Active'
    },
    {
      image: 'https://images.unsplash.com/photo-1731268272804-11233a119600?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxOYW50dWNrZXQlMjBoYXJib3IlMjBib2F0c3xlbnwxfHx8fDE3MDA0NDcxMHww&ixlib=rb-4.1.0&q=80&w=1080',
      location: 'Monomoy',
      price: '$6,200,000',
      beds: 6,
      baths: 5,
      sqft: '5,100',
      status: 'New Listing'
    },
    {
      image: 'https://images.unsplash.com/photo-1768760534929-c2fad3d321ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2FzdGFsJTIwcmVhbCUyMGVzdGF0ZSUyMG1vZGVybnxlbnwxfHx8fDE3MDA0NDcxMXww&ixlib=rb-4.1.0&q=80&w=1080',
      location: 'Town Center',
      price: '$3,750,000',
      beds: 4,
      baths: 3.5,
      sqft: '3,400',
      status: 'Under Agreement'
    }
  ];

  return (
    <section id="properties" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-end mb-16">
          <div className="text-left">
            <h2 className="mb-4">Featured Properties</h2>
            <p className="text-xl max-w-2xl opacity-75">
              Curated selections from our exclusive portfolio of Nantucket's finest homes.
            </p>
          </div>
          <button className="hidden md:block text-[#3A5C7E] hover:text-[#2d4860] transition-colors border-b-2 border-[#3A5C7E] pb-1">
            View All Properties
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property, index) => (
            <div key={index} className="group cursor-pointer">
              <div className="relative mb-6 overflow-hidden rounded-sm">
                <img
                  src={property.image}
                  alt={`Property in ${property.location}`}
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-sm">
                  <span className="text-sm font-medium text-[#0A1A2F]">{property.status}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#3A5C7E]">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm tracking-wide">{property.location}</span>
                </div>
                
                <h3 className="text-[#0A1A2F]">{property.price}</h3>
                
                <div className="flex items-center gap-6 pt-4 border-t border-[#E8E8E8] text-sm opacity-75">
                  <div className="flex items-center gap-2">
                    <Bed className="w-4 h-4" />
                    <span>{property.beds} Beds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="w-4 h-4" />
                    <span>{property.baths} Baths</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="w-4 h-4" />
                    <span>{property.sqft} SF</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center md:hidden">
          <button className="text-[#3A5C7E] hover:text-[#2d4860] transition-colors border-b-2 border-[#3A5C7E] pb-1">
            View All Properties
          </button>
        </div>
      </div>
    </section>
  );
}
