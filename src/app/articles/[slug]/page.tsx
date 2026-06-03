import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { getArticle, listArticles } from "@/lib/content";
import { renderArticleMDX, extractHeadings } from "@/lib/mdx";
import { CategoryBadge } from "@/components/articles/CategoryBadge";
import { ReadingTime } from "@/components/articles/ReadingTime";
import { TableOfContents, TableOfContentsMobile } from "@/components/articles/TableOfContents";
import { ArticleFooter } from "@/components/articles/ArticleFooter";
import { ArticleStructuredData } from "@/components/articles/ArticleStructuredData";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const articles = listArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};

  const { meta } = article;
  return {
    title: `${meta.title} | NantucketHouses.com`,
    description: meta.summary,
    keywords: meta.tags,
    openGraph: {
      title: meta.title,
      description: meta.summary,
      type: "article",
      publishedTime: meta.date,
      authors: [meta.author ?? "Stephen Maury"],
      ...(meta.heroImage ? { images: [meta.heroImage] } : {}),
    },
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return notFound();

  const { meta, source } = article;
  const content = await renderArticleMDX(source);
  const headings = extractHeadings(source);
  const wordCount = source.trim().split(/\s+/).filter(Boolean).length;

  // Related articles: same category, excluding current, max 3
  const related = listArticles()
    .filter((a) => a.category === meta.category && a.slug !== slug)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <ArticleStructuredData article={meta} wordCount={wordCount} />

      {/* Header */}
      <section className="bg-[var(--atlantic-navy)] py-10 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-white/40 font-sans mb-4">
            <Link href="/" className="hover:text-white/60 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/articles" className="hover:text-white/60 transition-colors">
              Articles
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/60 truncate max-w-[200px]">{meta.title}</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <CategoryBadge category={meta.category} size="md" />
          </div>

          <h1 className="text-white text-2xl sm:text-4xl mb-4 max-w-3xl">
            {meta.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-white/50 font-sans">
            <span>{meta.author ?? "Stephen Maury"}</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>{formatDate(meta.date)}</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <ReadingTime minutes={meta.readingTime} className="text-white/50" />
          </div>
        </div>
      </section>

      {/* Content */}
      <article className="py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile ToC */}
          <TableOfContentsMobile headings={headings} />

          <div className="flex gap-10">
            {/* Main Content */}
            <div className="flex-1 min-w-0 max-w-3xl">
              {content}
              <ArticleFooter relatedArticles={related} />
            </div>

            {/* Desktop Sticky ToC */}
            <div className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <TableOfContents headings={headings} />
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
