"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";

type MonthlyData = {
  month: string;
  year: number;
  soldCount: number;
};

type Props = {
  data: MonthlyData[];
  isLoading?: boolean;
};

// Brand colors
const GOLD_PRIMARY = "#D4AF37";
const NAVY_DARK = "#1A2A3A";
const SLATE_LIGHT = "#6B8CAE";

export function InventoryChart({ data, isLoading }: Props) {
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
        <h3 className="text-[#1A2A3A] text-lg font-medium mb-4">Monthly Sales Volume</h3>
        <div className="h-[320px] flex flex-col items-center justify-center bg-[#FAF8F5] rounded border border-dashed border-[#D6C8B0]">
          <div className="text-center">
            <p className="text-[#1A2A3A]/60 text-sm font-medium mb-1">Data being calculated</p>
            <p className="text-[#1A2A3A]/40 text-xs">Sales volume will appear once data is available</p>
          </div>
        </div>
      </div>
    );
  }

  // Format data for display, track months with no sales
  const chartData = data.map((d) => ({
    ...d,
    label: `${d.month} ${d.year}`,
    soldCount: d.soldCount || 0,
    hasData: d.soldCount > 0,
  }));

  // Check if all months have zero sales
  const hasAnySales = chartData.some(d => d.soldCount > 0);
  
  if (!hasAnySales) {
    return (
      <div className="h-[420px] bg-white rounded-sm border border-[#D6C8B0] p-6">
        <h3 className="text-[#1A2A3A] text-lg font-medium mb-4">Monthly Sales Volume</h3>
        <div className="h-[320px] flex flex-col items-center justify-center bg-[#FAF8F5] rounded border border-dashed border-[#D6C8B0]">
          <div className="text-center">
            <p className="text-[#1A2A3A]/60 text-sm font-medium mb-1">No closed sales for this period</p>
            <p className="text-[#1A2A3A]/40 text-xs">Try selecting a longer time range</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const salesWithData = chartData.filter(d => d.soldCount > 0);
  const totalSales = chartData.reduce((sum, d) => sum + d.soldCount, 0);
  const avgMonthlySales = salesWithData.length > 0 ? totalSales / salesWithData.length : 0;
  const maxSales = Math.max(...chartData.map(d => d.soldCount));

  // Get bar color based on value - simple comparison to average
  const getBarColor = (value: number): string => {
    if (value === 0) return "#E8E8E8";
    // Above or at average = Gold, Below = Slate
    return value >= avgMonthlySales ? GOLD_PRIMARY : SLATE_LIGHT;
  };

  return (
    <div className="bg-white rounded-sm border border-[#D6C8B0] p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-[#1A2A3A] text-lg font-medium">Monthly Sales Volume</h3>
        <div className="flex items-center gap-3 text-xs text-[#1A2A3A]/60">
          <span className="bg-[#FAF8F5] px-2 py-1 rounded">
            Total: <span className="font-semibold text-[#1A2A3A]">{totalSales}</span>
          </span>
          <span className="bg-[#FAF8F5] px-2 py-1 rounded">
            Avg: <span className="font-semibold text-[#1A2A3A]">{avgMonthlySales.toFixed(0)}/mo</span>
          </span>
        </div>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" vertical={false} />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 10, fill: NAVY_DARK }}
              tickLine={{ stroke: "#E8E8E8" }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 10, fill: NAVY_DARK }}
              tickLine={{ stroke: "#E8E8E8" }}
              width={35}
            />
            <Tooltip 
              labelStyle={{ color: NAVY_DARK, fontWeight: 600 }}
              formatter={(value: number) => {
                if (value === 0) return ["No sales this month", ""];
                const indicator = value === maxSales ? " (Peak)" : value < avgMonthlySales * 0.5 ? " (Low)" : "";
                return [`${value} properties sold${indicator}`, ""];
              }}
              contentStyle={{ 
                backgroundColor: "white", 
                border: "1px solid #D6C8B0",
                borderRadius: "4px",
                fontSize: 12,
              }}
            />
            <ReferenceLine 
              y={avgMonthlySales} 
              stroke={GOLD_PRIMARY}
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: "Avg", position: "right", fontSize: 9, fill: GOLD_PRIMARY }}
            />
            <Bar 
              dataKey="soldCount" 
              name="Properties Sold"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.soldCount)}
                  fillOpacity={entry.soldCount === 0 ? 0.3 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-[#E8E8E8]">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: GOLD_PRIMARY }} />
          <span className="text-[#1A2A3A]/70">Above Average</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: SLATE_LIGHT }} />
          <span className="text-[#1A2A3A]/70">Below Average</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-4 border-t-2 border-dashed" style={{ borderColor: GOLD_PRIMARY }} />
          <span className="text-[#1A2A3A]/70">Avg ({avgMonthlySales.toFixed(0)}/mo)</span>
        </div>
      </div>
    </div>
  );
}
