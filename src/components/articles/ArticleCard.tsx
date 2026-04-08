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

export function ArticleCard({ article }: Props) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group block bg-white rounded-lg border border-[var(--cedar-shingle)]/15 overflow-hidden hover:border-[var(--privet-green)]/30 hover:shadow-md transition-all"
    >
      {article.heroImage && (
        <div className="relative w-full aspect-[16/9] bg-[var(--nantucket-gray)]/10">
          <Image
            src={article.heroImage}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <CategoryBadge category={article.category} />
          <ReadingTime minutes={article.readingTime} />
        </div>
        <h3 className="text-lg leading-snug text-[var(--atlantic-navy)] mb-2 group-hover:text-[var(--privet-green)] transition-colors" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
          {article.title}
        </h3>
        <p className="text-sm text-[var(--atlantic-navy)]/60 leading-relaxed font-sans line-clamp-2">
          {article.summary}
        </p>
        <p className="text-xs text-[var(--nantucket-gray)] font-sans mt-3">
          {formatDate(article.date)}
        </p>
      </div>
    </Link>
  );
}
