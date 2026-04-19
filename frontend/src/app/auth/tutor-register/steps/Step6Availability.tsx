'use client';

import { useState } from 'react';
import { onboardingApi } from '@/lib/api';
import styles from '../tutor-register.module.css';

interface Props {
  locale: 'ar' | 'en';
  onNext: () => void;
  onBack: () => void;
}

// Egyptian week starts Saturday
const DAYS = [
  { id: 'saturday',  ar: 'السبت',    en: 'Sat' },
  { id: 'sunday',    ar: 'الأحد',    en: 'Sun' },
  { id: 'monday',    ar: 'الإثنين',  en: 'Mon' },
  { id: 'tuesday',   ar: 'الثلاثاء', en: 'Tue' },
  { id: 'wednesday', ar: 'الأربعاء', en: 'Wed' },
  { id: 'thursday',  ar: 'الخميس',   en: 'Thu' },
  { id: 'friday',    ar: 'الجمعة',   en: 'Fri' },
];

const HOURS = Array.from({ length: 14 }, (_, i) => {
  const h = i + 8; // 8 AM to 9 PM
  return {
    id: `${h.toString().padStart(2, '0')}:00`,
    label: h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`,
  };
});

type SlotKey = string; // "saturday_08:00"

export default function Step6Availability({ locale, onNext, onBack }: Props) {
  const [selectedSlots, setSelectedSlots] = useState<Set<SlotKey>>(new Set());
  const [isRecurring, setIsRecurring]     = useState(true);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [isDragging, setIsDragging]       = useState(false);
  const [dragAction, setDragAction]       = useState<'add' | 'remove'>('add');

  const isAr     = locale === 'ar';
  const slotCount = selectedSlots.size;
  const canNext   = slotCount >= 3;

  const slotKey = (day: string, hour: string): SlotKey => `${day}_${hour}`;

  const toggleSlot = (day: string, hour: string, action?: 'add' | 'remove') => {
    const key = slotKey(day, hour);
    setSelectedSlots(prev => {
      const next = new Set(prev);
      const op = action ?? (next.has(key) ? 'remove' : 'add');
      if (op === 'add') next.add(key); else next.delete(key);
      return next;
    });
  };

  const handleMouseDown = (day: string, hour: string) => {
    const key = slotKey(day, hour);
    const action = selectedSlots.has(key) ? 'remove' : 'add';
    setDragAction(action);
    setIsDragging(true);
    toggleSlot(day, hour, action);
  };

  const handleMouseEnter = (day: string, hour: string) => {
    if (isDragging) toggleSlot(day, hour, dragAction);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleNext = async () => {
    if (!canNext || loading) return;
    setLoading(true);
    setError('');

    // Convert slot keys to API format
    const slots: { day: string; start_time: string; end_time: string; is_recurring: boolean }[] = [];
    selectedSlots.forEach(key => {
      const [day, startTime] = key.split('_');
      const [h] = startTime.split(':');
      const endHour = (parseInt(h) + 1).toString().padStart(2, '0');
      slots.push({ day, start_time: startTime, end_time: `${endHour}:00`, is_recurring: isRecurring });
    });

    try {
      await onboardingApi.saveStep6({ slots });
      onNext();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || (isAr ? 'حدث خطأ' : 'Error saving availability'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHero}>
        <span className={styles.stepEmoji}>📅</span>
        <h1 className={styles.cardTitle}>
          {isAr ? <>مواعيدك <span className={styles.accentText}>الأسبوعية</span></> : <>Your Weekly <span className={styles.accentText}>Schedule</span></>}
        </h1>
        <p className={styles.cardSubtitle}>
          {isAr
            ? 'اختر المواعيد المتاحة بالنقر أو السحب — حدد 3 على الأقل'
            : 'Click or drag to select your available slots — minimum 3'}
        </p>
      </div>

      {/* Summary */}
      <div className={styles.availSummary}>
        <div className={styles.availCount}>
          <span className={`${styles.availNum} ${canNext ? styles.availNumOk : ''}`}>{slotCount}</span>
          <span className={styles.availLabel}>
            {isAr ? `/ 3 مواعيد على الأقل` : '/ 3 slots min'}
          </span>
        </div>
        <label className={styles.toggle} style={{ fontSize: 'var(--text-sm)' }}>
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={e => setIsRecurring(e.target.checked)}
          />
          <span className={styles.toggleSwitch} />
          <span>{isAr ? 'تكرار أسبوعي' : 'Repeat weekly'}</span>
        </label>
      </div>

      {/* Calendar Grid */}
      <div
        className={styles.calendarWrap}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ userSelect: 'none' }}
      >
        {/* Day headers */}
        <div className={styles.calDayRow}>
          <div className={styles.calTimeCol} />
          {DAYS.map(d => (
            <div key={d.id} className={styles.calDayHeader}>
              {isAr ? d.ar : d.en}
            </div>
          ))}
        </div>

        {/* Time rows */}
        {HOURS.map(hour => (
          <div key={hour.id} className={styles.calRow}>
            <div className={styles.calTimeLabel}>{hour.label}</div>
            {DAYS.map(day => {
              const key = slotKey(day.id, hour.id);
              const isOn = selectedSlots.has(key);
              return (
                <div
                  key={day.id}
                  className={`${styles.calCell} ${isOn ? styles.calCellOn : ''}`}
                  onMouseDown={() => handleMouseDown(day.id, hour.id)}
                  onMouseEnter={() => handleMouseEnter(day.id, hour.id)}
                  title={`${isAr ? day.ar : day.en} ${hour.label}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      <p className={styles.calHint}>
        {isAr ? '💡 يمكنك تعديل مواعيدك في أي وقت من لوحة التحكم' : '💡 You can update your schedule anytime from the dashboard'}
      </p>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.btnRow}>
        <button className={styles.backBtn} onClick={onBack}>
          {isAr ? '→ رجوع' : '← Back'}
        </button>
        <button className={styles.nextBtn} onClick={handleNext} disabled={!canNext || loading}>
          {loading ? <span className={styles.btnSpinner} /> : (isAr ? 'إرسال للمراجعة 🚀' : 'Submit for Review 🚀')}
        </button>
      </div>
    </div>
  );
}
