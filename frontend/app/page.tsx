"use client";

/**
 * page.tsx — Root page for Exit Path Scenario Planner
 * Real Rails Intelligence Library · POC-85
 *
 * Layout: 70% Dashboard (Main Stage) | 30% Sidebar (Intelligence)
 */

import React, { useState, useEffect, useCallback } from "react";
import type { ExitScenarioBundle } from "@/lib/types";
import { fetchScenarios, fetchSectors } from "@/lib/api";
import Dashboard from "@/components/Dashboard";
import Sidebar from "@/components/Sidebar";

type LoadState = "loading" | "loaded" | "error";

export default function HomePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const [loadState, setLoadState]     = useState<LoadState>("loading");
  const [bundles, setBundles]         = useState<ExitScenarioBundle[]>([]);
  const [sectors, setSectors]         = useState<string[]>([]);
  const [selectedId, setSelectedId]   = useState<string>("");
  const [errorMsg, setErrorMsg]       = useState<string>("");

  // Filter state
  const [selectedSector,     setSelectedSector]     = useState("");
  const [selectedTimeline,   setSelectedTimeline]   = useState("All");
  const [selectedAssetClass, setSelectedAssetClass] = useState("All");

  const loadData = useCallback(async (sector?: string) => {
    setLoadState("loading");
    try {
      const [scenRes, sectRes] = await Promise.all([
        fetchScenarios({ sector: sector || undefined, limit: 50 }),
        fetchSectors(),
      ]);
      setBundles(scenRes.scenarios);
      setSectors(sectRes.sectors);
      if (scenRes.scenarios.length > 0 && !selectedId) {
        setSelectedId(scenRes.scenarios[0].company_id);
      }
      setLoadState("loaded");
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Failed to connect to the backend. Make sure it is running on http://localhost:8000"
      );
      setLoadState("error");
    }
  }, [selectedId]);

  // Initial load
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when sector filter changes
  useEffect(() => {
    loadData(selectedSector);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSector]);

  // ── Filter bundles list by asset class (for company selector dropdown) ──────
  const filteredBundles = bundles.filter((b) => {
    if (selectedAssetClass === "All") return true;
    if (selectedAssetClass === "IPO")                  return !!b.ipo;
    if (selectedAssetClass === "M&A")                  return !!b.ma;
    if (selectedAssetClass === "Secondary")            return !!b.secondary;
    if (selectedAssetClass === "Continuation Vehicle") return !!b.continuation;
    return true;
  });

  const activeBundleId = filteredBundles.find((b) => b.company_id === selectedId)
    ? selectedId
    : filteredBundles[0]?.company_id ?? "";

  // Full unmasked bundle — sidebar always receives complete company data
  const activeBundle = filteredBundles.find((b) => b.company_id === activeBundleId) ?? null;

  // ── Loading screen
  if (loadState === "loading") {
    return (
      <div
        style={{
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--rr-bg)",
          gap: 20,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.2rem",
            fontWeight: 900,
            color: "#030712",
            boxShadow: "0 0 32px rgba(56,189,248,0.35)",
            animation: "pulseGlow 1.5s ease-in-out infinite",
          }}
        >
          RR
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--rr-text)", marginBottom: 6 }}>
            Loading Exit Path Scenarios…
          </p>
          <p style={{ fontSize: "0.72rem", color: "var(--rr-text-muted)" }}>
            Connecting to Real Rails backend · {apiUrl}
          </p>
        </div>
        <div
          style={{
            width: 200,
            height: 3,
            borderRadius: 2,
            background: "var(--rr-border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #38BDF8 0%, #818CF8 100%)",
              animation: "shimmer 1.2s linear infinite",
              backgroundSize: "200% auto",
            }}
          />
        </div>
      </div>
    );
  }

  // ── Error screen
  if (loadState === "error") {
    return (
      <div
        style={{
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--rr-bg)",
          gap: 16,
          padding: 24,
        }}
      >
        <div style={{ fontSize: "2.5rem" }}>⚠️</div>
        <h1 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--rr-text)" }}>
          Backend Connection Failed
        </h1>
        <p
          style={{
            maxWidth: 420,
            textAlign: "center",
            fontSize: "0.8rem",
            color: "var(--rr-text-muted)",
            lineHeight: 1.6,
          }}
        >
          {errorMsg}
        </p>
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            background: "var(--rr-surface)",
            border: "1px solid var(--rr-border)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--rr-primary)",
          }}
        >
          cd backend &amp;&amp; uvicorn main:app --reload --port 8000
        </div>
        <button
          onClick={() => loadData()}
          style={{
            padding: "10px 24px",
            borderRadius: 8,
            background: "rgba(56,189,248,0.1)",
            border: "1px solid var(--rr-primary)",
            color: "var(--rr-primary)",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // ── Main layout
  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        overflow: "hidden",
        background: "var(--rr-bg)",
      }}
    >
      {/* 70% Main Stage — includes FilterBar */}
      <Dashboard
        bundles={filteredBundles}
        selectedId={activeBundleId}
        onSelectId={setSelectedId}
        sectors={sectors}
        selectedSector={selectedSector}
        onSectorChange={setSelectedSector}
        selectedTimeline={selectedTimeline}
        onTimelineChange={setSelectedTimeline}
        selectedAssetClass={selectedAssetClass}
        onAssetClassChange={setSelectedAssetClass}
      />

      {/* 30% Intelligence Sidebar — KPIs, Why This Matters, Who Controls, Download */}
      <Sidebar bundle={activeBundle} />
    </div>
  );
}
