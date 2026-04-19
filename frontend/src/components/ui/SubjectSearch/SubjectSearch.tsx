'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { publicApi } from '@/lib/api';
import styles from './SubjectSearch.module.css';

interface SubjectResult {
  id: number;
  name_en: string;
  name_ar: string;
  slug: string;
  icon: string;
  tutor_count: number;
  synonyms: string[];
}

interface CategoryGroup {
  category_name_en: string;
  category_name_ar: string;
  category_slug: string;
  subjects: SubjectResult[];
}

interface SubjectSearchProps {
  onSelect: (subject: SubjectResult) => void;
  selectedIds: number[];
  locale: 'ar' | 'en';
  maxSelected?: number;
}

const POPULAR_SUBJECTS = [
  { id: 0, name_en: 'Mathematics (الرياضيات)', name_ar: 'الرياضيات', icon: '➗', slug: 'mathematics' },
  { id: 0, name_en: 'Physics (الفيزياء)',       name_ar: 'الفيزياء',  icon: '⚡', slug: 'physics' },
  { id: 0, name_en: 'English — General',         name_ar: 'الإنجليزية', icon: '🇬🇧', slug: 'english-general' },
  { id: 0, name_en: 'IGCSE Math',               name_ar: 'IGCSE رياضيات', icon: '📐', slug: 'igcse-math' },
  { id: 0, name_en: 'IELTS Preparation',        name_ar: 'تحضير IELTS', icon: '🎓', slug: 'ielts-preparation' },
  { id: 0, name_en: 'Python & AI',              name_ar: 'Python والذكاء الاصطناعي', icon: '🐍', slug: 'python-ai' },
  { id: 0, name_en: 'Chemistry (الكيمياء)',     name_ar: 'الكيمياء',  icon: '🧪', slug: 'chemistry' },
  { id: 0, name_en: 'Web Development',          name_ar: 'تطوير الويب', icon: '🌐', slug: 'web-development' },
];

export default function SubjectSearch({ onSelect, selectedIds, locale, maxSelected = 4 }: SubjectSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CategoryGroup[]>([]);
  const [popularSubjects, setPopularSubjects] = useState<SubjectResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isAr = locale === 'ar';

  // Load popular on mount
  useEffect(() => {
    publicApi.searchSubjects('').then(res => {
      const groups: CategoryGroup[] = res.data?.data || [];
      const all: SubjectResult[] = groups.flatMap(g => g.subjects);
      setPopularSubjects(all.slice(0, 8));
    }).catch(() => setPopularSubjects(POPULAR_SUBJECTS as SubjectResult[]));
  }, []);

  const search = useCallback((q: string) => {
    clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResults([]);
      setIsOpen(q.length > 0);
      setShowRequest(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await publicApi.searchSubjects(q.trim());
        const groups: CategoryGroup[] = res.data?.data || [];
        setResults(groups);
        setIsOpen(true);
        setShowRequest(groups.flatMap(g => g.subjects).length === 0);
      } catch {
        setResults([]);
        setShowRequest(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);
    search(val);
  };

  const handleSelect = (subject: SubjectResult) => {
    if (!selectedIds.includes(subject.id) && selectedIds.length < maxSelected) {
      onSelect(subject);
    }
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Keyboard nav
  const allResults = results.flatMap(g => g.subjects);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, allResults.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)); }
    if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); handleSelect(allResults[activeIndex]); }
    if (e.key === 'Escape') setIsOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong className={styles.highlight}>{text.slice(idx, idx + q.length)}</strong>
        {text.slice(idx + q.length)}
      </>
    );
  };

  let flatIndex = -1;

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      {/* Search Input */}
      <div className={`${styles.searchBar} ${isOpen ? styles.searchBarOpen : ''}`}>
        <span className={styles.searchIcon}>
          {loading ? <span className={styles.spinner} /> : '🔍'}
        </span>
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (query.length >= 2) setIsOpen(true); }}
          placeholder={isAr ? "ابحث عن المادة... مثال: 'رياضيات'" : "Try 'Math', 'Physics', 'IELTS'..."}
          autoComplete="off"
          id="subject-search-input"
        />
        {query && (
          <button className={styles.clearBtn} onClick={() => { setQuery(''); setIsOpen(false); }}>✕</button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={styles.dropdown}>
          {results.length > 0 ? (
            results.map(group => (
              <div key={group.category_slug} className={styles.group}>
                <div className={styles.groupHeader}>
                  {isAr ? group.category_name_ar : group.category_name_en}
                </div>
                {group.subjects.map(subject => {
                  flatIndex++;
                  const fi = flatIndex;
                  const isSelected = selectedIds.includes(subject.id);
                  const isActive = fi === activeIndex;
                  return (
                    <button
                      key={subject.id}
                      className={`${styles.resultRow} ${isSelected ? styles.resultSelected : ''} ${isActive ? styles.resultActive : ''}`}
                      onClick={() => handleSelect(subject)}
                      disabled={isSelected || selectedIds.length >= maxSelected}
                    >
                      <span className={styles.subjectIcon}>{subject.icon}</span>
                      <span className={styles.subjectName}>
                        {isAr
                          ? highlightMatch(subject.name_ar, query)
                          : highlightMatch(subject.name_en, query)}
                      </span>
                      {subject.tutor_count > 0 && (
                        <span className={styles.tutorCount}>{subject.tutor_count} tutors</span>
                      )}
                      {isSelected && <span className={styles.checkmark}>✓</span>}
                    </button>
                  );
                })}
              </div>
            ))
          ) : (
            <div className={styles.noResults}>
              <span>😕</span>
              <p>{isAr ? 'لا توجد نتائج' : 'No subjects found'}</p>
            </div>
          )}

          {/* Can't find? */}
          {showRequest && !requestSent && (
            <div className={styles.requestSection}>
              <p className={styles.requestLabel}>
                {isAr ? '💡 هل تدرّس مادة غير موجودة؟' : "💡 Can't find your subject?"}
              </p>
              {!showRequest ? null : (
                <div className={styles.requestForm}>
                  <input
                    type="text"
                    className={styles.requestInput}
                    value={requestName}
                    onChange={e => setRequestName(e.target.value)}
                    placeholder={isAr ? 'اكتب اسم المادة...' : 'Type the subject name...'}
                  />
                  <button
                    className={styles.requestBtn}
                    onClick={async () => {
                      if (requestName.trim().length < 2) return;
                      try {
                        const { tutorApi } = await import('@/lib/api');
                        await tutorApi.requestSubject({ subject_name: requestName.trim() });
                        setRequestSent(true);
                      } catch { /* handled */ }
                    }}
                  >
                    {isAr ? 'طلب إضافة' : 'Request Addition'}
                  </button>
                </div>
              )}
            </div>
          )}
          {requestSent && (
            <div className={styles.requestSuccess}>
              ✅ {isAr ? 'تم إرسال الطلب! سيراجعه فريقنا خلال 48 ساعة.' : 'Request sent! Our team will review it within 48 hours.'}
            </div>
          )}
        </div>
      )}

      {/* Popular Subjects (when no search) */}
      {!isOpen && (
        <div className={styles.popular}>
          <div className={styles.popularLabel}>
            {isAr ? '📌 أكثر المواد طلباً' : 'MOST TAUGHT SUBJECTS'}
          </div>
          <div className={styles.popularList}>
            {popularSubjects.map((subject, i) => {
              const isSelected = selectedIds.includes(subject.id);
              return (
                <button
                  key={subject.id || i}
                  className={`${styles.popularRow} ${isSelected ? styles.popularRowSelected : ''}`}
                  onClick={() => handleSelect(subject)}
                  disabled={isSelected || selectedIds.length >= maxSelected}
                >
                  <span className={styles.popularIcon}>{subject.icon}</span>
                  <span className={styles.popularName}>
                    {isAr ? subject.name_ar : subject.name_en}
                  </span>
                  <span className={styles.chevron}>{isSelected ? '✓' : '›'}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
