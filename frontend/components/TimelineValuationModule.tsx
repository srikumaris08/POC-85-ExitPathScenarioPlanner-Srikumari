"use client";

/**
 * TimelineValuationModule.tsx
 * Interactive timeline Gantt bars + valuation range sliders
 * Real Rails Intelligence Library · Exit Path Scenario Planner
 */

import React, { useState, useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { ExitScenarioBundle } from "@/lib/types";

interface Props {
  bundle: ExitScenarioBundle;
  selectedTimeline: string;
  selectedAssetClass: string;
}

const EXIT_COLORS = {
  ipo:          "#38BDF8",
  ma:           "#818CF8",
  secondary:    "#10B981",
  continuation: "#F59E0B",
};

// Parse date string to a year-fraction number for chart X axis
function dateToNum(dateStr: string): number {
  const d = new Date(dateStr);
  return d.getFullYear() + d.getMonth() / 12;
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

interface GanttBarProps {
  label: string;
  start: string;
  end: string;
  color: string;
  status: string;
}

function GanttBar({ label, start, end, color, status }: GanttBarProps) {
  const today = new Date();
  const s = new Date(start);
  const e = new Date(end);
  const spanMs = e.getTime() - s.getTime();
  const elapsed = Math.max(0, Math.min(1, (today.getTime() - s.getTime()) / spanMs));
  const pct = Math.round(elapsed * 100);

  const statusColor =
    status === "completed" ? "#10B981" :
    status === "in_progress" ? color :
    "var(--rr-text-dim)";

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: "0.72rem", color: "var(--rr-text)", fontWeight: 500 }}>{label}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: "0.68rem", color: "var(--rr-text-muted)" }}>
            {fmtDate(start)} → {fmtDate(end)}
          </span>
          <span
            className="rr-badge"
            style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}40` }}
          >
            {status.replace("_", " ")}
          </span>
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: "var(--rr-border)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 4,
            background: `linear-gradient(90deg, ${color}80 0%, ${color} 100%)`,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function TimelineValuationModule({ bundle, selectedTimeline, selectedAssetClass }: Props) {
  const [multiplierAdj, setMultiplierAdj] = useState(1.0);
  const [discountAdj, setDiscountAdj]     = useState(0);

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

  const showIPO          = !!bundle.ipo          && acm("IPO")                   && withinTimeline(bundle.ipo.projected_ipo_date);
  const showMA           = !!bundle.ma           && acm("M&A")                   && withinTimeline(bundle.ma.projected_close_date);
  const showSecondary    = !!bundle.secondary    && acm("Secondary")             && withinTimeline(bundle.secondary.projected_close_date);
  const showContinuation = !!bundle.continuation && acm("Continuation Vehicle") && withinTimeline(bundle.continuation.projected_exit_date);

  const chartData = useMemo(() => {
    const points: Record<string, { year: string; ipo?: number; ma?: number; secondary?: number; continuation?: number }> = {};

    const addPoint = (yearFrac: number, key: keyof typeof EXIT_COLORS, val: number) => {
      const yr = String(Math.round(yearFrac * 2) / 2);
      if (!points[yr]) points[yr] = { year: yr };
      (points[yr] as Record<string, string | number>)[key] = Math.round(val * multiplierAdj * (1 - discountAdj / 100));
    };

    if (showIPO)          addPoint(dateToNum(bundle.ipo!.projected_ipo_date),        "ipo",          bundle.ipo!.valuation.base_case_usd_m);
    if (showMA)           addPoint(dateToNum(bundle.ma!.projected_close_date),        "ma",           bundle.ma!.valuation.base_case_usd_m);
    if (showSecondary)    addPoint(dateToNum(bundle.secondary!.projected_close_date), "secondary",    bundle.secondary!.valuation.base_case_usd_m);
    if (showContinuation) addPoint(dateToNum(bundle.continuation!.projected_exit_date),"continuation",bundle.continuation!.valuation.base_case_usd_m);

    return Object.values(points).sort((a, b) => parseFloat(a.year) - parseFloat(b.year));
  }, [bundle, multiplierAdj, discountAdj, showIPO, showMA, showSecondary, showContinuation]);

  // Gantt milestones — only from matching arms
  const allMilestones = [
    ...(showIPO       ? (bundle.ipo?.timeline ?? []).map((t) => ({ ...t, exitColor: EXIT_COLORS.ipo }))   : []),
    ...(showMA        ? (bundle.ma?.timeline  ?? []).map((t) => ({ ...t, exitColor: EXIT_COLORS.ma }))    : []),
  ].slice(0, 8);

  // Valuation range display — filtered
  const scenarios = [
    showIPO          && { name: "IPO",          color: EXIT_COLORS.ipo,          v: bundle.ipo!.valuation },
    showMA           && { name: "M&A",           color: EXIT_COLORS.ma,           v: bundle.ma!.valuation },
    showSecondary    && { name: "Secondary",     color: EXIT_COLORS.secondary,    v: bundle.secondary!.valuation },
    showContinuation && { name: "Continuation", color: EXIT_COLORS.continuation, v: bundle.continuation!.valuation },
  ].filter(Boolean) as { name: string; color: string; v: { bear_case_usd_m: number; base_case_usd_m: number; bull_case_usd_m: number } }[];

  const maxVal = Math.max(...scenarios.map((s) => s.v.bull_case_usd_m));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%", minHeight: 420 }}>
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--rr-text)" }}>
          Timeline & Valuation Windows
        </h3>
        <p style={{ fontSize: "0.7rem", color: "var(--rr-text-muted)", marginTop: 2 }}>
          Optimal exit windows with dynamic valuation spectrum adjustment
        </p>
      </div>

      {/* Slider Controls */}
      <div
        className="rr-card-elevated"
        style={{ padding: "10px 14px", display: "flex", gap: 20, flexShrink: 0, flexWrap: "wrap" }}
      >
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ fontSize: "0.7rem", color: "var(--rr-text-muted)", fontWeight: 600 }}>
              Revenue Multiple Adj.
            </label>
            <span style={{ fontSize: "0.7rem", color: "var(--rr-primary)", fontWeight: 700 }}>
              {multiplierAdj.toFixed(2)}×
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={150}
            step={5}
            value={Math.round(multiplierAdj * 100)}
            onChange={(e) => setMultiplierAdj(parseInt(e.target.value) / 100)}
            style={{ width: "100%" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
            <span style={{ fontSize: "0.62rem", color: "var(--rr-text-dim)" }}>0.5×</span>
            <span style={{ fontSize: "0.62rem", color: "var(--rr-text-dim)" }}>1.5×</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ fontSize: "0.7rem", color: "var(--rr-text-muted)", fontWeight: 600 }}>
              Discount Rate Adj.
            </label>
            <span style={{ fontSize: "0.7rem", color: discountAdj > 0 ? "var(--rr-danger)" : "var(--rr-success)", fontWeight: 700 }}>
              {discountAdj > 0 ? "+" : ""}{discountAdj}pp
            </span>
          </div>
          <input
            type="range"
            min={-10}
            max={10}
            step={1}
            value={discountAdj}
            onChange={(e) => setDiscountAdj(parseInt(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
            <span style={{ fontSize: "0.62rem", color: "var(--rr-text-dim)" }}>-10pp</span>
            <span style={{ fontSize: "0.62rem", color: "var(--rr-text-dim)" }}>+10pp</span>
          </div>
        </div>
      </div>

      {/* Valuation Range Bars */}
      <div style={{ flexShrink: 0 }}>
        <p style={{ fontSize: "0.7rem", color: "var(--rr-text-muted)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Expected Valuation Spectrum (Adjusted)
        </p>
        {scenarios.map((s) => {
          const adjFactor = multiplierAdj * (1 - discountAdj / 100);
          const bear = Math.round(s.v.bear_case_usd_m * adjFactor);
          const base = Math.round(s.v.base_case_usd_m * adjFactor);
          const bull = Math.round(s.v.bull_case_usd_m * adjFactor);
          const bearPct = (bear / (maxVal * adjFactor)) * 100;
          const basePct = (base / (maxVal * adjFactor)) * 100;
          const bullPct = (bull / (maxVal * adjFactor)) * 100;

          return (
            <div key={s.name} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: s.color }}>{s.name}</span>
                <span style={{ fontSize: "0.72rem", color: "var(--rr-text-muted)" }}>
                  ${bear}M — <strong style={{ color: "var(--rr-text)" }}>${base}M</strong> — ${bull}M
                </span>
              </div>
              <div style={{ position: "relative", height: 8, borderRadius: 6, background: "var(--rr-border)" }}>
                {/* Bear to Bull range */}
                <div
                  style={{
                    position: "absolute",
                    left: `${bearPct}%`,
                    width: `${bullPct - bearPct}%`,
                    height: "100%",
                    borderRadius: 6,
                    background: `${s.color}30`,
                  }}
                />
                {/* Base marker */}
                <div
                  style={{
                    position: "absolute",
                    left: `${basePct - 1}%`,
                    width: "3px",
                    height: "100%",
                    borderRadius: 2,
                    background: s.color,
                    boxShadow: `0 0 6px ${s.color}80`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Area Chart: Valuation over time */}
      <div style={{ flex: 1, minHeight: 200 }}>
        <p style={{ fontSize: "0.7rem", color: "var(--rr-text-muted)", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Exit Event Timeline
        </p>
        <ResponsiveContainer width="100%" height="55%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--rr-border)" strokeOpacity={0.35} />
            <XAxis
              dataKey="year"
              tick={{ fill: "var(--rr-text-muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--rr-text-muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}M`}
            />
            <Tooltip
              contentStyle={{
                background: "var(--rr-surface)",
                border: "1px solid var(--rr-border)",
                borderRadius: 8,
                color: "var(--rr-text)",
                fontSize: "0.75rem",
              }}
            />
            <ReferenceLine y={0} stroke="var(--rr-border)" />
            {showIPO          && <Line type="monotone" dataKey="ipo"          stroke="#38BDF8" strokeWidth={2} dot={{ fill: "#38BDF8", r: 4 }} name="IPO" connectNulls />}
            {showMA           && <Line type="monotone" dataKey="ma"           stroke="#818CF8" strokeWidth={2} dot={{ fill: "#818CF8", r: 4 }} name="M&A" connectNulls />}
            {showSecondary    && <Line type="monotone" dataKey="secondary"    stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981", r: 4 }} name="Secondary" connectNulls />}
            {showContinuation && <Line type="monotone" dataKey="continuation" stroke="#F59E0B" strokeWidth={2} dot={{ fill: "#F59E0B", r: 4 }} name="Continuation" connectNulls />}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Gantt milestones */}
        <div style={{ marginTop: 10, overflowY: "auto", maxHeight: "35%" }}>
          {allMilestones.map((m, i) => (
            <GanttBar
              key={i}
              label={m.milestone}
              start={m.start_date}
              end={m.end_date}
              status={m.status}
              color={m.exitColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
