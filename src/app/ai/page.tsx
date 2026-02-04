"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Bot, User, Loader2 } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data.error as string) || res.statusText);
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      const assistantContent =
        typeof data.message?.content === "string"
          ? data.message.content
          : "No response.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantContent },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--parchment)] text-[var(--nantucket-navy)]">
      <header className="shrink-0 border-b border-[var(--fog-gray)] bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-[var(--harbor-blue)] hover:text-[var(--nantucket-navy)] transition-colors text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Home
              </Link>
              <span className="text-[var(--fog-gray)]">|</span>
              <span className="text-sm font-medium text-[var(--nantucket-navy)]">
                Market data assistant
              </span>
            </div>
            <div className="h-7 w-7 rounded-md bg-[var(--nantucket-navy)] text-[var(--sandstone)] grid place-items-center text-[11px] font-semibold select-none">
              RE
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="rounded-2xl border border-[var(--fog-gray)] bg-white shadow-sm p-8 max-w-md">
              <Bot
                className="h-12 w-12 text-[var(--harbor-blue)] mx-auto mb-4"
                strokeWidth={1.5}
              />
              <h2 className="text-lg font-semibold text-[var(--nantucket-navy)] mb-2">
                Ask about Nantucket market data
              </h2>
              <p className="text-sm text-[var(--harbor-blue)] mb-6">
                Try: &ldquo;How many listings are on the market in Dionis?&rdquo; or
                &ldquo;What is the average price paid for homes in Naushop over the past 6 months?&rdquo;
              </p>
              <p className="text-xs text-[var(--harbor-blue)]/80">
                This page is not linked from the main site. Data is from the MLS via this app&apos;s APIs.
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto py-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="shrink-0 h-8 w-8 rounded-lg bg-[var(--seafoam)]/30 flex items-center justify-center">
                  <Bot
                    className="h-4 w-4 text-[var(--harbor-blue)]"
                    strokeWidth={1.5}
                  />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-[var(--nantucket-navy)] text-white"
                    : "bg-white border border-[var(--fog-gray)] text-[var(--nantucket-navy)] shadow-sm"
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
              </div>
              {msg.role === "user" && (
                <div className="shrink-0 h-8 w-8 rounded-lg bg-[var(--harbor-blue)] flex items-center justify-center">
                  <User className="h-4 w-4 text-white" strokeWidth={1.5} />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-[var(--seafoam)]/30 flex items-center justify-center">
                <Loader2
                  className="h-4 w-4 text-[var(--harbor-blue)] animate-spin"
                  strokeWidth={1.5}
                />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-white border border-[var(--fog-gray)] shadow-sm text-[var(--harbor-blue)] text-sm">
                Thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="rounded-lg border border-[var(--sunset-coral)]/30 bg-[var(--sunset-coral)]/10 px-4 py-2 text-sm text-[var(--nantucket-navy)] mb-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="shrink-0 pt-2 pb-4">
          <div className="flex gap-2 rounded-xl border border-[var(--fog-gray)] bg-white shadow-sm p-2 focus-within:ring-2 focus-within:ring-[var(--polished-brass)] focus-within:border-[var(--polished-brass)] transition-shadow">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about listings, prices, or sales by area…"
              className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-[var(--nantucket-navy)] placeholder:text-[var(--harbor-blue)]/60 focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-lg bg-[var(--nantucket-navy)] text-[var(--sandstone)] hover:bg-[var(--harbor-blue)] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--polished-brass)]"
              aria-label="Send"
            >
              {loading ? (
                <Loader2
                  className="h-4 w-4 animate-spin"
                  strokeWidth={1.5}
                />
              ) : (
                <Send className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
