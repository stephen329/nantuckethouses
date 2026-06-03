import { NextResponse } from "next/server";
import { renderMarkdown } from "@/lib/content";

/** POST /api/admin/articles/preview — render markdown to HTML for live preview */
export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    const html = await renderMarkdown(content || "");
    return NextResponse.json({ html });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
