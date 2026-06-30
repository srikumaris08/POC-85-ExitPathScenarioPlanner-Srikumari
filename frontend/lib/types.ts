/**
 * types.ts — Shared TypeScript types mirroring backend Pydantic schemas
 * Real Rails Intelligence Library · Exit Path Scenario Planner
 */

export type ExitType = "IPO" | "M&A" | "Secondary" | "Continuation Vehicle";

export type Sector =
  | "Enterprise Software"
  | "FinTech"
  | "Healthcare IT"
  | "Consumer Tech"
  | "Deep Tech"
  | "Climate Tech"
  | "Cybersecurity"
  | "EdTech";

export type Stage =
  | "Seed"
  | "Series A"
  | "Series B"
  | "Series C"
  | "Growth"
  | "Pre-IPO";

export type MarketCondition = "Bull Market" | "Neutral Market" | "Bear Market";

export interface ValuationRange {
  bear_case_usd_m: number;
  base_case_usd_m: number;
  bull_case_usd_m: number;
  revenue_multiple_low: number;
  revenue_multiple_mid: number;
  revenue_multiple_high: number;
}

export interface LiquidationWaterfall {
  share_class: string;
  preference_type: string;
  preference_multiple: number;
  participation_cap: number | null;
  ownership_pct: number;
  proceeds_bear_usd_m: number;
  proceeds_base_usd_m: number;
  proceeds_bull_usd_m: number;
}

export interface StakeholderOutcome {
  stakeholder: string;
  ownership_pct: number;
  proceeds_bear_usd_m: number;
  proceeds_base_usd_m: number;
  proceeds_bull_usd_m: number;
  moic_bear: number;
  moic_base: number;
  moic_bull: number;
  irr_pct_bear: number | null;
  irr_pct_base: number | null;
  irr_pct_bull: number | null;
}

export interface TimelineBar {
  milestone: string;
  start_date: string;
  end_date: string;
  status: string;
  owner: string | null;
  notes: string | null;
}

export interface SensitivityRow {
  revenue_multiple: number;
  discount_rate_pct: number;
  valuation_usd_m: number;
  founder_proceeds_usd_m: number;
  investor_proceeds_usd_m: number;
}

export interface IPOScenario {
  company_id: string;
  company_name: string;
  sector: Sector;
  last_funding_stage: Stage;
  total_raised_usd_m: number;
  arr_usd_m: number;
  growth_rate_pct: number;
  projected_ipo_date: string;
  lock_up_expiry_date: string;
  underwriter: string | null;
  exchange: string;
  shares_offered_pct: number;
  valuation: ValuationRange;
  stakeholder_outcomes: StakeholderOutcome[];
  liquidation_waterfall: LiquidationWaterfall[];
  timeline: TimelineBar[];
  sensitivity_table: SensitivityRow[];
  market_condition_assumption: MarketCondition;
}

export interface MAScenario {
  company_id: string;
  company_name: string;
  sector: Sector;
  last_funding_stage: Stage;
  total_raised_usd_m: number;
  arr_usd_m: number;
  acquirer_name: string;
  acquirer_type: string;
  deal_structure: string;
  earnout_pct: number | null;
  projected_close_date: string;
  deal_duration_months: number;
  valuation: ValuationRange;
  stakeholder_outcomes: StakeholderOutcome[];
  liquidation_waterfall: LiquidationWaterfall[];
  timeline: TimelineBar[];
  sensitivity_table: SensitivityRow[];
  regulatory_risk: string;
  market_condition_assumption: MarketCondition;
}

export interface SecondaryScenario {
  company_id: string;
  company_name: string;
  sector: Sector;
  last_funding_stage: Stage;
  total_raised_usd_m: number;
  arr_usd_m: number;
  secondary_type: string;
  buyer_universe: string[];
  shares_available_pct: number;
  discount_to_last_round_pct: number;
  projected_close_date: string;
  valuation: ValuationRange;
  stakeholder_outcomes: StakeholderOutcome[];
  liquidation_waterfall: LiquidationWaterfall[];
  timeline: TimelineBar[];
  sensitivity_table: SensitivityRow[];
  market_condition_assumption: MarketCondition;
}

export interface ContinuationVehicleScenario {
  company_id: string;
  company_name: string;
  sector: Sector;
  last_funding_stage: Stage;
  total_raised_usd_m: number;
  arr_usd_m: number;
  vehicle_size_usd_m: number;
  gp_name: string;
  lead_lp: string | null;
  roll_over_pct: number;
  preferred_return_pct: number;
  carry_pct: number;
  projected_hold_years: number;
  projected_exit_date: string;
  valuation: ValuationRange;
  stakeholder_outcomes: StakeholderOutcome[];
  liquidation_waterfall: LiquidationWaterfall[];
  timeline: TimelineBar[];
  sensitivity_table: SensitivityRow[];
  market_condition_assumption: MarketCondition;
}

export interface ExitScenarioBundle {
  company_id: string;
  company_name: string;
  sector: Sector;
  ipo: IPOScenario | null;
  ma: MAScenario | null;
  secondary: SecondaryScenario | null;
  continuation: ContinuationVehicleScenario | null;
}

export interface ScenariosResponse {
  count: number;
  data_source: string;
  disclaimer: string;
  scenarios: ExitScenarioBundle[];
}
