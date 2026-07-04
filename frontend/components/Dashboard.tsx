"use client";

/**
 * Dashboard.tsx — 70% Main Stage
 * Real Rails Intelligence Library · Exit Path Scenario Planner
 * Hosts: FilterBar, ExitCompareModule, TimelineValuationModule,
 *        StakeholderOutcomesView, SensitivityTable
 */

import React, { useState } from "react";
import type { ExitScenarioBundle } from "@/lib/types";
import ExitCompareModule       from "./ExitCompareModule";
import TimelineValuationModule from "./TimelineValuationModule";
import StakeholderOutcomesView from "./StakeholderOutcomesView";
import SensitivityTable        from "./SensitivityTable";
import FilterBar               from "./FilterBar";

interface Props {
  bundles: ExitScenarioBundle[];
  selectedId: string;
  onSelectId: (id: string) => void;
  // Filter state — lifted from page.tsx
  sectors: string[];
  selectedSector: string;
  onSectorChange: (s: string) => void;
  selectedTimeline: string;
  onTimelineChange: (t: string) => void;
  selectedAssetClass: string;
  onAssetClassChange: (a: string) => void;
}

type ActivePanel = "compare" | "timeline" | "stakeholders" | "sensitivity";

const PANELS: { id: ActivePanel; label: string; icon: string }[] = [
  { id: "compare",      label: "Exit Compare",       icon: "⚡" },
  { id: "timeline",     label: "Timeline & Valuation", icon: "📈" },
  { id: "stakeholders", label: "Stakeholder Outcomes", icon: "👥" },
  { id: "sensitivity",  label: "Sensitivity Table",    icon: "🔢" },
];

export default function Dashboard({
  bundles,
  selectedId,
  onSelectId,
  sectors,
  selectedSector,
  onSectorChange,
  selectedTimeline,
  onTimelineChange,
  selectedAssetClass,
  onAssetClassChange,
}: Props) {
  const [activePanel, setActivePanel] = useState<ActivePanel>("compare");

  const bundle = bundles.find((b) => b.company_id === selectedId) ?? bundles[0];

  if (!bundle) {
    return (
      <div
        style={{
          flex: "0 0 70%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--rr-text-muted)",
          fontSize: "0.9rem",
        }}
      >
        No scenario data available. Make sure the backend is running on{" "}
        <code style={{ color: "var(--rr-primary)", marginLeft: 4 }}>http://localhost:8000</code>
      </div>
    );
  }

  return (
    <main
      style={{
        flex: "0 0 70%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRight: "1px solid var(--rr-border)",
      }}
    >
      {/* ── Top Header Bar ─────────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          padding: "16px 20px 12px",
          borderBottom: "1px solid var(--rr-border)",
          background:
            "linear-gradient(180deg, rgba(56,189,248,0.04) 0%, transparent 100%)",
        }}
      >
        {/* Company Selector + Metadata */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div>
            <p
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "var(--rr-primary)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 2,
              }}
            >
              Real Rails · POC-85 · Exit Path Scenario Planner
            </p>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--rr-text)", lineHeight: 1.2 }}>
              {bundle.company_name}
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              marginLeft: "auto",
              flexWrap: "wrap",
            }}
          >
            <span className="rr-badge rr-badge-cyan">{bundle.sector}</span>
            {bundle.ipo        && <span className="rr-badge rr-badge-cyan">IPO</span>}
            {bundle.ma         && <span className="rr-badge rr-badge-indigo">M&A</span>}
            {bundle.secondary  && <span className="rr-badge rr-badge-green">Secondary</span>}
            {bundle.continuation && <span className="rr-badge rr-badge-amber">Continuation</span>}
          </div>
        </div>

        {/* Company Picker dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <label style={{ fontSize: "0.7rem", color: "var(--rr-text-muted)", fontWeight: 600 }}>
            Company:
          </label>
          <select
            id="company-selector"
            value={selectedId}
            onChange={(e) => onSelectId(e.target.value)}
            style={{ minWidth: 200 }}
          >
            {bundles.map((b) => (
              <option key={b.company_id} value={b.company_id}>
                {b.company_name} ({b.sector})
              </option>
            ))}
          </select>

          {/* Quick stat pills */}
          {bundle.ipo && (
            <div className="rr-card-elevated" style={{ padding: "4px 10px", display: "flex", gap: 12 }}>
              <span style={{ fontSize: "0.7rem", color: "var(--rr-text-muted)" }}>
                ARR:{" "}
                <strong style={{ color: "var(--rr-text)", fontFamily: "var(--font-mono)" }}>
                  ${bundle.ipo.arr_usd_m.toFixed(0)}M
                </strong>
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--rr-text-muted)" }}>
                Raised:{" "}
                <strong style={{ color: "var(--rr-text)", fontFamily: "var(--font-mono)" }}>
                  ${bundle.ipo.total_raised_usd_m.toFixed(0)}M
                </strong>
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--rr-text-muted)" }}>
                Growth:{" "}
                <strong style={{ color: "var(--rr-success)", fontFamily: "var(--font-mono)" }}>
                  {bundle.ipo.growth_rate_pct.toFixed(0)}%
                </strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Intelligence Filter Bar ──────────────────────────────── */}
      <FilterBar
        sectors={sectors}
        selectedSector={selectedSector}
        onSectorChange={onSectorChange}
        selectedTimeline={selectedTimeline}
        onTimelineChange={onTimelineChange}
        selectedAssetClass={selectedAssetClass}
        onAssetClassChange={onAssetClassChange}
      />

      {/* ── Module Navigation Tabs ──────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          gap: 0,
          padding: "0 20px",
          borderBottom: "1px solid var(--rr-border)",
          background: "var(--rr-surface)",
        }}
      >
        {PANELS.map((panel) => (
          <button
            key={panel.id}
            id={`tab-${panel.id}`}
            onClick={() => setActivePanel(panel.id)}
            style={{
              padding: "10px 16px",
              fontSize: "0.78rem",
              fontWeight: activePanel === panel.id ? 700 : 500,
              color:
                activePanel === panel.id ? "var(--rr-primary)" : "var(--rr-text-muted)",
              background: "transparent",
              border: "none",
              borderBottom:
                activePanel === panel.id
                  ? "2px solid var(--rr-primary)"
                  : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (activePanel !== panel.id)
                (e.currentTarget as HTMLButtonElement).style.color = "var(--rr-text)";
            }}
            onMouseLeave={(e) => {
              if (activePanel !== panel.id)
                (e.currentTarget as HTMLButtonElement).style.color = "var(--rr-text-muted)";
            }}
          >
            <span>{panel.icon}</span>
            {panel.label}
          </button>
        ))}
      </div>

      {/* ── Module Content Panel ────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
        }}
        className="animate-fade-in"
        key={activePanel}
      >
        {/* Panel content rendered in a card */}
        <div
          className="rr-card"
          style={{
            flex: 1,
            minHeight: 0,
            padding: "20px",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Subtle glow accent top-left */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 200,
              height: 80,
              background:
                "radial-gradient(ellipse at top left, rgba(56,189,248,0.06) 0%, transparent 70%)",
              borderRadius: "12px 0 0 0",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* Scrollable chart content with resolved flex height */}
          <div style={{ flex: 1, minHeight: 0, overflow: "auto", position: "relative", zIndex: 1 }}>
            {activePanel === "compare"      && <ExitCompareModule       bundle={bundle} selectedTimeline={selectedTimeline} selectedAssetClass={selectedAssetClass} />}
            {activePanel === "timeline"     && <TimelineValuationModule bundle={bundle} selectedTimeline={selectedTimeline} selectedAssetClass={selectedAssetClass} />}
            {activePanel === "stakeholders" && <StakeholderOutcomesView bundle={bundle} selectedTimeline={selectedTimeline} selectedAssetClass={selectedAssetClass} />}
            {activePanel === "sensitivity"  && <SensitivityTable        bundle={bundle} selectedTimeline={selectedTimeline} selectedAssetClass={selectedAssetClass} />}
          </div>
        </div>
      </div>

      {/* ── Footer Disclaimer ────────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          padding: "8px 20px",
          borderTop: "1px solid var(--rr-border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--rr-warning)",
            animation: "pulseGlow 2s ease-in-out infinite",
          }}
        />
        <p style={{ fontSize: "0.62rem", color: "var(--rr-text-dim)" }}>
          All figures are illustrative synthetic mock data. Not investment advice.
          Data source: <span style={{ color: "var(--rr-primary)" }}>synthetic-mock</span>
        </p>
      </div>
    </main>
  );
}
