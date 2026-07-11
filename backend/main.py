"""
main.py — Exit Path Scenario Planner · FastAPI Backend
Real Rails Intelligence Library · Rail: Capital Formation
----------------------------------------------------------
Endpoints:
  GET  /                         → Health check
  GET  /api/health               → Structured health response
  GET  /api/scenarios            → All exit scenario bundles (JSON)
  GET  /api/scenarios/{id}       → Single company bundle
  GET  /api/scenarios/{id}/{type}→ Specific exit type for a company
  GET  /api/sectors              → Available sectors list
  GET  /api/companies            → Raw company profiles from company_data.json
  GET  /api/map-pins             → Geospatial map pins (lat, lng, exit type) from company_data.json
  GET  /api/download-sample      → Download JSON or CSV sample data
  GET  /api/sensitivity/{id}     → Sensitivity table for a company
  GET  /api/waterfall/{id}       → Liquidation waterfall for a company
"""

from __future__ import annotations

import json
import logging
import os
import traceback
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd

from dotenv import load_dotenv

# Load .env from the backend directory (or any parent)
load_dotenv()

# ── Environment config ────────────────────────────────────────────────────────
_HOST: str = os.getenv("HOST", "0.0.0.0")
_PORT: int = int(os.getenv("PORT", "8000"))
# ALLOWED_ORIGINS accepts a comma-separated list, e.g. "http://localhost:3000,https://prod.example.com"
_ALLOWED_ORIGINS: List[str] = [
    o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()
]

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse

from adapters import (
    export_to_csv,
    flatten_bundle_for_export,
    generate_all_scenarios,
)

# ── Data File ─────────────────────────────────────────────────────────────────
# Path is resolved relative to this file so it works from any working directory.
_DATA_FILE = Path(__file__).parent / "company_data.json"


def load_company_data() -> pd.DataFrame:
    """
    Read company_data.json and return a normalised DataFrame.
    Each row represents one company.  The nested ``liq_pref_stack`` and
    ``share_pool`` columns are kept as Python objects (list / dict) so
    adapters can consume them directly.

    Raises FileNotFoundError if the data file is missing.
    """
    if not _DATA_FILE.exists():
        raise FileNotFoundError(
            f"company_data.json not found at {_DATA_FILE}. "
            "Ensure the file is present in the backend directory."
        )
    with _DATA_FILE.open(encoding="utf-8") as fh:
        raw = json.load(fh)

    # Build flat records manually so nested objects are never exploded.
    # json_normalize would flatten share_pool / liq_pref_stack into dotted
    # columns (share_pool.founders_pct, etc.) and lose the top-level key,
    # causing a KeyError when adapters later do company["share_pool"].
    records = []
    for company in raw["companies"]:
        record: Dict[str, Any] = {}
        for key, value in company.items():
            # Skip internal audit/comment fields.
            if key.startswith("_"):
                continue
            record[key] = value
        records.append(record)

    df = pd.DataFrame(records)
    logger.info("Loaded %d companies from %s", len(df), _DATA_FILE.name)
    return df


from schemas import (
    DownloadPayload,
    ExitScenarioBundle,
    ExitType,
    HealthResponse,
    Sector,
    ScenariosResponse,
)

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("exit_planner")


# ── App Bootstrap ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="Exit Path Scenario Planner API",
    description=(
        "Real Rails Intelligence Library — Capital Formation Rail.\n\n"
        "Provides structured exit scenario data across IPO, M&A, Secondary, and "
        "Continuation Vehicle paths. All data is synthetic mock data labelled accordingly."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,   # configured via ALLOWED_ORIGINS env var
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)


# ── Cached Data Layer ─────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _get_company_df() -> pd.DataFrame:
    """Load and cache the company DataFrame from company_data.json."""
    try:
        df = load_company_data()
        logger.info("Company DataFrame cached: %d rows.", len(df))
        return df
    except Exception as exc:
        logger.error("Failed to load company_data.json: %s\n%s", exc, traceback.format_exc())
        return pd.DataFrame()


@lru_cache(maxsize=1)
def _get_scenarios() -> List[ExitScenarioBundle]:
    """
    Build and cache all scenario bundles from the company DataFrame.
    Passes DataFrame records to generate_all_scenarios() so the adapter
    reads from company_data.json rather than its own hardcoded list.
    Falls back to an empty list and logs the error — server stays alive.
    """
    try:
        df = _get_company_df()
        if df.empty:
            logger.warning("Company DataFrame is empty; returning no scenarios.")
            return []
        # Convert each DataFrame row to a plain dict for the adapter layer.
        companies = df.to_dict(orient="records")
        bundles = generate_all_scenarios(seed=42, companies=companies)
        logger.info("Scenario cache warm: %d bundles loaded.", len(bundles))
        return bundles
    except Exception as exc:
        logger.error("Failed to generate scenarios: %s\n%s", exc, traceback.format_exc())
        return []


def _get_bundle(company_id: str) -> ExitScenarioBundle:
    """Retrieve a single bundle by company_id or raise 404."""
    scenarios = _get_scenarios()
    match = next((b for b in scenarios if b.company_id == company_id), None)
    if not match:
        valid = [b.company_id for b in scenarios]
        raise HTTPException(
            status_code=404,
            detail=f"Company '{company_id}' not found. Valid IDs: {valid}",
        )
    return match


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Meta"], summary="Root ping")
def root() -> Dict[str, str]:
    return {"message": "Exit Path Scenario Planner API — visit /docs for Swagger UI"}


@app.get("/api/health", response_model=HealthResponse, tags=["Meta"], summary="Structured health check")
def health() -> HealthResponse:
    return HealthResponse()


@app.get(
    "/api/scenarios",
    response_model=ScenariosResponse,
    tags=["Scenarios"],
    summary="Fetch all exit scenario bundles",
)
def get_all_scenarios(
    sector: Optional[str] = Query(None, description="Filter by sector (e.g. 'FinTech')"),
    exit_type: Optional[str] = Query(None, description="Filter bundles that have a specific exit type: IPO | M&A | Secondary | Continuation Vehicle"),
    limit: int = Query(default=20, ge=1, le=100, description="Max number of bundles to return"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
) -> ScenariosResponse:
    scenarios = _get_scenarios()

    # Sector filter
    if sector:
        sector_lower = sector.lower()
        scenarios = [s for s in scenarios if s.sector.value.lower() == sector_lower]

    # Exit type filter
    if exit_type:
        et_lower = exit_type.lower()
        def _has_type(b: ExitScenarioBundle) -> bool:
            return (
                (et_lower in ("ipo",) and b.ipo is not None) or
                (et_lower in ("m&a", "ma") and b.ma is not None) or
                (et_lower in ("secondary",) and b.secondary is not None) or
                (et_lower in ("continuation vehicle", "continuation") and b.continuation is not None)
            )
        scenarios = [s for s in scenarios if _has_type(s)]

    paginated = scenarios[offset: offset + limit]
    return ScenariosResponse(count=len(paginated), scenarios=paginated)


@app.get(
    "/api/scenarios/{company_id}",
    response_model=ExitScenarioBundle,
    tags=["Scenarios"],
    summary="Fetch a single company's full exit bundle",
)
def get_scenario_by_id(company_id: str) -> ExitScenarioBundle:
    return _get_bundle(company_id)


@app.get(
    "/api/scenarios/{company_id}/{exit_type}",
    tags=["Scenarios"],
    summary="Fetch one exit path type for a company",
)
def get_specific_exit(company_id: str, exit_type: str) -> Any:
    bundle = _get_bundle(company_id)
    et = exit_type.lower()
    if et == "ipo":
        if not bundle.ipo:
            raise HTTPException(status_code=404, detail="IPO scenario not available.")
        return bundle.ipo
    elif et in ("m&a", "ma"):
        if not bundle.ma:
            raise HTTPException(status_code=404, detail="M&A scenario not available.")
        return bundle.ma
    elif et == "secondary":
        if not bundle.secondary:
            raise HTTPException(status_code=404, detail="Secondary scenario not available.")
        return bundle.secondary
    elif et in ("continuation", "continuation-vehicle"):
        if not bundle.continuation:
            raise HTTPException(status_code=404, detail="Continuation Vehicle scenario not available.")
        return bundle.continuation
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown exit_type '{exit_type}'. Valid: ipo | ma | secondary | continuation",
        )


@app.get(
    "/api/sectors",
    tags=["Meta"],
    summary="List all available sectors",
)
def get_sectors() -> Dict[str, List[str]]:
    return {"sectors": [s.value for s in Sector]}


@app.get(
    "/api/companies",
    tags=["Meta"],
    summary="Raw company profiles loaded from company_data.json (auditable data source)",
)
def get_companies(
    sector: Optional[str] = Query(None, description="Filter by sector name"),
) -> Dict[str, Any]:
    """Return the raw company DataFrame records so reviewers can verify the
    source numbers independently without running the scenario builder."""
    df = _get_company_df()
    if sector:
        df = df[df["sector"].str.lower() == sector.lower()]
    records = df.to_dict(orient="records")
    return {
        "count": len(records),
        "source_file": _DATA_FILE.name,
        "companies": records,
    }


@app.get(
    "/api/map-pins",
    tags=["Meta"],
    summary="Geospatial map pins loaded from company_data.json (lat, lng, exit type, financials)",
)
def get_map_pins(
    sector: Optional[str] = Query(None, description="Filter by sector name"),
) -> Dict[str, Any]:
    """
    Return a lightweight list of map pin objects derived from the company
    DataFrame.  Each pin carries the coordinates, sector, stage, and primary
    exit type stored in company_data.json — no hard-coding in the frontend.
    The frontend GeospatialExitMap component fetches this endpoint inside a
    useEffect() hook and binds the result directly to component state.
    """
    df = _get_company_df()
    if sector:
        df = df[df["sector"].str.lower() == sector.lower()]

    # Only emit companies that have coordinate data embedded in the JSON.
    required_cols = {"id", "name", "sector", "stage", "lat", "lng",
                     "primary_exit_type", "arr", "raised"}
    missing = required_cols - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=500,
            detail=(
                f"company_data.json is missing required map-pin columns: {missing}. "
                "Ensure lat, lng, city, and primary_exit_type are present for every company."
            ),
        )

    # Build valuation (base-case) from the scenario cache so the popups show
    # consistent numbers to the rest of the dashboard.
    scenario_map: Dict[str, float] = {}
    for bundle in _get_scenarios():
        if bundle.ipo:
            scenario_map[bundle.company_id] = bundle.ipo.valuation.base_case_usd_m

    pins = []
    for _, row in df.iterrows():
        cid = str(row["id"])
        city_val = str(row["city"]) if "city" in df.columns else ""
        pins.append({
            "id":             cid,
            "name":           str(row["name"]),
            "sector":         str(row["sector"]),
            "stage":          str(row["stage"]),
            "city":           city_val,
            "lat":            float(row["lat"]),
            "lng":            float(row["lng"]),
            "exitType":       str(row["primary_exit_type"]),
            "arrUsdM":        float(row["arr"]),
            "raisedUsdM":     float(row["raised"]),
            "valuationUsdM":  scenario_map.get(cid, 0.0),
        })


    return {
        "count":       len(pins),
        "source_file": _DATA_FILE.name,
        "pins":        pins,
    }


@app.get(
    "/api/sensitivity/{company_id}",
    tags=["Analytics"],
    summary="Sensitivity table (revenue multiple × discount rate) for a company",
)
def get_sensitivity(company_id: str, exit_type: str = Query(default="ipo")) -> Any:
    bundle = _get_bundle(company_id)
    et = exit_type.lower()
    scenario = None
    if et == "ipo" and bundle.ipo:
        scenario = bundle.ipo
    elif et in ("m&a", "ma") and bundle.ma:
        scenario = bundle.ma
    elif et == "secondary" and bundle.secondary:
        scenario = bundle.secondary
    elif et in ("continuation", "continuation-vehicle") and bundle.continuation:
        scenario = bundle.continuation

    if scenario is None:
        raise HTTPException(status_code=404, detail=f"Exit type '{exit_type}' not found for {company_id}.")

    return {
        "company_id": company_id,
        "exit_type": exit_type,
        "sensitivity_table": [row.model_dump() for row in scenario.sensitivity_table],
    }


@app.get(
    "/api/waterfall/{company_id}",
    tags=["Analytics"],
    summary="Liquidation preference waterfall for a company",
)
def get_waterfall(company_id: str, exit_type: str = Query(default="ipo")) -> Any:
    bundle = _get_bundle(company_id)
    et = exit_type.lower()
    scenario = None
    if et == "ipo" and bundle.ipo:
        scenario = bundle.ipo
    elif et in ("m&a", "ma") and bundle.ma:
        scenario = bundle.ma
    elif et == "secondary" and bundle.secondary:
        scenario = bundle.secondary
    elif et in ("continuation", "continuation-vehicle") and bundle.continuation:
        scenario = bundle.continuation

    if scenario is None:
        raise HTTPException(status_code=404, detail=f"Exit type '{exit_type}' not found for {company_id}.")

    return {
        "company_id": company_id,
        "exit_type": exit_type,
        "waterfall": [row.model_dump() for row in scenario.liquidation_waterfall],
        "stakeholder_outcomes": [row.model_dump() for row in scenario.stakeholder_outcomes],
    }


@app.get(
    "/api/download-sample",
    tags=["Export"],
    summary="Download sample data as JSON or CSV",
)
def download_sample(
    fmt: str = Query(default="json", alias="format", description="Response format: json | csv"),
    company_id: Optional[str] = Query(None, description="Filter to a single company (optional)"),
) -> Response:
    scenarios = _get_scenarios()

    if company_id:
        scenarios = [b for b in scenarios if b.company_id == company_id]
        if not scenarios:
            raise HTTPException(status_code=404, detail=f"Company '{company_id}' not found.")

    # Flatten all bundles into row-level export records
    records: List[Dict[str, Any]] = []
    for bundle in scenarios:
        records.extend(flatten_bundle_for_export(bundle))

    if fmt.lower() == "csv":
        csv_content = export_to_csv(records)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=exit_path_sample_data.csv"},
        )
    else:
        payload = DownloadPayload(
            format="json",
            record_count=len(records),
            records=records,
        )
        json_content = payload.model_dump_json(indent=2)
        return Response(
            content=json_content,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=exit_path_sample_data.json"},
        )


# ── Dev Server Entry Point ────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=_HOST, port=_PORT, reload=True, log_level="info")
