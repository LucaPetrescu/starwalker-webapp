import React from 'react';
import { SatteliteInfoContentProps } from "@/types/satellite";

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

export function SatteliteInfoContent({
  satellite,
  onClose,
  trajectoryVisible,
  onToggleTrajectory,
  formatAgo,
  formatCoord,
}: SatteliteInfoContentProps) {
  return (
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
              {satellite ? satellite.name : 'N/A'}
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
            {satellite ? (
              <>
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
              </>
            ) : (
              'N/A'
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
          {satellite ? (
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
          ) : (
            <span className="label-pill">N/A</span>
          )}
        </div>

        {/* Telemetry section */}
        <SectionDivider label="Telemetry" />

        <div role="table" aria-label="Satellite telemetry">
          <TelemetryRow
            label="Altitude"
            value={satellite ? `${satellite.altitudeKm.toFixed(1)}` : 'N/A'}
            unit={satellite ? 'km' : undefined}
          />
          <TelemetryRow
            label="Speed"
            value={satellite ? `${satellite.speedKmS.toFixed(2)}` : 'N/A'}
            unit={satellite ? 'km/s' : undefined}
          />
          <TelemetryRow
            label="Latitude"
            value={satellite ? formatCoord(satellite.latitude, 'lat') : 'N/A'}
          />
          <TelemetryRow
            label="Longitude"
            value={satellite ? formatCoord(satellite.longitude, 'lon') : 'N/A'}
          />
        </div>

        {/* Orbital parameters (optional) */}
        {satellite &&
          (satellite.inclinationDeg !== undefined ||
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
          aria-label={satellite ? `Data updated ${formatAgo(satellite.lastUpdated)}` : undefined}
        >
          {satellite ? formatAgo(satellite.lastUpdated) : 'N/A'}
        </span>
      </footer>
    </>
  );
}
