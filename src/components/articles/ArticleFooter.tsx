import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ArticleMeta } from "@/lib/content";
import { CategoryBadge } from "./CategoryBadge";
import { ReadingTime } from "./ReadingTime";

type Props = {
  relatedArticles: ArticleMeta[];
};

export function ArticleFooter({ relatedArticles }: Props) {
  return (
    <footer className="mt-16 pt-10 border-t border-[var(--cedar-shingle)]/15">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Related Articles */}
        <div className="lg:col-span-3">
          {relatedArticles.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-[var(--atlantic-navy)] mb-4">
                Related Articles
              </h3>
              <div className="space-y-4">
                {relatedArticles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/articles/${article.slug}`}
                    className="block brand-surface brand-surface-hover p-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <CategoryBadge category={article.category} />
                      <ReadingTime minutes={article.readingTime} />
                    </div>
                    <p className="text-sm font-semibold text-[var(--atlantic-navy)]">
                      {article.title}
                    </p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Opportunity Desk CTA */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--atlantic-navy)] rounded-lg p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--nantucket-gray)] mb-2 font-sans">
              The Opportunity Desk
            </p>
            <h3 className="text-lg mb-3">
              Applying these insights to a specific property?
            </h3>
            <p className="text-sm text-white/70 mb-4 font-sans leading-relaxed">
              Submit a project gut-check to the Opportunity Desk. Get a candid assessment of feasibility, costs, and regulatory hurdles.
            </p>
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-2 bg-[var(--privet-green)] text-white text-sm font-sans font-medium px-4 py-2 rounded hover:bg-[var(--privet-green)]/90 transition-colors"
            >
              Submit a Gut-Check
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
