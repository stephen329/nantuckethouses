import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const CONTENT_DIR = path.join(process.cwd(), "src/content");

// ─── Article Types ──────────────────────────────────────────

export type ArticleFrontmatter = {
  title: string;
  date: string;
  summary: string;
  category: string;
  tags?: string[];
  featured?: boolean;
  published?: boolean; // default true — set false for drafts
  author?: string;
  heroImage?: string;
  readingTime?: number;
};

export type ArticleMeta = ArticleFrontmatter & {
  slug: string;
  readingTime: number; // always present after processing
};

// ─── Regulatory Recap Types ────────────────────────────────

export type PostFrontmatter = {
  date: string;
  summary: string;
  keyApprovals?: string[];
  keyDenials?: string[];
  topics?: string[];
  insiderNote?: string;
  impactLevel?: "low" | "medium" | "high";
};

export type PostMeta = PostFrontmatter & {
  slug: string;
};

/**
 * List all posts in a content subdirectory, sorted by date (newest first).
 */
export function listPosts(subdir: string): PostMeta[] {
  const dir = path.join(CONTENT_DIR, subdir);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  const posts = files.map((filename) => {
    const filePath = path.join(dir, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);
    const slug = filename.replace(/\.mdx$/, "");

    return {
      slug,
      ...(data as PostFrontmatter),
    };
  });

  // Sort newest first
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Get a single post by slug from a content subdirectory.
 * Returns frontmatter + raw MDX source string.
 */
export function getPost(
  subdir: string,
  slug: string
): { meta: PostMeta; source: string } | null {
  const filePath = path.join(CONTENT_DIR, subdir, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    meta: { slug, ...(data as PostFrontmatter) },
    source: content,
  };
}

/**
 * Get the most recent post from a content subdirectory.
 */
export function getLatestPost(subdir: string): PostMeta | null {
  const posts = listPosts(subdir);
  return posts.length > 0 ? posts[0] : null;
}

/**
 * Render markdown/MDX source to HTML string.
 */
export async function renderMarkdown(source: string): Promise<string> {
  const result = await remark().use(html).process(source);
  return result.toString();
}

// ─── Article Functions ──────────────────────────────────────

/**
 * Calculate reading time in minutes.
 * Strips code blocks and image tags before counting words.
 */
export function calculateReadingTime(text: string): number {
  const stripped = text
    .replace(/```[\s\S]*?```/g, "") // remove code blocks
    .replace(/`[^`]*`/g, "") // remove inline code
    .replace(/<ArticleImage[^>]*\/>/g, "") // remove image components
    .replace(/!\[.*?\]\(.*?\)/g, ""); // remove markdown images
  const words = stripped.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 238));
}

/**
 * List all published articles, sorted by date (newest first).
 */
export function listArticles(): ArticleMeta[] {
  const dir = path.join(CONTENT_DIR, "articles");
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  const articles = files.map((filename) => {
    const filePath = path.join(dir, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    const slug = filename.replace(/\.mdx$/, "");
    const fm = data as ArticleFrontmatter;

    return {
      slug,
      ...fm,
      author: fm.author ?? "Stephen Maury",
      readingTime: fm.readingTime ?? calculateReadingTime(content),
    };
  });

  return articles
    .filter((a) => a.published !== false)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get a single article by slug.
 * Returns frontmatter + raw MDX source string.
 */
export function getArticle(
  slug: string
): { meta: ArticleMeta; source: string } | null {
  const filePath = path.join(CONTENT_DIR, "articles", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const fm = data as ArticleFrontmatter;

  return {
    meta: {
      slug,
      ...fm,
      author: fm.author ?? "Stephen Maury",
      readingTime: fm.readingTime ?? calculateReadingTime(content),
    },
    source: content,
  };
}
