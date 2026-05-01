#!/usr/bin/env python3
"""Match MLS closed-listing XML to assessor parcel_ids in clean GeoJSON.

Reads MapID + ParcelId from each <listing>, derives candidate MAP_PAR_ID strings
(including 4-digit map compaction like 4232 → 42.3.2), and writes JSON for the map.

Also emits `linkListingByParcelId`: parcel_id → XML listing `@id` for LINK URLs
(`https://nantucket.mylinkmls.com/PropertyListing.aspx?listingId=...`).

Usage:
  python3 scripts/build_recent_sold_parcel_ids.py \\
    --xml src/data/mls-closed-listings.xml \\
    --geojson src/data/zoning-tool/nantucket-tax-parcels.clean.geojson \\
    --out src/data/recent-sold-parcels.json
"""

from __future__ import annotations

import argparse
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--xml", required=True, type=Path)
    p.add_argument("--geojson", required=True, type=Path)
    p.add_argument("--out", required=True, type=Path)
    return p.parse_args()


def load_parcel_id_index(geojson_path: Path) -> set[str]:
    with geojson_path.open() as f:
        data = json.load(f)
    ids: set[str] = set()
    for feat in data.get("features", []):
        props = feat.get("properties") or {}
        pid = props.get("parcel_id")
        if pid not in (None, ""):
            ids.add(str(pid).strip())
        tm, pr = props.get("tax_map"), props.get("parcel")
        if tm not in (None, "") and pr not in (None, ""):
            ids.add(f"{str(tm).strip()} {str(pr).strip()}")
    return ids


def candidates(map_id: str, parcel_id: str) -> list[str]:
    mid = " ".join(map_id.split())
    pid = " ".join(parcel_id.split())
    out: list[str] = []

    def add(a: str, b: str) -> None:
        key = f"{a} {b}".strip()
        if key not in out:
            out.append(key)

    add(mid, pid)
    m = re.match(r"^([\d.]+)", pid)
    short_pid = m.group(1) if m else pid
    if short_pid != pid:
        add(mid, short_pid)

    if re.fullmatch(r"\d{4}", mid):
        dotted = f"{mid[:2]}.{mid[2]}.{mid[3]}"
        add(dotted, pid)
        if short_pid != pid:
            add(dotted, short_pid)
        if mid.startswith("77"):
            alt = "73" + mid[2:]
            dotted2 = f"{alt[:2]}.{alt[2]}.{alt[3]}"
            add(dotted2, pid)
            if short_pid != pid:
                add(dotted2, short_pid)
    return out


def match_listing(ids: set[str], map_id: str, parcel_id: str) -> str | None:
    for key in candidates(map_id, parcel_id):
        if key in ids:
            return key
    return None


def main() -> None:
    args = parse_args()
    ids = load_parcel_id_index(args.geojson.expanduser().resolve())
    root = ET.parse(args.xml.expanduser().resolve()).getroot()

    matched: list[str] = []
    link_listing_by_parcel: dict[str, str] = {}
    listing_count = 0
    for listing in root.findall("listing"):
        listing_count += 1
        link_id = (listing.get("id") or "").strip()
        mid = (listing.findtext("MapID") or "").strip()
        pid = (listing.findtext("ParcelId") or "").strip()
        if not mid or not pid:
            continue
        if "&" in mid and "&" in pid:
            mids = [x.strip() for x in mid.split("&")]
            pids = [x.strip() for x in pid.split("&")]
            if len(mids) == len(pids):
                for m, p in zip(mids, pids):
                    hit = match_listing(ids, m, p)
                    if hit:
                        matched.append(hit)
                        if link_id:
                            link_listing_by_parcel[hit] = link_id
            continue
        hit = match_listing(ids, mid, pid)
        if hit:
            matched.append(hit)
            if link_id:
                link_listing_by_parcel[hit] = link_id

    unique = sorted(set(matched))
    payload = {
        "source": str(args.xml),
        "listingCount": listing_count,
        "matchedParcelCount": len(unique),
        "parcelIds": unique,
        "linkListingByParcelId": link_listing_by_parcel,
    }
    out_path = args.out.expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"matchedParcelCount": len(unique), "listingCount": listing_count, "out": str(out_path)}, indent=2))


if __name__ == "__main__":
    main()
