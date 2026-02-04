"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type NeighborhoodSales = {
  name: string;
  salesCount: number;
  avgSalePrice: number;
  totalVolume: number;
};

type Props = {
  data: NeighborhoodSales[];
  isLoading?: boolean;
};

const INITIAL_DISPLAY_COUNT = 5;

export function NeighborhoodSalesTable({ data, isLoading }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white rounded-sm border border-[#D6C8B0] p-6 animate-pulse">
        <div className="h-5 bg-[#E8E8E8] rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-[#E8E8E8] rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-sm border border-[#D6C8B0] p-6">
        <h3 className="text-[#1A2A3A] text-lg font-medium mb-4">Sales by Neighborhood</h3>
        <div className="h-[200px] flex items-center justify-center bg-[#FAF8F5] rounded border border-dashed border-[#D6C8B0]">
          <p className="text-[#1A2A3A]/50 text-sm">No neighborhood sales data available</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  const formatVolume = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  // Sort by sales count descending and limit display
  const sortedData = [...data].sort((a, b) => b.salesCount - a.salesCount);
  const displayData = isExpanded ? sortedData : sortedData.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = sortedData.length > INITIAL_DISPLAY_COUNT;
  const hiddenCount = sortedData.length - INITIAL_DISPLAY_COUNT;

  // Calculate totals
  const totalSales = data.reduce((sum, n) => sum + n.salesCount, 0);
  const totalVolume = data.reduce((sum, n) => sum + n.totalVolume, 0);

  return (
    <div className="bg-white rounded-sm border border-[#D6C8B0] overflow-hidden">
      <div className="p-4 border-b border-[#E8E8E8]">
        <div className="flex items-center justify-between">
          <h3 className="text-[#1A2A3A] text-lg font-medium">Sales by Neighborhood</h3>
          <div className="flex items-center gap-4 text-xs text-[#1A2A3A]/60">
            <span>
              Total: <span className="font-semibold text-[#1A2A3A]">{totalSales} sales</span>
            </span>
            <span>
              Volume: <span className="font-semibold text-[#1A2A3A]">{formatVolume(totalVolume)}</span>
            </span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAF8F5] text-left text-xs font-semibold text-[#1A2A3A]/70 uppercase tracking-wider">
              <th className="px-4 py-3">Neighborhood</th>
              <th className="px-4 py-3 text-right"># Sales</th>
              <th className="px-4 py-3 text-right">Avg Sale Price</th>
              <th className="px-4 py-3 text-right">Total Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E8E8]">
            {displayData.map((neighborhood, index) => (
              <tr 
                key={neighborhood.name} 
                className={`hover:bg-[#FAF8F5] transition-colors ${
                  index < 3 ? "bg-[#FAF8F5]/50" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {index < 3 && (
                      <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-white text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                    )}
                    <span className={`font-medium text-[#1A2A3A] ${index < 3 ? "" : "ml-7"}`}>
                      {neighborhood.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-[#1A2A3A]/80">
                  {neighborhood.salesCount}
                </td>
                <td className="px-4 py-3 text-right font-medium text-[#1A2A3A]">
                  {formatCurrency(neighborhood.avgSalePrice)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-[#1A2A3A]">
                    {formatVolume(neighborhood.totalVolume)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show More / Show Less Button */}
      {hasMore && (
        <div className="p-3 border-t border-[#E8E8E8]">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-[#1A2A3A]/70 hover:text-[#1A2A3A] hover:bg-[#FAF8F5] rounded transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show {hiddenCount} More Neighborhoods
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
