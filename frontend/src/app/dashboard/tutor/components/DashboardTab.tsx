'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tutorApi } from '@/lib/api';
import Link from 'next/link';
import styles from '../../dashboard.module.css';
import tabStyles from './tabs.module.css';

interface Props {
  isAr: boolean;
  locale: string;
  userName: string;
  today: string;
}

const TEACHER_LEVELS = [
  { id: 'new',         ar: 'معلم جديد',   en: 'New',         minBookings: 0,  color: '#6B7280', icon: '🌱' },
  { id: 'active',      ar: 'فعّال',        en: 'Active',      minBookings: 5,  color: '#3B82F6', icon: '✨' },
  { id: 'recommended', ar: 'موصى به',     en: 'Recommended', minBookings: 20, color: '#0F766E', icon: '🏆' },
  { id: 'ambassador',  ar: 'سفير',         en: 'Ambassador',  minBookings: 50, color: '#D97706', icon: '⭐' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className={styles.reviewStars}>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ color: n <= rating ? '#F59E0B' : '#E5E7EB', fontSize: '1rem' }}>★</span>
      ))}
    </div>
  );
}

function formatDate(dateStr: string, locale: string) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });
  } catch { return dateStr; }
}

function isToday(dateStr: string) {
  if (!dateStr) return false;
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function getTeacherLevel(completedBookings: number) {
  let level = TEACHER_LEVELS[0];
  for (const l of TEACHER_LEVELS) {
    if (completedBookings >= l.minBookings) level = l;
  }
  return level;
}

function TeacherLevelStepper({ isAr, completedBookings }: { isAr: boolean; completedBookings: number }) {
  const currentLevel = getTeacherLevel(completedBookings);
  const currentIdx = TEACHER_LEVELS.findIndex(l => l.id === currentLevel.id);
  const next = TEACHER_LEVELS[currentIdx + 1];
  const progressPct = next
    ? Math.round(((completedBookings - currentLevel.minBookings) / (next.minBookings - currentLevel.minBookings)) * 100)
    : 100;

  return (
    <div className={tabStyles.levelCard}>
      <div className={tabStyles.levelHeader}>
        <div>
          <div className={tabStyles.levelBadge} style={{ background: currentLevel.color }}>
            {currentLevel.icon} {isAr ? currentLevel.ar : currentLevel.en}
          </div>
          <p className={tabStyles.levelSubtext}>
            {next
              ? (isAr
                  ? `${next.minBookings - completedBookings} حجز للمستوى التالي: ${next.ar}`
                  : `${next.minBookings - completedBookings} bookings to ${next.en}`)
              : (isAr ? 'وصلت إلى أعلى مستوى! 🎉' : 'Top level reached! 🎉')}
          </p>
        </div>
        <div className={tabStyles.levelCircle} style={{ borderColor: currentLevel.color }}>
          <span className={tabStyles.levelCircleIcon}>{currentLevel.icon}</span>
          <span className={tabStyles.levelPct} style={{ color: currentLevel.color }}>{progressPct}%</span>
        </div>
      </div>

      <div className={tabStyles.levelSteps}>
        {TEACHER_LEVELS.map((l, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <div key={l.id} className={tabStyles.levelStep}>
              <div
                className={`${tabStyles.levelStepDot} ${done ? tabStyles.levelStepDone : ''} ${active ? tabStyles.levelStepActive : ''}`}
                style={done || active ? { background: l.color, borderColor: l.color } : {}}
              >
                {done && !active ? '✓' : l.icon}
              </div>
              <span className={tabStyles.levelStepLabel} style={active ? { color: l.color, fontWeight: 800 } : {}}>
                {isAr ? l.ar : l.en}
              </span>
              {i < TEACHER_LEVELS.length - 1 && (
                <div className={`${tabStyles.levelConnector} ${done ? tabStyles.levelConnectorDone : ''}`}
                     style={done ? { background: TEACHER_LEVELS[i+1]?.color ?? '#E5E7EB' } : {}} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardTab({ isAr, locale, userName, today }: Props) {
  const qc = useQueryClient();

  const { data: stats, isLoading: loadingStats } = useQuery({
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
    queryKey: ['tutor-bookings-pending'],
    queryFn: () => tutorApi.getBookings({ status: 'pending' }).then(r => r.data.data),
  });

  const tutorSlug = profileData?.slug ?? '';
  const pendingList = (pendingBookings?.data || pendingBookings || []).slice(0, 5) as Record<string, unknown>[];
  const pendingCount = pendingList.length;
  const completionPct = stats?.onboarding?.completion_pct ?? 0;
  const completedBookings = stats?.completed_bookings ?? 0;
  const isSearchable = stats?.is_searchable;
  const obStatus = stats?.onboarding_status ?? 'draft';

  const visClass = isSearchable ? 'visible' : obStatus === 'pending_review' ? 'pending' : 'hidden';
  const visText = isSearchable
    ? (isAr ? 'ملفك ظاهر في نتائج البحث ✅' : 'Your profile is visible in search ✅')
    : (obStatus === 'pending_review'
        ? (isAr ? 'ملفك قيد المراجعة — سيظهر قريباً' : 'Profile under review — you\'ll appear soon')
        : (isAr ? 'ملفك غير مكتمل — الطلاب لا يجدونك' : 'Profile incomplete — students can\'t find you'));

  const accept = useMutation({
    mutationFn: (id: number) => tutorApi.acceptBooking(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tutor-bookings-pending'] }),
  });
  const reject = useMutation({
    mutationFn: (id: number) => tutorApi.rejectBooking(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tutor-bookings-pending'] }),
  });

  if (loadingStats) {
    return (
      <div className={tabStyles.skeletonWrap}>
        <div className={tabStyles.skeletonCard} style={{ height: 120 }} />
        <div className={tabStyles.skeletonGrid}>
          {[1,2,3,4].map(i => <div key={i} className={tabStyles.skeletonCard} style={{ height: 110 }} />)}
        </div>
        <div className={tabStyles.skeletonGrid2}>
          {[1,2].map(i => <div key={i} className={tabStyles.skeletonCard} style={{ height: 250 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Onboarding / visibility banner */}
      <div className={`${styles.visibilityBar} ${styles[visClass]}`} style={{ marginBottom: 20 }}>
        <span className={styles.visibilityDot} />
        <span>{visText}</span>
        {!isSearchable && (
          <Link href="/auth/tutor-register" className={styles.visibilityLink}>
            {isAr ? 'أكمل ملفك ←' : 'Complete profile →'}
          </Link>
        )}
      </div>

      {/* Teacher Level Stepper */}
      <TeacherLevelStepper isAr={isAr} completedBookings={completedBookings} />

      {/* Glass Stats Grid */}
      <div className={tabStyles.glassStatsGrid}>
        {/* Hours Taught */}
        <div className={tabStyles.glassStat}>
          <div className={tabStyles.glassStatIcon} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563EB' }}>⏱️</div>
          <div className={tabStyles.glassStatValue}>{completedBookings}</div>
          <div className={tabStyles.glassStatLabel}>{isAr ? 'حصص مكتملة' : 'Sessions Done'}</div>
          <div className={tabStyles.glassStatSub}>
            <span className={tabStyles.glassStatBadgeUp}>+{stats?.total_students ?? 0}</span>
            {isAr ? ' طلاب' : ' students'}
          </div>
        </div>

        {/* Pending */}
        <div className={tabStyles.glassStat} style={pendingCount > 0 ? { borderColor: 'rgba(217,119,6,0.3)', background: 'rgba(254,243,199,0.6)' } : {}}>
          <div className={tabStyles.glassStatIcon} style={{ background: 'rgba(217,119,6,0.12)', color: '#D97706' }}>📩</div>
          <div className={tabStyles.glassStatValue} style={pendingCount > 0 ? { color: '#D97706' } : {}}>{pendingCount}</div>
          <div className={tabStyles.glassStatLabel}>{isAr ? 'طلبات معلقة' : 'Pending Requests'}</div>
          <div className={tabStyles.glassStatSub}>
            {pendingCount > 0
              ? (isAr ? '🔔 تحتاج ردك' : '🔔 Needs response')
              : (isAr ? 'كل شيء محدّث ✅' : 'All up to date ✅')}
          </div>
        </div>

        {/* Rating */}
        <div className={tabStyles.glassStat}>
          <div className={tabStyles.glassStatIcon} style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>⭐</div>
          <div className={tabStyles.glassStatValue}>
            {stats?.avg_rating ? Number(stats.avg_rating).toFixed(1) : '—'}
          </div>
          <div className={tabStyles.glassStatLabel}>{isAr ? 'متوسط التقييم' : 'Avg Rating'}</div>
          <div className={tabStyles.glassStatSub}>{stats?.total_reviews ?? 0} {isAr ? 'تقييم' : 'reviews'}</div>
        </div>

        {/* Verification Status */}
        <div className={tabStyles.glassStat}
             style={stats?.verification_status === 'verified'
               ? { borderColor: 'rgba(5,150,105,0.3)', background: 'rgba(236,253,245,0.7)' }
               : { borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(254,242,242,0.7)' }}>
          <div className={tabStyles.glassStatIcon}
               style={stats?.verification_status === 'verified'
                 ? { background: 'rgba(5,150,105,0.12)', color: '#059669' }
                 : { background: 'rgba(239,68,68,0.12)', color: '#E11D48' }}>
            {stats?.verification_status === 'verified' ? '✅' : '🔒'}
          </div>
          <div className={tabStyles.glassStatValue} style={{ fontSize: '1.1rem', paddingTop: 4 }}>
            {stats?.verification_status === 'verified'
              ? (isAr ? 'موثّق' : 'Verified')
              : (isAr ? 'غير موثّق' : 'Unverified')}
          </div>
          <div className={tabStyles.glassStatLabel}>{isAr ? 'حالة التوثيق' : 'Verification'}</div>
          {stats?.verification_status !== 'verified' && (
            <Link href="/dashboard/tutor/verification" className={tabStyles.glassStatLink}>
              {isAr ? 'وثّق حسابك →' : 'Get verified →'}
            </Link>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className={styles.contentGrid} style={{ marginBottom: 20 }}>

        {/* Upcoming Sessions */}
        <div className={tabStyles.glassCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>🗓️ {isAr ? 'الحصص القادمة' : 'Upcoming Sessions'}</h2>
            <Link href="/dashboard/tutor/sessions" className={styles.cardLink}>
              {isAr ? 'كل الحصص ←' : 'All sessions →'}
            </Link>
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
                    <div className={styles.sessionAvatar}>
                      {((s.student_name as string) || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.sessionInfo}>
                      <div className={styles.sessionName}>{s.student_name as string}</div>
                      <div className={styles.sessionMeta}>
                        {formatDate(s.date as string, locale)} · {s.time as string}
                        {Boolean(s.subject) && ` · ${String(s.subject)}`}
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

        {/* Pending Requests — Action Center */}
        <div className={tabStyles.glassCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              📩 {isAr ? 'طلبات الحجز' : 'Booking Requests'}
              {pendingCount > 0 && (
                <span style={{ background: '#E11D48', color: '#fff', borderRadius: '100px', fontSize: '11px', fontWeight: 800, padding: '2px 8px', marginInlineStart: 6 }}>
                  {pendingCount}
                </span>
              )}
            </h2>
            <Link href="/dashboard/tutor/bookings" className={styles.cardLink}>
              {isAr ? 'كل الطلبات ←' : 'All requests →'}
            </Link>
          </div>
          <div className={styles.cardBody}>
            {loadingBookings ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
              </div>
            ) : !pendingList.length ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyEmoji}>🎉</span>
                <p className={styles.emptyTitle}>{isAr ? 'لا طلبات معلقة' : 'No pending requests'}</p>
                <p className={styles.emptyText}>{isAr ? 'الطلبات الجديدة ستظهر هنا' : 'New requests appear here'}</p>
              </div>
            ) : (
              <div>
                {pendingList.map((b) => (
                  <div key={b.id as number} className={styles.bookingItem}>
                    <div className={styles.bookingInfo}>
                      <div className={styles.bookingName}>
                        {((b.student as Record<string,unknown>)?.name as string) || '—'}
                      </div>
                      <div className={styles.bookingMeta}>
                        📅 {b.preferred_date as string} · 🕐 {b.preferred_time as string}
                      </div>
                      {Boolean(b.message) && (
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', fontStyle: 'italic', marginTop: 2 }}>
                          &ldquo;{String(b.message).slice(0, 60)}{String(b.message).length > 60 ? '...' : ''}&rdquo;
                        </div>
                      )}
                    </div>
                    <div className={styles.bookingActions}>
                      <button className={styles.btnAccept} onClick={() => accept.mutate(b.id as number)} disabled={accept.isPending}>
                        ✓ {isAr ? 'قبول' : 'Accept'}
                      </button>
                      <button className={styles.btnReject} onClick={() => reject.mutate(b.id as number)} disabled={reject.isPending}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
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
                { label: isAr ? 'اكتمال الملف' : 'Profile Complete',  val: completionPct,                cls: completionPct < 60 ? 'amber' : 'green' },
              ].map(g => (
                <div key={g.label} className={styles.gaugeItem}>
                  <div className={styles.gaugeLabel}>
                    <span>{g.label}</span>
                    <span className={styles.gaugeValue}>{g.val}%</span>
                  </div>
                  <div className={styles.gaugeTrack}>
                    <div className={`${styles.gaugeFill} ${styles[g.cls]}`} style={{ width: `${g.val}%` }} />
                  </div>
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
                { href: '/dashboard/tutor/profile',       icon: '✏️', ar: 'تعديل الملف',   en: 'Edit Profile'    },
                { href: '/dashboard/tutor/availability',  icon: '🗓️', ar: 'المواعيد',      en: 'Availability'    },
                { href: '/dashboard/tutor/subjects',      icon: '📚', ar: 'المواد',         en: 'Subjects'        },
                { href: '/dashboard/tutor/verification',  icon: '🔒', ar: 'التوثيق',       en: 'Verification'    },
                { href: tutorSlug ? `/tutor/${encodeURIComponent(tutorSlug)}` : '/dashboard/tutor', icon: '👁️', ar: 'معاينة ملفي', en: 'Preview', target: tutorSlug ? '_blank' : undefined },
                { href: '/search',                        icon: '🔍', ar: 'تصفح المنصة',   en: 'Browse Platform' },
              ].map((a) => (
                <Link key={a.href} href={a.href} className={styles.quickAction} target={(a as {target?: string}).target}>
                  <span className={styles.quickActionIcon}>{a.icon}</span>
                  <span>{isAr ? a.ar : a.en}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
