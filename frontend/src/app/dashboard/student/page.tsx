'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { studentApi } from '@/lib/api';
import Link from 'next/link';
import StudentLayout from '@/components/layout/StudentLayout';
import { useEffect, useState } from 'react';

const STATUS_BADGE: Record<string, { ar: string; en: string; bg: string; color: string }> = {
  pending:   { ar: 'في الانتظار', en: 'Pending',   bg: '#FEF9C3', color: '#CA8A04' },
  accepted:  { ar: 'مقبول',       en: 'Accepted',  bg: '#F0FDF4', color: '#16A34A' },
  completed: { ar: 'مكتمل',       en: 'Completed', bg: '#EFF6FF', color: '#2563EB' },
  cancelled: { ar: 'ملغى',        en: 'Cancelled', bg: '#F3F4F6', color: '#6B7280' },
};

export default function StudentDashboard() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('alemnypro_user');
    if (saved) { try { setUserName(JSON.parse(saved)?.name?.split(' ')[0] || ''); } catch { /* */ } }
  }, []);

  const { data: stats } = useQuery({
    queryKey: ['student-stats'],
    queryFn:  () => studentApi.getDashboardStats().then(r => r.data.data),
  });

  const { data: bookings } = useQuery({
    queryKey: ['student-bookings'],
    queryFn:  () => studentApi.getBookings().then(r => r.data.data),
  });

  const recentBookings = ((bookings as { data?: unknown[] })?.data || (bookings as unknown[]) || []).slice(0, 5) as Record<string, unknown>[];

  const today = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const greeting = isAr ? `مرحباً، ${userName} 👋` : `Welcome back, ${userName} 👋`;

  return (
    <StudentLayout
      title={greeting}
      subtitle={today}
      action={
        <Link href="/search" className="btn btn-primary btn-md">
          🔍 {isAr ? 'ابحث عن مُعلم' : 'Find a Tutor'}
        </Link>
      }
    >
      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { icon: '📅', value: (stats as Record<string, unknown>)?.total_bookings  || 0, ar: 'إجمالي الحجوزات', en: 'Total Bookings',    bg: '#EFF6FF', color: '#2563EB' },
          { icon: '✅', value: (stats as Record<string, unknown>)?.completed_lessons || 0, ar: 'دروس مكتملة',    en: 'Lessons Done',     bg: '#F0FDF4', color: '#16A34A' },
          { icon: '⏳', value: (stats as Record<string, unknown>)?.pending_bookings  || 0, ar: 'في الانتظار',    en: 'Pending',          bg: '#FEF9C3', color: '#CA8A04' },
          { icon: '🧑‍🏫', value: (stats as Record<string, unknown>)?.unique_tutors   || 0, ar: 'عدد المعلمين',   en: 'Your Tutors',      bg: '#FAF5FF', color: '#9333EA' },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 16, padding: '20px 22px',
            border: '1px solid #E9EBF0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{String(s.value)}</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 3 }}>{isAr ? s.ar : s.en}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Content grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>

        {/* Recent Bookings */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #E9EBF0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #F1F5F9' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>
              📋 {isAr ? 'حجوزاتي الأخيرة' : 'Recent Bookings'}
            </h2>
            <Link href="/dashboard/student/bookings" style={{ fontSize: 13, color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
              {isAr ? 'كل الحجوزات ←' : 'All →'}
            </Link>
          </div>
          <div style={{ padding: '8px 0' }}>
            {!recentBookings.length ? (
              <div style={{ padding: '40px 22px', textAlign: 'center', color: '#9CA3AF' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📖</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{isAr ? 'لا توجد حجوزات بعد' : 'No bookings yet'}</div>
                <Link href="/search" style={{ fontSize: 13, color: '#2563EB', fontWeight: 600 }}>
                  {isAr ? 'ابحث عن معلم' : 'Find a tutor'}
                </Link>
              </div>
            ) : recentBookings.map(b => {
              const st     = String(b.status ?? 'pending');
              const badge  = STATUS_BADGE[st] || STATUS_BADGE.pending;
              const tutor  = String((b.tutor as Record<string, unknown>)?.name ?? '—');
              return (
                <div key={b.id as number} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 22px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {tutor.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tutor}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                      {b.preferred_date
                        ? new Date(String(b.preferred_date)).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : (isAr ? 'تاريخ غير محدد' : 'Date TBD')}
                      {' · '}
                      {(() => {
                        const s = b.subject as Record<string, unknown> | null;
                        return String(isAr ? (s?.name_ar ?? s?.name_en ?? '—') : (s?.name_en ?? s?.name_ar ?? '—'));
                      })()}
                    </div>

                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: badge.bg, color: badge.color, flexShrink: 0 }}>
                    {isAr ? badge.ar : badge.en}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #E9EBF0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #F1F5F9' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>
              ⚡ {isAr ? 'روابط سريعة' : 'Quick Links'}
            </h2>
          </div>
          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { href: '/search',                          icon: '🔍', ar: 'ابحث عن معلم',    en: 'Find a Tutor'  },
              { href: '/dashboard/student/sessions',     icon: '📚', ar: 'حصصي',             en: 'My Sessions'   },
              { href: '/dashboard/student/bookings',     icon: '📋', ar: 'حجوزاتي',          en: 'My Bookings'   },
              { href: '/dashboard/student/favorites',    icon: '❤️', ar: 'المفضلة',           en: 'Favorites'     },
              { href: '/search?free_trial=true',         icon: '🎁', ar: 'درس أول مجاني',   en: 'Free Trial'    },
              { href: '/search?category=technology',     icon: '💻', ar: 'تعلّم البرمجة',    en: 'Programming'   },
            ].map(a => (
              <Link key={a.href} href={a.href} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px',
                borderRadius: 12, border: '1.5px solid #E9EBF0', textDecoration: 'none',
                color: '#374151', fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
                background: '#FAFAFA',
              }}>
                <span style={{ fontSize: 20 }}>{a.icon}</span>
                <span>{isAr ? a.ar : a.en}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
