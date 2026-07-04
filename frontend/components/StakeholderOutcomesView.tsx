"use client";

/**
 * StakeholderOutcomesView.tsx
 * Payout distribution breakdown across Founders, VCs, Employees
 * using stacked bars and waterfall visualization
 * Real Rails Intelligence Library · Exit Path Scenario Planner
 */

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import type { ExitScenarioBundle, StakeholderOutcome } from "@/lib/types";

interface Props {
  bundle: ExitScenarioBundle;
  selectedTimeline: string;
  selectedAssetClass: string;
}

const STAKEHOLDER_COLORS: Record<string, string> = {
  Founders:  "#38BDF8",
  Employees: "#10B981",
  "Series A": "#818CF8",
  "Series B": "#A78BFA",
  "Series C": "#C4B5FD",
  VCs:       "#818CF8",
  "Preferred": "#F59E0B",
  "Common":   "#94A3B8",
};

function getColor(name: string): string {
  for (const [key, color] of Object.entries(STAKEHOLDER_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return color;
  }
  // Hash-based fallback color
  const palette = ["#38BDF8", "#818CF8", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

type Scenario = "IPO" | "M&A" | "Secondary" | "Continuation";
type Case = "bear" | "base" | "bull";

function buildChartData(outcomes: StakeholderOutcome[], caseType: Case) {
  return outcomes.map((o) => ({
    name: o.stakeholder,
    proceeds:
      caseType === "bear" ? o.proceeds_bear_usd_m :
      caseType === "base" ? o.proceeds_base_usd_m : o.proceeds_bull_usd_m,
    ownership: o.ownership_pct,
    moic:
      caseType === "bear" ? o.moic_bear :
      caseType === "base" ? o.moic_base : o.moic_bull,
    irr:
      caseType === "bear" ? o.irr_pct_bear :
      caseType === "base" ? o.irr_pct_base : o.irr_pct_bull,
    color: getColor(o.stakeholder),
  }));
}

const caseLabels: Record<Case, string> = { bear: "Bear 🐻", base: "Base ⚖️", bull: "Bull 🐂" };

export default function StakeholderOutcomesView({ bundle, selectedTimeline, selectedAssetClass }: Props) {
  const [activeScenario, setActiveScenario] = useState<Scenario>("IPO");
  const [activeCase, setActiveCase] = useState<Case>("base");

  function withinTimeline(dateStr: string | undefined | null): boolean {
    if (selectedTimeline === "All" || !dateStr) return true;
    const months = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44);
    if (selectedTimeline === "< 12 months")   return months <= 12;
    if (selectedTimeline === "12–24 months")  return months > 12 && months <= 24;
    if (selectedTimeline === "24–36 months")  return months > 24 && months <= 36;
    if (selectedTimeline === "> 36 months")   return months > 36;
    return true;
  }
  function acm(type: string): boolean {
    return selectedAssetClass === "All" || selectedAssetClass === type;
  }

  const scenarioMap: Record<Scenario, StakeholderOutcome[] | undefined> = {
    "IPO":          bundle.ipo?.stakeholder_outcomes,
    "M&A":          bundle.ma?.stakeholder_outcomes,
    "Secondary":    bundle.secondary?.stakeholder_outcomes,
    "Continuation": bundle.continuation?.stakeholder_outcomes,
  };

  // Gate visibility on both filters
  const scenarioVisible: Record<Scenario, boolean> = {
    "IPO":          acm("IPO")                   && withinTimeline(bundle.ipo?.projected_ipo_date),
    "M&A":          acm("M&A")                   && withinTimeline(bundle.ma?.projected_close_date),
    "Secondary":    acm("Secondary")             && withinTimeline(bundle.secondary?.projected_close_date),
    "Continuation": acm("Continuation Vehicle") && withinTimeline(bundle.continuation?.projected_exit_date),
  };

  const outcomes = scenarioMap[activeScenario] ?? [];
  const chartData = buildChartData(outcomes, activeCase);
  const totalProceeds = chartData.reduce((s, d) => s + d.proceeds, 0);

  const availableScenarios = (
    Object.entries(scenarioMap) as [Scenario, StakeholderOutcome[] | undefined][]
  )
    .filter(([k, v]) => v && v.length > 0 && scenarioVisible[k as Scenario])
    .map(([k]) => k);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 420 }}>
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--rr-text)" }}>
          Stakeholder Outcomes
        </h3>
        <p style={{ fontSize: "0.7rem", color: "var(--rr-text-muted)", marginTop: 2 }}>
          Payout distribution across preference stacks per exit path
        </p>
      </div>

      {/* Controls Row */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {availableScenarios.map((s) => (
            <button
              key={s}
              className={`tab-btn${activeScenario === s ? " active" : ""}`}
              onClick={() => setActiveScenario(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {(["bear", "base", "bull"] as Case[]).map((c) => (
            <button
              key={c}
              onClick={() => setActiveCase(c)}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                fontSize: "0.72rem",
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid",
                transition: "all 0.2s ease",
                borderColor: activeCase === c ?
                  (c === "bull" ? "#10B981" : c === "bear" ? "#EF4444" : "var(--rr-primary)") :
                  "var(--rr-border)",
                background: activeCase === c ?
                  (c === "bull" ? "rgba(16,185,129,0.12)" : c === "bear" ? "rgba(239,68,68,0.12)" : "rgba(56,189,248,0.12)") :
                  "transparent",
                color: activeCase === c ?
                  (c === "bull" ? "#10B981" : c === "bear" ? "#EF4444" : "var(--rr-primary)") :
                  "var(--rr-text-muted)",
              }}
            >
              {caseLabels[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI strip */}
      <div
        className="rr-card-elevated"
        style={{ padding: "10px 14px", display: "flex", gap: 20, flexShrink: 0, flexWrap: "wrap" }}
      >
        <div>
          <p style={{ fontSize: "0.65rem", color: "var(--rr-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Total Distributable
          </p>
          <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--rr-primary)", fontFamily: "var(--font-mono)" }}>
            ${totalProceeds.toFixed(0)}M
          </p>
        </div>
        <div>
          <p style={{ fontSize: "0.65rem", color: "var(--rr-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Stakeholders
          </p>
          <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--rr-text)", fontFamily: "var(--font-mono)" }}>
            {outcomes.length}
          </p>
        </div>
        <div>
          <p style={{ fontSize: "0.65rem", color: "var(--rr-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Avg. MOIC
          </p>
          <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--rr-success)", fontFamily: "var(--font-mono)" }}>
            {chartData.length > 0
              ? (chartData.reduce((s, d) => s + d.moic, 0) / chartData.length).toFixed(2)
              : "—"}×
          </p>
        </div>
        <div>
          <p style={{ fontSize: "0.65rem", color: "var(--rr-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Scenario
          </p>
          <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--rr-secondary)", fontFamily: "var(--font-mono)" }}>
            {activeScenario}
          </p>
        </div>
      </div>

      {/* Stacked Bar Chart */}
      <div style={{ flex: 1, minHeight: 200 }}>
        <ResponsiveContainer width="100%" height="60%">
          <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 8 }} barSize={28}>
            <CartesianGrid vertical={false} stroke="var(--rr-border)" strokeOpacity={0.35} />
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--rr-text-muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={40}
            />
            <YAxis
              tick={{ fill: "var(--rr-text-muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}M`}
            />
            <Tooltip
              cursor={{ fill: "rgba(56,189,248,0.04)" }}
              contentStyle={{
                background: "var(--rr-surface)",
                border: "1px solid var(--rr-border)",
                borderRadius: 8,
                color: "var(--rr-text)",
                fontSize: "0.75rem",
              }}
              formatter={(v: unknown, name: unknown) => [`$${(v as number).toFixed(1)}M`, name as string]}
            />
            <Bar dataKey="proceeds" name="Proceeds" radius={[4, 4, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Ownership & MOIC table */}
        <div style={{ overflowY: "auto", marginTop: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
            <thead>
              <tr>
                {["Stakeholder", "Ownership", "Proceeds", "MOIC", "IRR"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "6px 8px",
                      textAlign: h === "Stakeholder" ? "left" : "right",
                      color: "var(--rr-text-muted)",
                      fontWeight: 600,
                      borderBottom: "1px solid var(--rr-border)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontSize: "0.65rem",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.map((d, i) => (
                <tr
                  key={i}
                  style={{
                    transition: "background 0.15s ease",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "var(--rr-surface-2)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                >
                  <td style={{ padding: "7px 8px", color: d.color, fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: d.color, flexShrink: 0 }} />
                      {d.name}
                    </div>
                  </td>
                  <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--rr-text-muted)", fontFamily: "var(--font-mono)" }}>
                    {d.ownership.toFixed(1)}%
                  </td>
                  <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--rr-text)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    ${d.proceeds.toFixed(1)}M
                  </td>
                  <td style={{
                    padding: "7px 8px",
                    textAlign: "right",
                    color: d.moic >= 3 ? "var(--rr-success)" : d.moic >= 1.5 ? "var(--rr-warning)" : "var(--rr-danger)",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                  }}>
                    {d.moic.toFixed(2)}×
                  </td>
                  <td style={{
                    padding: "7px 8px",
                    textAlign: "right",
                    color: "var(--rr-text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}>
                    {d.irr != null ? `${d.irr.toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
