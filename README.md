# Exit Path Scenario Planner
### Real Rails Intelligence Library · POC-85 · Capital Formation Rail

> **Synthetic mock data only. Not investment advice. For demonstration purposes.**

---

## Executive Summary

The **Exit Path Scenario Planner** is a capital formation intelligence engine built for three audiences operating across the private-market liquidity cycle:

| Audience | What This Tool Does For Them |
|---|---|
| **Founders & Operators** | Reveals exactly which exit path maximises payout given their cap table structure, liquidation preferences, and hold timeline |
| **Allocators & LPs** | Translates raw ownership percentages into downstream liquidity reality — factoring waterfall mechanics, earn-outs, and secondary discounts |
| **Builders & Analysts** | Models sensitivity of exit outcomes to revenue multiple and discount rate shifts before committing to a path |

Most practitioners treat an "exit" as a singular future event. This platform reframes it as a **spectrum of structured liquidity instruments** — each with distinct valuation optionality, stakeholder payoffs, and regulatory burden:

- **IPO** — Public market listing with SEC/FINRA oversight, 180-day lock-ups, and maximum valuation upside
- **M&A** — Strategic acquisition with HSR/CFIUS review, board fiduciary triggers, and negotiated earn-outs
- **Secondary** — Private share transfer governed by ROFR waivers, Rule 144, and accredited investor requirements
- **Continuation Vehicle** — GP-led restructuring requiring LP consent thresholds, fairness opinions, and carry waterfall mechanics

The engine ingests synthetic financial profiles modelled on SEC EDGAR filing structures and Crunchbase funding round schemas, runs them through a FastAPI data pipeline, and surfaces them through a Next.js dashboard enforcing the **Real Rails Visual DNA** — Obsidian Black (`#030712`) ground, Electric Cyan (`#38BDF8`) signal layer, 70/30 split intelligence layout.

---

## Repository Structure

```
POC-85-ExitPathScenarioPlanner-Srikumari/
│
├── backend/
│   ├── main.py            # FastAPI app — all API routes
│   ├── schemas.py         # Pydantic data models (ExitScenarioBundle, etc.)
│   ├── adapters.py        # Synthetic data generation + CSV/JSON export
│   └── venv/              # Python virtual environment
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx       # Root page — layout orchestrator, state machine
│   │   ├── layout.tsx     # Next.js root layout, font loading
│   │   └── globals.css    # Real Rails design tokens, animations, utilities
│   ├── components/
│   │   ├── Dashboard.tsx          # 70% Main Stage — tab host
│   │   ├── Sidebar.tsx            # 30% Intelligence Sidebar
│   │   ├── ExitCompareModule.tsx  # Valuation bars, Radar, MOIC charts
│   │   ├── TimelineValuationModule.tsx  # Sliders, Gantt, Area chart
│   │   ├── StakeholderOutcomesView.tsx  # Waterfall bars and table
│   │   └── SensitivityTable.tsx   # Heat-map sensitivity grid
│   └── lib/
│       ├── api.ts         # Frontend API client (fetchScenarios, etc.)
│       └── types.ts       # TypeScript type definitions
│
├── VAR_REPORT.md          # Visualization Audit Review
├── UAT_CHECKLIST.md       # Functional UAT checklist (79 test cases)
└── README.md              # This file
```

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  SYNTHETIC DATA LAYER  (adapters.py)                            │
│                                                                 │
│  generate_all_scenarios(seed=42)                                │
│  ├── SEC EDGAR mock schemas   →  IPO filing structure           │
│  │   (S-1 ARR, raised, growth rate, projected IPO date)        │
│  ├── Crunchbase mock schemas  →  M&A / Secondary / Continuation │
│  │   (deal value, close date, ROFR status, LP consent)         │
│  ├── Sensitivity matrix       →  revenue_multiple × discount_rate│
│  └── Liquidation waterfall    →  per-stakeholder payout stack   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ ExitScenarioBundle (Pydantic)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  FastAPI PIPELINE  (main.py)                                    │
│                                                                 │
│  @lru_cache(maxsize=1)  →  warm scenario cache on first request │
│                                                                 │
│  GET /api/scenarios          →  ScenariosResponse (paginated)   │
│  GET /api/scenarios/{id}     →  Single ExitScenarioBundle       │
│  GET /api/sectors            →  Sector enum list                │
│  GET /api/sensitivity/{id}   →  Sensitivity table rows          │
│  GET /api/waterfall/{id}     →  Liquidation waterfall + stakes  │
│  GET /api/download-sample    →  JSON or CSV file export         │
│  GET /api/health             →  Structured health response      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/JSON over CORS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Next.js FRONTEND  (page.tsx → components)                      │
│                                                                 │
│  page.tsx  (state machine: loading | error | loaded)            │
│  ├── fetchScenarios() + fetchSectors()  [parallel Promise.all]  │
│  ├── Client-side asset class filter     [no re-fetch]           │
│  ├── Sector filter                      [triggers re-fetch]     │
│  │                                                              │
│  ├── Dashboard (flex: 0 0 70%)          [Main Stage]            │
│  │   ├── ExitCompareModule      ⚡      [Recharts Bar + Radar]  │
│  │   ├── TimelineValuationModule 📈     [Recharts Area + Gantt] │
│  │   ├── StakeholderOutcomesView 👥     [Recharts Bar + Table]  │
│  │   └── SensitivityTable        🔢    [CSS Grid heat-map]      │
│  │                                                              │
│  └── Sidebar (flex: 0 0 30%)           [Intelligence Sidebar]   │
│      ├── Section A: Core liquidity KPI cards                    │
│      ├── Section B: Why This Matters (collapsible)              │
│      ├── Section C: Who Controls the Rail (collapsible)         │
│      ├── Section D: Interactive filters (sector/timeline/class) │
│      └── Section E: Download sample data (JSON / CSV)           │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| `@lru_cache(maxsize=1)` on scenario generation | Synthetic data is deterministic (`seed=42`). Cache prevents regenerating 50+ bundles on every request. |
| Client-side asset class filter | Avoids a round-trip for a filter that operates on already-loaded bundle metadata. |
| Sector filter triggers re-fetch | Sector is a backend enum; filtering server-side reduces payload size for the active view. |
| `flex: "0 0 70%"` / `flex: "0 0 30%"` | Hard fixed-basis flex enforces the 70/30 split without grow/shrink drift at any viewport width. |
| `useMemo` on slider recalculation | Revenue multiple and discount rate adjustments are pure math — zero network cost, instant feedback. |
| `key={activePanel}` on panel container | Forces React to unmount/remount on tab switch, replaying the `animate-fade-in` keyframe cleanly. |

---

## Design System — Real Rails Visual DNA

All visual tokens are declared in `frontend/app/globals.css` and consumed via CSS custom properties throughout the component tree.

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--rr-bg` | `#030712` | Global body background (Obsidian Black) |
| `--rr-surface` | `#0B1117` | Card backgrounds (`.rr-card`) |
| `--rr-surface-2` | `#111827` | Elevated cards, table headers (`.rr-card-elevated`) |
| `--rr-primary` | `#38BDF8` | Electric Cyan — active states, KPI values, IPO series |
| `--rr-secondary` | `#818CF8` | Indigo — M&A series, secondary labels |
| `--rr-success` | `#10B981` | Emerald — Secondary series, positive MOIC, growth |
| `--rr-warning` | `#F59E0B` | Amber — Continuation series, mid-range MOIC |
| `--rr-danger` | `#EF4444` | Red — low MOIC, positive discount rate |
| `--rr-border` | `#1F2937` | Dividers, card borders, chart grid lines |
| `--rr-text` | `#F8FAFC` | Primary text (near-white) |
| `--rr-text-muted` | `#94A3B8` | Labels, axis ticks, secondary text |
| `--rr-text-dim` | `#475569` | Timestamps, footnotes, disabled states |

### Typography

| Font | Weight Range | Usage |
|---|---|---|
| **Inter** | 300–900 | All UI text — headings, labels, badges, buttons |
| **JetBrains Mono** | 400–600 | All financial values, KPIs, code snippets, sensitivity grid |

### Exit Path Chart Colour Mapping

| Exit Type | Colour | Hex |
|---|---|---|
| IPO | Electric Cyan | `#38BDF8` |
| M&A | Indigo | `#818CF8` |
| Secondary | Emerald | `#10B981` |
| Continuation Vehicle | Amber | `#F59E0B` |

---

## Feature Breakdown

### ⚡ Exit Compare Module (`ExitCompareModule.tsx`)

Renders three sub-views toggled by tab buttons:

**1. Valuation Range (default)**
- Recharts `BarChart` with grouped bars per exit type
- Three bars per group: Bear Case (40% opacity), Base Case (75% opacity), Bull Case (100% opacity)
- Custom tooltip shows `$xxxM` values with exit-colored swatches
- Data source: `bundle.{ipo|ma|secondary|continuation}.valuation.{bear|base|bull}_case_usd_m`

**2. Dimension Radar**
- Recharts `RadarChart` with 6 axes: Speed, Valuation Upside, Liquidity, Control, Regulatory Risk, Complexity
- One `<Radar>` polygon per available exit path, conditionally rendered
- Normalised scores (0–100) allow cross-path comparison on a single plane

**3. MOIC Breakdown**
- Horizontal `BarChart` (`layout="vertical"`)
- Top 3 stakeholders per exit type, labelled `"{ExitType} · {Stakeholder}"`
- X-axis formatted as `{n}x MOIC`
- Color-coded by exit type using the `EXIT_COLORS` constant

---

### 📈 Timeline & Valuation Module (`TimelineValuationModule.tsx`)

**Slider Controls**

| Slider | Range | Effect |
|---|---|---|
| Revenue Multiple Adj. | 0.50× – 1.50× (step 0.05×) | Multiplies all scenario base valuations proportionally |
| Discount Rate Adj. | −10pp – +10pp (step 1pp) | Applies a discount/premium to adjusted valuations |

Both sliders drive a `useMemo`-computed `chartData` array — **zero API calls on interaction**. The combined adjustment factor is:

```
adjFactor = multiplierAdj × (1 − discountAdj / 100)
adjustedValue = baseValue × adjFactor
```

**Valuation Spectrum Bars**

For each exit path, a horizontal bar displays the Bear-to-Bull range as a shaded region with a luminous marker line at the Base case position. All values reflect the live slider state.

**Exit Event Timeline Chart**

Recharts `ComposedChart` with `<Line>` series per exit type, plotted at their projected exit dates converted to decimal year values via `dateToNum()`. The `connectNulls` prop handles sparse multi-exit datasets.

**Gantt Milestone Bars**

Progress bars for IPO and M&A timeline milestones. Elapsed percentage computed from real-time `Date.now()` vs milestone start/end dates. Status badges: `completed` (Emerald), `in_progress` (exit color), `pending` (dim).

---

### 👥 Stakeholder Outcomes View (`StakeholderOutcomesView.tsx`)

**Scenario Selector** — Tab buttons for IPO / M&A / Secondary / Continuation (only available paths shown).

**Case Selector** — Bear 🐻 / Base ⚖️ / Bull 🐂 toggles that switch the active payout field:

| Case | Data Fields Used |
|---|---|
| Bear | `proceeds_bear_usd_m`, `moic_bear`, `irr_pct_bear` |
| Base | `proceeds_base_usd_m`, `moic_base`, `irr_pct_base` |
| Bull | `proceeds_bull_usd_m`, `moic_bull`, `irr_pct_bull` |

**KPI Summary Strip** — Four aggregate metrics computed live from `chartData`:
- Total Distributable (sum of all proceeds)
- Stakeholder count
- Average MOIC across all parties
- Active scenario label

**Proceeds Bar Chart** — Per-stakeholder horizontal bars, color-coded by stakeholder class via `getColor()` which pattern-matches stakeholder names to a curated palette with a hash-based fallback for novel names.

**Ownership & MOIC Data Table** — Five columns: Stakeholder, Ownership %, Proceeds ($M), MOIC, IRR. MOIC color rules: `≥3×` = Emerald, `≥1.5×` = Amber, `<1.5×` = Red.

---

### 🔢 Sensitivity Table (`SensitivityTable.tsx`)

A 2D heat-map grid mapping **Revenue Multiple** (rows) × **Discount Rate** (columns) to output values.

**Metric Toggle** — Three views on the same grid:
- **Valuation** — Company total valuation (`valuation_usd_m`)
- **Founder $** — Founder proceeds (`founder_proceeds_usd_m`)
- **Investor $** — Investor proceeds (`investor_proceeds_usd_m`)

**Heat-map Colouring** — `interpolateColor()` maps each cell's normalised value (0–1 within the grid's min–max range) to an RGB interpolation from `rgba(3,7,18,0.8)` (Obsidian near-black) to `rgba(56,189,248,0.45)` (Electric Cyan). High-value cells use `var(--rr-primary)` text with `font-weight: 700` for contrast.

**Cell Tooltips** — `title` attribute on every cell exposes all three metrics simultaneously: `Revenue Mx | Discount R% | Valuation $xxxM | Founder $xxxM | Investor $xxxM`.

**Scenario Selector** — Same IPO / M&A / Secondary / Continuation tabs as the Stakeholder view. Empty datasets render a graceful "No sensitivity data" placeholder.

---

### 🧠 Intelligence Sidebar (`Sidebar.tsx`)

**Section A — Core Liquidity KPIs**

Four `MetricCard` components in a 2-column grid:

| KPI | Formula |
|---|---|
| Base Valuation | First available `valuation.base_case_usd_m` across exit paths |
| ARR | `ipo.arr_usd_m` or `ma.arr_usd_m` |
| Revenue Multiple | `baseValuation / arr` |
| Return on Capital | `baseValuation / total_raised_usd_m` |

All values update when the active company changes. Cards glow on hover with an accent-colored `box-shadow`.

**Section B — Why This Matters** (collapsible `InfoBlock`)

Prose narrative explaining the exit spectrum for founders, allocators, and builders. Defaults to expanded; toggle chevron animates 180° on collapse.

**Section C — Who Controls the Rail** (collapsible `InfoBlock`)

Four rail entries with color-coded left borders and regulatory rule summaries:
- **IPO Rail** — SEC / FINRA + Underwriters (Cyan)
- **M&A Rail** — Board + Investment Banks (Indigo)
- **Secondary Rail** — Transfer Agent + Company Counsel (Emerald)
- **Continuation Vehicle** — GP / Fund Counsel + LP Advisory (Amber)

**Section D — Intelligence Filters**

| Filter | Mechanism | Scope |
|---|---|---|
| Sector | Triggers `GET /api/scenarios?sector={value}` re-fetch | Server-side |
| Exit Timeline | UI-only pill filter (no API wire in current PoC) | Client-side |
| Asset Class | Client-side `filteredBundles` array filter | Client-side |

Active filters render as dismissable badge pills with `✕` buttons.

**Section E — Data Export**

Calls `GET /api/download-sample?format={json|csv}&company_id={id}` via the `downloadSampleData()` API client function. Button cycles through three states: default → loading (spinner) → success (3-second auto-reset). Export includes all flattened bundle records from `flatten_bundle_for_export()` in `adapters.py`.

---

## API Reference

Base URL: `http://localhost:8000`

| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| `GET` | `/api/health` | — | Structured health check |
| `GET` | `/api/scenarios` | `sector`, `exit_type`, `limit`, `offset` | Paginated scenario bundles |
| `GET` | `/api/scenarios/{id}` | — | Single company full bundle |
| `GET` | `/api/scenarios/{id}/{type}` | — | Specific exit type (`ipo`\|`ma`\|`secondary`\|`continuation`) |
| `GET` | `/api/sectors` | — | Available sector enum list |
| `GET` | `/api/sensitivity/{id}` | `exit_type` | Revenue multiple × discount rate matrix |
| `GET` | `/api/waterfall/{id}` | `exit_type` | Liquidation waterfall + stakeholder outcomes |
| `GET` | `/api/download-sample` | `format` (`json`\|`csv`), `company_id` | File download of flattened dataset |

Interactive Swagger UI available at `http://localhost:8000/docs`.

---

## Deployment & Local Launch

### Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |

---

### Step 1 — Clone the Repository

```bash
git clone <repository-url>
cd POC-85-ExitPathScenarioPlanner-Srikumari
```

---

### Step 2 — Launch the Backend

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn pydantic

# Start the development server
uvicorn main:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     exit_planner | Scenario cache warm: 50 bundles loaded.
```

Verify at: `http://localhost:8000/api/health` → `{ "status": "ok" }`

---

### Step 3 — Launch the Frontend

Open a **new terminal** (keep the backend running):

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```

**Expected output:**
```
▲ Next.js 14.x
- Local: http://localhost:3000
- Ready in Xs
```

Open `http://localhost:3000` in your browser.

---

### Step 4 — Verify the Handshake

| Check | Expected Result |
|---|---|
| Loading screen appears | Animated RR badge + shimmer bar visible for ~1–2s |
| Main layout renders | 70% Dashboard + 30% Sidebar split visible |
| Company dropdown populated | ≥1 company visible in the `Company:` selector |
| Sidebar KPIs populated | Base Valuation, ARR, Revenue Multiple, Return on Capital show values |
| No console errors | Browser DevTools → Console shows zero uncaught errors |

---

### Environment Variables

No environment variables are required for local development. The frontend API client (`lib/api.ts`) targets `http://localhost:8000` by default. To point to a remote backend, set:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com
```

---

### Production Build (Optional)

```bash
# Frontend production bundle
cd frontend
npm run build
npm run start

# Backend production server (no --reload)
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

---

## Quality Assurance

| Document | Description |
|---|---|
| [`VAR_REPORT.md`](./VAR_REPORT.md) | Visualization Audit Review — 34 checks against Real Rails Visual DNA |
| [`UAT_CHECKLIST.md`](./UAT_CHECKLIST.md) | Functional UAT — 79 test cases across 13 modules |

**VAR Result:** 32 PASS · 2 IMPROVE · 0 FAIL  
**UAT Sign-off threshold:** 100% of 10 critical blockers must pass before repository sign-off.

---

## Regulatory & Data Disclaimer

All financial data in this application is **entirely synthetic**, generated deterministically via `adapters.py` with `seed=42`. It does not represent any real company, fund, or security. References to SEC EDGAR, Crunchbase, FINRA, HSR, or CFIUS are structural schema references only — no real data is fetched from any external source.

This tool is built for **demonstration and educational purposes** within the Real Rails Intelligence Library PoC programme. It does not constitute financial, legal, or investment advice.

---

*Real Rails Intelligence Library · Capital Formation Rail · POC-85*  
*Exit Path Scenario Planner · v1.0.0*
