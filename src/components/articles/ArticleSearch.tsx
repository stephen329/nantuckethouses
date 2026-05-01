"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { ArticleMeta } from "@/lib/content";
import { ArticleCard } from "./ArticleCard";

type Props = {
  articles: ArticleMeta[];
};

export function ArticleSearch({ articles }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? articles.filter((a) => {
        const q = query.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.tags?.some((t) => t.toLowerCase().includes(q))
        );
      })
    : articles;

  return (
    <>
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nantucket-gray)]" />
        <input
          type="text"
          placeholder="Search articles by title, topic, or category..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="brand-input pl-10 pr-4 py-3 text-sm font-sans placeholder:text-[var(--nantucket-gray)]"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-[var(--nantucket-gray)] py-12 font-sans">
          No articles match your search. Try a different term.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      )}
    </>
  );
}
