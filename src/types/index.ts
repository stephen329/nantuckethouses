// ─── Vibe Meter (Expert Sentiment) ────────────────────────
export type VibeTrend = "up" | "down" | "flat";

export type NeighborhoodVibe = {
  neighborhood: string;
  trend: VibeTrend;
  note: string; // Stephen's expert take (required)
};

export type VibeMeterData = {
  weekOf: string;
  neighborhoods: NeighborhoodVibe[];
  stephenNote?: string;
};

// ─── Market Highlights (replaces Vibe Check on homepage) ─
export type MarketHighlightCard = {
  label: string;
  headline: string;
  body: string;
  footnote: string;
};

export type MarketHighlightsData = {
  cards: MarketHighlightCard[];
  stephenNote?: string;
};

// ─── Stephen's Take ──────────────────────────────────────
export type StephensTake = {
  id: string;
  title: string;
  body: string;
  relatedProperty?: string; // MLS number
  date: string;
};

// ─── HDC Recap ───────────────────────────────────────────
export type HdcRecap = {
  date: string;
  summary: string;
  keyApprovals: string[];
  keyDenials: string[];
  topics: string[];
  insiderNote: string;
  impactLevel: "low" | "medium" | "high";
};

// ─── Whale Watch ─────────────────────────────────────────
export type WhaleWatchSale = {
  address: string;
  closePrice: number;
  closeDate: string;
  neighborhood: string;
  listPrice?: number;
};

export type WhaleWatchData = {
  sales: WhaleWatchSale[];
  stephensTake: StephensTake;
};

// ─── Pulse Dashboard (Big Four) ──────────────────────────
export type PulseStats = {
  activeInventory: number;
  medianSalePrice6mo: number | null;
  costPerSqFtRange: string; // e.g., "$450–$800+"
  absorptionRate: number | null; // months of supply
};

// ─── Board Watch ─────────────────────────────────────────
export type BoardMeeting = {
  board: string;
  nextMeeting: string; // e.g., "Tuesday, April 14 @ 4:00 PM"
  topic: string;
  link?: string;
  agendaLink?: string;
};

// ─── Opportunities / Off-Market Desk ─────────────────────
export type OpportunityCategory =
  | "for-sale-by-owner"
  | "for-rent-by-owner"
  | "wanted-to-buy"
  | "wanted-to-rent"
  | "services"
  | "workforce-housing";

export type OpportunitySubmission = {
  id: string;
  category: OpportunityCategory;
  data: Record<string, unknown>;
  email: string;
  name: string;
  phone?: string;
  submittedAt: string;
  status: "new" | "reviewed" | "matched" | "closed";
};

export type BoardWatchData = {
  updatedAt: string;
  meetings: BoardMeeting[];
};

// ─── Inventory Tracker ────────────────────────────────────
export type InventorySegmentSnapshot = {
  absorptionMonths: number | null;
  inventoryCount: number;
};

export type InventoryActivitySnapshot = {
  startingInventory: number;
  endingInventory: number;
  newListings: number;
  returnToMarket: number;
  priceChanges: number;
  offMarket: number;
  offerToPurchase: number;
  pAndS: number;
  sold: number;
  foreclosures: number;
};

export type MonthlyInventorySnapshot = {
  monthKey: string; // YYYY-MM
  label: string; // e.g. "March 2026"
  source: "chart-backfill" | "pdf-seed" | "auto-monthly";
  activity: InventoryActivitySnapshot;
  segments: {
    residential: InventorySegmentSnapshot;
    land: InventorySegmentSnapshot;
    commercial: InventorySegmentSnapshot;
  };
};

export type InventoryHistoryData = {
  updatedAt: string;
  snapshots: MonthlyInventorySnapshot[];
};

// ─── Partners & Initiatives ─────────────────────────────
export type Partner = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  externalUrl?: string;
  image?: string;
  featured: boolean;
  category: "housing" | "real-estate" | "development";
  stephenNote?: string;
};
