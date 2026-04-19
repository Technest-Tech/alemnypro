'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { tutorApi } from '@/lib/api';
import styles from './OnboardingBanner.module.css';

interface OnboardingStatus {
  status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  current_step: number;
  completion_pct: number;
  completed_steps: Record<number, boolean>;
  missing: string[];
  resume_url: string;
}

const STEP_META: Record<string, { icon: string; labelAr: string; labelEn: string; stepNum: number }> = {
  account:      { icon: '🔐', labelAr: 'إنشاء الحساب',       labelEn: 'Account',       stepNum: 0 },
  subjects:     { icon: '📚', labelAr: 'التخصصات',            labelEn: 'Subjects',      stepNum: 1 },
  profile:      { icon: '✍️', labelAr: 'الملف المهني',        labelEn: 'Profile',       stepNum: 2 },
  format:       { icon: '📍', labelAr: 'شكل التدريس',         labelEn: 'Format',        stepNum: 3 },
  pricing:      { icon: '💰', labelAr: 'التسعير',             labelEn: 'Pricing',       stepNum: 4 },
  documents:    { icon: '🔒', labelAr: 'وثائق التحقق',        labelEn: 'Documents',     stepNum: 5 },
  availability: { icon: '📅', labelAr: 'جدول المواعيد',       labelEn: 'Availability',  stepNum: 6 },
};

interface Props {
  locale: 'ar' | 'en';
}

export default function OnboardingBanner({ locale }: Props) {
  const [data, setData]       = useState<OnboardingStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const isAr = locale === 'ar';

  const load = useCallback(async () => {
    try {
      const res = await tutorApi.getOnboardingStatus();
      const d = res.data?.data || res.data;
      setData(d);
    } catch {
      // not logged in or not a tutor — hide silently
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Don't show if approved, or 100% done and pending review, or dismissed
  if (!data || dismissed) return null;
  if (data.status === 'approved') return null;

  const pct = data.completion_pct;

  // ─── Pending Review state ─────────────────────────────────────────────────
  if (data.status === 'pending_review') {
    return (
      <div className={`${styles.banner} ${styles.bannerPending}`} dir={isAr ? 'rtl' : 'ltr'}>
        <div className={styles.bannerLeft}>
          <span className={styles.bannerEmoji}>🔍</span>
          <div className={styles.bannerText}>
            <strong>{isAr ? 'ملفك قيد المراجعة' : 'Your profile is under review'}</strong>
            <p>{isAr
              ? 'فريقنا يراجع مستنداتك — خلال 24-48 ساعة ستتلقى إشعاراً بالنتيجة.'
              : 'Our team is reviewing your documents — you\'ll hear back within 24-48 hours.'}</p>
          </div>
        </div>
        <button className={styles.dismissBtn} onClick={() => setDismissed(true)}>✕</button>
      </div>
    );
  }

  // ─── Incomplete profile → show urgency banner ─────────────────────────────
  const missingSteps = data.missing.map(key => STEP_META[key]).filter(Boolean);
  const nextMissing  = missingSteps[0];
  const resumeHref   = nextMissing
    ? `/auth/tutor-register?step=${nextMissing.stepNum}`
    : '/auth/tutor-register';

  return (
    <div className={`${styles.banner} ${styles.bannerIncomplete}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* ─ Left: message ─ */}
      <div className={styles.bannerLeft}>
        <span className={styles.bannerEmoji}>👁️</span>
        <div className={styles.bannerText}>
          <strong>
            {isAr
              ? `ملفك ${pct}% مكتمل — الطلاب لا يستطيعون إيجادك بعد`
              : `Your profile is ${pct}% complete — students can't find you yet`}
          </strong>
          <p>
            {isAr
              ? `أكمل ${missingSteps.length} خطوة متبقية للظهور في نتائج البحث وبدء استقبال الحجوزات.`
              : `Complete ${missingSteps.length} remaining step${missingSteps.length !== 1 ? 's' : ''} to appear in search and start receiving bookings.`}
          </p>
        </div>
      </div>

      {/* ─ Center: Progress bar + missing steps ─ */}
      <div className={styles.bannerCenter}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <div className={styles.missingChips}>
          {missingSteps.map(s => (
            <span key={s.labelEn} className={styles.missingChip}>
              {s.icon} {isAr ? s.labelAr : s.labelEn}
            </span>
          ))}
        </div>
      </div>

      {/* ─ Right: CTA ─ */}
      <div className={styles.bannerRight}>
        <Link href={resumeHref} className={styles.ctaBtn}>
          {isAr ? 'أكمل الآن ←' : 'Complete Now →'}
        </Link>
        <button className={styles.dismissBtn} onClick={() => setDismissed(true)}>
          {isAr ? 'لاحقاً' : 'Later'}
        </button>
      </div>
    </div>
  );
}
