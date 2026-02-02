import { Award, Users, TrendingUp, Heart } from 'lucide-react';

export function About() {
  const achievements = [
    {
      icon: Award,
      value: '$250M+',
      label: 'Career Sales Volume'
    },
    {
      icon: Users,
      value: '200+',
      label: 'Families Served'
    },
    {
      icon: TrendingUp,
      value: '15+',
      label: 'Years on Island'
    },
    {
      icon: Heart,
      value: '100%',
      label: 'Client Satisfaction'
    }
  ];

  return (
    <section id="about" className="py-24 bg-[#E8E8E8]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="mb-6">Experience That Makes the Difference</h2>
            <div className="space-y-4 text-lg leading-relaxed opacity-80">
              <p>
                For over 15 years, I've had the privilege of helping families discover, purchase, and sell some of Nantucket's most exceptional properties.
              </p>
              <p>
                My approach is built on three pillars: <span className="font-semibold text-[#0A1A2F]">proprietary market intelligence</span>, <span className="font-semibold text-[#0A1A2F]">deep island relationships</span>, and <span className="font-semibold text-[#0A1A2F]">unwavering commitment</span> to your goals.
              </p>
              <p>
                Whether you're searching for your forever home, a seasonal retreat, or positioning a legacy property for sale, you deserve a broker who understands what makes Nantucket truly special.
              </p>
            </div>
            <div className="mt-8">
              <button className="bg-[#3A5C7E] text-white px-8 py-4 rounded-md hover:bg-[#2d4860] transition-colors">
                Schedule a Consultation
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <div key={index} className="bg-white p-8 border border-[#D6C8B0] rounded-sm text-center">
                  <Icon className="w-8 h-8 text-[#3A5C7E] mx-auto mb-4" />
                  <h3 className="text-[#0A1A2F] mb-2">{achievement.value}</h3>
                  <p className="text-sm opacity-75">{achievement.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
