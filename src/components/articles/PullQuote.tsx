import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function PullQuote({ children }: Props) {
  return (
    <blockquote className="border-l-4 border-[var(--privet-green)] pl-6 my-8">
      <div className="text-lg leading-relaxed text-[var(--atlantic-navy)]/80 italic" style={{ fontFamily: "'Playfair Display', serif" }}>
        {children}
      </div>
    </blockquote>
  );
}
