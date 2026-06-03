import Link from "next/link";
import { ImpactBadge } from "./ImpactBadge";
import { CheckCircle, XCircle } from "lucide-react";
import type { PostMeta } from "@/lib/content";

type Props = {
  post: PostMeta;
  basePath: string; // e.g., "/regulatory/hdc-morning-after"
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function RecapCard({ post, basePath }: Props) {
  const approvalCount = post.keyApprovals?.length ?? 0;
  const denialCount = post.keyDenials?.length ?? 0;

  return (
    <Link
      href={`${basePath}/${post.slug}`}
      className="block bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-5 hover:border-[var(--privet-green)]/30 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs text-[var(--nantucket-gray)] font-sans mb-1">
            {formatDate(post.date)}
          </p>
          {post.impactLevel && <ImpactBadge level={post.impactLevel} />}
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--nantucket-gray)] font-sans shrink-0">
          {approvalCount > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-[var(--privet-green)]" />
              {approvalCount}
            </span>
          )}
          {denialCount > 0 && (
            <span className="flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              {denialCount}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-[var(--atlantic-navy)] leading-relaxed mb-3">
        {post.summary}
      </p>

      {post.topics && post.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.topics.slice(0, 4).map((topic) => (
            <span
              key={topic}
              className="text-xs bg-[var(--sandstone)] text-[var(--cedar-shingle)] px-2 py-0.5 rounded font-sans"
            >
              {topic}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
