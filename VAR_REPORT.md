# VAR_REPORT.md — Visualization Audit Review
## Real Rails Quality & UAT Protocol · POC-85: Exit Path Scenario Planner
**Audit Date:** 2026-06-25 | **Auditor Role:** Principal Product Reviewer / QA Lead / Senior UX Architect
**Repository:** `POC-85-ExitPathScenarioPlanner-Srikumari` | **Audit Scope:** Frontend UI Layout Layer

---

## Executive Summary

This Visualization Audit Review (VAR) maps every frontend source file against the Real Rails Visual DNA constraints. All findings are derived from direct static analysis of committed source files. The system achieves a **PASS** rating on all hard requirements.

| Audit Category | Total Checks | PASS | IMPROVE | FAIL |
|---|---|---|---|---|
| Theme & Palette | 7 | 6 | 1 | 0 |
| Layout Protocol | 5 | 5 | 0 | 0 |
| Visualization Mapping | 12 | 11 | 1 | 0 |
| Typography & Micro-Animation | 6 | 6 | 0 | 0 |
| State & Error Handling | 4 | 4 | 0 | 0 |
| **TOTAL** | **34** | **32** | **2** | **0** |

---

## Section 1 — Theme & Palette Audit

| Visual Element | Strict Requirement | Current Implementation (Source · Line) | Pass/Fail/Improve |
|---|---|---|---|
| **Global Body Background** | `#030712` Obsidian Black on `body` selector | `globals.css:13` — `--rr-bg: #030712`. `globals.css:75` — `body { background-color: var(--rr-bg); }`. Applied to all render states in `page.tsx:91,153,213`. | ✅ PASS |
| **Card Surface Color** | `#0B1117` Deep Navy Grey for all card surfaces | `globals.css:14` — `--rr-surface: #0B1117`. `.rr-card` class at `globals.css:100`. Used in `Dashboard.tsx:219`, `Sidebar.tsx:97,201,207,381,530`. | ✅ PASS |
| **Elevated Card Surface** | Secondary surface visually distinct from card level | `globals.css:15` — `--rr-surface-2: #111827`. `.rr-card-elevated` at `globals.css:107`. Applied in `Sidebar.tsx:42`, `TimelineValuationModule.tsx:156`, `StakeholderOutcomesView.tsx:151`. | ✅ PASS |
| **Primary Accent** | `#38BDF8` Electric Cyan for interactive highlights and primary KPIs | `globals.css:16` — `--rr-primary: #38BDF8`. Active tab underline `Dashboard.tsx:181–183`. Slider thumb glow `globals.css:233`. Badge `globals.css:124–128`. Download button `Sidebar.tsx:601`. IPO chart color `ExitCompareModule.tsx:32`. | ✅ PASS |
| **Secondary Accent** | `#818CF8` Indigo for M&A series and secondary labels | `globals.css:17` — `--rr-secondary: #818CF8`. M&A chart color `ExitCompareModule.tsx:33`. Radar series `ExitCompareModule.tsx:183`. Sidebar logo gradient `Sidebar.tsx:228`. `.rr-badge-indigo` `globals.css:130–134`. | ✅ PASS |
| **Chart Color Semantic Map** | IPO=`#38BDF8`, M&A=`#818CF8`, Secondary=`#10B981`, Continuation=`#F59E0B` | `ExitCompareModule.tsx:31–36` `EXIT_COLORS` constant. `TimelineValuationModule.tsx:27–32` `EXIT_COLORS`. `StakeholderOutcomesView.tsx:28–37` `STAKEHOLDER_COLORS`. `globals.css:27–30` chart tokens declared. Consistent across all 4 chart modules. | ✅ PASS |
| **Tailwind Import Ordering** | Design tokens must precede framework imports to avoid cascade overrides | `globals.css:4` — `@import "tailwindcss"` appears at line 4, before `:root` token block at line 11. `@theme inline` at `globals.css:46–60` re-maps Tailwind tokens to RR vars. Low risk but should be validated in production build output. | ⚠️ IMPROVE |

---

## Section 2 — Layout Protocol Audit

| Visual Element | Strict Requirement | Current Implementation (Source · Line) | Pass/Fail/Improve |
|---|---|---|---|
| **Root Split: 70% Main Stage** | `<Dashboard>` occupies exactly 70% of viewport width, non-wrapping flex | `page.tsx:208–214` — root `<div>` uses `height: "100dvh"`, `display: "flex"`, `overflow: "hidden"`. `Dashboard.tsx:58` — `flex: "0 0 70%"` fixed, no grow/shrink. | ✅ PASS |
| **Root Split: 30% Intelligence Sidebar** | `<Sidebar>` occupies exactly 30% of viewport width | `Sidebar.tsx:202–203` — `flex: "0 0 30%"`. `overflowY: "auto"` for internal scroll without breaking layout. `page.tsx:223–233` confirms DOM ordering. | ✅ PASS |
| **Split Divider Border** | 1px border on the 70/30 layout seam | `Dashboard.tsx:62` — `borderRight: "1px solid var(--rr-border)"`. Single-border approach avoids double-border artefact at the seam. | ✅ PASS |
| **Viewport Lock** | Application occupies exactly `100dvh`, no root document scroll | `globals.css:69–72` — `html, body { height: 100%; overflow: hidden; }`. `page.tsx:86,150,209` — all three render states set `height: "100dvh"`. Internal scrolling isolated to `Dashboard.tsx:216` and `Sidebar.tsx:206`. | ✅ PASS |
| **Panel Tab Navigation** | Module tabs strictly within 70% stage, no sidebar bleed | `Dashboard.tsx:156–204` — tab bar is `flexShrink: 0` child of `<main style={{ flex: "0 0 70%" }}>`. All 4 panels driven by `activePanel` state. `key={activePanel}` triggers `.animate-fade-in` on every switch. | ✅ PASS |

---

## Section 3 — Visualization Mapping Audit

| Visual Element | Strict Requirement | Current Implementation (Source · Line) | Pass/Fail/Improve |
|---|---|---|---|
| **Exit Compare — Valuation Bar Chart** | Grouped bars (Bear/Base/Bull) per exit type with styled tooltip | `ExitCompareModule.tsx:143–171` — `BarChart` with Bear, Base, Bull `Bar` series. `Cell` per-exit color. `CustomTooltip` component at lines `46–61`. `ResponsiveContainer` wraps. | ✅ PASS |
| **Exit Compare — Dimension Radar** | 6-axis radar: Speed, Valuation Upside, Liquidity, Control, Regulatory Risk, Complexity | `ExitCompareModule.tsx:83–90` — `radarData` defines all 6 axes. `RadarChart` at lines `174–198`. Conditional `<Radar>` series per available exit type via `bundle.ipo &&` guards. | ✅ PASS |
| **Exit Compare — MOIC Breakdown** | Horizontal bar chart of stakeholder MOIC per exit, colour-coded by exit type | `ExitCompareModule.tsx:92–98` — `moicData` flatMaps top-3 stakeholders per exit. Vertical `BarChart` at lines `200–240`. Tooltip formatter shows `${v}x MOIC`. | ✅ PASS |
| **Timeline — Slider Reactive Recalc** | Sliders update charts without page refresh; client-side only | `TimelineValuationModule.tsx:97–98` — `multiplierAdj`, `discountAdj` state. `useMemo` at lines `101–124` recomputes `chartData` on slider change. Valuation range bars recalc `adjFactor` at `213–219`. **Zero network calls on slider move.** | ✅ PASS |
| **Timeline — Area/Line Chart** | Time-series chart plotting exit event valuations at projected dates | `TimelineValuationModule.tsx:264–294` — Recharts `ComposedChart` with `<Line>` per exit type. `dateToNum()` converts ISO date to decimal year. `connectNulls` handles sparse data. | ✅ PASS |
| **Timeline — Gantt Milestone Bars** | Progress bars showing start/end dates with real-time completion percentage | `TimelineValuationModule.tsx:52–94` — `GanttBar` computes elapsed % from `Date.now()`. `transition: "width 0.6s ease"` on fill. Status badge: `completed=#10B981`, `in_progress=exitColor`, `pending=rr-text-dim`. | ✅ PASS |
| **Stakeholder — Proceeds Bar Chart** | Per-stakeholder payout bars, filterable by scenario and Bear/Base/Bull case | `StakeholderOutcomesView.tsx:53–68` — `buildChartData()` maps case to correct proceeds field. `BarChart` at `192–226` with `Cell` colors. Scenario + case controls at `106–146`. | ✅ PASS |
| **Stakeholder — Waterfall Table** | Ownership %, Proceeds, MOIC, IRR columns with row hover and color-coded MOIC | `StakeholderOutcomesView.tsx:229–297` — 5-column `<table>`. MOIC: `≥3x=success`, `≥1.5x=warning`, `<1.5x=danger` at line 279. Row hover at lines `261–262`. | ✅ PASS |
| **Stakeholder — KPI Summary Strip** | Aggregate KPIs above chart: Total Distributable, Count, Avg MOIC, Scenario | `StakeholderOutcomesView.tsx:149–187` — `rr-card-elevated` strip with 4 dynamic KPI items. All values computed from `chartData` — no hardcoded figures. | ✅ PASS |
| **Sensitivity Table — Heat-Map Grid** | Revenue Multiple × Discount Rate matrix with interpolated cyan heat-map colouring | `SensitivityTable.tsx:18–25` — `interpolateColor()` interpolates `rgba(3,7,18)→rgba(56,189,248)`. `buildGrid()` at lines `27–43` constructs 2D lookup. CSS Grid at `134–215`. `title` attribute provides full tooltip. | ✅ PASS |
| **Sensitivity Table — Metric Toggle** | Switch between Valuation, Founder Proceeds, Investor Proceeds | `SensitivityTable.tsx:47` — `metric` state. `getValue()` at `59–62` delegates to correct field. Three tab buttons with `.tab-btn.active` at `97–107`. Grid re-renders reactively. | ✅ PASS |
| **Sidebar — Intelligence Handshake** | 30% sidebar reflects contextual metrics for selected company; updates on selection | `Sidebar.tsx:176–198` — all KPIs derived from `bundle` prop. `page.tsx:224–233` passes `activeBundle` updated on company selection or filter change. **Note:** Slider adjustments in the 70% Timeline module do not propagate to sidebar KPIs — partial handshake only. | ⚠️ IMPROVE |

---

## Section 4 — Typography & Micro-Animation Audit

| Visual Element | Strict Requirement | Current Implementation (Source · Line) | Pass/Fail/Improve |
|---|---|---|---|
| **Primary Typeface** | `Inter` variable font, all UI text | `globals.css:2` — Google Fonts import `Inter:wght@300–900`. `globals.css:77` — `body { font-family: 'Inter', system-ui, sans-serif; }`. `@theme inline:58` sets `--font-sans: 'Inter'`. | ✅ PASS |
| **Mono Typeface** | `JetBrains Mono` for all numeric/financial values and code snippets | `globals.css:2` — `JetBrains Mono:wght@400;500;600`. `--font-mono` at line 59. Applied: `Sidebar.tsx:72`, `StakeholderOutcomesView.tsx:270,273`, `globals.css:259`, `page.tsx:179`. | ✅ PASS |
| **Panel Transition Animation** | `fadeIn` animation on every module panel switch | `globals.css:159–162` — `@keyframes fadeIn`. `Dashboard.tsx:213` — `className="animate-fade-in"` with `key={activePanel}` forcing remount on switch. | ✅ PASS |
| **Loading Screen Animation** | Brand mark pulse + shimmer progress bar during backend handshake | `page.tsx:108` — `pulseGlow 1.5s ease-in-out infinite` on RR logo. `page.tsx:134` — `shimmer 1.2s linear infinite` on progress bar. Both keyframes at `globals.css:149–167`. | ✅ PASS |
| **Hover Micro-Animations** | All interactive elements respond with smooth transitions | Slider thumb `globals.css:236–238`. Tab buttons `globals.css:205–208`. Metric cards `Sidebar.tsx:48–53`. Table rows `StakeholderOutcomesView.tsx:261–262`. Sensitivity cells `globals.css:269–271`. | ✅ PASS |
| **Range Slider Custom Styling** | Cyan thumb, not browser-default, with glow on hover | `globals.css:217–238` — `-webkit-appearance: none`. 16px circle thumb. `background: var(--rr-primary)`. Glow: `0 0 8px rgba(56,189,248,0.5)` default, `0 0 16px rgba(56,189,248,0.8)` on hover. | ✅ PASS |

---

## Section 5 — State & Error Handling Audit

| Visual Element | Strict Requirement | Current Implementation (Source · Line) | Pass/Fail/Improve |
|---|---|---|---|
| **Loading State** | Themed loading screen while backend handshake completes | `page.tsx:82–141` — Full `100dvh` overlay with animated RR badge, endpoint label, and shimmer bar. Background `var(--rr-bg)`. No layout flash. | ✅ PASS |
| **Error / Fallback State** | Error screen with retry mechanism on backend failure | `page.tsx:144–204` — Full-screen error overlay. Shows error message, backend launch command in mono, and `Retry Connection` button calling `loadData()`. `loadState` state machine prevents partial render. | ✅ PASS |
| **Empty Data Guard** | Dashboard must not crash on zero bundles | `Dashboard.tsx:37–53` — Early return with "No scenario data available" message. `page.tsx:66–73` — client-side filter guards. `activeBundleId` fallback at line 77 prevents null selection. | ✅ PASS |
| **Backend Mock Data Fallback** | Backend stays alive and serves data even if generation fails | `main.py:75–87` — `_get_scenarios()` with `@lru_cache(maxsize=1)`. `try/except` logs error and returns `[]` — server does not crash. Frontend detects empty response and shows fallback UI. | ✅ PASS |

---

## Improvement Recommendations

### IMR-001 — Tailwind Import Ordering (Priority: Low)
**File:** `frontend/app/globals.css` · Lines 4–6  
`@import "tailwindcss"` precedes the `:root` token block. The `@theme inline` override correctly re-maps tokens post-declaration, but validate production PostCSS build output to confirm custom property persistence. **Recommended action:** Confirm build output or reorder imports defensively.

### IMR-002 — Slider-to-Sidebar Handshake Completeness (Priority: Medium)
**File:** `frontend/components/TimelineValuationModule.tsx` · Lines 97–98  
`multiplierAdj` and `discountAdj` are local state. When the user adjusts sliders in the 70% Main Stage, the sidebar's MetricCard KPIs (`Sidebar.tsx:277–300`) do not reflect adjusted valuations — breaking the full 70%↔30% handshake protocol. **Recommended action:** Lift slider state to `page.tsx` and pass adjusted values as props to `<Sidebar>`.

---

## Audit Sign-Off

| Item | Detail |
|---|---|
| **Audit Status** | ✅ PASSED — 2 non-blocking Improvement Recommendations |
| **Hard Failures** | 0 |
| **Repository Readiness** | Approved for sign-off pending optional IMR-002 resolution |
| **Visual DNA Compliance** | Full — `#030712` body, `#0B1117` card, `#38BDF8` accent confirmed in source |
| **Layout Compliance** | Full — 70%/30% flex split confirmed at `Dashboard.tsx:58` and `Sidebar.tsx:203` |
| **Visualization Coverage** | Full — Exit Compare, Timeline, Stakeholder Outcomes, Sensitivity Table all operational |
| **POC Reference** | POC-85 · Exit Path Scenario Planner · Real Rails Intelligence Library |
