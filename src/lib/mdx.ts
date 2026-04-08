import { Fragment } from "react";
import * as runtime from "react/jsx-runtime";
import { compile, run } from "@mdx-js/mdx";
import { articleMDXComponents } from "./mdx-components";

/**
 * Slugify a heading string for use as an HTML ID.
 * Shared between heading extraction and ArticleHeading component.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export type HeadingItem = {
  id: string;
  text: string;
  level: number;
};

/**
 * Extract h2 and h3 headings from raw MDX source for the Table of Contents.
 * Parses markdown heading syntax before MDX compilation.
 */
export function extractHeadings(source: string): HeadingItem[] {
  const headings: HeadingItem[] = [];
  const lines = source.split("\n");

  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      headings.push({ id: slugify(text), text, level });
    }
  }

  return headings;
}

/**
 * Compile MDX source to a React element using custom article components.
 * Uses @mdx-js/mdx directly with the project's own React runtime to avoid
 * version conflicts with next-mdx-remote.
 */
export async function renderArticleMDX(source: string) {
  const code = String(
    await compile(source, { outputFormat: "function-body" })
  );

  const { default: MDXContent } = await run(code, {
    ...(runtime as Record<string, unknown>),
    Fragment,
    baseUrl: import.meta.url,
  });

  return MDXContent({ components: articleMDXComponents });
}
