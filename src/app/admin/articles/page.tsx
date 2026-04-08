"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  Star,
  FileText,
} from "lucide-react";

type ArticleListItem = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  category: string;
  published?: boolean;
  featured?: boolean;
};

export default function ArticlesAdmin() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/articles")
      .then((r) => r.json())
      .then((data) => {
        setArticles(data);
        setLoading(false);
      });
  }, []);

  async function deleteArticle(slug: string) {
    setDeleting(slug);
    try {
      const res = await fetch("/api/admin/articles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.slug !== slug));
      }
    } finally {
      setDeleting(null);
      setShowConfirm(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      {/* Header */}
      <section className="bg-[var(--atlantic-navy)] py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/80 text-xs mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-2xl sm:text-3xl">
                Articles & Guides
              </h1>
              <p className="text-white/50 mt-1 text-sm">
                Create and manage articles for the Intelligence Hub.
              </p>
            </div>
            <Link
              href="/admin/articles/new"
              className="inline-flex items-center gap-2 bg-[var(--privet-green)] text-white px-4 py-2.5 text-sm font-medium rounded-md hover:bg-[var(--privet-green)]/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Article
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <p className="text-sm text-[var(--nantucket-gray)] py-12 text-center">
            Loading articles...
          </p>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-12 text-center">
            <FileText className="w-10 h-10 text-[var(--nantucket-gray)]/40 mx-auto mb-4" />
            <p className="text-[var(--atlantic-navy)] font-semibold mb-1">
              No articles yet
            </p>
            <p className="text-sm text-[var(--nantucket-gray)] mb-6">
              Create your first article to get started.
            </p>
            <Link
              href="/admin/articles/new"
              className="inline-flex items-center gap-2 bg-[var(--privet-green)] text-white px-5 py-2.5 text-sm font-medium rounded-md hover:bg-[var(--privet-green)]/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Article
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <div
                key={article.slug}
                className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-5 flex items-start gap-4 hover:border-[var(--privet-green)]/20 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/admin/articles/${article.slug}`}
                      className="text-[var(--atlantic-navy)] font-semibold font-sans hover:text-[var(--privet-green)] transition-colors truncate"
                    >
                      {article.title || article.slug}
                    </Link>
                    {article.featured && (
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                    )}
                    {article.published === false && (
                      <span className="text-[10px] bg-[var(--nantucket-gray)]/10 text-[var(--nantucket-gray)] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--nantucket-gray)] line-clamp-1">
                    {article.summary || "No summary"}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[var(--nantucket-gray)]/70">
                    <span>{article.date}</span>
                    {article.category && (
                      <>
                        <span>&middot;</span>
                        <span>{article.category}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/articles/${article.slug}`}
                    className="p-2 text-[var(--nantucket-gray)] hover:text-[var(--atlantic-navy)] hover:bg-[var(--sandstone)] rounded transition-colors"
                    title={
                      article.published === false
                        ? "Preview (draft)"
                        : "View live"
                    }
                  >
                    {article.published === false ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Link>
                  <Link
                    href={`/admin/articles/${article.slug}`}
                    className="p-2 text-[var(--nantucket-gray)] hover:text-[var(--privet-green)] hover:bg-[var(--privet-green)]/5 rounded transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>

                  {showConfirm === article.slug ? (
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        onClick={() => deleteArticle(article.slug)}
                        disabled={deleting === article.slug}
                        className="text-xs text-red-600 font-medium hover:underline disabled:opacity-50"
                      >
                        {deleting === article.slug
                          ? "Deleting..."
                          : "Confirm"}
                      </button>
                      <button
                        onClick={() => setShowConfirm(null)}
                        className="text-xs text-[var(--nantucket-gray)] hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirm(article.slug)}
                      className="p-2 text-[var(--nantucket-gray)] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
