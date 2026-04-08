import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { OpportunitySubmission, OpportunityCategory } from "@/types";

const DATA_FILE = path.join(process.cwd(), "src/data/opportunities.json");

function readSubmissions(): OpportunitySubmission[] {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw) as OpportunitySubmission[];
}

function writeSubmissions(submissions: OpportunitySubmission[]) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2), "utf-8");
}

const VALID_CATEGORIES: OpportunityCategory[] = [
  "for-sale-by-owner",
  "for-rent-by-owner",
  "wanted-to-buy",
  "wanted-to-rent",
  "services",
  "workforce-housing",
];

/**
 * POST /api/opportunities — Submit a new opportunity
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, data, email, name, phone } = body;

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (!email || !name) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const submission: OpportunitySubmission = {
      id: `opp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category,
      data: data ?? {},
      email,
      name,
      phone: phone ?? undefined,
      submittedAt: new Date().toISOString(),
      status: "new",
    };

    // Save to file
    const all = readSubmissions();
    all.unshift(submission);
    writeSubmissions(all);

    // Send notification email via Resend (if configured)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "NantucketHouses.com <notifications@nantuckethouses.com>",
            to: "stephen@nantuckethouses.com",
            subject: `New Opportunity: ${categoryLabel(category)} from ${name}`,
            html: `
              <h2>New ${categoryLabel(category)} Submission</h2>
              <p><strong>From:</strong> ${name} (${email}${phone ? `, ${phone}` : ""})</p>
              <p><strong>Category:</strong> ${categoryLabel(category)}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
              <hr/>
              <pre>${JSON.stringify(data, null, 2)}</pre>
              <hr/>
              <p><a href="https://nantuckethouses.com/admin/opportunities">View in Dashboard</a></p>
            `,
          }),
        });
      } catch (e) {
        console.error("Failed to send notification:", e);
      }
    }

    return NextResponse.json({
      success: true,
      id: submission.id,
      message: "Submission received. Stephen will review within 24 hours.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Opportunity submission error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/opportunities — List all submissions (admin)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");

  let submissions = readSubmissions();

  if (category) {
    submissions = submissions.filter((s) => s.category === category);
  }
  if (status) {
    submissions = submissions.filter((s) => s.status === status);
  }

  return NextResponse.json({
    data: submissions,
    total: submissions.length,
  });
}

function categoryLabel(cat: OpportunityCategory): string {
  const labels: Record<OpportunityCategory, string> = {
    "for-sale-by-owner": "For Sale by Owner",
    "for-rent-by-owner": "For Rent by Owner",
    "wanted-to-buy": "Wanted to Buy",
    "wanted-to-rent": "Wanted to Rent",
    services: "Services",
    "workforce-housing": "Workforce Housing",
  };
  return labels[cat] ?? cat;
}
