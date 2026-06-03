import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";
import { RecapCard } from "@/components/regulatory/RecapCard";
import { listPosts } from "@/lib/content";

export default function ZoningBoardPage() {
  const posts = listPosts("zoning-board");

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Regulatory Hub", href: "/regulatory" },
              { label: "Zoning Board of Appeals" },
            ]}
          />
          <h1 className="text-white text-3xl sm:text-4xl">Zoning Board of Appeals</h1>
          <p className="text-white/50 mt-2 text-sm max-w-2xl">
            Variance requests, special permits, and appeals decisions from the
            Nantucket ZBA. Essential reading for anyone working with non-conforming lots.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <p className="text-center text-[var(--nantucket-gray)] py-12">
              No summaries published yet. Check back after the next ZBA meeting.
            </p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <RecapCard key={post.slug} post={post} basePath="/regulatory/zoning-board" />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
