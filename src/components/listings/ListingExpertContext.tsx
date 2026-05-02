import type { ListingDetailPayload } from "@/lib/get-listing-detail";

type Props = {
  payload: ListingDetailPayload;
};

export function ListingExpertContext({ payload }: Props) {
  const { expertParagraph, islandContextRows, island, dataAsOfDateLabel, lastUpdatedAtLabel } = payload;

  return (
    <section className="grid gap-6 print:grid-cols-1 lg:grid-cols-[1fr_300px]">
      <div className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--atlantic-navy)]">Stephen Maury&apos;s take</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--atlantic-navy)]/90">{expertParagraph}</p>
        <p className="mt-4 text-xs text-[var(--nantucket-gray)]">
          Context as of {dataAsOfDateLabel}
          {lastUpdatedAtLabel ? ` · feed snapshot ${lastUpdatedAtLabel}` : ""}. Not investment advice.
        </p>
      </div>
      <aside className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-[var(--sandstone)]/50 p-4 sm:p-5 text-sm min-w-0">
        <h3 className="font-semibold text-[var(--atlantic-navy)]">Island context</h3>
        <p className="mt-1 text-xs text-[var(--nantucket-gray)]">
          Same LINK pull as benchmarks ({island.activeCount} active / {island.sold12moCount} sold 12 mo).
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-[#e0e6ef] bg-white">
          <table className="w-full min-w-[260px] text-xs">
            <tbody className="divide-y divide-[#eef2f7]">
              {islandContextRows.map((row) => (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className="w-[52%] px-2.5 py-2 text-left font-medium text-[var(--nantucket-gray)] align-top"
                  >
                    {row.label}
                  </th>
                  <td className="px-2.5 py-2 text-right font-semibold tabular-nums text-[var(--atlantic-navy)] align-top">
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] leading-snug text-[var(--nantucket-gray)]">
          New construction all-in often lands near $1,000–$1,400/SF before land and soft costs—sanity check only.
        </p>
      </aside>
    </section>
  );
}
