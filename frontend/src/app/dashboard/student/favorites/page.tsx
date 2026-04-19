'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from '@/lib/locale';
import { useFavorites } from '@/lib/useFavorites';
import { publicApi } from '@/lib/api';
import StudentLayout from '@/components/layout/StudentLayout';
import Link from 'next/link';

const TEACHER_IMAGES = [
  '/images/teacher1.png',
  '/images/teacher2.png',
  '/images/teacher3.png',
  '/images/teacher4.jpg',
  '/images/teacher5.png',
];

function VerifiedBadge() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Tutor = Record<string, unknown>;

export default function FavoritesPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const { favorites, removeFavorite } = useFavorites();

  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  // Fetch all favorite tutor profiles
  useEffect(() => {
    if (favorites.length === 0) {
      setLoading(false);
      setTutors([]);
      return;
    }

    setLoading(true);
    Promise.all(
      favorites.map((slug) =>
        publicApi.getTutor(slug)
          .then((r) => r.data?.data || r.data)
          .catch(() => null)
      )
    ).then((results) => {
      setTutors(results.filter(Boolean) as Tutor[]);
      setLoading(false);
    });
  }, [favorites.length]); // re-run only when count changes

  const handleRemove = useCallback((slug: string) => {
    setRemoving(slug);
    removeFavorite(slug);
    setTutors((prev) => prev.filter((t) => t.slug !== slug));
    setTimeout(() => setRemoving(null), 400);
  }, [removeFavorite]);

  return (
    <StudentLayout
      title={isAr ? '❤️ معلميّ المفضلون' : '❤️ My Favorite Tutors'}
      subtitle={isAr ? `${favorites.length} معلم محفوظ` : `${favorites.length} saved tutor${favorites.length !== 1 ? 's' : ''}`}
      action={
        <Link href="/search" className="btn btn-primary btn-md">
          🔍 {isAr ? 'ابحث عن المزيد' : 'Find More Tutors'}
        </Link>
      }
    >
      {loading ? (
        /* Skeleton grid */
        <div style={gridStyle}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={cardStyle}>
              <div className="skeleton" style={{ height: 220, borderRadius: '0 0 0 0' }} />
              <div style={{ padding: 20 }}>
                <div className="skeleton skeleton-title" style={{ marginBottom: 8 }} />
                <div className="skeleton skeleton-text" />
                <div className="skeleton" style={{ height: 38, borderRadius: 10, marginTop: 16 }} />
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        /* Empty state */
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>💔</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A2E', marginBottom: 8 }}>
            {isAr ? 'لا توجد مفضلات بعد' : 'No favorites yet'}
          </h2>
          <p style={{ color: '#6B7280', fontSize: 15, marginBottom: 28, maxWidth: 380, margin: '0 auto 28px' }}>
            {isAr
              ? 'تصفح المعلمين واضغط على 🤍 لحفظ أي معلم يعجبك هنا'
              : 'Browse tutors and tap 🤍 to save any tutor you like here'}
          </p>
          <Link href="/search" className="btn btn-primary btn-lg">
            🔍 {isAr ? 'تصفح المعلمين' : 'Browse Tutors'}
          </Link>
        </div>
      ) : (
        /* Favourites grid */
        <div style={gridStyle}>
          {tutors.map((tutor, idx) => {
            const slug = tutor.slug as string;
            const user = tutor.user as Record<string, unknown>;
            const subjects = (tutor.subjects as Tutor[]) || [];
            const isVerified = tutor.verification_status === 'verified';
            const imageSrc = TEACHER_IMAGES[idx % TEACHER_IMAGES.length];
            const isRemoving = removing === slug;

            return (
              <div
                key={slug}
                style={{
                  ...cardStyle,
                  opacity: isRemoving ? 0 : 1,
                  transform: isRemoving ? 'scale(0.95)' : 'scale(1)',
                  transition: 'opacity 0.3s, transform 0.3s',
                }}
              >
                {/* Cover image */}
                <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
                  <Link href={`/tutor/${slug}`} style={{ display: 'block', height: '100%' }}>
                    <img
                      src={imageSrc}
                      alt={user?.name as string}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', display: 'block' }}
                    />
                  </Link>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(slug)}
                    title={isAr ? 'إزالة من المفضلة' : 'Remove from favorites'}
                    style={{
                      position: 'absolute', top: 12, right: 12,
                      width: 34, height: 34, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)',
                      border: 'none', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      transition: 'transform 0.15s, background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
                      (e.currentTarget as HTMLButtonElement).style.background = '#FEE2E2';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.92)';
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>

                  {/* Rating badge */}
                  <div style={{
                    position: 'absolute', bottom: 10, left: 12,
                    background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
                    padding: '4px 10px', borderRadius: 100,
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 13, fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}>
                    <span style={{ color: '#FBBF24' }}>★</span>
                    <span>{tutor.avg_rating as string}</span>
                    <span style={{ color: '#9CA3AF', fontWeight: 600, fontSize: 11 }}>({tutor.total_reviews as number})</span>
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: '16px 18px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#1A1A2E' }}>{user?.name as string}</span>
                    {isVerified && <VerifiedBadge />}
                  </div>

                  <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 10px', lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {isAr ? tutor.headline_ar as string : tutor.headline_en as string}
                  </p>

                  {/* Subjects */}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
                    {subjects.slice(0, 3).map((s) => (
                      <span key={s.id as number} style={{
                        padding: '3px 10px', background: '#EFF6FF', color: '#2563EB',
                        borderRadius: 100, fontSize: 11, fontWeight: 700,
                      }}>
                        {isAr ? s.name_ar as string : s.name_en as string}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                    <div>
                      <span style={{ fontSize: 17, fontWeight: 900, color: '#2563EB' }}>{tutor.hourly_rate as string}</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF', marginInlineStart: 3 }}>{isAr ? 'ج.م/ساعة' : 'EGP/hr'}</span>
                    </div>
                    <Link
                      href={`/tutor/${slug}`}
                      style={{
                        padding: '8px 16px', borderRadius: 10,
                        background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                        color: '#fff', fontWeight: 700, fontSize: 13,
                        textDecoration: 'none', transition: 'opacity 0.15s',
                      }}
                    >
                      {isAr ? 'عرض الملف' : 'View Profile'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 24,
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 18,
  border: '1px solid #E9EBF0',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};
