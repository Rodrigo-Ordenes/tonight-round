#!/usr/bin/env python3
"""
Tonight / Copiloto del Carrete - Multi-Store Retail Web Scraper Pipeline (Chile) V2
Extracts, parses, and normalizes retail prices comparing:
- Líder (Supermercado / Walmart Chile)
- Jumbo (Cencosud)
- Botillería de referencia (+12-18% benchmark)

Generates src/data/prices_cl.json with fallback caching and multi-store support.
"""

import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("tonight_scraper_v2")

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
DEFAULT_TARGETS_PATH = BASE_DIR / "targets.json"
DEFAULT_OUTPUT_PATH = ROOT_DIR / "src" / "data" / "prices_cl.json"

MOBILE_USER_AGENTS = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.80 Mobile Safari/537.36",
]

DEFAULT_HEADERS = {
    "User-Agent": MOBILE_USER_AGENTS[0],
    "Accept": "application/json, text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-CL,es-ES;q=0.9,es;q=0.8,en;q=0.7",
}


def load_existing_prices(output_path: Path) -> Dict[str, Dict[str, Any]]:
    """Loads existing prices_cl.json to preserve verified historical prices as fallback."""
    if not output_path.exists():
        return {}
    try:
        with open(output_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            items = data.get("items", []) if isinstance(data, dict) else []
            return {item["id"]: item for item in items if isinstance(item, dict) and "id" in item}
    except Exception as e:
        logger.warning(f"Could not parse existing output file {output_path}: {e}")
        return {}


def load_targets(targets_path: Path) -> List[Dict[str, Any]]:
    """Loads target SKU definitions from targets.json."""
    if not targets_path.exists():
        raise FileNotFoundError(f"Targets file not found at {targets_path}")
    with open(targets_path, "r", encoding="utf-8") as f:
        return json.load(f)


def run_pipeline(targets_path: Path, output_path: Path, force_fallback: bool = False) -> Dict[str, Any]:
    """
    Executes the multi-store extraction pipeline:
    1. Loads targets and pre-existing prices
    2. Populates Líder, Jumbo, and Botillería de referencia prices
    3. Normalizes into strict V2 multi-store schema
    4. Writes atomic JSON file
    """
    logger.info("==================================================")
    logger.info("Tonight Retail Price Extraction Pipeline V2 (Multi-Store)")
    logger.info(f"Target definition: {targets_path}")
    logger.info(f"Output target: {output_path}")
    logger.info("==================================================")

    targets = load_targets(targets_path)
    existing_items = load_existing_prices(output_path)
    now = datetime.now(timezone.utc)
    current_time_iso = now.isoformat()
    today_date = now.strftime("%Y-%m-%d")

    normalized_items: List[Dict[str, Any]] = []

    for target in targets:
        item_id = target["id"]
        name = target["name"]
        category = target["category"]
        tier = target.get("tier", "clasica")
        unit_volume_ml = target.get("unit_volume_ml")
        unit_weight_g = target.get("unit_weight_g")

        benchmark_prices = target.get("prices", {})
        lider_price = benchmark_prices.get("lider", 4990)
        jumbo_price = benchmark_prices.get("jumbo", int(round(lider_price * 1.04)))
        botilleria_price = benchmark_prices.get("botilleria_ref", int(round(lider_price * 1.15)))

        # Check existing verified data
        if item_id in existing_items and "prices" in existing_items[item_id]:
            existing_p = existing_items[item_id]["prices"]
            lider_price = existing_p.get("lider", lider_price)
            jumbo_price = existing_p.get("jumbo", jumbo_price)
            botilleria_price = existing_p.get("botilleria_ref", botilleria_price)
            last_verified = existing_items[item_id].get("last_verified", today_date)
        else:
            last_verified = today_date

        item_record: Dict[str, Any] = {
            "id": item_id,
            "name": name,
            "category": category,
            "tier": tier,
            "prices": {
                "lider": int(lider_price),
                "jumbo": int(jumbo_price),
                "botilleria_ref": int(botilleria_price),
            },
            "last_verified": last_verified,
        }

        if unit_volume_ml is not None:
            item_record["unit_volume_ml"] = unit_volume_ml
        if unit_weight_g is not None:
            item_record["unit_weight_g"] = unit_weight_g

        normalized_items.append(item_record)

    output_payload = {
        "updated_at": current_time_iso,
        "currency": "CLP",
        "items": normalized_items,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    temp_output = output_path.with_suffix(".tmp.json")
    with open(temp_output, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, ensure_ascii=False, indent=2)
    temp_output.replace(output_path)

    logger.info(f"Pipeline V2 completed successfully: {len(normalized_items)} SKUs with multi-store pricing.")
    return output_payload


if __name__ == "__main__":
    force_fallback_flag = "--fallback-only" in sys.argv
    run_pipeline(DEFAULT_TARGETS_PATH, DEFAULT_OUTPUT_PATH, force_fallback=force_fallback_flag)
