import Link from "next/link";
import type { ArticleMeta } from "@/lib/content";
import { CategoryBadge } from "./CategoryBadge";
import { ReadingTime } from "./ReadingTime";

type Props = {
  articles: ArticleMeta[];
};

export function TopReadsSidebar({ articles }: Props) {
  if (articles.length === 0) return null;

  return (
    <aside>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cedar-shingle)] mb-4 font-sans">
        Stephen&apos;s Top Reads
      </p>
      <div className="space-y-0 divide-y divide-[var(--cedar-shingle)]/10">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/articles/${article.slug}`}
            className="block py-4 first:pt-0 hover:bg-[var(--sandstone)]/50 transition-colors -mx-2 px-2 rounded"
          >
            <CategoryBadge category={article.category} />
            <h4 className="text-sm leading-snug text-[var(--atlantic-navy)] mt-2 hover:text-[var(--privet-green)] transition-colors font-semibold">
              {article.title}
            </h4>
            <ReadingTime minutes={article.readingTime} className="mt-1" />
          </Link>
        ))}
      </div>
    </aside>
  );
}
