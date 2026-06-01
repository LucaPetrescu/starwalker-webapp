import React, { useEffect, useRef } from 'react';
import type { ErrorNotificationProps } from '@/types/satellite';

/* ============================================================
 * ErrorNotification — Minimal toast-style error display
 *
 * Appears bottom-left (opposite corner from the info panel)
 * to avoid colliding with satellite details. Auto-dismisses
 * after 8 seconds for non-critical errors unless the user
 * has already dismissed it.
 *
 * Error types and their visual treatment:
 *   geolocation → location pin icon, amber tint
 *   api         → signal icon, red tint
 *   network     → wifi-off icon, red tint
 *   generic     → alert triangle, red tint
 *
 * Has an optional Retry action and a Dismiss (×) button.
 * ============================================================ */

const AUTO_DISMISS_MS = 8000;

type ErrorType = NonNullable<ErrorNotificationProps['type']>;

const ERROR_CONFIG: Record<
  ErrorType,
  { label: string; icon: React.ReactNode; accent: string; bg: string; border: string }
> = {
  geolocation: {
    label: 'Location unavailable',
    accent: 'var(--color-warning)',
    bg: 'var(--color-warning-muted)',
    border: 'rgba(251, 191, 36, 0.18)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <circle cx="7" cy="6" r="2" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M7 1C4.79 1 3 2.79 3 5c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  api: {
    label: 'Satellite API error',
    accent: 'var(--color-error)',
    bg: 'var(--color-error-muted)',
    border: 'rgba(248, 113, 113, 0.18)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          d="M1 10.5L7 2l6 8.5H1z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="M7 6v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="7" cy="10" r="0.7" fill="currentColor" />
      </svg>
    ),
  },
  network: {
    label: 'No connection',
    accent: 'var(--color-error)',
    bg: 'var(--color-error-muted)',
    border: 'rgba(248, 113, 113, 0.18)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          d="M1.5 4.5a8 8 0 0 1 5.2-2M2 2l10 10"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path
          d="M5 7.5a4 4 0 0 1 4.5-.5M7 10.5a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  generic: {
    label: 'Error',
    accent: 'var(--color-error)',
    bg: 'var(--color-error-muted)',
    border: 'rgba(248, 113, 113, 0.18)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          d="M1 10.5L7 2l6 8.5H1z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="M7 6v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="7" cy="10" r="0.7" fill="currentColor" />
      </svg>
    ),
  },
};

export function ErrorNotification({
  message,
  type = 'generic',
  onDismiss,
  retryable = false,
  onRetry,
}: ErrorNotificationProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const config = ERROR_CONFIG[type];
  const isVisible = message !== null;

  /* Auto-dismiss after AUTO_DISMISS_MS for non-critical errors */
  useEffect(() => {
    if (!isVisible || !onDismiss) return;

    timerRef.current = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible, message, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        position: 'fixed',
        bottom: 'calc(var(--space-6) + var(--safe-area-bottom))',
        left: 'var(--space-4)',
        zIndex: 'var(--z-error)' as React.CSSProperties['zIndex'],
        maxWidth: '320px',
        width: 'calc(100vw - var(--space-8))',
        /* Slide up + fade entrance */
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
        pointerEvents: isVisible ? 'auto' : 'none',
        transition:
          'opacity var(--transition-normal), transform var(--transition-normal)',
      }}
    >
      {isVisible && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--color-bg-panel)',
            border: `1px solid ${config.border}`,
            borderLeft: `3px solid ${config.accent}`,
            borderRadius: 'var(--radius-md)',
            backdropFilter: 'blur(var(--blur-panel))',
            WebkitBackdropFilter: 'blur(var(--blur-panel))',
            boxShadow: 'var(--shadow-panel)',
            animation: 'fade-in-up var(--transition-normal) both',
          }}
        >
          {/* Top row: icon + label + dismiss */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            {/* Error type icon */}
            <span
              aria-hidden="true"
              style={{
                color: config.accent,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {config.icon}
            </span>

            {/* Type label */}
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-caption)',
                color: config.accent,
                letterSpacing: 'var(--tracking-widest)',
                textTransform: 'uppercase',
                flex: 1,
              }}
            >
              {config.label}
            </span>

            {/* Dismiss button */}
            {onDismiss && (
              <button
                className="icon-btn"
                onClick={onDismiss}
                aria-label="Dismiss error"
                style={{ width: '22px', height: '22px', flexShrink: 0 }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M1 1l8 8M9 1L1 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Error message */}
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-normal)',
              margin: 0,
            }}
          >
            {message}
          </p>

          {/* Retry action */}
          {retryable && onRetry && (
            <button
              onClick={onRetry}
              style={{
                alignSelf: 'flex-start',
                background: 'transparent',
                border: `1px solid ${config.border}`,
                borderRadius: 'var(--radius-sm)',
                padding: '3px var(--space-3)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-caption)',
                color: config.accent,
                letterSpacing: 'var(--tracking-wide)',
                cursor: 'pointer',
                transition:
                  'background var(--transition-fast), border-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = config.bg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
