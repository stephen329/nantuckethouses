import { getCategoryStyle } from "@/lib/article-constants";

type Props = {
  category: string;
  size?: "sm" | "md";
};

export function CategoryBadge({ category, size = "sm" }: Props) {
  const style = getCategoryStyle(category);

  const sizeClasses =
    size === "sm"
      ? "text-[10px] px-2 py-0.5"
      : "text-xs px-3 py-1";

  return (
    <span
      className={`inline-block font-sans font-semibold uppercase tracking-wider rounded ${sizeClasses} ${style.bg} ${style.text} ${style.border} border`}
    >
      {category}
    </span>
  );
}
