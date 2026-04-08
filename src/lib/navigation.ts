export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

export type NavPillar = {
  label: string;
  items: NavItem[];
};

// ─── 4-Pillar Structure ─────────────────────────────────────
export const navPillars: NavPillar[] = [
  {
    label: "Market Pulse",
    items: [
      { label: "Market Dashboard", href: "/market-pulse", description: "Live charts, inventory trends, absorption rates" },
      { label: "Whale Watch", href: "/market-pulse/whale-watch", description: "Top luxury sales YTD + Stephen's Take" },
      { label: "Price Trends", href: "/market-pulse/price-trends", description: "Interactive charts and analysis" },
      { label: "Inventory Tracker", href: "/market-pulse/inventory", description: "Historical inventory views" },
      { label: "Market Reports", href: "/market-pulse/reports", description: "Downloadable monthly/quarterly PDFs" },
    ],
  },
  {
    label: "Regulatory Hub",
    items: [
      { label: "Overview", href: "/regulatory", description: "Meeting calendars and quick links" },
      { label: "HDC Morning After", href: "/regulatory/hdc-morning-after", description: "Weekly 2-minute recaps" },
      { label: "Planning Board", href: "/regulatory/planning-board", description: "Summaries and highlights" },
      { label: "Zoning Board", href: "/regulatory/zoning-board", description: "Appeals and decisions" },
      { label: "Interactive Zoning Map", href: "/regulatory/zoning-map", description: "Clickable district overlay" },
      { label: "Zoning Lookup", href: "/regulatory/zoning-lookup", description: "Zoning by address tool" },
      { label: "Cheat Sheets", href: "/regulatory/cheat-sheets", description: "Downloadable HDC & zoning guides" },
    ],
  },
  {
    label: "Build & Renovate",
    items: [
      { label: "Cost Calculator", href: "/build-renovate/cost-calculator", description: "Instant Nantucket-specific estimate" },
      { label: "Building Costs", href: "/build-renovate/building-costs", description: "2026 cost guides and analysis" },
      { label: "Case Studies", href: "/build-renovate/case-studies", description: "Before/after project examples" },
      { label: "Vendor Rate Sheet", href: "/build-renovate/vendor-rate-sheet", description: "Premium contractor rates (gated)" },
    ],
  },
  {
    label: "Neighborhoods",
    items: [
      { label: "Overview", href: "/neighborhoods", description: "Interactive map of all areas" },
      { label: "'Sconset", href: "/neighborhoods/sconset" },
      { label: "Cliff", href: "/neighborhoods/cliff" },
      { label: "Town", href: "/neighborhoods/town" },
      { label: "Surfside", href: "/neighborhoods/surfside" },
      { label: "Madaket", href: "/neighborhoods/madaket" },
      { label: "Dionis", href: "/neighborhoods/dionis" },
      { label: "Mid-Island", href: "/neighborhoods/mid-island" },
      { label: "Cisco", href: "/neighborhoods/cisco" },
      { label: "Brant Point", href: "/neighborhoods/brant-point" },
      { label: "Monomoy", href: "/neighborhoods/monomoy" },
      { label: "Polpis", href: "/neighborhoods/polpis" },
      { label: "Tom Nevers", href: "/neighborhoods/tom-nevers" },
    ],
  },
];

// Standalone links (not in pillars)
export const standaloneNavItems: NavItem[] = [
  { label: "Articles", href: "/articles" },
  { label: "About", href: "/about" },
];

// Flat list of all nav items (for footer, sitemap, etc.)
export const allNavItems: NavItem[] = [
  { label: "Home", href: "/" },
  ...navPillars.flatMap((p) => p.items),
  ...standaloneNavItems,
];
