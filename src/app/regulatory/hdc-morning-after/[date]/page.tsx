import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";
import { ImpactBadge } from "@/components/regulatory/ImpactBadge";
import { getPost, listPosts, renderMarkdown } from "@/lib/content";
import { CheckCircle, XCircle } from "lucide-react";

type Props = {
  params: Promise<{ date: string }>;
};

export async function generateStaticParams() {
  const posts = listPosts("hdc-morning-after");
  return posts.map((p) => ({ date: p.slug }));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function HdcRecapPage({ params }: Props) {
  const { date } = await params;
  const post = getPost("hdc-morning-after", date);
  if (!post) return notFound();

  const { meta, source } = post;
  const contentHtml = await renderMarkdown(source);

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      {/* Header */}
      <section className="bg-[var(--atlantic-navy)] py-10 sm:py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Regulatory Hub", href: "/regulatory" },
              { label: "HDC Morning After", href: "/regulatory/hdc-morning-after" },
              { label: formatDate(meta.date) },
            ]}
          />
          <p className="text-white/50 text-sm font-sans mb-2">
            {formatDate(meta.date)}
          </p>
          <h1 className="text-white text-2xl sm:text-3xl mb-3">
            HDC Morning After
          </h1>
          {meta.impactLevel && <ImpactBadge level={meta.impactLevel} />}
        </div>
      </section>

      {/* Content */}
      <article className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Summary */}
          <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-6 mb-8">
            <p className="text-sm text-[var(--atlantic-navy)] leading-relaxed">
              {meta.summary}
            </p>
          </div>

          {/* Approvals & Denials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {meta.keyApprovals && meta.keyApprovals.length > 0 && (
              <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-[var(--privet-green)]" />
                  <h3 className="text-sm font-semibold text-[var(--atlantic-navy)] font-sans">
                    Approved
                  </h3>
                </div>
                <ul className="space-y-2">
                  {meta.keyApprovals.map((item, i) => (
                    <li key={i} className="text-xs text-[var(--atlantic-navy)]/80 leading-relaxed pl-3 border-l-2 border-[var(--privet-green)]/30">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {meta.keyDenials && meta.keyDenials.length > 0 && (
              <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-semibold text-[var(--atlantic-navy)] font-sans">
                    Denied
                  </h3>
                </div>
                <ul className="space-y-2">
                  {meta.keyDenials.map((item, i) => (
                    <li key={i} className="text-xs text-[var(--atlantic-navy)]/80 leading-relaxed pl-3 border-l-2 border-red-300">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Topics */}
          {meta.topics && meta.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {meta.topics.map((topic) => (
                <span
                  key={topic}
                  className="text-xs bg-white text-[var(--cedar-shingle)] px-3 py-1 rounded-full border border-[var(--cedar-shingle)]/15 font-sans"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* Stephen's Insider Note */}
          {meta.insiderNote && (
            <div className="bg-[var(--sandstone)] rounded-lg border-l-4 border-[var(--cedar-shingle)] p-6 mb-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cedar-shingle)] mb-2 font-sans">
                Stephen&apos;s Insider Note
              </p>
              <p className="text-sm text-[var(--atlantic-navy)]/80 leading-relaxed">
                {meta.insiderNote}
              </p>
            </div>
          )}

          {/* Rendered Markdown Body */}
          <div
            className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-[var(--atlantic-navy)] prose-p:text-[var(--atlantic-navy)]/80 prose-li:text-[var(--atlantic-navy)]/80 prose-strong:text-[var(--atlantic-navy)]"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </article>
    </div>
  );
}
