import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { StarMap } from "./components/StarMap";
import { InfoDisplay } from "./components/InfoDisplay";
import {
  fetchSatellitesAbove,
  fetchClosestSatellitesAbove,
} from "@/api/satellites";
import type {
  SatellitesAboveData,
  SatellitesAbovePosition,
  ViewDirection,
} from "@/types";
import type { SatelliteData } from "@/types/satellite";
import useLocation from "@/hooks/useLocation";

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--space-3)' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-mono-sm)', color: 'var(--color-text-dim)', letterSpacing: 'var(--tracking-wide)', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-mono-sm)', color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-wide)', textAlign: 'right' }}>
        {value}{sub && <span style={{ color: 'var(--color-primary)', marginLeft: '4px' }}>{sub}</span>}
      </span>
    </div>
  );
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function bearingToCompass(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function formatCoord(value: number, axis: 'lat' | 'lon'): string {
  const abs = Math.abs(value).toFixed(4);
  return axis === 'lat'
    ? `${abs}° ${value >= 0 ? 'N' : 'S'}`
    : `${abs}° ${value >= 0 ? 'E' : 'W'}`;
}

function normalizeBearing(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function bearingBetween(
  observerLat: number,
  observerLon: number,
  targetLat: number,
  targetLon: number,
): number {
  const φ1 = toRadians(observerLat);
  const φ2 = toRadians(targetLat);
  const λ1 = toRadians(observerLon);
  const λ2 = toRadians(targetLon);
  const dλ = λ2 - λ1;

  const y = Math.sin(dλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ);

  const θ = Math.atan2(y, x);
  return normalizeBearing((θ * 180) / Math.PI);
}

function bearingDifference(a: number, b: number): number {
  const diff = Math.abs(normalizeBearing(a) - normalizeBearing(b));
  return diff > 180 ? 360 - diff : diff;
}

/** Convert a raw SatellitesAbovePosition into the richer SatelliteData shape
 *  used by InfoDisplay. Fields not available from the /satellites-above endpoint
 *  are given sensible placeholder values until a detailed fetch is wired up. */
function toSatelliteData(sat: SatellitesAbovePosition): SatelliteData {
  return {
    id: String(sat.satid),
    noradId: sat.satid,
    name: sat.satname,
    altitudeKm: sat.satalt,
    speedKmS: 7.8, // placeholder — real value from /satellites/{id} call
    latitude: sat.satlat,
    longitude: sat.satlng,
    eclipsed: false, // placeholder — not available from above endpoint
    domePosition: { x: 0, y: 0, z: 0 },
    trajectory: [],
    lastUpdated: new Date().toISOString(),
    intlDesignator: sat.intDesignator ?? undefined,
  };
}

function App() {
  const location = useLocation();
  const { coords } = location;

  const [satData, setSatData] = useState<SatellitesAboveData | null>(null);
  const [satellitesLoading, setSatellitesLoading] = useState(false);
  const [satellitesError, setSatellitesError] = useState<string | null>(null);
  const [viewDirection, setViewDirection] = useState<ViewDirection | null>(
    null,
  );

  // Selected satellite + trajectory toggle state
  const [selectedSatellite, setSelectedSatellite] =
    useState<SatelliteData | null>(null);
  const [trajectoryVisible, setTrajectoryVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setSatellitesLoading(true);
      setSatellitesError(null);
      try {
        const data = await fetchClosestSatellitesAbove();
        console.log("satellites above data", data);
        if (!cancelled) {
          setSatData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setSatellitesError(
            err instanceof Error ? err.message : "Failed to load satellites",
          );
        }
      } finally {
        if (!cancelled) {
          setSatellitesLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const satellites: SatellitesAbovePosition[] = useMemo(
    () => satData?.above ?? [],
    [satData],
  );

  const satellitesInView: SatellitesAbovePosition[] = useMemo(() => {
    if (!viewDirection) return [];
    if (!coords.latitude || !coords.longitude) return [];
    if (!satellites.length) return [];

    const maxBearingDiff = 10;
    const { bearing } = viewDirection;
    const lat = coords.latitude;
    const lon = coords.longitude;

    return satellites.filter((sat) => {
      if (typeof sat.satlat !== "number" || typeof sat.satlng !== "number") {
        return false;
      }
      const satBearing = bearingBetween(lat, lon, sat.satlat, sat.satlng);
      return bearingDifference(bearing, satBearing) <= maxBearingDiff;
    });
  }, [viewDirection, coords.latitude, coords.longitude, satellites]);

  void satellitesLoading;
  void satellitesError;
  void satellitesInView;

  const satelliteDataList = useMemo(
    () => satellites.map(toSatelliteData),
    [satellites],
  );

  const handleSatelliteClick = useCallback(
    (id: string) => {
      const raw = satellites.find((s) => String(s.satid) === id);
      setSelectedSatellite(raw ? toSatelliteData(raw) : null);
    },
    [satellites],
  );

  const vd = viewDirection;

  return (
    <div className="starwalker-app">
      <StarMap
        onViewDirectionChange={setViewDirection}
        satellites={satelliteDataList}
        selectedSatelliteId={selectedSatellite?.id ?? null}
        onSatelliteClick={handleSatelliteClick}
        observerLat={coords.latitude ?? undefined}
        observerLon={coords.longitude ?? undefined}
      />

      <InfoDisplay
        satellite={selectedSatellite}
        onClose={() => setSelectedSatellite(null)}
        trajectoryVisible={trajectoryVisible}
        onToggleTrajectory={() => setTrajectoryVisible((v) => !v)}
      />

      {/* ── Real-time view telemetry panel (top-left) ── */}
      <div
        className="glass-panel"
        style={{
          position: 'fixed',
          top: 'var(--space-4)',
          left: 'var(--space-4)',
          padding: 'var(--space-3) var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
          minWidth: '200px',
          zIndex: 'var(--z-panel)' as React.CSSProperties['zIndex'],
          pointerEvents: 'none',
        }}
      >
        {/* Header */}
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-mono-sm)',
          color: 'var(--color-text-dim)',
          letterSpacing: 'var(--tracking-widest)',
          textTransform: 'uppercase',
          margin: '0 0 var(--space-2)',
          borderBottom: '1px solid var(--color-border-subtle)',
          paddingBottom: 'var(--space-2)',
        }}>
          View Telemetry
        </p>

        {/* Viewing direction */}
        <Row label="Bearing"   value={vd ? `${vd.bearing.toFixed(1)}°` : '—'} sub={vd ? bearingToCompass(vd.bearing) : ''} />
        <Row label="Elevation" value={vd ? `${vd.skyLatitude >= 0 ? '+' : ''}${vd.skyLatitude.toFixed(1)}°` : '—'} />
        <Row label="Azimuth"   value={vd ? `${vd.skyLongitude.toFixed(1)}°` : '—'} />

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--color-border-subtle)', margin: 'var(--space-2) 0 var(--space-1)' }} />

        {/* Observer location */}
        <Row label="Lat" value={coords.latitude  != null ? formatCoord(coords.latitude,  'lat') : '—'} />
        <Row label="Lon" value={coords.longitude != null ? formatCoord(coords.longitude, 'lon') : '—'} />
      </div>
    </div>
  );
}

export default App;
