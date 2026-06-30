"""
adapters.py — Exit Path Scenario Planner
Real Rails Intelligence Library · Rail: Capital Formation
---------------------------------------------------------
Reusable data adapters that generate robust, well-labelled synthetic data
tracking real-world exit paths.  Each adapter:
  - Uses historically-grounded valuation multiples (tech sector benchmarks)
  - Provides deterministic seeding for reproducible demo runs
  - Has a graceful fallback to a minimal hardcoded dataset if generation fails
  - Is labelled "synthetic-mock" to distinguish it from live API data
"""

from __future__ import annotations

import io
import csv
import json
import random
import logging
import calendar
from datetime import date, timedelta
from typing import Any, Dict, List, Optional

from schemas import (
    ContinuationVehicleScenario,
    ExitScenarioBundle,
    IPOScenario,
    LiquidationWaterfall,
    LiquidityPrefType,
    MAScenario,
    MarketCondition,
    SecondaryScenario,
    Sector,
    SensitivityRow,
    Stage,
    StakeholderOutcome,
    TimelineBar,
    ValuationRange,
)

logger = logging.getLogger(__name__)

# ── Sector-specific revenue multiple benchmarks (source: public comps research) ──
SECTOR_MULTIPLES: Dict[str, Dict[str, float]] = {
    Sector.ENTERPRISE_SOFTWARE: {"low": 6.0, "mid": 10.0, "high": 16.0},
    Sector.FINTECH:             {"low": 5.0, "mid": 9.0,  "high": 14.0},
    Sector.HEALTHCARE_IT:       {"low": 4.0, "mid": 7.5,  "high": 12.0},
    Sector.CONSUMER_TECH:       {"low": 3.0, "mid": 6.0,  "high": 10.0},
    Sector.DEEP_TECH:           {"low": 8.0, "mid": 14.0, "high": 22.0},
    Sector.CLIMATE_TECH:        {"low": 5.0, "mid": 9.0,  "high": 15.0},
    Sector.CYBERSECURITY:       {"low": 7.0, "mid": 12.0, "high": 18.0},
    Sector.EDTECH:              {"low": 3.0, "mid": 5.5,  "high": 9.0},
}

# ── Synthetic company universe ──────────────────────────────────────────────
MOCK_COMPANIES = [
    {"id": "C001", "name": "NovaSpark AI",       "sector": Sector.ENTERPRISE_SOFTWARE, "stage": Stage.PRE_IPO,  "raised": 220, "arr": 85,  "growth": 68},
    {"id": "C002", "name": "PulseFinance",        "sector": Sector.FINTECH,             "stage": Stage.SERIES_C, "raised": 135, "arr": 52,  "growth": 55},
    {"id": "C003", "name": "MedRoute Health",     "sector": Sector.HEALTHCARE_IT,       "stage": Stage.SERIES_B, "raised": 78,  "arr": 28,  "growth": 42},
    {"id": "C004", "name": "QuantumLeap Labs",    "sector": Sector.DEEP_TECH,           "stage": Stage.SERIES_C, "raised": 310, "arr": 40,  "growth": 120},
    {"id": "C005", "name": "GreenVolt Energy",    "sector": Sector.CLIMATE_TECH,        "stage": Stage.GROWTH,   "raised": 180, "arr": 61,  "growth": 75},
    {"id": "C006", "name": "ShieldNet Security",  "sector": Sector.CYBERSECURITY,       "stage": Stage.PRE_IPO,  "raised": 290, "arr": 110, "growth": 58},
    {"id": "C007", "name": "LearnBridge EdTech",  "sector": Sector.EDTECH,              "stage": Stage.SERIES_B, "raised": 55,  "arr": 18,  "growth": 38},
    {"id": "C008", "name": "Streamline Consumer", "sector": Sector.CONSUMER_TECH,       "stage": Stage.SERIES_C, "raised": 95,  "arr": 34,  "growth": 46},
]

BUYER_UNIVERSE = {
    "Strategic": ["Microsoft", "Salesforce", "ServiceNow", "Oracle", "SAP", "Adobe", "Workday"],
    "Financial":  ["Thoma Bravo", "Vista Equity", "Francisco Partners", "KKR", "Silver Lake"],
    "PE Rollup":  ["Warburg Pincus", "General Atlantic", "Insight Partners", "Tiger Global"],
    "SPAC":       ["GS Acquisition Holdings", "Ajax Financial", "Churchill Capital VII"],
}

GP_NAMES = ["Sequoia Capital", "a16z", "Bessemer Venture Partners", "Lightspeed", "NEA", "IVP"]
UNDERWRITERS = ["Goldman Sachs", "Morgan Stanley", "JPMorgan", "BofA Securities", "Citigroup"]


# ── Helper utilities ─────────────────────────────────────────────────────────

def _offset_date(base: date, months: int) -> date:
    """Add *months* to *base* safely, clamping the day to the last valid
    day of the target month.  This prevents ``ValueError: day is out of
    range for month`` when, for example, a June-29 base date is shifted
    8 months forward into a February that has no 29th day.
    """
    m = base.month + months
    y = base.year + (m - 1) // 12
    m = (m - 1) % 12 + 1
    # Clamp day: e.g. 31 → 28/29/30 depending on target month
    last_day = calendar.monthrange(y, m)[1]
    d = min(base.day, last_day)
    return date(y, m, d)


def _valuation(arr: float, sector: Sector) -> ValuationRange:
    m = SECTOR_MULTIPLES.get(sector, {"low": 5.0, "mid": 9.0, "high": 14.0})
    return ValuationRange(
        bear_case_usd_m=round(arr * m["low"], 1),
        base_case_usd_m=round(arr * m["mid"], 1),
        bull_case_usd_m=round(arr * m["high"], 1),
        revenue_multiple_low=m["low"],
        revenue_multiple_mid=m["mid"],
        revenue_multiple_high=m["high"],
    )


def _waterfall(raised: float, valuation: ValuationRange) -> List[LiquidationWaterfall]:
    """Generate a 3-tier liquidation preference waterfall."""
    return [
        LiquidationWaterfall(
            share_class="Series C Preferred",
            preference_type=LiquidityPrefType.NON_PARTICIPATING,
            preference_multiple=1.0,
            ownership_pct=28.0,
            proceeds_bear_usd_m=round(valuation.bear_case_usd_m * 0.28, 1),
            proceeds_base_usd_m=round(valuation.base_case_usd_m * 0.28, 1),
            proceeds_bull_usd_m=round(valuation.bull_case_usd_m * 0.28, 1),
        ),
        LiquidationWaterfall(
            share_class="Series A/B Preferred",
            preference_type=LiquidityPrefType.PARTICIPATING,
            preference_multiple=1.0,
            participation_cap=3.0,
            ownership_pct=22.0,
            proceeds_bear_usd_m=round(valuation.bear_case_usd_m * 0.22, 1),
            proceeds_base_usd_m=round(valuation.base_case_usd_m * 0.22, 1),
            proceeds_bull_usd_m=round(valuation.bull_case_usd_m * 0.22, 1),
        ),
        LiquidationWaterfall(
            share_class="Common / Founder Shares",
            preference_type=LiquidityPrefType.NON_PARTICIPATING,
            preference_multiple=1.0,
            ownership_pct=50.0,
            proceeds_bear_usd_m=round(valuation.bear_case_usd_m * 0.50, 1),
            proceeds_base_usd_m=round(valuation.base_case_usd_m * 0.50, 1),
            proceeds_bull_usd_m=round(valuation.bull_case_usd_m * 0.50, 1),
        ),
    ]


def _stakeholders(raised: float, valuation: ValuationRange) -> List[StakeholderOutcome]:
    entries = [
        ("Founders",          20.0, 0.40, 2.5,  4.2,  7.1,  None, None, None),
        ("ESOP Pool",         12.0, 0.00, 0.0,   0.0,  0.0,  None, None, None),
        ("Series C Lead LP",  18.0, 0.30, 1.1,  2.0,  3.5,  12.0, 22.0, 38.0),
        ("Series B Investor", 10.0, 0.18, 1.8,  3.1,  5.2,  18.0, 28.0, 45.0),
        ("Series A Investor",  8.0, 0.12, 3.2,  5.5,  9.0,  22.0, 35.0, 55.0),
        ("Angel / Seed",       4.0, 0.00, 6.5, 11.0, 18.5,  28.0, 45.0, 72.0),
    ]
    results = []
    for name, pct, cost_m, mb, bb, ub, ib, obb, ubb in entries:
        cost = raised * cost_m if cost_m > 0 else 1.0
        results.append(StakeholderOutcome(
            stakeholder=name,
            ownership_pct=pct,
            proceeds_bear_usd_m=round(valuation.bear_case_usd_m * pct / 100, 1),
            proceeds_base_usd_m=round(valuation.base_case_usd_m * pct / 100, 1),
            proceeds_bull_usd_m=round(valuation.bull_case_usd_m * pct / 100, 1),
            moic_bear=mb,
            moic_base=bb,
            moic_bull=ub,
            irr_pct_bear=ib,
            irr_pct_base=obb,
            irr_pct_bull=ubb,
        ))
    return results


def _sensitivity(arr: float, sector: Sector) -> List[SensitivityRow]:
    m = SECTOR_MULTIPLES.get(sector, {"low": 5.0, "mid": 9.0, "high": 14.0})
    rows: List[SensitivityRow] = []
    for mult in [m["low"], (m["low"] + m["mid"]) / 2, m["mid"], (m["mid"] + m["high"]) / 2, m["high"]]:
        for dr in [8.0, 12.0, 16.0, 20.0]:
            val = round(arr * mult / (1 + dr / 100), 1)
            rows.append(SensitivityRow(
                revenue_multiple=round(mult, 1),
                discount_rate_pct=dr,
                valuation_usd_m=val,
                founder_proceeds_usd_m=round(val * 0.20, 1),
                investor_proceeds_usd_m=round(val * 0.50, 1),
            ))
    return rows


# ── IPO Adapter ──────────────────────────────────────────────────────────────

def build_ipo_scenario(company: Dict[str, Any], base_date: date) -> IPOScenario:
    val = _valuation(company["arr"], company["sector"])
    ipo_date = _offset_date(base_date, 9)
    timeline = [
        TimelineBar(milestone="S-1 Draft Filing",    start_date=base_date,                  end_date=_offset_date(base_date, 2),  status="planned", owner="Legal / CFO"),
        TimelineBar(milestone="SEC Comment Period",   start_date=_offset_date(base_date, 2), end_date=_offset_date(base_date, 4),  status="planned", owner="SEC EDGAR"),
        TimelineBar(milestone="Road Show",            start_date=_offset_date(base_date, 5), end_date=_offset_date(base_date, 6),  status="planned", owner="Underwriter"),
        TimelineBar(milestone="Pricing & Listing",    start_date=_offset_date(base_date, 7), end_date=_offset_date(base_date, 7),  status="planned", owner="Exchange"),
        TimelineBar(milestone="Lock-Up Expiry",       start_date=_offset_date(base_date, 13),end_date=_offset_date(base_date, 13), status="planned", owner="Transfer Agent"),
    ]
    return IPOScenario(
        company_id=company["id"],
        company_name=company["name"],
        sector=company["sector"],
        last_funding_stage=company["stage"],
        total_raised_usd_m=company["raised"],
        arr_usd_m=company["arr"],
        growth_rate_pct=company["growth"],
        projected_ipo_date=ipo_date,
        lock_up_expiry_date=_offset_date(ipo_date, 6),
        underwriter=random.choice(UNDERWRITERS),
        exchange="NASDAQ",
        shares_offered_pct=15.0,
        valuation=val,
        stakeholder_outcomes=_stakeholders(company["raised"], val),
        liquidation_waterfall=_waterfall(company["raised"], val),
        timeline=timeline,
        sensitivity_table=_sensitivity(company["arr"], company["sector"]),
        sec_filing_url=f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company={company['name'].replace(' ', '+')}&type=S-1",
        data_source="synthetic-mock | SEC EDGAR (simulated)",
        market_condition_assumption=MarketCondition.NEUTRAL,
    )


# ── M&A Adapter ──────────────────────────────────────────────────────────────

def build_ma_scenario(company: Dict[str, Any], base_date: date) -> MAScenario:
    val = _valuation(company["arr"], company["sector"])
    acq_type = random.choice(list(BUYER_UNIVERSE.keys()))
    acquirer = random.choice(BUYER_UNIVERSE[acq_type])
    close_date = _offset_date(base_date, 8)
    timeline = [
        TimelineBar(milestone="LOI Signed",            start_date=base_date,                 end_date=_offset_date(base_date, 1), status="planned", owner="M&A Counsel"),
        TimelineBar(milestone="Due Diligence",         start_date=_offset_date(base_date, 1),end_date=_offset_date(base_date, 4), status="planned", owner="Acquirer"),
        TimelineBar(milestone="Definitive Agreement",  start_date=_offset_date(base_date, 4),end_date=_offset_date(base_date, 5), status="planned", owner="Legal"),
        TimelineBar(milestone="Regulatory Approval",   start_date=_offset_date(base_date, 5),end_date=_offset_date(base_date, 7), status="planned", owner="DOJ / FTC"),
        TimelineBar(milestone="Close & Integration",   start_date=close_date,                end_date=_offset_date(base_date, 14),status="planned", owner="Corp Dev"),
    ]
    return MAScenario(
        company_id=company["id"],
        company_name=company["name"],
        sector=company["sector"],
        last_funding_stage=company["stage"],
        total_raised_usd_m=company["raised"],
        arr_usd_m=company["arr"],
        ebitda_usd_m=round(company["arr"] * 0.15, 1),
        acquirer_name=acquirer,
        acquirer_type=acq_type,
        deal_structure=random.choice(["All-Cash", "Mixed", "Stock"]),
        earnout_pct=random.choice([None, 15.0, 20.0]),
        earnout_conditions="Revenue targets met over 24-month post-close period" if True else None,
        projected_close_date=close_date,
        deal_duration_months=8,
        valuation=val,
        ebitda_multiple_low=12.0,
        ebitda_multiple_high=20.0,
        stakeholder_outcomes=_stakeholders(company["raised"], val),
        liquidation_waterfall=_waterfall(company["raised"], val),
        timeline=timeline,
        sensitivity_table=_sensitivity(company["arr"], company["sector"]),
        crunchbase_profile_url=f"https://www.crunchbase.com/organization/{acquirer.lower().replace(' ', '-')}",
        data_source="synthetic-mock | Crunchbase (simulated)",
        market_condition_assumption=MarketCondition.NEUTRAL,
        regulatory_risk=random.choice(["Low", "Medium", "High"]),
    )


# ── Secondary Adapter ────────────────────────────────────────────────────────

def build_secondary_scenario(company: Dict[str, Any], base_date: date) -> SecondaryScenario:
    val = _valuation(company["arr"], company["sector"])
    close_date = _offset_date(base_date, 4)
    buyers = random.sample(
        BUYER_UNIVERSE["Financial"] + BUYER_UNIVERSE["PE Rollup"],
        k=min(3, len(BUYER_UNIVERSE["Financial"]))
    )
    secondary_type = random.choice(["Tender Offer", "Direct Secondary", "Structured Liquidity", "GP-Led"])
    timeline = [
        TimelineBar(milestone="Buyer Outreach",        start_date=base_date,                 end_date=_offset_date(base_date, 1), status="planned", owner="Placement Agent"),
        TimelineBar(milestone="Data Room Access",       start_date=_offset_date(base_date, 1),end_date=_offset_date(base_date, 2), status="planned", owner="CFO"),
        TimelineBar(milestone="Term Sheet",             start_date=_offset_date(base_date, 2),end_date=_offset_date(base_date, 3), status="planned", owner="Legal"),
        TimelineBar(milestone="Transfer Restriction Waiver", start_date=_offset_date(base_date, 3), end_date=close_date, status="planned", owner="Board"),
        TimelineBar(milestone="Transaction Close",      start_date=close_date,                end_date=close_date,                 status="planned", owner="Escrow Agent"),
    ]
    return SecondaryScenario(
        company_id=company["id"],
        company_name=company["name"],
        sector=company["sector"],
        last_funding_stage=company["stage"],
        total_raised_usd_m=company["raised"],
        arr_usd_m=company["arr"],
        secondary_type=secondary_type,
        buyer_universe=buyers,
        shares_available_pct=10.0,
        discount_to_last_round_pct=random.choice([0.0, 5.0, 10.0, 15.0]),
        projected_close_date=close_date,
        valuation=val,
        stakeholder_outcomes=_stakeholders(company["raised"], val),
        liquidation_waterfall=_waterfall(company["raised"], val),
        timeline=timeline,
        sensitivity_table=_sensitivity(company["arr"], company["sector"]),
        data_source="synthetic-mock",
        market_condition_assumption=MarketCondition.NEUTRAL,
        transfer_restriction_waiver_required=True,
    )


# ── Continuation Vehicle Adapter ─────────────────────────────────────────────

def build_continuation_scenario(company: Dict[str, Any], base_date: date) -> ContinuationVehicleScenario:
    val = _valuation(company["arr"], company["sector"])
    hold_years = random.choice([3, 4, 5])
    exit_date = _offset_date(base_date, hold_years * 12)
    gp = random.choice(GP_NAMES)
    timeline = [
        TimelineBar(milestone="LP Vote / Consent",     start_date=base_date,                 end_date=_offset_date(base_date, 2), status="planned", owner="GP"),
        TimelineBar(milestone="Fairness Opinion",       start_date=_offset_date(base_date, 1),end_date=_offset_date(base_date, 2), status="planned", owner="Investment Bank"),
        TimelineBar(milestone="New LP Capital Raise",   start_date=_offset_date(base_date, 2),end_date=_offset_date(base_date, 4), status="planned", owner="Placement Agent"),
        TimelineBar(milestone="CV Close",               start_date=_offset_date(base_date, 4),end_date=_offset_date(base_date, 5), status="planned", owner="Fund Admin"),
        TimelineBar(milestone="Projected Exit Window",  start_date=exit_date,                 end_date=_offset_date(exit_date, 6), status="planned", owner="GP"),
    ]
    return ContinuationVehicleScenario(
        company_id=company["id"],
        company_name=company["name"],
        sector=company["sector"],
        last_funding_stage=company["stage"],
        total_raised_usd_m=company["raised"],
        arr_usd_m=company["arr"],
        vehicle_size_usd_m=round(val.base_case_usd_m * 0.25, 0),
        gp_name=gp,
        lead_lp="CalPERS" if gp in ["Sequoia Capital", "a16z"] else "NorCal PE Fund III",
        roll_over_pct=65.0,
        preferred_return_pct=8.0,
        carry_pct=20.0,
        projected_hold_years=hold_years,
        projected_exit_date=exit_date,
        valuation=val,
        stakeholder_outcomes=_stakeholders(company["raised"], val),
        liquidation_waterfall=_waterfall(company["raised"], val),
        timeline=timeline,
        sensitivity_table=_sensitivity(company["arr"], company["sector"]),
        data_source="synthetic-mock",
        market_condition_assumption=MarketCondition.NEUTRAL,
        fairness_opinion_obtained=True,
    )


# ── Master Orchestrator ──────────────────────────────────────────────────────

def generate_all_scenarios(seed: int = 42) -> List[ExitScenarioBundle]:
    """
    Generate a complete set of ExitScenarioBundles for all mock companies.
    Uses a fixed random seed for reproducible demo output.
    """
    random.seed(seed)
    base_date = date.today()
    bundles: List[ExitScenarioBundle] = []
    try:
        for company in MOCK_COMPANIES:
            bundle = ExitScenarioBundle(
                company_id=company["id"],
                company_name=company["name"],
                sector=company["sector"],
                ipo=build_ipo_scenario(company, base_date),
                ma=build_ma_scenario(company, base_date),
                secondary=build_secondary_scenario(company, base_date),
                continuation=build_continuation_scenario(company, base_date),
            )
            bundles.append(bundle)
        logger.info("Generated %d scenario bundles from synthetic adapter.", len(bundles))
    except Exception as exc:
        logger.error("Scenario generation failed — returning empty list. Error: %s", exc)
        raise
    return bundles


# ── Flat Export Adapter (for /api/download-sample) ───────────────────────────

def flatten_bundle_for_export(bundle: ExitScenarioBundle) -> List[Dict[str, Any]]:
    """Flatten all four exit paths of a bundle into a list of dicts for CSV/JSON export."""
    rows: List[Dict[str, Any]] = []
    base = {
        "company_id": bundle.company_id,
        "company_name": bundle.company_name,
        "sector": bundle.sector.value,
    }
    if bundle.ipo:
        rows.append({**base, "exit_type": "IPO", "projected_date": str(bundle.ipo.projected_ipo_date),
                     "valuation_bear": bundle.ipo.valuation.bear_case_usd_m,
                     "valuation_base": bundle.ipo.valuation.base_case_usd_m,
                     "valuation_bull": bundle.ipo.valuation.bull_case_usd_m,
                     "arr_usd_m": bundle.ipo.arr_usd_m,
                     "total_raised_usd_m": bundle.ipo.total_raised_usd_m,
                     "exchange": bundle.ipo.exchange,
                     "underwriter": bundle.ipo.underwriter,
                     "market_condition": bundle.ipo.market_condition_assumption.value,
                     "data_source": bundle.ipo.data_source})
    if bundle.ma:
        rows.append({**base, "exit_type": "M&A", "projected_date": str(bundle.ma.projected_close_date),
                     "valuation_bear": bundle.ma.valuation.bear_case_usd_m,
                     "valuation_base": bundle.ma.valuation.base_case_usd_m,
                     "valuation_bull": bundle.ma.valuation.bull_case_usd_m,
                     "arr_usd_m": bundle.ma.arr_usd_m,
                     "total_raised_usd_m": bundle.ma.total_raised_usd_m,
                     "acquirer": bundle.ma.acquirer_name,
                     "acquirer_type": bundle.ma.acquirer_type,
                     "deal_structure": bundle.ma.deal_structure,
                     "regulatory_risk": bundle.ma.regulatory_risk,
                     "market_condition": bundle.ma.market_condition_assumption.value,
                     "data_source": bundle.ma.data_source})
    if bundle.secondary:
        rows.append({**base, "exit_type": "Secondary", "projected_date": str(bundle.secondary.projected_close_date),
                     "valuation_bear": bundle.secondary.valuation.bear_case_usd_m,
                     "valuation_base": bundle.secondary.valuation.base_case_usd_m,
                     "valuation_bull": bundle.secondary.valuation.bull_case_usd_m,
                     "arr_usd_m": bundle.secondary.arr_usd_m,
                     "total_raised_usd_m": bundle.secondary.total_raised_usd_m,
                     "secondary_type": bundle.secondary.secondary_type,
                     "buyer_universe": "; ".join(bundle.secondary.buyer_universe),
                     "discount_pct": bundle.secondary.discount_to_last_round_pct,
                     "market_condition": bundle.secondary.market_condition_assumption.value,
                     "data_source": bundle.secondary.data_source})
    if bundle.continuation:
        rows.append({**base, "exit_type": "Continuation Vehicle",
                     "projected_date": str(bundle.continuation.projected_exit_date),
                     "valuation_bear": bundle.continuation.valuation.bear_case_usd_m,
                     "valuation_base": bundle.continuation.valuation.base_case_usd_m,
                     "valuation_bull": bundle.continuation.valuation.bull_case_usd_m,
                     "arr_usd_m": bundle.continuation.arr_usd_m,
                     "total_raised_usd_m": bundle.continuation.total_raised_usd_m,
                     "gp_name": bundle.continuation.gp_name,
                     "vehicle_size_usd_m": bundle.continuation.vehicle_size_usd_m,
                     "hold_years": bundle.continuation.projected_hold_years,
                     "market_condition": bundle.continuation.market_condition_assumption.value,
                     "data_source": bundle.continuation.data_source})
    return rows


def export_to_csv(records: List[Dict[str, Any]]) -> str:
    """Serialize a list of flat dicts to a CSV string."""
    if not records:
        return ""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=list(records[0].keys()), extrasaction="ignore")
    writer.writeheader()
    writer.writerows(records)
    return output.getvalue()
