"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { DerivedMetricRow, PropertyFactSection, PropertyFactRow } from "@/lib/get-listing-detail";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/components/ui/utils";

type Props = {
  sections: PropertyFactSection[];
  derivedMetrics: DerivedMetricRow[];
  assessorUrl: string;
};

function RowLink({ row }: { row: PropertyFactRow }) {
  if (!row.href || !row.hrefLabel) return null;
  const external = /^https?:\/\//i.test(row.href);
  const className = "font-medium text-[var(--privet-green)] hover:underline";
  if (external) {
    return (
      <a href={row.href} target="_blank" rel="noopener noreferrer" className={className}>
        {row.hrefLabel}
      </a>
    );
  }
  return (
    <Link href={row.href} className={className}>
      {row.hrefLabel}
    </Link>
  );
}

function sectionByTitle(sections: PropertyFactSection[], title: string): PropertyFactSection | undefined {
  return sections.find((s) => s.title === title);
}

function FactSection({ sec }: { sec: PropertyFactSection }) {
  return (
    <div>
      <h3 className="border-b border-[#e8edf4] pb-2 text-sm font-semibold uppercase tracking-wide text-[var(--atlantic-navy)]">
        {sec.title}
      </h3>
      <div className="mt-2 divide-y divide-[#e8edf4] overflow-hidden rounded-lg border border-[#e8edf4] bg-white">
        {sec.rows.map((row) => (
          <div
            key={`${sec.title}-${row.label}`}
            className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-start sm:gap-4"
          >
            <div className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--nantucket-gray)] sm:w-52">
              {row.label}
            </div>
            <div
              className={cn(
                "min-w-0 flex-1 text-sm font-semibold text-[var(--atlantic-navy)] sm:text-[15px]",
                row.multiline && "whitespace-pre-line font-medium",
              )}
            >
              {row.value}
              {row.href && row.hrefLabel ? (
                <>
                  {" "}
                  <RowLink row={row} />
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FactPairGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-8 print:grid-cols-1 lg:grid-cols-2 lg:items-start lg:gap-6">{children}</div>
  );
}

function pairStructureAndSystems(sections: PropertyFactSection[]): {
  paired: [PropertyFactSection, PropertyFactSection] | null;
  rest: PropertyFactSection[];
} {
  if (
    sections.length >= 2 &&
    sections[0]!.title === "Structure" &&
    sections[1]!.title === "Systems & utilities"
  ) {
    return { paired: [sections[0]!, sections[1]!], rest: sections.slice(2) };
  }
  return { paired: null, rest: sections };
}

function pairInteriorAndOther(rest: PropertyFactSection[]): {
  paired: [PropertyFactSection, PropertyFactSection] | null;
  restOut: PropertyFactSection[];
} {
  if (
    rest.length >= 2 &&
    rest[0]!.title === "Interior" &&
    rest[1]!.title === "Other features"
  ) {
    return { paired: [rest[0]!, rest[1]!], restOut: rest.slice(2) };
  }
  return { paired: null, restOut: rest };
}

function MobileCollapsibleBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Collapsible defaultOpen={false} className="group overflow-hidden rounded-lg border border-[#e8edf4] bg-white">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left transition-colors hover:bg-[var(--sandstone)]/40">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--atlantic-navy)]">
          {title}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--nantucket-gray)] transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-[#e8edf4] px-2 pb-4 pt-2">
        <div className="space-y-6">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ListingPropertyFacts({ sections, derivedMetrics, assessorUrl }: Props) {
  const structure = sectionByTitle(sections, "Structure");
  const systems = sectionByTitle(sections, "Systems & utilities");
  const interior = sectionByTitle(sections, "Interior");
  const other = sectionByTitle(sections, "Other features");
  const narrative = sectionByTitle(sections, "Narrative");
  const finances = sectionByTitle(sections, "Finances");

  const { paired: structureSystems, rest: afterStructureSystems } = pairStructureAndSystems(sections);
  const { paired: interiorOther, restOut: tailSections } = pairInteriorAndOther(afterStructureSystems);

  return (
    <section className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-[var(--atlantic-navy)]">Property facts</h2>
      <p className="mt-1 text-sm text-[var(--nantucket-gray)]">
        Grouped technical fields from LINK and public records. A dash means the field was not present in this
        listing&apos;s payload.
      </p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <a
          href={assessorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--privet-green)] hover:underline"
        >
          Town assessor
        </a>
      </div>

      {derivedMetrics.length > 0 ? (
        <div className="mt-6 rounded-lg border border-[#074059]/20 bg-[var(--sandstone)]/40 px-4 py-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--atlantic-navy)]">
            Derived metrics
          </h3>
          <dl className="mt-3 space-y-3">
            {derivedMetrics.map((d) => (
              <div key={d.label}>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--nantucket-gray)]">
                  {d.label}
                </dt>
                <dd
                  title={d.valueTitle}
                  className={cn(
                    "mt-0.5 whitespace-pre-line font-listing-mono text-sm font-bold tabular-nums",
                    d.valueTone === "favorable"
                      ? "inline-block max-w-full rounded px-1.5 py-0.5 text-emerald-900 ring-1 ring-emerald-200/80 bg-emerald-50"
                      : "text-[var(--atlantic-navy)]",
                  )}
                >
                  {d.value}
                </dd>
                {d.sub ? (
                  <dd className="mt-1 text-[11px] leading-snug text-[var(--nantucket-gray)]">{d.sub}</dd>
                ) : null}
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {/* Mobile: key sections open; long groups in drawers */}
      <div className="mt-8 space-y-4 md:hidden">
        {structure ? <FactSection sec={structure} /> : null}
        {other ? <FactSection sec={other} /> : null}
        {finances ? <FactSection sec={finances} /> : null}
        {(interior || narrative) && (
          <MobileCollapsibleBlock title="Interior details">
            {interior ? <FactSection sec={interior} /> : null}
            {narrative ? <FactSection sec={narrative} /> : null}
          </MobileCollapsibleBlock>
        )}
        {systems ? (
          <MobileCollapsibleBlock title="Systems & utilities">
            <FactSection sec={systems} />
          </MobileCollapsibleBlock>
        ) : null}
      </div>

      {/* Tablet/desktop: paired grids + tail */}
      <div className="mt-8 hidden space-y-8 md:block">
        {structureSystems ? (
          <FactPairGrid>
            <FactSection sec={structureSystems[0]} />
            <FactSection sec={structureSystems[1]} />
          </FactPairGrid>
        ) : null}
        {interiorOther ? (
          <FactPairGrid>
            <FactSection sec={interiorOther[0]} />
            <FactSection sec={interiorOther[1]} />
          </FactPairGrid>
        ) : null}
        {tailSections.map((sec) => (
          <FactSection key={sec.title} sec={sec} />
        ))}
      </div>
    </section>
  );
}
