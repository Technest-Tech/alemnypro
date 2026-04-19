'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { studentApi } from '@/lib/api';
import Link from 'next/link';
import StudentLayout from '@/components/layout/StudentLayout';

const STATUS_BADGE: Record<string, { ar: string; en: string; bg: string; color: string }> = {
  pending:   { ar: 'في الانتظار', en: 'Pending',   bg: '#FEF9C3', color: '#CA8A04' },
  accepted:  { ar: 'مقبول',       en: 'Accepted',  bg: '#F0FDF4', color: '#16A34A' },
  completed: { ar: 'مكتمل',       en: 'Completed', bg: '#EFF6FF', color: '#2563EB' },
  cancelled: { ar: 'ملغى',        en: 'Cancelled', bg: '#F3F4F6', color: '#6B7280' },
  rejected:  { ar: 'مرفوض',       en: 'Rejected',  bg: '#FEF2F2', color: '#DC2626' },
};

const FILTERS = [
  { val: '',          ar: 'الكل',        en: 'All'       },
  { val: 'pending',   ar: 'في الانتظار', en: 'Pending'   },
  { val: 'accepted',  ar: 'مقبول',       en: 'Accepted'  },
  { val: 'completed', ar: 'مكتمل',       en: 'Completed' },
  { val: 'cancelled', ar: 'ملغى',        en: 'Cancelled' },
];

// Contextual clarifying messages — Egyptian Arabic + English
const STATUS_MSG: Record<string, { ar: string; en: string; icon: string; color: string; bg: string }> = {
  pending: {
    icon: '📨',
    ar: 'بعتنا طلبك للمعلم دلوقتي — هتلاقي رده على واتساب قريباً إن شاء الله',
    en: "We sent your request to the tutor — you'll be notified on WhatsApp when they reply.",
    color: '#92400e', bg: '#fffbeb',
  },
  seen: {
    icon: '👀',
    ar: 'المعلم شاف طلبك — استنى شوية هيرد عليك على واتساب',
    en: 'The tutor has seen your request — waiting for their reply on WhatsApp.',
    color: '#1e40af', bg: '#eff6ff',
  },
  accepted: {
    icon: '🎉',
    ar: 'مبروك! المعلم وافق على طلبك — هيتواصل معاك على واتساب عشان تتفقوا على الموعد',
    en: "Great news! The tutor accepted your request — they'll contact you on WhatsApp to confirm the schedule.",
    color: '#166534', bg: '#f0fdf4',
  },
  completed: {
    icon: '✅',
    ar: 'الدرس خلص — نتمنى تكون استفدت! متنساش تقيّم تجربتك',
    en: "Lesson complete! We hope you learned a lot. Don't forget to leave a review.",
    color: '#1d4ed8', bg: '#eff6ff',
  },
  cancelled: {
    icon: '😔',
    ar: 'الحجز اتلغى — لو حابب تحجز تاني اضغط هنا',
    en: 'Booking cancelled. Feel free to book again anytime.',
    color: '#4b5563', bg: '#f9fafb',
  },
  rejected: {
    icon: '😞',
    ar: 'المعلم اعتذر — جرب تحجز معاه في وقت بديل أو اختار معلم تاني',
    en: 'The tutor declined — try booking at a different time or choose another tutor.',
    color: '#991b1b', bg: '#fef2f2',
  },
};

export default function StudentBookingsPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const qc   = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('');
  const [cancelId, setCancelId]         = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['student-bookings', statusFilter],
    queryFn: () => studentApi.getBookings(statusFilter ? { status: statusFilter } : {}).then(r => r.data.data),
  });

  const bookings: Record<string, unknown>[] =
    ((data as { data?: Record<string, unknown>[] })?.data) ??
    (data as Record<string, unknown>[]) ?? [];

  const cancelMut = useMutation({
    mutationFn: (id: number) => studentApi.cancelBooking(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-bookings'] });
      setCancelId(null);
    },
  });

  return (
    <StudentLayout
      title={isAr ? '📋 حجوزاتي' : '📋 My Bookings'}
      subtitle={isAr ? 'تابع طلبات الحجز وحالتها' : 'Track your booking requests and their status'}
      action={
        <Link href="/search" className="btn btn-primary btn-md">
          🔍 {isAr ? 'حجز جديد' : 'New Booking'}
        </Link>
      }
    >
      {/* Cancel Confirmation Modal */}
      {cancelId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 44, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, textAlign: 'center', color: '#1A1A2E' }}>
              {isAr ? 'تأكيد إلغاء الحجز' : 'Cancel Booking?'}
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 1.6 }}>
              {isAr ? 'هل أنت متأكد من إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure? This action cannot be undone.'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setCancelId(null)}
                style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                {isAr ? 'تراجع' : 'Back'}
              </button>
              <button onClick={() => cancelMut.mutate(cancelId)} disabled={cancelMut.isPending}
                style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                {cancelMut.isPending ? '...' : (isAr ? 'تأكيد الإلغاء' : 'Confirm Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {FILTERS.map(f => (
          <button key={f.val} onClick={() => setStatusFilter(f.val)}
            style={{
              padding: '7px 18px', borderRadius: 100, border: '1.5px solid', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              borderColor: statusFilter === f.val ? '#1B4965' : '#E5E7EB',
              background:  statusFilter === f.val ? '#1B4965' : '#fff',
              color:       statusFilter === f.val ? '#fff'    : '#6B7280',
            }}>
            {isAr ? f.ar : f.en}
          </button>
        ))}
      </div>

      {/* Bookings */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 92, borderRadius: 18, background: '#F1F5F9' }} />
          ))}
        </div>
      ) : !bookings.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
          {/* Illustration card */}
          <div style={{
            width: '100%', maxWidth: 560,
            background: 'linear-gradient(135deg, #1B4965 0%, #2D6A8E 100%)',
            borderRadius: 24, padding: '48px 40px', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(27,73,101,0.25)', marginBottom: 32, position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative blobs */}
            <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

            <div style={{ fontSize: 64, marginBottom: 20, position: 'relative' }}>🎓</div>
            <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800, color: '#fff' }}>
              {isAr ? 'ابدأ رحلتك التعليمية' : 'Start Your Learning Journey'}
            </h2>
            <p style={{ margin: '0 0 32px', fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
              {isAr
                ? 'احجز درسك الأول مع أفضل المعلمين واحترف ما تريد تعلمه'
                : 'Book your first lesson with top-rated tutors and master any skill you want.'}
            </p>
            <Link href="/search" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px',
              borderRadius: 14, background: '#fff', color: '#1B4965', fontWeight: 800, fontSize: 15,
              textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', transition: 'transform 0.15s',
            }}>
              🔍 {isAr ? 'ابحث عن معلم الآن' : 'Find a Tutor Now'}
            </Link>
          </div>

          {/* Feature highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, width: '100%', maxWidth: 560 }}>
            {[
              { icon: '🔒', ar: 'دفع آمن بالضمان',    en: 'Secure Escrow Payment' },
              { icon: '⭐', ar: 'معلمون موثّقون',     en: 'Verified Tutors'       },
              { icon: '📅', ar: 'جدولة مرنة',       en: 'Flexible Scheduling'   },
              { icon: '💬', ar: 'تواصل مباشر',       en: 'Direct Communication'  },
            ].map((f, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1px solid #E9EBF0',
                display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <span style={{ fontSize: 24 }}>{f.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{isAr ? f.ar : f.en}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {bookings.map(b => {
            const st      = String(b.status ?? 'pending');
            const badge   = STATUS_BADGE[st] || STATUS_BADGE.pending;
            const tutor   = String((b.tutor as Record<string, unknown>)?.name ?? '—');
            const subjectObj = b.subject as Record<string, unknown> | null;
            const subject = String(
              isAr
                ? (subjectObj?.name_ar ?? subjectObj?.name_en ?? '—')
                : (subjectObj?.name_en ?? subjectObj?.name_ar ?? '—')
            );
            const rawDate = b.preferred_date ? String(b.preferred_date) : null;
            const date = rawDate
              ? new Date(rawDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : (isAr ? 'تاريخ غير محدد' : 'Date TBD');
            const rawTime = b.preferred_time ? String(b.preferred_time).slice(0, 5) : '';
            const time = rawTime;
            const paid    = String(b.payment_status ?? '') === 'paid';
            const canCancel = st === 'pending';
            const canPay    = st === 'accepted' && !paid;
            const sessionsScheduled = Number(b.sessions_scheduled ?? 0);
            const lessonsCount      = Number(b.lessons_count ?? 0);

            return (
              <div key={b.id as number} style={{
                background: '#fff', border: '1px solid #E9EBF0', borderRadius: 18,
                padding: '18px 22px', display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
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
                    {paid && (
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 100, background: '#F0FDF4', color: '#16A34A' }}>
                        💰 {isAr ? 'مدفوع' : 'Paid'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                    📅 {date}{time ? ` · 🕐 ${time}` : ''}
                    {lessonsCount > 0 && (
                      <span style={{ marginRight: 8 }}>
                        {' · '}📚 {sessionsScheduled}/{lessonsCount} {isAr ? 'حصة' : 'sessions'}
                      </span>
                    )}
                  </div>
                  {Boolean(b.message) && (
                    <div style={{ marginTop: 6, fontSize: 13, color: '#6B7280', fontStyle: 'italic' }}>
                      &ldquo;{String(b.message)}&rdquo;
                    </div>
                  )}

                  {/* Clarifying status message */}
                  {STATUS_MSG[st] && (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      marginTop: 10, padding: '9px 13px',
                      borderRadius: 10,
                      background: STATUS_MSG[st].bg,
                      fontSize: 12.5, color: STATUS_MSG[st].color,
                      fontWeight: 600, lineHeight: 1.6,
                      border: `1px solid ${STATUS_MSG[st].color}22`,
                    }}>
                      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{STATUS_MSG[st].icon}</span>
                      <span>{isAr ? STATUS_MSG[st].ar : STATUS_MSG[st].en}</span>
                    </div>
                  )}

                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 130, flexShrink: 0 }}>
                  {canPay && (
                    <Link href={`/dashboard/student/bookings/pay/${String(b.id)}`}
                      style={{ display: 'block', padding: '8px 14px', borderRadius: 10, background: '#1B4965', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', textAlign: 'center' }}>
                      💳 {isAr ? 'ادفع الآن' : 'Pay Now'}
                    </Link>
                  )}
                  {sessionsScheduled > 0 && (
                    <Link href="/dashboard/student/sessions"
                      style={{ display: 'block', padding: '8px 14px', borderRadius: 10, border: '1.5px solid #E9EBF0', background: '#fff', color: '#374151', fontWeight: 700, fontSize: 13, textDecoration: 'none', textAlign: 'center' }}>
                      📚 {isAr ? 'عرض الحصص' : 'View Sessions'}
                    </Link>
                  )}
                  {canCancel && (
                    <button onClick={() => setCancelId(b.id as number)}
                      style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                      ✕ {isAr ? 'إلغاء' : 'Cancel'}
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
