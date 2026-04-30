const RECENT_KEY = "nh-map-omnibox-recent";
const WATCH_KEY = "nh-map-watch-parcel-ids";
const MAX_RECENT = 8;

export type OmniboxRecentEntry = { label: string; ts: number };

export function readRecentOmniboxSearches(): OmniboxRecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OmniboxRecentEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushRecentOmniboxSearch(label: string): void {
  if (typeof window === "undefined" || !label.trim()) return;
  try {
    const prev = readRecentOmniboxSearches().filter((e) => e.label.toLowerCase() !== label.trim().toLowerCase());
    const next = [{ label: label.trim(), ts: Date.now() }, ...prev].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function readWatchParcelIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WATCH_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function parcelIsWatched(parcelId: string): boolean {
  if (typeof window === "undefined") return false;
  const id = parcelId.trim();
  if (!id) return false;
  return readWatchParcelIds().includes(id);
}

export function toggleWatchParcelId(parcelId: string): boolean {
  if (typeof window === "undefined" || !parcelId.trim()) return false;
  try {
    const cur = readWatchParcelIds();
    const id = parcelId.trim();
    const has = cur.includes(id);
    const next = has ? cur.filter((x) => x !== id) : [...cur, id].slice(0, 50);
    window.localStorage.setItem(WATCH_KEY, JSON.stringify(next));
    return !has;
  } catch {
    return false;
  }
}
