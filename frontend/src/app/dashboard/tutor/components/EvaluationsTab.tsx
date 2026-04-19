'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tutorApi } from '@/lib/api';
import styles from '../../dashboard.module.css';
import tabStyles from './tabs.module.css';
import evalStyles from './EvaluationsTab.module.css';

interface Props { isAr: boolean; }

const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366F1,#818CF8)',
  'linear-gradient(135deg,#0F766E,#14B8A6)',
  'linear-gradient(135deg,#DB2777,#F472B6)',
  'linear-gradient(135deg,#D97706,#FBBF24)',
  'linear-gradient(135deg,#7C3AED,#A78BFA)',
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? '1.4rem' : size === 'sm' ? '0.85rem' : '1rem';
  return (
    <div className={evalStyles.starRow}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className={evalStyles.star}
          style={{ color: n <= rating ? '#F59E0B' : '#E5E7EB', fontSize: sz }}
        >★</span>
      ))}
    </div>
  );
}

function RatingRing({ value, max = 5 }: { value: number; max?: number }) {
  const pct  = (value / max) * 100;
  const r    = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={108} height={108} viewBox="0 0 108 108" className={evalStyles.ratingRing}>
      <circle cx={54} cy={54} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={10} />
      <circle
        cx={54} cy={54} r={r} fill="none"
        stroke="url(#ratingGrad)"
        strokeWidth={10}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="ratingGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SentimentBadge({ rating, isAr }: { rating: number; isAr: boolean }) {
  if (rating >= 4.5) return <span className={`${evalStyles.sentimentBadge} ${evalStyles.excellent}`}>{isAr ? 'ممتاز ✦' : 'Excellent ✦'}</span>;
  if (rating >= 3.5) return <span className={`${evalStyles.sentimentBadge} ${evalStyles.good}`}>{isAr ? 'جيد جداً' : 'Very Good'}</span>;
  if (rating >= 2.5) return <span className={`${evalStyles.sentimentBadge} ${evalStyles.fair}`}>{isAr ? 'مقبول' : 'Fair'}</span>;
  return <span className={`${evalStyles.sentimentBadge} ${evalStyles.poor}`}>{isAr ? 'يحتاج تحسين' : 'Needs Work'}</span>;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className={tabStyles.skeletonWrap}>
      <div className={tabStyles.skeletonCard} style={{ height: 180, borderRadius: 24 }} />
      <div className={tabStyles.skeletonGrid2}>
        <div className={tabStyles.skeletonCard} style={{ height: 340 }} />
        <div className={tabStyles.skeletonCard} style={{ height: 340 }} />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function EvaluationsTab({ isAr }: Props) {
  const [page, setPage]     = useState(1);
  const [copied, setCopied] = useState(false);
  const queryClient         = useQueryClient();

  // ── Reviews (dedicated endpoint) ────────────────────────────────────────
  const { data: reviewsData, isLoading: reviewsLoading, isFetching } = useQuery({
    queryKey: ['tutor-reviews', page],
    queryFn:  () => tutorApi.getReviews(page, 10).then(r => r.data.data),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  // ── Profile (for share URL) ──────────────────────────────────────────────
  const { data: profileData } = useQuery({
    queryKey: ['tutor-profile'],
    queryFn:  () => tutorApi.getProfile().then(r => r.data.data),
    staleTime: 300_000,
  });

  // ── Derived values ────────────────────────────────────────────────────────
  const stats       = reviewsData?.stats     ?? { total: 0, avg_rating: null, distribution: [] };
  const reviewsMeta = reviewsData?.reviews   ?? { data: [], current_page: 1, last_page: 1, total: 0 };
  const reviews     = reviewsMeta.data       ?? [];
  const totalReviews = stats.total           ?? 0;
  const avgRating    = stats.avg_rating      ? Number(stats.avg_rating).toFixed(1) : null;
  const distribution: { stars: number; count: number; pct: number }[] = stats.distribution ?? [];

  // ── Share URL ─────────────────────────────────────────────────────────────
  const slug           = profileData?.slug ?? '';
  const tutorProfileUrl = slug
    ? (typeof window !== 'undefined' ? `${window.location.origin}/tutor/${encodeURIComponent(slug)}` : `/tutor/${slug}`)
    : '';

  const shareText = isAr
    ? `تحقق من ملفي كمدرس خصوصي على AlemnyPro! ${tutorProfileUrl}`
    : `Check out my tutoring profile on AlemnyPro! ${tutorProfileUrl}`;

  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(tutorProfileUrl)}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(tutorProfileUrl)}`;

  const handleCopy = () => {
    if (tutorProfileUrl) {
      navigator.clipboard?.writeText(tutorProfileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  if (reviewsLoading) return <Skeleton />;

  return (
    <div className={evalStyles.root}>

      {/* ── Hero Banner ── */}
      {avgRating ? (
        <div className={evalStyles.heroBanner}>
          <div className={evalStyles.heroOrb1} />
          <div className={evalStyles.heroOrb2} />

          <div className={evalStyles.heroLeft}>
            <div className={evalStyles.heroKicker}>
              ⭐ {isAr ? 'سمعتك المهنية' : 'Your Reputation Score'}
            </div>
            <div className={evalStyles.heroTitle}>
              {avgRating} <span className={evalStyles.heroMax}>/&nbsp;5</span>
            </div>
            <SentimentBadge rating={Number(avgRating)} isAr={isAr} />
            <StarRating rating={Math.round(Number(avgRating))} size="lg" />
            <p className={evalStyles.heroSub}>
              {totalReviews} {isAr ? 'تقييم من الطلاب' : 'student reviews collected'}
            </p>
          </div>

          <div className={evalStyles.heroRight}>
            <div className={evalStyles.ringWrap}>
              <RatingRing value={Number(avgRating)} />
              <div className={evalStyles.ringCenter}>
                <span className={evalStyles.ringValue}>{avgRating}</span>
                <span className={evalStyles.ringLabel}>{isAr ? 'من 5' : 'of 5'}</span>
              </div>
            </div>

            {/* Real distribution bars from API */}
            <div className={evalStyles.distBars}>
              {distribution.map(d => (
                <div key={d.stars} className={evalStyles.distRow}>
                  <span className={evalStyles.distStar}>{d.stars}★</span>
                  <div className={evalStyles.distTrack}>
                    <div
                      className={evalStyles.distFill}
                      style={{
                        width: `${d.pct}%`,
                        background: d.stars >= 4
                          ? 'linear-gradient(90deg,#F59E0B,#FBBF24)'
                          : d.stars === 3 ? '#94A3B8' : '#FDA4AF',
                      }}
                    />
                  </div>
                  <span className={evalStyles.distCount}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={evalStyles.heroBannerEmpty}>
          <div className={evalStyles.heroOrb1} />
          <span className={evalStyles.heroEmptyIcon}>✦</span>
          <h2 className={evalStyles.heroEmptyTitle}>
            {isAr ? 'ابدأ في جمع تقييماتك' : 'Start Building Your Reputation'}
          </h2>
          <p className={evalStyles.heroEmptyText}>
            {isAr
              ? 'أكمل حصصك الأولى وشارك رابط ملفك لتبدأ في جمع التقييمات'
              : 'Complete your first sessions and share your profile link to start collecting reviews'}
          </p>
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className={evalStyles.mainGrid}>

        {/* ── Left: Reviews Panel ── */}
        <div className={evalStyles.panel}>
          {/* Header */}
          <div className={evalStyles.toggle} style={{ marginBottom: 16 }}>
            <div className={`${evalStyles.toggleBtn} ${evalStyles.toggleBtnActive}`} style={{ cursor: 'default' }}>
              ⭐&nbsp;{isAr ? 'التقييمات المُستلمة' : 'Reviews Received'}
              {totalReviews > 0 && <span className={evalStyles.toggleCount}>{totalReviews}</span>}
            </div>
          </div>

          {/* Review cards */}
          {reviews.length === 0 ? (
            <div className={evalStyles.emptyBox}>
              <div className={evalStyles.emptyIcon}>💬</div>
              <p className={evalStyles.emptyTitle}>{isAr ? 'لا تقييمات بعد' : 'No reviews yet'}</p>
              <p className={evalStyles.emptyText}>
                {isAr
                  ? 'شارك رابط ملفك مع طلابك لتلقي أول تقييم'
                  : 'Share your profile link with students to receive your first review'}
              </p>
            </div>
          ) : (
            <>
              {reviews.map((r: {
                id: number;
                student_name: string;
                student_avatar?: string;
                rating: number;
                comment?: string;
                date: string;
              }, i: number) => (
                <div key={r.id} className={evalStyles.reviewCard}>
                  <div className={evalStyles.reviewCardTop}>
                    {r.student_avatar ? (
                      <img
                        src={r.student_avatar}
                        className={evalStyles.reviewAvatar}
                        alt={r.student_name}
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className={evalStyles.reviewAvatar}
                        style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                      >
                        {(r.student_name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={evalStyles.reviewMeta}>
                      <span className={evalStyles.reviewName}>{r.student_name}</span>
                      <span className={evalStyles.reviewDate}>{r.date}</span>
                    </div>
                    <div className={evalStyles.reviewRatingCol}>
                      <StarRating rating={r.rating} size="sm" />
                      <span className={evalStyles.reviewRatingNum}>{r.rating}.0</span>
                    </div>
                  </div>
                  {Boolean(r.comment) && (
                    <p className={evalStyles.reviewComment}>
                      <span className={evalStyles.quoteIcon}>"</span>
                      {r.comment}
                      <span className={evalStyles.quoteIcon}>"</span>
                    </p>
                  )}
                </div>
              ))}

              {/* Pagination */}
              {reviewsMeta.last_page > 1 && (
                <div className={evalStyles.pagination}>
                  <button
                    className={evalStyles.pageBtn}
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    {isAr ? '← السابق' : '← Prev'}
                  </button>
                  <span className={evalStyles.pageInfo}>
                    {isAr
                      ? `${reviewsMeta.current_page} / ${reviewsMeta.last_page}`
                      : `${reviewsMeta.current_page} of ${reviewsMeta.last_page}`}
                  </span>
                  <button
                    className={evalStyles.pageBtn}
                    disabled={page >= reviewsMeta.last_page || isFetching}
                    onClick={() => setPage(p => p + 1)}
                  >
                    {isAr ? 'التالي →' : 'Next →'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right: Share + Tips Panel ── */}
        <div className={evalStyles.sideStack}>

          {/* Share card */}
          <div className={evalStyles.shareCard}>
            <div className={evalStyles.shareCardHeader}>
              <div className={evalStyles.shareCardIcon}>🔗</div>
              <div>
                <h3 className={evalStyles.shareCardTitle}>
                  {isAr ? 'احصل على توصيات' : 'Get Recommendations'}
                </h3>
                <p className={evalStyles.shareCardSub}>
                  {isAr ? 'شارك ملفك واجمع المزيد من التقييمات' : 'Share your profile to collect more reviews'}
                </p>
              </div>
            </div>

            <div className={evalStyles.shareBtns}>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className={`${evalStyles.shareBtn} ${evalStyles.shareBtnWa}`}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.116 1.524 5.847L.057 23.6a.5.5 0 0 0 .613.613l5.753-1.467A11.946 11.946 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.881 0-3.651-.511-5.167-1.403l-.371-.22-3.828.977.994-3.828-.24-.383A10 10 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                WhatsApp
              </a>
              <a href={liUrl} target="_blank" rel="noopener noreferrer" className={`${evalStyles.shareBtn} ${evalStyles.shareBtnLi}`}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
              <a href={fbUrl} target="_blank" rel="noopener noreferrer" className={`${evalStyles.shareBtn} ${evalStyles.shareBtnFb}`}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </a>
            </div>

            {/* Profile link copy box */}
            {tutorProfileUrl && (
              <div className={evalStyles.linkBox} onClick={handleCopy} title={isAr ? 'انقر للنسخ' : 'Click to copy'}>
                <span className={evalStyles.linkUrl}>{tutorProfileUrl}</span>
                <button className={`${evalStyles.copyBtn} ${copied ? evalStyles.copyBtnDone : ''}`}>
                  {copied ? '✓' : '⎘'}
                </button>
              </div>
            )}

            {copied && (
              <p className={evalStyles.copiedMsg}>
                {isAr ? 'تم نسخ الرابط ✓' : 'Link copied to clipboard ✓'}
              </p>
            )}
          </div>

          {/* Request-a-review card */}
          <div className={evalStyles.shareCard} style={{ marginTop: 0 }}>
            <div className={evalStyles.shareCardHeader}>
              <div className={evalStyles.shareCardIcon}>📨</div>
              <div>
                <h3 className={evalStyles.shareCardTitle}>
                  {isAr ? 'اطلب تقييماً من طلابك' : 'Request a Review'}
                </h3>
                <p className={evalStyles.shareCardSub}>
                  {isAr
                    ? 'أرسل رابط ملفك لطلابك مباشرة عبر الرسائل'
                    : 'Send your profile link to students via messages'}
                </p>
              </div>
            </div>
            <a
              href="/dashboard/tutor/messages"
              className={evalStyles.shareBtn}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, background: 'linear-gradient(135deg,#6366F1,#818CF8)', color: '#fff', border: 'none' }}
            >
              💬&nbsp;{isAr ? 'فتح الرسائل' : 'Open Messages'}
            </a>
          </div>

          {/* Tips card */}
          <div className={evalStyles.tipsCard}>
            <h3 className={evalStyles.tipsTitle}>
              💡 {isAr ? 'نصائح لتحسين تقييماتك' : 'Tips to Boost Your Score'}
            </h3>
            <ul className={evalStyles.tipsList}>
              {(isAr ? [
                'تواصل مع طلابك بعد كل حصة',
                'اطلب تقييمهم بلطف وبشكل شخصي',
                'احرص على الحضور في الموعد المحدد',
                'استجب بسرعة لرسائل الطلاب',
              ] : [
                'Follow up with students after each session',
                'Politely request reviews personally',
                'Always be on time for sessions',
                'Respond quickly to student messages',
              ]).map((tip, i) => (
                <li key={i} className={evalStyles.tipItem}>
                  <span className={evalStyles.tipBullet}>{i + 1}</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
