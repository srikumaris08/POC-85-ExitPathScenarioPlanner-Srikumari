"use client";

/**
 * Sidebar.tsx — 30% Intelligence Sidebar
 * Real Rails Intelligence Library · Exit Path Scenario Planner
 *
 * Section A: Title & core liquidity KPI cards
 * Section B: "Why This Matters"
 * Section C: "Who Controls the Rail"
 * Section D: Download Sample Data
 * Section E: Footer branding
 *
 * NOTE: Intelligence Filters have been moved to FilterBar.tsx (horizontal
 * bar above the main stage). This sidebar has no internal scroll.
 */

import React, { useState } from "react";
import type { ExitScenarioBundle } from "@/lib/types";
import { downloadSampleData } from "@/lib/api";

interface Props {
  bundle: ExitScenarioBundle | null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
        padding: "6px 10px",
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
          marginBottom: 2,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "0.95rem",
          fontWeight: 800,
          color,
          fontFamily: "var(--font-mono)",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: "0.6rem", color: "var(--rr-text-dim)", marginTop: 2 }}>{sub}</p>
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
  return (
    <div
      className="rr-card"
      style={{ padding: "10px 12px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: "0.85rem" }}>{icon}</span>
        <span
          style={{
            fontSize: "0.74rem",
            fontWeight: 700,
            color: accentColor,
            letterSpacing: "0.02em",
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ fontSize: "0.7rem", lineHeight: 1.55, color: "var(--rr-text-muted)" }}>
        {children}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Sidebar({ bundle }: Props) {
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
  const baseValuation =
    bundle?.ipo?.valuation.base_case_usd_m ??
    bundle?.ma?.valuation.base_case_usd_m ??
    bundle?.secondary?.valuation.base_case_usd_m ??
    bundle?.continuation?.valuation.base_case_usd_m ??
    0;

  const bearValuation =
    bundle?.ipo?.valuation.bear_case_usd_m ?? bundle?.ma?.valuation.bear_case_usd_m ?? 0;

  const bullValuation =
    bundle?.ipo?.valuation.bull_case_usd_m ?? bundle?.ma?.valuation.bull_case_usd_m ?? 0;

  const totalRaised = bundle?.ipo?.total_raised_usd_m ?? bundle?.ma?.total_raised_usd_m ?? 0;
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
        overflow: "hidden",      /* no scroll anywhere in sidebar */
        background: "var(--rr-surface)",
      }}
    >
      {/* ── SECTION A: Title & Core Liquidity KPI Cards ─────────── */}
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

        {/* Company name + badges */}
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
              <span className="rr-badge rr-badge-cyan">
                {exitCount} exit path{exitCount !== 1 ? "s" : ""}
              </span>
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

      {/* ── Sections B / C / D — flat column, hidden-scrollbar overflow ─ */}
      <div
        className="rr-sidebar-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          overflowY: "auto",   /* allows expanded sections; scrollbar hidden via CSS */
        }}
      >
        {/* SECTION B: Why This Matters */}
        <InfoBlock icon="💡" title="Why This Matters" accentColor="var(--rr-primary)">
          <ul style={{ margin: 0, paddingLeft: 14, display: "flex", flexDirection: "column", gap: 3 }}>
            <li>Exit is a <strong style={{ color: "var(--rr-text)" }}>spectrum</strong> — IPO, M&A, Secondary, Continuation each carry distinct payoffs.</li>
            <li><strong style={{ color: "var(--rr-text)" }}>Founders:</strong> Find the path that maximises payout given your cap table &amp; hold timeline.</li>
            <li><strong style={{ color: "var(--rr-text)" }}>Allocators:</strong> Map ownership % → real liquidity after waterfall &amp; earn-outs.</li>
            <li><strong style={{ color: "var(--rr-text)" }}>Builders:</strong> Stress-test revenue multiples before committing to a path.</li>
          </ul>
        </InfoBlock>

        {/* SECTION C: Who Controls the Rail */}
        <InfoBlock icon="🏛️" title="Who Controls the Rail" accentColor="var(--rr-secondary)">
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              { label: "IPO", rule: "SEC/FINRA · S-1, 180-day lock-up, Reg-FD", color: "#38BDF8" },
              { label: "M&A", rule: "Board + Banks · HSR antitrust, CFIUS review", color: "#818CF8" },
              { label: "Secondary", rule: "Counsel · ROFR waivers, Rule 144 periods", color: "#10B981" },
              { label: "Continuation", rule: "GP/LP · Fairness opinion, 75% LP consent", color: "#F59E0B" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: "5px 8px",
                  borderRadius: 5,
                  background: "var(--rr-bg)",
                  borderLeft: `2px solid ${item.color}`,
                }}
              >
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: item.color }}>{item.label}: </span>
                <span style={{ fontSize: "0.67rem", color: "var(--rr-text-muted)" }}>{item.rule}</span>
              </div>
            ))}
          </div>
        </InfoBlock>

        {/* SECTION D: Download Sample Data */}
        <div className="rr-card" style={{ padding: "10px 12px" }}>
          <p
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--rr-text)",
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>📥</span> Download Sample Data
          </p>
          <p style={{ fontSize: "0.67rem", color: "var(--rr-text-muted)", marginBottom: 8, lineHeight: 1.4 }}>
            <code style={{ color: "var(--rr-primary)", fontSize: "0.63rem" }}>/api/download-sample</code>
            {bundle ? (
              <> · filtered to <strong style={{ color: "var(--rr-text)" }}>{bundle.company_name}</strong>
              </>
            ) : " · synthetic scenario dataset"}.
          </p>

          {/* Format toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {(["json", "csv"] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setDownloadFmt(fmt)}
                style={{
                  flex: 1,
                  padding: "4px",
                  borderRadius: 6,
                  fontSize: "0.72rem",
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
              padding: "7px 12px",
              borderRadius: 7,
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
              File saved ·{" "}
              {downloadFmt === "json" ? "exit_path_sample_data.json" : "exit_path_sample_data.csv"}
            </p>
          )}

          {/* Endpoint info */}
          <div
            style={{
              marginTop: 6,
              padding: "5px 8px",
              borderRadius: 5,
              background: "var(--rr-bg)",
              border: "1px solid var(--rr-border)",
            }}
          >
            <p style={{ fontSize: "0.6rem", color: "var(--rr-text-dim)", fontFamily: "var(--font-mono)" }}>
              GET /api/download-sample?format={downloadFmt}
              {bundle ? `&company_id=${bundle.company_id}` : ""}
            </p>
          </div>
        </div>

        {/* SECTION E: Footer branding */}
        <div
          style={{
            padding: "10px 0",
            textAlign: "center",
            borderTop: "1px solid var(--rr-border)",
            marginTop: "auto",
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
