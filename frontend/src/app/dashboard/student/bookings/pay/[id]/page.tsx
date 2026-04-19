'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { useLocale } from '@/lib/locale';
import { studentApi } from '@/lib/api';
import StudentLayout from '@/components/layout/StudentLayout';
import Link from 'next/link';

export default function MockPaymentPage() {
  const { locale } = useLocale();
  const isAr      = locale === 'ar';
  const router    = useRouter();
  const params    = useParams();
  const bookingId = Number(params?.id);

  const { data: statusData, isLoading } = useQuery({
    queryKey: ['payment-status', bookingId],
    queryFn: () => studentApi.getPaymentStatus(bookingId).then(r => r.data.data),
    enabled: !!bookingId,
  });

  const s = statusData as Record<string, unknown> | undefined;

  const payMut = useMutation({
    mutationFn: () => studentApi.payBooking(bookingId),
    onSuccess: () => router.push('/dashboard/student/bookings'),
  });

  const total   = Number(s?.total_amount ?? 0);
  const lessons = Number(s?.lessons_count ?? 0);
  const perLesson = lessons > 0 ? Math.round(total / lessons) : 0;

  return (
    <StudentLayout
      title={isAr ? '💳 إتمام الدفع' : '💳 Complete Payment'}
      subtitle={isAr ? 'ادفع لتأكيد حجزك وجدولة حصصك' : 'Pay to confirm your booking and start scheduling'}
    >
      {isLoading ? (
        <div style={{ maxWidth: 480, margin: '0 auto', height: 300, borderRadius: 18, background: '#F1F5F9' }} />
      ) : s?.payment_status !== 'unpaid' ? (
        /* ── Already paid ── */
        <div style={{ maxWidth: 480, margin: '0 auto', background: '#fff', borderRadius: 20, padding: '48px 40px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#16A34A' }}>
            {isAr ? 'تم الدفع بالفعل' : 'Already Paid'}
          </h2>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
            {isAr ? 'هذا الحجز مدفوع. سيتواصل معك المدرس لجدولة الحصص.' : 'This booking is paid. The tutor will schedule your sessions soon.'}
          </p>
          <Link href="/dashboard/student/bookings" className="btn btn-primary btn-md">
            {isAr ? 'العودة للحجوزات' : 'Back to Bookings'}
          </Link>
        </div>
      ) : (
        /* ── Payment form ── */
        <div style={{ maxWidth: 480, margin: '0 auto' }}>

          {/* Summary card */}
          <div style={{ background: '#fff', borderRadius: 18, padding: '24px 28px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>
              {isAr ? 'ملخص الحجز' : 'Booking Summary'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Row label={isAr ? 'عدد الحصص' : 'Sessions'}   value={`${lessons} ${isAr ? 'حصة' : 'sessions'}`} />
              <Row label={isAr ? 'سعر الحصة' : 'Per session'} value={`${perLesson} EGP`} />
              <div style={{ borderTop: '1px solid #E9EBF0', paddingTop: 12, marginTop: 4 }}>
                <Row label={isAr ? 'الإجمالي' : 'Total'} value={`${total} EGP`} bold />
              </div>
            </div>
          </div>

          {/* Escrow notice */}
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 14, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#1D4ED8', lineHeight: 1.6, display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
            <span>
              {isAr
                ? 'مبلغك محفوظ في الضمان ولن يُحوَّل للمدرس إلا بعد تأكيدك لإتمام كل حصة.'
                : 'Your payment is held in escrow and only released to the tutor after you confirm each completed session.'}
            </span>
          </div>

          {/* Pay button */}
          {payMut.isSuccess ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#16A34A' }}>{isAr ? 'تم الدفع بنجاح!' : 'Payment Successful!'}</p>
              <p style={{ fontSize: 14, color: '#6B7280' }}>{isAr ? 'جاري إعادة التوجيه...' : 'Redirecting...'}</p>
            </div>
          ) : (
            <button onClick={() => payMut.mutate()} disabled={payMut.isPending}
              style={{
                width: '100%', padding: '18px 0', borderRadius: 16, border: 'none',
                background: payMut.isPending ? '#94A3B8' : 'linear-gradient(135deg, #1B4965 0%, #2D6A8E 100%)',
                color: '#fff', cursor: payMut.isPending ? 'default' : 'pointer',
                fontWeight: 800, fontSize: 18, boxShadow: '0 8px 24px rgba(27,73,101,0.3)',
                fontFamily: 'inherit', transition: 'all 0.2s',
              }}>
              {payMut.isPending ? '⏳ ...' : `💳 ${isAr ? `ادفع ${total} EGP الآن` : `Pay ${total} EGP Now`}`}
            </button>
          )}
        </div>
      )}
    </StudentLayout>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: bold ? 16 : 14, fontWeight: bold ? 800 : 400, color: bold ? '#1A1A2E' : '#6B7280' }}>
      <span>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 600, color: bold ? '#1A1A2E' : '#374151' }}>{value}</span>
    </div>
  );
}
