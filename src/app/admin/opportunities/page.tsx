"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Inbox } from "lucide-react";
import type { OpportunitySubmission, OpportunityCategory } from "@/types";

const categoryLabels: Record<OpportunityCategory, string> = {
  "for-sale-by-owner": "FSBO",
  "for-rent-by-owner": "FRBO",
  "wanted-to-buy": "Buyer",
  "wanted-to-rent": "Renter",
  services: "Services",
  "workforce-housing": "Housing",
};

const statusColors: Record<string, string> = {
  new: "bg-[var(--privet-green)] text-white",
  reviewed: "bg-amber-100 text-amber-700",
  matched: "bg-blue-100 text-blue-700",
  closed: "bg-gray-100 text-gray-500",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminOpportunitiesPage() {
  const [submissions, setSubmissions] = useState<OpportunitySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set("category", filter);
      const res = await fetch(`/api/opportunities?${params}`);
      const json = await res.json();
      setSubmissions(json.data ?? []);
    } catch (e) {
      console.error("Failed to load submissions:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filter]);

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-white/40 text-xs uppercase tracking-wider font-sans mb-1">Admin</p>
          <h1 className="text-white text-2xl sm:text-3xl">Opportunity Submissions</h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-md border border-[var(--cedar-shingle)]/20 text-sm bg-white"
          >
            <option value="">All Categories</option>
            <option value="for-sale-by-owner">For Sale by Owner</option>
            <option value="for-rent-by-owner">For Rent by Owner</option>
            <option value="wanted-to-buy">Wanted to Buy</option>
            <option value="wanted-to-rent">Wanted to Rent</option>
            <option value="services">Services</option>
            <option value="workforce-housing">Workforce Housing</option>
          </select>
          <button
            onClick={fetchData}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-[var(--atlantic-navy)] bg-white border border-[var(--cedar-shingle)]/20 rounded-md hover:bg-[var(--sandstone)]"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <span className="text-xs text-[var(--nantucket-gray)] ml-auto">
            {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--nantucket-gray)]" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--nantucket-gray)]">
            <Inbox className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[var(--sandstone)]/30 transition-colors"
                >
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusColors[s.status]}`}>
                    {s.status.toUpperCase()}
                  </span>
                  <span className="text-xs font-semibold text-[var(--cedar-shingle)] bg-[var(--sandstone)] px-2 py-0.5 rounded">
                    {categoryLabels[s.category]}
                  </span>
                  <span className="text-sm font-medium text-[var(--atlantic-navy)] flex-1">
                    {s.name}
                  </span>
                  <span className="text-xs text-[var(--nantucket-gray)]">
                    {s.email}
                  </span>
                  <span className="text-xs text-[var(--nantucket-gray)]">
                    {formatDate(s.submittedAt)}
                  </span>
                </button>

                {expanded === s.id && (
                  <div className="px-5 pb-4 border-t border-[var(--cedar-shingle)]/10">
                    <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                      {s.phone && (
                        <div>
                          <span className="text-[var(--nantucket-gray)]">Phone:</span>{" "}
                          <span className="text-[var(--atlantic-navy)]">{s.phone}</span>
                        </div>
                      )}
                      {Object.entries(s.data).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-[var(--nantucket-gray)] capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}:
                          </span>{" "}
                          <span className="text-[var(--atlantic-navy)]">
                            {String(value) || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
