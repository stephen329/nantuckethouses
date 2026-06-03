import type { Metadata } from "next";
import { listArticles } from "@/lib/content";
import { FeaturedArticleCard } from "@/components/articles/FeaturedArticleCard";
import { TopReadsSidebar } from "@/components/articles/TopReadsSidebar";
import { ArticleSearch } from "@/components/articles/ArticleSearch";

export const metadata: Metadata = {
  title: "Articles & Guides | NantucketHouses.com",
  description:
    "Market analysis, regulatory how-tos, building cost guides, neighborhood deep dives, and designer insights for Nantucket real estate.",
  openGraph: {
    title: "Articles & Guides | NantucketHouses.com",
    description:
      "Expert guides and analysis for Nantucket real estate — from HDC approvals to market trends.",
  },
};

export default function ArticlesPage() {
  const allArticles = listArticles();

  // Featured article: first with featured: true, or fallback to latest
  const featured = allArticles.find((a) => a.featured) ?? allArticles[0];

  // Top reads: up to 5 articles excluding featured
  const topReads = allArticles
    .filter((a) => a.slug !== featured?.slug)
    .slice(0, 5);

  // Remaining articles for the grid (exclude featured)
  const gridArticles = allArticles.filter(
    (a) => a.slug !== featured?.slug
  );

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      {/* Header */}
      <section className="bg-[var(--atlantic-navy)] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[var(--cedar-shingle)] text-xs uppercase tracking-[0.25em] font-semibold mb-2 font-sans" style={{ color: "#a89080" }}>
            Intelligence Hub
          </p>
          <h1 className="text-white text-3xl sm:text-4xl">
            Articles &amp; Guides
          </h1>
          <p className="text-white/50 mt-2 text-sm max-w-2xl font-sans">
            Market analysis, regulatory how-tos, building cost guides,
            neighborhood deep dives, and designer insights — written by someone
            who actually lives here.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {allArticles.length === 0 ? (
            <p className="text-center text-[var(--nantucket-gray)] py-12 font-sans">
              No articles published yet. Check back soon.
            </p>
          ) : (
            <>
              {/* Hero Row: Featured + Top Reads */}
              {featured && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                  <div className="lg:col-span-2">
                    <FeaturedArticleCard article={featured} />
                  </div>
                  <div className="lg:col-span-1">
                    <TopReadsSidebar articles={topReads} />
                  </div>
                </div>
              )}

              {/* Search + Article Grid */}
              {gridArticles.length > 0 && (
                <div>
                  <h2 className="text-xl text-[var(--atlantic-navy)] mb-6">
                    All Articles
                  </h2>
                  <ArticleSearch articles={gridArticles} />
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
