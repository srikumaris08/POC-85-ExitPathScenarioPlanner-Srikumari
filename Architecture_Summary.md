# Technical Architecture Summary

## 1. System Design Overview
The Exit Path Scenario Planner (POC-85) is built upon a **fully decoupled, client-server architecture** designed to isolate analytical financial data manipulation from user interface rendering operations. 

* **Frontend UI Subsystem:** Structured using **Next.js 14+ (App Router Architecture)** and strict **TypeScript**, managing layout constraints, metric adjustments, and micro-interactions.
* **Backend Data Subsystem:** Powered by a high-performance **FastAPI (Python)** server coupled with a data processing layer to manage financial matrix filtration, multi-scenario tracking, and state management.

---

## 2. Decoupled Data Flow & Component Details

### A. Client-Server Communication Loop
1. **State Trigger:** The user interacts with the global dropdown menus or selects a specific transaction route tab in the dashboard header.
2. **Asynchronous Fetch Hook:** The React layer captures the state change and fires an asynchronous network request to the FastAPI backend using environment-decoupled variables:
   `GET http://localhost:8000/api/scenarios/{company_id}?exit_type={selectedScenario}`
3. **Dynamic Parameter Filtration:** The Python backend processes the selected mock dataset matrix matching the active company profile. It calculates corresponding waterfall layers, formats the metrics data, and routes a structured JSON payload response.
4. **Reactive State Update:** The Next.js client consumes the clean JSON data payload and updates its internal state arrays, refreshing the visual charts, timeline graphs, stakeholder distribution matrix rows, and sidebar telemetry indicators instantly.

### B. Core Component Specifications

* **Reactive State Manager:** Orchestrated via native React hooks (`useState` and `useMemo`). The system computes dynamic adjustments client-side to drive smooth sliding mechanics. It updates all interactive chart cards and synchronizes the right-hand sidebar text metadata blocks directly with the selected scenario state without visual blinking.
* **Dynamic Chart Workspace Stage:** Powered by responsive data visualization wrappers. This layer operates on an absolute bounding canvas system, allowing users to track multivariant bar graphs, multi-axis radar profiles, and timeline series dynamically with zero layout jitter.
* **Chromatically Synced Connections:** The visualization series, progress bars, and table highlights link specific financial paths together using explicit color tokens. Accent styles shift dynamically to match the originating exit type's visual track identity (IPO, M&A, Secondary, Continuation).
* **Scrollless Viewport Layout Constraints:** Styled using strict Tailwind CSS utility flags to lock the entire application layout layout structure within fixed screen bounds. The interface splits perfectly into a **70% wide main stage panel** and a **30% wide briefing sidebar**. This creates an absolute, optimized page context that ensures all 4 core analytical briefing panels are fully visible concurrently on a single screen without parent vertical page scrolling or accordion truncation.
