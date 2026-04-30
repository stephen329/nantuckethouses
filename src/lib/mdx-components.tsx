import type { MDXComponents } from "mdx/types";
import { PullQuote } from "@/components/articles/PullQuote";
import { ArticleHeading } from "@/components/articles/ArticleHeading";
import { ArticleImage } from "@/components/articles/ArticleImage";

/**
 * Custom MDX component map for articles.
 *
 * Usage in MDX files:
 *   ## Heading        → ArticleHeading with auto-generated ID
 *   > blockquote      → PullQuote with italic styling
 *   <Take>...</Take>  → hidden (legacy content)
 *   <ArticleImage />  → Optimized next/image wrapper
 */
export const articleMDXComponents: MDXComponents = {
  h2: (props) => ArticleHeading({ level: 2, ...props }),
  h3: (props) => ArticleHeading({ level: 3, ...props }),
  blockquote: (props) => PullQuote(props),
  Take: () => null,
  ArticleImage: ArticleImage,
  // Standard elements with article-appropriate styling
  p: (props) => {
    const { children, ...rest } = props;
    return (
      <p className="text-base text-[var(--atlantic-navy)]/80 leading-relaxed mb-4 font-sans" {...rest}>
        {children}
      </p>
    );
  },
  ul: (props) => {
    const { children, ...rest } = props;
    return (
      <ul className="list-disc pl-6 mb-4 space-y-2 text-base text-[var(--atlantic-navy)]/80 font-sans" {...rest}>
        {children}
      </ul>
    );
  },
  ol: (props) => {
    const { children, ...rest } = props;
    return (
      <ol className="list-decimal pl-6 mb-4 space-y-2 text-base text-[var(--atlantic-navy)]/80 font-sans" {...rest}>
        {children}
      </ol>
    );
  },
  strong: (props) => {
    const { children, ...rest } = props;
    return (
      <strong className="font-semibold text-[var(--atlantic-navy)]" {...rest}>
        {children}
      </strong>
    );
  },
};
