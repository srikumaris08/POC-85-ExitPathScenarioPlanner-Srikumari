# UAT_CHECKLIST.md — User Acceptance Testing Checklist
## Real Rails Quality & UAT Protocol · POC-85: Exit Path Scenario Planner
**Checklist Date:** 2026-06-25 | **Protocol:** Real Rails Functional UAT v1.0
**Repository:** `POC-85-ExitPathScenarioPlanner-Srikumari` | **Environment:** Local Dev — `http://localhost:3000` (Frontend) · `http://localhost:8000` (Backend)

---

## Pre-Flight Requirements

Before executing any test case, verify the following environment state:

| Requirement | Expected State |
|---|---|
| Backend running | `uvicorn main:app --reload --port 8000` active, no startup errors |
| Frontend running | `npm run dev` active, served on `http://localhost:3000` |
| `/api/health` response | HTTP 200 — `{ "status": "ok" }` |
| `/api/scenarios` response | HTTP 200 — array of `≥1` scenario bundles |
| Browser console | Zero uncaught JavaScript errors on initial load |

---

## Module 1 — Application Bootstrap & Loading State

| Test Case ID | Component | Action / Trigger Event | Expected System Behavior / Handshake | Status |
|---|---|---|---|---|
| UAT-001 | `page.tsx` — Loading Screen | Launch `http://localhost:3000` with backend running | Loading overlay renders on `#030712` background. Animated RR badge logo with `pulseGlow` animation visible. Shimmer progress bar animates left-to-right. Text reads "Loading Exit Path Scenarios…" with backend URL `http://localhost:8000`. | ⬜ Pending Verification |
| UAT-002 | `page.tsx` — Data Loaded Transition | Backend responds with scenario data | Loading screen disappears. 70%/30% split layout renders without flash. `<Dashboard>` and `<Sidebar>` visible simultaneously. First bundle auto-selected. No layout shift on transition. | ⬜ Pending Verification |
| UAT-003 | `page.tsx` — Error State | Launch with backend **offline** | Full-screen error overlay renders. ⚠️ icon visible. `"Backend Connection Failed"` heading shown. Error message string displayed. Backend launch command shown in monospace `JetBrains Mono` font. `"Retry Connection"` button visible and clickable. | ⬜ Pending Verification |
| UAT-004 | `page.tsx` — Retry Mechanism | Click `"Retry Connection"` button after backend comes online | `loadData()` re-invoked. Loading screen reappears. On successful backend response, transitions to main layout. No page reload required. | ⬜ Pending Verification |
| UAT-005 | `page.tsx` — State Machine Integrity | Observe DOM during all three states | Only one state renders at a time (loading OR error OR main layout). No simultaneous rendering of multiple states. | ⬜ Pending Verification |

---

## Module 2 — 70%/30% Layout Protocol Verification

| Test Case ID | Component | Action / Trigger Event | Expected System Behavior / Handshake | Status |
|---|---|---|---|---|
| UAT-006 | `Dashboard.tsx` + `Sidebar.tsx` | Inspect layout in browser DevTools on a 1440px wide screen | `<main>` element has computed `flex-basis: 70%`. `<aside>` element has computed `flex-basis: 30%`. `flex-shrink: 0` prevents compression. | ⬜ Pending Verification |
| UAT-007 | Layout — Divider Border | Visual inspection of the seam between 70% and 30% | Single 1px `var(--rr-border)` (#1F2937) line visible between Dashboard and Sidebar. No gap, no double border, no color bleed. | ⬜ Pending Verification |
| UAT-008 | Layout — Viewport Lock | Scroll on the root `<body>` element | Root document does not scroll. `overflow: hidden` on `html` and `body` elements confirmed. Internal panels scroll independently. | ⬜ Pending Verification |
| UAT-009 | Layout — Internal Scroll Isolation | Scroll within the sidebar section list | Sidebar sections scroll internally via `overflowY: "auto"`. Dashboard layout does not shift. Page background remains static. | ⬜ Pending Verification |

---

## Module 3 — Company Selection & 70%↔30% Handshake

| Test Case ID | Component | Action / Trigger Event | Expected System Behavior / Handshake | Status |
|---|---|---|---|---|
| UAT-010 | `Dashboard.tsx` — Company Selector (`#company-selector`) | Open the `Company:` dropdown in the 70% stage header and select a different company | **Handshake:** `onSelectId` callback fires. `activeBundle` in `page.tsx` updates. `<Sidebar>` receives new `bundle` prop. Sidebar KPI cards (Base Valuation, ARR, Rev. Multiple, Return on Capital) update with the new company's values. Company name in sidebar updates. Exit path badges update. | ⬜ Pending Verification |
| UAT-011 | `Dashboard.tsx` — Company Header Update | Select any company from the dropdown | Company name in `<h1>` in Dashboard header updates. Sector badge updates. Exit path badges (IPO/M&A/Secondary/Continuation) update to reflect available paths for the selected company. ARR, Raised, Growth stat pills update. | ⬜ Pending Verification |
| UAT-012 | `page.tsx` — Active Bundle Fallback | Apply an Asset Class filter that excludes the currently selected company | `activeBundleId` gracefully falls back to `filteredBundles[0]?.company_id`. No null pointer error. Sidebar shows the first matching company's data. Dashboard shows first matching company. | ⬜ Pending Verification |

---

## Module 4 — Intelligence Filters (Sidebar Section D)

| Test Case ID | Component | Action / Trigger Event | Expected System Behavior / Handshake | Status |
|---|---|---|---|---|
| UAT-013 | `Sidebar.tsx` — Sector Filter (`#filter-sector`) | Select a specific sector from the Sector dropdown (e.g., "FinTech") | `onSectorChange` fires. `page.tsx` `loadData(sector)` called with new sector parameter. `GET /api/scenarios?sector=FinTech` request fires. `<Dashboard>` company dropdown repopulates with filtered companies. No full page reload. | ⬜ Pending Verification |
| UAT-014 | `Sidebar.tsx` — Sector Filter Reset | Select "All Sectors" from the Sector dropdown | `onSectorChange("")` fires. Full dataset reloads. All companies restored in dropdown. Active filter pill for sector disappears from sidebar. | ⬜ Pending Verification |
| UAT-015 | `Sidebar.tsx` — Asset Class Filter (`#filter-asset-class`) | Select "IPO" from the Exit Path / Asset Class dropdown | `onAssetClassChange("IPO")` fires. `filteredBundles` client-side filter applied. Only companies with `bundle.ipo !== null` appear in dropdown. Companies without IPO path excluded. No API call — pure client-side filter. | ⬜ Pending Verification |
| UAT-016 | `Sidebar.tsx` — Asset Class Filter: M&A | Select "M&A" from the Asset Class dropdown | Only companies with `bundle.ma !== null` appear in dropdown. `filteredBundles` reflects M&A-only selection. | ⬜ Pending Verification |
| UAT-017 | `Sidebar.tsx` — Asset Class Filter: Secondary | Select "Secondary" from the Asset Class dropdown | Only companies with `bundle.secondary !== null` appear in dropdown. | ⬜ Pending Verification |
| UAT-018 | `Sidebar.tsx` — Asset Class Filter: Continuation Vehicle | Select "Continuation Vehicle" from the Asset Class dropdown | Only companies with `bundle.continuation !== null` appear in dropdown. | ⬜ Pending Verification |
| UAT-019 | `Sidebar.tsx` — Active Filter Pills | Apply any active filter (sector, timeline, or asset class) | Corresponding filter pill appears in the sidebar filter section. Pill displays the active filter value with a `✕` dismiss button. | ⬜ Pending Verification |
| UAT-020 | `Sidebar.tsx` — Filter Pill Dismiss | Click `✕` on any active filter pill | Corresponding filter resets to default. Pill disappears. Dataset updates accordingly. No page reload. | ⬜ Pending Verification |
| UAT-021 | `Sidebar.tsx` — Timeline Filter (`#filter-timeline`) | Select "12–24 months" from Exit Timeline dropdown | `onTimelineChange("12–24 months")` fires. Timeline filter pill appears. Note: Timeline filter is UI-only in current implementation; backend filtering by timeline is not yet wired. Pill renders correctly. | ⬜ Pending Verification |

---

## Module 5 — Exit Compare Module (⚡ Panel)

| Test Case ID | Component | Action / Trigger Event | Expected System Behavior / Handshake | Status |
|---|---|---|---|---|
| UAT-022 | `ExitCompareModule.tsx` — Panel Activation | Click the "⚡ Exit Compare" tab in Dashboard | Panel switches to Exit Compare. `animate-fade-in` CSS animation triggers (0.3s fade). No layout flash. ExitCompareModule renders with Valuation Range chart as default view. | ⬜ Pending Verification |
| UAT-023 | `ExitCompareModule.tsx` — Valuation Range Chart | Observe the default "Valuation Range" sub-tab | Recharts `BarChart` renders Bear/Base/Bull grouped bars per available exit type. Color-coded per `EXIT_COLORS` constant (IPO=Cyan, M&A=Indigo, Secondary=Green, Continuation=Amber). Y-axis shows `$xxxM` format. | ⬜ Pending Verification |
| UAT-024 | `ExitCompareModule.tsx` — Chart Tooltip | Hover over any bar in the Valuation Range chart | Custom `CustomTooltip` overlay renders in `rr-card-elevated` style. Shows exit name label and Bear/Base/Bull values in `$xxxM` format with color swatches. Background matches `var(--rr-surface)` theme. | ⬜ Pending Verification |
| UAT-025 | `ExitCompareModule.tsx` — Dimension Radar Tab | Click "Dimension Radar" sub-tab button | View switches to `RadarChart`. Six axes visible: Speed, Valuation Upside, Liquidity, Control, Regulatory Risk, Complexity. Radar series rendered only for exit types present in the selected company bundle. | ⬜ Pending Verification |
| UAT-026 | `ExitCompareModule.tsx` — MOIC Breakdown Tab | Click "MOIC Breakdown" sub-tab button | View switches to horizontal `BarChart`. Top 3 stakeholders per exit type shown. Y-axis shows stakeholder labels. X-axis shows `x` MOIC format. Color-coded per exit type. | ⬜ Pending Verification |
| UAT-027 | `ExitCompareModule.tsx` — Legend Pills | Observe legend below sub-tab controls | Color swatch + exit type name pills display for each available exit path. Renders conditionally for available paths only. | ⬜ Pending Verification |

---

## Module 6 — Timeline & Valuation Module (📈 Panel)

| Test Case ID | Component | Action / Trigger Event | Expected System Behavior / Handshake | Status |
|---|---|---|---|---|
| UAT-028 | `TimelineValuationModule.tsx` — Panel Activation | Click "📈 Timeline & Valuation" tab | Panel animates in. Slider controls, valuation spectrum bars, area chart, and Gantt bars all render. No blank sections. | ⬜ Pending Verification |
| UAT-029 | `TimelineValuationModule.tsx` — Revenue Multiple Slider | Drag the "Revenue Multiple Adj." slider from 1.0× to 1.5× | Label updates in real-time to show `1.50×`. Valuation spectrum bars widen. Area chart line values update. **No API call made — pure client-side `useMemo` recalculation.** Update is smooth with no flicker. | ⬜ Pending Verification |
| UAT-030 | `TimelineValuationModule.tsx` — Discount Rate Slider | Drag the "Discount Rate Adj." slider to +5pp | Label updates to `+5pp` in `var(--rr-danger)` color. Valuation spectrum bars narrow. Bear/Base/Bull values in the spectrum section decrease proportionally. | ⬜ Pending Verification |
| UAT-031 | `TimelineValuationModule.tsx` — Slider Range Limits | Drag Revenue Multiple slider to each extreme | Minimum clamps at `0.50×`. Maximum clamps at `1.50×`. Values do not exceed these bounds. | ⬜ Pending Verification |
| UAT-032 | `TimelineValuationModule.tsx` — Discount Slider Limits | Drag Discount Rate slider to each extreme | Minimum is `-10pp` (shown in `var(--rr-success)` green). Maximum is `+10pp` (shown in `var(--rr-danger)` red). Label changes color appropriately at positive/negative threshold. | ⬜ Pending Verification |
| UAT-033 | `TimelineValuationModule.tsx` — Valuation Spectrum Bars | Observe spectrum bars for all available exit types | Each exit type shows a horizontal spectrum bar with Bear-to-Bull range shaded. A marker line indicates the Base case position. Values displayed as `$bearM — $baseM — $bullM`. | ⬜ Pending Verification |
| UAT-034 | `TimelineValuationModule.tsx` — Area/Line Chart | Observe the exit event timeline chart | `ComposedChart` renders one `<Line>` per available exit type. Line colors match `EXIT_COLORS`. Dots appear at projected exit date positions. Tooltip shows values on hover. | ⬜ Pending Verification |
| UAT-035 | `TimelineValuationModule.tsx` — Gantt Milestone Bars | Observe Gantt bars below timeline chart | Progress bars for each milestone show correct elapsed percentage based on today's date. Status badge renders with appropriate color (completed=green, in_progress=exit color, pending=dim). | ⬜ Pending Verification |

---

## Module 7 — Stakeholder Outcomes Module (👥 Panel)

| Test Case ID | Component | Action / Trigger Event | Expected System Behavior / Handshake | Status |
|---|---|---|---|---|
| UAT-036 | `StakeholderOutcomesView.tsx` — Panel Activation | Click "👥 Stakeholder Outcomes" tab | Panel animates in. KPI summary strip, bar chart, and data table all visible. | ⬜ Pending Verification |
| UAT-037 | `StakeholderOutcomesView.tsx` — Scenario Switch | Click between IPO / M&A / Secondary / Continuation scenario tabs | Chart data and table rows update to reflect stakeholder outcomes for the selected exit path. KPI values (Total Distributable, Avg MOIC) recalculate. Active tab highlighted with `.tab-btn.active` class. | ⬜ Pending Verification |
| UAT-038 | `StakeholderOutcomesView.tsx` — Bear/Base/Bull Toggle | Click "Bear 🐻", "Base ⚖️", or "Bull 🐂" buttons | Proceeds bar heights change. Table Proceeds and MOIC columns update to reflect the selected case. Button border/background changes to match case color (Bear=red, Base=cyan, Bull=green). | ⬜ Pending Verification |
| UAT-039 | `StakeholderOutcomesView.tsx` — KPI Summary Strip | Observe KPI cards after switching scenario | "Total Distributable" shows sum of all stakeholder proceeds. "Stakeholders" shows count. "Avg. MOIC" shows average across all stakeholders. "Scenario" shows active scenario name. All values dynamic. | ⬜ Pending Verification |
| UAT-040 | `StakeholderOutcomesView.tsx` — MOIC Color Coding | Observe MOIC column in the data table | MOIC ≥ 3× displayed in `var(--rr-success)` (#10B981). MOIC ≥ 1.5× displayed in `var(--rr-warning)` (#F59E0B). MOIC < 1.5× displayed in `var(--rr-danger)` (#EF4444). | ⬜ Pending Verification |
| UAT-041 | `StakeholderOutcomesView.tsx` — Row Hover | Hover over any row in the stakeholder data table | Row background transitions to `var(--rr-surface-2)` (#111827) smoothly. Reverts on mouse leave. No layout shift. | ⬜ Pending Verification |

---

## Module 8 — Sensitivity Table Module (🔢 Panel)

| Test Case ID | Component | Action / Trigger Event | Expected System Behavior / Handshake | Status |
|---|---|---|---|---|
| UAT-042 | `SensitivityTable.tsx` — Panel Activation | Click "🔢 Sensitivity Table" tab | Panel animates in. Heat-map grid renders. Color legend bar visible. Scenario and metric tabs visible. | ⬜ Pending Verification |
| UAT-043 | `SensitivityTable.tsx` — Heat-Map Rendering | Observe the sensitivity grid | Grid cells display interpolated background colors from near-black (`#030712`) to Electric Cyan (`#38BDF8`). Higher values appear brighter. Cell text color shifts for contrast (high values = `var(--rr-primary)`). | ⬜ Pending Verification |
| UAT-044 | `SensitivityTable.tsx` — Cell Tooltip | Hover over any cell in the sensitivity grid | Browser native `title` tooltip shows: `Revenue Mx | Discount R% | Valuation $xxxM | Founder $xxxM | Investor $xxxM`. All three values shown regardless of active metric toggle. | ⬜ Pending Verification |
| UAT-045 | `SensitivityTable.tsx` — Metric Toggle (Valuation) | Click the "Valuation" metric tab button | Grid cell values show company valuation figures `$xxxM`. Color gradient reflects valuation range. Footer legend confirms "Company Valuation". | ⬜ Pending Verification |
| UAT-046 | `SensitivityTable.tsx` — Metric Toggle (Founder $) | Click the "Founder $" metric tab button | Grid cell values switch to founder proceeds figures. Color gradient recalculates for new value range. Footer confirms "Founder Proceeds". | ⬜ Pending Verification |
| UAT-047 | `SensitivityTable.tsx` — Metric Toggle (Investor $) | Click the "Investor $" metric tab button | Grid cell values switch to investor proceeds figures. Color gradient recalculates. Footer confirms "Investor Proceeds". | ⬜ Pending Verification |
| UAT-048 | `SensitivityTable.tsx` — Scenario Switch | Click between IPO / M&A / Secondary / Continuation tabs | Grid repopulates with sensitivity data for the selected exit type. If no sensitivity data exists for the selected scenario, "No sensitivity data for [Scenario]" placeholder renders gracefully. | ⬜ Pending Verification |
| UAT-049 | `SensitivityTable.tsx` — Grid Scroll | Scroll within the sensitivity grid on smaller viewports | Grid scrolls within its container without breaking the 70%/30% layout split. Row/column headers remain readable. | ⬜ Pending Verification |

---

## Module 9 — Sidebar Intelligence Sections (B & C)

| Test Case ID | Component | Action / Trigger Event | Expected System Behavior / Handshake | Status |
|---|---|---|---|---|
| UAT-050 | `Sidebar.tsx` — "Why This Matters" Block | Observe Section B on initial load | `InfoBlock` renders with 💡 icon, title in `var(--rr-primary)` color, and prose content visible by default (`open=true`). | ⬜ Pending Verification |
| UAT-051 | `Sidebar.tsx` — Collapsible InfoBlock Toggle | Click the "Why This Matters" or "Who Controls the Rail" section header | Section collapses with `▾` chevron rotating 180° via CSS `transform: rotate`. Content disappears with `animate-fade-in`. Click again to expand. No height transition jank. | ⬜ Pending Verification |
| UAT-052 | `Sidebar.tsx` — "Who Controls the Rail" Block | Observe Section C | Four exit rail items render: IPO Rail, M&A Rail, Secondary Rail, Continuation Vehicle. Each has correct color-coded left border. Controller name and regulatory rule displayed per rail. | ⬜ Pending Verification |
| UAT-053 | `Sidebar.tsx` — Metric Card Hover | Hover over any KPI MetricCard in Section A | Box shadow injects with matching accent color via `onMouseEnter`. Reverts on `onMouseLeave`. Transition is smooth (0.2s ease). | ⬜ Pending Verification |

---

## Module 10 — Data Export Functionality

| Test Case ID | Component | Action / Trigger Event | Expected System Behavior / Handshake | Status |
|---|---|---|---|---|
| UAT-054 | `Sidebar.tsx` — Format Toggle (JSON) | Click the "JSON" format button in Section E | JSON button border changes to `var(--rr-primary)`. Background changes to `rgba(56,189,248,0.1)`. CSV button reverts to unselected state. | ⬜ Pending Verification |
| UAT-055 | `Sidebar.tsx` — Format Toggle (CSV) | Click the "CSV" format button | CSV button activates. JSON button deactivates. Format selection reflected in the endpoint preview URL below. | ⬜ Pending Verification |
| UAT-056 | `Sidebar.tsx` — Download Button (`#download-sample-btn`) | Click "⬇ Download JSON Sample" with JSON selected and backend running | Button enters loading state: spinner animation visible, text reads "Fetching from backend…", button disabled. After 800ms simulated delay, button shows "✅ Download complete!". File name displayed below button. | ⬜ Pending Verification |
| UAT-057 | `Sidebar.tsx` — Download Success State Reset | Observe button 3 seconds after download completes | Button reverts from success state back to default "⬇ Download JSON Sample" state. `dlSuccess` auto-resets via `setTimeout`. | ⬜ Pending Verification |
| UAT-058 | Backend — `/api/download-sample` Endpoint | Direct browser navigation to `http://localhost:8000/api/download-sample?format=json` | Backend responds with HTTP 200. Response is a valid JSON file with `Content-Disposition: attachment; filename=exit_path_sample_data.json`. `record_count` field present. `records` array populated. | ⬜ Pending Verification |
| UAT-059 | Backend — CSV Download | Direct navigation to `http://localhost:8000/api/download-sample?format=csv` | Backend responds with `text/csv` content type. `Content-Disposition: attachment; filename=exit_path_sample_data.csv`. CSV rows contain flattened bundle data. | ⬜ Pending Verification |
| UAT-060 | Backend — Company-Filtered Download | Navigate to `/api/download-sample?format=json&company_id={any_valid_id}` | Response contains only records for the specified company. `record_count` reflects filtered set. | ⬜ Pending Verification |

---

## Module 11 — Backend API Contract Verification

| Test Case ID | Component | Action / Trigger Event | Expected System Behavior / Handshake | Status |
|---|---|---|---|---|
| UAT-061 | `main.py` — Health Check | `GET http://localhost:8000/api/health` | HTTP 200. `HealthResponse` schema returned. `status: "ok"` present. | ⬜ Pending Verification |
| UAT-062 | `main.py` — All Scenarios | `GET http://localhost:8000/api/scenarios` | HTTP 200. `ScenariosResponse` with `count` and `scenarios` array. `count ≥ 1`. Each bundle has `company_id`, `company_name`, `sector` fields. | ⬜ Pending Verification |
| UAT-063 | `main.py` — Sector Filter | `GET /api/scenarios?sector=FinTech` | Only bundles with `sector == "FinTech"` returned. Empty array if no match — no 500 error. | ⬜ Pending Verification |
| UAT-064 | `main.py` — Single Bundle | `GET /api/scenarios/{valid_company_id}` | HTTP 200. Full `ExitScenarioBundle` returned with all available exit path objects. | ⬜ Pending Verification |
| UAT-065 | `main.py` — 404 on Bad ID | `GET /api/scenarios/nonexistent_id` | HTTP 404. Error detail includes "not found" and lists valid IDs. | ⬜ Pending Verification |
| UAT-066 | `main.py` — Sensitivity Endpoint | `GET /api/sensitivity/{valid_id}?exit_type=ipo` | HTTP 200. `sensitivity_table` array with `revenue_multiple`, `discount_rate_pct`, `valuation_usd_m`, `founder_proceeds_usd_m`, `investor_proceeds_usd_m` fields. | ⬜ Pending Verification |
| UAT-067 | `main.py` — Waterfall Endpoint | `GET /api/waterfall/{valid_id}?exit_type=ipo` | HTTP 200. `waterfall` and `stakeholder_outcomes` arrays present with correct schema fields. | ⬜ Pending Verification |
| UAT-068 | `main.py` — Sectors List | `GET /api/sectors` | HTTP 200. `{ "sectors": [...] }` with string array of sector names. | ⬜ Pending Verification |

---

## Module 12 — Edge Case & Fallback Verification

| Test Case ID | Component | Action / Trigger Event | Expected System Behavior / Handshake | Status |
|---|---|---|---|---|
| UAT-069 | `page.tsx` — Backend Offline on Load | Start frontend with backend **not running**, open app | Error state renders correctly. No JavaScript crash. Error message contains the specific error string or the default fallback message. `"Retry Connection"` button functional. | ⬜ Pending Verification |
| UAT-070 | `main.py` — Server Resilience on Generation Failure | Simulate adapter failure (e.g., force exception in `generate_all_scenarios`) | `_get_scenarios()` catches exception, logs error, returns `[]`. Server remains alive. `GET /api/scenarios` returns `{ "count": 0, "scenarios": [] }` with HTTP 200 — not a 500 crash. | ⬜ Pending Verification |
| UAT-071 | `Dashboard.tsx` — Empty Bundles Guard | Backend returns `scenarios: []` | Dashboard renders "No scenario data available." message. `<code>http://localhost:8000</code>` hint visible. No null pointer exception. No blank white screen. | ⬜ Pending Verification |
| UAT-072 | `StakeholderOutcomesView.tsx` — Missing Scenario Data | Select a scenario type (e.g., Secondary) on a company that has no Secondary exit | Tab button for missing exit type is not rendered (`availableScenarios` filter excludes it). No crash. UI gracefully shows only available scenario tabs. | ⬜ Pending Verification |
| UAT-073 | `SensitivityTable.tsx` — Empty Sensitivity Data | Active scenario has no sensitivity rows | Grid area replaced with: `"No sensitivity data for [Scenario]"` message in `var(--rr-text-muted)` color. Centered vertically. No grid renders. | ⬜ Pending Verification |
| UAT-074 | `ExitCompareModule.tsx` — Single Exit Bundle | Select a company with only 1 exit path available | Valuation bar chart shows only one bar group. Radar chart renders only one series polygon. MOIC chart shows rows only for available exit. No empty bar artefacts for missing paths. | ⬜ Pending Verification |
| UAT-075 | Asset Class Filter — All Companies Excluded | Apply an asset class filter where no company qualifies | `filteredBundles` returns empty array. `activeBundleId` falls back to `""`. `activeBundle` is `null`. Sidebar receives `bundle={null}`. Sidebar renders without crashing (handles `null` bundle in `Sidebar.tsx:176–198`). | ⬜ Pending Verification |

---

## Module 13 — Cross-Browser & Visual Fidelity

| Test Case ID | Component | Action / Trigger Event | Expected System Behavior / Handshake | Status |
|---|---|---|---|---|
| UAT-076 | Global — Font Rendering | Load application in Chrome/Edge | `Inter` font loaded from Google Fonts. No system font fallback visible. `-webkit-font-smoothing: antialiased` active. Text is crisp. | ⬜ Pending Verification |
| UAT-077 | Global — Custom Scrollbar | Scroll in any panel | Custom 5px scrollbar visible (not browser-default). Track: `var(--rr-bg)`. Thumb: `var(--rr-border)`. Thumb hover: `var(--rr-text-dim)`. | ⬜ Pending Verification |
| UAT-078 | Global — Color Accuracy | Use browser DevTools color picker on body background | Computed background-color on `body` reads exactly `#030712` (Obsidian Black). | ⬜ Pending Verification |
| UAT-079 | Global — Chart Responsiveness | Resize browser window | Recharts `ResponsiveContainer` adapts chart dimensions. No chart overflow. No horizontal scroll on the 70% panel. | ⬜ Pending Verification |

---

## UAT Sign-Off Summary

| Item | Detail |
|---|---|
| **Total Test Cases** | 79 |
| **Modules Covered** | 13 |
| **Status at Checklist Creation** | All cases: ⬜ Pending Verification |
| **Pass Threshold for Sign-Off** | 100% of UAT-001–UAT-075 (core functional) · 80% of UAT-076–UAT-079 (visual fidelity) |
| **Critical Blockers (fail = no sign-off)** | UAT-001, UAT-003, UAT-006, UAT-010, UAT-013, UAT-015, UAT-029, UAT-069, UAT-070, UAT-071 |
| **Sign-Off Authority** | QA Lead · Real Rails Intelligence Library |
| **POC Reference** | POC-85 · Exit Path Scenario Planner |

### Status Legend

| Symbol | Meaning |
|---|---|
| ⬜ Pending Verification | Test not yet executed |
| ✅ Pass | Test executed and passed |
| ❌ Fail | Test executed and failed — raise issue before sign-off |
| ⚠️ Partial | Test partially passed — document deviation |
| 🔄 Blocked | Cannot execute — dependency unresolved |
