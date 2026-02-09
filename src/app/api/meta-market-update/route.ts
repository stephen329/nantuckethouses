import { NextResponse } from "next/server";
import { buildMarketUpdatePost } from "@/lib/marketUpdate";

const META_GRAPH_BASE = "https://graph.facebook.com/v21.0";

type MarketStatsPayload = {
  data?: {
    aggregates?: {
      activeListingCount?: number;
      medianListPrice?: number;
      medianDaysOnMarket?: number;
    };
  };
};

type MarketInsightsPayload = {
  insights?: Array<{ type: "trend" | "anomaly"; statement: string }>;
};

async function fetchMarketData(origin: string): Promise<{
  stats: MarketStatsPayload["data"];
  insights: MarketInsightsPayload["insights"];
}> {
  const [statsRes, insightsRes] = await Promise.all([
    fetch(`${origin}/api/market-stats`, { cache: "no-store" }),
    fetch(`${origin}/api/market-insights`, { cache: "no-store" }),
  ]);
  const statsJson = (await statsRes.json()) as MarketStatsPayload;
  const insightsJson = (await insightsRes.json()) as MarketInsightsPayload;
  return {
    stats: statsJson.data,
    insights: insightsJson.insights ?? [],
  };
}

/**
 * GET /api/meta-market-update
 *
 * Returns a ready-to-post market update and the data it was built from.
 * Does not post to Meta. Use for preview or copy-paste.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  try {
    const { stats, insights } = await fetchMarketData(origin);
    const aggregates = stats?.aggregates ?? {};
    const postText = buildMarketUpdatePost({
      activeListingCount: aggregates.activeListingCount ?? null,
      medianListPrice: aggregates.medianListPrice ?? null,
      medianDaysOnMarket: aggregates.medianDaysOnMarket ?? null,
      insights: insights ?? [],
    });
    return NextResponse.json({
      postText,
      stats: aggregates,
      insights,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Meta market update GET error:", message);
    return NextResponse.json(
      { error: "Failed to build market update", details: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/meta-market-update
 *
 * Builds the same market update, then posts it to the configured Facebook Page
 * if META_PAGE_ID and META_PAGE_ACCESS_TOKEN are set.
 * Returns the post id from Meta if posted, and the post text in all cases.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const pageId = process.env.META_PAGE_ID;
  const accessToken = process.env.META_PAGE_ACCESS_TOKEN;

  let postText: string;
  try {
    const { stats, insights } = await fetchMarketData(origin);
    const aggregates = stats?.aggregates ?? {};
    postText = buildMarketUpdatePost({
      activeListingCount: aggregates.activeListingCount ?? null,
      medianListPrice: aggregates.medianListPrice ?? null,
      medianDaysOnMarket: aggregates.medianDaysOnMarket ?? null,
      insights: insights ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Meta market update POST error:", message);
    return NextResponse.json(
      { error: "Failed to build market update", details: message },
      { status: 500 }
    );
  }

  if (!pageId || !accessToken) {
    return NextResponse.json({
      success: false,
      posted: false,
      postText,
      message:
        "Meta credentials not configured. Set META_PAGE_ID and META_PAGE_ACCESS_TOKEN to post to Facebook.",
    });
  }

  try {
    const form = new URLSearchParams();
    form.set("message", postText);
    form.set("access_token", accessToken);
    // Optional: add link (some post types use link instead of message for preview)
    // form.set("link", "https://nantuckethouses.com");

    const res = await fetch(`${META_GRAPH_BASE}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    const data = (await res.json()) as { id?: string; error?: { message: string; code: number } };
    if (!res.ok) {
      console.error("Meta API error:", data);
      return NextResponse.json(
        {
          success: false,
          posted: false,
          postText,
          error: data.error?.message ?? "Meta API request failed",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      posted: true,
      postId: data.id,
      postText,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Meta post error:", message);
    return NextResponse.json(
      {
        success: false,
        posted: false,
        postText,
        error: message,
      },
      { status: 502 }
    );
  }
}
