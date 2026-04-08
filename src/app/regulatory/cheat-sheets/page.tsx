"use client";

import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";
import { Download, FileText, Lock } from "lucide-react";

const cheatSheets = [
  {
    title: "HDC Application Guidelines",
    description: "Complete guide to preparing a successful HDC application — materials, documentation, and common pitfalls.",
    filename: "hdc-guidelines-2026.pdf",
    pages: 12,
  },
  {
    title: "Zoning by Neighborhood",
    description: "Quick-reference table of zoning districts, setbacks, ground cover limits, and height restrictions for every Nantucket neighborhood.",
    filename: "zoning-by-neighborhood-2026.pdf",
    pages: 4,
  },
  {
    title: "Common Variances & How to Get Them",
    description: "The most frequently requested variances on Nantucket, success rates, and what the ZBA looks for in hardship arguments.",
    filename: "common-variances-guide.pdf",
    pages: 8,
  },
  {
    title: "Ground Cover Calculation Worksheet",
    description: "Step-by-step worksheet for calculating your lot's ground cover ratio, including the new permeable paver rules.",
    filename: "ground-cover-worksheet.pdf",
    pages: 2,
  },
];

export default function CheatSheetsPage() {
  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Regulatory Hub", href: "/regulatory" },
              { label: "Cheat Sheets" },
            ]}
          />
          <h1 className="text-white text-3xl sm:text-4xl">Regulatory Cheat Sheets</h1>
          <p className="text-white/50 mt-2 text-sm max-w-2xl">
            Downloadable reference guides for HDC applications, zoning regulations,
            and common variances. Built for architects, contractors, and homeowners.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {cheatSheets.map((sheet) => (
              <div
                key={sheet.filename}
                className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-5 flex items-start gap-4"
              >
                <div className="p-3 rounded-lg bg-[var(--sandstone)] shrink-0">
                  <FileText className="w-6 h-6 text-[var(--cedar-shingle)]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[var(--atlantic-navy)] mb-1 font-sans">
                    {sheet.title}
                  </h3>
                  <p className="text-xs text-[var(--nantucket-gray)] leading-relaxed mb-3">
                    {sheet.description}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[var(--nantucket-gray)]">
                      PDF · {sheet.pages} pages
                    </span>
                    <button
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--privet-green)] hover:underline"
                      onClick={() => {
                        // In production: trigger Klaviyo email capture modal, then deliver PDF
                        alert("PDF downloads will be gated behind email capture (Klaviyo). Coming soon!");
                      }}
                    >
                      <Lock className="w-3 h-3" />
                      Download (email required)
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white rounded-lg border-l-4 border-[var(--cedar-shingle)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cedar-shingle)] mb-2 font-sans">
              Note
            </p>
            <p className="text-xs text-[var(--atlantic-navy)]/70 leading-relaxed">
              These guides are updated annually and reflect current regulations as of 2026.
              Always verify specific requirements with the Town of Nantucket before relying
              on this information for permit applications.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
