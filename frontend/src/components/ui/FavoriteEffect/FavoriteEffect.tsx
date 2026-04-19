'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './FavoriteEffect.module.css';

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  rotation: number;
  emoji: string;
  color: string;
}

interface ToastState {
  id: number;
  tutorName: string;
  visible: boolean;
}

declare global {
  interface WindowEventMap {
    'alemnypro-favorite-added': CustomEvent<{ tutorName: string; x: number; y: number }>;
  }
}

/* ─────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────── */
const EMOJIS = ['❤️', '💖', '💕', '✨', '⭐', '💫', '🌟'];
const COLORS = ['#ef4444', '#f97316', '#eab308', '#ec4899', '#8b5cf6', '#06b6d4'];
let nextId = 0;

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
export default function FavoriteEffect() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Spawn particles at click position */
  const spawnParticles = useCallback((x: number, y: number) => {
    const count = 14;
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      return {
        id: nextId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // slight upward bias
        scale: 0.6 + Math.random() * 0.8,
        rotation: Math.random() * 360,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    });

    setParticles((prev) => [...prev, ...newParticles]);

    // Remove particles after animation completes
    setTimeout(() => {
      setParticles((prev) =>
        prev.filter((p) => !newParticles.find((n) => n.id === p.id))
      );
    }, 1200);
  }, []);

  /* Show / refresh toast */
  const showToast = useCallback((tutorName: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);

    setToast({ id: nextId++, tutorName, visible: true });

    toastTimer.current = setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, visible: false } : null));
      setTimeout(() => setToast(null), 400); // wait for exit animation
    }, 2800);
  }, []);

  /* Listen for custom event */
  useEffect(() => {
    const handler = (e: CustomEvent<{ tutorName: string; x: number; y: number }>) => {
      spawnParticles(e.detail.x, e.detail.y);
      showToast(e.detail.tutorName);
    };

    window.addEventListener('alemnypro-favorite-added', handler);
    return () => window.removeEventListener('alemnypro-favorite-added', handler);
  }, [spawnParticles, showToast]);

  return (
    <>
      {/* ── Particles layer ── */}
      <div className={styles.particleLayer} aria-hidden>
        {particles.map((p) => (
          <span
            key={p.id}
            className={styles.particle}
            style={
              {
                '--px': `${p.x}px`,
                '--py': `${p.y}px`,
                '--vx': `${p.vx * 60}px`,
                '--vy': `${p.vy * 60}px`,
                '--scale': p.scale,
                '--rot': `${p.rotation}deg`,
                '--color': p.color,
              } as React.CSSProperties
            }
          >
            {p.emoji}
          </span>
        ))}
      </div>

      {/* ── Toast notification ── */}
      {toast && (
        <div
          key={toast.id}
          className={`${styles.toast} ${toast.visible ? styles.toastVisible : styles.toastHidden}`}
          role="status"
          aria-live="polite"
        >
          <div className={styles.toastIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <div className={styles.toastBody}>
            <span className={styles.toastTitle}>Added to Favorites!</span>
            {toast.tutorName && (
              <span className={styles.toastSub}>{toast.tutorName}</span>
            )}
          </div>
          <div className={styles.toastProgress} />
        </div>
      )}
    </>
  );
}
