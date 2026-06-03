import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = {
  label: string;
  href?: string;
};

type Props = {
  items: Crumb[];
};

export function Breadcrumbs({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-1 text-xs text-[var(--nantucket-gray)] font-sans">
        <li>
          <Link href="/" className="hover:text-[var(--privet-green)] transition-colors">
            Home
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            {item.href ? (
              <Link href={item.href} className="hover:text-[var(--privet-green)] transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-[var(--atlantic-navy)] font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
