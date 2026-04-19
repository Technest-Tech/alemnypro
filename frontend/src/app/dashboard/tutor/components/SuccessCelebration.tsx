'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '../../dashboard.module.css';

interface Props {
  message?: string;
  onDone?: () => void;
}

// Generate random confetti particles once
const CONFETTI = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,          // vw %
  delay: Math.random() * 0.6,      // s
  duration: 1.2 + Math.random() * 1.2, // s
  size: 6 + Math.random() * 8,     // px
  color: [
    '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
    '#EC4899', '#F97316', '#06B6D4', '#EF4444',
  ][Math.floor(Math.random() * 8)],
  shape: Math.random() > 0.5 ? 'circle' : 'rect',
  rotation: Math.random() * 360,
}));

export default function SuccessCelebration({ message = 'Updated successfully!', onDone }: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setMounted(true);
    const hide   = setTimeout(() => setVisible(false), 2800);
    const finish = setTimeout(() => onDone?.(), 3200);
    return () => { clearTimeout(hide); clearTimeout(finish); };
  }, [onDone]);

  if (!mounted || !visible) return null;

  return createPortal(
    <div className={styles.celebrationRoot} aria-live="polite">
      {/* ── Confetti ── */}
      {CONFETTI.map(p => (
        <div
          key={p.id}
          className={styles.confettiPiece}
          style={{
            left: `${p.x}vw`,
            width:  p.shape === 'circle' ? p.size : p.size * 1.2,
            height: p.shape === 'circle' ? p.size : p.size * 0.6,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            background: p.color,
            animationDelay:    `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}

      {/* ── Toast Card ── */}
      <div className={styles.celebrationCard}>
        {/* Glow ring */}
        <div className={styles.celebrationGlow} />

        {/* Checkmark SVG with draw animation */}
        <div className={styles.celebrationCheckWrap}>
          <svg viewBox="0 0 52 52" className={styles.celebrationCheck}>
            <circle cx="26" cy="26" r="25" className={styles.celebrationCircle} />
            <path d="M14 27 l8 8 l16-16" className={styles.celebrationTick} />
          </svg>
        </div>

        {/* Sparkles */}
        {['✦','✧','✦','✧','✦'].map((s, i) => (
          <span key={i} className={styles.celebrationSparkle} style={{
            animationDelay: `${i * 0.1}s`,
            top: `${20 + Math.sin(i * 72 * Math.PI / 180) * 38}%`,
            left: `${50 + Math.cos(i * 72 * Math.PI / 180) * 38}%`,
          }}>{s}</span>
        ))}

        <p className={styles.celebrationMsg}>{message}</p>
      </div>
    </div>,
    document.body,
  );
}
