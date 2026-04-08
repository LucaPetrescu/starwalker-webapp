import type { SatellitesAboveData, SatelliteData } from '@/types';

/**
 * Base path for starwalker-platform SatelliteController.
 * Backend uses EarthObserverConstants (fixed lat/lon, 70° radius) until
 * it accepts observer lat/lon as query params.
 */
const BASE_PATH = '/api/satellites';

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** GET /api/satellites/satellites-above – all satellites in 70° radius (N2YO above endpoint) */
export async function fetchSatellitesAbove(): Promise<SatellitesAboveData> {
  return fetchJson<SatellitesAboveData>(`${BASE_PATH}/satellites-above`);
}

/** GET /api/satellites/closest-satellites-above – 12 closest by altitude */
export async function fetchClosestSatellitesAbove(): Promise<SatellitesAboveData> {
  return fetchJson<SatellitesAboveData>(`${BASE_PATH}/closest-satellites-above`);
}

/** GET /api/satellites/{satelliteId}/{seconds} – positions for a single satellite */
export async function fetchSatelliteData(
  satelliteId: number,
  seconds: number,
): Promise<SatelliteData> {
  return fetchJson<SatelliteData>(`${BASE_PATH}/${satelliteId}/${seconds}`);
}

