'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from '@/lib/locale';
import { useAuthModal } from '@/lib/AuthModalContext';
import { authApi } from '@/lib/api';
import styles from './AuthModal.module.css';

/* ── Google SVG ─────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ── Reason config ─────────────────────────────────────────── */
const REASON_MAP: Record<string, { icon: string; titleAr: string; titleEn: string; subAr: string; subEn: string }> = {
  book: {
    icon: '📅',
    titleAr: 'احجز درسك الأول',
    titleEn: 'Book your first lesson',
    subAr: 'سجل دخولك واحجز مع أفضل المعلمين',
    subEn: 'Sign in and book with top tutors',
  },
  message: {
    icon: '💬',
    titleAr: 'تواصل مع المعلم',
    titleEn: 'Message the tutor',
    subAr: 'سجل دخولك لإرسال رسالة مباشرة',
    subEn: 'Sign in to send a direct message',
  },
  enroll: {
    icon: '🎓',
    titleAr: 'انضم للجلسة الجماعية',
    titleEn: 'Join the group session',
    subAr: 'سجل دخولك لحجز مقعدك الآن',
    subEn: 'Sign in to reserve your seat now',
  },
  favorite: {
    icon: '❤️',
    titleAr: 'احفظ معلمك المفضل',
    titleEn: 'Save your favorite tutor',
    subAr: 'سجل دخولك لحفظ المفضلات ومتابعتها',
    subEn: 'Sign in to save and track your favorites',
  },
  default: {
    icon: '🔐',
    titleAr: 'مرحباً بك في AlemnyPro',
    titleEn: 'Welcome to AlemnyPro',
    subAr: 'سجل دخولك للوصول إلى كامل المنصة',
    subEn: 'Sign in to unlock the full platform',
  },
};

const PLATFORM_FEATURES = [
  { icon: '✅', ar: '500+ معلم موثق ومُقيَّم', en: '500+ verified & rated tutors' },
  { icon: '🎁', ar: 'الدرس الأول مجاني مع معظم المعلمين', en: 'First lesson free with most tutors' },
  { icon: '🔒', ar: 'دفع مضمون حتى إتمام الجلسة', en: 'Escrow-protected payments' },
  { icon: '⭐', ar: 'تقييم متوسط 4.9 من 5', en: 'Average rating 4.9 out of 5' },
];

export default function AuthModal() {
  const { isOpen, options, closeAuthModal } = useAuthModal();
  const { locale } = useLocale();
  const isRtl = locale === 'ar';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, closeAuthModal]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authApi.login({ email, password });
      const { token, user } = res.data;

      localStorage.setItem('alemnypro_token', token);
      localStorage.setItem('alemnypro_user', JSON.stringify(user));

      closeAuthModal();

      // Fire success callback
      if (options.onSuccess) options.onSuccess();

      // Notify Header & other listeners
      window.dispatchEvent(new Event('alemnypro-auth-change'));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(
        axiosErr.response?.data?.message ||
          (isRtl ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password')
      );
    } finally {
      setLoading(false);
    }
  }, [email, password, isRtl, closeAuthModal, options]);

  if (!isOpen) return null;

  const reasonKey = (options.reason || 'default') as keyof typeof REASON_MAP;
  const reason = REASON_MAP[reasonKey] ?? REASON_MAP.default;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => { if (e.target === e.currentTarget) closeAuthModal(); }}
      role="dialog"
      aria-modal="true"
      aria-label={isRtl ? 'تسجيل الدخول' : 'Sign in'}
    >
      <div className={styles.modal} dir={isRtl ? 'rtl' : 'ltr'}>

        {/* ══════════════ LEFT: VISUAL PANEL ══════════════ */}
        <div className={styles.visual}>
          {/* Decorative blobs */}
          <div className={styles.visualBlob1} aria-hidden />
          <div className={styles.visualBlob2} aria-hidden />
          <div className={styles.visualBlob3} aria-hidden />
          {/* Grid texture */}
          <div className={styles.visualGrid} aria-hidden />

          {/* Logo */}
          <div className={styles.visualLogo}>
            <span className={styles.visualLogoIcon}>🎓</span>
            <span className={styles.visualLogoText}>
              Alemny<span className={styles.visualLogoAccent}>Pro</span>
            </span>
          </div>

          {/* Context hero */}
          <div className={styles.visualHero}>
            <span className={styles.visualReasonIcon}>{reason.icon}</span>
            <h2 className={styles.visualTitle}>
              {isRtl ? reason.titleAr : reason.titleEn}
            </h2>
            <p className={styles.visualSubtitle}>
              {isRtl ? reason.subAr : reason.subEn}
            </p>
          </div>

          {/* Feature list */}
          <div className={styles.visualFeatures}>
            {PLATFORM_FEATURES.map((f, i) => (
              <div key={i} className={styles.visualFeature}>
                <span className={styles.visualFeatureDot} />
                <span>{f.icon} {isRtl ? f.ar : f.en}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════ RIGHT: FORM PANEL ══════════════ */}
        <div className={styles.form}>
          {/* Close */}
          <button className={styles.closeBtn} onClick={closeAuthModal} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13"/>
            </svg>
          </button>

          {/* Heading */}
          <h2 className={styles.formTitle}>
            {isRtl ? 'تسجيل الدخول' : 'Sign in'}
          </h2>
          <p className={styles.formSubtitle}>
            {isRtl ? 'أهلاً بك مجدداً! أدخل بياناتك للمتابعة.' : 'Welcome back! Enter your credentials to continue.'}
          </p>

          <div className={styles.fields}>
            {/* Error */}
            {error && (
              <div className={styles.errorBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Google (coming soon) */}
            <button type="button" className={styles.googleBtn} disabled>
              <GoogleIcon />
              {isRtl ? 'المتابعة بـ Google (قريباً)' : 'Continue with Google (soon)'}
            </button>

            {/* Divider */}
            <div className={styles.divider}>
              {isRtl ? 'أو بالبريد الإلكتروني' : 'or with email'}
            </div>

            {/* Email */}
            <form onSubmit={handleSubmit} noValidate style={{ display: 'contents' }}>
              <div className={styles.fieldWrap}>
                <label className={styles.fieldLabel} htmlFor="auth-email">
                  {isRtl ? 'البريد الإلكتروني' : 'Email address'}
                </label>
                <div className={styles.fieldInner}>
                  <span className={styles.fieldIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </span>
                  <input
                    id="auth-email"
                    type="email"
                    className={styles.fieldInput}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div className={styles.fieldWrap}>
                <label className={styles.fieldLabel} htmlFor="auth-password">
                  {isRtl ? 'كلمة المرور' : 'Password'}
                </label>
                <div className={styles.fieldInner}>
                  <span className={styles.fieldIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    id="auth-password"
                    type="password"
                    className={styles.fieldInput}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
                id="auth-modal-submit"
              >
                {loading ? (
                  <><span className={styles.spinner} />{isRtl ? 'جاري التحقق...' : 'Signing in...'}</>
                ) : (
                  <>
                    {isRtl ? 'تسجيل الدخول' : 'Sign In'}
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <p className={styles.footerNote}>
              {isRtl ? 'ليس لك حساب؟' : "Don't have an account?"}
              <a
                href="/auth/register"
                className={styles.footerLink}
                onClick={closeAuthModal}
              >
                {isRtl ? ' إنشاء حساب مجاني →' : ' Create free account →'}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
