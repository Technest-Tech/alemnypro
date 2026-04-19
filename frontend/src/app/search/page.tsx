'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { publicApi } from '@/lib/api';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import styles from './search.module.css';
import { useFavorites } from '@/lib/useFavorites';
import { useAuthModal } from '@/lib/AuthModalContext';
import { tutorImgSrc } from '@/lib/tutorImage';

// ─── Static data ──────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<string, { ar: string; en: string }> = {
  children:      { ar: 'أطفال',                  en: 'Children'            },
  primary:       { ar: 'ابتدائي (١-٦)',           en: 'Primary (Gr. 1-6)'   },
  preparatory:   { ar: 'إعدادي (٧-٩)',            en: 'Preparatory (Gr. 7-9)' },
  secondary_1:   { ar: 'أولى ثانوي',              en: 'Secondary Yr. 1'     },
  secondary_2:   { ar: 'ثانية ثانوي',             en: 'Secondary Yr. 2'     },
  secondary_3:   { ar: 'ثالثة ثانوي (ثانوية عامة)', en: 'Secondary Yr. 3 (Thanaweyya)' },
  igcse_ol:      { ar: 'IGCSE O-Level',           en: 'IGCSE O-Level'       },
  igcse_al:      { ar: 'IGCSE A-Level',           en: 'IGCSE A-Level'       },
  ib:            { ar: 'IB',                      en: 'IB'                  },
  university:    { ar: 'جامعي',                   en: 'University'          },
  postgraduate:  { ar: 'دراسات عليا',             en: 'Postgraduate'        },
  beginner:      { ar: 'مبتدئ',                   en: 'Beginner'            },
  intermediate:  { ar: 'متوسط',                   en: 'Intermediate'        },
  advanced:      { ar: 'متقدم',                   en: 'Advanced'            },
  professional:  { ar: 'محترف',                   en: 'Professional'        },
  adults:        { ar: 'بالغون',                  en: 'Adults'              },
};

const FORMATS = [
  { val: '', ar: 'أونلاين وحضوري', en: 'Online & In-Person' },
  { val: 'online',    ar: 'أونلاين فقط',  en: 'Online Only'    },
  { val: 'in_person', ar: 'حضوري فقط',   en: 'In-Person Only' },
];

const PRICE_RANGES = [
  { val: '',        ar: 'كل الأسعار',     en: 'All Prices'    },
  { val: '0-100',   ar: 'أقل من ١٠٠ ج.م', en: 'Under 100 EGP' },
  { val: '100-200', ar: '١٠٠ — ٢٠٠ ج.م', en: '100 — 200 EGP' },
  { val: '200-350', ar: '٢٠٠ — ٣٥٠ ج.م', en: '200 — 350 EGP' },
  { val: '350+',    ar: 'أكثر من ٣٥٠ ج.م', en: '350+ EGP'     },
];

const SORT_OPTIONS = [
  { val: 'top_rated',    ar: 'الأعلى تقييماً',  en: 'Top Rated'    },
  { val: 'lowest_price', ar: 'الأرخص أولاً',   en: 'Lowest Price'  },
  { val: 'most_reviews', ar: 'الأكثر تقييماً', en: 'Most Reviews'  },
  { val: 'newest',       ar: 'الأحدث',          en: 'Newest'        },
];



// ─── Types ────────────────────────────────────────────────────────────────────
interface SubjectItem { id: number; name_ar: string; name_en: string; slug: string; icon?: string; levels?: string[] }
interface SubjectCat  { id: number; name_ar: string; name_en: string; slug: string; icon?: string; subjects: SubjectItem[] }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Determine tutor's tier based on real performance data */
function getTutorLevel(tutor: Record<string, unknown>) {
  const rating  = Number(tutor.avg_rating)    || 0;
  const reviews = Number(tutor.total_reviews) || 0;
  const students = Number(tutor.total_students) || 0;
  if (rating >= 4.9 && reviews >= 80 && students >= 60) return { label: { ar: 'سفير', en: 'Ambassador' }, icon: '✦', color: '#fff', bg: 'linear-gradient(135deg,#6366f1,#818cf8)' };
  if (rating >= 4.7 && reviews >= 40 && students >= 30) return { label: { ar: 'بريميوم', en: 'Premium' }, icon: '★', color: '#fff', bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)' };
  if (rating >= 4.5 && reviews >= 15) return { label: { ar: 'نجم', en: 'Star' }, icon: '◆', color: '#fff', bg: 'linear-gradient(135deg,#10b981,#34d399)' };
  if (reviews >= 5 || students >= 3)  return { label: { ar: 'صاعد', en: 'Rising' }, icon: '▲', color: '#fff', bg: 'linear-gradient(135deg,#3b82f6,#60a5fa)' };
  return { label: { ar: 'جديد', en: 'New' }, icon: '●', color: '#374151', bg: '#f3f4f6' };
}

// ─── Subject Search Autocomplete ──────────────────────────────────────────────
// Self-contained: local search term, dropdown open/close, outside-click.
// Only calls `onSelect(slug)` when user clicks a result.
function SubjectSearch({
  categories,
  catsLoading,
  selectedSlug,
  onSelect,
  onClear,
}: {
  categories: SubjectCat[];
  catsLoading: boolean;
  selectedSlug: string;
  onSelect: (slug: string) => void;
  onClear: () => void;
}) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Outside-click → close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Build flat subject list once
  const allSubjects = useMemo(() => {
    const list: { ar: string; en: string; icon?: string; catIcon?: string; slug: string }[] = [];
    categories.forEach(cat =>
      cat.subjects.forEach(s =>
        list.push({ ar: s.name_ar, en: s.name_en, icon: s.icon, catIcon: cat.icon, slug: s.slug })
      )
    );
    return list;
  }, [categories]);

  // Filter suggestions: if no search term → first 5, otherwise filter live
  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return allSubjects.slice(0, 5);
    const lower = searchTerm.toLowerCase();
    return allSubjects.filter(s =>
      s.ar.includes(searchTerm) || s.en.toLowerCase().includes(lower)
    ).slice(0, 8);
  }, [allSubjects, searchTerm]);

  // Find currently selected subject for the chip
  const selectedSubject = useMemo(() =>
    allSubjects.find(s => s.slug === selectedSlug) || null,
    [allSubjects, selectedSlug]
  );

  const handleSelect = (slug: string, name: string) => {
    onSelect(slug);
    setSearchTerm('');
    setOpen(false);
  };

  const handleClear = () => {
    onClear();
    setSearchTerm('');
    setOpen(false);
  };

  const handleFocus = () => {
    setOpen(true);
  };

  const handleInputChange = (val: string) => {
    setSearchTerm(val);
    if (!open) setOpen(true);
  };

  return (
    <div className={styles.searchWrap} ref={wrapRef}>
      <div className={styles.searchInputInner}>
        <span className={styles.searchIcon}>🔍</span>

        {selectedSlug && selectedSubject ? (
          /* Selected state: show name as value, allow re-search */
          <>
            <input
              ref={inputRef}
              className={`${styles.searchInput} ${styles.searchInputSelected}`}
              value={searchTerm || (isAr ? selectedSubject.ar : selectedSubject.en)}
              onChange={e => {
                handleInputChange(e.target.value);
                // If user starts typing, clear the selection so they can pick a new one
                if (selectedSlug) onClear();
              }}
              onFocus={() => {
                setSearchTerm('');
                setOpen(true);
              }}
              placeholder={isAr ? 'ابحث عن مادة...' : 'Search a subject...'}
            />
            <button
              className={styles.clearSearchBtn}
              onMouseDown={e => e.preventDefault()}
              onClick={handleClear}
              aria-label="Clear subject"
            >×</button>
          </>
        ) : (
          /* Empty state: normal search */
          <>
            <input
              ref={inputRef}
              className={styles.searchInput}
              value={searchTerm}
              onChange={e => handleInputChange(e.target.value)}
              onFocus={handleFocus}
              placeholder={isAr ? 'ابحث عن مادة...' : 'Search a subject...'}
            />
            {searchTerm && (
              <button className={styles.clearSearchBtn} onClick={() => setSearchTerm('')}>×</button>
            )}
          </>
        )}
      </div>


      {/* Dropdown */}
      {open && (
        <div className={styles.searchDropdown}>
          {catsLoading ? (
            <>
              <div className={styles.dropdownTitle}>{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
              {[1,2,3,4,5].map(i => (
                <div key={i} className={styles.dropdownSkeletonItem}>
                  <div className={styles.dropdownSkeletonIcon} />
                  <div className={styles.dropdownSkeletonText} />
                </div>
              ))}
            </>
          ) : suggestions.length > 0 ? (
            <>
              <div className={styles.dropdownTitle}>
                {searchTerm
                  ? (isAr ? 'نتائج البحث' : 'Search Results')
                  : (isAr ? 'مواد مقترحة' : 'Suggested Subjects')}
              </div>
              {suggestions.map((s, i) => (
                <button
                  key={s.slug}
                  className={`${styles.dropdownItem} ${s.slug === selectedSlug ? styles.dropdownItemActive : ''}`}
                  onMouseDown={e => e.preventDefault() /* prevent blur before click */}
                  onClick={() => handleSelect(s.slug, isAr ? s.ar : s.en)}
                >
                  <span className={styles.dropdownIcon}>🔍</span>
                  <span className={styles.dropdownText}>{isAr ? s.ar : s.en}</span>
                  {s.slug === selectedSlug && <span className={styles.dropdownCheck}>✔</span>}
                </button>
              ))}
            </>
          ) : (
            <div className={styles.dropdownEmpty}>
              {isAr ? `لا توجد نتائج لـ "${searchTerm}"` : `No results for "${searchTerm}"`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Custom Select ────────────────────────────────────────────────────────────
function CustomSelect({
  options, value, onChange, icon, disabled = false,
}: {
  options: { val: string; ar: string; en: string }[];
  value: string;
  onChange: (val: string) => void;
  icon?: string;
  disabled?: boolean;
}) {
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const selected = options.find(o => o.val === value) || options[0];

  return (
    <div className={styles.customSelectWrap} ref={ref}>
      <div
        className={`${styles.customSelectTrigger} ${isOpen ? styles.customSelectTriggerOpen : ''} ${disabled ? styles.customSelectDisabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {icon && <span className={styles.customSelectIcon}>{icon}</span>}
        <span className={styles.customSelectVal}>{locale === 'ar' ? selected.ar : selected.en}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`${styles.customSelectChevron} ${isOpen ? styles.customSelectChevronOpen : ''}`}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
      {isOpen && !disabled && (
        <div className={styles.customSelectDropdown}>
          {options.map(opt => (
            <button
              key={opt.val}
              className={`${styles.customSelectOption} ${opt.val === value ? styles.customSelectOptionActive : ''}`}
              onClick={() => { onChange(opt.val); setIsOpen(false); }}
            >
              <span className={styles.customSelectOptionText}>{locale === 'ar' ? opt.ar : opt.en}</span>
              {opt.val === value && <span className={styles.customSelectCheck}>✔</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Level Picker ─────────────────────────────────────────────────────────────
function LevelPicker({
  levelOptions, level, onLevelChange, disabled,
}: {
  levelOptions: string[]; level: string; onLevelChange: (v: string) => void; disabled: boolean;
}) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const levelLabel = level
    ? (isAr ? LEVEL_LABELS[level]?.ar : LEVEL_LABELS[level]?.en) || level
    : (isAr ? 'كل المراحل' : 'All Levels');

  return (
    <div className={styles.customSelectWrap} ref={ref}>
      <div
        className={`${styles.customSelectTrigger} ${open ? styles.customSelectTriggerOpen : ''} ${level ? styles.customSelectActive : ''} ${disabled ? styles.customSelectDisabled : ''}`}
        onClick={() => !disabled && setOpen(v => !v)}
        title={disabled ? (isAr ? 'اختر مادة أولاً' : 'Select a subject first') : undefined}
      >
        <span className={styles.customSelectIcon}>🎓</span>
        <span className={styles.customSelectVal}>{levelLabel}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`${styles.customSelectChevron} ${open ? styles.customSelectChevronOpen : ''}`}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
      {open && !disabled && (
        <div className={styles.customSelectDropdown}>
          <button
            className={`${styles.customSelectOption} ${!level ? styles.customSelectOptionActive : ''}`}
            onClick={() => { onLevelChange(''); setOpen(false); }}
          >
            <span className={styles.customSelectOptionText}>{isAr ? 'كل المراحل' : 'All Levels'}</span>
            {!level && <span className={styles.customSelectCheck}>✔</span>}
          </button>
          {levelOptions.map(lv => {
            const labels = LEVEL_LABELS[lv];
            const label  = labels ? (isAr ? labels.ar : labels.en) : lv;
            return (
              <button key={lv}
                className={`${styles.customSelectOption} ${lv === level ? styles.customSelectOptionActive : ''}`}
                onClick={() => { onLevelChange(lv); setOpen(false); }}
              >
                <span className={styles.customSelectOptionText}>{label}</span>
                {lv === level && <span className={styles.customSelectCheck}>✔</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const { isFavorite, toggleFavorite } = useFavorites();
  const { openAuthModal } = useAuthModal();


  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('alemnypro_token'));
    const onAuth = () => setIsLoggedIn(!!localStorage.getItem('alemnypro_token'));
    window.addEventListener('alemnypro-auth-change', onAuth);
    return () => window.removeEventListener('alemnypro-auth-change', onAuth);
  }, []);

  const handleFavorite = useCallback((slug: string, tutorName = '', e?: React.MouseEvent) => {
    if (!isLoggedIn) {
      openAuthModal({ reason: 'favorite', onSuccess: () => toggleFavorite(slug, tutorName) });
    } else {
      toggleFavorite(slug, tutorName, e);
    }
  }, [isLoggedIn, openAuthModal, toggleFavorite]);

  // ── Filter state ─────────────────────────────────────────────────────────────
  // Initialize as '' on both SSR and client to avoid hydration mismatch.
  // URL params are applied in useEffect after mount (client-only).
  const [subject, setSubject] = useState('');
  const [level,   setLevel]   = useState('');
  const [format,  setFormat]  = useState('');
  const [price,   setPrice]   = useState('');
  const [sort,    setSort]    = useState('top_rated');

  // Apply URL params once after hydration
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('subject_slug')) setSubject(p.get('subject_slug')!);
    if (p.get('level'))        setLevel(p.get('level')!);
    if (p.get('format'))       setFormat(p.get('format')!);
    if (p.get('price'))        setPrice(p.get('price')!);
    if (p.get('sort'))         setSort(p.get('sort')!);
  }, []); // runs once on mount — safe, client-only


  // ── Categories from API ─────────────────────────────────────────────────────
  const { data: catsData, isLoading: catsLoading } = useQuery({
    queryKey: ['search-categories'],
    queryFn: () => publicApi.getSearchCategories().then(r => r.data.data as SubjectCat[]),
    staleTime: 600_000,
  });
  const categories: SubjectCat[] = catsData || [];

  // ── Sync URL (no Next.js router — no Suspense remounts) ─────────────────────
  useEffect(() => {
    const p = new URLSearchParams();
    if (subject)    p.set('subject_slug', subject);
    if (level)      p.set('level', level);
    if (format)     p.set('format', format);
    if (price)      p.set('price', price);
    if (sort && sort !== 'top_rated') p.set('sort', sort);
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `/search?${qs}` : '/search');
  }, [subject, level, format, price, sort]);

  // ── API params — subject slug only, no free-text q ──────────────────────────
  const params: Record<string, string> = {};
  if (subject)  params.subject = subject;
  if (level)    params.level   = level;
  if (format)   params.format  = format;
  if (price)    params.price   = price;
  const sortMap: Record<string, string> = {
    top_rated: 'rating', lowest_price: 'price_asc',
    highest_price: 'price_desc', most_reviews: 'reviews', newest: 'newest',
  };
  params.sort = sortMap[sort] || 'rating';

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['search-tutors-infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      publicApi.searchTutors({ ...params, page: pageParam as string }).then(r => r.data.data),
    getNextPageParam: (lastPage: any) =>
      lastPage.current_page < lastPage.last_page ? lastPage.current_page + 1 : undefined,
    initialPageParam: 1,
  });

  const tutors = data?.pages.flatMap(page => (page as any).data) || [];
  const total  = (data?.pages[0] as any)?.total || 0;

  // ── Derived: selected subject + its levels ──────────────────────────────────
  const selectedSubjectObj = useMemo(() => {
    if (!subject) return null;
    for (const cat of categories) {
      const found = cat.subjects.find(s => s.slug === subject);
      if (found) return found;
    }
    return null;
  }, [categories, subject]);

  const levelOptions: string[] = useMemo(
    () => selectedSubjectObj?.levels || [],
    [selectedSubjectObj],
  );

  const handleSubjectSelect = (slug: string) => {
    setSubject(slug);
    setLevel('');
  };

  const handleSubjectClear = () => {
    setSubject('');
    setLevel('');
  };

  const clearAll = () => { setSubject(''); setLevel(''); setFormat(''); setPrice(''); };
  const hasFilters = !!(subject || level || format || price);

  return (
    <>
      
      <div className={styles.page}>
        {/* ── Filter Bar ── */}
        <div className={styles.filterBar}>
          <div className="container">
            <div className={styles.filterRow}>

              {/* ── Subject Search (local autocomplete — no API on type) ── */}
              <SubjectSearch
                categories={categories}
                catsLoading={catsLoading}
                selectedSlug={subject}
                onSelect={handleSubjectSelect}
                onClear={handleSubjectClear}
              />

              {/* ── Level (disabled until subject picked) ── */}
              <LevelPicker
                levelOptions={levelOptions}
                level={level}
                onLevelChange={setLevel}
                disabled={!subject}
              />

              {/* ── Format ── */}
              <CustomSelect options={FORMATS} value={format} onChange={setFormat} icon="🖥️" />

              {/* ── Price ── */}
              <CustomSelect options={PRICE_RANGES} value={price} onChange={setPrice} icon="💰" />

              {/* ── Clear all ── */}
              {hasFilters && (
                <button className={styles.clearAllBtn} onClick={clearAll} title={isAr ? 'مسح الفلاتر' : 'Clear filters'}>
                  ✕ {isAr ? 'مسح' : 'Clear'}
                </button>
              )}

              <div className={styles.spacer} />

              {/* ── Sort ── */}
              <CustomSelect options={SORT_OPTIONS} value={sort} onChange={setSort} icon="⬆⬇" />
            </div>
          </div>
        </div>

        {/* ── Results ── */}
        <div className="container">
          <div className={styles.resultsHeader}>
            <h1 className={styles.resultsTitle}>
              {isLoading && !tutors.length
                ? (isAr ? 'جاري البحث...' : 'Searching...')
                : `${total.toLocaleString()} ${isAr ? 'معلم متاح' : 'tutors available'}${
                    selectedSubjectObj ? ` · ${isAr ? selectedSubjectObj.name_ar : selectedSubjectObj.name_en}` : ''
                  }${level ? ` · ${isAr ? LEVEL_LABELS[level]?.ar : LEVEL_LABELS[level]?.en}` : ''}`}
            </h1>
          </div>

          {isLoading && !tutors.length ? (
            <div className={styles.teachersGrid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`${styles.teacherCard} ${styles.skeletonCard}`}>
                  <div className={styles.teacherImageWrap}><div className="skeleton" style={{ width: '100%', height: '100%' }} /></div>
                  <div className={styles.teacherContentWrap}>
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-text" style={{ marginTop: 8 }} />
                    <div className="skeleton" style={{ height: 36, borderRadius: 8, marginTop: 12 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : tutors.length === 0 ? (
            <div className={styles.emptyState}>
              <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>🔍</span>
              <h2>{isAr ? 'لم يتم العثور على نتائج' : 'No tutors found'}</h2>
              <p>{isAr ? 'جرّب تغيير معايير البحث أو تصفح جميع المعلمين' : 'Try changing your search criteria or browse all tutors'}</p>
              <button className="btn btn-primary btn-md" style={{ marginTop: '1rem' }} onClick={clearAll}>
                {isAr ? 'مسح الفلاتر وعرض الكل' : 'Clear Filters & Show All'}
              </button>
            </div>
          ) : (
            <div className={styles.teachersGrid}>
              {tutors.map((tutor: Record<string, unknown>, idx: number) => {
                const user       = tutor.user as Record<string, unknown>;
                const isVerified = tutor.verification_status === 'verified';
                const imageSrc   = tutorImgSrc(user);
                const subjects   = (tutor.subjects as Record<string, unknown>[]) || [];
                const tutorSlug  = tutor.slug as string;
                const faved      = isFavorite(tutorSlug);
                const lvl        = getTutorLevel(tutor);

                return (
                  <Link key={tutor.id as number} href={`/tutor/${tutor.slug}`} className={styles.teacherCard}>
                    <div className={styles.teacherImageWrap}>
                      <img src={imageSrc} alt={user?.name as string || 'Tutor'} className={styles.teacherCoverImage} />

                      {/* Level badge — top left */}
                      <div className={styles.levelBadge} style={{ background: lvl.bg, color: lvl.color }}>
                        <span className={styles.levelBadgeIcon}>{lvl.icon}</span>
                        <span>{isAr ? lvl.label.ar : lvl.label.en}</span>
                      </div>

                      {/* Favourite button — top right */}
                      <button
                        className={styles.favoriteBadgeOverlay}
                        onClick={e => { e.preventDefault(); e.stopPropagation(); handleFavorite(tutorSlug, (user?.name as string) || '', e); }}
                        aria-label={faved ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={faved ? '#ef4444' : 'none'} stroke={faved ? '#ef4444' : '#555'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'fill 0.2s, stroke 0.2s, transform 0.15s', transform: faved ? 'scale(1.15)' : 'scale(1)' }}>
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>

                      {/* Rating overlay — bottom */}
                      <div className={styles.teacherRatingOverlay}>
                        <span className={styles.ratingStars}>★</span>
                        <span className={styles.ratingNum}>{Number(tutor.avg_rating) > 0 ? Number(tutor.avg_rating).toFixed(1) : '—'}</span>
                        <span className={styles.ratingCount}>({tutor.total_reviews as number})</span>
                      </div>
                    </div>

                    <div className={styles.teacherContentWrap}>
                      {/* Name row */}
                      <div className={styles.teacherNameWrap}>
                        <span className={styles.teacherName}>{user?.name as string}</span>
                        {isVerified && <VerifiedBadge size={16} />}
                      </div>

                      {/* Verification flag */}
                      <div className={isVerified ? styles.verifiedFlag : styles.unverifiedFlag}>
                        {isVerified ? (
                          <><svg width={11} height={11} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#16a34a"/><path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          {isAr ? 'هوية موثّقة' : 'Identity verified'}</>
                        ) : (
                          <><svg width={11} height={11} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#d97706" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="#d97706" strokeWidth="2" strokeLinecap="round"/></svg>
                          {isAr ? 'لم يتم التحقق بعد' : 'Not verified yet'}</>
                        )}
                      </div>

                      <div className={styles.teacherHeadline}>
                        {isAr ? tutor.headline_ar as string : tutor.headline_en as string}
                      </div>

                      <div className={styles.teacherSubjects}>
                        {subjects.slice(0, 3).map((s: Record<string, unknown>) => (
                          <span key={s.id as number} className={styles.teacherSubjectTag}>
                            {isAr ? s.name_ar as string : s.name_en as string}
                          </span>
                        ))}
                      </div>

                      <div className={styles.teacherCardFooter}>
                        <div className={styles.teacherPrice}>
                          <span className={styles.teacherPriceNum}>{Number(tutor.hourly_rate).toLocaleString()}</span>
                          <span className={styles.teacherPriceUnit}> {isAr ? 'ج.م/ساعة' : 'EGP/hr'}</span>
                        </div>
                        <div className={styles.teacherMeta}>
                          {!!tutor.is_first_lesson_free && (
                            <span className={styles.freeTag}>🎁 {isAr ? 'أول ساعة مجانية' : '1st hr free'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {hasNextPage && (
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                style={{ minWidth: 200, borderRadius: 12, padding: '0.875rem 2rem', fontWeight: 600, background: 'var(--bg-card)', border: '2px solid var(--border)', color: 'var(--text)', cursor: isFetchingNextPage ? 'default' : 'pointer', opacity: isFetchingNextPage ? 0.7 : 1 }}
              >
                {isFetchingNextPage ? (isAr ? 'جاري التحميل...' : 'Loading...') : (isAr ? 'عرض المزيد من المعلمين' : 'Load More Tutors')}
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
