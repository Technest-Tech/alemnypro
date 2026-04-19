'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/locale';
import { authApi } from '@/lib/api';
import { saveAuth, getStoredToken, getStoredUser, getRoleHome } from '@/lib/auth';
import Footer from '@/components/layout/Footer';
import PhoneInput from '@/components/ui/PhoneInput/PhoneInput';
import styles from './register.module.css';

type Step = 'choose' | 'student';

export default function RegisterPage() {
  const { locale } = useLocale();
  const router = useRouter();

  const [step, setStep] = useState<Step>('choose');
  const [isChecking, setIsChecking] = useState(true);

  // Redirect already-logged-in users to their dashboard
  useEffect(() => {
    const token = getStoredToken();
    const user  = getStoredUser();
    if (token && user?.role) {
      router.replace(getRoleHome(user.role));
    } else {
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) return null;

  // Student form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/auth/google/redirect`;
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError(locale === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }
    
    if (!isPhoneValid) {
      setError(locale === 'ar' ? 'رقم الهاتف غير صحيح' : 'Invalid phone number format');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.register({
        name, email, phone, password,
        password_confirmation: passwordConfirm,
        role: 'student',
      });
      const token = data.token || data.data?.token;
      const user  = data.user  || data.data?.user;
      saveAuth(token, user);
      router.push('/dashboard/student');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(
        axiosErr.response?.data?.message ||
        (locale === 'ar' ? 'حدث خطأ أثناء التسجيل' : 'Registration failed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      
      <div className={styles.page}>
        <div className={styles.glowOrb1} />
        <div className={styles.glowOrb2} />

        <div className={styles.wrapper}>

          {/* ═══════════════════════════════════════════
              STEP 1 — ROLE CHOOSER
          ═══════════════════════════════════════════ */}
          {step === 'choose' && (
            <div className={styles.roleChooserCard}>
              <h1 className={styles.roleTitle}>
                {locale === 'ar' ? 'كيف تريد الانضمام؟' : 'How would you like to join?'}
              </h1>
              <p className={styles.roleSubtitle}>
                {locale === 'ar'
                  ? 'اختر نوع حسابك للبدء — يمكنك التغيير لاحقاً'
                  : 'Choose your account type to get started — you can change later'}
              </p>

              <div className={styles.roleGrid}>
                {/* Student Card */}
                <div className={styles.roleCard} onClick={() => setStep('student')}>
                  <span className={styles.roleCardIcon}>🎒</span>
                  <div className={styles.roleCardTitle}>
                    {locale === 'ar' ? 'أنا طالب' : "I'm a Student"}
                  </div>
                  <div className={styles.roleCardDesc}>
                    {locale === 'ar'
                      ? 'اعثر على معلمين متميزين واحجز دروسك بسهولة'
                      : 'Find amazing tutors and book your lessons easily'}
                  </div>
                  <span className={styles.roleCardArrow}>
                    {locale === 'ar' ? 'ابدأ الآن ←' : 'Get Started →'}
                  </span>
                </div>

                {/* Teacher Card */}
                <div className={styles.roleCard} onClick={() => router.push('/auth/tutor-register')}>
                  <span className={styles.roleCardIcon}>🧑‍🏫</span>
                  <div className={styles.roleCardTitle}>
                    {locale === 'ar' ? 'أنا معلم' : "I'm a Tutor"}
                  </div>
                  <div className={styles.roleCardDesc}>
                    {locale === 'ar'
                      ? 'شارك خبرتك وابدأ في التدريس وكسب الدخل'
                      : 'Share your expertise, start teaching and earning'}
                  </div>
                  <span className={styles.roleCardArrow}>
                    {locale === 'ar' ? 'انضم كمعلم ←' : 'Become a Tutor →'}
                  </span>
                </div>
              </div>

              <p className={styles.loginLink}>
                {locale === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}
                <Link href="/auth/login" className={styles.loginLinkA}>
                  {locale === 'ar' ? 'سجّل دخولك' : 'Sign In'}
                </Link>
              </p>
            </div>
          )}

          {/* ═══════════════════════════════════════════
              STEP 2 — STUDENT REGISTRATION FORM
          ═══════════════════════════════════════════ */}
          {step === 'student' && (
            <div className={styles.formCard}>
              <button className={styles.backBtn} onClick={() => setStep('choose')}>
                ← {locale === 'ar' ? 'رجوع' : 'Back'}
              </button>

              <h1 className={styles.formTitle}>
                🎒 {locale === 'ar' ? 'إنشاء حساب طالب' : 'Create Student Account'}
              </h1>
              <p className={styles.formSubtitle}>
                {locale === 'ar'
                  ? 'سجّل مجاناً واحجز أول درس خلال دقائق'
                  : 'Sign up for free and book your first lesson in minutes'}
              </p>

              {/* Google OAuth */}
              <button className={styles.googleBtn} type="button" onClick={handleGoogleAuth}>
                <svg className={styles.googleIcon} width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.44 1.18 4.93l3.66-2.84Z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
                </svg>
                {locale === 'ar' ? 'التسجيل بـ Google' : 'Continue with Google'}
              </button>

              {/* Divider */}
              <div className={styles.divider}>
                <span className={styles.dividerText}>{locale === 'ar' ? 'أو' : 'or'}</span>
              </div>

              {/* Error */}
              {error && <div className={styles.error}>{error}</div>}

              {/* Form */}
              <form onSubmit={handleStudentSubmit}>
                <div className={styles.fields}>
                  {/* Full Name */}
                  <div className={styles.field}>
                    <label className={styles.label}>
                      {locale === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                    </label>
                    <input
                      className={styles.input}
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={locale === 'ar' ? 'أحمد محمد' : 'Ahmed Mohamed'}
                      required
                      autoComplete="name"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>
                        {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                      </label>
                      <input
                        className={styles.input}
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>
                        {locale === 'ar' ? 'رقم الواتساب' : 'WhatsApp Number'}
                      </label>
                      <PhoneInput
                        value={phone}
                        onChange={setPhone}
                        onValidate={setIsPhoneValid}
                        error={phone.length > 6 && !isPhoneValid}
                      />
                    </div>
                  </div>

                  {/* Passwords */}
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>
                        {locale === 'ar' ? 'كلمة المرور' : 'Password'}
                      </label>
                      <div className={styles.passwordWrap}>
                        <input
                          className={styles.input}
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={8}
                          autoComplete="new-password"
                        />
                        <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>
                        {locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm'}
                      </label>
                      <input
                        className={styles.input}
                        type="password"
                        value={passwordConfirm}
                        onChange={e => setPasswordConfirm(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>

                <button className={styles.submitBtn} type="submit" disabled={loading || (phone.length > 0 && !isPhoneValid)}>
                  {loading
                    ? (locale === 'ar' ? 'جاري إنشاء الحساب...' : 'Creating account...')
                    : (locale === 'ar' ? 'إنشاء الحساب' : 'Create Account')}
                </button>
              </form>

              <p className={styles.terms}>
                {locale === 'ar'
                  ? <>بالتسجيل، أنت توافق على <Link href="#" className={styles.termsLink}>الشروط والأحكام</Link> و<Link href="#" className={styles.termsLink}>سياسة الخصوصية</Link></>
                  : <>By signing up, you agree to our <Link href="#" className={styles.termsLink}>Terms</Link> and <Link href="#" className={styles.termsLink}>Privacy Policy</Link></>
                }
              </p>

              <p className={styles.footer}>
                {locale === 'ar' ? 'لديك حساب؟' : 'Already have an account?'}
                <Link href="/auth/login" className={styles.footerLink}>
                  {locale === 'ar' ? 'سجل دخولك' : 'Sign In'}
                </Link>
              </p>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  );
}
