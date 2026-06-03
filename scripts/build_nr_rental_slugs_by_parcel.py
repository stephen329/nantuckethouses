#!/usr/bin/env python3
"""Map Nantucket Rentals vacation listing slugs to assessor parcel_id keys.

Uses the public NR property listing API (same feed as nr-web-fe) and parcel
`location` from the clean tax GeoJSON. Matching is by a normalized street key:
leading number + optional letter (13 / 13A) collapse to the same numeric stem,
and common street-type abbreviations (LN, RD, ST, …) are expanded.

Usage:
  NR_LISTINGS_API_BASE=https://api.nantucketrentals.com/api \\
    python3 scripts/build_nr_rental_slugs_by_parcel.py \\
    --geojson src/data/zoning-tool/nantucket-tax-parcels.clean.geojson \\
    --out src/data/nr-rental-slugs-by-parcel.json

Defaults use dev API if NR_LISTINGS_API_BASE is unset.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path


ABBREV = (
    (r"\bpl\b", " place"),
    (r"\bpl\.\b", " place"),
    (r"\bct\b", " court"),
    (r"\bct\.\b", " court"),
    (r"\bdr\b", " drive"),
    (r"\bdr\.\b", " drive"),
    (r"\bln\b", " lane"),
    (r"\bln\.\b", " lane"),
    (r"\brd\b", " road"),
    (r"\brd\.\b", " road"),
    (r"\bst\b", " street"),
    (r"\bst\.\b", " street"),
    (r"\bave\b", " avenue"),
    (r"\bave\.\b", " avenue"),
    (r"\bblvd\b", " boulevard"),
    (r"\bblvd\.\b", " boulevard"),
    (r"\bwy\b", " way"),
    (r"\bwy\.\b", " way"),
    (r"\bcir\b", " circle"),
    (r"\bcir\.\b", " circle"),
    (r"\bci\b", " circle"),
    (r"\bter\b", " terrace"),
    (r"\bter\.\b", " terrace"),
    (r"\bhwy\b", " highway"),
    (r"\bhwy\.\b", " highway"),
)


def expand_abbrevs(s: str) -> str:
    t = " ".join(s.lower().split())
    for pat, rep in ABBREV:
        t = re.sub(pat, rep, t)
    return " ".join(t.split())


def street_match_key(raw: str) -> str:
    """Comparable key for listing streetAddress vs parcel location."""
    s = expand_abbrevs(raw.strip())
    s = re.sub(r"[,'\"]", " ", s)
    s = " ".join(s.split())
    if not s:
        return ""
    parts = s.split()
    first = parts[0]
    # 13, 13a, 13A → numeric stem + rest (handles 13A Gingy vs 13 GINGY LN)
    m = re.match(r"^(\d+)([a-z])?$", first, re.I)
    if m:
        num = m.group(1)
        rest = " ".join(parts[1:])
        return f"{num} {rest}".strip()
    return s


def looks_like_street_address(loc: str) -> bool:
    return bool(re.search(r"\d", loc))


def fetch_all_listings(api_base: str) -> list[dict]:
    base = api_base.rstrip("/")
    out: list[dict] = []
    url: str | None = f"{base}/property/nrproperty-listing/?page=1&page_size=500"
    while url:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                body = json.load(resp)
        except urllib.error.HTTPError as e:
            raise SystemExit(f"HTTP {e.code} for {url}") from e
        except urllib.error.URLError as e:
            raise SystemExit(f"Request failed: {e}") from e
        for row in body.get("results") or []:
            if (row.get("status") or "").lower() == "active" and row.get("slug") and row.get("streetAddress"):
                out.append(row)
        url = body.get("next")
    return out


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--geojson", type=Path, required=True)
    p.add_argument("--out", type=Path, required=True)
    args = p.parse_args()

    api_base = (os.environ.get("NR_LISTINGS_API_BASE") or "https://api.dev.nantucketrentals.com/api").strip()
    listings = fetch_all_listings(api_base)

    # street_key -> list of slugs (detect ambiguity)
    key_slugs: dict[str, list[str]] = {}
    for row in listings:
        k = street_match_key(str(row["streetAddress"]))
        if not k or not looks_like_street_address(str(row["streetAddress"])):
            continue
        key_slugs.setdefault(k, []).append(str(row["slug"]))

    slug_by_street_key: dict[str, str] = {}
    for k, slugs in key_slugs.items():
        uniq = sorted(set(slugs))
        if len(uniq) != 1:
            print(f"skip ambiguous street key {k!r}: {uniq}", file=sys.stderr)
            continue
        slug_by_street_key[k] = uniq[0]

    with args.geojson.expanduser().resolve().open() as f:
        gj = json.load(f)

    slug_by_parcel_id: dict[str, str] = {}
    for feat in gj.get("features") or []:
        props = feat.get("properties") or {}
        pid = props.get("parcel_id")
        loc = props.get("location")
        if pid in (None, "") or loc in (None, ""):
            continue
        loc_s = str(loc).strip()
        if not looks_like_street_address(loc_s):
            continue
        k = street_match_key(loc_s)
        slug = slug_by_street_key.get(k)
        if not slug:
            continue
        pid_s = str(pid).strip()
        if pid_s in slug_by_parcel_id and slug_by_parcel_id[pid_s] != slug:
            print(f"skip parcel_id collision {pid_s!r}: {slug_by_parcel_id[pid_s]} vs {slug}", file=sys.stderr)
            continue
        slug_by_parcel_id[pid_s] = slug

    payload = {
        "source": f"{api_base}/property/nrproperty-listing/ (active) × {args.geojson.name}",
        "listingCount": len(listings),
        "matchedParcelCount": len(slug_by_parcel_id),
        "slugByParcelId": dict(sorted(slug_by_parcel_id.items())),
    }
    args.out.expanduser().resolve().parent.mkdir(parents=True, exist_ok=True)
    with args.out.expanduser().resolve().open("w") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")
    print(
        f"Wrote {args.out}: {payload['matchedParcelCount']} parcels from "
        f"{payload['listingCount']} active listings (API {api_base}).",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
