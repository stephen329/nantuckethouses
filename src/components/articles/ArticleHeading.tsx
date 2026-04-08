import type { ReactNode } from "react";
import { slugify } from "@/lib/mdx";

type Props = {
  level: 2 | 3;
  children: ReactNode;
};

export function ArticleHeading({ level, children }: Props) {
  const text = typeof children === "string" ? children : String(children);
  const id = slugify(text);

  const className =
    level === 2
      ? "text-2xl sm:text-3xl mt-12 mb-4 text-[var(--atlantic-navy)]"
      : "text-xl sm:text-2xl mt-8 mb-3 text-[var(--atlantic-navy)]";

  const Tag = `h${level}` as const;

  return (
    <Tag id={id} className={className}>
      {children}
    </Tag>
  );
}
