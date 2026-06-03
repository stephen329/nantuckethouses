type Props = {
  level: "low" | "medium" | "high";
};

const config = {
  low: { label: "Low Impact", bg: "bg-[var(--nantucket-gray)]/15", text: "text-[var(--nantucket-gray)]" },
  medium: { label: "Medium Impact", bg: "bg-amber-100", text: "text-amber-700" },
  high: { label: "High Impact", bg: "bg-red-100", text: "text-red-700" },
};

export function ImpactBadge({ level }: Props) {
  const c = config[level];
  return (
    <span className={`inline-block text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
