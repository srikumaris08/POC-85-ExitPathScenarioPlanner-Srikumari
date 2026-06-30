"use client";

/**
 * Sidebar.tsx — 30% Intelligence Sidebar
 * Real Rails Intelligence Library · Exit Path Scenario Planner
 *
 * Section A: Title & core liquidity metrics
 * Section B: "Why This Matters"
 * Section C: "Who Controls the Rail"
 * Section D: Interactive filters
 * Section E: Download Sample Data
 */

import React, { useState } from "react";
import type { ExitScenarioBundle } from "@/lib/types";
import { downloadSampleData } from "@/lib/api";

interface Props {
  bundle: ExitScenarioBundle | null;
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

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

function MetricCard({ label, value, sub, color = "var(--rr-primary)" }: MetricCardProps) {
  return (
    <div
      className="rr-card-elevated"
      style={{
        padding: "10px 12px",
        borderLeft: `2px solid ${color}`,
        transition: "box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 12px ${color}25`)
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.boxShadow = "none")
      }
    >
      <p
        style={{
          fontSize: "0.6rem",
          fontWeight: 700,
          color: "var(--rr-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "1.05rem",
          fontWeight: 800,
          color,
          fontFamily: "var(--font-mono)",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: "0.65rem", color: "var(--rr-text-dim)", marginTop: 4 }}>{sub}</p>
      )}
    </div>
  );
}

interface InfoBlockProps {
  icon: string;
  title: string;
  children: React.ReactNode;
  accentColor?: string;
}

function InfoBlock({ icon, title, children, accentColor = "var(--rr-primary)" }: InfoBlockProps) {
  const [open, setOpen] = useState(true);
  return (
    <div
      className="rr-card"
      style={{ padding: "14px 16px", transition: "box-shadow 0.2s ease" }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          marginBottom: open ? 10 : 0,
        }}
      >
        <span style={{ fontSize: "1rem" }}>{icon}</span>
        <span
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            color: accentColor,
            letterSpacing: "0.02em",
            flex: 1,
            textAlign: "left",
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: "0.7rem",
            color: "var(--rr-text-dim)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="animate-fade-in" style={{ fontSize: "0.75rem", lineHeight: 1.65, color: "var(--rr-text-muted)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  bundle,
  sectors,
  selectedSector,
  onSectorChange,
  selectedTimeline,
  onTimelineChange,
  selectedAssetClass,
  onAssetClassChange,
}: Props) {
  const [downloadFmt, setDownloadFmt] = useState<"json" | "csv">("json");
  const [downloading, setDownloading] = useState(false);
  const [dlSuccess, setDlSuccess] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    setDlSuccess(false);
    try {
      downloadSampleData(downloadFmt, bundle?.company_id);
      setTimeout(() => {
        setDownloading(false);
        setDlSuccess(true);
        setTimeout(() => setDlSuccess(false), 3000);
      }, 800);
    } catch {
      setDownloading(false);
    }
  };

  // ── Derive liquidity metrics from bundle
  const baseValuation = bundle?.ipo?.valuation.base_case_usd_m
    ?? bundle?.ma?.valuation.base_case_usd_m
    ?? bundle?.secondary?.valuation.base_case_usd_m
    ?? bundle?.continuation?.valuation.base_case_usd_m
    ?? 0;

  const bearValuation = bundle?.ipo?.valuation.bear_case_usd_m
    ?? bundle?.ma?.valuation.bear_case_usd_m
    ?? 0;

  const bullValuation = bundle?.ipo?.valuation.bull_case_usd_m
    ?? bundle?.ma?.valuation.bull_case_usd_m
    ?? 0;

  const totalRaised = bundle?.ipo?.total_raised_usd_m
    ?? bundle?.ma?.total_raised_usd_m
    ?? 0;

  const arr = bundle?.ipo?.arr_usd_m ?? bundle?.ma?.arr_usd_m ?? 0;
  const revenueMultiple = arr > 0 ? (baseValuation / arr).toFixed(1) : "—";
  const returnMultiple = totalRaised > 0 ? (baseValuation / totalRaised).toFixed(2) : "—";

  const exitCount = [bundle?.ipo, bundle?.ma, bundle?.secondary, bundle?.continuation].filter(Boolean).length;

  return (
    <aside
      style={{
        flex: "0 0 30%",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        background: "var(--rr-surface)",
        gap: 0,
      }}
    >
      {/* ── SECTION A: Title & Core Liquidity Metrics ─────────── */}
      <div
        style={{
          flexShrink: 0,
          padding: "16px 16px 14px",
          borderBottom: "1px solid var(--rr-border)",
          background:
            "linear-gradient(180deg, rgba(129,140,248,0.05) 0%, transparent 100%)",
        }}
      >
        {/* Logo bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8rem",
              fontWeight: 900,
              color: "#030712",
              flexShrink: 0,
              boxShadow: "0 0 12px rgba(56,189,248,0.4)",
            }}
          >
            RR
          </div>
          <div>
            <p
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "var(--rr-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Intelligence Sidebar
            </p>
            <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--rr-text)" }}>
              Capital Formation Rail
            </p>
          </div>
        </div>

        {/* Company name */}
        {bundle && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: "0.65rem", color: "var(--rr-text-dim)", marginBottom: 2 }}>
              Selected Company
            </p>
            <p style={{ fontSize: "1rem", fontWeight: 800, color: "var(--rr-text)" }}>
              {bundle.company_name}
            </p>
            <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
              <span className="rr-badge rr-badge-indigo">{bundle.sector}</span>
              <span className="rr-badge rr-badge-cyan">{exitCount} exit path{exitCount !== 1 ? "s" : ""}</span>
            </div>
          </div>
        )}

        {/* Core liquidity metrics grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <MetricCard
            label="Base Valuation"
            value={`$${baseValuation.toFixed(0)}M`}
            sub={`Bear $${bearValuation.toFixed(0)}M · Bull $${bullValuation.toFixed(0)}M`}
            color="var(--rr-primary)"
          />
          <MetricCard
            label="ARR"
            value={arr > 0 ? `$${arr.toFixed(0)}M` : "—"}
            sub="Annual Recurring Revenue"
            color="var(--rr-success)"
          />
          <MetricCard
            label="Rev. Multiple"
            value={`${revenueMultiple}×`}
            sub="Base val / ARR"
            color="var(--rr-secondary)"
          />
          <MetricCard
            label="Return on Capital"
            value={`${returnMultiple}×`}
            sub={`on $${totalRaised.toFixed(0)}M raised`}
            color="var(--rr-warning)"
          />
        </div>
      </div>

      {/* ── Scrollable Sections Container ─────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* SECTION B: Why This Matters */}
        <InfoBlock icon="💡" title="Why This Matters" accentColor="var(--rr-primary)">
          <p style={{ marginBottom: 8 }}>
            Most founders and operators think about <strong style={{ color: "var(--rr-text)" }}>exit</strong> as a single future event. 
            In reality it&apos;s a spectrum of <strong style={{ color: "var(--rr-primary)" }}>structured liquidity instruments</strong> — 
            each with distinct valuation optionality, stakeholder payoffs, and regulatory burdens.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong style={{ color: "var(--rr-text)" }}>For founders:</strong> Know exactly which path maximises your payout 
            given your cap table structure, liquidation preferences, and hold timeline.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong style={{ color: "var(--rr-text)" }}>For allocators:</strong> Translate raw ownership percentages into downstream 
            liquidity reality — factoring waterfall mechanics, earn-outs, and secondary discounts.
          </p>
          <p>
            <strong style={{ color: "var(--rr-text)" }}>For builders:</strong> Model sensitivity of exit outcomes to revenue multiples 
            and discount rate shifts before committing to a path.
          </p>
        </InfoBlock>

        {/* SECTION C: Who Controls the Rail */}
        <InfoBlock icon="🏛️" title="Who Controls the Rail" accentColor="var(--rr-secondary)">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              {
                label: "IPO Rail",
                controller: "SEC / FINRA + Underwriters",
                rule: "S-1 filing, 180-day lock-up, quiet period obligations, Reg-FD constraints.",
                color: "#38BDF8",
              },
              {
                label: "M&A Rail",
                controller: "Board + Investment Banks",
                rule: "Fiduciary duty triggers, Hart-Scott-Rodino (HSR) antitrust review, CFIUS clearance for strategic acquirers.",
                color: "#818CF8",
              },
              {
                label: "Secondary Rail",
                controller: "Transfer Agent + Company Counsel",
                rule: "ROFR / co-sale waivers, Rule 144 holding periods, accredited investor requirements for private transfers.",
                color: "#10B981",
              },
              {
                label: "Continuation Vehicle",
                controller: "GP / Fund Counsel + LP Advisory",
                rule: "Fairness opinion required, LP consent thresholds (typically 75%), preferred return hurdles, carry waterfalls.",
                color: "#F59E0B",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: "var(--rr-bg)",
                  borderLeft: `2px solid ${item.color}`,
                }}
              >
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: item.color, marginBottom: 3 }}>
                  {item.label}
                </p>
                <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--rr-text)", marginBottom: 3 }}>
                  {item.controller}
                </p>
                <p style={{ fontSize: "0.67rem", color: "var(--rr-text-muted)", lineHeight: 1.5 }}>
                  {item.rule}
                </p>
              </div>
            ))}
          </div>
        </InfoBlock>

        {/* SECTION D: Interactive Filters */}
        <div className="rr-card" style={{ padding: "14px 16px" }}>
          <p
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--rr-text)",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>🎛️</span> Intelligence Filters
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Sector filter */}
            <div>
              <label
                htmlFor="filter-sector"
                style={{
                  display: "block",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: "var(--rr-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 5,
                }}
              >
                Sector
              </label>
              <select
                id="filter-sector"
                value={selectedSector}
                onChange={(e) => onSectorChange(e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">All Sectors</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Timeline filter */}
            <div>
              <label
                htmlFor="filter-timeline"
                style={{
                  display: "block",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: "var(--rr-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 5,
                }}
              >
                Exit Timeline
              </label>
              <select
                id="filter-timeline"
                value={selectedTimeline}
                onChange={(e) => onTimelineChange(e.target.value)}
                style={{ width: "100%" }}
              >
                {TIMELINES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Asset class filter */}
            <div>
              <label
                htmlFor="filter-asset-class"
                style={{
                  display: "block",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: "var(--rr-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 5,
                }}
              >
                Exit Path / Asset Class
              </label>
              <select
                id="filter-asset-class"
                value={selectedAssetClass}
                onChange={(e) => onAssetClassChange(e.target.value)}
                style={{ width: "100%" }}
              >
                {ASSET_CLASSES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Active filter pills */}
            {(selectedSector || selectedTimeline !== "All" || selectedAssetClass !== "All") && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {selectedSector && (
                  <span className="rr-badge rr-badge-cyan">
                    {selectedSector}{" "}
                    <span
                      style={{ cursor: "pointer", marginLeft: 2 }}
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
                      style={{ cursor: "pointer", marginLeft: 2 }}
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
                      style={{ cursor: "pointer", marginLeft: 2 }}
                      onClick={() => onAssetClassChange("All")}
                    >
                      ✕
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION E: Download Sample Data */}
        <div className="rr-card" style={{ padding: "14px 16px" }}>
          <p
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--rr-text)",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>📥</span> Download Sample Data
          </p>
          <p style={{ fontSize: "0.7rem", color: "var(--rr-text-muted)", marginBottom: 12, lineHeight: 1.5 }}>
            Export the full synthetic scenario dataset from the backend adapter endpoint{" "}
            <code style={{ color: "var(--rr-primary)", fontSize: "0.65rem" }}>/api/download-sample</code>
            {bundle && (
              <>, filtered to <strong style={{ color: "var(--rr-text)" }}>{bundle.company_name}</strong></>
            )}.
          </p>

          {/* Format toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {(["json", "csv"] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setDownloadFmt(fmt)}
                style={{
                  flex: 1,
                  padding: "6px",
                  borderRadius: 7,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "1px solid",
                  transition: "all 0.2s ease",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  borderColor: downloadFmt === fmt ? "var(--rr-primary)" : "var(--rr-border)",
                  background: downloadFmt === fmt ? "rgba(56,189,248,0.1)" : "transparent",
                  color: downloadFmt === fmt ? "var(--rr-primary)" : "var(--rr-text-muted)",
                }}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Download button */}
          <button
            id="download-sample-btn"
            onClick={handleDownload}
            disabled={downloading}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: 8,
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: downloading ? "not-allowed" : "pointer",
              border: "1px solid",
              transition: "all 0.25s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderColor: dlSuccess
                ? "var(--rr-success)"
                : downloading
                ? "var(--rr-border)"
                : "var(--rr-primary)",
              background: dlSuccess
                ? "rgba(16,185,129,0.12)"
                : downloading
                ? "rgba(56,189,248,0.05)"
                : "rgba(56,189,248,0.1)",
              color: dlSuccess
                ? "var(--rr-success)"
                : downloading
                ? "var(--rr-text-muted)"
                : "var(--rr-primary)",
              boxShadow: !downloading && !dlSuccess ? "0 0 16px rgba(56,189,248,0.15)" : "none",
            }}
          >
            {downloading ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    border: "2px solid var(--rr-border)",
                    borderTopColor: "var(--rr-primary)",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Fetching from backend…
              </>
            ) : dlSuccess ? (
              <>✅ Download complete!</>
            ) : (
              <>
                <span>⬇</span> Download {downloadFmt.toUpperCase()} Sample
              </>
            )}
          </button>

          {dlSuccess && (
            <p style={{ fontSize: "0.65rem", color: "var(--rr-success)", marginTop: 6, textAlign: "center" }}>
              File saved · {downloadFmt === "json" ? "exit_path_sample_data.json" : "exit_path_sample_data.csv"}
            </p>
          )}

          {/* Endpoint info */}
          <div
            style={{
              marginTop: 10,
              padding: "7px 10px",
              borderRadius: 6,
              background: "var(--rr-bg)",
              border: "1px solid var(--rr-border)",
            }}
          >
            <p style={{ fontSize: "0.62rem", color: "var(--rr-text-dim)", fontFamily: "var(--font-mono)" }}>
              GET /api/download-sample?format={downloadFmt}
              {bundle ? `&company_id=${bundle.company_id}` : ""}
            </p>
          </div>
        </div>

        {/* Footer branding */}
        <div
          style={{
            padding: "10px 0",
            textAlign: "center",
            borderTop: "1px solid var(--rr-border)",
            marginTop: 4,
          }}
        >
          <p style={{ fontSize: "0.6rem", color: "var(--rr-text-dim)" }}>
            Real Rails Intelligence Library · POC-85
          </p>
          <p style={{ fontSize: "0.58rem", color: "var(--rr-text-dim)", marginTop: 2 }}>
            Capital Formation Rail · Exit Path Scenario Planner
          </p>
        </div>
      </div>

      {/* Spin keyframe for download button */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </aside>
  );
}
