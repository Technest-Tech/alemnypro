'use client';

import { useState } from 'react';
import { onboardingApi } from '@/lib/api';
import styles from '../tutor-register.module.css';

interface Props {
  locale: 'ar' | 'en';
  onNext: () => void;
  onBack: () => void;
  initialData?: {
    hourly_rate?: number;
    group_enabled?: boolean;
    seat_price?: number;
    max_capacity?: number;
    min_threshold?: number;
    trial_free?: boolean;
    trial_mins?: number;
  };
}

export default function Step4Pricing({ locale, onNext, onBack, initialData }: Props) {
  const [hourlyRate, setHourlyRate]     = useState(String(initialData?.hourly_rate ?? 150));
  const [groupEnabled, setGroupEnabled] = useState(initialData?.group_enabled ?? false);
  const [seatPrice, setSeatPrice]       = useState(String(initialData?.seat_price ?? 75));
  const [maxCapacity, setMaxCapacity]   = useState(String(initialData?.max_capacity ?? 8));
  const [minThreshold, setMinThreshold] = useState(String(initialData?.min_threshold ?? 3));
  const [trialFree, setTrialFree]       = useState(initialData?.trial_free ?? true);
  const [trialMins, setTrialMins]       = useState(String(initialData?.trial_mins ?? 30));
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');

  const isAr   = locale === 'ar';
  const rate   = parseFloat(hourlyRate) || 0;
  const canNext = rate >= 50;

  const handleNext = async () => {
    if (!canNext || loading) return;
    setLoading(true);
    setError('');
    try {
      await onboardingApi.saveStep4({
        hourly_rate: rate,
        group_sessions_enabled: groupEnabled,
        group_price_per_seat: groupEnabled ? parseFloat(seatPrice) : null,
        group_max_capacity: groupEnabled ? parseInt(maxCapacity) : null,
        group_min_threshold: groupEnabled ? parseInt(minThreshold) : null,
        is_first_trial_free: trialFree,
        trial_duration_minutes: parseInt(trialMins),
      });
      onNext();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || (isAr ? 'حدث خطأ' : 'Error saving'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHero}>
        <span className={styles.stepEmoji}>💰</span>
        <h1 className={styles.cardTitle}>
          {isAr ? <>التسعير <span className={styles.accentText}>والمجموعات</span></> : <>Pricing & <span className={styles.accentText}>Smart Groups</span></>}
        </h1>
        <p className={styles.cardSubtitle}>
          {isAr ? 'قيّم وقتك — واستقبل الطلاب!' : "Value your time! Set rates and receive students."}
        </p>
      </div>

      <div className={styles.fields}>
        {/* 1-on-1 Rate */}
        <div className={styles.pricingCard}>
          <div className={styles.pricingCardHeader}>
            <span>👤</span>
            <strong>{isAr ? 'دروس فردية' : '1-on-1 Sessions'}</strong>
          </div>
          <label className={styles.label}>
            {isAr ? 'السعر بالساعة (ج.م)' : 'Hourly Rate (EGP)'}
          </label>
          <div className={styles.rateRow}>
            <input
              id="price-hourly"
              className={styles.rateInput}
              type="number"
              value={hourlyRate}
              onChange={e => setHourlyRate(e.target.value)}
              min={50}
              max={5000}
              step={25}
            />
            <span className={styles.rateCurrency}>{isAr ? 'ج.م' : 'EGP'}</span>
          </div>
          {/* Slider */}
          <input
            type="range"
            className={styles.rateSlider}
            value={hourlyRate}
            onChange={e => setHourlyRate(e.target.value)}
            min={50}
            max={1000}
            step={25}
          />
          <div className={styles.ratePreview}>
            <span className={styles.rateValue}>{hourlyRate}</span>
            <span className={styles.rateLabel}>{isAr ? 'ج.م / ساعة' : 'EGP / hour'}</span>
          </div>
        </div>

        {/* Group Sessions */}
        <div className={styles.pricingCard}>
          <label className={styles.toggle} id="group-toggle">
            <input
              type="checkbox"
              checked={groupEnabled}
              onChange={e => setGroupEnabled(e.target.checked)}
            />
            <span className={styles.toggleSwitch} />
            <div>
              <strong className={styles.toggleTitle}>👥 {isAr ? 'دروس جماعية' : 'Group Sessions'}</strong>
              <p className={styles.toggleDesc}>{isAr ? 'أضف خيار الدروس الجماعية بأسعار مخفضة' : 'Offer group sessions at reduced per-seat prices'}</p>
            </div>
          </label>

          {groupEnabled && (
            <div className={styles.groupOptions} id="group-options">
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>{isAr ? 'السعر / مقعد (ج.م)' : 'Price / Seat (EGP)'}</label>
                  <input
                    id="group-seat-price"
                    className={styles.input}
                    type="number"
                    value={seatPrice}
                    onChange={e => setSeatPrice(e.target.value)}
                    min={20}
                    max={2000}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{isAr ? 'الحد الأقصى للمقاعد' : 'Max Capacity'}</label>
                  <select
                    id="group-max-capacity"
                    className={styles.input}
                    value={maxCapacity}
                    onChange={e => setMaxCapacity(e.target.value)}
                  >
                    {[3,4,5,6,7,8,10,12,15,20].map(n => (
                      <option key={n} value={n}>{n} {isAr ? 'طلاب' : 'students'}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{isAr ? 'الحد الأدنى للتأكيد التلقائي' : 'Min Threshold (auto-confirm)'}</label>
                <select
                  id="group-min-threshold"
                  className={styles.input}
                  value={minThreshold}
                  onChange={e => setMinThreshold(e.target.value)}
                >
                  {[2,3,4,5,6,7,8].filter(n => n < parseInt(maxCapacity)).map(n => (
                    <option key={n} value={n}>{n} {isAr ? 'طلاب' : 'students'}</option>
                  ))}
                </select>
                <span className={styles.hint}>
                  {isAr
                    ? 'يتأكد الدرس تلقائياً عند الوصول إلى هذا العدد'
                    : 'Session auto-confirms when this threshold is met'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Free Trial */}
        <div className={styles.pricingCard}>
          <label className={styles.toggle} id="trial-toggle">
            <input
              type="checkbox"
              checked={trialFree}
              onChange={e => setTrialFree(e.target.checked)}
            />
            <span className={styles.toggleSwitch} />
            <div>
              <strong className={styles.toggleTitle}>🎁 {isAr ? 'الدرس التجريبي مجاني' : 'Free Trial Lesson'}</strong>
              <p className={styles.toggleDesc}>{isAr
                ? 'المدرسون الذين يقدمون درساً تجريبياً يحولون 80% من الطلاب إلى عملاء دائمين!'
                : 'Tutors offering a free trial convert 80% of students into long-term clients!'}</p>
            </div>
          </label>
          {trialFree && (
            <div className={styles.field} style={{ marginTop: '12px' }}>
              <label className={styles.label}>{isAr ? 'مدة الدرس التجريبي' : 'Trial Duration'}</label>
              <div className={styles.durationBtns}>
                {['15', '30', '45', '60'].map(m => (
                  <button
                    key={m}
                    type="button"
                    className={`${styles.durationBtn} ${trialMins === m ? styles.durationBtnActive : ''}`}
                    onClick={() => setTrialMins(m)}
                  >
                    {m} {isAr ? 'دقيقة' : 'min'}
                  </button>
                ))}
              </div>
            </div>
          )}
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
