"use client";

/**
 * SensitivityTable.tsx
 * Micro-grid showing valuation vs revenue multiple × discount rate
 * Real Rails Intelligence Library · Exit Path Scenario Planner
 */

import React, { useState } from "react";
import type { ExitScenarioBundle, SensitivityRow } from "@/lib/types";

interface Props {
  bundle: ExitScenarioBundle;
  selectedTimeline: string;
  selectedAssetClass: string;
}

type Scenario = "IPO" | "M&A" | "Secondary" | "Continuation";

function interpolateColor(value: number, min: number, max: number): string {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  // Deep navy → electric cyan gradient
  const r = Math.round(3 + t * (56 - 3));
  const g = Math.round(7 + t * (189 - 7));
  const b = Math.round(18 + t * (248 - 18));
  return `rgba(${r},${g},${b},${0.1 + t * 0.35})`;
}

function buildGrid(rows: SensitivityRow[]): {
  multiples: number[];
  rates: number[];
  grid: Record<string, Record<string, SensitivityRow>>;
} {
  const multiples = [...new Set(rows.map((r) => r.revenue_multiple))].sort((a, b) => a - b);
  const rates     = [...new Set(rows.map((r) => r.discount_rate_pct))].sort((a, b) => a - b);
  const grid: Record<string, Record<string, SensitivityRow>> = {};

  for (const row of rows) {
    const mk = String(row.revenue_multiple);
    const dk = String(row.discount_rate_pct);
    if (!grid[mk]) grid[mk] = {};
    grid[mk][dk] = row;
  }
  return { multiples, rates, grid };
}

export default function SensitivityTable({ bundle, selectedTimeline, selectedAssetClass }: Props) {
  const [activeScenario, setActiveScenario] = useState<Scenario>("IPO");
  const [metric, setMetric] = useState<"valuation" | "founder" | "investor">("valuation");

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

  const scenarioRows: Record<Scenario, SensitivityRow[] | undefined> = {
    "IPO":          bundle.ipo?.sensitivity_table,
    "M&A":          bundle.ma?.sensitivity_table,
    "Secondary":    bundle.secondary?.sensitivity_table,
    "Continuation": bundle.continuation?.sensitivity_table,
  };

  const scenarioVisible: Record<Scenario, boolean> = {
    "IPO":          acm("IPO")                   && withinTimeline(bundle.ipo?.projected_ipo_date),
    "M&A":          acm("M&A")                   && withinTimeline(bundle.ma?.projected_close_date),
    "Secondary":    acm("Secondary")             && withinTimeline(bundle.secondary?.projected_close_date),
    "Continuation": acm("Continuation Vehicle") && withinTimeline(bundle.continuation?.projected_exit_date),
  };

  const rows = scenarioRows[activeScenario] ?? [];
  const { multiples, rates, grid } = buildGrid(rows);

  const getValue = (row: SensitivityRow): number =>
    metric === "valuation"  ? row.valuation_usd_m :
    metric === "founder"    ? row.founder_proceeds_usd_m :
                              row.investor_proceeds_usd_m;

  const allValues = rows.map(getValue);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);

  const availableScenarios = (Object.keys(scenarioRows) as Scenario[]).filter(
    (k) => scenarioRows[k] && scenarioRows[k]!.length > 0 && scenarioVisible[k]
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--rr-text)" }}>
          Sensitivity Analysis
        </h3>
        <p style={{ fontSize: "0.7rem", color: "var(--rr-text-muted)", marginTop: 2 }}>
          Valuation × probability matrix across revenue multiples & discount rates
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0, alignItems: "center" }}>
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
          {(["valuation", "founder", "investor"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`tab-btn${metric === m ? " active" : ""}`}
            >
              {m === "valuation" ? "Valuation" : m === "founder" ? "Founder $" : "Investor $"}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: "0.65rem", color: "var(--rr-text-dim)" }}>Low</span>
        <div
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            background: "linear-gradient(90deg, rgba(3,7,18,0.8) 0%, rgba(56,189,248,0.45) 100%)",
            border: "1px solid var(--rr-border)",
          }}
        />
        <span style={{ fontSize: "0.65rem", color: "var(--rr-text-dim)" }}>High</span>
      </div>

      {/* Grid */}
      {rows.length === 0 ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "var(--rr-text-muted)", fontSize: "0.8rem" }}>
            No sensitivity data for {activeScenario}
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: "auto" }}>
          <div
            className="sensitivity-grid"
            style={{
              gridTemplateColumns: `80px repeat(${rates.length}, 1fr)`,
            }}
          >
            {/* Header row */}
            <div
              className="sensitivity-cell"
              style={{
                background: "var(--rr-surface-2)",
                color: "var(--rr-text-dim)",
                fontSize: "0.62rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Rev Mult ↓ / DR →
            </div>
            {rates.map((r) => (
              <div
                key={r}
                className="sensitivity-cell"
                style={{
                  background: "var(--rr-surface-2)",
                  color: "var(--rr-primary)",
                  fontWeight: 700,
                }}
              >
                {r}%
              </div>
            ))}

            {/* Data rows */}
            {multiples.map((m) => (
              <React.Fragment key={m}>
                {/* Row header */}
                <div
                  className="sensitivity-cell"
                  style={{
                    background: "var(--rr-surface-2)",
                    color: "var(--rr-secondary)",
                    fontWeight: 700,
                  }}
                >
                  {m}×
                </div>
                {/* Data cells */}
                {rates.map((r) => {
                  const cell = grid[String(m)]?.[String(r)];
                  if (!cell) {
                    return (
                      <div key={r} className="sensitivity-cell" style={{ color: "var(--rr-text-dim)" }}>
                        —
                      </div>
                    );
                  }
                  const val = getValue(cell);
                  const bgColor = interpolateColor(val, minVal, maxVal);
                  const isHigh = val > (minVal + maxVal) / 2 + (maxVal - minVal) * 0.2;

                  return (
                    <div
                      key={r}
                      className="sensitivity-cell"
                      style={{
                        background: bgColor,
                        color: isHigh ? "var(--rr-primary)" : "var(--rr-text-muted)",
                        fontWeight: isHigh ? 700 : 400,
                        cursor: "default",
                        position: "relative",
                      }}
                      title={`Revenue ${m}× | Discount ${r}% | Valuation $${cell.valuation_usd_m.toFixed(0)}M | Founder $${cell.founder_proceeds_usd_m.toFixed(0)}M | Investor $${cell.investor_proceeds_usd_m.toFixed(0)}M`}
                    >
                      ${val.toFixed(0)}M
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {/* Footer legend */}
          <div
            style={{
              marginTop: 10,
              padding: "8px 10px",
              borderRadius: 6,
              background: "var(--rr-surface-2)",
              border: "1px solid var(--rr-border)",
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "0.65rem", color: "var(--rr-text-muted)" }}>
              Rows: <strong style={{ color: "var(--rr-secondary)" }}>Revenue Multiple</strong>
            </span>
            <span style={{ fontSize: "0.65rem", color: "var(--rr-text-muted)" }}>
              Cols: <strong style={{ color: "var(--rr-primary)" }}>Discount Rate</strong>
            </span>
            <span style={{ fontSize: "0.65rem", color: "var(--rr-text-muted)" }}>
              Metric: <strong style={{ color: "var(--rr-text)" }}>
                {metric === "valuation" ? "Company Valuation" : metric === "founder" ? "Founder Proceeds" : "Investor Proceeds"}
              </strong>
            </span>
            <span style={{ fontSize: "0.65rem", color: "var(--rr-text-muted)" }}>
              Range: <strong style={{ color: "var(--rr-text)" }}>${minVal.toFixed(0)}M — ${maxVal.toFixed(0)}M</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
