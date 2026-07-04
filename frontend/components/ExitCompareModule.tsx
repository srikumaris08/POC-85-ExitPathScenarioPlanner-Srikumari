"use client";

/**
 * ExitCompareModule.tsx
 * Interactive side-by-side comparison of IPO vs M&A vs Secondary vs Continuation Vehicle
 * using Recharts RadarChart + BarChart analytics
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
  Cell,
} from "recharts";
import type { ExitScenarioBundle } from "@/lib/types";

interface Props {
  bundle: ExitScenarioBundle;
  selectedTimeline: string;
  selectedAssetClass: string;
}

const EXIT_COLORS = {
  IPO:                  "#38BDF8",
  "M&A":                "#818CF8",
  Secondary:            "#10B981",
  "Continuation Vehicle": "#F59E0B",
};

type ViewMode = "valuation" | "radar" | "moic";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rr-card-elevated" style={{ padding: "10px 14px", minWidth: 140 }}>
      <p style={{ color: "var(--rr-text-muted)", fontSize: "0.72rem", marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: p.color }} />
          <span style={{ color: "var(--rr-text)", fontSize: "0.78rem" }}>
            {p.name}: <strong>${p.value.toFixed(0)}M</strong>
          </span>
        </div>
      ))}
    </div>
  );
};

export default function ExitCompareModule({ bundle, selectedTimeline, selectedAssetClass }: Props) {
  const [view, setView] = useState<ViewMode>("valuation");

  // Helper: is a projected date within the chosen timeline window?
  function withinTimeline(dateStr: string | undefined | null): boolean {
    if (selectedTimeline === "All" || !dateStr) return true;
    const months = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44);
    if (selectedTimeline === "< 12 months")   return months <= 12;
    if (selectedTimeline === "12–24 months")  return months > 12 && months <= 24;
    if (selectedTimeline === "24–36 months")  return months > 24 && months <= 36;
    if (selectedTimeline === "> 36 months")   return months > 36;
    return true;
  }

  // Apply both filters to the exits list
  function assetClassMatch(type: string): boolean {
    return selectedAssetClass === "All" || selectedAssetClass === type;
  }

  // Build unified comparison data — only include arms matching active filters
  const exits = [
    bundle.ipo       && assetClassMatch("IPO")                  && withinTimeline(bundle.ipo.projected_ipo_date)          && { name: "IPO",          type: "IPO" as const,                  val: bundle.ipo },
    bundle.ma        && assetClassMatch("M&A")                  && withinTimeline(bundle.ma.projected_close_date)          && { name: "M&A",          type: "M&A" as const,                  val: bundle.ma },
    bundle.secondary && assetClassMatch("Secondary")            && withinTimeline(bundle.secondary.projected_close_date)   && { name: "Secondary",    type: "Secondary" as const,            val: bundle.secondary },
    bundle.continuation && assetClassMatch("Continuation Vehicle") && withinTimeline(bundle.continuation.projected_exit_date) && { name: "Continuation", type: "Continuation Vehicle" as const, val: bundle.continuation },
  ].filter(Boolean) as { name: string; type: keyof typeof EXIT_COLORS; val: { valuation: { bear_case_usd_m: number; base_case_usd_m: number; bull_case_usd_m: number }; stakeholder_outcomes: Array<{ stakeholder: string; moic_base: number; proceeds_base_usd_m: number }> } }[];

  const valuationData = exits.map((e) => ({
    name: e.name,
    Bear:  Math.round(e.val.valuation.bear_case_usd_m),
    Base:  Math.round(e.val.valuation.base_case_usd_m),
    Bull:  Math.round(e.val.valuation.bull_case_usd_m),
    color: EXIT_COLORS[e.type],
  }));

  // Radar: only show arms matching filters
  const radarData = [
    { metric: "Speed", IPO: 55, "M&A": 80, Secondary: 90, Continuation: 60 },
    { metric: "Valuation\nUpside", IPO: 90, "M&A": 70, Secondary: 50, Continuation: 65 },
    { metric: "Liquidity", IPO: 85, "M&A": 88, Secondary: 92, Continuation: 55 },
    { metric: "Control", IPO: 60, "M&A": 30, Secondary: 70, Continuation: 75 },
    { metric: "Regulatory\nRisk", IPO: 40, "M&A": 60, Secondary: 80, Continuation: 85 },
    { metric: "Complexity", IPO: 35, "M&A": 45, Secondary: 75, Continuation: 70 },
  ];
  const showIPO         = !!bundle.ipo         && assetClassMatch("IPO")                   && withinTimeline(bundle.ipo.projected_ipo_date);
  const showMA          = !!bundle.ma          && assetClassMatch("M&A")                   && withinTimeline(bundle.ma.projected_close_date);
  const showSecondary   = !!bundle.secondary   && assetClassMatch("Secondary")             && withinTimeline(bundle.secondary.projected_close_date);
  const showContinuation= !!bundle.continuation&& assetClassMatch("Continuation Vehicle") && withinTimeline(bundle.continuation.projected_exit_date);

  const moicData = exits.flatMap((e) =>
    e.val.stakeholder_outcomes.slice(0, 3).map((s) => ({
      name: `${e.name} · ${s.stakeholder}`,
      MOIC: s.moic_base,
      color: EXIT_COLORS[e.type],
    }))
  );

  const tabs: { id: ViewMode; label: string }[] = [
    { id: "valuation", label: "Valuation Range" },
    { id: "radar",     label: "Dimension Radar" },
    { id: "moic",      label: "MOIC Breakdown" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 420 }}>
      {/* Header + Tabs */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--rr-text)", letterSpacing: "0.03em" }}>
            Exit Path Comparison
          </h3>
          <p style={{ fontSize: "0.7rem", color: "var(--rr-text-muted)", marginTop: 2 }}>
            IPO · M&A · Secondary · Continuation — side by side
          </p>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`tab-btn${view === t.id ? " active" : ""}`}
              onClick={() => setView(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend Pills */}
      <div style={{ display: "flex", gap: 12, flexShrink: 0, flexWrap: "wrap" }}>
        {exits.map((e) => (
          <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: EXIT_COLORS[e.type] }} />
            <span style={{ fontSize: "0.72rem", color: "var(--rr-text-muted)", fontWeight: 500 }}>{e.name}</span>
          </div>
        ))}
      </div>

      {/* Chart Area */}
      <div style={{ flex: 1, minHeight: 320 }}>
        {view === "valuation" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={valuationData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }} barGap={6}>
              <CartesianGrid vertical={false} stroke="var(--rr-border)" strokeOpacity={0.4} />
              <XAxis dataKey="name" tick={{ fill: "var(--rr-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "var(--rr-text-muted)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}M`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(56,189,248,0.04)" }} />
              <Bar dataKey="Bear" name="Bear Case" radius={[3, 3, 0, 0]} maxBarSize={24}>
                {valuationData.map((d, i) => (
                  <Cell key={i} fill={d.color} fillOpacity={0.4} />
                ))}
              </Bar>
              <Bar dataKey="Base" name="Base Case" radius={[3, 3, 0, 0]} maxBarSize={24}>
                {valuationData.map((d, i) => (
                  <Cell key={i} fill={d.color} fillOpacity={0.75} />
                ))}
              </Bar>
              <Bar dataKey="Bull" name="Bull Case" radius={[3, 3, 0, 0]} maxBarSize={24}>
                {valuationData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {view === "radar" && (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 8, right: 20, left: 20, bottom: 8 }}>
              <PolarGrid stroke="var(--rr-border)" strokeOpacity={0.5} />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "var(--rr-text-muted)", fontSize: 10 }} />
              {showIPO         && <Radar name="IPO"          dataKey="IPO"          stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.12} strokeWidth={2} />}
              {showMA          && <Radar name="M&A"          dataKey="M&A"          stroke="#818CF8" fill="#818CF8" fillOpacity={0.12} strokeWidth={2} />}
              {showSecondary   && <Radar name="Secondary"    dataKey="Secondary"    stroke="#10B981" fill="#10B981" fillOpacity={0.12} strokeWidth={2} />}
              {showContinuation&& <Radar name="Continuation" dataKey="Continuation" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.12} strokeWidth={2} />}
              <Legend
                wrapperStyle={{ fontSize: "0.72rem", color: "var(--rr-text-muted)" }}
                iconType="circle"
                iconSize={8}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}

        {view === "moic" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={moicData}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 80, bottom: 8 }}
            >
              <CartesianGrid horizontal={false} stroke="var(--rr-border)" strokeOpacity={0.4} />
              <XAxis
                type="number"
                tick={{ fill: "var(--rr-text-muted)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}x`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "var(--rr-text-muted)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={78}
              />
              <Tooltip
                cursor={{ fill: "rgba(56,189,248,0.04)" }}
                formatter={(v: unknown) => [`${(v as number).toFixed(2)}x MOIC`, ""]}
                contentStyle={{
                  background: "var(--rr-surface)",
                  border: "1px solid var(--rr-border)",
                  borderRadius: 8,
                  color: "var(--rr-text)",
                  fontSize: "0.78rem",
                }}
              />
              <Bar dataKey="MOIC" radius={[0, 3, 3, 0]} maxBarSize={14}>
                {moicData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
