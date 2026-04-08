import type { SatellitesAbovePosition, ViewDirection } from '@/types';
import useLocation from '@/hooks/useLocation';

interface InfoDisplayProps {
  satellites: SatellitesAbovePosition[];
  satellitesInView: SatellitesAbovePosition[];
  satellitesLoading: boolean;
  satellitesError: string | null;
  viewDirection: ViewDirection | null;
}

export function InfoDisplay({
  satellites,
  satellitesInView,
  satellitesLoading,
  satellitesError,
  viewDirection,
}: InfoDisplayProps) {
  const location = useLocation();
  const { coords, error: locationError } = location;

  const locationText =
    coords.latitude != null && coords.longitude != null
      ? `${coords.latitude.toFixed(4)}°, ${coords.longitude.toFixed(4)}°`
      : locationError ?? 'Determining location…';

  return (
    <div className="absolute left-4 top-4 z-10 rounded-lg bg-black/60 px-4 py-3 text-sm text-slate-100 backdrop-blur">
      <div className="mb-2">
        <div className="font-semibold">Observer</div>
        <div className="text-xs text-slate-300">Location (lat, lon): {locationText}</div>
      </div>

      <div className="mb-2">
        <div className="font-semibold">View direction</div>
        {viewDirection ? (
          <div className="text-xs text-slate-300">
            Bearing: {viewDirection.bearing.toFixed(1)}°
            {' · '}
            Sky lon/lat: {viewDirection.skyLongitude.toFixed(1)}°, {viewDirection.skyLatitude.toFixed(1)}°
          </div>
        ) : (
          <div className="text-xs text-slate-400">Drag to set a view direction.</div>
        )}
      </div>

      <div className="mb-2">
        <div className="font-semibold">Satellites (70° radius)</div>
        <div className="text-[11px] text-slate-400">
          From backend /api/satellites/satellites-above (N2YO). Observer is fixed on server until backend accepts lat/lon.
        </div>
        {satellitesLoading ? (
          <div className="text-xs text-slate-300">Loading satellites…</div>
        ) : satellitesError ? (
          <div className="text-xs text-red-300">Error: {satellitesError}</div>
        ) : (
          <div className="text-xs text-slate-300">
            Total: {satellites.length} · In this direction: {satellitesInView.length}
          </div>
        )}
      </div>

      {satellitesInView.length > 0 && (
        <div className="mt-1 max-h-40 overflow-y-auto border-t border-slate-700 pt-2 text-xs text-slate-200">
          {satellitesInView.map((sat) => (
            <div key={sat.satid} className="flex flex-col gap-0.5 pb-1">
              <span className="font-medium">{sat.satname}</span>
              <span className="text-[11px] text-slate-400">
                Lat/Lon: {sat.satlat.toFixed(2)}°, {sat.satlng.toFixed(2)}° · Alt: {sat.satalt.toFixed(0)} km
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

