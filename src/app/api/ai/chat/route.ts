import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Force dynamic rendering - no caching for fresh MLS data
export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });

const SYSTEM_PROMPT = `You are a helpful assistant for Nantucket real estate market data. You have access to live MLS data via tools.

**When to ask clarifying questions**
If the user's request is ambiguous, ask a short clarifying question before calling tools or giving a long answer. Examples of ambiguity:
- "How has price changed over time?" → Unclear: do they want (a) one number per year for the whole island, or (b) a breakdown by area over one period? Ask which they prefer.
- "Average price" over a period → Unclear: island-wide only, or broken down by neighborhood? Ask if unsure.
- "Listings" or "homes" → Could mean active listings (for sale) or sold/closed. Ask if it matters for the answer.
- Vague area ("downtown", "the island") → Confirm you'll use "Town" or "all Nantucket" as appropriate.
- Time period missing ("recent sales") → Ask what period (e.g. last 6 months, 1 year, 5 years).
Ask one short question at a time; once they clarify, use the tools and answer with specific numbers.

Use the tools to answer questions about:
- How many listings are on the market in a given area → use get_neighborhood_stats
- Median or average list price by area → use get_neighborhood_stats
- Average or median price paid (sold prices) over a time period → use get_neighborhood_sales
- Browse or search individual listings → use search_listings with filters (area, price range, bedrooms, property type)
- Find specific properties or get listing details → use search_listings
- Newest listings or most recently added → use search_listings with sortBy: "newest"
- Cheapest or lowest priced → use search_listings with sortBy: "priceAsc"
- Most expensive → use search_listings with sortBy: "priceDesc"

Area names in the data: Town, Sconset, Dionis, Naushop, Madaket, Monomoy, Cliff, Brant Point, Surfside, Cisco, Tom Nevers, Mid Island, etc.

When showing listings, include: address, area, price, bedrooms/baths, sqft, property type, and days on market. Format prices with commas (e.g., $2,500,000).

Answer concisely and cite the numbers. If data for a requested area is not found, say so and list available areas.`;

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_neighborhood_stats",
      description:
        "Get current active listing counts and list prices (median, average) by neighborhood/area in Nantucket. Use this for questions like 'how many listings in Dionis' or 'what is the median price in Naushop' (for list prices).",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_neighborhood_sales",
      description:
        "Get sold transaction data by neighborhood: sales count, median/avg sale price, total volume. Use for 'average price paid' or 'sales in X over the past N months'.",
      parameters: {
        type: "object",
        properties: {
          months: {
            type: "number",
            description:
              "Number of months to look back (e.g. 6 for past 6 months, 12 for past year). Default 12.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_listings",
      description:
        "Search and browse individual active listings with optional filters and sorting. Returns listing details including address, price, bedrooms, bathrooms, sqft, property type, and days on market. Use for questions like 'show me listings in Sconset', 'what homes are under $2M', 'find 4 bedroom houses', 'newest listings', 'most recently added', etc.",
      parameters: {
        type: "object",
        properties: {
          area: {
            type: "string",
            description:
              "Filter by neighborhood/area (e.g., 'Town', 'Sconset', 'Madaket', 'Cliff', 'Surfside'). Leave empty for all areas.",
          },
          minPrice: {
            type: "number",
            description: "Minimum list price filter (e.g., 1000000 for $1M).",
          },
          maxPrice: {
            type: "number",
            description: "Maximum list price filter (e.g., 5000000 for $5M).",
          },
          bedrooms: {
            type: "number",
            description: "Minimum number of bedrooms.",
          },
          propertyType: {
            type: "string",
            description:
              "Property type filter: 'Single Family', 'Condo', 'Land', 'Multi-Family', etc.",
          },
          sortBy: {
            type: "string",
            enum: ["priceDesc", "priceAsc", "newest", "oldest", "bedsDesc"],
            description:
              "Sort order: 'priceDesc' (highest price first), 'priceAsc' (lowest price first), 'newest' (most recently listed first - use for 'newest listings' or 'fewest days on market'), 'oldest' (longest on market first), 'bedsDesc' (most bedrooms first). Default is priceDesc.",
          },
          limit: {
            type: "number",
            description: "Number of listings to return (default 10, max 50).",
          },
        },
      },
    },
  },
];

async function fetchJson<T>(
  baseUrl: string,
  path: string
): Promise<T> {
  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
    };
    const { messages } = body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Request body must include messages array" },
        { status: 400 }
      );
    }

    const origin = request.nextUrl.origin;

    const modelMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    let response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: modelMessages,
      tools: TOOLS,
      tool_choice: "auto",
    });

    const assistantMessage = response.choices[0]?.message;
    if (!assistantMessage) {
      return NextResponse.json(
        { error: "No response from model" },
        { status: 502 }
      );
    }

    const toolCalls = assistantMessage.tool_calls;
    if (toolCalls?.length) {
      const toolResults: OpenAI.Chat.Completions.ChatCompletionToolMessageParam[] = [];

      for (const tc of toolCalls) {
        if (tc.function.name === "get_neighborhood_stats") {
          try {
            const data = await fetchJson<{ data?: unknown[] }>(
              origin,
              "/api/neighborhoods"
            );
            toolResults.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify(data),
            });
          } catch (err) {
            toolResults.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify({
                error: err instanceof Error ? err.message : "Failed to fetch neighborhood stats",
              }),
            });
          }
        } else if (tc.function.name === "get_neighborhood_sales") {
          let months = 12;
          try {
            const args = JSON.parse(tc.function.arguments ?? "{}") as { months?: number };
            if (typeof args.months === "number" && args.months > 0) {
              months = args.months;
            }
          } catch {
            // use default
          }
          const endDate = new Date();
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - months);
          const start = startDate.toISOString().split("T")[0];
          const end = endDate.toISOString().split("T")[0];
          try {
            const data = await fetchJson<{ data?: unknown[]; totalSales?: number }>(
              origin,
              `/api/neighborhood-sales?startDate=${start}&endDate=${end}`
            );
            toolResults.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify({ ...data, periodMonths: months }),
            });
          } catch (err) {
            toolResults.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify({
                error: err instanceof Error ? err.message : "Failed to fetch neighborhood sales",
              }),
            });
          }
        } else if (tc.function.name === "search_listings") {
          try {
            const args = JSON.parse(tc.function.arguments ?? "{}") as {
              area?: string;
              minPrice?: number;
              maxPrice?: number;
              bedrooms?: number;
              propertyType?: string;
              sortBy?: string;
              limit?: number;
            };
            
            const params = new URLSearchParams();
            if (args.area) params.set("area", args.area);
            if (args.minPrice) params.set("minPrice", String(args.minPrice));
            if (args.maxPrice) params.set("maxPrice", String(args.maxPrice));
            if (args.bedrooms) params.set("bedrooms", String(args.bedrooms));
            if (args.propertyType) params.set("propertyType", args.propertyType);
            if (args.sortBy) params.set("sortBy", args.sortBy);
            if (args.limit) params.set("limit", String(Math.min(args.limit, 50)));
            
            const queryString = params.toString();
            const url = `/api/listings${queryString ? `?${queryString}` : ""}`;
            
            const data = await fetchJson<{ count?: number; listings?: unknown[] }>(
              origin,
              url
            );
            toolResults.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify(data),
            });
          } catch (err) {
            toolResults.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify({
                error: err instanceof Error ? err.message : "Failed to search listings",
              }),
            });
          }
        }
      }

      modelMessages.push(assistantMessage);
      for (const tr of toolResults) {
        modelMessages.push(tr);
      }

      response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: modelMessages,
        tools: TOOLS,
        tool_choice: "auto",
      });
    }

    const finalMessage = response.choices[0]?.message;
    const content =
      finalMessage?.content ?? "I couldn't generate a response. Please try again.";

    return NextResponse.json({
      message: { role: "assistant" as const, content },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Chat request failed",
      },
      { status: 500 }
    );
  }
}
