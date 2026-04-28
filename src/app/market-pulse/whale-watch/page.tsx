import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";
import { CTASection } from "@/components/home/CTASection";
import { fetchAllListings } from "@/lib/cnc-api";
import type { WhaleWatchSale } from "@/types";

export const metadata: Metadata = {
  title: "Whale Watch 2026 | Nantucket Luxury Home Sales Tracker",
  description:
    "Live tracking of Nantucket's top closed sales. YTD volume, biggest transactions, and Stephen Maury's expert market analysis.",
  openGraph: {
    title: "Whale Watch 2026 | Nantucket Luxury Home Sales Tracker",
    description:
      "Live tracking of Nantucket's top closed sales. YTD volume, biggest transactions, and Stephen Maury's expert market analysis.",
  },
};

export const revalidate = 3600;

// ─── Helpers ────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatRatio(closePrice: number, listPrice?: number): string | null {
  if (!listPrice || listPrice <= 0) return null;
  return `${((closePrice / listPrice) * 100).toFixed(1)}%`;
}

// ─── Data Fetching ──────────────────────────────────────────

type WhaleWatchStats = {
  sales: WhaleWatchSale[];
  totalYtdSales: number;
  totalVolume: number;
  highestSale: WhaleWatchSale | null;
};

async function getWhaleWatchData(): Promise<WhaleWatchStats> {
  try {
    const now = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const daysSinceJan1 = Math.ceil(
      (now.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24)
    );

    const sold = await fetchAllListings({
      status: "S",
      close_date: daysSinceJan1,
    });

    const all = sold
      .filter((l) => l.ClosePrice && l.ClosePrice > 0)
      .sort((a, b) => (b.ClosePrice ?? 0) - (a.ClosePrice ?? 0))
      .map((l) => ({
        address: [l.StreetNumber, l.StreetName].filter(Boolean).join(" "),
        closePrice: l.ClosePrice!,
        listPrice: l.ListPrice,
        closeDate: l.CloseDate!,
        neighborhood: l.MLSAreaMajor ?? "Unknown",
      }));

    const totalVolume = all.reduce((sum, s) => sum + s.closePrice, 0);

    return {
      sales: all.slice(0, 20),
      totalYtdSales: all.length,
      totalVolume,
      highestSale: all[0] ?? null,
    };
  } catch (error) {
    console.error("Failed to fetch whale watch data:", error);
    return { sales: [], totalYtdSales: 0, totalVolume: 0, highestSale: null };
  }
}

// ─── Page ───────────────────────────────────────────────────

export default async function WhaleWatchPage() {
  const year = new Date().getFullYear();
  const { sales, totalYtdSales, totalVolume, highestSale } =
    await getWhaleWatchData();

  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--atlantic-navy)] py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Market Pulse", href: "/market-pulse" },
              { label: "Whale Watch" },
            ]}
          />
          <p className="text-[var(--cedar-shingle)] text-xs uppercase tracking-[0.25em] font-semibold mb-2 font-sans">
            Luxury Tracker
          </p>
          <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl font-serif">
            Whale Watch {year}
          </h1>
          <p className="text-white/50 text-sm sm:text-base mt-3 max-w-2xl">
            Nantucket&apos;s highest-value closed sales year-to-date — live from
            the MLS with Stephen Maury&apos;s expert analysis.
          </p>
        </div>
      </section>

      {/* Summary Stats */}
      <section className="py-10 sm:py-12 bg-[var(--sandstone)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cedar-shingle)] font-sans">
                YTD Sales
              </p>
              <p className="text-3xl font-serif text-[var(--atlantic-navy)] mt-1">
                {totalYtdSales}
              </p>
              <p className="text-sm text-[var(--nantucket-gray)] mt-1">
                Closed transactions in {year}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cedar-shingle)] font-sans">
                Total Volume
              </p>
              <p className="text-3xl font-serif text-[var(--atlantic-navy)] mt-1">
                {formatCurrency(totalVolume)}
              </p>
              <p className="text-sm text-[var(--nantucket-gray)] mt-1">
                Combined closed value
              </p>
            </div>

            <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cedar-shingle)] font-sans">
                Top Sale
              </p>
              <p className="text-3xl font-serif text-[var(--atlantic-navy)] mt-1">
                {highestSale ? formatCurrency(highestSale.closePrice) : "—"}
              </p>
              <p className="text-sm text-[var(--nantucket-gray)] mt-1">
                {highestSale ? highestSale.address : "No sales data yet"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sales Table */}
      <section className="py-10 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-[var(--atlantic-navy)] text-xl sm:text-2xl mb-6">
            Top {sales.length} Highest-Value Sales
          </h2>

          {sales.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-[var(--cedar-shingle)]/15">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--sandstone)]">
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">
                      #
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">
                      Address
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans hidden md:table-cell">
                      Neighborhood
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans hidden lg:table-cell">
                      List Price
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">
                      Sale Price
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans hidden lg:table-cell">
                      List/Sale
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans hidden sm:table-cell">
                      Closed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale, index) => {
                    const ratio = formatRatio(sale.closePrice, sale.listPrice);
                    const ratioNum = sale.listPrice
                      ? (sale.closePrice / sale.listPrice) * 100
                      : null;

                    return (
                      <tr
                        key={`${sale.address}-${sale.closeDate}`}
                        className="border-t border-[var(--cedar-shingle)]/10 hover:bg-[var(--sandstone)]/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--atlantic-navy)] text-white text-xs font-bold">
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-[var(--atlantic-navy)]">
                          {sale.address}
                        </td>
                        <td className="px-4 py-3 text-[var(--nantucket-gray)] hidden md:table-cell">
                          {sale.neighborhood}
                        </td>
                        <td className="px-4 py-3 text-right text-[var(--nantucket-gray)] hidden lg:table-cell">
                          {sale.listPrice
                            ? formatCurrency(sale.listPrice)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[var(--atlantic-navy)]">
                          {formatCurrency(sale.closePrice)}
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          {ratio ? (
                            <span
                              className={
                                ratioNum && ratioNum >= 100
                                  ? "text-[var(--privet-green)] font-medium"
                                  : "text-[var(--nantucket-gray)]"
                              }
                            >
                              {ratio}
                            </span>
                          ) : (
                            <span className="text-[var(--nantucket-gray)]">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-[var(--nantucket-gray)] hidden sm:table-cell">
                          {formatDate(sale.closeDate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--nantucket-gray)]">
              <p className="text-lg">No sales data available yet for {year}.</p>
              <p className="text-sm mt-2">
                Check back as transactions close throughout the year.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <CTASection />
    </>
  );
}
