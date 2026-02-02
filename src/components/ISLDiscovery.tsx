import { CheckCircle } from 'lucide-react';

export function ISLDiscovery() {
  const auditElements = [
    'Grandfathered rental rights documentation',
    'Pre-approved renovation plans and contractor relationships',
    'Coastal protection certifications and insurance clarity',
    'Title clarity and easement documentation',
    'Property tax optimization opportunities',
    'Strategic staging and de-personalization plan'
  ];

  return (
    <section className="py-20 bg-[#E8E8E8]">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        {/* Section Label */}
        <div className="mb-12">
          <div className="w-16 h-1 bg-[#D6C8B0] mb-6"></div>
          <h3 className="text-[#0A1A2F] mb-8">The Discovery</h3>
        </div>

        {/* Main Content */}
        <div className="prose prose-lg max-w-none mb-12">
          <p className="text-xl leading-relaxed mb-6 opacity-90">
            I spent the last year developing a system to "De-Friction" a Nantucket sale before the home even hits the market.
          </p>
          
          <p className="text-xl leading-relaxed mb-6 opacity-90">
            I call it the <span className="font-semibold text-[#0A1A2F]">Island Integrity Audit</span>.
          </p>
          
          <p className="text-xl leading-relaxed mb-8 opacity-90">
            It's a way to package your home so it bypasses the buyer's fear and highlights the "Hidden Equity" that standard appraisals miss—things like grandfathered rental rights, pre-approved renovation plans, or coastal protection certifications.
          </p>
        </div>

        {/* Audit Elements Box */}
        <div className="bg-white p-10 rounded-sm border-2 border-[#D6C8B0]">
          <h4 className="text-2xl text-[#0A1A2F] mb-8 text-center">
            What's Included in the Island Integrity Audit
          </h4>
          
          <div className="space-y-4">
            {auditElements.map((element, index) => (
              <div key={index} className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-[#A8D5C2] flex-shrink-0 mt-0.5" />
                <p className="text-lg opacity-90">{element}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Supporting Image */}
        <div className="mt-12 rounded-sm overflow-hidden border border-[#D6C8B0]">
          <img
            src="https://images.unsplash.com/photo-1681505526188-b05e68c77582?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFsJTIwZXN0YXRlJTIwY29udHJhY3QlMjBzaWduaW5nfGVufDF8fHx8MTc3MDA2MTUzNXww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Property documentation and planning"
            className="w-full h-80 object-cover"
          />
        </div>
      </div>
    </section>
  );
}
