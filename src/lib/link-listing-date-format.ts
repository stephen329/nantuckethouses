const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/**
 * Display MLS-style dates as `MMM DD, YYYY` (e.g. `Jan 05, 2024`).
 * Handles common ISO `YYYY-MM-DD` without UTC day-shift.
 */
export function formatLinkMlsDateDisplay(raw: string | null | undefined): string {
  const s = raw != null ? String(raw).trim() : "";
  if (!s) return "";

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]) - 1;
    const day = Number(iso[3]);
    if (m >= 0 && m < 12 && day >= 1 && day <= 31 && !Number.isNaN(y)) {
      const mon = MONTHS_SHORT[m];
      return `${mon} ${String(day).padStart(2, "0")}, ${y}`;
    }
  }

  const ms = Date.parse(s);
  if (!Number.isNaN(ms)) {
    const d = new Date(ms);
    const mon = MONTHS_SHORT[d.getMonth()];
    return `${mon} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
  }

  return s;
}
