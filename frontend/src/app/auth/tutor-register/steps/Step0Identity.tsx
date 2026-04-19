'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api';
import PhoneInput from '@/components/ui/PhoneInput/PhoneInput';
import styles from '../tutor-register.module.css';

interface Props {
  locale: 'ar' | 'en';
  onSuccess: (token: string, user: Record<string, unknown>) => void;
  onError: (msg: string) => void;
}

export default function Step0Identity({ locale, onSuccess, onError }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAr = locale === 'ar';
  const canSubmit = name && email && password.length >= 8 && (!phone || isPhoneValid);

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      const res = await authApi.register({
        name, email, phone, password,
        password_confirmation: password,
        role: 'tutor',
      });
      const data = res.data?.data || res.data;
      const token = data.token;
      const user  = data.user;
      localStorage.setItem('alemnypro_token', token);
      localStorage.setItem('alemnypro_user', JSON.stringify(user));
      onSuccess(token, user);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg = e.response?.data?.message || (isAr ? 'حدث خطأ. تحقق من البيانات.' : 'Registration failed.');
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHero}>
        <span className={styles.stepEmoji}>🏆</span>
        <h1 className={styles.cardTitle}>
          {isAr ? 'مرحباً بك في AlemnyPro!' : 'Welcome to AlemnyPro!'}
        </h1>
        <p className={styles.cardSubtitle}>
          {isAr
            ? 'انضم للرابطة الاحترافية — تحقق من هويتك للبدء'
            : "Welcome to the Pro league! Let's start by verifying your identity."}
        </p>
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
          : (isAr ? 'إنشاء الحساب والبدء →' : 'Create Account & Start →')}
      </button>
    </div>
  );
}
