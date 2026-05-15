#!/usr/bin/env node
/**
 * Union all JSON keys from a sample of Congdon & Coleman `link-listings` rows
 * (same endpoint as the app; override base/path with env).
 *
 * Usage:
 *   node scripts/introspect-link-listings-fields.mjs
 *   CNC_API_BASE=https://api.congdonandcoleman.com CNC_PATH=link-listings node scripts/introspect-link-listings-fields.mjs
 */

const BASE = (process.env.CNC_API_BASE || "https://api.congdonandcoleman.com").replace(/\/+$/, "");
const PATH = (process.env.CNC_PATH || "link-listings").replace(/^\/+/, "");
const LIMIT = Math.min(Math.max(parseInt(process.env.CNC_SAMPLE_LIMIT || "100", 10), 1), 500);

async function fetchPage(offset) {
  const u = new URL(`${BASE}/${PATH}`);
  u.searchParams.set("status", "A");
  u.searchParams.set("limit", String(LIMIT));
  u.searchParams.set("offset", String(offset));
  const res = await fetch(u, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

const keySet = new Set();
let total = 0;
let scanned = 0;

const first = await fetchPage(0);
total = first.count ?? 0;
for (const row of first.results ?? []) {
  scanned += 1;
  if (row && typeof row === "object") Object.keys(row).forEach((k) => keySet.add(k));
}

const keys = [...keySet].sort();
console.log(JSON.stringify({ endpoint: `${BASE}/${PATH}`, totalReported: total, rowsSampled: scanned, keyCount: keys.length, keys }, null, 2));
