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

# Nantucket assessor parcel GeoJSON uses Esri `Shape_Area` in **US square feet**
# (foot-based CRS), not square meters. Treating it as m² inflates `lot_area_sqft`
# by ~10.76× (e.g. ~14.4k shown as ~144k).
SHAPE_AREA_SOURCE_UNIT = "sqft"

# Colors from Use Chart - September 2024 - Sheet2.csv (Zones, Color).
ZONING_COLORS = {
    "AH": "#FFFF73",
    "ALC": "#EFB6FC",
    "CDT": "#A80000",
    "CI": "#BE6666",
    "CMI": "#868885",
    "CN": "#88C27F",
    "CTEC": "#FCC2B3",
    "LC": "#898945",
    "LUG-1": "#C19ED7",
    "LUG-2": "#FBFCC5",
    "LUG-3": "#E8CF70",
    "MMD": "#B4D79E",
    "OIH": "#4DE603",
    "R-1": "#FFBEBE",
    "R-5": "#FDBF6F",
    "R-5L": "#FDBF6F",
    "R-10": "#CDF57A",
    "R-10L": "#D7D79E",
    "R-20": "#F5A27A",
    "R-40": "#448970",
    "RC": "#73FFDE",
    "RC-2": "#FFAA01",
    "ROH": "#BED2FF",
    "SOH": "#BED2FF",
    "SR-1": "#FFBEBE",
    "SR-10": "#CDF57A",
    "SR-20": "#F5A27A",
    "VN": "#CC6699",
    "VR": "#66CDAB",
    "VTEC": "#D79E9D",
    # Aliases seen in assessor exports without hyphens.
    "LUG1": "#C19ED7",
    "LUG2": "#FBFCC5",
    "LUG3": "#E8CF70",
    "R1": "#FFBEBE",
    "R5": "#FDBF6F",
    "R5L": "#FDBF6F",
    "R10": "#CDF57A",
    "R10L": "#D7D79E",
    "R20": "#F5A27A",
    "R40": "#448970",
    "RC2": "#FFAA01",
    "RC2M": "#FFAA01",
    "SR1": "#FFBEBE",
    "SR10": "#CDF57A",
    "SR20": "#F5A27A",
}
DEFAULT_ZONING_COLOR = "#DDDDDD"


def apply_parcel_zoning_overrides(features: list, output_dir: Path) -> None:
    """Apply hand-maintained zoning fixes keyed by `parcel_id` (and optional `location` guard)."""
    path = output_dir / "parcel-zoning-overrides.json"
    if not path.is_file():
        return
    data = json.loads(path.read_text(encoding="utf-8"))
    entries = data.get("overrides") or []
    for entry in entries:
        parcel_id = str(entry.get("parcel_id", "")).strip()
        want = entry.get("zoning")
        guard_loc = (entry.get("location") or "").strip().upper()
        if not parcel_id or not isinstance(want, str) or not want.strip():
            continue
        z = want.strip().upper()
        for feature in features:
            props = feature.get("properties") or {}
            if str(props.get("parcel_id", "")).strip() != parcel_id:
                continue
            if guard_loc and str(props.get("location", "")).strip().upper() != guard_loc:
                continue
            props["zoning"] = z
            props["zoning_color"] = ZONING_COLORS.get(z, DEFAULT_ZONING_COLOR)
            break


# Raw `Shape_Area` is read into internal key `shape_area_sq_m` before unit conversion below.
FIELD_PRIORITY = {
    "parcel_id": ["MAP_PAR_ID", "Parcel_Id", "MA_MAP_PAR_ID"],
    "alt_parcel_id": ["Alt_Parcel_ID"],
    "internal_id": ["Internal_ID"],
    "zoning": ["Land_Class", "Zoning"],
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


def parse_map_parcel(parcel_id: str | None) -> tuple[str | None, str | None]:
    if not parcel_id or not isinstance(parcel_id, str):
        return None, None

    normalized = " ".join(parcel_id.strip().split())
    if not normalized:
        return None, None

    if " " in normalized:
        tax_map, parcel = normalized.rsplit(" ", 1)
        return tax_map or None, parcel or None

    return normalized, None


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

    tax_map, parcel = parse_map_parcel(normalized.get("parcel_id"))
    normalized["tax_map"] = tax_map
    normalized["parcel"] = parcel

    shape_raw = to_number(normalized.get("shape_area_sq_m"))
    if shape_raw is None:
        normalized["shape_area_sq_m"] = None
        normalized["acreage"] = None
        normalized["lot_area_sqft"] = None
    elif SHAPE_AREA_SOURCE_UNIT == "sqft":
        sqft = shape_raw
        acreage = sqft / 43560.0
        sq_m = sqft / SQM_TO_SQFT
        normalized["lot_area_sqft"] = round(sqft, 2)
        normalized["acreage"] = round(acreage, 4)
        normalized["shape_area_sq_m"] = round(sq_m, 2)
    else:
        shape_area_sqm = shape_raw
        acreage = shape_area_sqm * SQM_TO_ACRES
        sqft = shape_area_sqm * SQM_TO_SQFT
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

    apply_parcel_zoning_overrides(normalized_features, output_dir)

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
        "- `internal_id` (number|string): Assessor internal account identifier (`Internal_ID`).",
        "- `tax_map` (string): Parsed map component from `MAP_PAR_ID` (example: `42.3.4`).",
        "- `parcel` (string): Parsed parcel component from `MAP_PAR_ID` (example: `152`).",
        "- `zoning` (string): Normalized zoning district code (uppercased), sourced from `Land_Class` first then `Zoning`.",
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
        "- `shape_area_sq_m` (number): Lot area in **true** square meters (from assessor `Shape_Area` in sq ft ÷ sqft/m²).",
        "- `lot_area_sqft` (number): Lot size in square feet (same as assessor `Shape_Area` in this export).",
        "- `acreage` (number): Lot size in acres (`lot_area_sqft` ÷ 43,560).",
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
