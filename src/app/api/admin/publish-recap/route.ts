import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * POST /api/admin/publish-recap
 *
 * Saves a generated MDX recap to the content directory.
 * In production on Vercel, this would commit via GitHub API instead.
 * For local dev / Codespaces, writes directly to the filesystem.
 */
export async function POST(request: Request) {
  try {
    const { mdxContent, boardType, filename } = await request.json();

    if (!mdxContent || !boardType || !filename) {
      return NextResponse.json(
        { error: "Missing required fields: mdxContent, boardType, filename" },
        { status: 400 }
      );
    }

    // Validate boardType
    const validTypes = ["hdc-morning-after", "planning-board", "zoning-board"];
    if (!validTypes.includes(boardType)) {
      return NextResponse.json(
        { error: `Invalid boardType. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate filename format (YYYY-MM-DD.mdx)
    if (!/^\d{4}-\d{2}-\d{2}\.mdx$/.test(filename)) {
      return NextResponse.json(
        { error: "Filename must be in YYYY-MM-DD.mdx format" },
        { status: 400 }
      );
    }

    const contentDir = path.join(process.cwd(), "src/content", boardType);

    // Ensure directory exists
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    const filePath = path.join(contentDir, filename);

    // Check if file already exists
    const exists = fs.existsSync(filePath);

    // Write the file
    fs.writeFileSync(filePath, mdxContent, "utf-8");

    return NextResponse.json({
      success: true,
      path: `src/content/${boardType}/${filename}`,
      action: exists ? "updated" : "created",
      message: `Recap ${exists ? "updated" : "published"} successfully. ${
        process.env.VERCEL
          ? "Note: On Vercel, this write is ephemeral. Commit via GitHub for persistence."
          : "File saved to local filesystem."
      }`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Publish recap error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
