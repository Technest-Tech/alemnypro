'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { publicApi } from '@/lib/api';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import styles from './tutor.module.css';
import { useState, useEffect } from 'react';
import { useFavorites } from '@/lib/useFavorites';
import { useAuthModal } from '@/lib/AuthModalContext';
import { useRouter } from 'next/navigation';
import { tutorImgSrc } from '@/lib/tutorImage';


/* ─── Helpers ─── */

/** Strip "(Arabic name)" in parentheses from English subject name */
function cleanSubjectName(name: string): string {
  return name.replace(/\s*\(.*\)\s*$/, '').trim();
}

/** Format a date string to locale-aware short date */
function formatDate(dateStr: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric', month: 'long',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

/* ─── Star Rating ─── */
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={n <= Math.round(rating) ? '#FBBF24' : '#E5E7EB'}
            stroke={n <= Math.round(rating) ? '#F59E0B' : '#D1D5DB'}
            strokeWidth="1"
          />
        </svg>
      ))}
    </span>
  );
}



/* ─── Tier helper (same logic as search page) ─── */
function getTutorLevel(tutor: Record<string, unknown>) {
  const rating   = Number(tutor.avg_rating)    || 0;
  const reviews  = Number(tutor.total_reviews) || 0;
  const students = Number(tutor.total_students) || 0;
  if (rating >= 4.9 && reviews >= 80 && students >= 60) return { label: { ar: 'سفير', en: 'Ambassador' }, icon: '❆', color: '#fff', bg: 'linear-gradient(135deg,#6366f1,#818cf8)' };
  if (rating >= 4.7 && reviews >= 40 && students >= 30) return { label: { ar: 'بريميوم', en: 'Premium' }, icon: '★', color: '#fff', bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)' };
  if (rating >= 4.5 && reviews >= 15) return { label: { ar: 'نجم', en: 'Star' }, icon: '◆', color: '#fff', bg: 'linear-gradient(135deg,#10b981,#34d399)' };
  if (reviews >= 5 || students >= 3)  return { label: { ar: 'صاعد', en: 'Rising' }, icon: '▲', color: '#fff', bg: 'linear-gradient(135deg,#3b82f6,#60a5fa)' };
  return { label: { ar: 'جديد', en: 'New' }, icon: '●', color: '#374151', bg: '#f3f4f6' };
}

/* ─── Verified badge icon ─── */
function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Recommendation Card — full search-page style ─── */
function RecommendCard({
  tutor, isRtl, isFav, onFavorite,
}: {
  tutor: Record<string, unknown>;
  isRtl: boolean;
  isFav: boolean;
  onFavorite: (e: React.MouseEvent) => void;
}) {
  const user       = (tutor.user as Record<string, unknown>) || {};
  const subjects   = (tutor.subjects as Record<string, unknown>[]) || [];
  const isVerified = tutor.verification_status === 'verified';
  const imageSrc   = tutorImgSrc(user);
  const lvl        = getTutorLevel(tutor);

  return (
    <Link href={`/tutor/${tutor.slug}`} className={styles.recCard}>
      {/* Image area */}
      <div className={styles.recImageWrap}>
        <img src={imageSrc} alt={user.name as string || 'Tutor'} className={styles.recCoverImage} />

        {/* Level badge — top right (RTL) / top left (LTR) */}
        <div className={styles.recLevelBadge} style={{ background: lvl.bg, color: lvl.color }}>
          <span>{lvl.icon}</span>
          <span>{isRtl ? lvl.label.ar : lvl.label.en}</span>
        </div>

        {/* Favourite button */}
        <button
          className={styles.recFavBtn}
          onClick={e => { e.preventDefault(); e.stopPropagation(); onFavorite(e); }}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"
            fill={isFav ? '#ef4444' : 'none'}
            stroke={isFav ? '#ef4444' : '#555'}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'fill 0.2s,stroke 0.2s,transform 0.15s', transform: isFav ? 'scale(1.15)' : 'scale(1)' }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Rating overlay */}
        <div className={styles.recRatingOverlay}>
          <span style={{ color: '#FBBF24' }}>★</span>
          <span>{Number(tutor.avg_rating) > 0 ? Number(tutor.avg_rating).toFixed(1) : '—'}</span>
          <span style={{ opacity: 0.75, fontSize: '0.7rem' }}>({tutor.total_reviews as number})</span>
        </div>
      </div>

      {/* Content */}
      <div className={styles.recBody}>
        {/* Name + verified */}
        <div className={styles.recNameRow}>
          <span className={styles.recName}>{user.name as string}</span>
          {isVerified && <VerifiedBadge size={14} />}
        </div>

        {/* Verified flag */}
        <div className={isVerified ? styles.recVerifiedFlag : styles.recUnverifiedFlag}>
          {isVerified ? (
            <><svg width={10} height={10} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#16a34a"/><path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {isRtl ? 'هوية موثّقة' : 'Identity verified'}</>
          ) : (
            <><svg width={10} height={10} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#d97706" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="#d97706" strokeWidth="2" strokeLinecap="round"/></svg>
            {isRtl ? 'لم يتم التحقق بعد' : 'Not verified yet'}</>
          )}
        </div>

        {/* Headline */}
        <div className={styles.recHeadline}>
          {isRtl ? tutor.headline_ar as string : tutor.headline_en as string}
        </div>

        {/* Subject tags */}
        <div className={styles.recSubjectTags}>
          {subjects.slice(0, 3).map((s: Record<string, unknown>) => (
            <span key={s.id as number} className={styles.recSubjectTag}>
              {isRtl ? s.name_ar as string : s.name_en as string}
            </span>
          ))}
        </div>

        {/* Footer: price + free tag */}
        <div className={styles.recFooter}>
          <div className={styles.recPrice}>
            <span className={styles.recPriceNum}>{Number(tutor.hourly_rate).toLocaleString()}</span>
            <span className={styles.recPriceUnit}> {isRtl ? 'ج.م/ساعة' : 'EGP/hr'}</span>
          </div>
          {!!tutor.is_first_lesson_free && (
            <span className={styles.recFreeTag}>🎁 {isRtl ? 'أول ساعة مجانية' : '1st hr free'}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── Mock reviews (real reviews come from a future /reviews endpoint) ─── */
const MOCK_REVIEWS = [
  { id: 1, name: 'Ahmed K.', initials: 'AK', date: '2026-03-01', rating: 5, text: 'Outstanding teacher! Explains complex topics clearly. My grades improved significantly after just a few sessions.', color: '#1B4965' },
  { id: 2, name: 'Sara M.',  initials: 'SM', date: '2026-02-01', rating: 5, text: 'Very patient and knowledgeable. Adapts lessons to my pace. Highly recommend!', color: '#2A9D8F' },
  { id: 3, name: 'Mohamed R.', initials: 'MR', date: '2026-01-01', rating: 4, text: 'Great tutor, always well-prepared. Interactive sessions made studying enjoyable.', color: '#E76F51' },
];

// ──────────────────────────────────────────────────────────────────────────────

export default function TutorProfilePage() {
  const { slug } = useParams();
  const { t, locale } = useLocale();
  const isRtl = locale === 'ar';
  const router = useRouter();
  const [bioExpanded, setBioExpanded] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { openAuthModal } = useAuthModal();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('alemnypro_token'));
    const fn = () => setIsLoggedIn(!!localStorage.getItem('alemnypro_token'));
    window.addEventListener('alemnypro-auth-change', fn);
    return () => window.removeEventListener('alemnypro-auth-change', fn);
  }, []);

  const { data: tutor, isLoading } = useQuery({
    queryKey: ['tutor', slug],
    queryFn: () => publicApi.getTutor(slug as string).then(r => r.data.data),
    enabled: !!slug,
  });

  // Fetch similar tutors — runs immediately (same time as tutor query)
  const { data: searchData } = useQuery({
    queryKey: ['recs', slug],
    queryFn: () =>
      publicApi.searchTutors({ per_page: '6' })
        .then(r => (r.data?.data?.data ?? []) as Record<string, unknown>[]),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return (
    <><main className={styles.page}>
      <div className={styles.loadingWrap}>
        {[70, 260, 180, 160].map((h, i) => <div key={i} className={styles.loadingBar} style={{ height: h }} />)}
      </div>
    </main></>
  );

  if (!tutor) return (
    <><main className={styles.page}>
      <div className={styles.notFound}>
        <div className={styles.notFoundIcon}>🔍</div>
        <h1 className={styles.notFoundTitle}>{isRtl ? 'المعلم غير موجود' : 'Tutor not found'}</h1>
        <Link href="/search" className={styles.notFoundLink}>{t.nav.findTutor}</Link>
      </div>
    </main><Footer /></>
  );

  // ── Extract real data from API ──────────────────────────────────────────────
  const user      = (tutor.user as Record<string, unknown>) || {};
  const subjects  = (tutor.subjects as Record<string, unknown>[]) || [];
  const rating    = Number(tutor.avg_rating) || 0;
  const reviews   = Number(tutor.total_reviews) || 0;
  const students  = Number(tutor.total_students) || 0;
  const expYears  = Number(tutor.experience_years) || 0;
  const bio       = (isRtl ? tutor.bio_ar : tutor.bio_en) as string || '';
  const headline  = (isRtl ? tutor.headline_ar : tutor.headline_en) as string || '';
  const city      = tutor.city as Record<string, unknown> | null;
  const format    = (tutor.lesson_format as string) || 'both';
  const cityName  = city ? (isRtl ? city.name_ar as string : city.name_en as string) : null;
  const hourlyRate = Number(tutor.hourly_rate) || 0;
  const bioShort  = bio.length > 380 && !bioExpanded ? bio.slice(0, 380) + '…' : bio;

  // Exclude current tutor from recommendations
  const rawRecs = Array.isArray(searchData) ? searchData as Record<string, unknown>[] : [];
  const recommendations = rawRecs.filter(r => r.slug !== slug).slice(0, 4);

  const handleBook = () => {
    if (isLoggedIn) router.push(`/booking?tutor=${slug}`);
    else openAuthModal({ reason: 'book', onSuccess: () => router.push(`/booking?tutor=${slug}`) });
  };

  // ── Location labels matching the tutor dashboard LocationPickerModal ────────
  const locationLabels = {
    atHome:  isRtl ? 'في منزلي' : 'At my place',
    atPupil: isRtl ? 'في منزل الطالب / مكان عام' : "At the student's home / public place",
    online:  isRtl ? 'أونلاين (فيديو)' : 'Online (Video)',
  };

  const showAtHome  = format === 'in_person' || format === 'both';
  const showOnline  = format === 'online'    || format === 'both';
  // atPupil — only if travel_expenses is set OR format is in_person/both and location_label exists
  const showAtPupil = (format === 'in_person' || format === 'both') && !!tutor.travel_expenses;

  return (
    <>
    <main className={styles.page}>

      <div className={styles.container}>
        <div className={styles.layout}>

          {/* ══════════════════════════════
              LEFT — Main Content
          ══════════════════════════════ */}
          <div className={styles.mainCol}>

            {/* 1. Subject pill tags */}
            <div className={styles.subjectPills}>
              {subjects.length > 0
                ? subjects.map((s: Record<string, unknown>) => (
                    <span key={s.id as number} className={styles.subjectPill}>
                      {isRtl ? s.name_ar as string : cleanSubjectName(s.name_en as string)}
                    </span>
                  ))
                : (
                  <span className={styles.subjectPillEmpty}>
                    {isRtl ? 'لم تتم إضافة مواد بعد' : 'No subjects yet'}
                  </span>
                )}
            </div>

            {/* 2. Big bold headline */}
            <h1 className={styles.bigHeadline}>
              {headline || (subjects.length > 0
                ? (isRtl
                    ? `معلم متخصص في ${subjects[0].name_ar as string}`
                    : `Expert ${cleanSubjectName(subjects[0].name_en as string)} Tutor`)
                : (isRtl ? 'معلم خبير' : 'Expert Tutor')
              )}
            </h1>

            {/* 3. Course locations */}
            <div className={styles.locationsSection}>
              <h2 className={styles.locLabel}>
                {isRtl ? 'أماكن التدريس' : 'Teaching locations'}
              </h2>
              <div className={styles.locationChips}>
                {showAtHome && (
                  <span className={styles.locationChip}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                    {locationLabels.atHome}
                    {cityName && <span className={styles.locationFrom}> — {cityName}</span>}
                  </span>
                )}
                {showOnline && (
                  <span className={styles.locationChip}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 10l4.553-2.277A1 1 0 0121 8.645v6.71a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                    </svg>
                    {locationLabels.online}
                  </span>
                )}
                {showAtPupil && (
                  <span className={`${styles.locationChip} ${styles.locationChipWide}`}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7"/>
                    </svg>
                    {locationLabels.atPupil}
                    {tutor.travel_expenses && (
                      <span className={styles.locationFrom}>
                        {isRtl
                          ? ` — حتى ${tutor.travel_expenses} كم`
                          : ` — up to ${tutor.travel_expenses} km`}
                        {cityName && (isRtl ? ` من ${cityName}` : ` from ${cityName}`)}
                      </span>
                    )}
                  </span>
                )}
                {/* Fallback when no location data */}
                {!showAtHome && !showOnline && !showAtPupil && (
                  <span className={styles.locationChipEmpty}>
                    {isRtl ? 'لم يتم تحديد مكان التدريس بعد' : 'Teaching location not set yet'}
                  </span>
                )}
              </div>
            </div>

            {/* 4. Ambassador / Verified badge card */}
            {tutor.verification_status === 'verified' && (
              <div className={styles.ambassadorCard}>
                <div className={styles.ambassadorTitle}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L9 9H2l5.5 4-2 7L12 16l6.5 4-2-7L22 9h-7z" fill="#6366f1"/>
                    <circle cx="19" cy="5" r="2" fill="#818cf8"/>
                  </svg>
                  {isRtl ? 'معلم موثّق' : 'Verified Tutor'}
                </div>
                <p className={styles.ambassadorText}>
                  {isRtl
                    ? `${user.name as string} معلم متميز بمؤهلات موثّقة ونتائج مثبتة. سيخطط بعناية للدرس الأول بناءً على احتياجاتك.`
                    : `${user.name as string} is a top-rated tutor with verified qualifications and proven results. They will carefully plan your first lesson based on your needs.`}
                </p>
              </div>
            )}

            {/* 5a. About the teacher */}
            <div className={styles.aboutSection} id="about">
              <h2 className={styles.aboutTitle}>
                {isRtl ? `نبذة عن ${user.name as string}` : `About ${user.name as string}`}
              </h2>
              {bio ? (
                <>
                  <p className={styles.bioText}>{bioShort}</p>
                  {bio.length > 380 && (
                    <button className={styles.readMoreBtn} onClick={() => setBioExpanded(e => !e)}>
                      {bioExpanded ? (isRtl ? 'عرض أقل ↑' : 'Show less ↑') : (isRtl ? 'قراءة المزيد ↓' : 'Read more ↓')}
                    </button>
                  )}
                </>
              ) : (
                <p className={styles.emptyNote}>{isRtl ? 'لم تتم إضافة نبذة بعد.' : 'No bio added yet.'}</p>
              )}
            </div>

            {/* 5b. About the courses */}
            {(tutor.bio_method_ar || tutor.bio_method_en) && (
              <div className={styles.aboutSection} id="courses">
                <h2 className={styles.aboutTitle}>
                  {isRtl ? 'عن الدروس' : 'About the courses'}
                </h2>
                <p className={styles.bioText}>
                  {isRtl
                    ? tutor.bio_method_ar as string
                    : (tutor.bio_method_en as string || tutor.bio_method_ar as string)}
                </p>
              </div>
            )}

            {/* 6. Video Introduction */}
            {tutor.video_url && (() => {
              const url = tutor.video_url as string;
              const patterns = [
                /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
              ];
              let ytId: string | null = null;
              for (const p of patterns) { const m = url.match(p); if (m?.[1]) { ytId = m[1]; break; } }
              if (!ytId) return null;
              return (
                <div className={styles.aboutSection} id="video">
                  <h2 className={styles.aboutTitle}>
                    {isRtl ? 'فيديو تعريفي' : 'Video Introduction'}
                  </h2>
                  <div style={{
                    position: 'relative',
                    paddingBottom: '56.25%',
                    height: 0,
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: '#000',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                      title={isRtl ? 'فيديو تعريفي للمعلم' : 'Tutor Introduction Video'}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        width: '100%', height: '100%',
                        border: 'none',
                      }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* 7. Reviews — Premium card layout */}
            <div className={styles.reviewsSection} id="reviews">
              <div className={styles.reviewsHeaderRow}>
                <h2 className={styles.aboutTitle}>{isRtl ? 'تقييمات الطلاب' : 'Student reviews'}</h2>
                {reviews > 0 && (
                  <div className={styles.reviewsScorePill}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="#FBBF24" stroke="#F59E0B" strokeWidth="0.5">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <strong>{rating.toFixed(1)}</strong>
                    <span className={styles.reviewsScoreCount}>· {reviews} {isRtl ? 'تقييم' : 'ratings'}</span>
                  </div>
                )}
              </div>

              {reviews > 0 ? (
                <div className={styles.reviewCardsGrid}>
                  {MOCK_REVIEWS.slice(0, Math.min(3, reviews)).map(rv => (
                    <div key={rv.id} className={styles.reviewCard}>

                      {/* TOP: student info */}
                      <div className={styles.reviewCardHeader}>
                        <div className={styles.reviewCardAvatar} style={{ background: rv.color }}>
                          {rv.initials}
                        </div>
                        <div className={styles.reviewCardMeta}>
                          <span className={styles.reviewCardName}>{rv.name}</span>
                          <div className={styles.reviewCardBottom}>
                            <StarRating rating={rv.rating} size={12} />
                            <span className={styles.reviewCardDate}>{formatDate(rv.date, locale)}</span>
                          </div>
                        </div>
                        <div className={styles.reviewQuote} style={{ color: rv.color }}>&ldquo;</div>
                      </div>

                      {/* BODY: review text */}
                      <p className={styles.reviewCardText}>{rv.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.reviewsEmpty}>
                  <span className={styles.reviewsEmptyIcon}>⭐</span>
                  <p>{isRtl ? 'لا توجد تقييمات بعد. كن أول من يُقيّم هذا المعلم!' : 'No reviews yet. Be the first to review this tutor!'}</p>
                </div>
              )}
            </div>

            {/* 8. Pricing — clean table */}
            <div className={styles.pricingSection} id="pricing">
              <div className={styles.pricingTitleRow}>
                <h2 className={styles.aboutTitle}>{isRtl ? 'الأسعار' : 'Prices'}</h2>
                {tutor.is_first_lesson_free && (
                  <span className={styles.pricingFreeTag}>🎁 {isRtl ? 'أول درس مجاني' : 'First lesson free'}</span>
                )}
              </div>

              <div className={styles.pricingBox}>

                {/* Col 1 — hourly */}
                <div className={styles.pCol}>
                  <div className={styles.pColHead}>{isRtl ? 'السعر' : 'Price'}</div>
                  <div className={styles.pColVal}>
                    {hourlyRate > 0
                      ? <>{hourlyRate.toLocaleString()} <span className={styles.pColUnit}>{isRtl ? 'ج.م' : 'EGP'}</span></>
                      : <span className={styles.pColMuted}>—</span>}
                  </div>
                </div>

                {/* Col 2 — packs */}
                <div className={styles.pCol}>
                  <div className={styles.pColHead}>{isRtl ? 'أسعار الباقات' : 'Package prices'}</div>
                  {(tutor.pack_5h_price || tutor.pack_10h_price) ? (
                    <div className={styles.pColPackList}>
                      {tutor.pack_5h_price && (
                        <div>{isRtl ? '٥ ساعات:' : '5 hours:'} <strong>{Number(tutor.pack_5h_price).toLocaleString()}</strong> {isRtl ? 'ج.م' : 'EGP'}</div>
                      )}
                      {tutor.pack_10h_price && (
                        <div>{isRtl ? '١٠ ساعات:' : '10 hours:'} <strong>{Number(tutor.pack_10h_price).toLocaleString()}</strong> {isRtl ? 'ج.م' : 'EGP'}</div>
                      )}
                    </div>
                  ) : (
                    <span className={styles.pColMuted}>{isRtl ? 'لا توجد باقات' : 'No packages'}</span>
                  )}
                </div>

                {/* Col 3 — online (only if tutor teaches online) */}
                {(format === 'online' || format === 'both') && (
                  <div className={styles.pCol}>
                    <div className={styles.pColHead}>{isRtl ? 'أونلاين' : 'Webcam'}</div>
                    <div className={styles.pColVal}>
                      {tutor.hourly_rate_online
                        ? <>{Number(tutor.hourly_rate_online).toLocaleString()} <span className={styles.pColUnit}>{isRtl ? 'ج.م/س' : 'EGP/hr'}</span></>
                        : <>{hourlyRate.toLocaleString()} <span className={styles.pColUnit}>{isRtl ? 'ج.م/س' : 'EGP/hr'}</span></>
                      }
                    </div>
                  </div>
                )}

                {/* Col 4 — duration */}
                <div className={styles.pCol}>
                  <div className={styles.pColHead}>
                    {isRtl ? 'مدة الحصة' : 'Course offered'}
                    <span className={styles.pColInfo} title={isRtl ? 'مدة الدرس' : 'Lesson duration'}>ⓘ</span>
                  </div>
                  <div className={styles.pColVal}>
                    {tutor.first_lesson_duration ?? 60} <span className={styles.pColUnit}>{isRtl ? 'د' : 'min'}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* 9. Recommendations */}
            <div className={styles.recsSection}>
              <h2 className={styles.aboutTitle}>
                {isRtl ? 'معلمون مشابهون قد يعجبونك' : 'Similar tutors you may like'}
              </h2>
              {recommendations.length > 0 ? (
                <div className={styles.recsGrid}>
                  {recommendations.map((r: Record<string, unknown>, i: number) => (
                    <RecommendCard
                      key={r.id as number}
                      tutor={r}
                      isRtl={isRtl}
                      isFav={isFavorite(r.slug as string)}
                      onFavorite={(e) => toggleFavorite(r.slug as string, (r.user as Record<string,unknown>)?.name as string || '', e)}
                    />
                  ))}
                </div>
              ) : (
                /* Skeleton while loading */
                <div className={styles.recsGrid}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={styles.recCardSkeleton}>
                      <div className={styles.recSkeletonAvatar} />
                      <div className={styles.recSkeletonLine} style={{ width: '70%' }} />
                      <div className={styles.recSkeletonLine} style={{ width: '45%' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>{/* end mainCol */}

          {/* ══════════════════════════════
              RIGHT — Sticky Sidebar
          ══════════════════════════════ */}
          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>

              {/* Save + Share icons */}
              <div className={styles.sideActions}>
                <button
                  className={styles.sideActionBtn}
                  id="btn-save-tutor"
                  onClick={(e) => toggleFavorite(slug as string, (user.name as string) || '', e as React.MouseEvent)}
                  title={isRtl ? 'حفظ في المفضلة' : 'Save'}
                >
                  <svg width={20} height={20} viewBox="0 0 24 24"
                    fill={isFavorite(slug as string) ? '#ef4444' : 'none'}
                    stroke={isFavorite(slug as string) ? '#ef4444' : '#9ca3af'}
                    strokeWidth="1.8">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                </button>
                <button className={styles.sideActionBtn} title={isRtl ? 'مشاركة' : 'Share'}
                  onClick={() => navigator.share?.({ url: window.location.href, title: user.name as string }).catch(() => {})}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
                  </svg>
                </button>
              </div>

              {/* Avatar */}
              <div className={styles.sideAvatarWrap}>
                <div className={styles.sideAvatar}>
                  <img
                    src={tutorImgSrc(user)}
                    alt={user.name as string}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', borderRadius: '22px' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                {tutor.verification_status === 'verified' && (

                  <div className={styles.sideVerifiedBadge}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L9 9H2l5.5 4-2 7L12 16l6.5 4-2-7L22 9h-7z" fill="white"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Name */}
              <h2 className={styles.sideName}>{user.name as string}</h2>

              {/* Rating */}
              <div className={styles.sideRating}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="#FBBF24" stroke="#F59E0B" strokeWidth="0.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                {rating > 0
                  ? <><span className={styles.sideRatingVal}>{rating.toFixed(1)}</span>
                     <span className={styles.sideRatingCount}>({reviews} {isRtl ? 'تقييم' : 'ratings'})</span></>
                  : <span className={styles.sideRatingCount}>{isRtl ? 'لا توجد تقييمات بعد' : 'No ratings yet'}</span>
                }
              </div>

              {/* Divider */}
              <div className={styles.sideDividerFull} />

              {/* Data rows — real API values */}
              <div className={styles.sideRows}>
                <div className={styles.sideRow}>
                  <span className={styles.sideRowLabel}>{isRtl ? 'السعر في الساعة' : 'Price / hr'}</span>
                  <span className={styles.sideRowVal}>
                    {hourlyRate > 0
                      ? `${hourlyRate.toLocaleString()} ${isRtl ? 'ج.م' : 'EGP'}`
                      : (isRtl ? 'غير محدد' : 'TBD')}
                  </span>
                </div>
                <div className={styles.sideRow}>
                  <span className={styles.sideRowLabel}>{isRtl ? 'وقت الرد' : 'Answer'}</span>
                  <span className={styles.sideRowVal}>{isRtl ? 'ساعة' : '1 hour'}</span>
                </div>
                <div className={styles.sideRow}>
                  <span className={styles.sideRowLabel}>{isRtl ? 'الطلاب' : 'Students'}</span>
                  <span className={styles.sideRowVal}>{students > 0 ? `${students}+` : (isRtl ? 'جديد' : 'New')}</span>
                </div>
                {expYears > 0 && (
                  <div className={styles.sideRow}>
                    <span className={styles.sideRowLabel}>{isRtl ? 'الخبرة' : 'Experience'}</span>
                    <span className={styles.sideRowVal}>{expYears} {isRtl ? 'سنوات' : 'yrs'}</span>
                  </div>
                )}
              </div>

              {/* Contact button */}
              <button className={styles.contactBtn} id="btn-book-lesson" onClick={handleBook}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                {isRtl ? 'تواصل مع المعلم' : 'Contact'}
              </button>

              {/* Free lesson */}
              {tutor.is_first_lesson_free && (
                <p className={styles.freeLessonNote}>
                  {isRtl ? 'الدرس الأول ' : 'First '}
                  <u>{isRtl ? 'مجاني' : 'lesson'}</u>
                  {isRtl ? '' : ' free'}
                </p>
              )}

            </div>
          </aside>

        </div>
      </div>

    </main>
    <Footer /></>
  );
}
