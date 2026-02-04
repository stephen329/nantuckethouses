"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";

type MonthlyData = {
  month: string;
  year: number;
  medianPrice: number;
  avgPrice: number;
  soldCount?: number;
};

type Props = {
  data: MonthlyData[];
  isLoading?: boolean;
  analystNote?: string;
};

// Brand colors
const GOLD_PRIMARY = "#D4AF37";
const NAVY_DARK = "#1A2A3A";

export function PriceTrendChart({ data, isLoading, analystNote }: Props) {
  if (isLoading) {
    return (
      <div className="h-[420px] bg-white rounded-sm border border-[#D6C8B0] p-6 animate-pulse">
        <div className="h-4 bg-[#E8E8E8] rounded w-1/3 mb-4"></div>
        <div className="h-[320px] bg-[#E8E8E8] rounded"></div>
      </div>
    );
  }

  // Handle empty data state
  if (!data || data.length === 0) {
    return (
      <div className="h-[420px] bg-white rounded-sm border border-[#D6C8B0] p-6">
        <h3 className="text-[#1A2A3A] text-lg font-medium mb-4">Sold Price Trends</h3>
        <div className="h-[320px] flex flex-col items-center justify-center bg-[#FAF8F5] rounded border border-dashed border-[#D6C8B0]">
          <div className="text-center">
            <p className="text-[#1A2A3A]/60 text-sm font-medium mb-1">Data being calculated</p>
            <p className="text-[#1A2A3A]/40 text-xs">Historical trends will appear once data is available</p>
          </div>
        </div>
      </div>
    );
  }

  // Check for sparse data (many months with zero values)
  const validMonths = data.filter(d => d.medianPrice > 0);
  const isSparseData = validMonths.length < data.length * 0.5;

  // Fill in gaps - carry forward last known value, mark as estimated
  let lastMedian = 0;
  let lastAvg = 0;
  const chartData = data.map((d) => {
    const isEstimated = d.medianPrice === 0 && lastMedian > 0;
    const medianPrice = d.medianPrice > 0 ? d.medianPrice : lastMedian;
    const avgPrice = d.avgPrice > 0 ? d.avgPrice : lastAvg;
    
    if (d.medianPrice > 0) lastMedian = d.medianPrice;
    if (d.avgPrice > 0) lastAvg = d.avgPrice;
    
    return {
      ...d,
      label: `${d.month} ${d.year}`,
      medianPriceM: medianPrice / 1000000,
      avgPriceM: avgPrice / 1000000,
      hasData: d.medianPrice > 0,
      isEstimated,
    };
  });

  // Calculate overall average for reference line
  const overallMedian = validMonths.length > 0 
    ? validMonths.reduce((a, b) => a + b.medianPrice, 0) / validMonths.length / 1000000 
    : null;

  const formatPrice = (value: number) => `$${value.toFixed(1)}M`;

  return (
    <div className="bg-white rounded-sm border border-[#D6C8B0] p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[#1A2A3A] text-lg font-medium">Sold Price Trends</h3>
          {isSparseData && (
            <p className="text-xs text-[#1A2A3A]/50 mt-1">
              — Dashed segments indicate estimated values
            </p>
          )}
        </div>
        {overallMedian && (
          <span className="text-xs text-[#1A2A3A]/50 bg-[#FAF8F5] px-2 py-1 rounded">
            Period Avg: {formatPrice(overallMedian)}
          </span>
        )}
      </div>
      
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 10, fill: NAVY_DARK }}
              tickLine={{ stroke: "#E8E8E8" }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tickFormatter={formatPrice}
              tick={{ fontSize: 10, fill: NAVY_DARK }}
              tickLine={{ stroke: "#E8E8E8" }}
              domain={["auto", "auto"]}
              width={55}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const point = chartData.find(d => d.label === label);
                const headerText = !point?.hasData 
                  ? `${label} (No sales)` 
                  : point?.soldCount 
                    ? `${label} (${point.soldCount} sales)` 
                    : label;
                
                return (
                  <div className="bg-white border border-[#D6C8B0] rounded p-2 text-sm shadow-md">
                    <p className="font-semibold text-[#1A2A3A] mb-2">{headerText}</p>
                    {payload.map((entry, index) => {
                      const isMedian = entry.dataKey === "medianPriceM";
                      const labelText = isMedian ? "Median Sold" : "Average Sold";
                      const suffix = point?.isEstimated ? " (est.)" : "";
                      return (
                        <p key={index} className="text-xs" style={{ color: entry.color }}>
                          {labelText}: ${Number(entry.value).toFixed(2)}M{suffix}
                        </p>
                      );
                    })}
                  </div>
                );
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => (
                <span style={{ color: NAVY_DARK }}>
                  {value === "medianPriceM" ? "Median" : "Average"}
                </span>
              )}
            />
            {overallMedian && (
              <ReferenceLine 
                y={overallMedian} 
                stroke="#D6C8B0" 
                strokeDasharray="5 5" 
                label={{ value: "Avg", position: "right", fontSize: 9, fill: "#1A2A3A80" }}
              />
            )}
            {/* Median line - Gold, solid, prominent */}
            <Line 
              type="monotone" 
              dataKey="medianPriceM" 
              name="medianPriceM"
              stroke={GOLD_PRIMARY}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: GOLD_PRIMARY, stroke: "#fff", strokeWidth: 2 }}
              connectNulls
            />
            {/* Average line - Navy, dashed for contrast */}
            <Line 
              type="monotone" 
              dataKey="avgPriceM" 
              name="avgPriceM"
              stroke={NAVY_DARK}
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
              activeDot={{ r: 5, fill: NAVY_DARK, stroke: "#fff", strokeWidth: 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Analyst Note */}
      {analystNote && (
        <div className="mt-4 pt-4 border-t border-[#E8E8E8]">
          <p className="text-xs text-[#1A2A3A]/70 italic leading-relaxed">
            <span className="font-semibold text-[#D4AF37] not-italic">Stephen&apos;s Take:</span> {analystNote}
          </p>
        </div>
      )}
    </div>
  );
}
