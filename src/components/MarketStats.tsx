import { TrendingUp, TrendingDown } from 'lucide-react';

export function MarketStats() {
  const stats = [
    {
      label: 'Median Sale Price',
      value: '$3.2M',
      change: '+12.3%',
      isPositive: true,
      period: 'YoY'
    },
    {
      label: 'Days on Market',
      value: '42',
      change: '-8 days',
      isPositive: true,
      period: 'vs. 2025'
    },
    {
      label: 'Active Listings',
      value: '187',
      change: '-15.2%',
      isPositive: false,
      period: 'YoY'
    },
    {
      label: 'Sales Volume',
      value: '$89M',
      change: '+18.4%',
      isPositive: true,
      period: 'Q1 2026'
    }
  ];

  return (
    <section id="market-insights" className="py-24 bg-[#E8E8E8]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-left mb-16">
          <h2 className="mb-4">Live Market Intelligence</h2>
          <p className="text-xl max-w-2xl opacity-75">
            Exclusive access to real-time data and proprietary insights that give you an edge in Nantucket's competitive market.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white p-8 border border-[#D6C8B0] rounded-sm hover:shadow-lg transition-shadow"
            >
              <div className="mb-4">
                <p className="text-sm uppercase tracking-wider opacity-60 mb-2">
                  {stat.label}
                </p>
                <h3 className="text-[#0A1A2F]">{stat.value}</h3>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-[#E8E8E8]">
                {stat.isPositive ? (
                  <TrendingUp className="w-4 h-4 text-[#A8D5C2]" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-[#F28F7D]" />
                )}
                <span className={`text-sm ${stat.isPositive ? 'text-[#A8D5C2]' : 'text-[#F28F7D]'}`}>
                  {stat.change}
                </span>
                <span className="text-sm opacity-50">{stat.period}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button className="bg-[#3A5C7E] text-white px-8 py-4 rounded-md hover:bg-[#2d4860] transition-colors">
            Download Full Market Report
          </button>
        </div>
      </div>
    </section>
  );
}
