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
};

// ─── Opportunities / Off-Market Desk ─────────────────────
export type OpportunityCategory =
  | "for-sale-by-owner"
  | "for-rent-by-owner"
  | "wanted-to-buy"
  | "wanted-to-rent"
  | "services";

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
