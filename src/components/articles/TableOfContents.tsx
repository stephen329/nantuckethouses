"use client";

import { useEffect, useState } from "react";
import type { HeadingItem } from "@/lib/mdx";

type Props = {
  headings: HeadingItem[];
};

export function TableOfContents({ headings }: Props) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cedar-shingle)] mb-4 font-sans">
        In This Article
      </p>
      <ul className="space-y-2">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={`block text-sm font-sans leading-snug transition-colors ${
                heading.level === 3 ? "pl-4" : ""
              } ${
                activeId === heading.id
                  ? "text-[var(--privet-green)] font-medium"
                  : "text-[var(--nantucket-gray)] hover:text-[var(--atlantic-navy)]"
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Mobile-friendly accordion version of the Table of Contents.
 */
export function TableOfContentsMobile({ headings }: Props) {
  const [open, setOpen] = useState(false);

  if (headings.length === 0) return null;

  return (
    <div className="lg:hidden bg-white rounded-lg border border-[var(--cedar-shingle)]/15 mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-sm font-semibold text-[var(--atlantic-navy)] font-sans"
      >
        Jump to Section
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul className="px-4 pb-4 space-y-2 border-t border-[var(--cedar-shingle)]/10 pt-3">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                onClick={() => setOpen(false)}
                className={`block text-sm font-sans text-[var(--nantucket-gray)] hover:text-[var(--atlantic-navy)] ${
                  heading.level === 3 ? "pl-4" : ""
                }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
