import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { StarMap } from './components/StarMap';
import { InfoDisplay } from './components/InfoDisplay';
import { fetchSatellitesAbove } from '@/api/satellites';
import type {
  SatellitesAboveData,
  SatellitesAbovePosition,
  ViewDirection,
} from '@/types';
import useLocation from '@/hooks/useLocation';

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
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
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ);

  const θ = Math.atan2(y, x);
  return normalizeBearing((θ * 180) / Math.PI);
}

function bearingDifference(a: number, b: number): number {
  const diff = Math.abs(normalizeBearing(a) - normalizeBearing(b));
  return diff > 180 ? 360 - diff : diff;
}

function App() {
  const location = useLocation();
  const { coords } = location;

  const [satData, setSatData] = useState<SatellitesAboveData | null>(null);
  const [satellitesLoading, setSatellitesLoading] = useState(false);
  const [satellitesError, setSatellitesError] = useState<string | null>(null);
  const [viewDirection, setViewDirection] = useState<ViewDirection | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setSatellitesLoading(true);
      setSatellitesError(null);
      try {
        const data = await fetchSatellitesAbove();
        if (!cancelled) {
          setSatData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setSatellitesError(
            err instanceof Error ? err.message : 'Failed to load satellites',
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
      if (
        typeof sat.satlat !== 'number' ||
        typeof sat.satlng !== 'number'
      ) {
        return false;
      }
      const satBearing = bearingBetween(lat, lon, sat.satlat, sat.satlng);
      return bearingDifference(bearing, satBearing) <= maxBearingDiff;
    });
  }, [viewDirection, coords.latitude, coords.longitude, satellites]);

  return (
    <div className="starwalker-app">
      <StarMap onViewDirectionChange={setViewDirection} />
      <InfoDisplay
        satellites={satellites}
        satellitesInView={satellitesInView}
        satellitesLoading={satellitesLoading}
        satellitesError={satellitesError}
        viewDirection={viewDirection}
      />
    </div>
  );
}

export default App;
