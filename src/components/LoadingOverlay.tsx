import React from 'react';
import type { LoadingOverlayProps } from '@/types/satellite';

/* ============================================================
 * LoadingOverlay — Immersion-preserving loading state
 *
 * Renders as a near-invisible overlay on top of the dome.
 * The star field remains fully visible — this uses a scanning
 * line + a minimal status chip to signal "acquiring data"
 * without competing with the planetarium experience.
 *
 * Visible states:
 *   visible=true  → scan line sweeps + bottom-center chip fades in
 *   visible=false → entire overlay fades out (300ms)
 *
 * Design decisions:
 *   - No modal backdrop — the dome stays hero
 *   - Scan line uses a gradient, top-to-bottom, matching
 *     observatory/radar aesthetics
 *   - Chip anchors bottom-center to stay away from the info
 *     panel (top-right) and any future satellite labels
 * ============================================================ */

export function LoadingOverlay({
  visible,
  message = 'Acquiring satellite data',
  submessage,
}: LoadingOverlayProps) {
  return (
    <div
      aria-live="polite"
      aria-busy={visible}
      aria-label={visible ? message : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-loading)' as React.CSSProperties['zIndex'],
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 300ms ease-out',
      }}
    >
      {/* Scanning line — sweeps the full viewport height */}
      {visible && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '120px',
            background:
              'linear-gradient(to bottom, transparent, rgba(62, 207, 207, 0.04) 40%, rgba(62, 207, 207, 0.07) 50%, rgba(62, 207, 207, 0.04) 60%, transparent)',
            animation: 'scan-line 3.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            top: 0,
          }}
        />
      )}

      {/* Status chip — anchored bottom-center */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(var(--space-8) + var(--safe-area-bottom))',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-2)',
          opacity: visible ? 1 : 0,
          transition: 'opacity var(--transition-normal)',
        }}
      >
        {/* Spinner ring + label row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--color-bg-panel)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
            backdropFilter: 'blur(var(--blur-panel))',
            WebkitBackdropFilter: 'blur(var(--blur-panel))',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Ring spinner */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
            style={{
              flexShrink: 0,
              animation: 'spin-ring 1.1s linear infinite',
            }}
          >
            {/* Track */}
            <circle
              cx="7"
              cy="7"
              r="5.5"
              stroke="rgba(62, 207, 207, 0.15)"
              strokeWidth="1.5"
            />
            {/* Active arc */}
            <path
              d="M7 1.5A5.5 5.5 0 0 1 12.5 7"
              stroke="var(--color-primary)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          {/* Primary message */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-mono-sm)',
              color: 'var(--color-text-secondary)',
              letterSpacing: 'var(--tracking-wide)',
              whiteSpace: 'nowrap',
            }}
          >
            {message}
          </span>
        </div>

        {/* Submessage — appears below the chip when provided */}
        {submessage && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-caption)',
              color: 'var(--color-text-dim)',
              letterSpacing: 'var(--tracking-wide)',
              animation: 'fade-in-up var(--transition-normal) both',
            }}
          >
            {submessage}
          </span>
        )}
      </div>
    </div>
  );
}
