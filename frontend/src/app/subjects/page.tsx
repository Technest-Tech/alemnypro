'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { publicApi } from '@/lib/api';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import styles from './index.module.css';

// ─── Subject photos — cycle the 6 new modern images ──────────────────────────
const SUBJECT_IMAGES = [
  '/images/subjects1.jpeg',
  '/images/subjects2.jpeg',
  '/images/subjects3.jpg',
  '/images/subjects4.jpeg',
  '/images/subjects5.jpeg',
  '/images/subjects6.jpeg',
];

// ─── Fallback icon / gradient when the backend icon field is empty ────────────
const SLUG_META: Record<string, { icon: string; gradient: string; image: string }> = {
  math:        { icon: '📐', gradient: 'linear-gradient(135deg,#667eea,#764ba2)', image: SUBJECT_IMAGES[0] },
  mathematics: { icon: '📐', gradient: 'linear-gradient(135deg,#667eea,#764ba2)', image: SUBJECT_IMAGES[0] },
  physics:     { icon: '🔬', gradient: 'linear-gradient(135deg,#0F2027,#2C5364)', image: SUBJECT_IMAGES[4] },
  chemistry:   { icon: '⚗️', gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)', image: SUBJECT_IMAGES[3] },
  biology:     { icon: '🧬', gradient: 'linear-gradient(135deg,#11998e,#38ef7d)', image: SUBJECT_IMAGES[2] },
  arabic:      { icon: '📖', gradient: 'linear-gradient(135deg,#c94b4b,#4b134f)', image: SUBJECT_IMAGES[5] },
  english:     { icon: '🌍', gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', image: SUBJECT_IMAGES[1] },
  french:      { icon: '🌐', gradient: 'linear-gradient(135deg,#0052D4,#6FB1FC)', image: SUBJECT_IMAGES[1] },
  spanish:     { icon: '💃', gradient: 'linear-gradient(135deg,#F7971E,#FFD200)', image: SUBJECT_IMAGES[1] },
  german:      { icon: '🦅', gradient: 'linear-gradient(135deg,#56CCF2,#2F80ED)', image: SUBJECT_IMAGES[1] },
  programming: { icon: '💻', gradient: 'linear-gradient(135deg,#0f0c29,#302b63)', image: SUBJECT_IMAGES[2] },
  python:      { icon: '🐍', gradient: 'linear-gradient(135deg,#1a1a2e,#16213e)', image: SUBJECT_IMAGES[2] },
  javascript:  { icon: '⚡', gradient: 'linear-gradient(135deg,#F7971E,#FFD200)', image: SUBJECT_IMAGES[2] },
  history:     { icon: '🏛️', gradient: 'linear-gradient(135deg,#834d9b,#d04ed6)', image: SUBJECT_IMAGES[5] },
  geography:   { icon: '🌏', gradient: 'linear-gradient(135deg,#56ab2f,#a8e063)', image: SUBJECT_IMAGES[3] },
  music:       { icon: '🎵', gradient: 'linear-gradient(135deg,#fc5c7d,#6a3093)', image: SUBJECT_IMAGES[5] },
  art:         { icon: '🎨', gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', image: SUBJECT_IMAGES[5] },
  economics:   { icon: '📊', gradient: 'linear-gradient(135deg,#2193b0,#6dd5ed)', image: SUBJECT_IMAGES[0] },
  accounting:  { icon: '🧾', gradient: 'linear-gradient(135deg,#1D976C,#93F9B9)', image: SUBJECT_IMAGES[0] },
};

const CATEGORY_ICONS: Record<string, string> = {
  sciences: '🔬', languages: '🌍', math: '📐', mathematics: '📐',
  arts: '🎨', technology: '💻', humanities: '🏛️', business: '📊',
  music: '🎵', sports: '⚽', religion: '📿', other: '📚',
};

const DEFAULT_META = { icon: '📚', gradient: 'linear-gradient(135deg,#1B4965,#2D6A8F)', image: '' };

function subjectMeta(subj: Record<string, unknown>, idx = 0) {
  const backendIcon = subj.icon as string | null;
  const slug = (subj.slug as string || '').toLowerCase();
  const known = SLUG_META[slug];
  if (known) return { icon: backendIcon || known.icon, gradient: known.gradient, image: known.image };
  // Unknown slug — cycle through all 6 images
  return { icon: backendIcon || DEFAULT_META.icon, gradient: DEFAULT_META.gradient, image: SUBJECT_IMAGES[idx % SUBJECT_IMAGES.length] };
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className={styles.subjectCard} style={{ pointerEvents: 'none', opacity: 0.55 }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(90deg,#E5E7EB 25%,#F3F4F6 50%,#E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 18, borderRadius: 8, width: '55%', background: '#E5E7EB' }} />
        <div style={{ height: 13, borderRadius: 6, width: '35%', background: '#F3F4F6' }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

// ─── Category Carousel ───────────────────────────────────────────────────────
function CategoryCarousel({
  categories, subjects, activeCategory, setActiveCategory, isAr,
}: {
  categories: Record<string, unknown>[];
  subjects:   Record<string, unknown>[];
  activeCategory: string;
  setActiveCategory: (s: string) => void;
  isAr: boolean;
}) {
  const trackRef    = useRef<HTMLDivElement>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const allItems    = [{ slug: 'all', name_ar: 'الكل', name_en: 'All', icon: '📚', count: subjects.length }, ...categories.map(c => ({ slug: c.slug as string, name_ar: c.name_ar as string, name_en: c.name_en as string, icon: (c.icon as string) || CATEGORY_ICONS[c.slug as string] || '📂', count: (c.subjects_count as number) ?? 0 }))];
  const [current, setCurrent] = useState(0);

  const scrollTo = useCallback((idx: number) => {
    const track = trackRef.current;
    if (!track) return;
    const items = track.querySelectorAll<HTMLButtonElement>('[data-carousel-item]');
    if (!items[idx]) return;
    items[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    setCurrent(idx);
  }, []);

  const prev = useCallback(() => scrollTo((current - 1 + allItems.length) % allItems.length), [current, allItems.length, scrollTo]);
  const next = useCallback(() => scrollTo((current + 1) % allItems.length), [current, allItems.length, scrollTo]);

  // Auto-advance
  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => setCurrent(c => { const n = (c + 1) % allItems.length; scrollTo(n); return n; }), 3200);
  }, [allItems.length, scrollTo]);

  function stopTimer() { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }

  useEffect(() => { startTimer(); return stopTimer; }, [startTimer]);

  return (
    <div className={styles.carouselWrap}>
      {/* Arrow + track row */}
      <div className={styles.carouselTrackRow}>
        {/* Left arrow */}
        <button className={styles.carouselArrow} onClick={() => { prev(); startTimer(); }} aria-label="Previous">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        {/* Scrollable track */}
        <div
          ref={trackRef}
          className={styles.carouselTrack}
          onMouseEnter={stopTimer}
          onMouseLeave={startTimer}
          onTouchStart={stopTimer}
          onTouchEnd={startTimer}
        >
          {allItems.map((item, i) => (
            <button
              key={item.slug}
              data-carousel-item
              className={`${styles.carouselItem} ${(activeCategory === item.slug) ? styles.carouselItemActive : ''} ${current === i ? styles.carouselItemCentered : ''}`}
              onClick={() => { setActiveCategory(item.slug === activeCategory ? 'all' : item.slug); scrollTo(i); startTimer(); }}
            >
              <span className={styles.carouselItemIcon}>{item.icon}</span>
              <span className={styles.carouselItemName}>{isAr ? item.name_ar : item.name_en}</span>
              {item.count > 0 && <span className={styles.carouselItemCount}>{item.count}</span>}
            </button>
          ))}
        </div>

        {/* Right arrow */}
        <button className={styles.carouselArrow} onClick={() => { next(); startTimer(); }} aria-label="Next">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* Dot indicators */}
      <div className={styles.carouselDots}>
        {allItems.map((item, i) => (
          <button
            key={item.slug}
            className={`${styles.carouselDot} ${i === current ? styles.carouselDotActive : ''}`}
            onClick={() => { scrollTo(i); startTimer(); }}
            aria-label={isAr ? item.name_ar : item.name_en}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SubjectsIndexPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: subjectsRaw, isLoading: subjectsLoading } = useQuery({
    queryKey: ['all-subjects'],
    queryFn: () => publicApi.getSubjects().then(r => r.data.data),
    staleTime: 300_000,
  });

  const { data: categoriesRaw, isLoading: catsLoading } = useQuery({
    queryKey: ['public-categories'],
    queryFn: () => publicApi.getCategories().then(r => r.data.data),
    staleTime: 300_000,
  });

  const subjects: Record<string, unknown>[] = Array.isArray(subjectsRaw) ? subjectsRaw : [];
  const categories: Record<string, unknown>[] = Array.isArray(categoriesRaw) ? categoriesRaw : [];
  const isLoading = subjectsLoading || catsLoading;

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = subjects;
    if (activeCategory !== 'all') {
      list = list.filter(s => ((s.category as Record<string, unknown>)?.slug as string) === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        ((s.name_ar as string) || '').toLowerCase().includes(q) ||
        ((s.name_en as string) || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [subjects, activeCategory, searchQuery]);

  // ── Group by category ─────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const groups: Record<string, { catMeta: Record<string, unknown>; subjects: Record<string, unknown>[] }> = {};
    filtered.forEach(s => {
      const cat = s.category as Record<string, unknown> | undefined;
      const slug = (cat?.slug as string) || 'other';
      if (!groups[slug]) groups[slug] = { catMeta: cat || {}, subjects: [] };
      groups[slug].subjects.push(s);
    });
    return groups;
  }, [filtered, isAr]);

  const totalTutors = subjects.reduce((acc, s) => acc + (Number(s.tutor_profiles_count) || 0), 0);

  return (
    <>
      
      <main className={styles.main}>

        {/* ── Compact Hero (no search bar — just identity + stats) ── */}
        <section className={styles.hero}>
          <div className={styles.heroGlow1} />
          <div className={styles.heroGlow2} />
          <div className={`container ${styles.heroContainer}`}>
            <span className={styles.heroBadge}>
              {isAr ? '✨ تصفح وفق اهتمامك' : '✨ Browse by interest'}
            </span>
            <h1 className={styles.heroTitle}>
              {isAr ? 'جميع المواد الدراسية' : 'All Subjects'}
            </h1>
            <p className={styles.heroDesc}>
              {isAr
                ? 'اختر مادتك وابحث عن أفضل المعلمين المتاحين فوراً.'
                : 'Pick a subject and instantly find the best available tutors.'}
            </p>

            {/* Inline filter input — lightweight, not a hero search */}
            <div className={styles.filterWrap}>
              <span className={styles.filterIcon}>🔍</span>
              <input
                type="text"
                className={styles.filterInput}
                placeholder={isAr ? 'فلتر سريع...' : 'Quick filter...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className={styles.filterClear} onClick={() => setSearchQuery('')} aria-label="Clear">✕</button>
              )}
            </div>

            {/* Live stats */}
            {!isLoading && subjects.length > 0 && (
              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <span className={styles.heroStatNum}>{subjects.length}</span>
                  <span className={styles.heroStatLabel}>{isAr ? 'مادة' : 'Subjects'}</span>
                </div>
                <div className={styles.heroStatDivider} />
                <div className={styles.heroStat}>
                  <span className={styles.heroStatNum}>{categories.length}</span>
                  <span className={styles.heroStatLabel}>{isAr ? 'تصنيف' : 'Categories'}</span>
                </div>
                {totalTutors > 0 && <>
                  <div className={styles.heroStatDivider} />
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatNum}>{totalTutors}+</span>
                    <span className={styles.heroStatLabel}>{isAr ? 'معلم' : 'Tutors'}</span>
                  </div>
                </>}
              </div>
            )}
          </div>
        </section>

        {/* ── Category Carousel ── */}
        {!catsLoading && categories.length > 0 && (
          <div className={styles.catTabBar}>
            <div className="container">
              <CategoryCarousel
                categories={categories}
                subjects={subjects}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                isAr={isAr}
              />
            </div>
          </div>
        )}

        {/* ── Directory Section ── */}
        <section className={styles.directorySection}>
          <div className="container">
            {isLoading ? (
              <div className={styles.skeletonGrid}>
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🙈</span>
                <h3 className={styles.emptyTitle}>
                  {isAr ? 'لم نجد هذه المادة' : 'Subject not found'}
                </h3>
                <p className={styles.emptyDesc}>
                  {searchQuery
                    ? (isAr ? 'جرب كلمة بحث أخرى' : 'Try a different search term')
                    : (isAr ? 'لا توجد مواد في هذا التصنيف حتى الآن' : 'No subjects in this category yet')}
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                  className="btn btn-primary btn-md mt-4"
                >
                  {isAr ? 'عرض كل المواد' : 'View all subjects'}
                </button>
              </div>
            ) : (
              <div className={styles.categoriesWrap}>
                {Object.entries(grouped).map(([catSlug, { catMeta, subjects: catSubjs }]) => {
                  const catName = isAr ? (catMeta.name_ar as string) : (catMeta.name_en as string);
                  const catIcon = (catMeta.icon as string) || CATEGORY_ICONS[catSlug] || '📂';
                  return (
                    <div key={catSlug} className={styles.categoryBlock}>
                      <div className={styles.categoryHeader}>
                        <h2 className={styles.categoryTitle}>
                          <span style={{ marginInlineEnd: 10 }}>{catIcon}</span>
                          {catName}
                        </h2>
                        <span className={styles.categoryCount}>
                          {catSubjs.length} {isAr ? 'مادة' : 'subjects'}
                        </span>
                      </div>
                      <div className={styles.subjectsGrid}>
                        {catSubjs.map(subj => {
                          const slug = subj.slug as string;
                          const idx = catSubjs.indexOf(subj);
                          const meta = subjectMeta(subj, idx);
                          const name = isAr ? (subj.name_ar as string) : (subj.name_en as string);
                          const tutorCount = Number(subj.tutor_profiles_count) || 0;
                          // Link directly to search results with correct param name
                          const searchHref = `/search?subject_slug=${encodeURIComponent(slug)}`;
                          return (
                            <Link key={slug} href={searchHref} className={styles.subjectCard}>
                              <div className={styles.subjectIconWrap} style={{ background: meta.gradient }}>
                                {meta.image ? (
                                  <>
                                    <img
                                      src={meta.image}
                                      alt={name}
                                      className={styles.subjectPhoto}
                                    />
                                    <span className={styles.subjectIconBadge}>{meta.icon}</span>
                                  </>
                                ) : (
                                  <span className={styles.subjectIconEmoji}>{meta.icon}</span>
                                )}
                              </div>
                              <div className={styles.subjectInfo}>
                                <span className={styles.subjectName}>{name}</span>
                                <span className={styles.subjectAction}>
                                  {tutorCount > 0
                                    ? (isAr ? `${tutorCount} معلم متاح` : `${tutorCount} tutor${tutorCount !== 1 ? 's' : ''} available`)
                                    : (isAr ? 'ابحث عن معلم →' : 'Find a tutor →')}
                                  {tutorCount > 0 && <span className={styles.arrow}> →</span>}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className={styles.ctaBanner}>
          <div className="container">
            <div className={styles.ctaInner}>
              <div className={styles.ctaContent}>
                <h2 className={styles.ctaTitle}>
                  {isAr ? 'كن جزءاً من منصة AlemnyPro' : 'Become part of AlemnyPro'}
                </h2>
                <p className={styles.ctaDesc}>
                  {isAr
                    ? 'هل تتقن مهارة معينة؟ ابدأ رحلتك كمعلم وانضم إلى مجتمعنا المتنامي.'
                    : 'Master a specific skill? Start your journey as a tutor and join our growing community.'}
                </p>
                <Link href="/become-a-tutor" className={styles.ctaBtn}>
                  🧑‍🏫 {isAr ? 'سجل كمعلم الآن' : 'Become a Tutor Now'}
                </Link>
              </div>
              <div className={styles.ctaVisual}><div className={styles.ctaCircle} /></div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
