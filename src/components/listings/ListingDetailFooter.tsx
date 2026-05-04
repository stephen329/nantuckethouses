import Link from "next/link";

const LINK_PORTAL = "https://nantucket.mylinkmls.com/";

type Props = {
  linkMlsDetailUrl: string;
  assessorSearchUrl: string;
};

export function ListingDetailFooter({ linkMlsDetailUrl, assessorSearchUrl }: Props) {
  return (
    <div
      role="contentinfo"
      className="rounded-[var(--radius-card)] border border-[#e0e6ef] bg-white p-4 sm:p-6 text-sm text-[var(--nantucket-gray)] shadow-sm print:break-inside-avoid"
    >
      <p className="leading-relaxed">
        Benchmarks are built from{" "}
        <Link href={LINK_PORTAL} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--privet-green)] hover:underline">
          LINK MLS
        </Link>{" "}
        (Congdon &amp; Coleman feed),{" "}
        <Link href={assessorSearchUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--privet-green)] hover:underline">
          Nantucket Assessor
        </Link>{" "}
        public records, and our cleaned
        historical cohorts on this site. No hand-picked marketing sets.{" "}
        <Link href={linkMlsDetailUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--privet-green)] hover:underline">
          Open this listing on LINK
        </Link>
        .{" "}
        <Link href="/resources" className="font-medium text-[var(--privet-green)] hover:underline">
          Full market methodology
        </Link>{" "}
        (Resources) ·{" "}
        <Link href="/market-pulse" className="font-medium text-[var(--privet-green)] hover:underline">
          Market Pulse
        </Link>
        .
      </p>
      <p className="mt-3 leading-relaxed">
        Figures are mechanical aggregations for context only; the comps table uses deterministic filters (similarity
        score is a transparent heuristic, not an appraisal).
      </p>
      <p className="mt-4 font-medium text-[var(--atlantic-navy)]">
        Want a custom benchmark report for your property?{" "}
        <Link href="/about" className="text-[var(--privet-green)] hover:underline">
          Contact Stephen Maury directly.
        </Link>
      </p>
    </div>
  );
}
