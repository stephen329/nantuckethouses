export type NavItem = {
  label: string;
  path?: string;
  description?: string;
  isFeatured?: boolean;
  badge?: "Popular" | "New";
};

export type NavColumn = {
  label: string;
  items: NavItem[];
};

export type NavEntry = {
  key: string;
  label: string;
  path: string;
  description?: string;
  children?: NavItem[];
  megaMenuColumns?: NavColumn[];
};

type NavLink = {
  label: string;
  href: string;
  description?: string;
};

export const NAV_STRUCTURE: Record<string, NavEntry> = {
  marketPulse: {
    key: "marketPulse",
    label: "Market Pulse",
    path: "/market-pulse",
    children: [
      { label: "Market Dashboard", path: "/market-pulse", description: "Live charts, inventory trends, absorption rates" },
      { label: "Whale Watch", path: "/market-pulse/whale-watch", description: "Top luxury sales YTD" },
      { label: "Price Trends", path: "/market-pulse/price-trends", description: "Interactive charts and analysis" },
      { label: "Inventory Tracker", path: "/market-pulse/inventory", description: "Historical inventory views" },
      { label: "Market Reports", path: "/market-pulse/reports", description: "Downloadable monthly/quarterly PDFs" },
    ],
  },
  neighborhoods: {
    key: "neighborhoods",
    label: "Neighborhoods",
    path: "/neighborhoods",
    description: "Dreaming and discovery",
  },
  resources: {
    key: "resources",
    label: "Resources",
    path: "/resources",
    description: "Regulatory and construction command center",
    children: [
      { label: "Regulatory Updates", path: "/regulatory" },
      { label: "Zoning & Planning Tools", path: "/map" },
      { label: "Affordable & Workforce Housing", path: "/affordable-housing" },
      { label: "Build & Renovate", path: "/build-renovate" },
    ],
    megaMenuColumns: [
      {
        label: "Regulatory Updates",
        items: [
          { label: "Latest HDC Morning After", path: "/regulatory/hdc-morning-after", badge: "New" },
          { label: "Planning Board Updates", path: "/regulatory/planning-board" },
          { label: "Zoning Board Updates", path: "/regulatory/zoning-board" },
        ],
      },
      {
        label: "Zoning & Planning Tools",
        items: [
          { label: "Property Map", path: "/map", description: "Rentals, parcels, and zoning — live map", isFeatured: true },
          { label: "Regulatory Cheat Sheets", path: "/regulatory/cheat-sheets", badge: "Popular" },
          { label: "Local Case Studies", path: "/build-renovate", description: "Build and planning examples" },
        ],
      },
      {
        label: "Affordable & Workforce Housing",
        items: [
          { label: "Affordable & Workforce Home Ownership", path: "/affordable-housing/home-ownership" },
          { label: "Year-Round Rentals", path: "/affordable-housing/year-round-rentals" },
          { label: "Accessory Dwelling Units (ADUs)", path: "/affordable-housing/adus" },
        ],
      },
      {
        label: "Build & Renovate",
        items: [
          { label: "Cost Calculator (Coming Soon)", description: "Coming soon", badge: "Popular" },
          { label: "Building Costs & Guides", path: "/build-renovate" },
        ],
      },
    ],
  },
  about: {
    key: "about",
    label: "About",
    path: "/about",
    description: "Trust and authority",
  },
};

export const primaryNavItems: NavEntry[] = [
  NAV_STRUCTURE.marketPulse,
  NAV_STRUCTURE.neighborhoods,
  NAV_STRUCTURE.resources,
  NAV_STRUCTURE.about,
];

export const navCta = {
  label: "Post an Opportunity",
  path: "/opportunities",
};

// Compatibility exports for existing footer/sitemap consumers.
export const navPillars: { label: string; items: NavLink[] }[] = [
  {
    label: NAV_STRUCTURE.marketPulse.label,
    items:
      NAV_STRUCTURE.marketPulse.children
        ?.filter((item): item is NavItem & { path: string } => Boolean(item.path))
        .map((item) => ({
          label: item.label,
          href: item.path,
          description: item.description,
        })) ?? [],
  },
  {
    label: NAV_STRUCTURE.neighborhoods.label,
    items: [{ label: NAV_STRUCTURE.neighborhoods.label, href: NAV_STRUCTURE.neighborhoods.path }],
  },
  {
    label: NAV_STRUCTURE.resources.label,
    items: [{ label: NAV_STRUCTURE.resources.label, href: NAV_STRUCTURE.resources.path }],
  },
];

export const standaloneNavItems: NavLink[] = [
  { label: NAV_STRUCTURE.about.label, href: NAV_STRUCTURE.about.path },
];

export const allNavItems: NavLink[] = [
  { label: "Home", href: "/" },
  ...navPillars.flatMap((p) => p.items),
  ...standaloneNavItems,
  { label: navCta.label, href: navCta.path },
];
