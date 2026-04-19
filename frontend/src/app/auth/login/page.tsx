'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/lib/locale';
import { authApi } from '@/lib/api';
import { saveAuth, getStoredToken, getStoredUser, getRoleHome } from '@/lib/auth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Footer from '@/components/layout/Footer';
import styles from './login.module.css';

export default function LoginPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // If already logged in, redirect to dashboard immediately
  useEffect(() => {
    const token = getStoredToken();
    const user  = getStoredUser();
    if (token && user?.role) {
      router.replace(getRoleHome(user.role));
    } else {
      setIsChecking(false);
    }
  }, [router]);

  // Don't render the form until we've confirmed the user is NOT logged in
  if (isChecking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const data = res.data;
      const user  = data.user  || data.data?.user;
      const token = data.token || data.data?.token;

      // Persist to both localStorage + cookies (needed by middleware)
      saveAuth(token, user);

      const role = user?.role;

      // Honour ?redirect= param (set by middleware when blocking a protected page)
      const redirectTo = searchParams.get('redirect');
      if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('/auth')) {
        router.push(redirectTo);
        return;
      }

      // Default role-based redirect — tutors always go to dashboard now
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'tutor') {
        router.push('/dashboard/tutor');
      } else {
        router.push('/dashboard/student');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || (locale === 'ar' ? 'البريد أو كلمة المرور غير صحيحة' : 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/auth/google/redirect`;
  };

  return (
    <>
      
      <div className={styles.page}>
        <div className={styles.glowOrb1} />
        <div className={styles.glowOrb2} />

        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h1 className={styles.title}>
                {locale === 'ar' ? 'مرحباً بعودتك! 👋' : 'Welcome Back! 👋'}
              </h1>
              <p className={styles.subtitle}>
                {locale === 'ar' ? 'سجّل دخولك لمتابعة رحلتك التعليمية' : 'Sign in to continue your learning journey'}
              </p>
            </div>

            {/* Google Auth */}
            <button className={styles.googleBtn} onClick={handleGoogleAuth} type="button">
              <svg className={styles.googleIcon} width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.44 1.18 4.93l3.66-2.84Z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
              </svg>
              {locale === 'ar' ? 'تسجيل الدخول بـ Google' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className={styles.divider}>
              <span>{locale === 'ar' ? 'أو' : 'or'}</span>
            </div>

            {/* Error */}
            {error && <div className={styles.error}>{error}</div>}

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>
                  {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <input
                  className={styles.input}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label}>
                    {locale === 'ar' ? 'كلمة المرور' : 'Password'}
                  </label>
                  <button type="button" className={styles.forgotLink}>
                    {locale === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </button>
                </div>
                <div className={styles.passwordWrap}>
                  <input
                    className={styles.input}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button className={styles.submitBtn} type="submit" disabled={loading}>
                {loading
                  ? (locale === 'ar' ? 'جاري التسجيل...' : 'Signing in...')
                  : (locale === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
              </button>
            </form>
          </div>

          {/* Bottom Links */}
          <div className={styles.bottomLinks}>
            <span className={styles.bottomText}>
              {locale === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}
            </span>
            <div className={styles.signupOptions}>
              <Link href="/auth/register" className={styles.signupLink}>
                🎒 {locale === 'ar' ? 'تسجيل كطالب' : 'Student Signup'}
              </Link>
              <Link href="/auth/tutor-register" className={styles.signupLinkTutor}>
                🧑‍🏫 {locale === 'ar' ? 'انضم كمعلم' : 'Become a Tutor'}
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
