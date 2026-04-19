'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { publicApi } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────

interface PaymentData {
  already_paid: boolean;
  booking_id?: number;
  tutor?: { id: number; name: string; avatar: string | null };
  tutor_headline?: string;
  student?: { id: number; name: string };
  subject_name_ar?: string;
  subject_name_en?: string;
  lessons_count?: number;
  per_lesson_amount?: string;
  total_amount?: string;
  lesson_format?: string;
  confirmed_date?: string | null;
  confirmed_time?: string | null;
  payment_status?: string;
}

const PAYMENT_METHODS = [
  { id: 'credit_card',   icon: '💳', ar: 'بطاقة ائتمان',    en: 'Credit / Debit Card' },
  { id: 'vodafone_cash', icon: '📱', ar: 'فودافون كاش',     en: 'Vodafone Cash'       },
  { id: 'instapay',      icon: '⚡', ar: 'إنستاباي',        en: 'InstaPay'            },
  { id: 'wallet',        icon: '🔐', ar: 'المحفظة الرقمية', en: 'Digital Wallet'      },
];

export default function PaymentPage() {
  const params = useParams();
  const token  = params?.token as string;

  const [data, setData]       = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [method, setMethod]   = useState('credit_card');
  const [paying, setPaying]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [locale, setLocale]   = useState('ar');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocale(localStorage.getItem('alemnypro_locale') || 'ar');
    }
  }, []);

  const isAr = locale === 'ar';

  useEffect(() => {
    if (!token) return;
    publicApi.getPaymentPage(token)
      .then(r => setData(r.data.data))
      .catch(() => setError(isAr ? 'رابط الدفع غير صالح أو منتهي.' : 'Invalid or expired payment link.'))
      .finally(() => setLoading(false));
  }, [token, isAr]);

  const handlePay = async () => {
    if (!token) return;
    setPaying(true);
    try {
      await publicApi.processPayment(token, method);
      setSuccess(true);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || (isAr ? 'فشل الدفع. حاول مرة أخرى.' : 'Payment failed. Please try again.'));
    } finally {
      setPaying(false);
    }
  };

  // ── Loading ──
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0F766E 0%, #1B4965 100%)' }}>
      <div style={{ width: 48, height: 48, border: '4px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Error ──
  if (error && !data) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0F766E 0%, #1B4965 100%)', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 40, maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A2E', marginBottom: 8 }}>{isAr ? 'رابط غير صالح' : 'Invalid Link'}</h2>
        <p style={{ color: '#6B7280', fontSize: 14 }}>{error}</p>
        <a href="/" style={{ display: 'inline-block', marginTop: 20, padding: '10px 24px', borderRadius: 10, background: '#0F766E', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>
          {isAr ? 'العودة للرئيسية' : 'Go Home'}
        </a>
      </div>
    </div>
  );

  // ── Already paid ──
  if (data?.already_paid || success) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #059669 0%, #0F766E 50%, #1B4965 100%)', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 48, maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 72, marginBottom: 16, animation: 'bounce 0.6s ease' }}>🎉</div>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#065F46', marginBottom: 8 }}>
          {isAr ? 'تم الدفع بنجاح!' : 'Payment Successful!'}
        </h2>
        <p style={{ color: '#047857', fontSize: 15, lineHeight: 1.6 }}>
          {isAr
            ? 'تم استلام دفعتك. سيتواصل معك المدرس قريباً لجدولة حصصك.'
            : 'Your payment has been received. Your tutor will contact you soon to schedule your sessions.'}
        </p>
        <div style={{ background: 'rgba(5,150,105,0.08)', borderRadius: 14, padding: '14px 20px', margin: '20px 0', border: '1px solid rgba(5,150,105,0.2)' }}>
          <div style={{ fontSize: 13, color: '#047857', fontWeight: 600 }}>
            {data?.lessons_count && (isAr ? `${data.lessons_count} حصص محجوزة ✅` : `${data.lessons_count} sessions booked ✅`)}
          </div>
        </div>
        <a href="/dashboard/student/messages" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 12, background: '#059669', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
          {isAr ? '💬 عودة للمحادثة' : '💬 Back to Messages'}
        </a>
        <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }`}</style>
      </div>
    </div>
  );

  if (!data) return null;

  const total = parseFloat(data.total_amount || '0');
  const perLesson = parseFloat(data.per_lesson_amount || '0');

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0F766E 0%, #1B4965 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 480, width: '100%' }}>
        {/* Logo bar */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>
            🎓 Alemny<span style={{ color: '#6EE7B7' }}>Pro</span>
          </span>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
            {isAr ? 'منصة التعليم الخصوصي الأولى في مصر' : 'Egypt\'s #1 Private Tutoring Platform'}
          </p>
        </div>

        {/* Main card */}
        <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>

          {/* Header gradient banner */}
          <div style={{ background: 'linear-gradient(135deg, #0F766E, #1B4965)', padding: '28px 32px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              {isAr ? 'تفاصيل الدفع' : 'Payment Details'}
            </div>

            {/* Tutor info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {data.tutor?.name?.charAt(0) || '?'}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>{data.tutor?.name}</div>
                {data.tutor_headline && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{data.tutor_headline}</div>}
              </div>
            </div>
          </div>

          <div style={{ padding: '28px 32px' }}>
            {/* Booking summary */}
            <div style={{ background: '#F8FAFC', borderRadius: 16, padding: '18px 20px', marginBottom: 24, border: '1px solid #E9EBF0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{isAr ? 'المادة' : 'Subject'}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>{isAr ? data.subject_name_ar : data.subject_name_en}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{isAr ? 'النوع' : 'Format'}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>
                    {data.lesson_format === 'online' ? (isAr ? '🖥️ أونلاين' : '🖥️ Online') : (isAr ? '🏠 حضوري' : '🏠 In-Person')}
                  </div>
                </div>
                {data.confirmed_date && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{isAr ? 'الموعد' : 'Scheduled'}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>📅 {data.confirmed_date}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{isAr ? 'عدد الحصص' : 'Lessons'}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>{data.lessons_count} {isAr ? 'حصص' : 'sessions'}</div>
                </div>
              </div>

              {/* Price breakdown */}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #E9EBF0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
                  <span>{data.lessons_count} × {perLesson} {isAr ? 'جنيه' : 'EGP'}</span>
                  <span>{(data.lessons_count! * perLesson).toFixed(0)} {isAr ? 'جنيه' : 'EGP'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900, color: '#0F766E' }}>
                  <span>{isAr ? 'الإجمالي' : 'Total'}</span>
                  <span>{total.toFixed(0)} {isAr ? 'جنيه' : 'EGP'}</span>
                </div>
              </div>
            </div>

            {/* Payment methods */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>
                {isAr ? 'اختر طريقة الدفع' : 'Select Payment Method'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {PAYMENT_METHODS.map(m => (
                  <button key={m.id} onClick={() => setMethod(m.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                    borderRadius: 12, border: `2px solid ${method === m.id ? '#0F766E' : '#E9EBF0'}`,
                    background: method === m.id ? 'rgba(15,118,110,0.06)' : '#fff',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  }}>
                    <span style={{ fontSize: 20 }}>{m.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: method === m.id ? '#0F766E' : '#374151' }}>
                      {isAr ? m.ar : m.en}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#B91C1C', marginBottom: 16 }}>
                {error}
              </div>
            )}

            {/* Pay button */}
            <button onClick={handlePay} disabled={paying} style={{
              width: '100%', padding: '16px', borderRadius: 14, border: 'none',
              background: paying ? '#9CA3AF' : 'linear-gradient(135deg, #059669, #0F766E)',
              color: '#fff', fontSize: 16, fontWeight: 800, cursor: paying ? 'default' : 'pointer',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'inherit', boxShadow: paying ? 'none' : '0 4px 20px rgba(15,118,110,0.4)',
            }}>
              {paying ? (
                <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> {isAr ? 'جاري الدفع...' : 'Processing...'}</>
              ) : (
                `⚡ ${isAr ? `ادفع ${total.toFixed(0)} جنيه` : `Pay ${total.toFixed(0)} EGP`}`
              )}
            </button>

            {/* Security note */}
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              🔒 {isAr ? 'دفع آمن ومشفر — بدعم من AlemnyPro' : 'Secure & encrypted — powered by AlemnyPro'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
          {isAr ? 'بالدفع أنت توافق على شروط الاستخدام وسياسة الخصوصية' : 'By paying you agree to our Terms of Service & Privacy Policy'}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
