#!/usr/bin/env python3
"""Normalize Nantucket parcel GeoJSON for zoning lookup tooling.

Usage:
  python3 scripts/normalize_tax_parcels_geojson.py \
    --input /path/to/GeoJSON_Test.json \
    --output-dir src/data/zoning-tool
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


SQM_TO_ACRES = 0.00024710538146717
SQM_TO_SQFT = 10.76391041671

ZONING_COLORS = {
    "LUG1": "#2E7D32",
    "LUG2": "#388E3C",
    "LUG3": "#43A047",
    "ROH": "#1976D2",
    "RC": "#7B1FA2",
    "CN": "#F57C00",
    "CTEC": "#00838F",
    "S": "#6D4C41",
    "R1": "#5E35B1",
    "R5": "#8E24AA",
    "R10": "#AB47BC",
}
DEFAULT_ZONING_COLOR = "#546E7A"

FIELD_PRIORITY = {
    "parcel_id": ["MAP_PAR_ID", "Parcel_Id", "MA_MAP_PAR_ID"],
    "alt_parcel_id": ["Alt_Parcel_ID"],
    "zoning": ["Zoning"],
    "use": ["Use"],
    "primary_use": ["Primary_Use"],
    "land_use_code": ["LND_USE_CODE"],
    "street_number": ["Street_Number"],
    "street_name": ["Street_Name"],
    "location": ["Location", "Address_Line_1"],
    "owner_name": ["Owners_Name", "Owner_Full_Name"],
    "co_owner_name": ["CoOwner_Full_Name"],
    "land_class": ["Land_Class"],
    "utilities": ["Utilities_Desc", "Utilities"],
    "shape_area_sq_m": ["Shape_Area"],
    "assessed_total": ["Assessed", "Total_Assessed_Parcel_Value"],
    "assessed_building": ["Total_Assessed_Bldg"],
    "assessed_outbuilding": ["Total_Assessed_Outbldg"],
    "assessed_extra_features": ["Total_Assessed_Extra_Features"],
    "assessed_improvements": ["Total_Assessed_Improvements"],
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Input GeoJSON path")
    parser.add_argument(
        "--output-dir",
        required=True,
        help="Output directory for clean geojson and docs (relative to cwd or absolute)",
    )
    return parser.parse_args()


def to_number(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = re.sub(r"[$,]", "", value.strip())
        if not cleaned:
            return None
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def index_properties(raw_properties: dict) -> dict:
    """Index raw properties by both full key and suffix key."""
    index = {}
    for key, value in raw_properties.items():
        index[key] = value
        if "." in key:
            suffix = key.split(".")[-1]
            # Keep the first non-null value encountered for each suffix.
            if suffix not in index or index[suffix] is None:
                index[suffix] = value
    return index


def pick_value(index: dict, candidates: list[str]):
    for candidate in candidates:
        if candidate in index and index[candidate] not in (None, ""):
            return index[candidate], candidate
    return None, None


def normalize_feature(feature: dict) -> tuple[dict, list[str]]:
    raw_props = feature.get("properties", {}) or {}
    indexed = index_properties(raw_props)
    used_raw_fields = []
    normalized = {}

    for output_key, candidates in FIELD_PRIORITY.items():
        value, source_field = pick_value(indexed, candidates)
        normalized[output_key] = value
        if source_field:
            used_raw_fields.append(source_field)

    shape_area_sqm = to_number(normalized.get("shape_area_sq_m"))
    acreage = shape_area_sqm * SQM_TO_ACRES if shape_area_sqm is not None else None
    sqft = shape_area_sqm * SQM_TO_SQFT if shape_area_sqm is not None else None

    normalized["shape_area_sq_m"] = round(shape_area_sqm, 2) if shape_area_sqm else None
    normalized["acreage"] = round(acreage, 4) if acreage else None
    normalized["lot_area_sqft"] = round(sqft, 2) if sqft else None

    assessed_total = to_number(normalized.get("assessed_total"))
    normalized["assessed_total"] = round(assessed_total, 2) if assessed_total else None
    for key in (
        "assessed_building",
        "assessed_outbuilding",
        "assessed_extra_features",
        "assessed_improvements",
    ):
        component = to_number(normalized.get(key))
        normalized[key] = round(component, 2) if component else None

    if assessed_total and acreage and acreage > 0:
        normalized["assessed_price_per_acre"] = round(assessed_total / acreage, 2)
    else:
        normalized["assessed_price_per_acre"] = None

    zoning = normalized.get("zoning")
    normalized["zoning"] = zoning.strip().upper() if isinstance(zoning, str) else zoning
    normalized["zoning_color"] = ZONING_COLORS.get(normalized["zoning"], DEFAULT_ZONING_COLOR)

    if not normalized.get("location"):
        street_number = str(normalized.get("street_number") or "").strip()
        street_name = str(normalized.get("street_name") or "").strip()
        normalized["location"] = f"{street_number} {street_name}".strip() or None

    normalized["source_fields"] = sorted(set(used_raw_fields))
    return {
        "type": feature.get("type", "Feature"),
        "geometry": feature.get("geometry"),
        "properties": normalized,
    }, list(raw_props.keys())


def main() -> None:
    args = parse_args()
    input_path = Path(args.input).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    with input_path.open() as input_file:
        source = json.load(input_file)

    raw_field_stats = {}
    normalized_features = []

    for feature in source.get("features", []):
        normalized_feature, raw_keys = normalize_feature(feature)
        normalized_features.append(normalized_feature)
        raw_properties = feature.get("properties", {}) or {}
        for key in raw_keys:
            stats = raw_field_stats.setdefault(key, {"count": 0, "types": set()})
            stats["count"] += 1
            stats["types"].add(type(raw_properties.get(key)).__name__)

    clean = {
        "type": source.get("type", "FeatureCollection"),
        "name": "nantucket_tax_parcels_clean_v1",
        "crs": source.get("crs"),
        "metadata": {
            "source_file": str(input_path),
            "feature_count": len(normalized_features),
            "derived_fields": [
                "lot_area_sqft",
                "acreage",
                "assessed_price_per_acre",
                "zoning_color",
            ],
        },
        "features": normalized_features,
    }

    clean_geojson_path = output_dir / "nantucket-tax-parcels.clean.geojson"
    with clean_geojson_path.open("w") as clean_file:
        json.dump(clean, clean_file, separators=(",", ":"))

    dictionary_path = output_dir / "DATA_DICTIONARY.md"
    lines = [
        "# Nantucket Tax Parcels - Data Dictionary (v1)",
        "",
        f"- Source: `{input_path}`",
        f"- Features: **{len(normalized_features)}**",
        f"- Output: `{clean_geojson_path}`",
        "",
        "## Normalized Fields",
        "",
        "- `parcel_id` (string): Parcel identifier used for lookup and joins.",
        "- `alt_parcel_id` (string): Alternate parcel identifier from assessor export.",
        "- `zoning` (string): Normalized zoning district code (uppercased).",
        "- `zoning_color` (string): Hex color token for zoning map/tool UI.",
        "- `use` (string): Parcel use category.",
        "- `primary_use` (number|string): Primary use code from assessor data.",
        "- `land_use_code` (number|string): Land use classification code.",
        "- `street_number` (string): Street number of subject parcel.",
        "- `street_name` (string): Street name of subject parcel.",
        "- `location` (string): Display address; derived from street parts when missing.",
        "- `owner_name` (string): Owner/trust label from assessor export.",
        "- `co_owner_name` (string): Optional secondary owner.",
        "- `land_class` (string): Land class designation.",
        "- `utilities` (string): Utility availability/description field.",
        "- `shape_area_sq_m` (number): Lot size in square meters (geometry area field).",
        "- `lot_area_sqft` (number): Derived lot size in square feet.",
        "- `acreage` (number): Derived lot size in acres.",
        "- `assessed_total` (number): Total assessed value.",
        "- `assessed_building` (number): Building-only assessed amount.",
        "- `assessed_outbuilding` (number): Outbuilding assessed amount.",
        "- `assessed_extra_features` (number): Extra-features assessed amount.",
        "- `assessed_improvements` (number): Combined improvements assessed amount.",
        "- `assessed_price_per_acre` (number): Derived valuation density for comps.",
        "- `source_fields` (string[]): Raw source columns used for this normalized record.",
        "",
        "## Raw Source Field Coverage",
        "",
    ]

    for key in sorted(raw_field_stats):
        count = raw_field_stats[key]["count"]
        field_types = ", ".join(sorted(raw_field_stats[key]["types"]))
        lines.append(f"- `{key}`: present in {count} features; observed types: {field_types}")

    dictionary_path.write_text("\n".join(lines))

    summary = {
        "feature_count": len(normalized_features),
        "raw_field_count": len(raw_field_stats),
        "output_files": [str(clean_geojson_path), str(dictionary_path)],
    }
    summary_path = output_dir / "validation-summary.json"
    summary_path.write_text(json.dumps(summary, indent=2))

    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
