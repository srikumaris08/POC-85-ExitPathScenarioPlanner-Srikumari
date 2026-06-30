"""
schemas.py — Exit Path Scenario Planner
Real Rails Intelligence Library · Rail: Capital Formation
---------------------------------------------------------
Pydantic v2 data schemas for four exit archetypes:
  1. IPO Parameters
  2. M&A Paths
  3. Secondary Distributions
  4. Continuation Vehicles
"""

from __future__ import annotations
from datetime import date
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


# ── Enumerations ────────────────────────────────────────────────────────────

class ExitType(str, Enum):
    IPO = "IPO"
    MA = "M&A"
    SECONDARY = "Secondary"
    CONTINUATION = "Continuation Vehicle"

class Sector(str, Enum):
    ENTERPRISE_SOFTWARE = "Enterprise Software"
    FINTECH = "FinTech"
    HEALTHCARE_IT = "Healthcare IT"
    CONSUMER_TECH = "Consumer Tech"
    DEEP_TECH = "Deep Tech"
    CLIMATE_TECH = "Climate Tech"
    CYBERSECURITY = "Cybersecurity"
    EDTECH = "EdTech"

class Stage(str, Enum):
    SEED = "Seed"
    SERIES_A = "Series A"
    SERIES_B = "Series B"
    SERIES_C = "Series C"
    GROWTH = "Growth"
    PRE_IPO = "Pre-IPO"

class LiquidityPrefType(str, Enum):
    PARTICIPATING = "Participating"
    NON_PARTICIPATING = "Non-Participating"
    CAPPED = "Capped Participating"

class MarketCondition(str, Enum):
    BULL = "Bull Market"
    NEUTRAL = "Neutral Market"
    BEAR = "Bear Market"


# ── Building Blocks ──────────────────────────────────────────────────────────

class ValuationRange(BaseModel):
    bear_case_usd_m: float = Field(..., ge=0)
    base_case_usd_m: float = Field(..., ge=0)
    bull_case_usd_m: float = Field(..., ge=0)
    revenue_multiple_low: float = Field(..., ge=0)
    revenue_multiple_mid: float = Field(..., ge=0)
    revenue_multiple_high: float = Field(..., ge=0)


class LiquidationWaterfall(BaseModel):
    share_class: str
    preference_type: LiquidityPrefType
    preference_multiple: float = Field(default=1.0, ge=0)
    participation_cap: Optional[float] = None
    ownership_pct: float = Field(..., ge=0, le=100)
    proceeds_bear_usd_m: float = Field(..., ge=0)
    proceeds_base_usd_m: float = Field(..., ge=0)
    proceeds_bull_usd_m: float = Field(..., ge=0)


class StakeholderOutcome(BaseModel):
    stakeholder: str
    ownership_pct: float = Field(..., ge=0, le=100)
    proceeds_bear_usd_m: float = Field(..., ge=0)
    proceeds_base_usd_m: float = Field(..., ge=0)
    proceeds_bull_usd_m: float = Field(..., ge=0)
    moic_bear: float = Field(..., ge=0)
    moic_base: float = Field(..., ge=0)
    moic_bull: float = Field(..., ge=0)
    irr_pct_bear: Optional[float] = None
    irr_pct_base: Optional[float] = None
    irr_pct_bull: Optional[float] = None


class TimelineBar(BaseModel):
    milestone: str
    start_date: date
    end_date: date
    status: str = "planned"
    owner: Optional[str] = None
    notes: Optional[str] = None


class SensitivityRow(BaseModel):
    revenue_multiple: float
    discount_rate_pct: float
    valuation_usd_m: float
    founder_proceeds_usd_m: float
    investor_proceeds_usd_m: float


# ── Exit Path Schemas ────────────────────────────────────────────────────────

class IPOScenario(BaseModel):
    company_id: str
    company_name: str
    sector: Sector
    last_funding_stage: Stage
    total_raised_usd_m: float = Field(..., ge=0)
    arr_usd_m: float = Field(..., ge=0)
    growth_rate_pct: float
    projected_ipo_date: date
    lock_up_expiry_date: date
    underwriter: Optional[str] = None
    exchange: str = "NASDAQ"
    shares_offered_pct: float = Field(..., ge=0, le=100)
    valuation: ValuationRange
    stakeholder_outcomes: List[StakeholderOutcome]
    liquidation_waterfall: List[LiquidationWaterfall]
    timeline: List[TimelineBar]
    sensitivity_table: List[SensitivityRow]
    sec_filing_url: Optional[str] = None
    data_source: str = "synthetic-mock"
    market_condition_assumption: MarketCondition = MarketCondition.NEUTRAL


class MAScenario(BaseModel):
    company_id: str
    company_name: str
    sector: Sector
    last_funding_stage: Stage
    total_raised_usd_m: float = Field(..., ge=0)
    arr_usd_m: float = Field(..., ge=0)
    ebitda_usd_m: Optional[float] = None
    acquirer_name: str
    acquirer_type: str
    deal_structure: str
    earnout_pct: Optional[float] = None
    earnout_conditions: Optional[str] = None
    projected_close_date: date
    deal_duration_months: int = Field(..., ge=1)
    valuation: ValuationRange
    ebitda_multiple_low: Optional[float] = None
    ebitda_multiple_high: Optional[float] = None
    stakeholder_outcomes: List[StakeholderOutcome]
    liquidation_waterfall: List[LiquidationWaterfall]
    timeline: List[TimelineBar]
    sensitivity_table: List[SensitivityRow]
    crunchbase_profile_url: Optional[str] = None
    data_source: str = "synthetic-mock"
    market_condition_assumption: MarketCondition = MarketCondition.NEUTRAL
    regulatory_risk: str = "Low"


class SecondaryScenario(BaseModel):
    company_id: str
    company_name: str
    sector: Sector
    last_funding_stage: Stage
    total_raised_usd_m: float = Field(..., ge=0)
    arr_usd_m: float = Field(..., ge=0)
    secondary_type: str
    buyer_universe: List[str]
    shares_available_pct: float = Field(..., ge=0, le=100)
    discount_to_last_round_pct: float = 0.0
    projected_close_date: date
    valuation: ValuationRange
    stakeholder_outcomes: List[StakeholderOutcome]
    liquidation_waterfall: List[LiquidationWaterfall]
    timeline: List[TimelineBar]
    sensitivity_table: List[SensitivityRow]
    data_source: str = "synthetic-mock"
    market_condition_assumption: MarketCondition = MarketCondition.NEUTRAL
    transfer_restriction_waiver_required: bool = True


class ContinuationVehicleScenario(BaseModel):
    company_id: str
    company_name: str
    sector: Sector
    last_funding_stage: Stage
    total_raised_usd_m: float = Field(..., ge=0)
    arr_usd_m: float = Field(..., ge=0)
    vehicle_size_usd_m: float = Field(..., ge=0)
    gp_name: str
    lead_lp: Optional[str] = None
    roll_over_pct: float = Field(..., ge=0, le=100)
    preferred_return_pct: float = 8.0
    carry_pct: float = Field(default=20.0, ge=0, le=100)
    projected_hold_years: int = Field(..., ge=1)
    projected_exit_date: date
    valuation: ValuationRange
    stakeholder_outcomes: List[StakeholderOutcome]
    liquidation_waterfall: List[LiquidationWaterfall]
    timeline: List[TimelineBar]
    sensitivity_table: List[SensitivityRow]
    data_source: str = "synthetic-mock"
    market_condition_assumption: MarketCondition = MarketCondition.NEUTRAL
    fairness_opinion_obtained: bool = False


# ── Response Envelopes ───────────────────────────────────────────────────────

class ExitScenarioBundle(BaseModel):
    company_id: str
    company_name: str
    sector: Sector
    ipo: Optional[IPOScenario] = None
    ma: Optional[MAScenario] = None
    secondary: Optional[SecondaryScenario] = None
    continuation: Optional[ContinuationVehicleScenario] = None


class ScenariosResponse(BaseModel):
    count: int
    data_source: str = "synthetic-mock"
    disclaimer: str = (
        "All figures are illustrative synthetic mock data for demonstration purposes only. "
        "They do not represent real companies, transactions, or investment advice."
    )
    scenarios: List[ExitScenarioBundle]


class DownloadPayload(BaseModel):
    format: str = "json"
    record_count: int
    records: List[Dict[str, Any]]


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "Exit Path Scenario Planner — FastAPI Backend"
    version: str = "1.0.0"
    data_source: str = "synthetic-mock"
