'use client';

import { useEffect, useRef, useState } from 'react';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface ToastPayload {
  id?: number;
  message: string;
  type?: ToastType;
  duration?: number; // ms, default 4000
}

interface Props extends ToastPayload {
  onDismiss: () => void;
}

const CONFIG: Record<ToastType, {
  bg: string; border: string; icon: string; color: string; progress: string;
}> = {
  error: {
    bg: 'linear-gradient(135deg,#1E0A0A,#2D0F0F)',
    border: 'rgba(239,68,68,0.35)',
    icon: '❌',
    color: '#FCA5A5',
    progress: '#EF4444',
  },
  success: {
    bg: 'linear-gradient(135deg,#022C22,#064E3B)',
    border: 'rgba(52,211,153,0.3)',
    icon: '✅',
    color: '#6EE7B7',
    progress: '#10B981',
  },
  warning: {
    bg: 'linear-gradient(135deg,#1C1200,#2D1E00)',
    border: 'rgba(251,191,36,0.3)',
    icon: '⚠️',
    color: '#FDE68A',
    progress: '#F59E0B',
  },
  info: {
    bg: 'linear-gradient(135deg,#0A1628,#0F2040)',
    border: 'rgba(96,165,250,0.3)',
    icon: 'ℹ️',
    color: '#93C5FD',
    progress: '#3B82F6',
  },
};

export function AppToast({ message, type = 'error', duration = 4000, onDismiss }: Props) {
  const cfg = CONFIG[type];
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // mount → slide in
    requestAnimationFrame(() => setVisible(true));

    timerRef.current = setTimeout(() => dismiss(), duration);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    setLeaving(true);
    setTimeout(onDismiss, 350);
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 28,
        left: '50%',
        transform: `translateX(-50%) translateY(${visible && !leaving ? '0' : '-24px'})`,
        opacity: visible && !leaving ? 1 : 0,
        transition: leaving
          ? 'opacity 0.28s ease, transform 0.28s ease'
          : 'opacity 0.36s cubic-bezier(0.16,1,0.3,1), transform 0.36s cubic-bezier(0.16,1,0.3,1)',
        zIndex: 99999,
        minWidth: 320,
        maxWidth: 'min(90vw, 500px)',
        pointerEvents: 'auto',
      }}
    >
      {/* Card */}
      <div
        style={{
          background: cfg.bg,
          border: `1.5px solid ${cfg.border}`,
          borderRadius: 18,
          boxShadow: `0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset`,
          overflow: 'hidden',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Body */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            padding: '16px 18px',
          }}
        >
          {/* Icon bubble */}
          <div
            style={{
              flexShrink: 0,
              width: 38,
              height: 38,
              borderRadius: 12,
              background: `${cfg.progress}22`,
              border: `1.5px solid ${cfg.progress}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
            }}
          >
            {cfg.icon}
          </div>

          {/* Message */}
          <p
            style={{
              flex: 1,
              fontSize: '0.875rem',
              fontWeight: 600,
              color: cfg.color,
              lineHeight: 1.5,
              margin: '4px 0 0',
              fontFamily: 'inherit',
            }}
          >
            {message}
          </p>

          {/* Close button */}
          <button
            onClick={dismiss}
            style={{
              flexShrink: 0,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.75rem',
              transition: 'background 0.15s, color 0.15s',
              marginTop: 2,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
            }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>

        {/* Auto-dismiss progress bar */}
        <div
          style={{
            height: 3,
            background: `rgba(255,255,255,0.06)`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: cfg.progress,
              transformOrigin: 'left',
              animation: `toastProgress ${duration}ms linear forwards`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes toastProgress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Toast Manager Hook ───────────────────────────────────────────────────────

let _toastId = 0;

interface ToastItem extends ToastPayload { id: number; }

/**
 * Minimal self-contained hook. For single-page use — no context needed.
 * Usage:
 *   const { toasts, showToast, dismissToast } = useToasts();
 *   showToast({ message: 'Oops!', type: 'error' });
 *   return <ToastContainer toasts={toasts} onDismiss={dismissToast} />
 */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function showToast(payload: ToastPayload) {
    const id = ++_toastId;
    setToasts(t => [...t, { ...payload, id }]);
    return id;
  }

  function dismissToast(id: number) {
    setToasts(t => t.filter(x => x.id !== id));
  }

  return { toasts, showToast, dismissToast };
}

/** Renders all active toasts, stacked vertically from the top. */
export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ReturnType<typeof useToasts>['toasts'];
  onDismiss: (id: number) => void;
}) {
  return (
    <>
      {toasts.map((t, idx) => (
        <div
          key={t.id}
          style={{
            position: 'fixed',
            top: 28 + idx * 80,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 99999 + idx,
            padding: '0 16px',
          }}
        >
          <AppToast
            key={t.id}
            {...t}
            onDismiss={() => onDismiss(t.id)}
          />
        </div>
      ))}
    </>
  );
}
