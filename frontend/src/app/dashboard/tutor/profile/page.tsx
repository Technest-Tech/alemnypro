'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { tutorApi } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SuccessCelebration from '../components/SuccessCelebration';
import LocationPicker from './LocationPicker';
import DocumentUploader, { type UploadStatus } from './DocumentUploader';
import { useToasts, ToastContainer } from '@/components/ui/AppToast';
import styles from './profile.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{title}</h2>
      </div>
      <div className={styles.cardBody}>{children}</div>
    </div>
  );
}

function SuccessToast({ msg }: { msg: string }) {
  return <div className={styles.toast}>✅ {msg}</div>;
}

// ─── Notification Toggle ──────────────────────────────────────────────────────

function NotifToggle({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`${styles.notifBtn} ${checked ? styles.notifBtnOn : ''}`}
    >
      {checked && <span className={styles.notifCheck}>✓</span>}
      {label}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TutorProfilePage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Queries ──
  const { data: profile } = useQuery({
    queryKey: ['tutor-profile'],
    queryFn: () => tutorApi.getProfile().then(r => r.data.data),
    staleTime: 300_000,
  });

  const { data: meData } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => tutorApi.getMe().then(r => r.data.data),
    staleTime: 60_000,
  });

  const { data: verStatus, isLoading: verLoading } = useQuery({
    queryKey: ['tutor-verification'],
    queryFn: () => tutorApi.getVerificationStatus().then(r => r.data.data),
    // No staleTime — always fetch fresh so status is accurate after refresh
    staleTime: 0,
  });

  // ── Form state ──
  const [form, setForm] = useState({
    gender: '',
    first_name: '',
    last_name: '',
    dob: '',
    email: '',
    phone: '',
    location_label: '',
  });

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [celebrate, setCelebrate] = useState<{ msg: string } | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [uploadedIdentity, setUploadedIdentity] = useState(false);
  const [uploadedDiploma, setUploadedDiploma]   = useState(false);
  const [notifs, setNotifs] = useState({
    sms_course: true,
    email_activity: true,
    email_course: true,
    email_offers: true,
    email_newsletter: false,
  });

  const { toasts, showToast, dismissToast } = useToasts();

  // ── WhatsApp OTP state ──
  const [waStep, setWaStep] = useState<'idle' | 'sent' | 'verified'>('idle');
  const [waOtp, setWaOtp] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waVerifying, setWaVerifying] = useState(false);
  const [waCountdown, setWaCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval>>();

  // Populate form from API data
  useEffect(() => {
    if (profile || meData) {
      const fullName = ((profile?.name as string) || (meData?.name as string) || '').trim();
      const parts = fullName.split(' ');
      setForm(f => ({
        ...f,
        first_name: parts[0] || '',
        last_name: parts.slice(1).join(' ') || '',
        email: (meData?.email as string) || '',
        phone: (meData?.phone as string) || '',
        location_label: (profile?.location_label as string) || '',
      }));
    }
  }, [profile, meData]);

  const updateForm = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const updateNotif = (k: string) => setNotifs(n => ({ ...n, [k]: !n[k as keyof typeof n] }));

  // ── Mutations ──
  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => tutorApi.updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tutor-profile'] });
      qc.invalidateQueries({ queryKey: ['auth-me'] });
      setCelebrate({ msg: isAr ? 'تم حفظ المعلومات بنجاح 🎉' : 'Information saved successfully 🎉' });
    },
  });

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setLocalAvatarUrl(objectUrl);
    setAvatarLoading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const res = await tutorApi.uploadAvatar(fd);
      const saved = res?.data?.data?.avatar_url as string;
      if (saved) setLocalAvatarUrl(saved);
      qc.invalidateQueries({ queryKey: ['auth-me'] });
      qc.invalidateQueries({ queryKey: ['tutor-profile'] });
      setCelebrate({ msg: isAr ? 'تم تحديث صورتك بنجاح 🌟' : 'Profile photo updated! 🌟' });
    } finally {
      setAvatarLoading(false);
      URL.revokeObjectURL(objectUrl);
    }
  }

  function handlePwSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) {
      showToast({ message: isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match', type: 'error' });
      return;
    }
    if (pwForm.newPw.length < 8) {
      showToast({ message: isAr ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters', type: 'warning' });
      return;
    }
    setCelebrate({ msg: isAr ? 'تم تغيير كلمة المرور بنجاح 🔒' : 'Password changed successfully 🔒' });
    setPwForm({ current: '', newPw: '', confirm: '' });
  }

  const avatarUrl = localAvatarUrl || (meData?.avatar as string) || (profile?.avatar as string) || '';
  const displayName = form.first_name || (meData?.name as string)?.split(' ')[0] || '';
  const isEmailVerified = Boolean(meData?.email_verified_at);
  const isPhoneVerified = Boolean(meData?.phone_verified_at);

  // Sync verified state to waStep
  useEffect(() => {
    if (isPhoneVerified) setWaStep('verified');
  }, [isPhoneVerified]);

  // Countdown ticker
  useEffect(() => {
    if (waCountdown <= 0) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }
    countdownRef.current = setInterval(() => {
      setWaCountdown(c => {
        if (c <= 1) { clearInterval(countdownRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [waCountdown]);

  // ── WhatsApp OTP handlers ──
  async function handleSendWhatsAppOtp() {
    if (!form.phone || form.phone.length < 8) {
      showToast({ message: isAr ? 'أدخل رقم واتساب صحيح' : 'Enter a valid WhatsApp number', type: 'warning' });
      return;
    }
    setWaSending(true);
    try {
      await tutorApi.sendPhoneOtp(form.phone);
      setWaStep('sent');
      setWaCountdown(60);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast({ message: msg || (isAr ? 'فشل الإرسال' : 'Failed to send'), type: 'error' });
    } finally {
      setWaSending(false);
    }
  }

  async function handleVerifyWhatsAppOtp() {
    if (waOtp.length !== 6) {
      showToast({ message: isAr ? 'أدخل الرمز المكون من 6 أرقام' : 'Enter the 6-digit code', type: 'warning' });
      return;
    }
    setWaVerifying(true);
    try {
      await tutorApi.verifyPhoneOtp(waOtp);
      setWaStep('verified');
      qc.invalidateQueries({ queryKey: ['auth-me'] });
      setCelebrate({ msg: isAr ? 'تم التحقق من رقم الواتساب بنجاح ✅' : 'WhatsApp number verified! ✅' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast({ message: msg || (isAr ? 'رمز خاطئ أو منتهي' : 'Invalid or expired code'), type: 'error' });
    } finally {
      setWaVerifying(false);
    }
  }

  // verStatus is an ARRAY of docs ordered by created_at desc (from the backend)
  // e.g. [{ id, type, status, created_at }, ...]
  type VerDoc = { type: string; status: string };
  const verDocs: VerDoc[] = Array.isArray(verStatus) ? (verStatus as VerDoc[]) : [];

  // Most-recent doc for each category
  const latestIdentityDoc = verDocs.find(d => d.type === 'national_id' || d.type === 'criminal_record');
  const latestDiplomaDoc  = verDocs.find(d => d.type === 'certificate');

  function resolveStatus(doc: VerDoc | undefined, localUploaded: boolean): UploadStatus {
    if (localUploaded) return 'pending'; // optimistic until next fetch
    if (!doc) return 'idle';
    const s = doc.status;
    if (s === 'approved') return 'approved';
    if (s === 'rejected') return 'rejected';
    if (s === 'pending')  return 'pending';
    return 'idle';
  }

  const identityStatus = resolveStatus(latestIdentityDoc, uploadedIdentity);
  const diplomaStatus  = resolveStatus(latestDiplomaDoc,  uploadedDiploma);

  return (
    <DashboardLayout role="tutor">
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            {isAr ? '👤 ملفي الشخصي' : '👤 My Profile'}
          </h1>
          <p className={styles.pageSubtitle}>
            {isAr ? 'إدارة معلوماتك الشخصية وإعداداتك' : 'Manage your personal information and settings'}
          </p>
        </div>
      </div>

      {/* 3-column grid */}
      <div className={styles.grid}>

        {/* ════ COLUMN 1 ════ */}
        <div className={styles.col}>

          {/* General Information */}
          <SectionCard title={<>🧑 {isAr ? 'المعلومات العامة' : 'General Information'} <span className={styles.emoji}>😊</span></>}>
            <form onSubmit={e => { e.preventDefault(); saveMutation.mutate({ location_label: form.location_label, name: `${form.first_name} ${form.last_name}`.trim() }); }}>
              <div className={styles.fieldStack}>
                {/* Gender */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>{isAr ? 'الجنس' : 'Gender'}</label>
                  <select className={styles.fieldInput} value={form.gender} onChange={e => updateForm('gender', e.target.value)}>
                    <option value="">{isAr ? 'اختر...' : 'Select...'}</option>
                    <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                    <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
                  </select>
                </div>

                {/* First Name */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>{isAr ? 'الاسم الأول' : 'First Name'}</label>
                  <input className={styles.fieldInput} value={form.first_name} onChange={e => updateForm('first_name', e.target.value)} placeholder={isAr ? 'محمد' : 'Mahmoud'} />
                </div>

                {/* Last Name */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>{isAr ? 'اسم العائلة' : 'Last Name'}</label>
                  <input className={styles.fieldInput} value={form.last_name} onChange={e => updateForm('last_name', e.target.value)} placeholder={isAr ? 'أحمد' : 'Ahmed'} />
                </div>

                {/* Date of Birth */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>{isAr ? 'تاريخ الميلاد' : 'Date of Birth'}</label>
                  <input type="date" className={styles.fieldInput} value={form.dob} onChange={e => updateForm('dob', e.target.value)} />
                </div>

                {/* Email */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>{isAr ? 'البريد الإلكتروني' : 'Email Address'}</label>
                  <div className={styles.fieldWithBadge}>
                    <input className={styles.fieldInput} value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder="name@email.com" dir="ltr" />
                    {isEmailVerified && <span className={styles.verifiedBadge}>✓</span>}
                  </div>
                </div>

                {/* Phone / WhatsApp */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    {isAr ? 'رقم الواتساب' : 'WhatsApp Number'}
                    <span style={{ fontSize: '0.75rem', color: '#25D366', fontWeight: 700, marginRight: 6, marginLeft: 6 }}>WhatsApp</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className={styles.flagInput} style={{ flex: 1 }}>
                      <span className={styles.flagBox}>🇪🇬</span>
                      <input
                        className={styles.fieldInputBorderless}
                        value={form.phone}
                        onChange={e => { updateForm('phone', e.target.value); if (waStep === 'verified') setWaStep('idle'); }}
                        placeholder="+20 10 xxxx xxxx"
                        dir="ltr"
                        readOnly={waStep === 'verified'}
                      />
                    </div>
                    {waStep === 'verified' && (
                      <span style={{
                        flexShrink: 0,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg,#25D366,#128C7E)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 900,
                        boxShadow: '0 2px 8px rgba(37,211,102,0.35)',
                      }}>✓</span>
                    )}
                  </div>
                </div>

                {/* WhatsApp Verification Flow */}
                {waStep !== 'verified' && (
                  <div style={{
                    padding: '14px 16px',
                    background: 'linear-gradient(135deg, rgba(37,211,102,0.06), rgba(37,211,102,0.02))',
                    border: '1.5px solid rgba(37,211,102,0.2)',
                    borderRadius: 14,
                    marginTop: -4,
                  }}>
                    {waStep === 'idle' && (
                      <>
                        <p style={{ fontSize: '0.8125rem', color: '#475569', marginBottom: 10, fontWeight: 500 }}>
                          {isAr
                            ? '📱 سنرسل لك رمز تحقق عبر واتساب للتأكد من رقمك'
                            : '📱 We\'ll send a verification code to your WhatsApp to verify your number'}
                        </p>
                        <button
                          type="button"
                          onClick={handleSendWhatsAppOtp}
                          disabled={waSending || !form.phone}
                          style={{
                            width: '100%',
                            padding: '11px 0',
                            background: waSending ? '#94A3B8' : 'linear-gradient(135deg, #25D366, #128C7E)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 12,
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            cursor: waSending ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            transition: 'all 0.2s',
                            boxShadow: '0 3px 12px rgba(37,211,102,0.3)',
                          }}
                        >
                          {waSending ? (
                            <>{isAr ? '⏳ جاري الإرسال...' : '⏳ Sending...'}</>
                          ) : (
                            <>
                              <span style={{ fontSize: '1.15rem' }}>💬</span>
                              {isAr ? 'تحقق عبر واتساب' : 'Verify via WhatsApp'}
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {waStep === 'sent' && (
                      <>
                        <p style={{ fontSize: '0.8125rem', color: '#25D366', marginBottom: 10, fontWeight: 600 }}>
                          ✅ {isAr ? 'تم إرسال الرمز إلى واتساب الخاص بك' : 'Code sent to your WhatsApp'}
                        </p>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                          <input
                            value={waOtp}
                            onChange={e => setWaOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="● ● ● ● ● ●"
                            maxLength={6}
                            dir="ltr"
                            style={{
                              flex: 1,
                              textAlign: 'center',
                              letterSpacing: '0.5em',
                              fontSize: '1.25rem',
                              fontWeight: 800,
                              fontFamily: 'monospace',
                              padding: '12px 0',
                              border: '2px solid rgba(37,211,102,0.3)',
                              borderRadius: 12,
                              background: '#fff',
                              outline: 'none',
                              color: '#1A1A2E',
                            }}
                            autoFocus
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleVerifyWhatsAppOtp}
                          disabled={waVerifying || waOtp.length !== 6}
                          style={{
                            width: '100%',
                            padding: '11px 0',
                            background: (waVerifying || waOtp.length !== 6) ? '#94A3B8' : 'linear-gradient(135deg, #25D366, #128C7E)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 12,
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            cursor: (waVerifying || waOtp.length !== 6) ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.2s',
                            boxShadow: '0 3px 12px rgba(37,211,102,0.3)',
                          }}
                        >
                          {waVerifying
                            ? (isAr ? '⏳ جاري التحقق...' : '⏳ Verifying...')
                            : (isAr ? '✅ تأكيد الرمز' : '✅ Confirm code')}
                        </button>
                        {/* Resend */}
                        <div style={{ marginTop: 10, textAlign: 'center', fontSize: '0.75rem' }}>
                          {waCountdown > 0 ? (
                            <span style={{ color: '#94A3B8' }}>
                              {isAr ? `إعادة الإرسال بعد ${waCountdown} ثانية` : `Resend in ${waCountdown}s`}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendWhatsAppOtp}
                              disabled={waSending}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#25D366',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 'inherit',
                              }}
                            >
                              {isAr ? '🔄 إعادة إرسال الرمز' : '🔄 Resend code'}
                            </button>
                          )}
                        </div>
                      </>
                    )}


                  </div>
                )}

                {/* Verified WhatsApp badge */}
                {waStep === 'verified' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    background: 'linear-gradient(135deg, rgba(37,211,102,0.08), rgba(37,211,102,0.03))',
                    border: '1.5px solid rgba(37,211,102,0.25)',
                    borderRadius: 12,
                    marginTop: -4,
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#065F46' }}>
                        {isAr ? 'رقم الواتساب مُفعَّل' : 'WhatsApp number verified'}
                      </p>
                      <p style={{ fontSize: '0.6875rem', color: '#6B7280', fontWeight: 500 }}>
                        {form.phone}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className={styles.validateBtn}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? '...' : (isAr ? 'حفظ المعلومات' : 'Validate')}
                </button>
              </div>
            </form>
          </SectionCard>

          {/* Diploma */}
          <SectionCard title={<>🎓 {isAr ? 'الدبلوم والشهادات' : 'Diploma'} <span className={styles.emoji}>🏅</span></>}>
            <DocumentUploader
              category="diploma"
              status={diplomaStatus}
              isLoading={verLoading}
              isAr={isAr}
              onUploaded={() => {
                setUploadedDiploma(true);
                qc.invalidateQueries({ queryKey: ['tutor-verification'] });
                setCelebrate({ msg: isAr ? 'تم رفع الشهادة — سيتم المراجعة خلال 24 ساعة 🎉' : 'Diploma submitted — review within 24h 🎉' });
              }}
            />
          </SectionCard>

          {/* Notifications — disabled as future feature */}
          <div style={{ position: 'relative' }}>
            {/* Coming-soon frosted overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              borderRadius: 20,
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              background: 'rgba(255,255,255,0.55)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'not-allowed',
            }}>
              <div style={{
                padding: '8px 20px',
                background: 'linear-gradient(135deg,#1B4965,#2D6A8F)',
                borderRadius: 100,
                color: '#fff',
                fontSize: '0.8125rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                boxShadow: '0 4px 14px rgba(27,73,101,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                🚀 {isAr ? 'قريباً' : 'Coming Soon'}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                {isAr ? 'هذه الميزة قيد التطوير' : 'This feature is under development'}
              </p>
            </div>

            <SectionCard title={<>🔔 {isAr ? 'الإشعارات' : 'Notifications'} <span className={styles.emoji}>🌊</span></>}>
              <div style={{ opacity: 0.4, pointerEvents: 'none', userSelect: 'none' }}>
                <div className={styles.notifSection}>
                  <p className={styles.notifGroupLabel}>SMS</p>
                  <NotifToggle
                    label={isAr ? 'طلبات الدروس' : 'Course Requests'}
                    checked={notifs.sms_course}
                    onChange={() => updateNotif('sms_course')}
                  />
                </div>
                <div className={styles.notifSection}>
                  <p className={styles.notifGroupLabel}>EMAIL</p>
                  <div className={styles.notifStack}>
                    <NotifToggle label={isAr ? 'نشاط الحساب' : 'Account Activity'} checked={notifs.email_activity} onChange={() => updateNotif('email_activity')} />
                    <NotifToggle label={isAr ? 'طلبات الدروس' : 'Course Requests'} checked={notifs.email_course} onChange={() => updateNotif('email_course')} />
                    <NotifToggle label={isAr ? 'عروض إعلاناتي' : 'Offers for my listings'} checked={notifs.email_offers} onChange={() => updateNotif('email_offers')} />
                    <NotifToggle label={isAr ? 'النشرة البريدية' : 'Newsletters'} checked={notifs.email_newsletter} onChange={() => updateNotif('email_newsletter')} />
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* ════ COLUMN 2 ════ */}
        <div className={styles.col}>

          {/* Mailing Address */}
          <SectionCard title={<>📍 {isAr ? 'عنوان المراسلة' : 'Mailing Address'} <span className={styles.emoji}>📮</span></>}>
            <LocationPicker
              initialValue={form.location_label}
              isAr={isAr}
              onSelect={(label, lat, lon) => {
                updateForm('location_label', label);
                saveMutation.mutate({ location_label: label, lat, lon });
              }}
            />
          </SectionCard>

          {/* Identity */}
          <SectionCard title={<>🔒 {isAr ? 'التحقق من الهوية' : 'Identity'} <span className={styles.emoji}>🔑</span></>}>
            <DocumentUploader
              category="identity"
              status={identityStatus}
              isLoading={verLoading}
              isAr={isAr}
              onUploaded={() => {
                setUploadedIdentity(true);
                qc.invalidateQueries({ queryKey: ['tutor-verification'] });
                setCelebrate({ msg: isAr ? 'تم رفع وثيقة الهوية — سيتم المراجعة خلال 24-48 ساعة 🔒' : 'ID uploaded — review within 24–48h 🔒' });
              }}
            />
          </SectionCard>


          {/* Account Deletion */}
          <SectionCard title={<>⚠️ {isAr ? 'حذف الحساب' : 'Account Deletion'} <span className={styles.emoji}>🚨</span></>}>
            <div className={styles.deleteSection}>
              <p className={styles.deleteWarning}>
                <strong>{isAr ? 'تحذير!' : 'WARNING!'}</strong>{' '}
                {isAr
                  ? 'جميع بياناتك (جهات الاتصال، الإعلانات، الرسائل...) ستُحذف نهائياً ولا يمكن استرجاعها.'
                  : 'All your data (contacts, announcements, emails,...) will be permanently and irreversibly deleted.'}
              </p>
              <label className={styles.deleteConfirmRow}>
                <input
                  type="checkbox"
                  checked={deleteConfirmed}
                  onChange={e => setDeleteConfirmed(e.target.checked)}
                  className={styles.deleteCheckbox}
                />
                <span>{isAr ? 'تأكيد حذف حسابي' : 'Delete my account'}</span>
              </label>
              <button
                type="button"
                className={styles.deleteBtn}
                disabled={!deleteConfirmed}
              >
                {isAr ? 'حذف الحساب' : 'Delete my account'}
              </button>
            </div>
          </SectionCard>
        </div>

        {/* ════ COLUMN 3 ════ */}
        <div className={styles.col}>

          {/* Profile Picture */}
          <SectionCard title={<>🖼️ {isAr ? 'الصورة الشخصية' : 'Profile Picture'} <span className={styles.emoji}>📷</span></>}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarWrap}>
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={displayName} className={styles.avatarImg} />
                ) : (
                  <div className={styles.avatarFallback}>
                    {(displayName.charAt(0) || '?').toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  className={styles.avatarEditBtn}
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarLoading}
                >
                  {avatarLoading ? '⏳' : '📷'}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
              </div>
              <p className={styles.avatarName}>{displayName || '—'}</p>
              <button
                type="button"
                className={styles.changePhotoBtn}
                onClick={() => fileRef.current?.click()}
                disabled={avatarLoading}
              >
                📷 {isAr ? 'تغيير الصورة' : 'Change Photo'}
              </button>
              <p className={styles.avatarHint}>
                {isAr ? 'JPG، PNG أو WEBP — الحد الأقصى 5MB' : 'JPG, PNG or WEBP — max 5MB'}
              </p>
            </div>
          </SectionCard>

          {/* Change Password */}
          <SectionCard title={<>🔑 {isAr ? 'تغيير كلمة المرور' : 'Change your password'} <span className={styles.emoji}>🔒</span></>}>
            <form onSubmit={handlePwSubmit} className={styles.fieldStack}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>{isAr ? 'كلمة المرور الحالية' : 'Current Password'}</label>
                <input
                  type="password"
                  className={styles.fieldInput}
                  value={pwForm.current}
                  onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                <input
                  type="password"
                  className={styles.fieldInput}
                  value={pwForm.newPw}
                  onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>{isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                <input
                  type="password"
                  className={styles.fieldInput}
                  value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" className={styles.changePasswordBtn}>
                {isAr ? 'تغيير كلمة المرور' : 'Change your password'}
              </button>
            </form>
          </SectionCard>

          {/* Quick Links */}
          <SectionCard title={<>⚡ {isAr ? 'روابط سريعة' : 'Quick Links'}</>}>
            <div className={styles.quickLinks}>
              {[
                { href: '/dashboard/tutor/listings',     icon: '🏷️', ar: 'إعلاناتي',     en: 'My Listings'    },
                { href: '/dashboard/tutor/availability',  icon: '🗓️', ar: 'مواعيدي',      en: 'Availability'   },
                { href: '/dashboard/tutor/subjects',      icon: '📚', ar: 'موادي',         en: 'My Subjects'    },
                { href: '/dashboard/tutor/premium',       icon: '⚡', ar: 'بريميوم',       en: 'Premium'        },
              ].map(l => (
                <a key={l.href} href={l.href} className={styles.quickLink}>
                  <span>{l.icon}</span>
                  <span>{isAr ? l.ar : l.en}</span>
                  <span className={styles.quickLinkArrow}>{isAr ? '←' : '→'}</span>
                </a>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {celebrate && <SuccessCelebration message={celebrate.msg} onDone={() => setCelebrate(null)} />}
    </DashboardLayout>
  );
}
