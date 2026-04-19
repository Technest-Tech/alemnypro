'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/lib/locale';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { saveAuth, getStoredToken, getStoredUser, getRoleHome, updateStoredUser } from '@/lib/auth';
import PhoneInput from '@/components/ui/PhoneInput/PhoneInput';
import styles from './tutor-register.module.css';

export default function TutorRegisterPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  // ── Auth state: detect logged-in students for upgrade flow ──
  const [loggedInStudent, setLoggedInStudent] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const user  = getStoredUser();
    if (token && user?.role) {
      if (user.role === 'student') {
        // Student is logged in — show upgrade card instead of registration form
        setLoggedInStudent({ name: user.name, email: user.email, avatar: user.avatar });
        setIsChecking(false);
      } else {
        // Tutor or admin — redirect to their dashboard
        router.replace(getRoleHome(user.role));
      }
    } else {
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) return null;

  // ── Upgrade handler for logged-in students ──
  const handleUpgrade = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await authApi.upgradeToTutor();
      const data = res.data?.data || res.data;
      const updatedUser = data.user;
      // Update stored auth state
      updateStoredUser(updatedUser);
      setUpgradeSuccess(true);
      // Redirect to tutor dashboard after success animation  
      setTimeout(() => {
        router.push('/dashboard/tutor');
      }, 2000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || (isAr ? 'حدث خطأ. حاول مرة أخرى.' : 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // ── Fresh registration handler ──
  const canSubmit = name && email && password.length >= 8 && (!phone || isPhoneValid);

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await authApi.register({
        name, email, phone, password,
        password_confirmation: password,
        role: 'tutor',
      });
      const data = res.data?.data || res.data;
      saveAuth(data.token, data.user);
      router.push('/dashboard/tutor');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || (isAr ? 'حدث خطأ. تحقق من البيانات.' : 'Registration failed.'));
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════
  // RENDER: Upgrade Card for Logged-in Students
  // ═══════════════════════════════════════════════════════
  if (loggedInStudent) {
    return (
      <div className={`${styles.page} ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
        <div className={styles.upgradeWrap}>

          {/* Success State */}
          {upgradeSuccess ? (
            <div className={styles.upgradeSuccess}>
              <div className={styles.upgradeSuccessIcon}>🎉</div>
              <h2 className={styles.upgradeSuccessTitle}>
                {isAr ? 'مبروك! أصبحت معلماً على AlemnyPro' : `Congratulations! You're now a Tutor`}
              </h2>
              <p className={styles.upgradeSuccessDesc}>
                {isAr ? 'جاري تحويلك إلى لوحة التحكم...' : 'Redirecting to your dashboard...'}
              </p>
              <div className={styles.upgradeSpinner} />
            </div>
          ) : (
            <div className={styles.upgradeCard}>
              {/* Header */}
              <div className={styles.upgradeHeader}>
                <span className={styles.upgradeEmoji}>🚀</span>
                <h1 className={styles.upgradeTitle}>
                  {isAr ? 'ابدأ التدريس على AlemnyPro' : 'Start Teaching on AlemnyPro'}
                </h1>
                <p className={styles.upgradeSubtitle}>
                  {isAr
                    ? 'أنت مسجّل بالفعل كطالب. فعّل ملفك كمعلم بضغطة واحدة!'
                    : 'You\'re already registered as a student. Activate your tutor profile with one click!'}
                </p>
              </div>

              {/* Current Account Info */}
              <div className={styles.upgradeUserInfo}>
                <div className={styles.upgradeAvatar}>
                  {loggedInStudent.avatar
                    ? <img src={loggedInStudent.avatar} alt="" className={styles.upgradeAvatarImg} />
                    : <span className={styles.upgradeAvatarFallback}>{loggedInStudent.name.charAt(0)}</span>}
                </div>
                <div>
                  <div className={styles.upgradeUserName}>{loggedInStudent.name}</div>
                  <div className={styles.upgradeUserEmail}>{loggedInStudent.email}</div>
                  <span className={styles.upgradeRoleBadge}>
                    🎒 {isAr ? 'حساب طالب' : 'Student Account'}
                  </span>
                </div>
              </div>

              {/* Value Props */}
              <div className={styles.upgradePerks}>
                {[
                  { icon: '✅', ar: 'نفس الحساب — بدون تسجيل جديد', en: 'Same account — no re-registration' },
                  { icon: '💰', ar: 'اضبط أسعارك ومواعيدك بحرية', en: 'Set your own rates and schedule' },
                  { icon: '🎓', ar: 'حافظ على ميزات حساب الطالب', en: 'Keep all your student features' },
                  { icon: '⚡', ar: 'ابدأ استقبال طلبات فوراً', en: 'Start receiving bookings instantly' },
                ].map((p, i) => (
                  <div key={i} className={styles.upgradePerkItem}>
                    <span className={styles.upgradePerkIcon}>{p.icon}</span>
                    <span className={styles.upgradePerkText}>{isAr ? p.ar : p.en}</span>
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && <div className={styles.globalError}>⚠️ {error}</div>}

              {/* CTA */}
              <button
                className={styles.upgradeBtn}
                onClick={handleUpgrade}
                disabled={loading}
              >
                {loading
                  ? <span className={styles.btnSpinner} />
                  : (isAr ? '🚀 فعّل ملف المعلم الآن' : '🚀 Activate Tutor Profile Now')}
              </button>

              <p className={styles.upgradeTrust}>
                🔐 {isAr ? 'يمكنك العودة لحساب الطالب في أي وقت' : 'You can switch back anytime'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // RENDER: Fresh Registration (not logged in)
  // ═══════════════════════════════════════════════════════
  return (
    <div className={`${styles.page} ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>

      {/* ─ Progress Bar (full since it's one step) ─ */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: '14%' }} />
      </div>

      {/* ─ Hero ─ */}
      <div className={styles.stepperWrap}>
        <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
          <span style={{ fontSize: '2.25rem' }}>🏆</span>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>
            {isAr ? 'خطوة 1 من 1 — إنشاء الحساب' : 'Step 1 — Create Account'}
          </p>
        </div>
      </div>

      {/* ─ Card ─ */}
      <div className={styles.card}>
        {error && (
          <div className={styles.globalError}>
            ⚠️ {error}
            <button onClick={() => setError('')} className={styles.errorClose}>✕</button>
          </div>
        )}

        <div className={styles.stepContent}>
          <div className={styles.stepHero}>
            <h1 className={styles.cardTitle}>
              {isAr ? 'مرحباً بك في AlemnyPro!' : 'Welcome to AlemnyPro!'}
            </h1>
            <p className={styles.cardSubtitle}>
              {isAr
                ? 'أنشئ حسابك في 30 ثانية — أكمل ملفك لاحقاً من لوحة التحكم'
                : 'Create your account in 30 seconds — complete your profile from the dashboard'}
            </p>
          </div>

          {/* Value props */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { icon: '⚡', ar: 'تسجيل سريع', en: 'Quick signup' },
              { icon: '🔒', ar: 'بياناتك آمنة', en: 'Secure & private' },
              { icon: '🎯', ar: 'أكمل ملفك متى شئت', en: 'Complete profile at your pace' },
            ].map(v => (
              <div key={v.en} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                background: 'rgba(27,73,101,0.06)', borderRadius: 100,
                fontSize: '0.75rem', fontWeight: 700, color: '#1B4965',
              }}>
                <span>{v.icon}</span>
                <span>{isAr ? v.ar : v.en}</span>
              </div>
            ))}
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label}>
                {isAr ? '👤 الاسم الكامل' : '👤 Full Name'}
              </label>
              <input
                id="reg-name"
                className={styles.input}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={isAr ? 'محمد أحمد الشافعي' : 'Ahmed Mohamed'}
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>
                  {isAr ? '📧 البريد الإلكتروني' : '📧 Email'}
                </label>
                <input
                  id="reg-email"
                  className={styles.input}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ahmed@example.com"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  {isAr ? '📱 رقم الواتساب' : '📱 WhatsApp Number'}
                </label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  onValidate={setIsPhoneValid}
                  error={phone.length > 6 && !isPhoneValid}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                {isAr ? '🔒 كلمة المرور' : '🔒 Password'}
              </label>
              <div className={styles.passwordWrap}>
                <input
                  id="reg-password"
                  className={styles.input}
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className={styles.showPassBtn}
                  onClick={() => setShowPass(v => !v)}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
              {password && password.length < 8 && (
                <span className={styles.hint}>
                  {isAr ? `${8 - password.length} أحرف أخرى على الأقل` : `${8 - password.length} more characters needed`}
                </span>
              )}
            </div>
          </div>

          <div className={styles.trustRow}>
            <span>🔐</span>
            <span>{isAr ? 'بياناتك محمية بالكامل ومشفرة' : 'Your data is fully secured and encrypted'}</span>
          </div>

          <button
            id="reg-submit"
            className={styles.nextBtn}
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading
              ? <span className={styles.btnSpinner} />
              : (isAr ? 'إنشاء الحساب والبدء ←' : 'Create Account & Start →')}
          </button>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
            <a href="/auth/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
              {isAr ? 'تسجيل الدخول' : 'Sign in'}
            </a>
          </p>
        </div>
      </div>

      {/* ─ Trust footer ─ */}
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {isAr
          ? 'بتسجيلك أنت توافق على شروط الاستخدام وسياسة الخصوصية'
          : 'By signing up you agree to our Terms of Service & Privacy Policy'}
      </div>
    </div>
  );
}
