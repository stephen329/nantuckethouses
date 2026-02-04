"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

type MonthlyData = {
  month: string;
  year: number;
  medianDaysOnMarket: number;
  soldCount?: number;
};

type Props = {
  data: MonthlyData[];
  isLoading?: boolean;
};

export function DaysOnMarketChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="h-[380px] bg-white rounded-sm border border-[#D6C8B0] p-6 animate-pulse">
        <div className="h-4 bg-[#E8E8E8] rounded w-1/3 mb-4"></div>
        <div className="h-[300px] bg-[#E8E8E8] rounded"></div>
      </div>
    );
  }

  // Handle empty data state
  if (!data || data.length === 0) {
    return (
      <div className="h-[380px] bg-white rounded-sm border border-[#D6C8B0] p-6">
        <h3 className="text-[#1A2A3A] text-lg font-medium mb-4">Days on Market Trend</h3>
        <div className="h-[300px] flex items-center justify-center bg-[#FAF8F5] rounded border border-dashed border-[#D6C8B0]">
          <p className="text-[#1A2A3A]/50 text-sm">No days on market data available</p>
        </div>
      </div>
    );
  }

  // Check if we have any valid DOM data
  const hasValidData = data.some(d => d.medianDaysOnMarket > 0);
  
  if (!hasValidData) {
    return (
      <div className="h-[380px] bg-white rounded-sm border border-[#D6C8B0] p-6">
        <h3 className="text-[#1A2A3A] text-lg font-medium mb-4">Days on Market Trend</h3>
        <div className="h-[300px] flex flex-col items-center justify-center bg-[#FAF8F5] rounded border border-dashed border-[#D6C8B0]">
          <p className="text-[#1A2A3A]/50 text-sm">Insufficient sample size for median calculation</p>
          <p className="text-[#1A2A3A]/40 text-xs mt-1">DOM data requires completed sales transactions</p>
        </div>
      </div>
    );
  }

  // Format data for display, carrying forward last known value for gaps
  let lastKnownDOM = 0;
  const chartData = data.map((d) => {
    const dom = d.medianDaysOnMarket > 0 ? d.medianDaysOnMarket : lastKnownDOM;
    if (d.medianDaysOnMarket > 0) lastKnownDOM = d.medianDaysOnMarket;
    
    return {
      ...d,
      label: `${d.month} ${d.year}`,
      medianDaysOnMarket: dom,
      hasData: d.medianDaysOnMarket > 0,
    };
  });

  // Calculate average for reference
  const validDOMs = data.filter(d => d.medianDaysOnMarket > 0).map(d => d.medianDaysOnMarket);
  const avgDOM = validDOMs.length > 0 
    ? Math.round(validDOMs.reduce((a, b) => a + b, 0) / validDOMs.length)
    : null;

  // Market condition indicator
  const latestDOM = validDOMs.length > 0 ? validDOMs[validDOMs.length - 1] : null;
  const marketCondition = latestDOM !== null
    ? latestDOM < 60 ? "Hot Market" : latestDOM < 120 ? "Balanced" : "Buyer's Market"
    : null;

  return (
    <div className="bg-white rounded-sm border border-[#D6C8B0] p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[#1A2A3A] text-lg font-medium">Days on Market Trend</h3>
          {marketCondition && (
            <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${
              marketCondition === "Hot Market" 
                ? "bg-green-100 text-green-700" 
                : marketCondition === "Balanced" 
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-blue-100 text-blue-700"
            }`}>
              {marketCondition}
            </span>
          )}
        </div>
        {avgDOM && (
          <span className="text-xs text-[#1A2A3A]/50 bg-[#FAF8F5] px-2 py-1 rounded">
            Avg: {avgDOM} days
          </span>
        )}
      </div>
      
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="domGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 10, fill: "#1A2A3A" }}
              tickLine={{ stroke: "#E8E8E8" }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 10, fill: "#1A2A3A" }}
              tickLine={{ stroke: "#E8E8E8" }}
              domain={[0, "auto"]}
              width={40}
              tickFormatter={(value) => `${value}d`}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const point = chartData.find(d => d.label === label);
                const value = payload[0].value;
                const isEstimated = !point?.hasData;
                
                return (
                  <div className="bg-white border border-[#D6C8B0] rounded p-2 text-sm shadow-md">
                    <p className="font-semibold text-[#1A2A3A] mb-1">
                      {point?.soldCount ? `${label} (${point.soldCount} sales)` : label}
                    </p>
                    <p className="text-[#1A2A3A]/80">
                      {value} days{isEstimated ? " (estimated)" : ""}
                    </p>
                  </div>
                );
              }}
            />
            {avgDOM && (
              <ReferenceLine 
                y={avgDOM} 
                stroke="#1A2A3A" 
                strokeDasharray="5 5"
                label={{ value: "Avg", position: "right", fontSize: 9, fill: "#1A2A3A" }}
              />
            )}
            <Area 
              type="monotone" 
              dataKey="medianDaysOnMarket" 
              stroke="#D4AF37" 
              strokeWidth={3}
              fill="url(#domGradient)"
              dot={false}
              activeDot={{ r: 5, fill: "#D4AF37", stroke: "#fff", strokeWidth: 2 }}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Interpretation guide */}
      <div className="mt-4 pt-3 border-t border-[#E8E8E8] text-xs text-[#1A2A3A]/60">
        <span className="font-medium">Reading this chart:</span> Lower days indicates faster sales and higher buyer demand. 
        Seasonal peaks typically occur in winter months.
      </div>
    </div>
  );
}
