'use client';

import { useState } from 'react';
import SubjectSearch from '@/components/ui/SubjectSearch/SubjectSearch';
import { onboardingApi } from '@/lib/api';
import styles from '../tutor-register.module.css';

interface SubjectResult {
  id: number;
  name_en: string;
  name_ar: string;
  slug: string;
  icon: string;
  tutor_count: number;
  synonyms: string[];
}

interface SelectedSubject extends SubjectResult {
  levels: string[];
  hourly_rate: string;
}

interface InitialSubject extends SubjectResult {
  levels: string[];
  hourly_rate: string;
}

interface Props {
  locale: 'ar' | 'en';
  onNext: () => void;
  onBack: () => void;
  initialSubjects?: InitialSubject[];
  isFirstStep?: boolean; // hides Back button when true
}

const LEVELS = [
  { id: 'primary',      ar: 'ابتدائي (1-6)',      en: 'Primary (1-6)' },
  { id: 'preparatory',  ar: 'إعدادي (7-9)',        en: 'Preparatory (7-9)' },
  { id: 'secondary',    ar: 'ثانوي (10-12)',       en: 'Secondary (10-12)' },
  { id: 'university',   ar: 'جامعي / أكاديمي',    en: 'University / Academic' },
  { id: 'adults',       ar: 'بالغون / محترفون',   en: 'Adults / Professionals' },
];

export default function Step1Subjects({ locale, onNext, onBack, initialSubjects, isFirstStep }: Props) {
  const [selected, setSelected] = useState<SelectedSubject[]>(() =>
    (initialSubjects ?? []).map(s => ({
      ...s,
      hourly_rate: String(s.hourly_rate ?? '150'),
      levels: s.levels ?? [],
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAr = locale === 'ar';
  const MAX = 4;

  const handleSelect = (subject: SubjectResult) => {
    if (selected.length >= MAX || selected.find(s => s.id === subject.id)) return;
    setSelected(prev => [...prev, { ...subject, levels: [], hourly_rate: '150' }]);
  };

  const handleRemove = (id: number) => {
    setSelected(prev => prev.filter(s => s.id !== id));
  };

  const toggleLevel = (subjectId: number, levelId: string) => {
    setSelected(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      const levels = s.levels.includes(levelId)
        ? s.levels.filter(l => l !== levelId)
        : [...s.levels, levelId];
      return { ...s, levels };
    }));
  };

  const setRate = (subjectId: number, rate: string) => {
    setSelected(prev => prev.map(s =>
      s.id === subjectId ? { ...s, hourly_rate: rate } : s
    ));
  };

  const canNext = selected.length >= 1 && selected.every(s => s.levels.length >= 1 && parseFloat(s.hourly_rate) >= 50);

  const handleNext = async () => {
    if (!canNext || loading) return;
    setLoading(true);
    setError('');
    try {
      await onboardingApi.saveStep1({
        subjects: selected.map(s => ({
          subject_id: s.id,
          levels: s.levels,
          hourly_rate: parseFloat(s.hourly_rate),
        })),
      });
      onNext();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || (isAr ? 'حدث خطأ' : 'Error saving subjects'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.stepContent}>
      {/* ─ Header ─ */}
      <div className={styles.stepHero}>
        <span className={styles.stepEmoji}>⚡</span>
        <h1 className={styles.cardTitle}>
          {isAr
            ? <>ما هي <span className={styles.accentText}>تخصصاتك؟</span></>
            : <>Which <span className={styles.accentText}>subjects</span> do you teach?</>}
        </h1>
        <p className={styles.cardSubtitle}>
          {isAr
            ? 'اختر المواد التي تتقنها — يمكنك إضافة حتى 4 مواد'
            : "What's your superpower? Choose up to 4 subjects you've mastered."}
        </p>
      </div>

      {/* ─ Max indicator ─ */}
      {selected.length > 0 && (
        <div className={styles.maxIndicator}>
          <span className={styles.maxDots}>
            {Array.from({ length: MAX }).map((_, i) => (
              <span key={i} className={`${styles.dot} ${i < selected.length ? styles.dotFilled : ''}`} />
            ))}
          </span>
          <span className={styles.maxText}>
            {isAr ? `${selected.length} / ${MAX} مواد` : `${selected.length} / ${MAX} subjects`}
          </span>
        </div>
      )}

      {/* ─ Selected subjects pills ─ */}
      {selected.length > 0 && (
        <div className={styles.selectedPills}>
          {selected.map(s => (
            <div key={s.id} className={styles.pill}>
              <span>{s.icon}</span>
              <span>{isAr ? s.name_ar : s.name_en}</span>
              <button className={styles.pillRemove} onClick={() => handleRemove(s.id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* ─ Smart Search ─ */}
      {selected.length < MAX && (
        <SubjectSearch
          onSelect={handleSelect}
          selectedIds={selected.map(s => s.id)}
          locale={locale}
          maxSelected={MAX}
        />
      )}

      {/* ─ Per-subject configuration ─ */}
      {selected.map(subject => (
        <div key={subject.id} className={styles.subjectConfig}>
          <div className={styles.subjectConfigHeader}>
            <span className={styles.subjectConfigIcon}>{subject.icon}</span>
            <span className={styles.subjectConfigName}>
              {isAr ? subject.name_ar : subject.name_en}
            </span>
          </div>

          {/* Levels */}
          <div className={styles.configSection}>
            <p className={styles.configLabel}>
              {isAr ? '📌 المراحل التي تُدرّسها' : '📌 Which levels do you teach?'}
            </p>
            <div className={styles.levelGrid}>
              {LEVELS.map(level => (
                <label key={level.id} className={`${styles.levelChip} ${subject.levels.includes(level.id) ? styles.levelChipActive : ''}`}>
                  <input
                    type="checkbox"
                    checked={subject.levels.includes(level.id)}
                    onChange={() => toggleLevel(subject.id, level.id)}
                    className={styles.hiddenCheck}
                  />
                  {isAr ? level.ar : level.en}
                </label>
              ))}
            </div>
          </div>

          {/* Rate */}
          <div className={styles.configSection}>
            <p className={styles.configLabel}>
              {isAr ? '💵 سعرك بالساعة لهذه المادة' : '💵 Your hourly rate for this subject'}
            </p>
            <div className={styles.rateRow}>
              <input
                type="number"
                className={styles.rateInput}
                value={subject.hourly_rate}
                onChange={e => setRate(subject.id, e.target.value)}
                min={50}
                max={5000}
                step={25}
              />
              <span className={styles.rateCurrency}>{isAr ? 'ج.م / ساعة' : 'EGP / hr'}</span>
            </div>
            <div className={styles.ratePreview}>
              <span className={styles.rateValue}>{subject.hourly_rate}</span>
              <span className={styles.rateLabel}>{isAr ? 'ج.م / ساعة' : 'EGP / hour'}</span>
            </div>
          </div>
        </div>
      ))}

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.btnRow}>
        {isFirstStep ? (
          /* Step 1 = first step after registration — can't go back to the register form */
          <a
            href="/dashboard/tutor"
            className={styles.backBtn}
            style={{ textDecoration: 'none', textAlign: 'center' }}
          >
            {isAr ? '← حفظ والمتابعة لاحقاً' : '← Save & Exit'}
          </a>
        ) : (
          <button className={styles.backBtn} onClick={onBack}>
            {isAr ? '→ رجوع' : '← Back'}
          </button>
        )}
        <button className={styles.nextBtn} onClick={handleNext} disabled={!canNext || loading}>
          {loading ? <span className={styles.btnSpinner} /> : (isAr ? 'التالي ←' : 'Next →')}
        </button>
      </div>
    </div>
  );
}
