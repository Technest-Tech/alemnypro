'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tutorApi } from '@/lib/api';

interface Session { id: number; recording_link?: string; tutor_notes?: string; [k: string]: unknown }

interface Props {
  session: Session;
  isAr: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CompleteSessionModal({ session, isAr, onClose, onSuccess }: Props) {
  const qc = useQueryClient();
  const [recordingLink, setRecordingLink] = useState(session.recording_link || '');
  const [notes, setNotes] = useState(session.tutor_notes || '');
  const [error, setError] = useState('');

  const mut = useMutation({
    mutationFn: () => tutorApi.completeSession(session.id, { recording_link: recordingLink, tutor_notes: notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tutor-sessions'] }); onSuccess(); },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || (isAr ? 'حدث خطأ' : 'An error occurred'));
    },
  });

  const isUrl = (v: string) => { try { new URL(v); return true; } catch { return false; } };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#1A1A2E' }}>
          ✅ {isAr ? 'تأكيد إتمام الحصة' : 'Mark Session Complete'}
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6B7280', lineHeight: 1.5 }}>
          {isAr
            ? 'أضف رابط التسجيل كدليل على إتمام الحصة. سيُفتح نافذة اعتراض للطالب مدتها 48 ساعة.'
            : 'Add the recording link as proof. A 48-hour dispute window will open for the student.'}
        </p>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
          📹 {isAr ? 'رابط التسجيل (مطلوب)' : 'Recording Link (required)'}
        </label>
        <input
          type="url" value={recordingLink} onChange={e => { setRecordingLink(e.target.value); setError(''); }}
          placeholder="https://drive.google.com/... or https://youtu.be/..."
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${error ? '#FCA5A5' : '#E5E7EB'}`, fontSize: 14, boxSizing: 'border-box', marginBottom: 16 }}
        />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
          📝 {isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
        </label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder={isAr ? 'ملاحظات خاصة عن الحصة...' : 'Private notes about this session...'}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, resize: 'none', boxSizing: 'border-box', marginBottom: 4 }}
        />

        {error && <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 12 }}>{error}</p>}

        <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#92400E' }}>
          ⚠️ {isAr ? 'بعد التأكيد، سيحصل الطالب على 48 ساعة للاعتراض قبل تحويل أرباحك.' : 'After confirming, the student has 48h to dispute before your payout is released.'}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            {isAr ? 'تراجع' : 'Cancel'}
          </button>
          <button
            onClick={() => { if (!isUrl(recordingLink)) { setError(isAr ? 'الرجاء إدخال رابط صحيح' : 'Please enter a valid URL'); return; } mut.mutate(); }}
            disabled={!recordingLink || mut.isPending}
            style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: mut.isPending ? '#94A3B8' : '#1B4965', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            {mut.isPending ? '...' : (isAr ? 'تأكيد الإتمام' : 'Confirm Completion')}
          </button>
        </div>
      </div>
    </div>
  );
}
