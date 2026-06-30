/**
 * api.ts — Backend API client for Exit Path Scenario Planner
 * Real Rails Intelligence Library · Rail: Capital Formation
 */

import type { ScenariosResponse, ExitScenarioBundle } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/** Fetch all scenario bundles with optional filters */
export async function fetchScenarios(params?: {
  sector?: string;
  limit?: number;
  offset?: number;
}): Promise<ScenariosResponse> {
  const query = new URLSearchParams();
  if (params?.sector) query.set("sector", params.sector);
  if (params?.limit)  query.set("limit",  String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  const qs = query.toString() ? `?${query.toString()}` : "";
  return get<ScenariosResponse>(`/api/scenarios${qs}`);
}

/** Fetch a single company bundle by ID */
export async function fetchBundleById(companyId: string): Promise<ExitScenarioBundle> {
  return get<ExitScenarioBundle>(`/api/scenarios/${encodeURIComponent(companyId)}`);
}

/** Fetch available sectors list */
export async function fetchSectors(): Promise<{ sectors: string[] }> {
  return get<{ sectors: string[] }>("/api/sectors");
}

/** Download sample data — triggers browser download */
export function downloadSampleData(fmt: "json" | "csv" = "json", companyId?: string): void {
  const query = new URLSearchParams({ format: fmt });
  if (companyId) query.set("company_id", companyId);
  const url = `${BASE_URL}/api/download-sample?${query.toString()}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = `exit_path_sample_data.${fmt}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
