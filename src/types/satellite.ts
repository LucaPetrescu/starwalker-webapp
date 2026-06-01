/**
 * Satellite domain types for the tracking overlay system.
 */

/** A single satellite's live telemetry data */
export interface SatelliteData {
  /** Unique satellite identifier */
  id: string;
  /** NORAD catalog number */
  noradId: number;
  /** Human-readable satellite name (e.g. "ISS (ZARYA)") */
  name: string;
  /** Current altitude above sea level in kilometers */
  altitudeKm: number;
  /** Current speed in km/s */
  speedKmS: number;
  /** Current geographic latitude (-90 to 90) */
  latitude: number;
  /** Current geographic longitude (-180 to 180) */
  longitude: number;
  /** Whether the satellite is currently in Earth's shadow */
  eclipsed: boolean;
  /** 3D position on the dome surface (in Three.js scene coordinates) */
  domePosition: { x: number; y: number; z: number };
  /** Predicted trajectory points (future positions on the dome) */
  trajectory: Array<{ x: number; y: number; z: number }>;
  /** ISO 8601 timestamp of last data update */
  lastUpdated: string;
  /** Optional: international designator */
  intlDesignator?: string;
  /** Optional: orbital period in minutes */
  periodMinutes?: number;
  /** Optional: orbital inclination in degrees */
  inclinationDeg?: number;
}

/** State for the satellite tracking system */
export interface SatelliteTrackingState {
  /** All currently tracked satellites */
  satellites: SatelliteData[];
  /** ID of the currently selected satellite (null if none) */
  selectedId: string | null;
  /** Whether satellite data is being fetched */
  loading: boolean;
  /** Error message from the satellite API, if any */
  error: string | null;
  /** Whether trajectory paths are globally visible */
  showTrajectories: boolean;
}

/** Props for the InfoDisplay panel */
export interface InfoDisplayProps {
  /** The satellite to display details for (null hides the panel) */
  satellite: SatelliteData | null;
  /** Callback to close/deselect the panel */
  onClose: () => void;
  /** Whether trajectory is visible for this satellite */
  trajectoryVisible: boolean;
  /** Toggle trajectory visibility */
  onToggleTrajectory: () => void;
}

/** Props for the LoadingOverlay */
export interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Primary loading message */
  message?: string;
  /** Secondary message (e.g. "Acquiring GPS...") */
  submessage?: string;
}

/** Props for the ErrorNotification */
export interface ErrorNotificationProps {
  /** Error message to display (null hides the notification) */
  message: string | null;
  /** Error type for appropriate icon/styling */
  type?: "geolocation" | "api" | "network" | "generic";
  /** Callback to dismiss */
  onDismiss?: () => void;
  /** Whether the error can be retried */
  retryable?: boolean;
  /** Callback for retry action */
  onRetry?: () => void;
}

/** Props for satellite labels overlaid on the dome */
export interface SatelliteLabelProps {
  /** Satellite name to display */
  name: string;
  /** Screen-space X coordinate (projected from 3D) */
  screenX: number;
  /** Screen-space Y coordinate (projected from 3D) */
  screenY: number;
  /** Whether this satellite is currently selected */
  selected: boolean;
  /** Whether the satellite is eclipsed */
  eclipsed: boolean;
}

export interface SatteliteInfoContentProps {
  satellite: SatelliteData | null;
  onClose: () => void;
  trajectoryVisible: boolean;
  onToggleTrajectory: () => void;
  formatAgo: (iso: string) => string;
  formatCoord: (value: number, pos: 'lat' | 'lon') => string;
}
