"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";

const CATEGORIES = [
  "Market Analysis",
  "Regulatory",
  "Building & Design",
  "Neighborhood",
  "Lifestyle",
  "Affordable Housing",
];

type Frontmatter = {
  title: string;
  date: string;
  summary: string;
  category: string;
  tags: string[];
  featured: boolean;
  published: boolean;
  author: string;
  heroImage: string;
};

const EMPTY_FM: Frontmatter = {
  title: "",
  date: new Date().toISOString().split("T")[0],
  summary: "",
  category: "Market Analysis",
  tags: [],
  featured: false,
  published: true,
  author: "Stephen Maury",
  heroImage: "",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function ArticleEditor({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = use(params);
  const isNew = rawSlug === "new";
  const router = useRouter();

  const [slug, setSlug] = useState(isNew ? "" : rawSlug);
  const [slugManual, setSlugManual] = useState(false);
  const [fm, setFm] = useState<Frontmatter>(EMPTY_FM);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [tagsInput, setTagsInput] = useState("");

  // Load existing article
  useEffect(() => {
    if (isNew) return;
    fetch("/api/admin/articles")
      .then((r) => r.json())
      .then((articles: Array<Frontmatter & { slug: string; content: string }>) => {
        const article = articles.find(
          (a) => a.slug === rawSlug
        );
        if (article) {
          setFm({
            title: article.title || "",
            date: article.date || "",
            summary: article.summary || "",
            category: article.category || "Market Analysis",
            tags: article.tags || [],
            featured: article.featured ?? false,
            published: article.published ?? true,
            author: article.author || "Stephen Maury",
            heroImage: article.heroImage || "",
          });
          setContent(article.content || "");
          setTagsInput((article.tags || []).join(", "));
          setSlugManual(true);
        }
        setLoading(false);
      });
  }, [isNew, rawSlug]);

  // Auto-generate slug from title (only for new articles with manual override off)
  useEffect(() => {
    if (isNew && !slugManual && fm.title) {
      setSlug(slugify(fm.title));
    }
  }, [fm.title, isNew, slugManual]);

  // Render markdown preview
  const renderPreview = useCallback(async () => {
    if (!content.trim()) {
      setPreviewHtml("<p class='text-gray-400'>Start writing to see preview...</p>");
      return;
    }
    try {
      const res = await fetch("/api/admin/articles/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const { html } = await res.json();
        setPreviewHtml(html);
      }
    } catch {
      setPreviewHtml("<p class='text-red-500'>Preview error</p>");
    }
  }, [content]);

  useEffect(() => {
    if (preview) {
      const timer = setTimeout(renderPreview, 500);
      return () => clearTimeout(timer);
    }
  }, [content, preview, renderPreview]);

  function updateFm(patch: Partial<Frontmatter>) {
    setFm((prev) => ({ ...prev, ...patch }));
  }

  function handleTagsChange(value: string) {
    setTagsInput(value);
    updateFm({
      tags: value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  }

  async function save() {
    if (!slug || !fm.title || !fm.date) {
      setMessage("Title, date, and slug are required.");
      return;
    }

    setSaving(true);
    setMessage("");

    // Build frontmatter object (omit empty optional fields)
    const frontmatter: Record<string, unknown> = {
      title: fm.title,
      date: fm.date,
      summary: fm.summary,
      category: fm.category,
      author: fm.author,
      published: fm.published,
    };
    if (fm.tags.length > 0) frontmatter.tags = fm.tags;
    if (fm.featured) frontmatter.featured = true;
    if (fm.heroImage) frontmatter.heroImage = fm.heroImage;

    try {
      const res = await fetch("/api/admin/articles", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, frontmatter, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Save failed");
      } else {
        setMessage(
          isNew ? "Article created!" : "Article updated!"
        );
        if (isNew) {
          // Navigate to the edit page for the newly created article
          router.replace(`/admin/articles/${slug}`);
        }
      }
    } catch {
      setMessage("Error saving. Check the console.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--sandstone)] flex items-center justify-center">
        <p className="text-sm text-[var(--nantucket-gray)]">
          Loading article...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      {/* Header */}
      <section className="bg-[var(--atlantic-navy)] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/admin/articles"
            className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/80 text-xs mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Articles
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-white text-xl sm:text-2xl">
              {isNew ? "New Article" : `Edit: ${fm.title || rawSlug}`}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreview(!preview)}
                className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white border border-white/20 px-3 py-2 rounded-md transition-colors"
              >
                {preview ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {preview ? "Editor" : "Preview"}
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[var(--privet-green)] text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-[var(--privet-green)]/90 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />{" "}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          {message && (
            <p
              className={`mt-2 text-sm ${message.includes("Error") || message.includes("required") || message.includes("failed") ? "text-red-300" : "text-green-300"}`}
            >
              {message}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div
          className={`grid gap-6 ${preview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
        >
          {/* Editor column */}
          <div className="space-y-6">
            {/* Frontmatter */}
            <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--nantucket-gray)] font-sans mb-4">
                Article Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--atlantic-navy)]/60 uppercase tracking-wider font-sans mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={fm.title}
                    onChange={(e) => updateFm({ title: e.target.value })}
                    placeholder="Your article title"
                    className="w-full rounded-md border border-[var(--cedar-shingle)]/20 px-3 py-2 text-sm text-[var(--atlantic-navy)] focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none"
                  />
                </div>

                {/* Slug */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--atlantic-navy)]/60 uppercase tracking-wider font-sans mb-1">
                    Slug{" "}
                    {isNew && !slugManual && (
                      <button
                        onClick={() => setSlugManual(true)}
                        className="text-[var(--privet-green)] normal-case tracking-normal font-normal hover:underline"
                      >
                        (auto — click to edit manually)
                      </button>
                    )}
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugManual(true);
                    }}
                    disabled={!isNew}
                    placeholder="article-url-slug"
                    className="w-full rounded-md border border-[var(--cedar-shingle)]/20 px-3 py-2 text-sm text-[var(--atlantic-navy)] font-mono focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none disabled:bg-[var(--sandstone)] disabled:text-[var(--nantucket-gray)]"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--atlantic-navy)]/60 uppercase tracking-wider font-sans mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={fm.date}
                    onChange={(e) => updateFm({ date: e.target.value })}
                    className="w-full rounded-md border border-[var(--cedar-shingle)]/20 px-3 py-2 text-sm text-[var(--atlantic-navy)] focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--atlantic-navy)]/60 uppercase tracking-wider font-sans mb-1">
                    Category
                  </label>
                  <select
                    value={fm.category}
                    onChange={(e) => updateFm({ category: e.target.value })}
                    className="w-full rounded-md border border-[var(--cedar-shingle)]/20 px-3 py-2 text-sm text-[var(--atlantic-navy)] focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Author */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--atlantic-navy)]/60 uppercase tracking-wider font-sans mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    value={fm.author}
                    onChange={(e) => updateFm({ author: e.target.value })}
                    className="w-full rounded-md border border-[var(--cedar-shingle)]/20 px-3 py-2 text-sm text-[var(--atlantic-navy)] focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--atlantic-navy)]/60 uppercase tracking-wider font-sans mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="housing, market-data, hdc"
                    className="w-full rounded-md border border-[var(--cedar-shingle)]/20 px-3 py-2 text-sm text-[var(--atlantic-navy)] focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none"
                  />
                </div>

                {/* Summary */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--atlantic-navy)]/60 uppercase tracking-wider font-sans mb-1">
                    Summary
                  </label>
                  <textarea
                    value={fm.summary}
                    onChange={(e) => updateFm({ summary: e.target.value })}
                    rows={2}
                    placeholder="Brief description for article cards and SEO..."
                    className="w-full rounded-md border border-[var(--cedar-shingle)]/20 px-3 py-2 text-sm text-[var(--atlantic-navy)] focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none resize-y"
                  />
                </div>

                {/* Hero Image */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--atlantic-navy)]/60 uppercase tracking-wider font-sans mb-1">
                    Hero Image URL (optional)
                  </label>
                  <input
                    type="text"
                    value={fm.heroImage}
                    onChange={(e) => updateFm({ heroImage: e.target.value })}
                    placeholder="/images/article-hero.webp"
                    className="w-full rounded-md border border-[var(--cedar-shingle)]/20 px-3 py-2 text-sm text-[var(--atlantic-navy)] focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none"
                  />
                </div>

                {/* Toggles */}
                <div className="sm:col-span-2 flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fm.published}
                      onChange={(e) =>
                        updateFm({ published: e.target.checked })
                      }
                      className="rounded border-[var(--cedar-shingle)]/30 text-[var(--privet-green)] focus:ring-[var(--privet-green)]"
                    />
                    <span className="text-sm text-[var(--atlantic-navy)]">
                      Published
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fm.featured}
                      onChange={(e) =>
                        updateFm({ featured: e.target.checked })
                      }
                      className="rounded border-[var(--cedar-shingle)]/30 text-[var(--privet-green)] focus:ring-[var(--privet-green)]"
                    />
                    <span className="text-sm text-[var(--atlantic-navy)]">
                      Featured
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Content editor */}
            <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--nantucket-gray)] font-sans mb-4">
                Content (Markdown)
              </h2>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={24}
                placeholder="Write your article in Markdown...

## Section Heading

Your content here. You can use **bold**, *italic*, [links](url), and more.

### Subheading

- Bullet points
- More points"
                className="w-full rounded-md border border-[var(--cedar-shingle)]/20 px-4 py-3 text-sm text-[var(--atlantic-navy)] font-mono leading-relaxed focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none resize-y"
              />
            </div>
          </div>

          {/* Preview column */}
          {preview && (
            <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-8 h-fit sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--nantucket-gray)] font-sans">
                  Preview
                </h2>
                {fm.published === false && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Draft
                  </span>
                )}
              </div>

              {/* Title preview */}
              {fm.title && (
                <h1 className="text-2xl sm:text-3xl font-serif text-[var(--atlantic-navy)] mb-3">
                  {fm.title}
                </h1>
              )}
              {fm.summary && (
                <p className="text-sm text-[var(--nantucket-gray)] mb-4 leading-relaxed">
                  {fm.summary}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-[var(--nantucket-gray)] mb-6 pb-6 border-b border-[var(--cedar-shingle)]/10">
                <span>{fm.author}</span>
                <span>&middot;</span>
                <span>{fm.date}</span>
                <span>&middot;</span>
                <span>{fm.category}</span>
              </div>

              {/* Rendered markdown */}
              <div
                className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-[var(--atlantic-navy)] prose-p:text-[var(--atlantic-navy)]/80 prose-li:text-[var(--atlantic-navy)]/80 prose-strong:text-[var(--atlantic-navy)]"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
