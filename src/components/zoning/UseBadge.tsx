"use client";

type UseBadgeProps = {
  value: string;
  allowed: boolean;
  title?: string;
};

export function UseBadge({ value, allowed, title }: UseBadgeProps) {
  if (value === "N") {
    return (
      <span className="inline-flex rounded bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700" title={title}>
        N
      </span>
    );
  }

  if (value.includes("SP")) {
    return (
      <span className="inline-flex rounded bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800" title={title}>
        {value}
      </span>
    );
  }

  if (value === "A") {
    return (
      <span className="inline-flex rounded bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700" title={title}>
        A
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-[11px] font-medium ${
        allowed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
      }`}
      title={title}
    >
      {value}
    </span>
  );
}
