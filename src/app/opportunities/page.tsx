import Link from "next/link";
import { Home, Key, Search, Building, Wrench, Users } from "lucide-react";
import { Breadcrumbs } from "@/components/regulatory/Breadcrumbs";

const categories = [
  {
    title: "For Sale by Owner",
    description: "List your property privately. Stephen reviews every submission personally.",
    href: "/opportunities/for-sale",
    icon: Home,
  },
  {
    title: "For Rent by Owner",
    description: "Private rental listing. Stephen reviews every submission.",
    href: "/opportunities/for-rent",
    icon: Key,
  },
  {
    title: "I'm Looking to Buy",
    description: "Tell us what you're seeking. Stephen will match you with off-market opportunities.",
    href: "/opportunities/wanted-to-buy",
    icon: Search,
  },
  {
    title: "I'm Looking to Rent",
    description: "Private rental request. Stephen matches you directly.",
    href: "/opportunities/wanted-to-rent",
    icon: Building,
  },
  {
    title: "Workforce Housing Inquiry",
    description: "Covenant Program, Lease to Locals, Friendly 40B, or year-round housing questions.",
    href: "/opportunities/workforce-housing",
    icon: Users,
  },
  {
    title: "Services Offered or Needed",
    description: "Post a service or request one from Stephen's vetted network.",
    href: "/opportunities/services",
    icon: Wrench,
  },
];

export default function OpportunitiesPage() {
  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Off-Market & Opportunity Desk" }]} />
          <h1 className="text-white text-3xl sm:text-4xl">Off-Market &amp; Opportunity Desk</h1>
          <p className="text-white/50 mt-2 text-sm max-w-2xl">
            Don&apos;t see what you&apos;re looking for on the MLS? Submit your requirement
            to our private desk. Stephen reviews every request personally and matches
            you with hidden supply or qualified buyers.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="group flex items-start gap-4 bg-white rounded-lg p-5 border border-[var(--cedar-shingle)]/15 hover:border-[var(--privet-green)]/30 hover:shadow-md transition-all"
              >
                <div className="p-3 rounded-lg bg-[var(--atlantic-navy)]/5 group-hover:bg-[var(--privet-green)]/10 transition-colors shrink-0">
                  <cat.icon className="w-5 h-5 text-[var(--atlantic-navy)] group-hover:text-[var(--privet-green)] transition-colors" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--atlantic-navy)] group-hover:text-[var(--privet-green)] transition-colors font-sans">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-[var(--nantucket-gray)] mt-0.5">
                    {cat.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
