import Link from "next/link";
import { FileText, MapPin, Briefcase, Upload, Settings, BarChart3, Users, Scale } from "lucide-react";

const adminTools = [
  {
    title: "Import Board Minutes",
    description: "Upload HDC, Planning Board, or ZBA minutes PDF. AI generates an MDX recap for the Regulatory Hub.",
    href: "/admin/import",
    icon: Upload,
    category: "Content",
  },
  {
    title: "Zoning Districts & Assignments",
    description: "Define zoning district rules and assign one or more districts to each neighborhood.",
    href: "/admin/zoning",
    icon: MapPin,
    category: "Data",
  },
  {
    title: "Opportunity Submissions",
    description: "View and manage all Off-Market & Opportunity Desk submissions (FSBO, FRBO, Buyers, Renters, Services).",
    href: "/admin/opportunities",
    icon: Briefcase,
    category: "Leads",
  },
  {
    title: "Partners & Initiatives",
    description: "Add, edit, or remove featured partners and initiatives displayed across the site.",
    href: "/admin/partners",
    icon: Users,
    category: "Content",
  },
];

const dataFiles = [
  {
    title: "Vibe Meter",
    description: "Weekly neighborhood sentiment data. Edit to update Stephen's expert reads.",
    file: "src/data/vibe-meter.json",
    icon: BarChart3,
  },
  {
    title: "Board Watch",
    description: "Upcoming regulatory board meeting dates and topics.",
    file: "src/data/board-watch.json",
    icon: Scale,
  },
  {
    title: "Whale Watch (Stephen's Take)",
    description: "Editorial commentary for the top YTD luxury sales section.",
    file: "src/data/whale-watch.json",
    icon: FileText,
  },
  {
    title: "Neighborhood Profiles",
    description: "Descriptions, highlights, shoreline status, and what's happening for each neighborhood.",
    file: "src/data/neighborhood-profiles.json",
    icon: Users,
  },
  {
    title: "Zoning Districts",
    description: "All 26 zoning district definitions and neighborhood assignments.",
    file: "src/data/zoning-districts.json",
    icon: MapPin,
  },
  {
    title: "Partners & Initiatives",
    description: "Featured partners and organizations displayed in banners, carousels, and the footer.",
    file: "src/data/partners.json",
    icon: Users,
  },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      {/* Header */}
      <section className="bg-[var(--atlantic-navy)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-1">
            <Settings className="w-5 h-5 text-white/40" />
            <p className="text-white/40 text-xs uppercase tracking-wider font-sans">Admin</p>
          </div>
          <h1 className="text-white text-2xl sm:text-3xl">Site Administration</h1>
          <p className="text-white/50 mt-1 text-sm">
            Manage content, data, leads, and tools for NantucketHouses.com.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Tools */}
        <h2 className="text-lg text-[var(--atlantic-navy)] mb-4">Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {adminTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group bg-white rounded-lg p-5 border border-[var(--cedar-shingle)]/15 hover:border-[var(--privet-green)]/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-md bg-[var(--atlantic-navy)]/5 group-hover:bg-[var(--privet-green)]/10 transition-colors">
                  <tool.icon className="w-5 h-5 text-[var(--atlantic-navy)] group-hover:text-[var(--privet-green)] transition-colors" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--nantucket-gray)] font-sans">
                  {tool.category}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[var(--atlantic-navy)] group-hover:text-[var(--privet-green)] transition-colors font-sans mb-1">
                {tool.title}
              </h3>
              <p className="text-xs text-[var(--nantucket-gray)] leading-relaxed">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Data Files Reference */}
        <h2 className="text-lg text-[var(--atlantic-navy)] mb-4">Data Files</h2>
        <p className="text-xs text-[var(--nantucket-gray)] mb-4">
          These JSON files power the site&apos;s editorial content. Edit via GitHub, Codespaces, or the admin tools above.
        </p>
        <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--sandstone)]">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">File</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">Description</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">Path</th>
              </tr>
            </thead>
            <tbody>
              {dataFiles.map((df) => (
                <tr key={df.file} className="border-t border-[var(--cedar-shingle)]/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <df.icon className="w-4 h-4 text-[var(--nantucket-gray)]" />
                      <span className="font-medium text-[var(--atlantic-navy)]">{df.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--nantucket-gray)] text-xs">
                    {df.description}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-[var(--sandstone)] px-2 py-0.5 rounded text-[var(--cedar-shingle)]">
                      {df.file}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Links */}
        <div className="mt-10 bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-6">
          <h2 className="text-lg text-[var(--atlantic-navy)] mb-3">Quick Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <a href="https://github.com/stephen329/nantuckethouses" target="_blank" rel="noopener noreferrer" className="text-[var(--privet-green)] hover:underline">
              GitHub Repo
            </a>
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[var(--privet-green)] hover:underline">
              Vercel Dashboard
            </a>
            <a href="https://www.klaviyo.com" target="_blank" rel="noopener noreferrer" className="text-[var(--privet-green)] hover:underline">
              Klaviyo
            </a>
            <a href="https://nantucket-ma.civicclerk.com" target="_blank" rel="noopener noreferrer" className="text-[var(--privet-green)] hover:underline">
              CivicClerk (Board Agendas)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
