"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from "recharts";
import { useState } from "react";

type DistributionData = {
  range: string;
  count: number;
  percentage: number;
  totalValue?: number;
};

type Props = {
  data: DistributionData[];
  isLoading?: boolean;
  totalVolume?: number;
};

// Nantucket-appropriate colors for luxury market segments
const SEGMENT_COLORS: Record<string, string> = {
  "Entry": "#6B8CAE",        // Slate blue
  "Core": "#1A2A3A",         // Navy
  "High-End": "#D4AF37",     // Brand gold
  "Ultra-Luxury": "#8B7355", // Bronze
};

const DEFAULT_COLORS = ["#D4AF37", "#1A2A3A", "#6B8CAE", "#8B7355"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
      />
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#1A2A3A" fontSize={14} fontWeight={600}>
        {payload.range}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#1A2A3A" fontSize={20} fontWeight={700}>
        {(percent * 100).toFixed(0)}%
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill="#1A2A3A80" fontSize={11}>
        {payload.count} properties
      </text>
    </g>
  );
};

export function PriceDistributionChart({ data, isLoading, totalVolume }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  if (isLoading) {
    return (
      <div className="h-[380px] bg-white rounded-sm border border-[#D6C8B0] p-6 animate-pulse">
        <div className="h-4 bg-[#E8E8E8] rounded w-1/3 mb-4"></div>
        <div className="h-[300px] bg-[#E8E8E8] rounded-full mx-auto w-[250px]"></div>
      </div>
    );
  }

  // Handle empty data state
  if (!data || data.length === 0 || data.every(d => d.count === 0)) {
    return (
      <div className="h-[380px] bg-white rounded-sm border border-[#D6C8B0] p-6">
        <h3 className="text-[#1A2A3A] text-lg font-medium mb-4">Price Distribution</h3>
        <div className="h-[300px] flex items-center justify-center bg-[#FAF8F5] rounded border border-dashed border-[#D6C8B0]">
          <p className="text-[#1A2A3A]/50 text-sm">Insufficient data for distribution</p>
        </div>
      </div>
    );
  }

  // Calculate total for center display
  const totalListings = data.reduce((sum, d) => sum + d.count, 0);
  const formattedVolume = totalVolume 
    ? `$${(totalVolume / 1000000).toFixed(0)}M` 
    : null;

  // Get color for each segment
  const getColor = (range: string, index: number): string => {
    // Check for segment type keywords
    if (range.includes("Entry") || range.includes("< $2M") || range.includes("Under")) {
      return SEGMENT_COLORS["Entry"];
    }
    if (range.includes("Core") || range.includes("$2M - $5M")) {
      return SEGMENT_COLORS["Core"];
    }
    if (range.includes("High-End") || range.includes("$5M - $10M")) {
      return SEGMENT_COLORS["High-End"];
    }
    if (range.includes("Ultra") || range.includes("$10M+")) {
      return SEGMENT_COLORS["Ultra-Luxury"];
    }
    return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  };

  return (
    <div className="bg-white rounded-sm border border-[#D6C8B0] p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-[#1A2A3A] text-lg font-medium">Price Distribution</h3>
        <span className="text-xs text-[#1A2A3A]/50 bg-[#FAF8F5] px-2 py-1 rounded">
          {totalListings} properties
        </span>
      </div>
      
      <div className="h-[300px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
              dataKey="count"
              nameKey="range"
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getColor(entry.range, index)}
                  stroke="#fff"
                  strokeWidth={2}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, _name: string, props) => {
                const item = props.payload;
                return [`${value} listings (${item.percentage}%)`, item.range];
              }}
              contentStyle={{ 
                backgroundColor: "white", 
                border: "1px solid #D6C8B0",
                borderRadius: "4px",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center content when no segment is hovered */}
        {activeIndex === undefined && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              {formattedVolume ? (
                <>
                  <p className="text-2xl font-bold text-[#1A2A3A]">{formattedVolume}</p>
                  <p className="text-xs text-[#1A2A3A]/50">Total Volume</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-[#1A2A3A]">{totalListings}</p>
                  <p className="text-xs text-[#1A2A3A]/50">Properties</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {data.map((entry, index) => (
          <div 
            key={entry.range} 
            className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80"
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(undefined)}
          >
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: getColor(entry.range, index) }}
            />
            <span className="text-[#1A2A3A]">{entry.range}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Calculate price distribution from listings using Nantucket-appropriate brackets
 */
export function calculatePriceDistribution(prices: number[]): DistributionData[] {
  // Nantucket-specific luxury market brackets
  const brackets = [
    { min: 0, max: 2000000, label: "Entry (< $2M)" },
    { min: 2000000, max: 5000000, label: "Core ($2M-$5M)" },
    { min: 5000000, max: 10000000, label: "High-End ($5M-$10M)" },
    { min: 10000000, max: Infinity, label: "Ultra-Luxury ($10M+)" },
  ];

  const total = prices.length;
  
  return brackets.map((bracket) => {
    const matchingPrices = prices.filter((p) => p >= bracket.min && p < bracket.max);
    const count = matchingPrices.length;
    const totalValue = matchingPrices.reduce((sum, p) => sum + p, 0);
    
    return {
      range: bracket.label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      totalValue,
    };
  }).filter((d) => d.count > 0); // Only show brackets with listings
}
