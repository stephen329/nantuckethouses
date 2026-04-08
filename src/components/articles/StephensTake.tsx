import { MessageCircle } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function StephensTake({ children }: Props) {
  return (
    <aside className="relative bg-[#F9F9F4] border-l-4 border-[var(--cedar-shingle)] rounded-r-lg p-6 my-8">
      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--cedar-shingle)]/10 flex items-center justify-center">
        <MessageCircle className="w-4 h-4 text-[var(--cedar-shingle)]" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cedar-shingle)] mb-3 font-sans">
        Stephen&apos;s Take
      </p>
      <div className="text-sm text-[var(--atlantic-navy)]/80 leading-relaxed font-sans pr-8">
        {children}
      </div>
    </aside>
  );
}
