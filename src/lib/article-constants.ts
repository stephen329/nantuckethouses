export type CategoryStyle = {
  bg: string;
  text: string;
  border: string;
};

export const CATEGORY_COLORS: Record<string, CategoryStyle> = {
  "Market Analysis": {
    bg: "bg-[var(--atlantic-navy)]/10",
    text: "text-[var(--atlantic-navy)]",
    border: "border-[var(--atlantic-navy)]/20",
  },
  "Regulatory Guide": {
    bg: "bg-[var(--privet-green)]/10",
    text: "text-[var(--privet-green)]",
    border: "border-[var(--privet-green)]/20",
  },
  Building: {
    bg: "bg-[var(--cedar-shingle)]/10",
    text: "text-[var(--cedar-shingle)]",
    border: "border-[var(--cedar-shingle)]/20",
  },
  Neighborhoods: {
    bg: "bg-[var(--nantucket-gray)]/10",
    text: "text-[var(--atlantic-navy)]",
    border: "border-[var(--nantucket-gray)]/20",
  },
  "Affordable Housing": {
    bg: "bg-[var(--privet-green)]/10",
    text: "text-[var(--privet-green)]",
    border: "border-[var(--privet-green)]/20",
  },
};

export const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  bg: "bg-[var(--nantucket-gray)]/10",
  text: "text-[var(--atlantic-navy)]",
  border: "border-[var(--nantucket-gray)]/20",
};

export function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_COLORS[category] ?? DEFAULT_CATEGORY_STYLE;
}
