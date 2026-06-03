import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ARTICLES_DIR = path.join(process.cwd(), "src/content/articles");

function ensureDir() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  }
}

/** GET /api/admin/articles — list all articles (including drafts) with raw content */
export async function GET() {
  ensureDir();

  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".mdx"));

  type ArticleEntry = Record<string, unknown> & {
    slug: string;
    date?: string;
    content: string;
  };

  const articles: ArticleEntry[] = files.map((filename) => {
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, filename), "utf-8");
    const { data, content } = matter(raw);
    return {
      ...(data as Record<string, unknown>),
      slug: filename.replace(/\.mdx$/, ""),
      content: content.trim(),
    };
  });

  // Sort newest first
  articles.sort(
    (a, b) =>
      new Date(b.date ?? "").getTime() - new Date(a.date ?? "").getTime()
  );

  return NextResponse.json(articles);
}

/** POST /api/admin/articles — create a new article */
export async function POST(req: Request) {
  try {
    const { slug, frontmatter, content } = await req.json();

    if (!slug || !frontmatter?.title || !frontmatter?.date) {
      return NextResponse.json(
        { error: "Missing required fields: slug, title, date" },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug must be lowercase alphanumeric with hyphens only" },
        { status: 400 }
      );
    }

    ensureDir();
    const filePath = path.join(ARTICLES_DIR, `${slug}.mdx`);

    if (fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `Article "${slug}" already exists. Use PUT to update.` },
        { status: 409 }
      );
    }

    const mdx = matter.stringify(`\n${content || ""}\n`, frontmatter);
    fs.writeFileSync(filePath, mdx, "utf-8");

    return NextResponse.json({
      success: true,
      slug,
      action: "created",
      message: process.env.VERCEL
        ? "Article created. Note: On Vercel, this write is ephemeral — commit via GitHub for persistence."
        : "Article saved to local filesystem.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PUT /api/admin/articles — update an existing article */
export async function PUT(req: Request) {
  try {
    const { slug, frontmatter, content } = await req.json();

    if (!slug) {
      return NextResponse.json(
        { error: "Missing required field: slug" },
        { status: 400 }
      );
    }

    const filePath = path.join(ARTICLES_DIR, `${slug}.mdx`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `Article "${slug}" not found.` },
        { status: 404 }
      );
    }

    const mdx = matter.stringify(`\n${content || ""}\n`, frontmatter);
    fs.writeFileSync(filePath, mdx, "utf-8");

    return NextResponse.json({
      success: true,
      slug,
      action: "updated",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/admin/articles — remove an article */
export async function DELETE(req: Request) {
  try {
    const { slug } = await req.json();

    if (!slug) {
      return NextResponse.json(
        { error: "Missing required field: slug" },
        { status: 400 }
      );
    }

    const filePath = path.join(ARTICLES_DIR, `${slug}.mdx`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `Article "${slug}" not found.` },
        { status: 404 }
      );
    }

    fs.unlinkSync(filePath);

    return NextResponse.json({
      success: true,
      slug,
      action: "deleted",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
