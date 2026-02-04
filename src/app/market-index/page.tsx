"use client";

import { useEffect, useState, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { PriceTrendChart } from "@/components/charts/PriceTrendChart";
import { InventoryChart } from "@/components/charts/InventoryChart";
import { PriceDistributionChart } from "@/components/charts/PriceDistributionChart";
import { NeighborhoodSalesTable } from "@/components/charts/NeighborhoodSalesTable";
import { Home, ArrowLeft, DollarSign, Clock, Database } from "lucide-react";
import Link from "next/link";

type MonthlyData = {
  month: string;
  year: number;
  medianPrice: number;
  avgPrice: number;
  soldCount: number;
  medianDaysOnMarket: number;
};

type DistributionData = {
  range: string;
  count: number;
  percentage: number;
  totalValue?: number;
};

type NeighborhoodSales = {
  name: string;
  salesCount: number;
  avgSalePrice: number;
  totalVolume: number;
};

type ActiveListingStats = {
  activeListingCount: number;
  medianListPrice: number;
  avgListPrice: number;
  medianDaysOnMarket: number;
};

type DataSource = {
  historyFallback: boolean;
  totalSold?: number;
};

// Shimmer loading component for metric tiles
function MetricTileSkeleton() {
  return (
    <div className="bg-white p-5 rounded-sm border border-[#D6C8B0] shadow-sm animate-pulse">
      <div className="h-3 w-24 bg-[#E8E8E8] rounded mb-3" />
      <div className="h-10 w-20 bg-[#E8E8E8] rounded mb-2" />
      <div className="h-3 w-32 bg-[#E8E8E8] rounded" />
    </div>
  );
}

export default function MarketIndexPage() {
  // Time range for sales data
  const [years, setYears] = useState(3);
  
  // Active listings data (on-market)
  const [activeStats, setActiveStats] = useState<ActiveListingStats | null>(null);
  const [priceDistribution, setPriceDistribution] = useState<DistributionData[]>([]);
  const [isActiveLoading, setIsActiveLoading] = useState(true);
  
  // Sales data (historical)
  const [historyData, setHistoryData] = useState<MonthlyData[]>([]);
  const [neighborhoodSales, setNeighborhoodSales] = useState<NeighborhoodSales[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isSalesTableLoading, setIsSalesTableLoading] = useState(true);
  
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>({ historyFallback: false });
  
  // Initial load flag
  const isInitialLoad = isActiveLoading && activeStats === null;

  // Dynamic analyst note based on sales data
  const analystNote = useMemo(() => {
    if (historyData.length === 0 || !activeStats) return undefined;
    
    // Calculate monthly velocity from last 6 months
    const recentMonths = historyData.slice(-6);
    const totalRecentSales = recentMonths.reduce((sum, d) => sum + (d.soldCount || 0), 0);
    const monthlyVelocity = recentMonths.length > 0 ? totalRecentSales / recentMonths.length : 0;
    const monthsOfSupply = monthlyVelocity > 0 ? activeStats.activeListingCount / monthlyVelocity : 0;
    
    // Price trend
    const currentPrice = historyData[historyData.length - 1]?.medianPrice || 0;
    const startPrice = historyData[0]?.medianPrice || 0;
    const priceChangePercent = startPrice > 0 ? ((currentPrice - startPrice) / startPrice) * 100 : 0;
    
    if (monthsOfSupply < 4 && priceChangePercent > 5) {
      return "We're seeing inventory tightening across most neighborhoods. With demand outpacing supply, well-priced properties are moving quickly. Buyers should be prepared to act decisively.";
    } else if (monthsOfSupply > 6) {
      return "Current inventory levels favor buyers, with more selection available across price points. This is a good window for those seeking negotiating leverage.";
    } else if (priceChangePercent < -5) {
      return "The market is experiencing a correction from recent highs. For sellers, strategic pricing is essential. For buyers, patience may be rewarded.";
    }
    
    return "The market remains balanced with healthy transaction velocity. Seasonal patterns continue to influence pricing, with summer months typically showing peak activity.";
  }, [historyData, activeStats]);

  // Fetch ACTIVE LISTINGS data once on mount (doesn't depend on time range)
  useEffect(() => {
    async function fetchActiveData() {
      setIsActiveLoading(true);
      try {
        // Fetch active listing stats (count, median list price, DOM)
        const statsRes = await fetch("/api/market-stats");
        const statsJson = await statsRes.json();
        if (statsJson.data?.aggregates) {
          setActiveStats(statsJson.data.aggregates);
        }

        // Fetch price distribution for active listings
        const priceDistRes = await fetch("/api/price-distribution");
        const priceDistJson = await priceDistRes.json();
        if (priceDistJson.data) {
          setPriceDistribution(priceDistJson.data);
        }
        
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to fetch active listing data:", error);
      } finally {
        setIsActiveLoading(false);
      }
    }

    fetchActiveData();
  }, []); // Only run once on mount

  // Fetch SALES DATA when time range changes
  useEffect(() => {
    async function fetchSalesData() {
      setIsHistoryLoading(true);
      setIsSalesTableLoading(true);
      
      try {
        // Fetch historical price/volume data
        const historyRes = await fetch(`/api/market-history?years=${years}`);
        const historyJson = await historyRes.json();
        if (historyJson.data) {
          setHistoryData(historyJson.data);
          setDataSource({
            historyFallback: historyJson.isFallback ?? false,
            totalSold: historyJson.totalSold,
          });
        }
      } catch (error) {
        console.error("Failed to fetch history data:", error);
      } finally {
        setIsHistoryLoading(false);
      }
      
      try {
        // Fetch neighborhood sales data
        const salesRes = await fetch(`/api/neighborhood-sales?years=${years}`);
        const salesJson = await salesRes.json();
        if (salesJson.data) {
          setNeighborhoodSales(salesJson.data);
        }
      } catch (error) {
        console.error("Failed to fetch neighborhood sales:", error);
      } finally {
        setIsSalesTableLoading(false);
      }
    }

    fetchSalesData();
  }, [years]); // Runs when time range changes

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  // Handle time period change with visual feedback
  const handleYearChange = (y: number) => {
    if (y !== years) {
      setYears(y);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Navigation />
      
      {/* Header */}
      <section className="pt-28 pb-8 bg-[#1A2A3A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div>
            <p className="text-[#C9A227] text-sm uppercase tracking-[0.3em] mb-2 font-medium">
              Market Intelligence
            </p>
            <h1 className="text-white text-3xl sm:text-4xl md:text-5xl tracking-tight">
              The Nantucket Index
            </h1>
            <p className="text-white/60 mt-4 max-w-2xl text-sm sm:text-base">
              Comprehensive market analytics interpreted through local judgment—not algorithms. 
              Active inventory, pricing trends, and neighborhood sales analysis.
            </p>
          </div>
          
          {dataSource.historyFallback && (
            <p className="mt-6 text-[#C9A227]/70 text-sm italic">
              * Some data estimated based on market patterns
            </p>
          )}
        </div>
      </section>

      {/* ===================== ON-MARKET LISTINGS SECTION ===================== */}
      <section className="py-8 -mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-serif text-[#1A2A3A]">Market Snapshot</h2>
              <p className="text-sm text-[#1A2A3A]/50 mt-1">Currently active on-market listings</p>
            </div>
            {lastUpdated && (
              <p className="text-xs text-[#1A2A3A]/40">
                Updated {lastUpdated.toLocaleDateString("en-US", { 
                  month: "short", 
                  day: "numeric", 
                  year: "numeric"
                })}
              </p>
            )}
          </div>

          {/* Active Listings Metrics - 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8">
            {isInitialLoad ? (
              <>
                <MetricTileSkeleton />
                <MetricTileSkeleton />
                <MetricTileSkeleton />
              </>
            ) : (
              <>
                {/* On Market Listings */}
                <div className="bg-white p-5 rounded-sm border border-[#D6C8B0] shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1A2A3A]/50 mb-2">
                    On Market Listings
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-serif text-[#1A2A3A] leading-none">
                      {activeStats?.activeListingCount ?? 0}
                    </p>
                    <Home className="w-5 h-5 text-[#C9A227]" />
                  </div>
                  <p className="text-xs text-[#1A2A3A]/50 mt-3">
                    Active residential & land
                  </p>
                </div>

                {/* Median List Price */}
                <div className="bg-white p-5 rounded-sm border border-[#D6C8B0] shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1A2A3A]/50 mb-2">
                    Median List Price
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-serif text-[#1A2A3A] leading-none">
                      {formatCurrency(activeStats?.medianListPrice ?? 0)}
                    </p>
                    <DollarSign className="w-5 h-5 text-[#C9A227]" />
                  </div>
                  <p className="text-xs text-[#1A2A3A]/50 mt-3">
                    Current asking price
                  </p>
                </div>

                {/* Average Days on Market */}
                <div className="bg-white p-5 rounded-sm border border-[#D6C8B0] shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1A2A3A]/50 mb-2">
                    Avg Days on Market
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-serif text-[#1A2A3A] leading-none">
                      {activeStats?.medianDaysOnMarket ?? "—"}
                    </p>
                    <span className="text-lg text-[#1A2A3A]/50">days</span>
                    <Clock className="w-5 h-5 text-[#C9A227] ml-auto" />
                  </div>
                  <p className="text-xs text-[#1A2A3A]/50 mt-3">
                    Time to sell (median)
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Price Distribution with Summary */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Chart - Takes 3 columns */}
            <div className="lg:col-span-3">
              <PriceDistributionChart 
                data={priceDistribution} 
                isLoading={isActiveLoading}
              />
            </div>
            
            {/* Summary Text Block - Takes 2 columns */}
            <div className="lg:col-span-2 bg-white rounded-sm border border-[#D6C8B0] p-6">
              <h3 className="text-[#1A2A3A] text-lg font-medium mb-4">Market Composition</h3>
              
              {isActiveLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-[#E8E8E8] rounded w-full"></div>
                  <div className="h-4 bg-[#E8E8E8] rounded w-5/6"></div>
                  <div className="h-4 bg-[#E8E8E8] rounded w-4/6"></div>
                </div>
              ) : (
                <>
                  <div className="space-y-4 text-sm text-[#1A2A3A]/80 leading-relaxed">
                    {priceDistribution.length > 0 && (() => {
                      const total = priceDistribution.reduce((sum, d) => sum + d.count, 0);
                      const luxury = priceDistribution.find(d => d.range.includes("$10M") || d.range.includes("Ultra"));
                      const highEnd = priceDistribution.find(d => d.range.includes("$5M") && d.range.includes("$10M"));
                      const core = priceDistribution.find(d => d.range.includes("$2M") && d.range.includes("$5M"));
                      const entry = priceDistribution.find(d => d.range.includes("< $2M") || d.range.includes("Entry"));
                      
                      const luxuryPct = luxury ? luxury.percentage : 0;
                      const highEndPct = highEnd ? highEnd.percentage : 0;
                      const corePct = core ? core.percentage : 0;
                      const entryPct = entry ? entry.percentage : 0;
                      
                      const aboveFiveM = luxuryPct + highEndPct;
                      
                      return (
                        <>
                          <p>
                            Of the <span className="font-semibold text-[#1A2A3A]">{total} active listings</span>, 
                            the market shows a {corePct > 40 ? "concentration in the core segment" : 
                              aboveFiveM > 30 ? "strong presence at the high end" : "diverse distribution across price points"}.
                          </p>
                          
                          {core && core.count > 0 && (
                            <p>
                              The <span className="font-semibold text-[#1A2A3A]">$2M–$5M range</span> represents {corePct}% of inventory 
                              ({core.count} properties)—typically established homes in desirable neighborhoods.
                            </p>
                          )}
                          
                          {(luxury && luxury.count > 0) && (
                            <p>
                              <span className="font-semibold text-[#1A2A3A]">{luxury.count} properties</span> are priced 
                              above $10M, representing {luxuryPct}% of current inventory. These ultra-luxury offerings 
                              often include waterfront estates and historic compounds.
                            </p>
                          )}
                          
                          {entry && entry.count > 0 && (
                            <p className="text-[#1A2A3A]/60 text-xs border-t border-[#E8E8E8] pt-3 mt-4">
                              Entry-level opportunities (under $2M) remain limited at just {entry.count} properties—
                              {entryPct < 15 ? " a persistent challenge for first-time island buyers" : " offering some accessible options"}.
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== SALES DATA SECTION ===================== */}
      <section className="py-8 sm:py-12 border-t border-[#E8E8E8] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header with Time Period Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-serif text-[#1A2A3A]">Sales Data</h2>
              <p className="text-sm text-[#1A2A3A]/50 mt-1">
                Closed transactions and pricing trends
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              {dataSource.totalSold && !dataSource.historyFallback && (
                <span className="text-xs text-[#1A2A3A]/50">
                  {dataSource.totalSold.toLocaleString()} transactions
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#1A2A3A]/60 hidden sm:inline">Range:</span>
                <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#D6C8B0] p-1 rounded-md shadow-sm">
                {[1, 3, 5].map((y) => (
                  <button
                    key={y}
                    onClick={() => handleYearChange(y)}
                    className={`px-4 py-2 rounded text-sm font-semibold transition-all duration-200 ${
                      years === y
                        ? "bg-[#D4AF37] text-white shadow-sm"
                        : "text-[#1A2A3A]/60 hover:text-[#1A2A3A] hover:bg-white"
                    }`}
                  >
                    {y}Y
                  </button>
                ))}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row: Sold Price Trends & Monthly Sales Volume */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <PriceTrendChart 
              data={historyData} 
              isLoading={isHistoryLoading} 
              analystNote={analystNote}
            />
            <InventoryChart data={historyData} isLoading={isHistoryLoading} />
          </div>

          {/* Neighborhood Sales Table */}
          <NeighborhoodSalesTable 
            data={neighborhoodSales} 
            isLoading={isSalesTableLoading} 
          />
        </div>
      </section>

      {/* Data Source Attribution & Export */}
      <section className="py-6 border-t border-[#E8E8E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Source Attribution */}
            <div className="flex items-center gap-3 text-xs text-[#1A2A3A]/60">
              <Database className="w-4 h-4 text-[#D4AF37]" />
              <span>
                Data source: <span className="font-medium text-[#1A2A3A]/80">Nantucket MLS</span> + proprietary analysis
                {lastUpdated && (
                  <span className="ml-2">
                    · Auto-updated {lastUpdated.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </span>
            </div>
          </div>
          
          {/* Methodology note */}
          <p className="mt-4 text-xs text-[#1A2A3A]/40 max-w-3xl">
            Statistics calculated from MLS transaction data. Median values used to minimize impact of outliers. 
            Neighborhood boundaries follow traditional island designations. 
            For detailed methodology or custom analysis, <a href="#contact" className="underline hover:text-[#1A2A3A]/60">contact Stephen directly</a>.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-[#1A2A3A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-white text-2xl sm:text-3xl mb-4">Need Deeper Analysis?</h2>
          <p className="text-white/70 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
            These numbers tell part of the story. For interpretation specific to your situation—whether 
            buying, selling, or evaluating a development opportunity—schedule a private consultation.
          </p>
          <a 
            href="https://calendly.com/stephen-maury/30min" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-[#C9A227] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-md hover:bg-[#B89220] transition-colors text-sm sm:text-base"
          >
            Schedule a Market Discussion
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
