"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useState } from "react";

type NeighborhoodStats = {
  name: string;
  activeListings: number;
  medianPrice: number;
  avgPrice: number;
  medianDaysOnMarket: number;
};

type Props = {
  data: NeighborhoodStats[];
  metric: "medianPrice" | "activeListings" | "medianDaysOnMarket";
  isLoading?: boolean;
  selectedNeighborhood?: string | null;
  onSelectNeighborhood?: (name: string | null) => void;
};

// Brand gold (#D4AF37) as primary, with tier variations
const GOLD_PRIMARY = "#D4AF37";
const NAVY_MID = "#1A2A3A";
const SLATE_ENTRY = "#6B8CAE";

// Get bar color based on rank position
const getBarColor = (index: number, total: number): string => {
  // Top 3: Brand Gold (premium tier)
  if (index < 3) return GOLD_PRIMARY;
  // Upper half: Navy (mid-market)
  if (index < total * 0.6) return NAVY_MID;
  // Lower tier: Slate blue (entry point)
  return SLATE_ENTRY;
};

export function NeighborhoodCompare({ data, metric, isLoading, selectedNeighborhood, onSelectNeighborhood }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Handle bar click for neighborhood selection
  const handleBarClick = (name: string) => {
    if (onSelectNeighborhood) {
      // Toggle selection: if already selected, deselect
      onSelectNeighborhood(selectedNeighborhood === name ? null : name);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-sm border border-[#D6C8B0] p-6 animate-pulse">
        <div className="h-4 bg-[#E8E8E8] rounded w-1/3 mb-4"></div>
        <div className="h-[400px] bg-[#E8E8E8] rounded"></div>
      </div>
    );
  }

  // Handle empty data state
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-sm border border-[#D6C8B0] p-6">
        <h3 className="text-[#1A2A3A] text-lg font-medium mb-4">Neighborhood Comparison</h3>
        <div className="h-[350px] flex items-center justify-center bg-[#FAF8F5] rounded border border-dashed border-[#D6C8B0]">
          <p className="text-[#1A2A3A]/50 text-sm">No neighborhood data available</p>
        </div>
      </div>
    );
  }

  const metricLabels = {
    medianPrice: "Median Price",
    activeListings: "Active Listings",
    medianDaysOnMarket: "Days on Market",
  };

  const metricDescriptions = {
    medianPrice: "Sorted by highest median price — showing prestige to value",
    activeListings: "Sorted by most inventory — higher selection available",
    medianDaysOnMarket: "Sorted by fastest-moving — lower days indicates higher demand",
  };

  const formatValue = (value: number) => {
    if (metric === "medianPrice") {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return value.toString();
  };

  // Sort data by the selected metric (always showing "best" first)
  const sortedData = [...data].sort((a, b) => {
    if (metric === "medianPrice") return b.medianPrice - a.medianPrice;
    if (metric === "activeListings") return b.activeListings - a.activeListings;
    // For DOM, lower is better (faster sales)
    return a.medianDaysOnMarket - b.medianDaysOnMarket;
  });

  // Dynamic height based on number of neighborhoods
  const chartHeight = Math.max(350, sortedData.length * 35);

  return (
    <div className="bg-white rounded-sm border border-[#D6C8B0] p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <h3 className="text-[#1A2A3A] text-lg font-medium">
          Neighborhood Comparison: {metricLabels[metric]}
        </h3>
        <span className="text-xs text-[#1A2A3A]/50">
          {sortedData.length} neighborhoods
        </span>
      </div>
      <p className="text-xs text-[#1A2A3A]/50 mb-4">{metricDescriptions[metric]}</p>
      
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={sortedData} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" horizontal={true} vertical={false} />
            <XAxis 
              type="number"
              tickFormatter={formatValue}
              tick={{ fontSize: 10, fill: "#1A2A3A" }}
              tickLine={{ stroke: "#E8E8E8" }}
            />
            <YAxis 
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "#1A2A3A", fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              width={85}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const item = sortedData.find(d => d.name === label);
                if (!item) return null;
                
                return (
                  <div className="bg-white border border-[#D6C8B0] rounded-md p-3 shadow-lg text-sm">
                    <p className="font-semibold text-[#1A2A3A] mb-2">{label}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between gap-4">
                        <span className="text-[#1A2A3A]/60">Median Price:</span>
                        <span className="font-medium text-[#1A2A3A]">
                          ${(item.medianPrice / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[#1A2A3A]/60">Active Listings:</span>
                        <span className="font-medium text-[#1A2A3A]">
                          {item.activeListings}
                        </span>
                      </div>
                      {item.medianDaysOnMarket > 0 && (
                        <div className="flex justify-between gap-4">
                          <span className="text-[#1A2A3A]/60">Days on Market:</span>
                          <span className="font-medium text-[#1A2A3A]">
                            {item.medianDaysOnMarket}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            <Bar 
              dataKey={metric} 
              radius={[0, 4, 4, 0]}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={(data) => handleBarClick(data.name)}
            >
              {sortedData.map((entry, index) => {
                const isSelected = selectedNeighborhood === entry.name;
                const isHovered = hoveredIndex === index;
                const hasSelection = selectedNeighborhood !== null;
                
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(index, sortedData.length)}
                    fillOpacity={
                      isSelected ? 1 : 
                      hasSelection ? 0.3 : 
                      (hoveredIndex === null || isHovered) ? 1 : 0.5
                    }
                    stroke={isSelected ? "#D4AF37" : isHovered ? "#C9A227" : "none"}
                    strokeWidth={isSelected ? 3 : isHovered ? 2 : 0}
                    style={{ transition: "all 0.2s ease", cursor: onSelectNeighborhood ? "pointer" : "default" }}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Selection Indicator */}
      <div className="mt-4 pt-4 border-t border-[#E8E8E8]">
        {/* Selected neighborhood indicator */}
        {selectedNeighborhood && onSelectNeighborhood && (
          <div className="flex items-center justify-between mb-3 px-2 py-2 bg-[#FAF8F5] rounded-md">
            <span className="text-sm text-[#1A2A3A]">
              <span className="font-medium">{selectedNeighborhood}</span> selected
            </span>
            <button
              onClick={() => onSelectNeighborhood(null)}
              className="text-xs text-[#1A2A3A]/60 hover:text-[#1A2A3A] underline"
            >
              Clear filter
            </button>
          </div>
        )}
        
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: GOLD_PRIMARY }} />
            <span className="text-[#1A2A3A]/70">Premium Tier</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: NAVY_MID }} />
            <span className="text-[#1A2A3A]/70">Mid-Market</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: SLATE_ENTRY }} />
            <span className="text-[#1A2A3A]/70">Entry Point</span>
          </div>
          {onSelectNeighborhood && (
            <span className="text-xs text-[#1A2A3A]/40 italic">Click a bar to filter</span>
          )}
        </div>
      </div>
    </div>
  );
}
