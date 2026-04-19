'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tutorApi } from '@/lib/api';

interface Booking {
  id: number;
  lessons_count: number;
  sessions_scheduled: number;
  hourly_rate: number;
  per_lesson_amount?: number;
  lesson_format: string;
  subject?: { name_ar?: string; name_en?: string };
  student?: { name?: string };
  [k: string]: unknown;
}

interface SessionSlot { scheduled_at: string; duration_minutes: number; meeting_link: string }

interface Props {
  booking: Booking;
  isAr: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DURATIONS = [30, 45, 60, 90, 120];

export default function ScheduleSessionsModal({ booking, isAr, onClose, onSuccess }: Props) {
  const qc      = useQueryClient();
  const remaining = booking.lessons_count - booking.sessions_scheduled;
  const perLesson = booking.per_lesson_amount ?? booking.hourly_rate;

  const emptySlot = (): SessionSlot => ({
    scheduled_at: '',
    duration_minutes: 60,
    meeting_link: '',
  });

  const [slots, setSlots] = useState<SessionSlot[]>([emptySlot()]);
  const [error, setError] = useState('');

  const setSlot = (i: number, key: keyof SessionSlot, value: string | number) => {
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: value } : s));
  };

  const addSlot = () => {
    if (slots.length < remaining) setSlots(prev => [...prev, emptySlot()]);
  };

  const removeSlot = (i: number) => {
    if (slots.length > 1) setSlots(prev => prev.filter((_, idx) => idx !== i));
  };

  const feePct   = 15; // displayed estimate (actual comes from backend at creation)
  const total    = Math.round(perLesson * slots.length * 100) / 100;
  const fee      = Math.round(total * feePct / 100 * 100) / 100;
  const payout   = Math.round((total - fee) * 100) / 100;

  const subjectName = (isAr ? booking.subject?.name_ar : booking.subject?.name_en) || '—';
  const studentName = booking.student?.name || '—';

  const mut = useMutation({
    mutationFn: () => tutorApi.scheduleSessions(
      booking.id,
      slots.map(s => ({
        scheduled_at:     s.scheduled_at,
        duration_minutes: s.duration_minutes,
        meeting_link:     s.meeting_link || undefined,
      }))
    ),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tutor-bookings', 'tutor-sessions'] }); onSuccess(); },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || (isAr ? 'حدث خطأ' : 'An error occurred'));
    },
  });

  const validate = () => {
    for (const s of slots) {
      if (!s.scheduled_at) { setError(isAr ? 'أدخل تاريخ ووقت كل حصة' : 'Enter date/time for each session'); return false; }
      if (new Date(s.scheduled_at) <= new Date()) { setError(isAr ? 'يجب أن يكون موعد الحصة في المستقبل' : 'Session must be in the future'); return false; }
    }
    return true;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 560, boxShadow: '0 25px 60px rgba(0,0,0,0.2)', marginTop: 24, marginBottom: 24 }}>
        {/* Header */}
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: '#1A1A2E' }}>
          📅 {isAr ? 'جدولة الحصص' : 'Schedule Sessions'}
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6B7280' }}>
          {studentName} · {subjectName} · {isAr ? `${remaining} حصص متبقية` : `${remaining} sessions remaining`}
        </p>

        {/* Slots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          {slots.map((slot, i) => (
            <div key={i} style={{ padding: '14px 16px', background: '#F8FAFC', borderRadius: 14, border: '1.5px solid #E5E7EB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                  {isAr ? `الحصة ${i + 1}` : `Lesson ${i + 1}`}
                </span>
                {slots.length > 1 && (
                  <button onClick={() => removeSlot(i)}
                    style={{ border: 'none', background: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>
                    ×
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'التاريخ والوقت' : 'Date & Time'}
                  </label>
                  <input type="datetime-local" value={slot.scheduled_at}
                    onChange={e => setSlot(i, 'scheduled_at', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'المدة' : 'Duration'}
                  </label>
                  <select value={slot.duration_minutes} onChange={e => setSlot(i, 'duration_minutes', Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box' }}>
                    {DURATIONS.map(d => <option key={d} value={d}>{d} {isAr ? 'دقيقة' : 'min'}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>
                  🔗 {isAr ? 'رابط الاجتماع (اختياري)' : 'Meeting Link (optional)'}
                </label>
                <input type="url" value={slot.meeting_link}
                  onChange={e => setSlot(i, 'meeting_link', e.target.value)}
                  placeholder="https://meet.google.com/..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add more */}
        {slots.length < remaining && (
          <button onClick={addSlot}
            style={{ width: '100%', padding: '10px 0', borderRadius: 12, border: '1.5px dashed #CBD5E1', background: '#F8FAFC', cursor: 'pointer', color: '#1B4965', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
            + {isAr ? 'أضف حصة أخرى' : 'Add Another Session'}
          </button>
        )}

        {/* Financial summary */}
        <div style={{ background: '#F0F7FF', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151', marginBottom: 6 }}>
            <span>{isAr ? 'إجمالي الطالب' : 'Student total'}</span>
            <span style={{ fontWeight: 700 }}>{total} EGP</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B7280', marginBottom: 6 }}>
            <span>{isAr ? `عمولة المنصة (~${feePct}%)` : `Platform fee (~${feePct}%)`}</span>
            <span>−{fee} EGP</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#16A34A', fontWeight: 800, borderTop: '1px solid #BFDBFE', paddingTop: 8, marginTop: 4 }}>
            <span>{isAr ? 'أرباحك المتوقعة' : 'Your estimated payout'}</span>
            <span>{payout} EGP</span>
          </div>
        </div>

        {error && <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 12 }}>{error}</p>}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            {isAr ? 'تراجع' : 'Cancel'}
          </button>
          <button onClick={() => { setError(''); if (validate()) mut.mutate(); }}
            disabled={mut.isPending}
            style={{ flex: 2, padding: '12px 0', borderRadius: 12, border: 'none', background: mut.isPending ? '#94A3B8' : '#1B4965', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
            {mut.isPending ? '...' : (isAr ? `جدولة ${slots.length} حصة` : `Schedule ${slots.length} Session${slots.length > 1 ? 's' : ''}`)}
          </button>
        </div>
      </div>
    </div>
  );
}
