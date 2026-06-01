import React from 'react';
import type { SatelliteLabelProps } from '@/types/satellite';

/* ============================================================
 * SatelliteLabel — DOM label overlaid on a satellite's screen position
 *
 * Positioned absolutely over the Three.js canvas using the
 * satellite's projected (x, y) screen coordinates. The parent
 * container must be `position: relative` and cover the canvas.
 *
 * Visual anatomy:
 *
 *     ●━━━━━━━━━━━┐
 *                  │  ISS (ZARYA)
 *                  └─────────────
 *     ^            ^
 *   dot stub    name label (chip)
 *
 * The dot is rendered in Three.js (GLSL point sprite).
 * This component renders only the text label + connector line.
 *
 * States:
 *   default   → dim label, subtle connector
 *   selected  → bright label, glowing connector, no auto-hide
 *   eclipsed  → indigo tint instead of teal
 *
 * Accessibility:
 *   Each label has aria-label for screen readers.
 *   Labels are presentation-only (the panel carries the real content).
 * ============================================================ */

/** Connector line length in pixels from the satellite dot to the label */
const CONNECTOR_LENGTH = 20;

/** Vertical offset below the satellite dot center */
const VERTICAL_OFFSET = 8;

export function SatelliteLabel({
  name,
  screenX,
  screenY,
  selected,
  eclipsed,
}: SatelliteLabelProps) {
  const accentColor = eclipsed
    ? 'var(--color-eclipsed)'
    : 'var(--color-sat-dot)';

  const labelColor = selected
    ? 'var(--color-text-primary)'
    : 'var(--color-sat-label)';

  const connectorOpacity = selected ? 0.7 : 0.3;

  return (
    <div
      role="presentation"
      aria-label={`Satellite: ${name}${eclipsed ? ' (in shadow)' : ''}`}
      style={{
        position: 'absolute',
        /* Offset so the connector originates from the satellite dot center */
        left: screenX,
        top: screenY + VERTICAL_OFFSET,
        pointerEvents: 'none',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 0,
        /* Slide-in entrance when label first appears */
        animation: 'fade-in-up var(--transition-normal) both',
      }}
    >
      {/* Connector: a short horizontal line from the dot to the label */}
      <svg
        width={CONNECTOR_LENGTH}
        height="2"
        viewBox={`0 0 ${CONNECTOR_LENGTH} 2`}
        fill="none"
        aria-hidden="true"
        style={{
          marginTop: '7px', /* Align with label cap-height */
          flexShrink: 0,
          opacity: connectorOpacity,
        }}
      >
        <line
          x1="0"
          y1="1"
          x2={CONNECTOR_LENGTH}
          y2="1"
          stroke={accentColor}
          strokeWidth="1"
          strokeDasharray={selected ? 'none' : '3 2'}
        />
      </svg>

      {/* Name chip */}
      <span
        style={{
          display: 'inline-block',
          padding: '2px 6px 2px 5px',
          background: selected
            ? 'rgba(10, 10, 22, 0.85)'
            : 'rgba(10, 10, 22, 0.60)',
          border: `1px solid ${selected ? accentColor : 'rgba(62, 207, 207, 0.12)'}`,
          borderRadius: 'var(--radius-sm)',
          backdropFilter: selected ? 'blur(var(--blur-subtle))' : 'none',
          WebkitBackdropFilter: selected ? 'blur(var(--blur-subtle))' : 'none',
          /* Glow ring for selected state */
          boxShadow: selected
            ? `0 0 0 1px rgba(62, 207, 207, 0.15), 0 2px 8px rgba(0,0,0,0.4)`
            : 'none',
          transition:
            'background var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-mono-sm)',
            fontWeight: selected
              ? 'var(--weight-medium)' as React.CSSProperties['fontWeight']
              : 'var(--weight-regular)' as React.CSSProperties['fontWeight'],
            color: labelColor,
            letterSpacing: 'var(--tracking-wide)',
            whiteSpace: 'nowrap',
            lineHeight: 1.3,
            transition: 'color var(--transition-fast)',
          }}
        >
          {name}
        </span>
      </span>
    </div>
  );
}

/* ============================================================
 * SatelliteLabelsLayer — Container that renders all labels
 *
 * Place this as a sibling of the Three.js canvas, covering the
 * same area. Pass the list of visible satellites with their
 * projected screen positions.
 *
 * Usage:
 *   <SatelliteLabelsLayer
 *     labels={projectedSatellites}
 *     selectedId={selectedSatellite?.id ?? null}
 *   />
 * ============================================================ */

export interface SatelliteLabelsLayerProps {
  labels: Array<SatelliteLabelProps & { id: string }>;
  selectedId: string | null;
}

export function SatelliteLabelsLayer({
  labels,
  selectedId,
}: SatelliteLabelsLayerProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 'var(--z-labels)' as React.CSSProperties['zIndex'],
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {labels.map((label) => (
        <SatelliteLabel
          key={label.id}
          name={label.name}
          screenX={label.screenX}
          screenY={label.screenY}
          selected={label.id === selectedId}
          eclipsed={label.eclipsed}
        />
      ))}
    </div>
  );
}
