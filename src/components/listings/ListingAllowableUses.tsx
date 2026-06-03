"use client";

import Link from "next/link";
import { ParcelZoningUsesSection } from "@/components/zoning/ParcelZoningUsesSection";
import type { ListingAllowableUsesModule } from "@/lib/zoning-allowable-uses";

type Props = {
  block: ListingAllowableUsesModule;
};

export function ListingAllowableUses({ block }: Props) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-white p-4 sm:p-6 shadow-sm print:break-inside-avoid">
      <h2 className="text-lg font-semibold text-[var(--atlantic-navy)]">Allowable uses</h2>
      <p className="mt-1 text-sm text-[var(--nantucket-gray)]">
        Uses permitted in the zoning district for this listing&apos;s assessor parcel match—the same chart and filters
        as the Property Map when a parcel is selected.
      </p>

      {!block.matched ? (
        <div className="mt-4 rounded-lg border border-dashed border-[#cfd8e6] bg-[var(--sandstone)]/30 px-4 py-3 text-sm text-[var(--nantucket-gray)]">
          <p>
            We couldn&apos;t match this listing&apos;s street address to a parcel in the assessor file, so allowable uses
            aren&apos;t shown here. Open the{" "}
            <Link href="/map" className="font-medium text-[var(--privet-green)] hover:underline">
              Property Map
            </Link>{" "}
            or{" "}
            <Link href="/tools/zoning-lookup" className="font-medium text-[var(--privet-green)] hover:underline">
              Zoning lookup
            </Link>{" "}
            to pick the parcel manually.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-[#e8edf4] pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--nantucket-gray)]">
                Assessor zoning district
              </p>
              <p className="mt-0.5 text-sm font-bold text-[var(--atlantic-navy)]">
                {block.zoningCode}
                {block.districtName ? (
                  <span className="ml-2 font-semibold text-[var(--nantucket-gray)]">· {block.districtName}</span>
                ) : null}
              </p>
            </div>
            {block.zoningLookupPath ? (
              <Link
                href={block.zoningLookupPath}
                className="shrink-0 text-sm font-medium text-[var(--privet-green)] hover:underline"
              >
                Parcel in zoning lookup →
              </Link>
            ) : null}
          </div>
          <div className="-mx-4 mt-2 sm:-mx-6">
            <ParcelZoningUsesSection
              zoningUseRows={block.rows}
              legend={block.legend}
              chartSource={block.chartSource}
            />
          </div>
        </>
      )}
    </section>
  );
}
