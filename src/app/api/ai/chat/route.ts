import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });

const SYSTEM_PROMPT = `You are a helpful assistant for Nantucket real estate market data. You have access to live MLS data via tools.

Use the tools to answer questions about:
- How many listings are on the market in a given area (e.g. Dionis, Naushop, Madaket, Sconset, Town, Tom Nevers) → use get_neighborhood_stats and find the matching neighborhood.
- Median or average list price by area → use get_neighborhood_stats.
- Average or median price paid (sold prices) in an area over a time period (e.g. past 6 months, past year) → use get_neighborhood_sales with the appropriate months (e.g. 6 for 6 months, 12 for 1 year).

Area names in the data may appear as: Town, Sconset, Dionis, Naushop, Madaket, Monomoy, Cliff, Brant Point, Surfside, Cisco, Tom Nevers, etc. Match the user's area name to the closest neighborhood name in the data.

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
