'use client';

import { useState } from 'react';
import { onboardingApi } from '@/lib/api';
import styles from '../tutor-register.module.css';

interface Props {
  locale: 'ar' | 'en';
  onNext: () => void;
  onBack: () => void;
  initialData?: { headline?: string; bio_background?: string; bio_method?: string };
}

export default function Step2Pitch({ locale, onNext, onBack, initialData }: Props) {
  const [headline, setHeadline]         = useState(initialData?.headline || '');
  const [bioBackground, setBioBackground] = useState(initialData?.bio_background || '');
  const [bioMethod, setBioMethod]         = useState(initialData?.bio_method || '');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const isAr = locale === 'ar';
  const MAX_HEAD = 80;
  const canNext = headline.trim().length >= 10 && bioBackground.trim().length >= 30 && bioMethod.trim().length >= 30;

  const handleNext = async () => {
    if (!canNext || loading) return;
    setLoading(true);
    setError('');
    try {
      await onboardingApi.saveStep2({
        headline: headline.trim(),
        bio_background: bioBackground.trim(),
        bio_method: bioMethod.trim(),
        locale,
      });
      onNext();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || (isAr ? 'حدث خطأ' : 'Error saving profile'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHero}>
        <span className={styles.stepEmoji}>✍️</span>
        <h1 className={styles.cardTitle}>
          {isAr ? <>ملفك <span className={styles.accentText}>المهني</span></> : <>Your Professional <span className={styles.accentText}>Pitch</span></>}
        </h1>
        <p className={styles.cardSubtitle}>
          {isAr ? 'هذا ما يراه الطلاب أولاً — اجعله يبرز!' : 'This is what students see first — make it shine!'}
        </p>
      </div>

      <div className={styles.infoBox}>
        <span>💡</span>
        <div>
          <strong>{isAr ? 'نصيحة احترافية' : 'Pro Tip'}</strong>
          <p>{isAr
            ? 'الملفات التي تشرح أسلوب التدريس تحصل على 50% حجوزات أكثر!'
            : 'Profiles with detailed teaching methods get 50% more bookings!'}</p>
        </div>
      </div>

      <div className={styles.fields}>
        {/* Headline */}
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label}>
              {isAr ? '✨ العنوان المميز (حتى 80 حرفاً)' : '✨ Catchy Headline (max 80 chars)'}
            </label>
            <span className={`${styles.charCount} ${headline.length > MAX_HEAD * 0.85 ? styles.charCountWarning : ''}`}>
              {headline.length}/{MAX_HEAD}
            </span>
          </div>
          <input
            id="pitch-headline"
            className={`${styles.input} ${headline.length > MAX_HEAD ? styles.inputError : ''}`}
            value={headline}
            onChange={e => setHeadline(e.target.value.slice(0, MAX_HEAD))}
            placeholder={isAr
              ? 'مدرس رياضيات خبير للـIGCSE — 10 سنوات تجربة'
              : 'Expert Math Tutor for IGCSE — 10 Years Experience'}
          />
          {headline.length >= 10 && (
            <div className={styles.headlinePreview}>
              <span className={styles.previewLabel}>{isAr ? 'معاينة:' : 'Preview:'}</span>
              <span className={styles.previewText}>{headline}</span>
            </div>
          )}
        </div>

        {/* Bio Background */}
        <div className={styles.field}>
          <label className={styles.label}>
            {isAr ? '📋 خلفيتي التعليمية والمهنية' : '📋 My Educational & Professional Background'}
          </label>
          <textarea
            id="pitch-background"
            className={styles.textarea}
            rows={4}
            value={bioBackground}
            onChange={e => setBioBackground(e.target.value)}
            placeholder={isAr
              ? 'مثال: تخرجت من كلية العلوم بجامعة القاهرة، ولدي 10 سنوات خبرة في تدريس الرياضيات للثانوية العامة والـIGCSE...'
              : 'E.g., I graduated from Cairo University\'s Faculty of Science, and have 10 years of experience teaching Math for IGCSE & Thanaweya...'}
          />
          <span className={styles.hint}>
            {bioBackground.length < 30
              ? (isAr ? `${30 - bioBackground.length} أحرف أخرى على الأقل` : `${30 - bioBackground.length} more characters needed`)
              : '✓ ' + (isAr ? 'ممتاز!' : 'Great!')}
          </span>
        </div>

        {/* Bio Method */}
        <div className={styles.field}>
          <label className={styles.label}>
            {isAr ? '🎯 أسلوبي في التدريس والأدوات التي أستخدمها' : '🎯 My Teaching Method & Tools'}
          </label>
          <textarea
            id="pitch-method"
            className={styles.textarea}
            rows={4}
            value={bioMethod}
            onChange={e => setBioMethod(e.target.value)}
            placeholder={isAr
              ? 'مثال: أعتمد على شرح المفاهيم بالأمثلة الحياتية، مع استخدام GeoGebra والرسم البياني لتوضيح الأفكار...'
              : 'E.g., I use real-world examples and GeoGebra to visualize concepts, focusing on problem-solving patterns...'}
          />
          <span className={styles.hint}>
            {bioMethod.length < 30
              ? (isAr ? `${30 - bioMethod.length} أحرف أخرى على الأقل` : `${30 - bioMethod.length} more characters needed`)
              : '✓ ' + (isAr ? 'رائع!' : 'Excellent!')}
          </span>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.btnRow}>
        <button className={styles.backBtn} onClick={onBack}>
          {isAr ? '→ رجوع' : '← Back'}
        </button>
        <button className={styles.nextBtn} onClick={handleNext} disabled={!canNext || loading}>
          {loading ? <span className={styles.btnSpinner} /> : (isAr ? 'التالي ←' : 'Next →')}
        </button>
      </div>
    </div>
  );
}
