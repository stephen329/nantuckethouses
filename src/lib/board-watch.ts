import fallbackBoardWatch from "@/data/board-watch.json";
import type { BoardMeeting, BoardWatchData } from "@/types";

const BOARD_WATCH_RSS_URL =
  "https://www.nantucket-ma.gov/RSSFeed.aspx?ModID=58&CID=Boards-Committees-Others-158";
const NANTUCKET_BASE_URL = "https://www.nantucket-ma.gov";

const MAX_MEETINGS = 6;

function getTagValue(xml: string, tagName: string): string | null {
  const match = xml.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i"));
  return match?.[1]?.trim() ?? null;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function normalizeBoardName(title: string): string {
  const clean = title.replace(/\s+UPDATED$/i, "").trim();
  const mappings: Record<string, string> = {
    "Historic District Commission": "HDC",
    "Sign Advisory Council (HDC)": "HDC - Sign Advisory Council",
    "Planning Board": "Planning Board",
    "Zoning Board": "Zoning Board",
    "Select Board": "Select Board",
    "County Commissioners": "County Commissioners",
    "Coastal Resilience Advisory Committee": "Coastal Resilience",
    "Community Preservation Committee": "Community Preservation",
    "Affordable Housing Trust": "Affordable Housing Trust",
    "Nantucket Islands Land Bank Commission": "Land Bank",
  };

  return mappings[clean] ?? clean;
}

function parseStartTime(rawTimes: string | null): string {
  if (!rawTimes) return "Time TBD";
  const start = rawTimes.split("-")[0]?.trim();
  return start || "Time TBD";
}

function parseEventDate(eventDate: string | null, eventTimes: string | null): Date | null {
  if (!eventDate) return null;
  const startTime = parseStartTime(eventTimes);
  const date = new Date(`${eventDate} ${startTime}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMeetingDate(date: Date): string {
  const datePart = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} @ ${timePart}`;
}

function toAbsoluteUrl(value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return `${NANTUCKET_BASE_URL}${value}`;
  return value;
}

async function fetchAgendaLinkFromEventPage(eventUrl: string): Promise<string | undefined> {
  try {
    const response = await fetch(eventUrl, {
      next: { revalidate: 900 },
    });
    if (!response.ok) return undefined;
    const html = await response.text();

    const directDownloadMatch =
      html.match(/id=["']DownloadAgenda["'][^>]*href=["']([^"']+)["']/i) ??
      html.match(/href=["']([^"']+)["'][^>]*id=["']DownloadAgenda["']/i);
    if (directDownloadMatch?.[1]) {
      return toAbsoluteUrl(decodeHtml(directDownloadMatch[1].trim()));
    }

    const civicClerkMatch = html.match(
      /(https?:\/\/[^"'\s]*civicclerk\.com\/event\/\d+\/files|\/\/[^"'\s]*civicclerk\.com\/event\/\d+\/files)/i,
    );
    if (civicClerkMatch?.[1]) {
      return toAbsoluteUrl(decodeHtml(civicClerkMatch[1].trim()));
    }
  } catch (error) {
    console.warn("Failed to parse agenda link from event page:", eventUrl, error);
  }
  return undefined;
}

export async function getBoardWatchData(): Promise<BoardWatchData> {
  try {
    const response = await fetch(BOARD_WATCH_RSS_URL, {
      next: { revalidate: 900 },
    });
    if (!response.ok) {
      throw new Error(`Board Watch RSS request failed: ${response.status}`);
    }

    const xml = await response.text();
    const lastBuildDateRaw = getTagValue(xml, "lastBuildDate");
    const lastBuildDate = lastBuildDateRaw ? new Date(lastBuildDateRaw) : new Date();
    const updatedAt = Number.isNaN(lastBuildDate.getTime())
      ? new Date().toISOString()
      : lastBuildDate.toISOString();

    const itemMatches = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi));
    const parsed = itemMatches
      .map((item) => item[1] ?? "")
      .map((itemXml) => {
        const title = decodeHtml(getTagValue(itemXml, "title") ?? "");
        const link = decodeHtml(getTagValue(itemXml, "link") ?? "");
        const eventDate = decodeHtml(
          getTagValue(itemXml, "calendarEvent:EventDates") ?? "",
        ).trim();
        const eventTimes = decodeHtml(
          getTagValue(itemXml, "calendarEvent:EventTimes") ?? "",
        ).trim();
        const eventDateTime = parseEventDate(eventDate || null, eventTimes || null);
        return {
          board: normalizeBoardName(title),
          link: toAbsoluteUrl(link),
          eventDateTime,
        };
      })
      .filter((item) => item.board && item.eventDateTime)
      .filter((item) => item.eventDateTime && item.eventDateTime >= new Date())
      .sort((a, b) => (a.eventDateTime!.getTime() - b.eventDateTime!.getTime()));

    // Keep only the next upcoming meeting per board.
    const byBoard = new Map<string, BoardMeeting & { _eventLink?: string }>();
    for (const item of parsed) {
      if (!item.eventDateTime || byBoard.has(item.board)) continue;
      byBoard.set(item.board, {
        board: item.board,
        nextMeeting: formatMeetingDate(item.eventDateTime),
        topic: "",
        link: item.link || undefined,
        _eventLink: item.link || undefined,
      });
      if (byBoard.size >= MAX_MEETINGS) break;
    }

    const meetingsWithEventLinks = Array.from(byBoard.values());
    const agendaLinks = await Promise.all(
      meetingsWithEventLinks.map((meeting) =>
        meeting._eventLink
          ? fetchAgendaLinkFromEventPage(meeting._eventLink)
          : Promise.resolve(undefined),
      ),
    );

    const meetings: BoardMeeting[] = meetingsWithEventLinks.map((meeting, index) => ({
      board: meeting.board,
      nextMeeting: meeting.nextMeeting,
      topic: meeting.topic,
      link: meeting.link,
      agendaLink: agendaLinks[index],
    }));

    if (meetings.length === 0) {
      throw new Error("No upcoming meetings parsed from RSS");
    }

    return { updatedAt, meetings };
  } catch (error) {
    console.error("Board Watch RSS fetch failed, using fallback JSON:", error);
    return fallbackBoardWatch as BoardWatchData;
  }
}
