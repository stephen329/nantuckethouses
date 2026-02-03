import { Award, Users, TrendingUp } from 'lucide-react';

export function About() {
  const achievements = [
    {
      icon: Award,
      value: '$250M+',
      label: 'Advised Across Buyer & Seller Decisions'
    },
    {
      icon: Users,
      value: 'Majority',
      label: 'of Clients Come Through Referral'
    },
    {
      icon: TrendingUp,
      value: 'Decades',
      label: 'of Market Cycles Navigated'
    }
  ];

  const complexityAreas = [
    'Off-market negotiations',
    'Zoning and subdivision complexity',
    'Multi-generational ownership decisions',
    'Hold vs. sell timing',
    'Privacy-sensitive transactions'
  ];

  return (
    <section id="about" className="py-24 bg-[#E8E8E8]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Philosophy Quote */}
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <blockquote className="text-2xl md:text-3xl font-serif italic text-[#1A2A3A] leading-relaxed">
            "Most mistakes in Nantucket real estate aren't about price—they're about timing, structure, and incomplete information."
          </blockquote>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="mb-6">Experience That Makes the Difference</h2>
            <div className="space-y-4 text-lg leading-relaxed opacity-80">
              <p>
                For over 15 years, I've had the privilege of advising families through some of Nantucket's most significant real estate decisions.
              </p>
              <p>
                My approach is built on three pillars: <span className="font-semibold text-[#1A2A3A]">independent judgment</span>, <span className="font-semibold text-[#1A2A3A]">deep island relationships</span>, and <span className="font-semibold text-[#1A2A3A]">discretion</span> in every transaction.
              </p>
              <p className="italic opacity-70">
                A significant portion of my advisory work is never made public.
              </p>
            </div>

            {/* When the Market Isn't Clear */}
            <div className="mt-10 p-6 bg-white rounded-sm border border-[#D6C8B0]">
              <h3 className="text-[#1A2A3A] mb-4 text-xl">When the Market Isn't Clear</h3>
              <p className="text-sm opacity-70 mb-4">I advise on decisions where standard market data falls short:</p>
              <ul className="space-y-2">
                {complexityAreas.map((area, index) => (
                  <li key={index} className="flex items-center gap-3 text-[#1A2A3A]">
                    <span className="w-1.5 h-1.5 bg-[#C9A227] rounded-full flex-shrink-0"></span>
                    {area}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <button className="bg-[#C9A227] text-white px-8 py-4 rounded-md hover:bg-[#B89220] transition-colors">
                Schedule a Confidential Discussion
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <div key={index} className="bg-white p-8 border border-[#D6C8B0] rounded-sm flex items-center gap-6">
                  <Icon className="w-10 h-10 text-[#C9A227] flex-shrink-0" />
                  <div>
                    <h3 className="text-[#1A2A3A] mb-1">{achievement.value}</h3>
                    <p className="text-sm opacity-75">{achievement.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
