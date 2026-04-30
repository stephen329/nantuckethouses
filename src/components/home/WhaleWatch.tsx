import type { WhaleWatchSale } from "@/types";
import { nantucketLinkListingUrl } from "@/lib/link-listing-url";

type Props = {
  sales: WhaleWatchSale[];
  year: number;
};

/** Linked row: underline + hover; text color comes from `className` or defaults to Atlantic navy. */
const linkAffordance =
  "underline decoration-[var(--cedar-shingle)]/50 underline-offset-2 hover:text-[var(--privet-green)] hover:decoration-[var(--privet-green)]/50";

/** Renders the street address; when `linkListingId` is set, links to the public LINK listing page. */
export function WhaleWatchSaleAddress({
  sale,
  className,
}: {
  sale: WhaleWatchSale;
  className?: string;
}) {
  if (sale.linkListingId) {
    const merged = [linkAffordance, className ?? "font-medium text-[var(--atlantic-navy)]"]
      .filter(Boolean)
      .join(" ");
    return (
      <a
        href={nantucketLinkListingUrl(sale.linkListingId)}
        target="_blank"
        rel="noopener noreferrer"
        className={merged}
      >
        {sale.address}
      </a>
    );
  }
  return <span className={className}>{sale.address}</span>;
}

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

export function WhaleWatch({ sales, year }: Props) {
  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-[var(--cedar-shingle)] text-xs uppercase tracking-[0.25em] font-semibold mb-2 font-sans">
            Luxury Tracker
          </p>
          <h2 className="text-[var(--atlantic-navy)]">Whale Watch {year}</h2>
          <p className="text-sm text-[var(--nantucket-gray)] mt-1">
            Top 5 highest-value closed sales year-to-date
          </p>
        </div>

        {/* Sales Table */}
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
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">
                  Neighborhood
                </th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">
                  Sale Price
                </th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans hidden sm:table-cell">
                  Closed
                </th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale, index) => (
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
                    <WhaleWatchSaleAddress sale={sale} />
                  </td>
                  <td className="px-4 py-3 text-[var(--nantucket-gray)]">
                    {sale.neighborhood}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--atlantic-navy)]">
                    {formatCurrency(sale.closePrice)}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--nantucket-gray)] hidden sm:table-cell">
                    {formatDate(sale.closeDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
}
