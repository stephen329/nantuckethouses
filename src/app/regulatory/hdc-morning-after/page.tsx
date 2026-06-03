import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";
import { RecapCard } from "@/components/regulatory/RecapCard";
import { listPosts } from "@/lib/content";

export default function HdcMorningAfterIndex() {
  const posts = listPosts("hdc-morning-after");

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Regulatory Hub", href: "/regulatory" },
              { label: "HDC Morning After" },
            ]}
          />
          <p className="text-[var(--cedar-shingle)] text-xs uppercase tracking-[0.25em] font-semibold mb-2 font-sans" style={{ color: "#a89080" }}>
            Weekly Recap
          </p>
          <h1 className="text-white text-3xl sm:text-4xl">HDC Morning After</h1>
          <p className="text-white/50 mt-2 text-sm max-w-2xl">
            Every week after the Historic District Commission meets, we publish a
            2-minute recap: what got approved, what got denied, and what it means
            for your project.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <p className="text-center text-[var(--nantucket-gray)] py-12">
              No recaps published yet. Check back after the next HDC meeting.
            </p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <RecapCard
                  key={post.slug}
                  post={post}
                  basePath="/regulatory/hdc-morning-after"
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
