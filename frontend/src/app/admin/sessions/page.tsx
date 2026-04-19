'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { adminApi } from '@/lib/api';
import styles from '../admin.module.css';

/* ─── Types ─── */
interface SessionUser  { id: number; name: string; email: string; phone?: string }
interface Subject      { id: number; name_ar: string; name_en: string }
interface Dispute      { id: number; status: string; reason: string; evidence_link?: string }
interface Session {
  id: number;
  status: string;
  scheduled_at: string;
  completed_at?: string;
  dispute_window_ends?: string;
  duration_minutes: number;
  lesson_format: string;
  meeting_link?: string;
  recording_link?: string;
  tutor_notes?: string;
  gross_amount: number;
  platform_fee: number;
  tutor_payout: number;
  platform_fee_pct: number;
  payout_released_at?: string;
  session_number: number;
  tutor: SessionUser;
  student: SessionUser;
  subject?: Subject;
  dispute?: Dispute;
}

/* ─── Constants ─── */
const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string; ar: string; en: string }> = {
  scheduled:  { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6', ar: 'مجدولة',           en: 'Scheduled'  },
  completed:  { bg: '#FFF7ED', color: '#C05621', dot: '#F59E0B', ar: 'مكتملة (مراجعة)',  en: 'Completed'  },
  confirmed:  { bg: '#ECFDF5', color: '#065F46', dot: '#10B981', ar: 'مؤكدة',            en: 'Confirmed'  },
  disputed:   { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444', ar: 'متنازع عليها',     en: 'Disputed'   },
  cancelled:  { bg: '#F3F4F6', color: '#374151', dot: '#9CA3AF', ar: 'ملغاة',            en: 'Cancelled'  },
};

/* ─── Sub-components ─── */
function StatusBadge({ status, isAr }: { status: string; isAr: boolean }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
      background: cfg.bg, color: cfg.color,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {isAr ? cfg.ar : cfg.en}
    </span>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #F3F4F6' }}>
      <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: highlight ? 800 : 600, color: highlight ? '#1B4965' : '#1A1A2E' }}>{value}</span>
    </div>
  );
}

/* ─── Session Detail Modal ─── */
function SessionModal({ session, isAr, onClose }: { session: Session; isAr: boolean; onClose: () => void }) {
  const fmt = (iso: string) => new Date(iso).toLocaleString(isAr ? 'ar-EG' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const subjectName = isAr ? session.subject?.name_ar : session.subject?.name_en;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }}>

        {/* Modal Header */}
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1A1A2E' }}>
                📅 {isAr ? 'حصة' : 'Session'} #{session.id}
              </h2>
              <StatusBadge status={session.status} isAr={isAr} />
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF' }}>
              {subjectName || '—'} · {isAr ? 'حصة' : 'Lesson'} #{session.session_number}
            </p>
          </div>
          <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', fontSize: 16, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* People */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
            {/* Tutor */}
            <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px', border: '1px solid #E9EBF0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                🧑‍🏫 {isAr ? 'المعلم' : 'Tutor'}
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#1A1A2E', marginBottom: 4 }}>{session.tutor?.name}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{session.tutor?.email}</div>
              {session.tutor?.phone && <div style={{ fontSize: 12, color: '#6B7280' }}>{session.tutor.phone}</div>}
            </div>
            {/* Student */}
            <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px', border: '1px solid #E9EBF0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                👨‍🎓 {isAr ? 'الطالب' : 'Student'}
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#1A1A2E', marginBottom: 4 }}>{session.student?.name}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{session.student?.email}</div>
              {session.student?.phone && <div style={{ fontSize: 12, color: '#6B7280' }}>{session.student.phone}</div>}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px 18px', border: '1px solid #E9EBF0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              🕐 {isAr ? 'التوقيت' : 'Timeline'}
            </div>
            <DetailRow label={isAr ? 'موعد الحصة'        : 'Scheduled At'}       value={fmt(session.scheduled_at)} />
            <DetailRow label={isAr ? 'المدة'              : 'Duration'}           value={`${session.duration_minutes} ${isAr ? 'دقيقة' : 'min'}`} />
            <DetailRow label={isAr ? 'النوع'              : 'Format'}             value={session.lesson_format === 'online' ? (isAr ? 'أونلاين' : 'Online') : (isAr ? 'حضوري' : 'In-Person')} />
            {session.completed_at && <DetailRow label={isAr ? 'اكتملت'            : 'Completed'}          value={fmt(session.completed_at)} />}
            {session.dispute_window_ends && <DetailRow label={isAr ? 'نافذة الاعتراض' : 'Dispute Window'} value={fmt(session.dispute_window_ends)} />}
          </div>

          {/* Financials */}
          <div style={{ background: 'linear-gradient(135deg, #EBF5FF, #F0FDF4)', borderRadius: 14, padding: '16px 18px', border: '1px solid #C3DAFE' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1B4965', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              💰 {isAr ? 'التفاصيل المالية' : 'Financial Details'}
            </div>
            <DetailRow label={isAr ? 'المبلغ الإجمالي'   : 'Gross Amount'}   value={`${Number(session.gross_amount).toFixed(2)} EGP`}   highlight />
            <DetailRow label={isAr ? 'عمولة المنصة'       : 'Platform Fee'}   value={`${session.platform_fee_pct}% = ${Number(session.platform_fee).toFixed(2)} EGP`} />
            <DetailRow label={isAr ? 'مستحق للمعلم'       : 'Tutor Payout'}   value={`${Number(session.tutor_payout).toFixed(2)} EGP`} />
            <DetailRow label={isAr ? 'حالة الصرف'         : 'Payout Status'}  value={
              session.payout_released_at
                ? <span style={{ color: '#059669' }}>✅ {isAr ? 'مُصرَّف' : 'Released'}</span>
                : <span style={{ color: '#F59E0B' }}>⏳ {isAr ? 'في الانتظار' : 'Pending'}</span>
            } />
          </div>

          {/* Links */}
          {(session.meeting_link || session.recording_link) && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {session.meeting_link && (
                <a href={session.meeting_link} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: '#EBF5FF', color: '#1B4965', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                  🔗 {isAr ? 'رابط الحصة' : 'Meeting Link'} ↗
                </a>
              )}
              {session.recording_link && (
                <a href={session.recording_link} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: '#F5F3FF', color: '#5B21B6', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                  📹 {isAr ? 'مشاهدة التسجيل' : 'View Recording'} ↗
                </a>
              )}
            </div>
          )}

          {/* Tutor Notes */}
          {session.tutor_notes && (
            <div style={{ background: '#FFFBEB', borderRadius: 12, padding: '14px 16px', border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>
                📝 {isAr ? 'ملاحظات المعلم' : 'Tutor Notes'}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#78350F', lineHeight: 1.6 }}>{session.tutor_notes}</p>
            </div>
          )}

          {/* Dispute Info */}
          {session.dispute && (
            <div style={{ background: '#FEF2F2', borderRadius: 12, padding: '14px 16px', border: '1px solid #FECACA' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', marginBottom: 6 }}>
                ⚖️ {isAr ? 'تفاصيل الاعتراض' : 'Dispute Details'} · {session.dispute.status}
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: '#7F1D1D', lineHeight: 1.6 }}>{session.dispute.reason}</p>
              {session.dispute.evidence_link && (
                <a href={session.dispute.evidence_link} target="_blank" rel="noreferrer"
                  style={{ fontSize: 13, color: '#DC2626', fontWeight: 700, textDecoration: 'none' }}>
                  📎 {isAr ? 'الدليل' : 'Evidence'} ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function AdminSessionsPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const [statusFilter, setStatusFilter] = useState('');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  // Modal state — session is set directly from list data, no async needed
  const [modalSession, setModalSession] = useState<Session | null>(null);

  /* Fetch list */
  const { data, isLoading } = useQuery({
    queryKey: ['admin-sessions', statusFilter, page],
    queryFn: () => adminApi.getSessions({
      ...(statusFilter ? { status: statusFilter } : {}),
      page: String(page),
    }).then(r => r.data.data),
  });

  /* Fetch financials summary */
  const { data: financials } = useQuery({
    queryKey: ['admin-session-financials'],
    queryFn: () => adminApi.getSessionFinancials().then(r => r.data.data),
  });

  const sessions: Session[] = (data as { data?: Session[] })?.data ?? (data as Session[]) ?? [];
  const meta = (data as { current_page?: number; last_page?: number; total?: number });

  /* Client-side name search */
  const filtered = search.trim()
    ? sessions.filter(s =>
        s.tutor?.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
        String(s.id).includes(search)
      )
    : sessions;

  const STATUS_FILTERS = [
    { val: '',           ar: 'الكل',              en: 'All'       },
    { val: 'scheduled',  ar: 'مجدولة',             en: 'Scheduled' },
    { val: 'completed',  ar: 'مكتملة',             en: 'Completed' },
    { val: 'confirmed',  ar: 'مؤكدة',              en: 'Confirmed' },
    { val: 'disputed',   ar: 'متنازع عليها',       en: 'Disputed'  },
    { val: 'cancelled',  ar: 'ملغاة',              en: 'Cancelled' },
  ];

  // Open modal immediately using data already in the list
  const handleOpen = (s: Session) => setModalSession(s);
  const handleClose = () => setModalSession(null);


  return (
    <>
      {/* ── Modal ── */}
      {modalSession && (
        <SessionModal session={modalSession} isAr={isAr} onClose={handleClose} />
      )}

      {/* ── Header ── */}
      <div className={styles.dashHeader} style={{ position: 'static', marginBottom: 24 }}>
        <div>
          <h1 className={styles.dashTitle}>📅 {isAr ? 'مراقب الحصص' : 'Sessions Monitor'}</h1>
          <p className={styles.dashSubtitle}>
            {isAr ? 'تتبع الحصص والمدفوعات والاعتراضات' : 'Track all lessons, payments and disputes in real time'}
          </p>
        </div>
      </div>

      {/* ── Financial KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { icon: '📚', label: isAr ? 'إجمالي الحصص'       : 'Total Sessions',    value: financials?.total_sessions      ?? '—', color: '#1B4965' },
          { icon: '✅', label: isAr ? 'مؤكدة'               : 'Confirmed',         value: financials?.confirmed_sessions  ?? '—', color: '#059669' },
          { icon: '⏳', label: isAr ? 'مجدولة'              : 'Scheduled',         value: financials?.scheduled_sessions  ?? '—', color: '#D97706' },
          { icon: '⚖️', label: isAr ? 'متنازع عليها'        : 'Disputed',          value: financials?.disputed_sessions   ?? '—', color: '#DC2626' },
          { icon: '💰', label: isAr ? 'إجمالي الإيرادات'    : 'Total Revenue',     value: financials ? `${Number(financials.total_revenue).toLocaleString()} EGP` : '—', color: '#1B4965' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1px solid #E9EBF0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color, letterSpacing: '-0.02em' }}>{String(s.value)}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {STATUS_FILTERS.map(f => (
          <button key={f.val}
            className={`${styles.tag} ${statusFilter === f.val ? styles['tag-active'] : ''}`}
            onClick={() => { setStatusFilter(f.val); setPage(1); }}
          >
            {isAr ? f.ar : f.en}
          </button>
        ))}
        <div style={{ marginInlineStart: 'auto' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isAr ? '🔍 بحث باسم أو رقم...' : '🔍 Search by name or ID...'}
            style={{ padding: '7px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, outline: 'none', width: 220, fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #E9EBF0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ height: 64, borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 13, width: '40%', borderRadius: 6, marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 11, width: '25%', borderRadius: 6 }} />
                </div>
                <div className="skeleton" style={{ height: 24, width: 80, borderRadius: 999 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#9CA3AF' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{isAr ? 'لا توجد حصص' : 'No sessions found'}</div>
            <div style={{ fontSize: 13 }}>{isAr ? 'جرب تغيير الفلتر' : 'Try adjusting your filters'}</div>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 130px 110px 100px 90px', gap: 0, padding: '10px 24px', background: '#F8FAFC', borderBottom: '1.5px solid #E9EBF0' }}>
              {(['#', isAr ? 'المعلم' : 'Tutor', isAr ? 'الطالب' : 'Student', isAr ? 'الموعد' : 'Scheduled', isAr ? 'الحالة' : 'Status', isAr ? 'المبلغ' : 'Amount', '']).map((h, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {filtered.map(s => {
              const scheduled = new Date(s.scheduled_at);
              const isPast = scheduled < new Date();
              return (
                <div key={s.id}
                  style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 130px 110px 100px 90px', gap: 0, padding: '13px 24px', borderBottom: '1px solid #F3F4F6', alignItems: 'center', cursor: 'pointer', transition: 'background 0.1s' }}
                  onClick={() => handleOpen(s.id)}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* ID */}
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF' }}>#{s.id}</div>

                  {/* Tutor */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #1B4965, #2D6A8F)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                      {s.tutor?.name?.charAt(0) || '?'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.tutor?.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{isAr ? s.subject?.name_ar : s.subject?.name_en}</div>
                    </div>
                  </div>

                  {/* Student */}
                  <div style={{ fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.student?.name}
                  </div>

                  {/* Scheduled */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isPast ? '#6B7280' : '#1A1A2E' }}>
                      {scheduled.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {scheduled.toLocaleTimeString(isAr ? 'ar-EG' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={s.status} isAr={isAr} />
                    {s.dispute && (
                      <div style={{ fontSize: 10, color: '#EF4444', fontWeight: 700, marginTop: 3 }}>⚖️ {isAr ? 'اعتراض' : 'Dispute'}</div>
                    )}
                  </div>

                  {/* Amount */}
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1B4965' }}>
                    {Number(s.gross_amount).toFixed(0)} EGP
                  </div>

                  {/* Action */}
                  <div>
                    <button
                      onClick={e => { e.stopPropagation(); handleOpen(s); }}
                      style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 12, fontWeight: 700, color: '#1B4965', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {isAr ? 'تفاصيل' : 'Details'}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {(meta?.last_page ?? 1) > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 24px', borderTop: '1px solid #F3F4F6' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontFamily: 'inherit', fontWeight: 600 }}
                >
                  {isAr ? '← السابق' : '← Prev'}
                </button>
                <span style={{ fontSize: 13, color: '#6B7280' }}>
                  {isAr ? `صفحة ${page} من ${meta?.last_page ?? 1}` : `Page ${page} of ${meta?.last_page ?? 1}`}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === (meta?.last_page ?? 1)}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#fff', cursor: page === (meta?.last_page ?? 1) ? 'not-allowed' : 'pointer', opacity: page === (meta?.last_page ?? 1) ? 0.4 : 1, fontFamily: 'inherit', fontWeight: 600 }}
                >
                  {isAr ? 'التالي →' : 'Next →'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ height: 32 }} />
    </>
  );
}
