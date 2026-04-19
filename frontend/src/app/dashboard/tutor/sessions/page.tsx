'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { tutorApi } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: number;
  status: 'scheduled' | 'completed' | 'confirmed' | 'cancelled' | 'disputed';
  scheduled_at: string;
  completed_at: string | null;
  duration_minutes: number;
  session_number: number;
  lesson_format: string;
  meeting_link: string | null;
  recording_link: string | null;
  tutor_notes: string | null;
  cancelled_reason: string | null;
  tutor_payout: number;
  dispute_window_ends: string | null;
  dispute_window_remaining_h: number;
  student: { id: number; name: string; avatar: string | null };
  subject: { id: number; name_ar: string; name_en: string };
  booking: { id: number; lesson_type: string; total_amount: number };
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'scheduled',           icon: '📅', ar: 'القادمة',          en: 'Upcoming'    },
  { key: 'completed',           icon: '⏳', ar: 'بانتظار الطالب',   en: 'Pending Confirm' },
  { key: 'confirmed,cancelled', icon: '📁', ar: 'السجل',             en: 'History'     },
];

const STATUS: Record<string, { bg: string; color: string; border: string; ar: string; en: string; icon: string }> = {
  scheduled: { bg: 'rgba(37,99,235,0.08)',  color: '#1D4ED8', border: 'rgba(37,99,235,0.2)',  ar: 'مجدولة',      en: 'Scheduled',    icon: '📅' },
  completed: { bg: 'rgba(202,138,4,0.08)',  color: '#92400E', border: 'rgba(202,138,4,0.2)',  ar: 'بانتظار التأكيد',en: 'Pending',     icon: '⏳' },
  confirmed: { bg: 'rgba(22,163,74,0.08)',  color: '#15803D', border: 'rgba(22,163,74,0.2)',  ar: 'مؤكدة',       en: 'Confirmed',    icon: '✅' },
  cancelled: { bg: 'rgba(107,114,128,0.08)',color: '#4B5563', border: 'rgba(107,114,128,0.2)',ar: 'ملغاة',       en: 'Cancelled',    icon: '✕'  },
  disputed:  { bg: 'rgba(220,38,38,0.08)',  color: '#B91C1C', border: 'rgba(220,38,38,0.2)',  ar: 'خلاف',        en: 'Disputed',     icon: '⚠️' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function fmtDate(d: string, isAr: boolean) {
  try {
    return new Date(d).toLocaleString(isAr ? 'ar-EG' : 'en-GB', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return d; }
}

function fmtShortDate(d: string, isAr: boolean) {
  try {
    return new Date(d).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return d; }
}

function countdown(dateStr: string, isAr: boolean): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return isAr ? 'الآن' : 'Now';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) {
    const d = Math.floor(h / 24);
    return isAr ? `خلال ${d} يوم` : `In ${d}d`;
  }
  return isAr ? `خلال ${h}س ${m}د` : `In ${h}h ${m}m`;
}

function disputeProgress(endsAt: string): number {
  const total = 48 * 3600000;
  const start = new Date(endsAt).getTime() - total;
  const elapsed = Date.now() - start;
  return Math.max(0, Math.min(100, (elapsed / total) * 100));
}

// ─── Cancel Modal ─────────────────────────────────────────────────────────────

function CancelModal({ sessionId, isAr, onClose, onSuccess }: {
  sessionId: number; isAr: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const [reason, setReason] = useState('');
  const mut = useMutation({
    mutationFn: () => tutorApi.cancelSession(sessionId, reason),
    onSuccess,
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>✕</div>
        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#1A1A2E' }}>
          {isAr ? 'إلغاء الحصة' : 'Cancel Session'}
        </h3>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: '#6B7280' }}>
          {isAr ? 'يرجى ذكر سبب الإلغاء (10 أحرف على الأقل)' : 'Please provide a reason (min 10 characters)'}
        </p>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
          placeholder={isAr ? 'سبب الإلغاء...' : 'Cancellation reason...'}
          style={{ width: '100%', borderRadius: 12, border: '1.5px solid #E5E7EB', padding: '11px 14px', fontSize: 14, resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
            {isAr ? 'تراجع' : 'Back'}
          </button>
          <button onClick={() => mut.mutate()} disabled={reason.length < 10 || mut.isPending}
            style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: reason.length < 10 ? '#FCA5A5' : '#DC2626', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', opacity: mut.isPending ? 0.7 : 1 }}>
            {mut.isPending ? '...' : (isAr ? '🗑 تأكيد الإلغاء' : '🗑 Confirm Cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mark Complete Modal ──────────────────────────────────────────────────────

function CompleteModal({ session, isAr, onClose, onSuccess }: {
  session: Session; isAr: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const [recordingLink, setRecordingLink] = useState('');
  const [notes, setNotes] = useState('');
  const mut = useMutation({
    mutationFn: () => tutorApi.completeSession(session.id, { recording_link: recordingLink, tutor_notes: notes }),
    onSuccess,
  });

  const subject = isAr ? session.subject?.name_ar : session.subject?.name_en;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 500, boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
        <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#1A1A2E' }}>
          {isAr ? 'تسجيل إتمام الحصة' : 'Mark Session Complete'}
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6B7280' }}>
          {session.student?.name} · {subject} · {isAr ? `${session.duration_minutes} دقيقة` : `${session.duration_minutes} min`}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isAr ? 'رابط التسجيل *' : 'Recording Link *'}
            </label>
            <input type="url" value={recordingLink} onChange={e => setRecordingLink(e.target.value)}
              placeholder="https://drive.google.com/..."
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} dir="ltr" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isAr ? 'ملاحظات للطالب (اختياري)' : 'Notes for Student (optional)'}
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder={isAr ? 'ملاحظات عن أداء الطالب أو مراجعة للحصة...' : 'Notes on student performance or session summary...'}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(5,150,105,0.07)', border: '1px solid rgba(5,150,105,0.15)', marginTop: 16, fontSize: 13, color: '#065F46' }}>
          💰 {isAr ? `عائدك المتوقع: ${Number(session.tutor_payout || 0).toLocaleString()} جنيه` : `Expected payout: ${Number(session.tutor_payout || 0).toLocaleString()} EGP`}
        </div>

        {mut.isError && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', color: '#B91C1C', fontSize: 13, marginTop: 12 }}>
            {(mut.error as { response?: { data?: { message?: string } } })?.response?.data?.message || (isAr ? 'حدث خطأ' : 'An error occurred')}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={() => mut.mutate()} disabled={!recordingLink || mut.isPending}
            style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: !recordingLink ? '#A7F3D0' : 'linear-gradient(135deg, #059669, #047857)', color: '#fff', cursor: !recordingLink ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', opacity: mut.isPending ? 0.7 : 1 }}>
            {mut.isPending ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? '✅ تسجيل الإتمام' : '✅ Mark Complete')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({ session, isAr, onComplete, onCancel }: {
  session: Session; isAr: boolean;
  onComplete: (s: Session) => void; onCancel: (id: number) => void;
}) {
  const st = STATUS[session.status] || STATUS.scheduled;
  const subject = isAr ? session.subject?.name_ar : session.subject?.name_en;
  const isUpcoming = session.status === 'scheduled';
  const isPending  = session.status === 'completed';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(20px)',
      borderRadius: 20,
      border: `1px solid ${isUpcoming ? 'rgba(27,73,101,0.15)' : 'rgba(229,231,235,0.8)'}`,
      boxShadow: isUpcoming ? '0 4px 20px rgba(27,73,101,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
    }}>
      {/* colour accent bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${st.color}, transparent)` }} />

      <div style={{ padding: '20px 24px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, #1B4965, #2D6A8E)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 900, color: '#fff',
          boxShadow: '0 4px 12px rgba(27,73,101,0.25)',
        }}>
          {initials(session.student?.name)}
        </div>

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#1A1A2E' }}>{session.student?.name}</span>
            <span style={{ fontSize: 13, color: '#9CA3AF' }}>·</span>
            <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>{subject}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
              background: st.bg, color: st.color, border: `1px solid ${st.border}`,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>{st.icon} {isAr ? st.ar : st.en}</span>
            <span style={{ fontSize: 11, color: '#9CA3AF', marginInlineStart: 'auto' }}>
              #{String(session.session_number).padStart(2, '0')}
            </span>
          </div>

          {/* Date + Duration */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: 13, color: '#6B7280' }}>
            <span>📅 {fmtDate(session.scheduled_at, isAr)}</span>
            <span>⏱ {session.duration_minutes} {isAr ? 'دقيقة' : 'min'}</span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'rgba(107,114,128,0.08)', color: '#6B7280' }}>
              {session.lesson_format === 'online' ? '🎥 ' : '📍 '}{session.lesson_format === 'online' ? (isAr ? 'أونلاين' : 'Online') : (isAr ? 'حضوري' : 'In-person')}
            </span>
            {isUpcoming && (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8', background: 'rgba(37,99,235,0.08)', padding: '2px 10px', borderRadius: 8 }}>
                ⏳ {countdown(session.scheduled_at, isAr)}
              </span>
            )}
          </div>

          {/* Meeting link */}
          {session.meeting_link && isUpcoming && (
            <div style={{ marginTop: 10 }}>
              <a href={session.meeting_link} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#059669', fontWeight: 700, textDecoration: 'none', background: 'rgba(5,150,105,0.08)', padding: '5px 12px', borderRadius: 8 }}>
                🔗 {isAr ? 'رابط الاجتماع' : 'Join Meeting'} ↗
              </a>
            </div>
          )}

          {/* Recording link */}
          {session.recording_link && (
            <div style={{ marginTop: 10 }}>
              <a href={session.recording_link} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#7C3AED', fontWeight: 700, textDecoration: 'none', background: 'rgba(124,58,237,0.08)', padding: '5px 12px', borderRadius: 8 }}>
                📹 {isAr ? 'التسجيل' : 'Recording'} ↗
              </a>
            </div>
          )}

          {/* Dispute window bar */}
          {isPending && session.dispute_window_ends && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(202,138,4,0.06)', border: '1px solid rgba(202,138,4,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontWeight: 700, color: '#92400E' }}>
                <span>⏰ {isAr ? 'نافذة الاعتراض' : 'Dispute window'}</span>
                <span>{session.dispute_window_remaining_h}h {isAr ? 'متبقية' : 'left'}</span>
              </div>
              <div style={{ height: 5, background: 'rgba(202,138,4,0.15)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${disputeProgress(session.dispute_window_ends)}%`, background: 'linear-gradient(90deg, #D97706, #CA8A04)', borderRadius: 99, transition: 'width 1s' }} />
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: '#9CA3AF' }}>
                {isAr ? `تنتهي في ${fmtShortDate(session.dispute_window_ends, isAr)}` : `Ends ${fmtShortDate(session.dispute_window_ends, isAr)}`}
              </div>
            </div>
          )}

          {/* Confirmed payout */}
          {session.status === 'confirmed' && session.tutor_payout > 0 && (
            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#15803D', background: 'rgba(22,163,74,0.08)', padding: '5px 12px', borderRadius: 8 }}>
              💰 +{Number(session.tutor_payout).toLocaleString()} {isAr ? 'جنيه' : 'EGP'} {isAr ? '— تم التحويل' : '— credited'}
            </div>
          )}

          {/* Cancelled reason */}
          {session.status === 'cancelled' && session.cancelled_reason && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#6B7280', padding: '6px 10px', background: 'rgba(107,114,128,0.07)', borderRadius: 8 }}>
              {isAr ? 'السبب: ' : 'Reason: '}{session.cancelled_reason}
            </div>
          )}

          {/* Tutor notes */}
          {session.tutor_notes && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#374151', padding: '6px 10px', background: 'rgba(37,99,235,0.05)', borderRadius: 8 }}>
              📝 {session.tutor_notes}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 150, flexShrink: 0 }}>
          {isUpcoming && (
            <>
              <button onClick={() => onComplete(session)}
                style={{
                  padding: '9px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                  background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff',
                  boxShadow: '0 3px 10px rgba(5,150,105,0.25)', transition: 'opacity 0.15s',
                }}>
                ✅ {isAr ? 'إتمام الحصة' : 'Mark Complete'}
              </button>
              <button onClick={() => onCancel(session.id)}
                style={{ padding: '9px 16px', borderRadius: 12, border: '1.5px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', color: '#DC2626', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}>
                ✕ {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TutorSessionsPage() {
  const { locale }  = useLocale();
  const isAr        = locale === 'ar';
  const qc          = useQueryClient();

  const [activeTab, setActiveTab]       = useState('scheduled');
  const [completeFor, setCompleteFor]   = useState<Session | null>(null);
  const [cancelId, setCancelId]         = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tutor-sessions', activeTab],
    queryFn: () => tutorApi.getSessions({ status: activeTab }).then(r => r.data.data),
    refetchInterval: 20_000,
  });

  const sessions: Session[] = (data as { data?: Session[] })?.data ?? (data as Session[]) ?? [];

  // Stats
  const allQuery = useQuery({
    queryKey: ['tutor-sessions-all'],
    queryFn: () => tutorApi.getSessions({}).then(r => r.data.data),
    refetchInterval: 30_000,
  });
  const allSessions: Session[] = (allQuery.data as { data?: Session[] })?.data ?? (allQuery.data as Session[]) ?? [];
  const stats = {
    upcoming:  allSessions.filter(s => s.status === 'scheduled').length,
    pending:   allSessions.filter(s => s.status === 'completed').length,
    confirmed: allSessions.filter(s => s.status === 'confirmed').length,
    earned:    allSessions.filter(s => s.status === 'confirmed').reduce((a, s) => a + Number(s.tutor_payout || 0), 0),
  };

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['tutor-sessions'] });
    qc.invalidateQueries({ queryKey: ['tutor-sessions-all'] });
  }, [qc]);

  return (
    <DashboardLayout role="tutor">
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .session-tab-btn:hover { opacity: 0.85; }
        .stat-card { transition: transform 0.2s, box-shadow 0.2s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(27,73,101,0.12) !important; }
      `}</style>

      {/* ── Modals ── */}
      {completeFor && (
        <CompleteModal session={completeFor} isAr={isAr}
          onClose={() => setCompleteFor(null)}
          onSuccess={() => { setCompleteFor(null); invalidate(); }} />
      )}
      {cancelId !== null && (
        <CancelModal sessionId={cancelId} isAr={isAr}
          onClose={() => setCancelId(null)}
          onSuccess={() => { setCancelId(null); invalidate(); }} />
      )}

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#1A1A2E', display: 'flex', alignItems: 'center', gap: 10 }}>
          📚 {isAr ? 'حصصي' : 'My Sessions'}
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6B7280' }}>
          {isAr ? 'جدولة الحصص، تسجيل إتمامها، وتتبع عائدك' : 'Track scheduled sessions, mark completions, and monitor your earnings'}
        </p>
      </div>

      {/* ── Stats Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { icon: '📅', label: isAr ? 'قادمة' : 'Upcoming',  value: stats.upcoming,  color: '#1D4ED8', bg: 'rgba(37,99,235,0.06)'  },
          { icon: '⏳', label: isAr ? 'بانتظار التأكيد' : 'Pending',  value: stats.pending,   color: '#92400E', bg: 'rgba(202,138,4,0.06)' },
          { icon: '✅', label: isAr ? 'مؤكدة' : 'Confirmed', value: stats.confirmed, color: '#15803D', bg: 'rgba(22,163,74,0.06)'  },
          { icon: '💰', label: isAr ? 'إجمالي العائد' : 'Total Earned',
            value: `${stats.earned.toLocaleString()} ${isAr ? 'ج' : 'EGP'}`, color: '#0F766E', bg: 'rgba(15,118,110,0.06)' },
        ].map((c, i) => (
          <div key={i} className="stat-card" style={{
            padding: '18px 20px', borderRadius: 16,
            background: c.bg, border: `1px solid ${c.color}22`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} className="session-tab-btn" onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '9px 20px', borderRadius: 100, border: '1.5px solid',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.18s',
                borderColor: active ? '#1B4965' : '#E5E7EB',
                background:  active ? '#1B4965' : 'rgba(255,255,255,0.8)',
                color:       active ? '#fff'    : '#6B7280',
                boxShadow:   active ? '0 3px 10px rgba(27,73,101,0.2)' : 'none',
              }}>
              {tab.icon} {isAr ? tab.ar : tab.en}
            </button>
          );
        })}
      </div>

      {/* ── Session List ── */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 110, borderRadius: 20, background: 'rgba(0,0,0,0.04)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : !sessions.length ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'rgba(255,255,255,0.7)', borderRadius: 24,
          border: '1px dashed rgba(27,73,101,0.2)',
        }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>
            {activeTab === 'scheduled' ? '📅' : activeTab === 'completed' ? '⏳' : '📁'}
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#374151', marginBottom: 8 }}>
            {isAr ? 'لا توجد حصص' : 'No sessions found'}
          </div>
          <div style={{ fontSize: 13, color: '#9CA3AF' }}>
            {activeTab === 'scheduled'
              ? (isAr ? 'ستظهر هنا الحصص المجدولة بعد قبول الحجز وتحديد المواعيد' : 'Scheduled sessions appear here after bookings are confirmed')
              : activeTab === 'completed'
              ? (isAr ? 'الحصص المكتملة التي تنتظر تأكيد الطالب' : 'Completed sessions awaiting student confirmation')
              : (isAr ? 'سجل الحصص المؤكدة والملغاة' : 'History of confirmed and cancelled sessions')}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeIn 0.3s ease' }}>
          {sessions.map(s => (
            <SessionCard
              key={s.id}
              session={s}
              isAr={isAr}
              onComplete={setCompleteFor}
              onCancel={setCancelId}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
