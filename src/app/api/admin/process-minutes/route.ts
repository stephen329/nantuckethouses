import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an expert real estate analyst writing for nantuckethouses.com — a Nantucket real estate intelligence hub run by Stephen Maury, a licensed broker and developer.

Your task: Turn HDC (Historic District Commission) meeting minutes into a concise "HDC Morning After" recap.

Output ONLY a complete MDX file with this exact frontmatter structure followed by markdown body content:

---
date: "YYYY-MM-DD"
summary: "2-3 sentence overview of the most significant decisions"
keyApprovals:
  - "Address - Brief description of what was approved"
keyDenials:
  - "Address - Brief description of what was denied or held for revisions"
topics:
  - "topic tag 1"
  - "topic tag 2"
insiderNote: "2-4 sentences of practical, opinionated insight — what this means for property owners, buyers, and builders. Direct and slightly edgy, like a local broker giving straight talk to a client over coffee."
impactLevel: "low|medium|high"
---

## Section Heading

Body content here...

Rules:
- "Held for revisions" counts as a denial/hold in keyDenials
- impactLevel: "high" if fee changes, policy shifts, or major denials. "medium" for typical mixed results. "low" for routine approvals only.
- The insiderNote should sound like Stephen Maury — direct, practical, occasionally blunt. Focus on what matters for someone planning a project.
- Include ## section headings to break up the recap
- Mention specific addresses, vote counts, and commissioner names when relevant
- Keep the body to 400-600 words — this is a "2-minute read"
- Topics should be 4-7 short tags
- Date should be the meeting date from the minutes, NOT today's date`;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File;
    const boardType = (formData.get("boardType") as string) || "hdc-morning-after";

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    // Extract text from PDF using pdf-parse
    // Note: importing pdf-parse/lib/pdf-parse.js directly avoids the test file
    // loading bug in pdf-parse@1.1.1 (ENOENT: 05-versions-space.pdf)
    const buffer = Buffer.from(await file.arrayBuffer());
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");
    const pdfData = await pdfParse(buffer);
    const pdfText: string = pdfData.text;

    if (!pdfText || pdfText.trim().length < 100) {
      return NextResponse.json({ error: "Could not extract meaningful text from PDF" }, { status: 400 });
    }

    // Process through OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Here are the HDC meeting minutes to process into an HDC Morning After recap:\n\n${pdfText}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI error:", err);
      return NextResponse.json({ error: "AI processing failed" }, { status: 500 });
    }

    const data = await response.json();
    const mdxContent = data.choices?.[0]?.message?.content ?? "";

    // Extract date from frontmatter for the filename
    const dateMatch = mdxContent.match(/date:\s*"(\d{4}-\d{2}-\d{2})"/);
    const meetingDate = dateMatch?.[1] ?? new Date().toISOString().split("T")[0];

    return NextResponse.json({
      mdxContent,
      meetingDate,
      boardType,
      pdfTextLength: pdfText.length,
      filename: `${meetingDate}.mdx`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Process minutes error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
