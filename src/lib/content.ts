import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const CONTENT_DIR = path.join(process.cwd(), "src/content");

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
