"use client";

/**
 * FilterBar.tsx — Horizontal Intelligence Filter Bar
 * Real Rails Intelligence Library · Exit Path Scenario Planner
 *
 * Renders as a single sticky row across the top of the Main Stage,
 * between the header and the module-navigation tabs.
 */

import React from "react";

interface FilterBarProps {
  sectors: string[];
  selectedSector: string;
  onSectorChange: (s: string) => void;
  selectedTimeline: string;
  onTimelineChange: (t: string) => void;
  selectedAssetClass: string;
  onAssetClassChange: (a: string) => void;
}

const TIMELINES = ["All", "< 12 months", "12–24 months", "24–36 months", "> 36 months"];
const ASSET_CLASSES = ["All", "IPO", "M&A", "Secondary", "Continuation Vehicle"];

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "0.6rem",
  fontWeight: 700,
  color: "var(--rr-text-dim)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 4,
  whiteSpace: "nowrap",
};

const SELECT_STYLE: React.CSSProperties = {
  fontSize: "0.75rem",
  padding: "5px 10px",
  minWidth: 140,
  maxWidth: 200,
};

export default function FilterBar({
  sectors,
  selectedSector,
  onSectorChange,
  selectedTimeline,
  onTimelineChange,
  selectedAssetClass,
  onAssetClassChange,
}: FilterBarProps) {
  const hasActiveFilters =
    selectedSector !== "" ||
    selectedTimeline !== "All" ||
    selectedAssetClass !== "All";

  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "flex-end",
        gap: 16,
        padding: "10px 20px",
        borderBottom: "1px solid var(--rr-border)",
        background:
          "linear-gradient(180deg, rgba(56,189,248,0.03) 0%, transparent 100%)",
        flexWrap: "wrap",
      }}
    >
      {/* Label */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexShrink: 0 }}>
        <span style={{ fontSize: "0.85rem" }}>🎛️</span>
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            color: "var(--rr-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            whiteSpace: "nowrap",
          }}
        >
          Filters
        </span>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 32,
          background: "var(--rr-border)",
          flexShrink: 0,
          alignSelf: "center",
        }}
      />

      {/* Sector */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <label htmlFor="filter-sector" style={LABEL_STYLE}>
          Sector
        </label>
        <select
          id="filter-sector"
          value={selectedSector}
          onChange={(e) => onSectorChange(e.target.value)}
          style={SELECT_STYLE}
        >
          <option value="">All Sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Exit Timeline */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <label htmlFor="filter-timeline" style={LABEL_STYLE}>
          Exit Timeline
        </label>
        <select
          id="filter-timeline"
          value={selectedTimeline}
          onChange={(e) => onTimelineChange(e.target.value)}
          style={SELECT_STYLE}
        >
          {TIMELINES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Asset Class */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <label htmlFor="filter-asset-class" style={LABEL_STYLE}>
          Exit Path / Asset Class
        </label>
        <select
          id="filter-asset-class"
          value={selectedAssetClass}
          onChange={(e) => onAssetClassChange(e.target.value)}
          style={SELECT_STYLE}
        >
          {ASSET_CLASSES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <>
          {/* Divider */}
          <div
            style={{
              width: 1,
              height: 32,
              background: "var(--rr-border)",
              flexShrink: 0,
              alignSelf: "center",
            }}
          />
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              alignItems: "center",
              alignSelf: "flex-end",
              paddingBottom: 2,
            }}
          >
            {selectedSector && (
              <span className="rr-badge rr-badge-cyan">
                {selectedSector}{" "}
                <span
                  style={{ cursor: "pointer", marginLeft: 3, opacity: 0.8 }}
                  onClick={() => onSectorChange("")}
                >
                  ✕
                </span>
              </span>
            )}
            {selectedTimeline !== "All" && (
              <span className="rr-badge rr-badge-indigo">
                {selectedTimeline}{" "}
                <span
                  style={{ cursor: "pointer", marginLeft: 3, opacity: 0.8 }}
                  onClick={() => onTimelineChange("All")}
                >
                  ✕
                </span>
              </span>
            )}
            {selectedAssetClass !== "All" && (
              <span className="rr-badge rr-badge-green">
                {selectedAssetClass}{" "}
                <span
                  style={{ cursor: "pointer", marginLeft: 3, opacity: 0.8 }}
                  onClick={() => onAssetClassChange("All")}
                >
                  ✕
                </span>
              </span>
            )}
            <button
              onClick={() => {
                onSectorChange("");
                onTimelineChange("All");
                onAssetClassChange("All");
              }}
              style={{
                fontSize: "0.62rem",
                fontWeight: 700,
                color: "var(--rr-text-dim)",
                background: "transparent",
                border: "1px solid var(--rr-border)",
                borderRadius: 4,
                padding: "2px 7px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--rr-text)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--rr-text-muted)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--rr-text-dim)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--rr-border)";
              }}
            >
              Clear all
            </button>
          </div>
        </>
      )}
    </div>
  );
}
