'use client';

import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tutorApi } from '@/lib/api';
import Link from 'next/link';
import styles from '../../dashboard.module.css';
import SuccessCelebration from './SuccessCelebration';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileData {
  name?: string;
  location?: string;
  location_label?: string;
  governorate?: { name_ar?: string; name_en?: string };
  city?: { name_ar?: string; name_en?: string };
  neighborhood?: { name_ar?: string; name_en?: string };
  user?: {
    email_verified_at?: string | null;
    phone_verified_at?: string | null;
    email?: string;
    phone?: string;
    avatar?: string;
  };
  avatar?: string;
  [key: string]: unknown;
}

interface MeData {
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
  email?: string;
  phone?: string;
  avatar?: string;
  [key: string]: unknown;
}

interface Props {
  profileData?: ProfileData;
  meData?: MeData;
  completedBookings: number;
  totalReviews: number;
  isAr: boolean;
}

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

// ─── OTP Modal ────────────────────────────────────────────────────────────────

function OtpModal({
  type,
  isAr,
  phone,
  onClose,
  onSuccess,
}: {
  type: 'email' | 'phone';
  isAr: boolean;
  phone?: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const qc = useQueryClient();
  const [step, setStep] = useState<'idle' | 'sent' | 'done'>('idle');
  const [otp, setOtp] = useState('');
  const [newPhone, setNewPhone] = useState(phone || '');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  function startCountdown() {
    setCountdown(60);
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  }

  const sendOtp = useMutation({
    mutationFn: () => type === 'email' ? tutorApi.sendEmailOtp() : tutorApi.sendPhoneOtp(newPhone !== phone ? newPhone : undefined),
    onSuccess: () => { setStep('sent'); setError(''); startCountdown(); },
    onError: (e: unknown) => setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || (isAr ? 'حدث خطأ' : 'An error occurred')),
  });

  const verifyOtp = useMutation({
    mutationFn: () => type === 'email' ? tutorApi.verifyEmailOtp(otp) : tutorApi.verifyPhoneOtp(otp),
    onSuccess: () => {
      setStep('done');
      qc.invalidateQueries({ queryKey: ['auth-me'] });
      onSuccess(type === 'email'
        ? (isAr ? 'تم تأكيد البريد الإلكتروني بنجاح ✨' : 'Email verified successfully ✨')
        : (isAr ? 'تم تأكيد رقم الهاتف بنجاح ✨' : 'Phone verified successfully ✨'));
      setTimeout(onClose, 1500);
    },
    onError: (e: unknown) => setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || (isAr ? 'الرمز غير صحيح' : 'Incorrect code')),
  });

  const title = type === 'email'
    ? (isAr ? 'تأكيد البريد الإلكتروني' : 'Verify Email')
    : (isAr ? 'تأكيد رقم الهاتف' : 'Verify Mobile');

  return (
    <Portal>
      <div className={styles.otpOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className={styles.otpModal}>
        <button className={styles.otpClose} onClick={onClose}>✕</button>
        <div className={styles.otpIcon}>{type === 'email' ? '📧' : '📱'}</div>
        <h3 className={styles.otpTitle}>{title}</h3>

        {step === 'done' ? (
          <div className={styles.otpSuccess}>
            <span className={styles.otpSuccessIcon}>✅</span>
            <p>{isAr ? 'تم التحقق بنجاح!' : 'Verified successfully!'}</p>
          </div>
        ) : step === 'idle' ? (
          <>
            <p className={styles.otpDesc}>
              {type === 'email'
                ? (isAr ? 'سنرسل رمز التحقق إلى بريدك الإلكتروني' : 'We\'ll send a verification code to your email')
                : (isAr ? 'أدخل رقم هاتفك المحمول' : 'Enter your mobile number')}
            </p>
            {type === 'phone' && (
              <input
                className={styles.otpInput}
                type="tel"
                placeholder={isAr ? 'مثال: +201XXXXXXXXX' : 'e.g. +33 6 XX XX XX XX'}
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                dir="ltr"
              />
            )}
            {error && <p className={styles.otpError}>{error}</p>}
            <button
              className={styles.otpSendBtn}
              onClick={() => sendOtp.mutate()}
              disabled={sendOtp.isPending || (type === 'phone' && !newPhone)}
            >
              {sendOtp.isPending ? '...' : (isAr ? 'إرسال الرمز' : 'Send Code')}
            </button>
          </>
        ) : (
          <>
            <p className={styles.otpDesc}>
              {type === 'email'
                ? (isAr ? 'تحقق من بريدك الإلكتروني وأدخل الرمز المكون من 6 أرقام' : 'Check your email and enter the 6-digit code')
                : (isAr ? `تم إرسال الرمز إلى ${newPhone}` : `Code sent to ${newPhone}`)}
            </p>
            <div className={styles.otpDigits}>
              <input
                className={styles.otpDigitInput}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                dir="ltr"
              />
            </div>
            {error && <p className={styles.otpError}>{error}</p>}
            <button
              className={styles.otpSendBtn}
              onClick={() => verifyOtp.mutate()}
              disabled={verifyOtp.isPending || otp.length < 6}
            >
              {verifyOtp.isPending ? '...' : (isAr ? 'تحقق' : 'Verify')}
            </button>
            {countdown > 0 ? (
              <p className={styles.otpResendInfo}>{isAr ? `إعادة الإرسال بعد ${countdown}ث` : `Resend in ${countdown}s`}</p>
            ) : (
              <button className={styles.otpResendBtn} onClick={() => sendOtp.mutate()} disabled={sendOtp.isPending}>
                {isAr ? 'إعادة الإرسال' : 'Resend Code'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
    </Portal>
  );
}

// ─── Address Edit Modal ────────────────────────────────────────────────────────

function AddressModal({ profileData, isAr, onClose, onSuccess }: { profileData?: ProfileData; isAr: boolean; onClose: () => void; onSuccess: (msg: string) => void }) {
  const qc = useQueryClient();
  const [location, setLocation] = useState(
    profileData?.location as string ||
    [profileData?.city?.name_en, profileData?.governorate?.name_en].filter(Boolean).join(', ') ||
    ''
  );
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: () => tutorApi.updateProfile({ location_label: location } as Record<string, unknown>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tutor-profile'] });
      onSuccess(isAr ? 'تم تحديث العنوان بنجاح 📍' : 'Address updated successfully 📍');
      onClose();
    },
    onError: (e: unknown) => setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || (isAr ? 'فشل الحفظ' : 'Save failed')),
  });

  return (
    <Portal>
      <div className={styles.otpOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className={styles.otpModal}>
        <button className={styles.otpClose} onClick={onClose}>✕</button>
        <div className={styles.otpIcon}>📍</div>
        <h3 className={styles.otpTitle}>{isAr ? 'تعديل العنوان' : 'Edit Address'}</h3>
        <p className={styles.otpDesc}>{isAr ? 'أدخل موقعك أو مدينتك' : 'Enter your city or full address'}</p>
        <input
          className={styles.otpInput}
          type="text"
          placeholder={isAr ? 'مثال: القاهرة، مصر' : 'e.g. Paris, France'}
          value={location}
          onChange={e => setLocation(e.target.value)}
        />
        {error && <p className={styles.otpError}>{error}</p>}
        <button className={styles.otpSendBtn} onClick={() => save.mutate()} disabled={save.isPending || !location.trim()}>
          {save.isPending ? '...' : (isAr ? 'حفظ' : 'Save')}
        </button>
      </div>
    </div>
    </Portal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfileSummaryCard({ profileData, meData, completedBookings, totalReviews, isAr }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [modal, setModal] = useState<null | 'email' | 'phone' | 'address'>(null);
  const [avatarError, setAvatarError] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState('');
  // Celebration state
  const [celebrate, setCelebrate] = useState<{ msg: string } | null>(null);

  function triggerCelebration(msg: string) {
    setCelebrate({ msg });
  }

  // Prefer meData for verification status (always fresh from /auth/me)
  const isEmailVerified = Boolean(meData?.email_verified_at);
  const isPhoneVerified = Boolean(meData?.phone_verified_at);
  const userPhone       = meData?.phone || '';

  // Avatar: prefer local optimistic URL → then server URL from meData → then profile avatar
  const serverAvatarUrl = meData?.avatar || profileData?.avatar as string || '';
  const avatarUrl = localAvatarUrl || serverAvatarUrl;

  const name = profileData?.name as string || meData?.name as string || '';
  // location_label is the dedicated free-text field; fallback to city/governorate names
  const location = (profileData?.location_label as string) ||
    [profileData?.city?.name_en, profileData?.governorate?.name_en].filter(Boolean).join(', ') || '';

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError('');
    // ── Instant optimistic preview ──
    const objectUrl = URL.createObjectURL(file);
    setLocalAvatarUrl(objectUrl);
    setAvatarLoading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const res = await tutorApi.uploadAvatar(fd);
      const saved = res?.data?.data?.avatar_url as string;
      // Replace object URL with real server URL once available
      if (saved) setLocalAvatarUrl(saved);
      qc.invalidateQueries({ queryKey: ['auth-me'] });
      qc.invalidateQueries({ queryKey: ['tutor-profile'] });
      triggerCelebration(isAr ? 'تم تحديث الصورة بنجاح 🌟' : 'Profile photo updated! 🌟');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setAvatarError(msg || (isAr ? 'فشل رفع الصورة' : 'Upload failed'));
      // Revert preview on error
      setLocalAvatarUrl('');
    } finally {
      setAvatarLoading(false);
      // Free the object URL memory
      URL.revokeObjectURL(objectUrl);
    }
  }

  return (
    <div className={styles.profileSummaryCard}>
      {/* ── Avatar ── */}
      <div className={styles.profileSummaryTop}>
        <div className={styles.profileAvatarWrap}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={name} className={styles.profileAvatarImg} />
          ) : (
            <div className={styles.profileAvatar}>{(name.charAt(0) || '?').toUpperCase()}</div>
          )}
          <button
            className={styles.profileAvatarEdit}
            onClick={() => fileRef.current?.click()}
            title={isAr ? 'تغيير الصورة' : 'Change photo'}
            disabled={avatarLoading}
          >
            {avatarLoading ? '⏳' : '📷'}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>

        <h2 className={styles.profileName}>{name || '—'}</h2>

        {/* Address line — click to edit */}
        <button className={styles.profileLocationBtn} onClick={() => setModal('address')}>
          📍 {location || (isAr ? 'أضف موقعك' : 'Add your location')}
          <span className={styles.profileEditHint}>{isAr ? 'تعديل' : 'Edit'}</span>
        </button>

        {avatarError && <p style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: 4 }}>{avatarError}</p>}

        {/* Verified badge — only shows when both email+phone are verified */}
        {isEmailVerified && isPhoneVerified && (
          <div className={styles.profileVerified}>
            ✅ {isAr ? 'جهة اتصال موثقة' : 'Verified Contact'}
          </div>
        )}
      </div>

      {/* ── Detail List ── */}
      <div className={styles.profileDetailsList}>

        {/* Email */}
        <div className={styles.profileDetailItem}>
          <span className={styles.profileDetailLabel}>📧 {isAr ? 'البريد الإلكتروني' : 'Email'}</span>
          <span className={styles.profileDetailValue}>
            {isEmailVerified
              ? <span className={styles.verifiedCheck}>✓</span>
              : <button className={styles.verifyBtn} onClick={() => setModal('email')}>{isAr ? 'وثّق' : 'Verify'}</button>}
          </span>
        </div>

        {/* Phone */}
        <div className={styles.profileDetailItem}>
          <span className={styles.profileDetailLabel}>📱 {isAr ? 'الهاتف المحمول' : 'Mobile'}</span>
          <span className={styles.profileDetailValue}>
            {isPhoneVerified
              ? <span className={styles.verifiedCheck}>✓</span>
              : <button className={styles.verifyBtn} onClick={() => setModal('phone')}>{isAr ? 'وثّق' : 'Verify'}</button>}
          </span>
        </div>

        {/* Courses */}
        <div className={styles.profileDetailItem}>
          <span className={styles.profileDetailLabel}>📚 {isAr ? 'الحصص المكتملة' : 'Courses taken'}</span>
          <span className={styles.profileDetailValue}><span>{completedBookings} h</span></span>
        </div>

        {/* Evaluations */}
        <div className={styles.profileDetailItem}>
          <span className={styles.profileDetailLabel}>⭐ {isAr ? 'التقييمات' : 'Evaluations'}</span>
          <span className={styles.profileDetailValue}><span>{totalReviews}</span></span>
        </div>

        {/* Plan */}
        <div className={styles.profileDetailItem}>
          <span className={styles.profileDetailLabel}>⚡ {isAr ? 'الباقة' : 'Plan'}</span>
          <Link href="/dashboard/tutor/premium" className={styles.profilePremiumBadge}>PREMIUM</Link>
        </div>

      </div>

      {/* ── Modals ── */}
      {modal === 'email' && <OtpModal type="email" isAr={isAr} onClose={() => setModal(null)} onSuccess={triggerCelebration} />}
      {modal === 'phone' && <OtpModal type="phone" isAr={isAr} phone={userPhone} onClose={() => setModal(null)} onSuccess={triggerCelebration} />}
      {modal === 'address' && <AddressModal profileData={profileData} isAr={isAr} onClose={() => setModal(null)} onSuccess={triggerCelebration} />}
      {celebrate && <SuccessCelebration message={celebrate.msg} onDone={() => setCelebrate(null)} />}
    </div>
  );
}
