import Link from "next/link";
import Image from "next/image";
import type { ArticleMeta } from "@/lib/content";
import { CategoryBadge } from "./CategoryBadge";
import { ReadingTime } from "./ReadingTime";

type Props = {
  article: ArticleMeta;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function FeaturedArticleCard({ article }: Props) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group block bg-white rounded-lg border border-[var(--cedar-shingle)]/15 overflow-hidden hover:border-[var(--privet-green)]/30 hover:shadow-lg transition-all"
    >
      {article.heroImage && (
        <div className="relative w-full aspect-[16/9] bg-[var(--nantucket-gray)]/10">
          <Image
            src={article.heroImage}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 66vw"
          />
          <div className="absolute top-4 left-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-[var(--privet-green)] text-white px-3 py-1 rounded font-sans">
              Featured
            </span>
          </div>
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <CategoryBadge category={article.category} size="md" />
          <ReadingTime minutes={article.readingTime} />
          <span className="text-xs text-[var(--nantucket-gray)] font-sans">
            {formatDate(article.date)}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl leading-tight text-[var(--atlantic-navy)] mb-3 group-hover:text-[var(--privet-green)] transition-colors" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          {article.title}
        </h2>
        <p className="text-sm text-[var(--atlantic-navy)]/60 leading-relaxed font-sans">
          {article.summary}
        </p>
      </div>
    </Link>
  );
}
