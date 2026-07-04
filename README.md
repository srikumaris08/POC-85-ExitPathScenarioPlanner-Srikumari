# Exit Path Scenario Planner (POC-85)

A high-fidelity, interactive frontend prototype designed to visualize and track simulated institutional capitalization exit trajectories and preference stack payouts under varying market conditions.

> This application is a client-side Proof of Concept (PoC) built to demonstrate user interaction quality, dashboard storytelling, and visual identity. It operates entirely on static mock data pipelines and does not require active database configurations or external API integrations.

---

## Project Intent
This system serves as an **Interactive Financial Modeling Dashboard** prototype for analysts, founders, and institutional allocators. Instead of creating transaction entries, its purpose is to stress-test and study capitalization structures *before* or *during* strategic exit evaluations. By tracking equity distribution dynamics across varying exit mechanisms ("The Rails"), users can isolate specific stakeholder proceeds, evaluate liquidation preferences, and export structural scenarios for targeted strategic planning.

---

## Core Features & Requirements

* **Multi-Incident Scenario Selector:** A dropdown menu that lets you instantly swap the entire data environment between different corporate profiles and sectors (e.g., Enterprise Software vs. FinTech).
* **Interactive Timeline Slider:** Move the scrubber to adjust dynamic adjustment variables (Revenue Multiple, Discount Rate) and watch how valuations recalculate across channels smoothly in real-time.
* **Dynamic Content Scoreboard:** Tracks base valuations, exit dates, and stakeholder return metrics in real-time, completely synchronized with the active scenario data specs.
* **Custom Social App Nodes:** Built on top of a 2D canvas matching specific asset class tracks (IPO, M&A, Secondary, Continuation) so you can visually isolate where transaction values distribute.
* **Top-Level KPI Analytics Grid:** High-visibility structured cards at the top of the sidebar that dynamically capture and display critical tracking metrics (Base Valuation, ARR, Rev. Multiple, and Return on Capital).
* **Node Propagation Spread Timeline:** A high-visibility bar chart explicitly color-matched with your slate design signature (`#647d8b`). Formatted with a clean, vertical **CHANNELS** Y-axis indicator and an X-axis tracking discovery benchmarks.
* **Ingestion Decay Half-Life Curves:** An analytical vector line graph visualizing the mathematical exponential decay trajectories calculated by the Python engine. Features explicit path mappings for Scenario A vs. Scenario B alongside an explicit vertical **VELOCITY %** Y-axis metric.
* **Live System Terminal Ticker Log:** An anchored, screen-stabilized scrolling log monitor printing real-time structural routing modifications as timeline milestones execute.
* **One-Click Data Export:** Instantly download the active cascade event dataset to your machine as a clean data file (`.json`).
* **Live System Terminal Ticker:** A scrolling log monitor printing real-time alerts as events unfold, featuring high-contrast amber text for critical milestones.
* **One-Click Data Export:** Instantly download the active cascade event dataset to your machine as a clean data file (`.json`).

---

## Tech Stack
* **Frontend UI Layer:** Next.js 14+ (App Router Architecture), TypeScript, Tailwind CSS
* **Graph Canvas Engine:** `@xyflow/react` (React Flow)
* **Backend API Layer:** FastAPI (Python)
* **Data Processing Framework:** Pandas

---

## Getting Started

This application operates using a decoupled Client-Server architecture. You will need to spin up both the Python backend and the Next.js frontend in separate terminal windows.

### 1. Setup Backend API (Python & Pandas)
Navigate to your backend directory, install the required libraries, and boot your server instance:
```bash
# Install Python dependencies
pip install fastapi uvicorn pandas

# Start the local API server
uvicorn main:app --reload --port 8000
```
### 2.Start the application
```bash
npm run dev
```
### 2. Setup Frontend Workspace (Next.js & React Flow)
Open a separate terminal window, change into your frontend workspace folder, and run:
#### Install Node modules
```bash
npm install
```

#### Run the development compilation engine
```bash
npm run dev
```
### 3. Access the Dashboard
Open your web browser and navigate to:

http://localhost:3000

### Repository Structure Checklist
Ensure your branch includes the following required verification artifacts prior to push:

* Live Frontend Interface (app/page.tsx)

* High-Performance Data Backend (main.py)

* VAR_REPORT.md (Gate 1 — Visualization Audit Review PASS)

* UAT_CHECKLIST.md (Gate 2 — User Acceptance Testing sign-off)

* Architecture_Summary.md (Documented system decoupled data flows)

* README.md (This file)
