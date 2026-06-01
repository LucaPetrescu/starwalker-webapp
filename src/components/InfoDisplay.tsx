import React, { useEffect, useRef } from 'react';
import type { InfoDisplayProps } from '@/types/satellite';

/* ============================================================
 * InfoDisplay — Satellite detail panel
 *
 * Slides in from the right when a satellite is selected.
 * Displays live telemetry: altitude, speed, lat/lon, eclipsed
 * status, and an orbit path toggle.
 *
 * Layout:
 *   ┌─────────────────────┐
 *   │ [●] SAT NAME   [×]  │  ← header: live dot + name + close
 *   │ NORAD ID · INTL DES │
 *   ├─────────────────────┤
 *   │ SUNLIT / ECLIPSED   │  ← status badge
 *   ├─────────────────────┤
 *   │ ALTITUDE    xxx km  │
 *   │ SPEED       x.xx    │  ← telemetry rows
 *   │ LATITUDE    xx.xx°  │
 *   │ LONGITUDE   xx.xx°  │
 *   ├─────────────────────┤
 *   │ [◉ ORBIT PATH]      │  ← toggle
 *   │ Updated x seconds   │  ← timestamp
 *   └─────────────────────┘
 * ============================================================ */

function formatAgo(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  return `${Math.round(diff / 60)}m ago`;
}

function formatCoord(value: number, pos: 'lat' | 'lon'): string {
  const abs = Math.abs(value).toFixed(4);
  if (pos === 'lat') return `${abs}° ${value >= 0 ? 'N' : 'S'}`;
  return `${abs}° ${value >= 0 ? 'E' : 'W'}`;
}

export function InfoDisplay({
  satellite,
  onClose,
  trajectoryVisible,
  onToggleTrajectory,
}: InfoDisplayProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  /* Shift focus into the panel on open so keyboard users land in the right place */
  useEffect(() => {
    if (satellite) {
      panelRef.current?.focus();
    }
  }, [satellite?.id]);

  /* Close on Escape */
  useEffect(() => {
    if (!satellite) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [satellite, onClose]);

  const isVisible = satellite !== null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={satellite ? `Satellite details: ${satellite.name}` : undefined}
      aria-hidden={!isVisible}
      ref={panelRef}
      tabIndex={-1}
      style={{
        position: 'fixed',
        top: 'var(--space-4)',
        right: 'var(--space-4)',
        bottom: 'var(--space-4)',
        width: 'var(--panel-width)',
        maxHeight: 'var(--panel-max-height)',
        zIndex: 'var(--z-panel)' as React.CSSProperties['zIndex'],
        /* Slide + fade entrance from the right */
        transform: isVisible
          ? 'translateX(0)'
          : 'translateX(calc(100% + var(--space-4)))',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        transition:
          'transform var(--transition-panel), opacity var(--transition-panel)',
        display: 'flex',
        flexDirection: 'column',
        outline: 'none',
      }}
      className="glass-panel"
    >
      {satellite && (
        <>
          {/* ══ Header ══ */}
          <header
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              padding: 'var(--space-4) var(--space-4) var(--space-3)',
              borderBottom: '1px solid var(--color-border-subtle)',
              flexShrink: 0,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Live indicator + satellite name */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                <span className="live-dot" aria-hidden="true" />
                <h2
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-h3)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--color-text-primary)',
                    lineHeight: 'var(--leading-snug)',
                    letterSpacing: 'var(--tracking-tight)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    margin: 0,
                  }}
                >
                  {satellite.name}
                </h2>
              </div>

              {/* NORAD ID · international designator */}
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-mono-sm)',
                  color: 'var(--color-text-dim)',
                  letterSpacing: 'var(--tracking-wide)',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                NORAD #{satellite.noradId}
                {satellite.intlDesignator && (
                  <>
                    <span
                      style={{ color: 'var(--color-border-active)', margin: '0 4px' }}
                    >
                      ·
                    </span>
                    {satellite.intlDesignator}
                  </>
                )}
              </p>
            </div>

            {/* Close button */}
            <button
              className="icon-btn"
              onClick={onClose}
              aria-label="Close satellite details"
              title="Close"
              style={{ flexShrink: 0, marginTop: '1px' }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1 1l12 12M13 1L1 13"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </header>

          {/* ══ Scrollable body ══ */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: 'var(--space-3) var(--space-4)',
            }}
          >
            {/* Eclipse / sunlit status badge */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <span
                className="label-pill"
                style={
                  satellite.eclipsed
                    ? {
                        background: 'var(--color-eclipsed-muted)',
                        color: 'var(--color-eclipsed)',
                        border: '1px solid rgba(129, 140, 248, 0.20)',
                      }
                    : {
                        background: 'var(--color-sunlit-muted)',
                        color: 'var(--color-sunlit)',
                        border: '1px solid rgba(251, 191, 36, 0.20)',
                      }
                }
              >
                {satellite.eclipsed ? (
                  <>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="5"
                        cy="5"
                        r="4"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      />
                      <path d="M5 1a4 4 0 0 0 0 8" fill="currentColor" opacity="0.5" />
                    </svg>
                    In shadow
                  </>
                ) : (
                  <>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle cx="5" cy="5" r="2.5" fill="currentColor" />
                      <path
                        d="M5 0v1.5M5 8.5V10M0 5h1.5M8.5 5H10M1.46 1.46l1.06 1.06M7.48 7.48l1.06 1.06M1.46 8.54l1.06-1.06M7.48 2.52l1.06-1.06"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </svg>
                    Sunlit
                  </>
                )}
              </span>
            </div>

            {/* Telemetry section */}
            <SectionDivider label="Telemetry" />

            <div role="table" aria-label="Satellite telemetry">
              <TelemetryRow
                label="Altitude"
                value={`${satellite.altitudeKm.toFixed(1)}`}
                unit="km"
              />
              <TelemetryRow
                label="Speed"
                value={`${satellite.speedKmS.toFixed(2)}`}
                unit="km/s"
              />
              <TelemetryRow
                label="Latitude"
                value={formatCoord(satellite.latitude, 'lat')}
              />
              <TelemetryRow
                label="Longitude"
                value={formatCoord(satellite.longitude, 'lon')}
              />
            </div>

            {/* Orbital parameters (optional) */}
            {(satellite.inclinationDeg !== undefined ||
              satellite.periodMinutes !== undefined) && (
              <>
                <SectionDivider label="Orbit" style={{ marginTop: 'var(--space-2)' }} />
                <div role="table" aria-label="Orbital parameters">
                  {satellite.inclinationDeg !== undefined && (
                    <TelemetryRow
                      label="Inclination"
                      value={`${satellite.inclinationDeg.toFixed(2)}°`}
                    />
                  )}
                  {satellite.periodMinutes !== undefined && (
                    <TelemetryRow
                      label="Period"
                      value={`${satellite.periodMinutes.toFixed(1)}`}
                      unit="min"
                    />
                  )}
                </div>
              </>
            )}
          </div>

          {/* ══ Footer: orbit toggle + timestamp ══ */}
          <footer
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderTop: '1px solid var(--color-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              flexShrink: 0,
            }}
          >
            <button
              className={`toggle-btn${trajectoryVisible ? ' is-active' : ''}`}
              onClick={onToggleTrajectory}
              aria-pressed={trajectoryVisible}
              aria-label="Toggle orbit path visibility"
            >
              {/* Orbit arc icon */}
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <ellipse
                  cx="6"
                  cy="6"
                  rx="5"
                  ry="2.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  transform="rotate(-30 6 6)"
                />
                <circle cx="9.2" cy="3.2" r="1.2" fill="currentColor" />
              </svg>
              Orbit path
            </button>

            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-mono-sm)',
                color: 'var(--color-text-dim)',
                letterSpacing: 'var(--tracking-wide)',
                whiteSpace: 'nowrap',
              }}
              aria-live="polite"
              aria-label={`Data updated ${formatAgo(satellite.lastUpdated)}`}
            >
              {formatAgo(satellite.lastUpdated)}
            </span>
          </footer>
        </>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function SectionDivider({
  label,
  style,
}: {
  label: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="section-divider" style={style}>
      <span className="section-divider__label">{label}</span>
      <div className="section-divider__line" />
    </div>
  );
}

function TelemetryRow({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="data-row" role="row">
      <span className="data-row__key" role="rowheader">
        {label}
      </span>
      <span className="data-row__value" role="cell">
        {value}
        {unit && (
          <span
            style={{
              color: 'var(--color-text-dim)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-caption)',
              marginLeft: '3px',
            }}
          >
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}
