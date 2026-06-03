import Link from "next/link";
import { Calendar } from "lucide-react";
import type { BoardWatchData } from "@/types";

type Props = {
  data: BoardWatchData;
};

export function BoardWatch({ data }: Props) {
  const parsedUpdatedAt = new Date(data.updatedAt);
  const updatedLabel = Number.isNaN(parsedUpdatedAt.getTime())
    ? data.updatedAt
    : parsedUpdatedAt.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

  return (
    <section className="py-12 sm:py-16 bg-[var(--sandstone)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-8">
          <div>
            <p className="text-[var(--cedar-shingle)] text-xs uppercase tracking-[0.25em] font-semibold mb-2 font-sans">
              Regulatory Calendar
            </p>
            <h2 className="text-[var(--atlantic-navy)]">Board Watch</h2>
          </div>
          <Link
            href="/regulatory"
            className="text-sm text-[var(--privet-green)] hover:underline font-medium font-sans"
          >
            Full regulatory hub &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[var(--cedar-shingle)]/15">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">
                  Board
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">
                  Next Meeting
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--atlantic-navy)]/60 font-sans">
                  Agenda
                </th>
              </tr>
            </thead>
            <tbody>
              {data.meetings.map((meeting) => (
                <tr
                  key={meeting.board}
                  className="border-t border-[var(--cedar-shingle)]/10 bg-white hover:bg-[var(--sandstone)]/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    {meeting.link ? (
                      <Link
                        href={meeting.link}
                        className="font-semibold text-[var(--atlantic-navy)] hover:text-[var(--privet-green)] transition-colors"
                      >
                        {meeting.board}
                      </Link>
                    ) : (
                      <span className="font-semibold text-[var(--atlantic-navy)]">
                        {meeting.board}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-[var(--atlantic-navy)]">
                      <Calendar className="w-3.5 h-3.5 text-[var(--nantucket-gray)]" />
                      {meeting.nextMeeting}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {meeting.agendaLink ? (
                      <a
                        href={meeting.agendaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-[var(--privet-green)]/10 text-[var(--privet-green)] hover:bg-[var(--privet-green)]/15 px-2.5 py-1 rounded text-xs font-medium transition-colors"
                      >
                        Download Agenda
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--nantucket-gray)]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-[var(--nantucket-gray)] font-sans">
          Updated {updatedLabel}
          . Meeting times subject to change — verify with{" "}
          <a
            href="https://nantucket-ma.civicclerk.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--privet-green)] hover:underline"
          >
            CivicClerk
          </a>
          .
        </p>
      </div>
    </section>
  );
}
