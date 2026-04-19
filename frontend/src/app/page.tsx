'use client';

import { useLocale } from '@/lib/locale';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/lib/api';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import styles from './page.module.css';
import TestimonialsGrid from '@/components/ui/TestimonialsGrid/TestimonialsGrid';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFavorites } from '@/lib/useFavorites';
import { useAuthModal } from '@/lib/AuthModalContext';
import { tutorImgSrc } from '@/lib/tutorImage';

// ── Meta-style Verified Badge SVG ──────────────────────────────────────
function VerifiedBadge({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="Verified">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Popular Subjects for Autocomplete ──────────────────────────────────
const POPULAR_SUBJECTS = [
  { icon: '📐', ar: 'رياضيات', en: 'Mathematics' },
  { icon: '🔬', ar: 'فيزياء', en: 'Physics' },
  { icon: '⚗️', ar: 'كيمياء', en: 'Chemistry' },
  { icon: '🧬', ar: 'أحياء', en: 'Biology' },
  { icon: '📖', ar: 'لغة عربية', en: 'Arabic' },
  { icon: '🌍', ar: 'لغة إنجليزية', en: 'English' },
  { icon: '🌐', ar: 'فرنساوي', en: 'French' },
  { icon: '💻', ar: 'برمجة', en: 'Programming' },
  { icon: '🏛️', ar: 'تاريخ', en: 'History' },
  { icon: '🌏', ar: 'جغرافيا', en: 'Geography' },
];

// ── Stats Counter Animation ────────────────────────────────────────────
const STATS = [
  { num: '500+', ar: 'معلم موثوق', en: 'Verified Tutors' },
  { num: '2,000+', ar: 'طالب نشط', en: 'Active Students' },
  { num: '10K+', ar: 'حصة مكتملة', en: 'Lessons Completed' },
  { num: '4.9 ⭐', ar: 'متوسط التقييم', en: 'Avg. Rating' },
];

// ── Academic Subjects Chips ────────────────────────────────────────────
const ACADEMIC_SUBJECTS = [
  { slug: 'math', icon: '📐', ar: 'رياضيات', en: 'Mathematics', count: 142 },
  { slug: 'physics', icon: '🔬', ar: 'فيزياء', en: 'Physics', count: 98 },
  { slug: 'chemistry', icon: '⚗️', ar: 'كيمياء', en: 'Chemistry', count: 87 },
  { slug: 'arabic', icon: '📖', ar: 'لغة عربية', en: 'Arabic', count: 76 },
  { slug: 'english', icon: '🌍', ar: 'لغة إنجليزية', en: 'English', count: 134 },
  { slug: 'biology', icon: '🧬', ar: 'أحياء', en: 'Biology', count: 65 },
  { slug: 'french', icon: '🌐', ar: 'فرنساوي', en: 'French', count: 44 },
  { slug: 'programming', icon: '💻', ar: 'برمجة', en: 'Programming', count: 58 },
  { slug: 'history', icon: '🏛️', ar: 'تاريخ', en: 'History', count: 33 },
  { slug: 'geography', icon: '🌏', ar: 'جغرافيا', en: 'Geography', count: 29 },
];

export default function HomePage() {
  const { locale } = useLocale();
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { openAuthModal } = useAuthModal();

  // Detect auth status client-side
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('alemnypro_token'));
    const onAuth = () => setIsLoggedIn(!!localStorage.getItem('alemnypro_token'));
    window.addEventListener('alemnypro-auth-change', onAuth);
    return () => window.removeEventListener('alemnypro-auth-change', onAuth);
  }, []);

  const handleFavorite = useCallback((slug: string, tutorName = '', e?: React.MouseEvent) => {
    if (!isLoggedIn) {
      openAuthModal({
        reason: 'favorite',
        onSuccess: () => toggleFavorite(slug, tutorName),
      });
    } else {
      toggleFavorite(slug, tutorName, e);
    }
  }, [isLoggedIn, openAuthModal, toggleFavorite]);

  // Search state
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'online' | 'nearby'>('online');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Mobile search overlay
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  // Auto-focus mobile search input when overlay opens
  useEffect(() => {
    if (mobileSearchOpen && mobileSearchRef.current) {
      setTimeout(() => mobileSearchRef.current?.focus(), 100);
      // Prevent body scrolling when overlay is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileSearchOpen]);

  // ── Typewriter placeholder animation ──────────────────────────────────
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  useEffect(() => {
    const prefix = locale === 'ar' ? 'جرّب "' : 'Try "';
    const suffix = locale === 'ar' ? '"...' : '"...';
    const subjects = POPULAR_SUBJECTS.map(s => locale === 'ar' ? s.ar : s.en);
    let subjectIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const word = subjects[subjectIdx];
      if (!deleting) {
        // Typing phase
        charIdx++;
        setTypedPlaceholder(prefix + word.slice(0, charIdx) + suffix);
        if (charIdx === word.length) {
          // Pause at full word, then start deleting
          deleting = true;
          timeoutId = setTimeout(tick, 2500);  // hold full word longer
          return;
        }
      } else {
        // Deleting phase
        charIdx--;
        setTypedPlaceholder(charIdx === 0 ? '' : prefix + word.slice(0, charIdx) + suffix);
        if (charIdx === 0) {
          deleting = false;
          subjectIdx = (subjectIdx + 1) % subjects.length;
          // Pause before typing next word
          timeoutId = setTimeout(tick, 800);
          return;
        }
      }
      timeoutId = setTimeout(tick, deleting ? 70 : 120);
    };

    // Initial delay before starting
    timeoutId = setTimeout(tick, 900);
    return () => clearTimeout(timeoutId);
  }, [locale]);

  const { data: featuredTutors } = useQuery({
    queryKey: ['featured-tutors'],
    queryFn: () => publicApi.getFeaturedTutors().then(r => r.data.data),
  });

  const tutors = Array.isArray(featuredTutors) ? featuredTutors : [];

  // Filtered subjects for autocomplete
  const filtered = POPULAR_SUBJECTS.filter(s =>
    (locale === 'ar' ? s.ar : s.en).toLowerCase().includes(query.toLowerCase())
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setShowModeMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  // Handle Search

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (mode === 'online') params.set('format', 'online');
    router.push(`/search?${params.toString()}`);
  };

  const scrollCarousel = (dir: number) => {
    const el = document.getElementById('heroSubjectsTrack');
    if (el) el.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  // Auto-scroll group sessions carousel
  useEffect(() => {
    const timer = setInterval(() => {
      const el = document.getElementById('groupCarouselTrack');
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 320, behavior: 'smooth' });
      }
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      
      <main>

        {/* ═══════════════════════════════════════════
            HERO SECTION — Centered, smart search
        ═══════════════════════════════════════════ */}
        <section className={styles.hero}>
          <div className={styles.heroPattern} />
          <div className={styles.heroBlobLeft} />
          <div className={styles.heroBlobRight} />

          <div className={`container ${styles.heroContent}`}>
            {/* ── TOP: Badge + Title ── */}
            <div className={styles.heroTop}>
              <span className={styles.heroPill}>
                🎓 {locale === 'ar' ? 'منصة التعليم الخاص الأولى في مصر' : "Egypt's #1 Private Tutoring Platform"}
              </span>

              <h1 className={styles.heroTitle}>
                {locale === 'ar'
                  ? <>ابحث عن<br /><span className={styles.heroGradientText}>معلمك المثالي</span></>
                  : <>Find the<br /><span className={styles.heroGradientText}>perfect tutor</span></>}
              </h1>
            </div>

            {/* ── BOTTOM: Search + Carousel ── */}
            <div className={styles.heroBottom}>

            {/* ── Mobile Search Pill (tap to open overlay) ── */}
            <button
              className={styles.mobileSearchPill}
              onClick={() => setMobileSearchOpen(true)}
              type="button"
            >
              <span className={styles.mobileSearchPillIcon}>🔍</span>
              <span className={styles.mobileSearchPillText}>
                {locale === 'ar' ? 'ابحث عن مادة أو معلم...' : 'Search a subject or tutor...'}
              </span>
            </button>

            {/* ── Desktop Search Bar (hidden on mobile) ── */}
            <div className={styles.searchWrap} ref={searchRef}>
              <div className={`${styles.searchBar} ${showDropdown ? styles.searchBarFocused : ''}`}>
                {/* Subject Input */}
                <span className={styles.searchIcon}>🔍</span>
                <input
                  className={styles.searchInput}
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowDropdown(true); setShowModeMenu(false); }}
                  onFocus={() => { setShowDropdown(true); setShowModeMenu(false); }}
                  placeholder={query ? '' : (typedPlaceholder || (locale === 'ar' ? 'ابحث عن مادة...' : 'Search a subject...'))}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />

                {/* Vertical divider */}
                <div className={styles.searchDivider} />

                {/* Mode dropdown (inside bar) */}
                <div className={styles.modeDropdownWrap}>
                  <button
                    className={styles.modeDropdownBtn}
                    onClick={() => { setShowModeMenu(v => !v); setShowDropdown(false); }}
                    type="button"
                  >
                    {mode === 'online' ? '🖥️' : '📍'}
                    <span className={styles.modeDropdownLabel}>
                      {mode === 'online'
                        ? (locale === 'ar' ? 'أونلاين' : 'Online')
                        : (locale === 'ar' ? 'بالقرب مني' : 'Near Me')}
                    </span>
                    <span className={styles.modeChevron}>▾</span>
                  </button>
                  {showModeMenu && (
                    <div className={styles.modeDropdownMenu}>
                      <button className={`${styles.modeOption} ${mode === 'online' ? styles.modeOptionActive : ''}`} onClick={() => { setMode('online'); setShowModeMenu(false); }}>
                        🖥️ {locale === 'ar' ? 'أونلاين' : 'Online'}
                      </button>
                      <button className={`${styles.modeOption} ${mode === 'nearby' ? styles.modeOptionActive : ''}`} onClick={() => { setMode('nearby'); setShowModeMenu(false); }}>
                        📍 {locale === 'ar' ? 'بالقرب مني' : 'Near Me'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Search button */}
                <button className={styles.searchBtn} onClick={handleSearch}>
                  {locale === 'ar' ? 'بحث' : 'Search'}
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              {showDropdown && (
                <div className={styles.searchDropdown}>
                  {!query && (
                    <div className={styles.dropdownSection}>
                      <span className={styles.dropdownLabel}>
                        {locale === 'ar' ? 'الأكثر طلباً' : 'Popular subjects'}
                      </span>
                    </div>
                  )}
                  {(query ? filtered : POPULAR_SUBJECTS).map((s, i) => (
                    <button
                      key={i}
                      className={styles.dropdownItem}
                      onClick={() => {
                        setQuery(locale === 'ar' ? s.ar : s.en);
                        setShowDropdown(false);
                      }}
                    >
                      <span className={styles.dropdownItemIcon}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                      </span>
                      <div className={styles.dropdownItemName}>{locale === 'ar' ? s.ar : s.en}</div>
                    </button>
                  ))}
                  {query && filtered.length === 0 && (
                    <div className={styles.dropdownEmpty}>
                      {locale === 'ar' ? 'اضغط بحث لعرض النتائج' : 'Press search to see results'}
                    </div>
                  )}
                </div>
              )}
            </div>



            {/* ── Subjects Carousel (Superprof-style with arrows) ── */}
            <div className={styles.subjectsCarousel}>
              <button className={styles.carouselArrow} onClick={() => scrollCarousel(locale === 'ar' ? 1 : -1)} aria-label="Previous">
                ‹
              </button>
              <div className={styles.carouselTrack} id="heroSubjectsTrack">
                {ACADEMIC_SUBJECTS.map((sub) => (
                  <Link key={sub.slug} href={`/subjects/${sub.slug}`} className={styles.carouselChip}>
                    <span className={styles.carouselChipIcon}>{sub.icon}</span>
                    <span className={styles.carouselChipName}>{locale === 'ar' ? sub.ar : sub.en}</span>
                  </Link>
                ))}
              </div>
              <button className={styles.carouselArrow} onClick={() => scrollCarousel(locale === 'ar' ? -1 : 1)} aria-label="Next">
                ›
              </button>
            </div>

            </div>{/* /heroBottom */}
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            MOBILE SEARCH OVERLAY — Full-screen, Uber-style
        ═══════════════════════════════════════════ */}
        <div className={`${styles.mobileSearchOverlay} ${mobileSearchOpen ? styles.mobileSearchOverlayOpen : ''}`}>
          {/* Overlay Header */}
          <div className={styles.mobileSearchHeader}>
            <button
              className={styles.mobileSearchClose}
              onClick={() => { setMobileSearchOpen(false); setQuery(''); }}
              type="button"
              aria-label="Close search"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div className={styles.mobileSearchInputWrap}>
              <span className={styles.mobileSearchInputIcon}>🔍</span>
              <input
                ref={mobileSearchRef}
                className={styles.mobileSearchInput}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={locale === 'ar' ? 'ابحث عن مادة...' : 'Search a subject...'}
                onKeyDown={e => { if (e.key === 'Enter') { handleSearch(); setMobileSearchOpen(false); } }}
              />
              {query && (
                <button
                  className={styles.mobileSearchClear}
                  onClick={() => setQuery('')}
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Mode Toggle */}
          <div className={styles.mobileSearchModeBar}>
            <button
              className={`${styles.mobileSearchModeBtn} ${mode === 'online' ? styles.mobileSearchModeBtnActive : ''}`}
              onClick={() => setMode('online')}
              type="button"
            >
              🖥️ {locale === 'ar' ? 'أونلاين' : 'Online'}
            </button>
            <button
              className={`${styles.mobileSearchModeBtn} ${mode === 'nearby' ? styles.mobileSearchModeBtnActive : ''}`}
              onClick={() => setMode('nearby')}
              type="button"
            >
              📍 {locale === 'ar' ? 'بالقرب مني' : 'Near Me'}
            </button>
          </div>

          {/* Popular Subjects Grid */}
          <div className={styles.mobileSearchBody}>
            <span className={styles.mobileSearchSectionTitle}>
              {locale === 'ar' ? 'الأكثر طلباً' : 'Popular Subjects'}
            </span>
            <div className={styles.mobileSearchSubjectsGrid}>
              {(query ? filtered : POPULAR_SUBJECTS).map((s, i) => (
                <button
                  key={i}
                  className={styles.mobileSearchSubjectChip}
                  onClick={() => {
                    setQuery(locale === 'ar' ? s.ar : s.en);
                    handleSearch();
                    setMobileSearchOpen(false);
                  }}
                >
                  <span className={styles.mobileSearchSubjectIcon}>{s.icon}</span>
                  <span className={styles.mobileSearchSubjectName}>{locale === 'ar' ? s.ar : s.en}</span>
                </button>
              ))}
            </div>
            {query && filtered.length === 0 && (
              <button
                className={styles.mobileSearchGoBtn}
                onClick={() => { handleSearch(); setMobileSearchOpen(false); }}
              >
                {locale === 'ar' ? `بحث عن "${query}"` : `Search for "${query}"`}
              </button>
            )}
          </div>

          {/* Big Search Button */}
          {query && (
            <div className={styles.mobileSearchFooter}>
              <button
                className={styles.mobileSearchSubmit}
                onClick={() => { handleSearch(); setMobileSearchOpen(false); }}
              >
                🔍 {locale === 'ar' ? 'بحث' : 'Search'}
              </button>
            </div>
          )}
        </div>


        {/* ═══════════════════════════════════════════
            TOP TEACHERS — 2 rows, premium cards
        ═══════════════════════════════════════════ */}
        <section className={styles.teachersSection}>
          <div className="container">

            {/* ── Social Proof Stats Bar ── */}
            <div className={styles.statsBar}>
              {[
                { icon: '👨‍🏫', num: locale === 'ar' ? '+500' : '500+', label: locale === 'ar' ? 'معلم موثوق' : 'Verified Tutors' },
                { icon: '🎓', num: locale === 'ar' ? '+2,000' : '2,000+', label: locale === 'ar' ? 'طالب نشط' : 'Active Students' },
                { icon: '📚', num: locale === 'ar' ? '+10K' : '10K+', label: locale === 'ar' ? 'حصة مكتملة' : 'Lessons Done' },
                { icon: '⭐', num: '4.9', label: locale === 'ar' ? 'متوسط التقييم' : 'Avg. Rating' },
              ].map((stat, i) => (
                <div key={i} className={styles.statsBarItem}>
                  <span className={styles.statsBarIcon}>{stat.icon}</span>
                  <span className={styles.statsBarNum}>{stat.num}</span>
                  <span className={styles.statsBarLabel}>{stat.label}</span>
                  {i < 3 && <span className={styles.statsBarDivider} />}
                </div>
              ))}
            </div>

            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>{locale === 'ar' ? '🏆 أفضل المعلمين' : '🏆 Top Tutors'}</h2>
                <p className={styles.sectionSubtitle}>{locale === 'ar' ? 'معلمون موثوقون ومُقيّمون بعناية' : 'Carefully vetted and highly rated tutors'}</p>
              </div>
              <Link href="/search" className="btn btn-outline btn-sm">{locale === 'ar' ? 'كل المعلمين →' : 'All Tutors →'}</Link>
            </div>

            {/* 2-row grid */}
            <div className={styles.teachersGrid}>
              {tutors.length > 0
                ? tutors.slice(0, 8).map((tutor: Record<string, unknown>) => {
                    const user = tutor.user as Record<string, unknown>;
                    const isVerified = tutor.verification_status === 'verified';
                    const gradients = [
                      'linear-gradient(135deg,#667eea,#764ba2)',
                      'linear-gradient(135deg,#f093fb,#f5576c)',
                      'linear-gradient(135deg,#4facfe,#00f2fe)',
                      'linear-gradient(135deg,#43e97b,#38f9d7)',
                      'linear-gradient(135deg,#fa709a,#fee140)',
                      'linear-gradient(135deg,#a18cd1,#fbc2eb)',
                      'linear-gradient(135deg,#ffecd2,#fcb69f)',
                      'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
                    ];
                    const imageSrc = tutorImgSrc(tutor, user?.name as string);
                    
                    const tutorSlug = tutor.slug as string;
                    const faved = isFavorite(tutorSlug);
                    return (
                      <Link key={tutor.id as number} href={`/tutor/${tutor.slug}`} className={styles.teacherCard}>
                        {/* ── Big Cover Image ── */}
                        <div className={styles.teacherImageWrap}>
                          <img 
                            src={imageSrc} 
                            alt={user?.name as string || 'Tutor Avatar'} 
                            className={styles.teacherCoverImage}
                          />
                          <button
                            className={styles.favoriteBadgeOverlay}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFavorite(tutorSlug, (user?.name as string) || '', e); }}
                            aria-label={faved ? 'Remove from favorites' : 'Add to favorites'}
                            title={faved ? (locale === 'ar' ? 'إزالة من المفضلة' : 'Remove from favorites') : (locale === 'ar' ? 'إضافة للمفضلة' : 'Save to favorites')}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill={faved ? '#ef4444' : 'none'} stroke={faved ? '#ef4444' : '#555'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'fill 0.2s, stroke 0.2s, transform 0.15s', transform: faved ? 'scale(1.15)' : 'scale(1)' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                          </button>
                          <div className={styles.teacherRatingOverlay}>
                            <span className={styles.ratingStars}>★</span>
                            <span className={styles.ratingNum}>{tutor.avg_rating as string}</span>
                            <span className={styles.ratingCount}>({tutor.total_reviews as number})</span>
                          </div>
                        </div>

                        {/* ── Content Below Image ── */}
                        <div className={styles.teacherContentWrap}>
                          <div className={styles.teacherNameWrap}>
                            <span className={styles.teacherName}>{user?.name as string}</span>
                            {isVerified && <VerifiedBadge size={16} />}
                          </div>
                          <div className={styles.teacherHeadline}>
                            {locale === 'ar' ? tutor.headline_ar as string : tutor.headline_en as string}
                          </div>

                        <div className={styles.teacherSubjects}>
                          {((tutor.subjects as Record<string, unknown>[]) || []).slice(0, 3).map((s: Record<string, unknown>) => (
                            <span key={s.id as number} className={styles.teacherSubjectTag}>
                              {locale === 'ar' ? s.name_ar as string : s.name_en as string}
                            </span>
                          ))}
                        </div>

                        <div className={styles.teacherCardFooter}>
                          <div className={styles.teacherPrice}>
                            <span className={styles.teacherPriceNum}>{tutor.hourly_rate as string}</span>
                            <span className={styles.teacherPriceUnit}> {locale === 'ar' ? 'ج.م/ساعة' : 'EGP/hr'}</span>
                          </div>
                          <div className={styles.teacherMeta}>
                            {!!tutor.is_first_lesson_free && (
                              <span className={styles.freeTag}>🎁 {locale === 'ar' ? 'أول ساعة مجانية' : '1st hr free'}</span>
                            )}
                          </div>
                        </div>
                        </div>
                      </Link>
                    );
                  })
                : Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className={`${styles.teacherCard} ${styles.skeletonCard}`}>
                      <div className={styles.teacherCardTop}>
                        <div className={`skeleton ${styles.skeletonAvatar}`} />
                        <div style={{ flex: 1 }}>
                          <div className="skeleton skeleton-title" />
                          <div className="skeleton skeleton-text" style={{ marginTop: 8 }} />
                        </div>
                      </div>
                      <div className="skeleton skeleton-text" style={{ margin: '12px 0' }} />
                      <div className="skeleton" style={{ height: 36, borderRadius: 8 }} />
                    </div>
                  ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            GROUP SESSIONS — Immersive showcase
        ═══════════════════════════════════════════ */}
        <section className={styles.groupSection}>
          {/* Header */}
          <div className={styles.groupHeader}>
            <div className={styles.groupHeaderLeft}>
              <span className={styles.groupSectionBadge}>
                ✨ {locale === 'ar' ? 'جديد على المنصة' : 'New on AlemnyPro'}
              </span>
              <h2 className={styles.groupSectionTitle}>
                {locale === 'ar'
                  ? <><span className={styles.groupGradText}>جلسات المجموعات</span><br />تعلّم أفضل، بسعر أقل</>  
                  : <><span className={styles.groupGradText}>Group Sessions</span><br />Learn smarter, spend less</>}
              </h2>
              <p className={styles.groupSectionDesc}>
                {locale === 'ar'
                  ? 'انضم إلى مجموعة صغيرة واحصل على نفس جودة التعليم الخاص بتكلفة أقل بـ ٥٠٪. مبلغك محفوظ بالكامل حتى تكتمل الجلسة.'
                  : 'Join a small group and get the same private-tutor quality for up to 50% less. Your payment is held securely until the session is confirmed.'}
              </p>
              {/* Value props */}
              <div className={styles.groupValueChips}>
                {[
                  { icon: '💰', ar: 'وفّر حتى ٥٠٪', en: 'Save up to 50%' },
                  { icon: '🔒', ar: 'دفع مضمون', en: 'Escrow Protected' },
                  { icon: '👥', ar: 'مجموعات صغيرة', en: 'Small Groups' },
                ].map((c, i) => (
                  <span key={i} className={styles.groupValueChip}>
                    <span>{c.icon}</span> {locale === 'ar' ? c.ar : c.en}
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.groupHeaderRight}>
              <Link href="/group-sessions" className={styles.groupCta}>
                {locale === 'ar' ? 'استكشف الكل' : 'Explore All'}
                <span className={styles.groupCtaArrow}>→</span>
              </Link>
            </div>
          </div>

          {/* Carousel with controls */}
          <div className={styles.groupCarouselWrap}>
            <button className={`${styles.groupNavBtn} ${styles.groupNavPrev}`} onClick={() => {
              const el = document.getElementById('groupCarouselTrack');
              if (el) el.scrollBy({ left: -320, behavior: 'smooth' });
            }} aria-label="Previous">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div className={styles.groupCarousel}>
              <div id="groupCarouselTrack" className={styles.groupCarouselTrack}>
                {[
                  {
                    image: '/images/group-math.png',
                    titleAr: 'مراجعة ليلة الامتحان — رياضيات',
                    titleEn: 'Math Final Exam Revision',
                    tagAr: 'ثانوية عامة',
                    tagEn: 'Thanaweya Amma',
                    tutorAr: 'أ. أحمد محمد',
                    tutorEn: 'Ahmed M.',
                    seats: 6, max: 8, price: 80,
                    status: 'confirmed',
                  },
                  {
                    image: '/images/group-english.png',
                    titleAr: 'ورشة IELTS — Writing Task 2',
                    titleEn: 'IELTS Workshop — Writing Task 2',
                    tagAr: 'لغة إنجليزية',
                    tagEn: 'English',
                    tutorAr: 'أ. سارة إبراهيم',
                    tutorEn: 'Sara I.',
                    seats: 5, max: 6, price: 120,
                    status: 'confirmed',
                  },
                  {
                    image: '/images/group-python.png',
                    titleAr: 'بناء مشروعك الأول بـ Python',
                    titleEn: 'Build Your First Python Project',
                    tagAr: 'برمجة — مبتدئ',
                    tagEn: 'Programming — Beginner',
                    tutorAr: 'م. محمد علي',
                    tutorEn: 'Mohamed A.',
                    seats: 2, max: 6, price: 200,
                    status: 'open',
                  },
                  {
                    image: '/images/group-chemistry.png',
                    titleAr: 'مراجعة كيمياء مكثفة',
                    titleEn: 'Intensive Chemistry Revision',
                    tagAr: 'كيمياء — ث.ع',
                    tagEn: 'Chemistry — Thanaweya',
                    tutorAr: 'د. نورا خالد',
                    tutorEn: 'Dr. Noura K.',
                    seats: 4, max: 10, price: 90,
                    status: 'open',
                  },
                  {
                    image: '/images/group-physics.png',
                    titleAr: 'فيزياء شهرية — ثانوي',
                    titleEn: 'Monthly Physics Group',
                    tagAr: 'فيزياء — شهري',
                    tagEn: 'Physics — Monthly',
                    tutorAr: 'أ. أحمد محمد',
                    tutorEn: 'Ahmed M.',
                    seats: 3, max: 10, price: 350,
                    status: 'open',
                  },
                ].map((card, i) => {
                  const pct = Math.round((card.seats / card.max) * 100);
                  const seatsLeft = card.max - card.seats;
                  return (
                    <Link href="/group-sessions" key={i} className={styles.groupSlide}>
                      {/* Background image */}
                      <img src={card.image} alt="" className={styles.groupSlideImage} />
                      {/* Gradient overlay */}
                      <div className={styles.groupSlideOverlay} />

                      {/* Top badges */}
                      <div className={styles.groupSlideTop}>
                        <span className={styles.groupSlideTag}>
                          {locale === 'ar' ? card.tagAr : card.tagEn}
                        </span>
                      </div>
                      <div className={styles.groupSlideBottom}>
                        <h3 className={styles.groupSlideTitle}>
                          {locale === 'ar' ? card.titleAr : card.titleEn}
                        </h3>
                        <div className={styles.groupSlideTutor}>
                          <div className={styles.groupSlideTutorAvatar} />
                          <span>{locale === 'ar' ? card.tutorAr : card.tutorEn}</span>
                        </div>

                        {/* Progress bar */}
                        <div className={styles.groupSlideProgress}>
                          <div className={styles.groupProgressBar}>
                            <div className={styles.groupProgressFill} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={styles.groupProgressLabel}>
                            {card.seats}/{card.max}
                          </span>
                        </div>

                        {/* Price & CTA */}
                        <div className={styles.groupSlideFooter}>
                          <div className={styles.groupSlidePrice}>
                            <span className={styles.groupPriceNum}>{card.price}</span>
                            <span className={styles.groupPriceCurrency}>{locale === 'ar' ? 'ج.م' : 'EGP'}</span>
                          </div>
                          <span className={styles.groupSlideCta}>
                            {locale === 'ar' ? 'احجز الآن' : 'Book Now'} →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
            <button className={`${styles.groupNavBtn} ${styles.groupNavNext}`} onClick={() => {
              const el = document.getElementById('groupCarouselTrack');
              if (el) el.scrollBy({ left: 320, behavior: 'smooth' });
            }} aria-label="Next">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </section>


        {/* ═══════════════════════════════════════════
            TESTIMONIALS
        ═══════════════════════════════════════════ */}
        <TestimonialsGrid />

        {/* ═══════════════════════════════════════════
            HOW IT WORKS
        ═══════════════════════════════════════════ */}
        <section className={styles.howSection}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
              <h2 className={styles.sectionTitle}>{locale === 'ar' ? 'كيف يعمل AlemnyPro؟' : 'How does AlemnyPro work?'}</h2>
              <p className={styles.sectionSubtitle}>{locale === 'ar' ? '٣ خطوات فقط للبدء في رحلة التعلم' : 'Just 3 steps to start your learning journey'}</p>
            </div>
            <div className={styles.howGrid}>
              {[
                { num: '01', icon: '🔍', ar: { t: 'ابحث عن معلمك', d: 'استخدم الفلاتر للعثور على المعلم المثالي حسب المادة والمرحلة والسعر' }, en: { t: 'Search for Your Tutor', d: 'Use filters to find the perfect tutor by subject, level, and price' } },
                { num: '02', icon: '📅', ar: { t: 'احجز درسك الأول', d: 'اختر وقتاً مناسباً واحجز مجاناً — الدرس الأول مجاني مع معظم المعلمين' }, en: { t: 'Book Your First Lesson', d: 'Pick a convenient time and book for free — first lesson is free with most tutors' } },
                { num: '03', icon: '🚀', ar: { t: 'ابدأ التعلم', d: 'تعلم مع معلمك أونلاين أو حضورياً وحقق أهدافك الدراسية' }, en: { t: 'Start Learning', d: 'Learn with your tutor online or in-person and achieve your academic goals' } },
              ].map((step, i) => (
                <div key={i} className={styles.howCard}>
                  <div className={styles.howNum}>{step.num}</div>
                  <div className={styles.howIcon}>{step.icon}</div>
                  <h3 className={styles.howTitle}>{locale === 'ar' ? step.ar.t : step.en.t}</h3>
                  <p className={styles.howDesc}>{locale === 'ar' ? step.ar.d : step.en.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            WHY ALEMNYPRO — Comparison Table
        ═══════════════════════════════════════════ */}
        <section className={styles.whySection}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
              <span className={styles.whyBadge}>
                {locale === 'ar' ? '🏆 لماذا AlemnyPro؟' : '🏆 Why AlemnyPro?'}
              </span>
              <h2 className={styles.whyTitle}>
                {locale === 'ar'
                  ? <>الفرق واضح <span className={styles.whyGrad}>من أول نظرة</span></>
                  : <>The difference is <span className={styles.whyGrad}>clear from day one</span></>}
              </h2>
              <p className={styles.whySubtitle}>
                {locale === 'ar'
                  ? 'مش بس دروس خصوصية — دا نظام متكامل لضمان نتيجتك'
                  : 'Not just tutoring — a full system designed to guarantee your results'}
              </p>
            </div>

            <div className={styles.whyTable}>
              {/* Header Row */}
              <div className={styles.whyHeader}>
                <div className={styles.whyHeaderFeature} />
                <div className={styles.whyHeaderCol}>
                  {locale === 'ar' ? 'معلم خصوصي عادي' : 'Private Tutor'}
                  <span className={styles.whyHeaderSubtitle}>{locale === 'ar' ? '(فيسبوك / واتساب)' : '(Facebook / WhatsApp)'}</span>
                </div>
                <div className={`${styles.whyHeaderCol} ${styles.whyHeaderColMain}`}>
                  <span className={styles.whyHeaderLogo}>AlemnyPro</span>
                  <span className={styles.whyHeaderBadge}>{locale === 'ar' ? '✨ الأفضل' : '✨ Best'}</span>
                </div>
              </div>

              {/* Comparison Rows */}
              {[
                {
                  ar: 'معلمون موثوقون ومراجَعون',
                  en: 'Verified & reviewed tutors',
                  them: false, us: true,
                },
                {
                  ar: 'دفع مضمون — مالك محفوظ',
                  en: 'Secure escrow payment',
                  them: false, us: true,
                },
                {
                  ar: 'تقييمات حقيقية من طلاب',
                  en: 'Real student ratings & reviews',
                  them: false, us: true,
                },
                {
                  ar: 'أول حصة مجانية مضمونة',
                  en: 'First lesson free guarantee',
                  them: false, us: true,
                },
                {
                  ar: 'إلغاء وإعادة جدولة مرن',
                  en: 'Easy cancellation & rescheduling',
                  them: false, us: true,
                },
                {
                  ar: 'دعم عملاء 7/7',
                  en: '7/7 customer support',
                  them: false, us: true,
                },
                {
                  ar: 'جلسات جماعية بسعر أقل',
                  en: 'Group sessions at lower cost',
                  them: false, us: true,
                },
              ].map((row, i) => (
                <div key={i} className={`${styles.whyRow} ${i % 2 === 0 ? styles.whyRowAlt : ''}`}>
                  <div className={styles.whyRowFeature}>
                    {locale === 'ar' ? row.ar : row.en}
                  </div>
                  <div className={styles.whyRowCell}>
                    {row.them
                      ? <span className={styles.whyCheck}>✓</span>
                      : <span className={styles.whyCross}>✗</span>}
                  </div>
                  <div className={`${styles.whyRowCell} ${styles.whyRowCellMain}`}>
                    {row.us
                      ? <span className={styles.whyCheck}>✓</span>
                      : <span className={styles.whyCross}>✗</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            CTA BANNER
        ═══════════════════════════════════════════ */}
        <section className={styles.ctaSection}>
          <div className="container" style={{ textAlign: 'center' }}>
            <h2 className={styles.ctaTitle}>
              {locale === 'ar' ? 'ابدأ رحلتك التعليمية الآن 🚀' : 'Start Your Learning Journey Now 🚀'}
            </h2>
            <p className={styles.ctaSubtitle}>
              {locale === 'ar'
                ? 'انضم لأكثر من ٢٠٠٠ طالب يتعلمون مع أفضل المعلمين في مصر'
                : 'Join over 2,000 students learning with the best tutors in Egypt'}
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/search" className="btn btn-primary btn-lg">{locale === 'ar' ? '🔍 ابحث عن معلم' : '🔍 Find a Tutor'}</Link>
              <Link href="/become-a-tutor" className="btn btn-white btn-lg">{locale === 'ar' ? '🎓 انضم كمعلم' : '🎓 Become a Tutor'}</Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
