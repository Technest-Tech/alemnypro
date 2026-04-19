'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { tutorApi } from '@/lib/api';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import styles from '../dashboard.module.css';
import tabStyles from './components/tabs.module.css';
import ProfileSummaryCard from './components/ProfileSummaryCard';
import ProfileCompletionCard from './components/ProfileCompletionCard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className={styles.reviewStars}>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ color: n <= rating ? '#F59E0B' : '#E5E7EB', fontSize: '1rem' }}>★</span>
      ))}
    </div>
  );
}

function formatDateTime(dateStr: string, timeStr: string | null | undefined, locale: string) {
  if (!dateStr) return '';
  try {
    const isAr = locale === 'ar';
    const datePart = String(dateStr).split('T')[0];
    const [y, mo, d] = datePart.split('-').map(Number);
    const date = new Date(y, mo - 1, d);
    const dateLabel = date.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    if (!timeStr) return dateLabel;
    const [h, m] = String(timeStr).split(':').map(Number);
    const suffix = h >= 12 ? (isAr ? 'م' : 'PM') : (isAr ? 'ص' : 'AM');
    const h12 = h % 12 || 12;
    return `${dateLabel} · ${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
  } catch { return dateStr; }
}

function formatDate(dateStr: string, locale: string) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });
  } catch { return dateStr; }
}

function isToday(dateStr: string) {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function getCurrentGreeting(isAr: boolean) {
  const h = new Date().getHours();
  if (isAr) {
    if (h < 12) return 'صباح الخير';
    if (h < 17) return 'مساء الخير';
    return 'مساء النور';
  }
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const TEACHER_LEVELS = [
  { id: 'new',         ar: 'معلم جديد', en: 'New',         min: 0,  color: '#6B7280', icon: '🌱' },
  { id: 'active',      ar: 'فعّال',      en: 'Active',      min: 5,  color: '#3B82F6', icon: '✨' },
  { id: 'recommended', ar: 'موصى به',   en: 'Recommended', min: 20, color: '#0F766E', icon: '🏆' },
  { id: 'ambassador',  ar: 'سفير',       en: 'Ambassador',  min: 50, color: '#D97706', icon: '⭐' },
];

function getLevel(count: number) {
  let l = TEACHER_LEVELS[0];
  for (const x of TEACHER_LEVELS) { if (count >= x.min) l = x; }
  return l;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TutorDashboard() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const qc = useQueryClient();
  const [userName, setUserName] = useState('');
  const [today, setToday] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('alemnypro_user');
    if (stored) setUserName(JSON.parse(stored)?.name?.split(' ')[0] || '');
    setToday(new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', {
      weekday: 'long', day: 'numeric', month: 'long',
    }));
  }, [isAr]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['tutor-stats'],
    queryFn: () => tutorApi.getDashboardStats().then(r => r.data.data),
    staleTime: 30_000,
  });

  const { data: profileData } = useQuery({
    queryKey: ['tutor-profile'],
    queryFn: () => tutorApi.getProfile().then(r => r.data.data),
    staleTime: 300_000,
  });

  const { data: pendingBookings, isLoading: loadingBookings } = useQuery({
    queryKey: ['tutor-bookings-all'],
    queryFn: () => tutorApi.getBookings({}).then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: meData } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => tutorApi.getMe().then(r => r.data.data),
    staleTime: 60_000,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['tutor-subjects'],
    queryFn: () => tutorApi.getSubjects().then(r => r.data.data),
    staleTime: 300_000,
  });

  const { data: documentsData } = useQuery({
    queryKey: ['tutor-onboarding-docs'],
    queryFn: () => tutorApi.getVerificationStatus().then(r => {
      const d = r.data.data;
      // verificationDocuments uses 'type' field, normalize to same shape
      return Array.isArray(d) ? d : [];
    }),
    staleTime: 300_000,
  });

  const allBookingsList = (pendingBookings?.data || pendingBookings || []) as Record<string, unknown>[];
  const bookingsList    = allBookingsList.slice(0, 5);
  const pendingCount    = allBookingsList.filter(b => b.status === 'pending').length;

  const tutorSlug    = profileData?.slug ?? '';
  const completionPct = stats?.onboarding?.completion_pct ?? 0;
  const obStatus      = stats?.onboarding_status ?? 'draft';
  const completedBookings = stats?.completed_bookings ?? 0;
  const isSearchable  = stats?.is_searchable;


  const visClass = isSearchable ? 'visible' : obStatus === 'pending_review' ? 'pending' : 'hidden';
  const visText  = isSearchable
    ? (isAr ? 'ملفك ظاهر في نتائج البحث ✅' : 'Your profile is visible in search ✅')
    : (obStatus === 'pending_review'
        ? (isAr ? 'ملفك قيد المراجعة' : 'Profile under review')
        : (isAr ? 'ملفك غير مكتمل — الطلاب لا يجدونك' : 'Profile incomplete — students can\'t find you'));


  // ── Pending review blocking screen ──
  if (!isLoading && obStatus === 'pending_review' && !isSearchable) {
    return (
      <DashboardLayout role="tutor" completionPct={100}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 24, padding: '48px 36px', textAlign: 'center', maxWidth: 500 }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🔍</div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1A1A2E', marginBottom: 10 }}>
              {isAr ? 'ملفك قيد المراجعة!' : 'Profile Under Review!'}
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#4B5563', lineHeight: 1.7, marginBottom: 28 }}>
              {isAr ? 'فريقنا يراجع وثائقك. ستصلك رسالة خلال 24-48 ساعة.' : 'Our team is reviewing your documents. You\'ll hear back within 24–48 hours.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
              {[{ n: 1, ar: 'أكملت التسجيل', en: 'Registered' }, { n: 2, ar: 'قيد المراجعة', en: 'Under review' }, { n: 3, ar: 'ستظهر للطلاب', en: 'Go live' }].map(s => (
                <div key={s.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.n === 2 ? '#F59E0B' : '#0F766E', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>{s.n}</div>
                  <span style={{ fontSize: '0.75rem', color: '#6B7280', textAlign: 'center', maxWidth: 80 }}>{isAr ? s.ar : s.en}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Skeleton ──
  if (isLoading) {
    return (
      <DashboardLayout role="tutor">
        <div className={tabStyles.skeletonWrap}>
          <div className={tabStyles.skeletonCard} style={{ height: 120 }} />
          <div className={tabStyles.skeletonGrid}>{[1,2,3,4].map(i => <div key={i} className={tabStyles.skeletonCard} style={{ height: 110 }} />)}</div>
          <div className={tabStyles.skeletonGrid2}>{[1,2].map(i => <div key={i} className={tabStyles.skeletonCard} style={{ height: 260 }} />)}</div>
        </div>
      </DashboardLayout>
    );
  }

  const level = getLevel(completedBookings);
  const currentIdx = TEACHER_LEVELS.findIndex(l => l.id === level.id);
  const next = TEACHER_LEVELS[currentIdx + 1];
  const levelPct = next ? Math.round(((completedBookings - level.min) / (next.min - level.min)) * 100) : 100;

  return (
    <DashboardLayout role="tutor" completionPct={completionPct} pendingCount={pendingCount}>

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{getCurrentGreeting(isAr)}, {userName} 👋</h1>
          <p className={styles.pageSubtitle}>{today}</p>
        </div>
        <div className={styles.pageActions}>
          <Link href={tutorSlug ? `/tutor/${encodeURIComponent(tutorSlug)}` : '#'} className="btn btn-outline btn-sm" target={tutorSlug ? '_blank' : undefined}>
            👁️ {isAr ? 'معاينة ملفي' : 'Preview Profile'}
          </Link>
          <Link href="/dashboard/tutor/messages" className="btn btn-primary btn-sm">
            💬 {pendingCount > 0 ? `(${pendingCount}) ` : ''}{isAr ? 'الرسائل' : 'Messages'}
          </Link>
        </div>
      </div>

      {/* Visibility bar */}
      <div className={`${styles.visibilityBar} ${styles[visClass]}`}>
        <span className={styles.visibilityDot} />
        <span>{visText}</span>
        {!isSearchable && (
          <Link href="/dashboard/tutor/listings" className={styles.visibilityLink}>
            {isAr ? 'أكمل ملفك ←' : 'Complete profile →'}
          </Link>
        )}
      </div>

      <div className={styles.dashboardLayoutGrid}>
        {/* ─── Left Sidebar (Profile & Level) ─── */}
        <div className={styles.dashboardSidebar}>

          <ProfileCompletionCard
            profileData={profileData as Parameters<typeof ProfileCompletionCard>[0]['profileData']}
            meData={meData as Parameters<typeof ProfileCompletionCard>[0]['meData']}
            subjectsData={Array.isArray(subjectsData) ? subjectsData : []}
            documentsData={Array.isArray(documentsData) ? documentsData : []}
            isAr={isAr}
          />

          <ProfileSummaryCard
            profileData={profileData as Parameters<typeof ProfileSummaryCard>[0]['profileData']}
            meData={meData as Parameters<typeof ProfileSummaryCard>[0]['meData']}
            completedBookings={completedBookings}
            totalReviews={stats?.total_reviews ?? 0}
            isAr={isAr}
          />

          {/* Teacher Level moved to Main Content Area */}
        </div>

        {/* ─── Main Content Area ─── */}
        <div className={styles.dashboardMain}>
          
          {/* ─── Premium Level Hero ─── */}
          <div className={styles.premiumLevelHero}>
            <div className={styles.premiumLevelShape1} />
            
            <div className={styles.premiumLevelInfo}>
              <div className={styles.premiumLevelBadge}>
                {level.icon} {isAr ? level.ar : level.en}
              </div>
              <h2 className={styles.premiumLevelTitle}>
                {next 
                  ? (isAr ? `في طريقك إلى ${next.ar}` : `On your way to ${next.en}`) 
                  : (isAr ? 'أعلى مستوى!' : 'Top level reached!')}
              </h2>
              <div className={styles.premiumStepper} style={{ '--step-color': level.color } as React.CSSProperties}>
                {TEACHER_LEVELS.map((l, i) => {
                  const done   = i <= currentIdx;
                  const active = i === currentIdx;
                  const isLast = i === TEACHER_LEVELS.length - 1;
                  return (
                    <div key={l.id} className={styles.premiumStepWrap}>
                      <div className={styles.premiumStep}>
                        <div className={`${styles.premiumStepDot} ${done ? styles.done : ''} ${active ? styles.active : ''}`}>
                          {done && !active ? '✓' : l.icon}
                        </div>
                        <div className={`${styles.premiumStepLabel} ${done ? styles.done : ''} ${active ? styles.active : ''}`}>
                          {isAr ? l.ar : l.en}
                          <span className={styles.premiumStepLabelSub}>
                            {l.min > 0 ? (isAr ? `${l.min}+ حجز` : `${l.min}+ sessions`) : (isAr ? 'البداية' : 'Start')}
                          </span>
                        </div>
                      </div>
                      {!isLast && (
                        <div className={`${styles.premiumStepConnector} ${done ? (active ? styles.active : styles.done) : ''}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.premiumLevelVisual}>
              <div 
                className={styles.premiumLevelRing} 
                style={{ 
                  background: `conic-gradient(${level.color} ${levelPct}%, rgba(255,255,255,0.05) 0)`,
                  boxShadow: `0 0 24px ${level.color}40`
                }}
              >
                <div className={styles.premiumLevelRingInner}>
                  <span className={styles.premiumLevelIcon}>{level.icon}</span>
                  <span className={styles.premiumLevelPctText} style={{ color: level.color }}>
                    {levelPct}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className={styles.contentGrid}>

            {/* Upcoming Sessions */}
            <div className={tabStyles.glassCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>🗓️ {isAr ? 'الحصص القادمة' : 'Upcoming Sessions'}</h2>
                <Link href="/dashboard/tutor/sessions" className={styles.cardLink}>{isAr ? 'كل الحصص ←' : 'All sessions →'}</Link>
              </div>
              <div className={styles.cardBody}>
                {!stats?.upcoming_sessions?.length ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyEmoji}>📅</span>
                    <p className={styles.emptyTitle}>{isAr ? 'لا حصص قادمة' : 'No upcoming sessions'}</p>
                    <p className={styles.emptyText}>{isAr ? 'حصصك المقبولة ستظهر هنا' : 'Accepted sessions appear here'}</p>
                  </div>
                ) : (
                  <div className={styles.sessionList}>
                    {(stats.upcoming_sessions as Record<string,unknown>[]).map((s, i) => (
                      <div key={i} className={styles.sessionItem}>
                        <div className={styles.sessionAvatar}>{((s.student_name as string) || '?').charAt(0).toUpperCase()}</div>
                        <div className={styles.sessionInfo}>
                          <div className={styles.sessionName}>{s.student_name as string}</div>
                          <div className={styles.sessionMeta}>
                            {formatDateTime(s.date as string, s.time as string, locale)}
                            {(isAr ? s.subject_ar : s.subject_en) && ` · ${String(isAr ? s.subject_ar : s.subject_en)}`}
                          </div>
                        </div>
                        <span className={`${styles.sessionBadge} ${isToday(s.date as string) ? styles.today : styles.future}`}>
                          {isToday(s.date as string) ? (isAr ? 'اليوم' : 'Today') : (isAr ? 'قادم' : 'Soon')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Booking Requests */}
            <div className={tabStyles.glassCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  📩 {isAr ? 'طلبات الحجز الأخيرة' : 'Recent Booking Requests'}
                  {pendingCount > 0 && <span style={{ background: '#E11D48', color: '#fff', borderRadius: '100px', fontSize: '11px', fontWeight: 800, padding: '2px 8px', marginInlineStart: 6 }}>{pendingCount}</span>}
                </h2>
                <Link href="/dashboard/tutor/messages" className={styles.cardLink}>{isAr ? 'فتح الرسائل ←' : 'Open messages →'}</Link>
              </div>
              <div className={styles.cardBody}>
                {loadingBookings ? (
                  <div className={styles.emptyState}><p className={styles.emptyText}>{isAr ? 'جاري التحميل...' : 'Loading...'}</p></div>
                ) : !bookingsList.length ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyEmoji}>🎉</span>
                    <p className={styles.emptyTitle}>{isAr ? 'لا طلبات حتى الآن' : 'No requests yet'}</p>
                    <p className={styles.emptyText}>{isAr ? 'الطلبات ستظهر هنا فور وصولها' : 'Requests will appear here as they arrive'}</p>
                  </div>
                ) : (
                  <div>
                    {bookingsList.map((b) => {
                      const status = String(b.status ?? 'pending');
                      const isPending = status === 'pending';
                      const BADGE: Record<string, { bg: string; color: string; ar: string; en: string; icon: string }> = {
                        pending:   { bg: 'rgba(234,179,8,0.12)',  color: '#92400E', ar: 'جديد',    en: 'New',       icon: '🆕' },
                        accepted:  { bg: 'rgba(22,163,74,0.1)',   color: '#15803D', ar: 'مقبول',   en: 'Accepted',  icon: '✅' },
                        rejected:  { bg: 'rgba(220,38,38,0.1)',   color: '#B91C1C', ar: 'مرفوض',   en: 'Rejected',  icon: '✕'  },
                        completed: { bg: 'rgba(124,58,237,0.08)', color: '#6D28D9', ar: 'مكتمل',   en: 'Completed', icon: '🏁' },
                        cancelled: { bg: 'rgba(107,114,128,0.1)', color: '#4B5563', ar: 'ملغي',    en: 'Cancelled', icon: '🚫' },
                      };
                      const badge = BADGE[status] ?? BADGE.pending;
                      const studentName = ((b.student as Record<string,unknown>)?.name as string) || '—';
                      const subjectAr   = ((b.subject as Record<string,unknown>)?.name_ar as string);
                      const subjectEn   = ((b.subject as Record<string,unknown>)?.name_en as string);
                      const subject     = isAr ? subjectAr : subjectEn;
                      return (
                        <div key={b.id as number} className={styles.bookingItem}>
                          <div className={styles.bookingInfo}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span className={styles.bookingName}>{studentName}</span>
                              {subject && <span style={{ fontSize: 12, color: '#6B7280' }}>· {subject}</span>}
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: badge.bg, color: badge.color }}>
                                {badge.icon} {isAr ? badge.ar : badge.en}
                              </span>
                            </div>
                            <div className={styles.bookingMeta}>
                              📅 {formatDateTime(b.preferred_date as string, b.preferred_time as string, locale)}
                            </div>
                            {Boolean(b.message) && <div style={{ fontSize: '0.75rem', color: '#6B7280', fontStyle: 'italic', marginTop: 2 }}>&ldquo;{String(b.message).slice(0, 60)}&rdquo;</div>}
                          </div>
                          <div className={styles.bookingActions}>
                            <Link
                              href={`/dashboard/tutor/messages?booking=${b.id as number}`}
                              style={{
                                padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                                textDecoration: 'none', whiteSpace: 'nowrap',
                                ...(isPending
                                  ? { background: 'linear-gradient(135deg,#1B4965,#2D6A8E)', color: '#fff' }
                                  : { border: '1.5px solid rgba(27,73,101,0.2)', background: 'rgba(27,73,101,0.05)', color: '#1B4965' }),
                              }}
                            >
                              💬 {isAr ? (isPending ? 'عرض التفاصيل' : 'فتح المحادثة') : (isPending ? 'View Details' : 'Open Chat')}
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className={styles.bottomGrid}>

            {/* Recent Reviews */}
            <div className={tabStyles.glassCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>⭐ {isAr ? 'آخر التقييمات' : 'Recent Reviews'}</h2>
                <Link href="/dashboard/tutor/evaluations" className={styles.cardLink}>{isAr ? 'كل التقييمات ←' : 'All reviews →'}</Link>
              </div>
              <div className={styles.cardBody}>
                {!stats?.recent_reviews?.length ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyEmoji}>💬</span>
                    <p className={styles.emptyTitle}>{isAr ? 'لا تقييمات بعد' : 'No reviews yet'}</p>
                    <p className={styles.emptyText}>{isAr ? 'ستظهر تقييمات طلابك هنا' : "Student reviews appear here"}</p>
                  </div>
                ) : (
                  <div>
                    {(stats.recent_reviews as Record<string,unknown>[]).map((r, i) => (
                      <div key={i} className={styles.reviewItem}>
                        <div className={styles.reviewHeader}>
                          <span className={styles.reviewName}>{r.student_name as string}</span>
                          <StarRating rating={r.rating as number} />
                        </div>
                        <p className={styles.reviewComment}>{r.comment as string}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Performance */}
            <div className={tabStyles.glassCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>📊 {isAr ? 'الأداء' : 'Performance'}</h2>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.gaugesRow}>
                  {[
                    { label: isAr ? 'معدل الاستجابة' : 'Response Rate',  val: stats?.response_rate ?? 0,   cls: 'green' },
                    { label: isAr ? 'معدل القبول' : 'Acceptance Rate',    val: stats?.acceptance_rate ?? 0, cls: 'blue'  },
                    { label: isAr ? 'اكتمال الملف' : 'Profile Complete',  val: completionPct, cls: completionPct < 60 ? 'amber' : 'green' },
                  ].map(g => (
                    <div key={g.label} className={styles.gaugeItem}>
                      <div className={styles.gaugeLabel}><span>{g.label}</span><span className={styles.gaugeValue}>{g.val}%</span></div>
                      <div className={styles.gaugeTrack}><div className={`${styles.gaugeFill} ${styles[g.cls]}`} style={{ width: `${g.val}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={tabStyles.glassCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>⚡ {isAr ? 'إجراءات سريعة' : 'Quick Actions'}</h2>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.quickActions}>
                  {[
                    { href: '/dashboard/tutor/listings',      icon: '🏷️', ar: 'إعلاناتي',     en: 'My Listings'    },
                    { href: '/dashboard/tutor/messages',      icon: '💬', ar: 'الرسائل',        en: 'Messages'       },
                    { href: '/dashboard/tutor/availability',  icon: '🗓️', ar: 'المواعيد',       en: 'Availability'   },
                    { href: '/dashboard/tutor/subjects',      icon: '📚', ar: 'المواد',          en: 'Subjects'       },
                    { href: '/dashboard/tutor/evaluations',   icon: '⭐', ar: 'التقييمات',      en: 'Evaluations'    },
                    { href: '/dashboard/tutor/premium',       icon: '⚡', ar: 'بريميوم',         en: 'Premium'        },
                  ].map(a => (
                    <Link key={a.href} href={a.href} className={styles.quickAction}>
                      <span className={styles.quickActionIcon}>{a.icon}</span>
                      <span>{isAr ? a.ar : a.en}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
