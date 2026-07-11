"use client";

/**
 * GeospatialExitMap.tsx — Exit Path Scenario Planner
 * Real Rails Intelligence Library · Rail: Capital Formation
 * ─────────────────────────────────────────────────────────
 * A fully-typed react-leaflet map component rendered on a
 * CartoDB Dark Matter tile layer so it blends seamlessly into
 * the Obsidian-Black (#030712) visual DNA.
 *
 * Data Flow (live API — no hardcoded arrays)
 * ───────────────────────────────────────────
 * On mount, a useEffect() calls GET /api/map-pins on the FastAPI backend.
 * The response is bound directly to component state so every map marker,
 * tooltip, and popup reflects the records in company_data.json in real time.
 *
 * Features
 * ──────────
 * • Dark-Matter base tiles (open-source, no API key required)
 * • Custom SVG div-icons coloured by exit-type (Cyan / Indigo /
 *   Emerald / Amber) matching the DNA chart-colour tokens
 * • Animated pulse ring on each marker via CSS keyframe
 * • Tooltip on hover showing company name, sector & exit type
 * • Popup on click with full financial headline (ARR, valuation)
 * • fitBounds auto-centering so all markers are always visible
 * • Fully SSR-safe: the component never runs during Next.js
 *   server rendering (Leaflet requires a DOM)
 *
 * Usage
 * ──────
 * // In any Client Component or page:
 * import dynamic from "next/dynamic";
 * const GeospatialExitMap = dynamic(
 *   () => import("@/components/GeospatialExitMap"),
 *   { ssr: false }
 * );
 * <GeospatialExitMap height="420px" />
 */

import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Popup,
  useMap,
} from "react-leaflet";
import L, { LatLngBoundsExpression, LatLngTuple } from "leaflet";

// ── Leaflet default-icon fix for webpack/Next.js bundlers ────────────────────
// Leaflet resolves its default marker images at runtime via a broken path when
// bundled with webpack. We override the icon prototype once at module level.
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Exit-type colour map (matches globals.css DNA tokens) ────────────────────
const EXIT_COLORS: Record<string, string> = {
  "IPO":                    "#38BDF8", // Electric Cyan  — --chart-ipo
  "M&A":                    "#818CF8", // Indigo         — --chart-ma
  "Secondary":              "#10B981", // Emerald        — --chart-secondary
  "Continuation Vehicle":   "#F59E0B", // Amber          — --chart-continuation
};

// ── Map pin type — mirrors the /api/map-pins response shape ─────────────────
export interface CompanyPin {
  id:            string;
  name:          string;
  sector:        string;
  stage:         string;
  city:          string;
  lat:           number;
  lng:           number;
  exitType:      string;
  arrUsdM:       number;
  raisedUsdM:    number;
  valuationUsdM: number;
}

// ── Custom pulsing SVG div-icon factory ─────────────────────────────────────
function makePulseIcon(color: string): L.DivIcon {
  const size = 14;
  const pulse = 28;
  return L.divIcon({
    className: "",           // prevents Leaflet adding its own white-box class
    iconSize:  [pulse, pulse],
    iconAnchor:[pulse / 2, pulse / 2],
    tooltipAnchor: [pulse / 2, -4],
    popupAnchor:   [0, -pulse / 2],
    html: `
      <div style="
        position:relative;
        width:${pulse}px;
        height:${pulse}px;
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        <!-- Animated pulse ring -->
        <div style="
          position:absolute;
          inset:0;
          border-radius:50%;
          border:2px solid ${color};
          opacity:0.5;
          animation:rrPulse 2s ease-out infinite;
        "></div>
        <!-- Solid inner dot -->
        <div style="
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          background:${color};
          border:2px solid rgba(255,255,255,0.25);
          box-shadow:0 0 10px ${color}99;
        "></div>
      </div>`,
  });
}

// ── Auto-fit bounds helper (inner component, runs inside MapContainer) ───────
function BoundsFitter({ pins }: { pins: CompanyPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (!pins.length) return;
    const bounds: LatLngBoundsExpression = pins.map(
      (p) => [p.lat, p.lng] as LatLngTuple
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 9 });
  }, [map, pins]);
  return null;
}

// ── Legend component ─────────────────────────────────────────────────────────
function MapLegend() {
  const entries = Object.entries(EXIT_COLORS);
  return (
    <div
      style={{
        position:       "absolute",
        bottom:         "24px",
        right:          "16px",
        zIndex:         1000,
        background:     "rgba(11,17,23,0.85)",
        backdropFilter: "blur(12px)",
        border:         "1px solid rgba(56,189,248,0.15)",
        borderRadius:   "10px",
        padding:        "10px 14px",
        display:        "flex",
        flexDirection:  "column",
        gap:            "6px",
        pointerEvents:  "none",
      }}
    >
      <p style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.08em",
                  color:"#94A3B8", marginBottom:"2px", textTransform:"uppercase" }}>
        Exit Path
      </p>
      {entries.map(([type, color]) => (
        <div key={type} style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <div style={{
            width:"10px", height:"10px", borderRadius:"50%",
            background: color, boxShadow:`0 0 6px ${color}99`,
            flexShrink: 0,
          }} />
          <span style={{ fontSize:"0.72rem", color:"#F8FAFC", whiteSpace:"nowrap" }}>
            {type}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────
export interface GeospatialExitMapProps {
  /** CSS height of the map container. Default "420px". */
  height?: string;
  /** Tile layer URL. Defaults to CartoDB Dark Matter (no API key). */
  tileUrl?: string;
  /** Attribution string for the tile provider. */
  tileAttribution?: string;
  className?: string;
}

// ── CartoDB Dark Matter tile (open-source, no API key) ───────────────────────
const CARTO_DARK_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const CARTO_DARK_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// ── Backend base URL (mirrors the env var used in api.ts) ────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Main component ───────────────────────────────────────────────────────────
export default function GeospatialExitMap({
  height          = "420px",
  tileUrl         = CARTO_DARK_URL,
  tileAttribution = CARTO_DARK_ATTR,
  className       = "",
}: GeospatialExitMapProps) {
  // ── Live API state — no hardcoded DEFAULT_PINS ────────────────────────────
  const [pins,    setPins]    = useState<CompanyPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/map-pins`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`/api/map-pins returned ${res.status} ${res.statusText}`);
        return res.json() as Promise<{ pins: CompanyPin[]; count: number; source_file: string }>;
      })
      .then((data) => {
        if (!cancelled) {
          setPins(data.pins ?? []);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);  // runs once on mount — fetches live from company_data.json via backend

  // Inject the CSS keyframe for the pulse animation once into the document.
  const styleInjected = useRef(false);
  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const style = document.createElement("style");
    style.textContent = `
      @keyframes rrPulse {
        0%   { transform: scale(0.8); opacity: 0.7; }
        70%  { transform: scale(1.8); opacity: 0;   }
        100% { transform: scale(0.8); opacity: 0;   }
      }
      /* Strip default Leaflet container outline */
      .rr-map-container .leaflet-container {
        background: #030712 !important;
        font-family: 'Inter', system-ui, sans-serif;
      }
      /* Style Leaflet popups to match DNA */
      .rr-map-container .leaflet-popup-content-wrapper {
        background: rgba(11,17,23,0.95) !important;
        border: 1px solid rgba(56,189,248,0.20) !important;
        border-radius: 10px !important;
        color: #F8FAFC !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
        backdrop-filter: blur(12px);
      }
      .rr-map-container .leaflet-popup-tip {
        background: rgba(11,17,23,0.95) !important;
      }
      .rr-map-container .leaflet-popup-close-button {
        color: #94A3B8 !important;
      }
      /* Style Leaflet tooltips */
      .rr-map-container .leaflet-tooltip {
        background: rgba(11,17,23,0.90) !important;
        border: 1px solid rgba(56,189,248,0.18) !important;
        border-radius: 6px !important;
        color: #F8FAFC !important;
        font-size: 0.75rem !important;
        padding: 4px 10px !important;
        box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;
        backdrop-filter: blur(8px);
      }
      .rr-map-container .leaflet-tooltip-top::before {
        border-top-color: rgba(56,189,248,0.18) !important;
      }
      /* Leaflet zoom / attribution controls */
      .rr-map-container .leaflet-control-zoom a {
        background: rgba(11,17,23,0.85) !important;
        border-color: rgba(56,189,248,0.15) !important;
        color: #94A3B8 !important;
      }
      .rr-map-container .leaflet-control-zoom a:hover {
        background: rgba(56,189,248,0.12) !important;
        color: #38BDF8 !important;
      }
      .rr-map-container .leaflet-control-attribution {
        background: rgba(3,7,18,0.70) !important;
        color: #475569 !important;
        font-size: 0.6rem !important;
      }
      .rr-map-container .leaflet-control-attribution a {
        color: #38BDF8 !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  // ── Overlay states ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        height, display: "flex", alignItems: "center", justifyContent: "center",
        background: "#030712", borderRadius: 10, border: "1px solid rgba(56,189,248,0.12)",
        flexDirection: "column", gap: 12,
      }}>
        <span style={{ animation: "pulseGlow 1.5s ease-in-out infinite", fontSize: "1.4rem" }}>🗺️</span>
        <p style={{ fontSize: "0.8rem", color: "#94A3B8", margin: 0 }}>
          Loading Exit Intelligence Map…
        </p>
        <p style={{ fontSize: "0.68rem", color: "#475569", margin: 0 }}>
          Fetching pins from <code style={{ color: "#38BDF8" }}>/api/map-pins</code>
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height, display: "flex", alignItems: "center", justifyContent: "center",
        background: "#030712", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)",
        flexDirection: "column", gap: 10, padding: 20,
      }}>
        <span style={{ fontSize: "1.4rem" }}>⚠️</span>
        <p style={{ fontSize: "0.8rem", color: "#F87171", margin: 0, fontWeight: 600 }}>
          Map data unavailable
        </p>
        <p style={{ fontSize: "0.7rem", color: "#94A3B8", margin: 0, textAlign: "center" }}>
          {error}
        </p>
        <p style={{ fontSize: "0.65rem", color: "#475569", margin: 0 }}>
          Ensure the backend is running on{" "}
          <code style={{ color: "#38BDF8" }}>{API_BASE}</code>
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rr-map-container ${className}`}
      style={{
        position:     "relative",
        width:        "100%",
        height,
        borderRadius: "var(--radius-xl, 10px)",
        overflow:     "hidden",
        border:       "1px solid rgba(56,189,248,0.12)",
        boxShadow:    "0 8px 32px rgba(0,0,0,0.50)",
      }}
    >
      {/* Map label */}
      <div style={{
        position:       "absolute",
        top:            "12px",
        left:           "12px",
        zIndex:         1000,
        background:     "rgba(11,17,23,0.80)",
        backdropFilter: "blur(10px)",
        border:         "1px solid rgba(56,189,248,0.15)",
        borderRadius:   "8px",
        padding:        "5px 12px",
        display:        "flex",
        alignItems:     "center",
        gap:            "6px",
        pointerEvents:  "none",
      }}>
        <div style={{
          width:"8px", height:"8px", borderRadius:"50%",
          background:"#38BDF8", boxShadow:"0 0 8px #38BDF8",
          animation:"rrPulse 2s ease-out infinite",
        }}/>
        <span style={{
          fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.06em",
          color:"#F8FAFC", textTransform:"uppercase",
        }}>
          Exit Path Intelligence Map
        </span>
        {/* Live data badge */}
        <span style={{
          fontSize:"0.58rem", fontWeight:600, letterSpacing:"0.05em",
          background:"rgba(56,189,248,0.12)", border:"1px solid rgba(56,189,248,0.3)",
          borderRadius:"4px", padding:"1px 5px", color:"#38BDF8",
        }}>
          LIVE · {pins.length} companies
        </span>
      </div>

      <MapContainer
        // Initial center — continental US; BoundsFitter overrides this
        center={[39.5, -98.35]}
        zoom={4}
        scrollWheelZoom
        zoomControl
        style={{ width: "100%", height: "100%" }}
        // Disable attribution prefix
        attributionControl
      >
        {/* ── CartoDB Dark Matter tile layer ── */}
        <TileLayer
          url={tileUrl}
          attribution={tileAttribution}
          subdomains="abcd"
          maxZoom={19}
        />

        {/* ── Auto-fit bounds ── */}
        <BoundsFitter pins={pins} />

        {/* ── Company markers — driven from /api/map-pins (company_data.json) ── */}
        {pins.map((pin) => {
          const color = EXIT_COLORS[pin.exitType] ?? "#38BDF8";
          const icon  = makePulseIcon(color);

          return (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={icon}
            >
              {/* Hover tooltip */}
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                <div style={{ lineHeight: "1.5" }}>
                  <strong style={{ color, fontSize:"0.8rem" }}>{pin.name}</strong>
                  <br />
                  <span style={{ color:"#94A3B8", fontSize:"0.7rem" }}>
                    {pin.sector} · {pin.stage}
                  </span>
                  {pin.city && (
                    <>
                      <br />
                      <span style={{ color:"#64748B", fontSize:"0.68rem" }}>📍 {pin.city}</span>
                    </>
                  )}
                  <br />
                  <span style={{
                    display:"inline-block", marginTop:"2px",
                    background: `${color}22`, border:`1px solid ${color}44`,
                    borderRadius:"4px", padding:"1px 6px",
                    fontSize:"0.68rem", fontWeight:600, color,
                  }}>
                    {pin.exitType}
                  </span>
                </div>
              </Tooltip>

              {/* Click popup */}
              <Popup minWidth={220} maxWidth={280}>
                <div style={{ fontFamily:"'Inter',sans-serif", lineHeight:"1.6" }}>
                  {/* Header */}
                  <div style={{
                    borderBottom:`1px solid rgba(56,189,248,0.15)`,
                    paddingBottom:"8px", marginBottom:"8px",
                  }}>
                    <p style={{ fontSize:"0.85rem", fontWeight:700, color:"#F8FAFC", margin:0 }}>
                      {pin.name}
                    </p>
                    <p style={{ fontSize:"0.72rem", color:"#94A3B8", margin:0 }}>
                      {pin.sector} · {pin.stage}
                    </p>
                    {pin.city && (
                      <p style={{ fontSize:"0.68rem", color:"#64748B", margin:0 }}>
                        📍 {pin.city}
                      </p>
                    )}
                  </div>

                  {/* Exit path badge */}
                  <div style={{ marginBottom:"10px" }}>
                    <span style={{
                      background: `${color}22`, border:`1px solid ${color}55`,
                      borderRadius:"20px", padding:"2px 10px",
                      fontSize:"0.7rem", fontWeight:700, color,
                      letterSpacing:"0.04em",
                    }}>
                      {pin.exitType}
                    </span>
                  </div>

                  {/* Financial metrics grid */}
                  {[
                    ["ARR",        `$${pin.arrUsdM}M`],
                    ["Raised",     `$${pin.raisedUsdM}M`],
                    ["Val. (Base)", pin.valuationUsdM > 0 ? `$${pin.valuationUsdM.toFixed(0)}M` : "—"],
                  ].map(([label, value]) => (
                    <div key={label} style={{
                      display:"flex", justifyContent:"space-between",
                      alignItems:"center", marginBottom:"4px",
                    }}>
                      <span style={{ fontSize:"0.72rem", color:"#94A3B8" }}>{label}</span>
                      <span style={{ fontSize:"0.78rem", fontWeight:600, color:"#F8FAFC",
                                     fontFamily:"'JetBrains Mono',monospace" }}>
                        {value}
                      </span>
                    </div>
                  ))}

                  {/* Company ID + data source */}
                  <p style={{ fontSize:"0.62rem", color:"#475569", marginTop:"8px",
                              borderTop:"1px solid rgba(31,41,55,0.8)", paddingTop:"6px" }}>
                    ID: {pin.id} · source: company_data.json
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <MapLegend />
    </div>
  );
}
