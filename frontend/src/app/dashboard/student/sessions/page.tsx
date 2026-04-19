'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { studentApi } from '@/lib/api';
import Link from 'next/link';
import StudentLayout from '@/components/layout/StudentLayout';

function formatDate(d: string, isAr: boolean) {
  try {
    return new Date(d).toLocaleString(isAr ? 'ar-EG' : 'en-GB', {
      weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch { return d; }
}

function countdown(dateStr: string, isAr: boolean): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return isAr ? 'الآن' : 'Now';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 24
    ? `${Math.floor(h / 24)}${isAr ? ' يوم' : 'd'} ${h % 24}${isAr ? ' ساعة' : 'h'}`
    : `${h}${isAr ? 'س' : 'h'} ${m}${isAr ? 'د' : 'm'}`;
}

const STATUS_BADGE: Record<string, { ar: string; en: string; bg: string; color: string }> = {
  scheduled:  { ar: 'قادمة',          en: 'Upcoming',    bg: '#EFF6FF', color: '#2563EB' },
  completed:  { ar: 'بانتظار تأكيدك', en: 'Awaiting You', bg: '#FEF9C3', color: '#CA8A04' },
  disputed:   { ar: 'قيد المراجعة',   en: 'Under Review', bg: '#FEF2F2', color: '#DC2626' },
  confirmed:  { ar: '✅ مؤكدة',        en: '✅ Confirmed',  bg: '#F0FDF4', color: '#16A34A' },
  cancelled:  { ar: 'ملغاة',          en: 'Cancelled',   bg: '#F3F4F6', color: '#6B7280' },
};

export default function StudentSessionsPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const qc   = useQueryClient();

  const [tab, setTab]          = useState<'upcoming' | 'history'>('upcoming');
  const [disputeFor, setDisputeFor] = useState<Record<string, unknown> | null>(null);
  const [reason, setReason]    = useState('');
  const [evidLink, setEvidLink] = useState('');
  const [dispErr, setDispErr]  = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['student-sessions', tab],
    queryFn: () => studentApi.getSessions({ tab }).then(r => r.data.data),
  });

  const sessions: Record<string, unknown>[] =
    ((data as { data?: Record<string, unknown>[] })?.data) ??
    (data as Record<string, unknown>[]) ?? [];

  const disputeMut = useMutation({
    mutationFn: () => studentApi.disputeSession(disputeFor!.id as number, {
      reason, evidence_link: evidLink || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-sessions'] });
      setDisputeFor(null); setReason(''); setEvidLink('');
    },
    onError: (e: unknown) => {
      setDispErr((e as { response?: { data?: { message?: string } } })?.response?.data?.message || (isAr ? 'حدث خطأ' : 'Error'));
    },
  });

  return (
    <StudentLayout
      title={isAr ? '📚 حصصي' : '📚 My Sessions'}
      subtitle={isAr ? 'تابع حصصك القادمة واعترض إذا لزم' : 'Track upcoming lessons and dispute if needed'}
    >
      {/* ── Dispute Modal ── */}
      {disputeFor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#DC2626' }}>
              ⚠️ {isAr ? 'الاعتراض على الحصة' : 'Dispute This Session'}
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
              {isAr ? 'سيراجع فريقنا اعتراضك خلال 24–48 ساعة.' : 'Our team will review your dispute within 24–48 hours.'}
            </p>
            <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              {isAr ? 'سبب الاعتراض *' : 'Reason *'}
            </label>
            <textarea value={reason} onChange={e => { setReason(e.target.value); setDispErr(''); }} rows={4}
              placeholder={isAr ? 'اشرح بالتفصيل... (20 حرف على الأقل)' : 'Explain in detail... (min 20 chars)'}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, resize: 'none', boxSizing: 'border-box', marginBottom: 14 }} />
            <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              📎 {isAr ? 'رابط دليل (اختياري)' : 'Evidence Link (optional)'}
            </label>
            <input type="url" value={evidLink} onChange={e => setEvidLink(e.target.value)} placeholder="https://..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', marginBottom: 16 }} />
            {dispErr && <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 12 }}>{dispErr}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setDisputeFor(null); setReason(''); setEvidLink(''); setDispErr(''); }}
                style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                {isAr ? 'تراجع' : 'Cancel'}
              </button>
              <button
                onClick={() => { if (reason.length < 20) { setDispErr(isAr ? '20 حرف على الأقل' : 'At least 20 characters'); return; } disputeMut.mutate(); }}
                disabled={disputeMut.isPending}
                style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                {disputeMut.isPending ? '...' : (isAr ? 'إرسال الاعتراض' : 'Submit Dispute')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { key: 'upcoming', ar: '📅 القادمة', en: '📅 Upcoming' },
          { key: 'history',  ar: '📁 السجل',   en: '📁 History'  },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as 'upcoming' | 'history')}
            style={{
              padding: '8px 20px', borderRadius: 100, border: '1.5px solid', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              borderColor: tab === t.key ? '#1B4965' : '#E5E7EB',
              background:  tab === t.key ? '#1B4965' : '#fff',
              color:       tab === t.key ? '#fff'    : '#6B7280',
            }}>
            {isAr ? t.ar : t.en}
          </button>
        ))}
      </div>

      {/* ── Sessions ── */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 88, borderRadius: 16, background: '#F1F5F9', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : !sessions.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>

          {/* Main empty card */}
          <div style={{
            width: '100%', maxWidth: 540,
            background: '#fff', borderRadius: 24, overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)', marginBottom: 24,
            border: '1px solid #E9EBF0',
          }}>
            {/* Top gradient banner */}
            <div style={{
              background: 'linear-gradient(135deg, #1B4965 0%, #2D6A8E 100%)',
              padding: '36px 32px 32px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 64, marginBottom: 4 }}>📚</div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff' }}>
                {isAr ? 'لا توجد حصص بعد' : 'No Sessions Yet'}
              </h2>
            </div>

            {/* Steps */}
            <div style={{ padding: '28px 32px' }}>
              <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 1.7 }}>
                {isAr
                  ? 'حصصك ستظهر هنا بعد أن يجدولها معلمك. اتبع هذه الخطوات:'
                  : 'Your sessions will appear here once your tutor schedules them. Follow these steps:'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { step: '1', icon: '🔍', ar: 'ابحث عن معلم',    en: 'Find a tutor',      ar2: 'من خلال محرك البحث',  en2: 'via the search engine'       },
                  { step: '2', icon: '📋', ar: 'أرسل طلب حجز',   en: 'Send a booking',    ar2: 'وانتظر موافقة المعلم', en2: 'and wait for tutor approval' },
                  { step: '3', icon: '💳', ar: 'ادفع بأمان',      en: 'Pay securely',      ar2: 'المبلغ محفوظ بالضمان', en2: 'funds held in escrow'        },
                  { step: '4', icon: '📅', ar: 'ابدأ الدراسة',    en: 'Start learning',    ar2: 'وتابع حصصك هنا',      en2: 'and track sessions here'     },
                ].map(s => (
                  <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #1B4965, #2D6A8E)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 14,
                    }}>
                      {s.step}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{s.icon}</span>
                        <span>{isAr ? s.ar : s.en}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{isAr ? s.ar2 : s.en2}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/search" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 28, padding: '14px 0', borderRadius: 14,
                background: 'linear-gradient(135deg, #1B4965, #2D6A8E)',
                color: '#fff', fontWeight: 800, fontSize: 15, textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(27,73,101,0.25)',
              }}>
                🔍 {isAr ? 'ابحث عن معلم الآن' : 'Find a Tutor Now'}
              </Link>
            </div>
          </div>

          {/* Already has bookings hint */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
            background: '#F0FDF4', borderRadius: 12, border: '1px solid #86EFAC',
            fontSize: 13, color: '#16A34A', maxWidth: 540, width: '100%',
          }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <span>
              {isAr
                ? 'إذا كان لديك حجز مقبول، ادفع أولاً ثم انتظر جدولة المعلم للحصص.'
                : 'If you have an accepted booking, pay first — then wait for your tutor to schedule sessions.'}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sessions.map(s => {
            const st          = String(s.status ?? '');
            const badge       = STATUS_BADGE[st] || STATUS_BADGE.scheduled;
            const tutor       = String((s.tutor as Record<string, unknown>)?.name || '—');
            const subject     = String((s.subject as Record<string, unknown>)?.name_ar || (s.subject as Record<string, unknown>)?.name_en || '—');
            const canDispute  = Boolean(s.can_dispute);
            const remainH     = Number(s.dispute_window_remaining_h ?? 0);
            const scheduledAt = String(s.scheduled_at ?? '');
            const isUpcoming  = st === 'scheduled' && new Date(scheduledAt) > new Date();
            const meetLink    = String(s.meeting_link ?? '');
            const recLink     = String(s.recording_link ?? '');
            const minsToStart = (new Date(scheduledAt).getTime() - Date.now()) / 60000;
            const showJoin    = st === 'scheduled' && minsToStart <= 30 && minsToStart > -60 && Boolean(meetLink);

            return (
              <div key={s.id as number} style={{
                background: '#fff', border: '1px solid #E9EBF0', borderRadius: 18,
                padding: '18px 22px', display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                  {tutor.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#1A1A2E' }}>{tutor}</span>
                    <span style={{ fontSize: 13, color: '#9CA3AF' }}>· {subject}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 100, background: badge.bg, color: badge.color }}>
                      {isAr ? badge.ar : badge.en}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                    📅 {formatDate(scheduledAt, isAr)} · ⏱ {String(s.duration_minutes ?? '')} {isAr ? 'د' : 'min'}
                    {isUpcoming && (
                      <span style={{ color: '#2563EB', fontWeight: 700, marginRight: 8 }}>
                        {' · '}⏳ {isAr ? 'خلال' : 'In'} {countdown(scheduledAt, isAr)}
                      </span>
                    )}
                  </div>

                  {/* Dispute window */}
                  {canDispute && (
                    <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '5px 12px', borderRadius: 8, background: '#FEF9C3', color: '#92400E' }}>
                      ⏰ {isAr ? `متبقي ${remainH}h للاعتراض` : `${remainH}h left to dispute`}
                    </div>
                  )}

                  {/* Recording */}
                  {recLink && (
                    <div style={{ marginTop: 6 }}>
                      <a href={recLink} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>
                        📹 {isAr ? 'مشاهدة التسجيل' : 'Watch Recording'} ↗
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 120, flexShrink: 0 }}>
                  {showJoin && (
                    <a href={meetLink} target="_blank" rel="noreferrer"
                      style={{ display: 'block', padding: '8px 14px', borderRadius: 10, background: '#059669', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', textAlign: 'center' }}>
                      🔗 {isAr ? 'انضمام' : 'Join Now'}
                    </a>
                  )}
                  {canDispute && (
                    <button onClick={() => setDisputeFor(s)}
                      style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                      ⚠️ {isAr ? 'اعتراض' : 'Dispute'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
}
