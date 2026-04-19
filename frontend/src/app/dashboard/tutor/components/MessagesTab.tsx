'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tutorApi } from '@/lib/api';
import s from '../messages/messages.module.css';

// ─── Types ────────────────────────────────────────────────────────

interface ConvSummary {
  booking_id: number;
  status: string;
  lesson_type: string | null;
  payment_status: string;
  student: { id: number; name: string; avatar: string | null; phone: string | null; email: string | null };
  subject: { id: number; name_ar: string; name_en: string };
  last_message: { type: string; body: string | null; created_at: string } | null;
  unread_count: number;
  created_at: string;
}

interface CMessage {
  id: number;
  booking_request_id: number;
  sender_id: number;
  type: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
  sender: { id: number; name: string; avatar: string | null; role: string };
}

interface BookingDetail {
  id: number;
  status: string;
  lesson_type: string | null;
  payment_status: string;
  payment_token: string | null;
  lessons_count: number;
  total_amount: string;
  hourly_rate: string;
  confirmed_date: string | null;
  confirmed_time: string | null;
  student: { id: number; name: string; avatar: string | null; phone: string | null; email: string | null };
  subject: { name_ar: string; name_en: string };
}

interface Props { isAr: boolean }

type FilterStatus = 'all' | 'pending' | 'accepted' | 'rejected' | 'completed';

// ─── Hooks ────────────────────────────────────────────────────────

function useAuthUserId(): number | null {
  const [uid, setUid] = useState<number | null>(null);
  useEffect(() => {
    try { const u = JSON.parse(localStorage.getItem('alemnypro_user') || '{}'); if (u?.id) setUid(u.id); } catch { /* */ }
  }, []);
  return uid;
}

// ─── Helpers ──────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { ar: string; en: string; color: string; bg: string }> = {
  pending:   { ar: 'في الانتظار', en: 'Pending',   color: '#D97706', bg: 'rgba(217,119,6,0.1)'   },
  accepted:  { ar: 'مقبول',       en: 'Accepted',  color: '#059669', bg: 'rgba(5,150,105,0.1)'   },
  rejected:  { ar: 'مرفوض',       en: 'Rejected',  color: '#E11D48', bg: 'rgba(225,29,72,0.1)'   },
  completed: { ar: 'مكتمل',       en: 'Completed', color: '#2563EB', bg: 'rgba(37,99,235,0.1)'   },
  cancelled: { ar: 'ملغى',        en: 'Cancelled', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
};

function getStatus(st: string) { return STATUS_MAP[st] || { ar: st, en: st, color: '#6B7280', bg: '#F3F4F6' }; }

function initials(name: string) { return (name || '?').substring(0, 2).toUpperCase(); }

/** Resolve student/user avatar to a displayable URL, with a branded ui-avatars fallback */
function personAvatar(avatar: string | null | undefined, name: string): string | null {
  if (avatar && avatar.startsWith('http')) return avatar;
  if (avatar) {
    const base = 'http://127.0.0.1:8000';
    return `${base}/storage/${avatar.replace(/^\/?storage\//, '')}`;
  }
  const n = encodeURIComponent(name || 'S');
  return `https://ui-avatars.com/api/?name=${n}&size=200&background=0F766E&color=fff&bold=true&format=svg`;
}

function fmtTime(ts: string, isAr: boolean) {
  return new Date(ts).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/** Convert a raw "HH:MM" or "HH:MM:SS" string from the backend to 12-hour AM/PM */
function fmt12h(t: string, isAr = false): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? (isAr ? 'م' : 'PM') : (isAr ? 'ص' : 'AM');
  const hour12 = h % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Format an ISO date string or YYYY-MM-DD to a readable local date */
function fmtLocalDate(raw: string | null | undefined, isAr = false): string {
  if (!raw) return '';
  // Extract date part only (handles both ISO datetime and plain YYYY-MM-DD)
  const datePart = raw.split('T')[0];
  const [y, mo, d] = datePart.split('-').map(Number);
  const date = new Date(y, mo - 1, d); // local, no timezone shift
  return date.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDate(ts: string, isAr: boolean) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return isAr ? 'اليوم' : 'Today';
  if (d.toDateString() === yesterday.toDateString()) return isAr ? 'أمس' : 'Yesterday';
  return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' });
}

function lastMsgPreview(c: ConvSummary, isAr: boolean) {
  if (!c.last_message) return isAr ? 'لا توجد رسائل' : 'No messages';
  const t = c.last_message.type;
  const map: Record<string, string> = {
    booking_request:  isAr ? '📋 طلب حجز' : '📋 Booking request',
    booking_accepted: isAr ? '✅ تم القبول' : '✅ Accepted',
    booking_rejected: isAr ? '❌ تم الرفض' : '❌ Rejected',
    date_proposal:    isAr ? '📅 اقتراح موعد' : '📅 Date proposal',
    date_confirmed:   isAr ? '✅ موعد مؤكد' : '✅ Date confirmed',
    lesson_type_set:  isAr ? '🎯 نوع الحصة محدد' : '🎯 Lesson type set',
    payment_link:     isAr ? '💳 رابط الدفع' : '💳 Payment link',
    payment_completed:isAr ? '🎉 تم الدفع' : '🎉 Payment received',
    contact_shared:   isAr ? '📱 بيانات التواصل' : '📱 Contact shared',
  };
  return map[t] || c.last_message.body?.substring(0, 45) || '';
}

// ─── Modals ───────────────────────────────────────────────────────

function DateModal({ isAr, onClose, onSubmit, loading }: {
  isAr: boolean; onClose: () => void;
  onSubmit: (d: string, t: string) => void; loading: boolean;
}) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  return (
    <div className={s.modalBackdrop} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.modalTitle}>📅 {isAr ? 'اقتراح موعد' : 'Propose Date & Time'}</div>
        <div className={s.modalField}>
          <label className={s.modalLabel}>{isAr ? 'التاريخ' : 'Date'}</label>
          <input type="date" className={s.modalInput} value={date} onChange={e => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]} />
        </div>
        <div className={s.modalField}>
          <label className={s.modalLabel}>{isAr ? 'الوقت' : 'Time'}</label>
          <input type="time" className={s.modalInput} value={time} onChange={e => setTime(e.target.value)} />
        </div>
        <div className={s.modalFooter}>
          <button className={s.btnCancel} onClick={onClose}>{isAr ? 'إلغاء' : 'Cancel'}</button>
          <button className={s.btnPrimary} disabled={!date || !time || loading} onClick={() => onSubmit(date, time)}>
            {loading ? <span className={s.spinner} /> : (isAr ? 'إرسال الاقتراح' : 'Send Proposal')}
          </button>
        </div>
      </div>
    </div>
  );
}

function LessonModal({ isAr, hourlyRate, onClose, onSubmit, loading }: {
  isAr: boolean; hourlyRate: number; onClose: () => void;
  onSubmit: (type: string, count: number, rate: number) => void; loading: boolean;
}) {
  const [type, setType] = useState<'trial' | 'lessons'>('trial');
  const [count, setCount] = useState(5);
  const [rate, setRate] = useState(hourlyRate);
  const total = type === 'lessons' ? rate * count : 0;
  return (
    <div className={s.modalBackdrop} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.modalTitle}>🎯 {isAr ? 'تحديد نوع الحصة' : 'Set Lesson Type'}</div>
        <div className={s.typeToggle}>
          <button className={`${s.typeBtn} ${type === 'trial' ? s.typeBtnActive : ''}`} onClick={() => setType('trial')}>
            🎁 {isAr ? 'تجريبية' : 'Trial'}
          </button>
          <button className={`${s.typeBtn} ${type === 'lessons' ? s.typeBtnActive : ''}`} onClick={() => setType('lessons')}>
            📦 {isAr ? 'حصص مدفوعة' : 'Paid Lessons'}
          </button>
        </div>
        {type === 'trial' ? (
          <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#5B21B6' }}>
            ✨ {isAr ? 'مجانية — لا يتم توليد رابط دفع' : 'Free — no payment link generated'}
          </div>
        ) : (
          <>
            <div className={s.modalField}>
              <label className={s.modalLabel}>{isAr ? 'عدد الحصص' : 'Number of Lessons'}</label>
              <input type="number" className={s.modalInput} value={count} min={1} max={100}
                onChange={e => setCount(Number(e.target.value))} />
            </div>
            <div className={s.modalField}>
              <label className={s.modalLabel}>{isAr ? 'سعر الحصة (جنيه)' : 'Price per Lesson (EGP)'}</label>
              <input type="number" className={s.modalInput} value={rate} min={0}
                onChange={e => setRate(Number(e.target.value))} />
            </div>
            <div className={s.totalSummary}>
              <div className={s.totalLabel}>{isAr ? 'الإجمالي' : 'Total'}</div>
              <div className={s.totalValue}>{total.toFixed(0)} {isAr ? 'جنيه' : 'EGP'}</div>
            </div>
          </>
        )}
        <div className={s.modalFooter}>
          <button className={s.btnCancel} onClick={onClose}>{isAr ? 'إلغاء' : 'Cancel'}</button>
          <button className={s.btnPrimary} disabled={loading} onClick={() => onSubmit(type, count, rate)}>
            {loading ? <span className={s.spinner} /> : (isAr ? 'تأكيد' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Message Cards ────────────────────────────────────────────────

function BookingCard({ msg, isAr, bookingStatus, onAccept, onReject, accepting, rejecting }: {
  msg: CMessage; isAr: boolean; bookingStatus: string;
  onAccept: () => void; onReject: () => void;
  accepting: boolean; rejecting: boolean;
}) {
  const m = msg.metadata || {};
  return (
    <div className={s.cardBookingRequest}>
      <div className={s.cardTitle} style={{ color: '#92400E' }}>
        📋 {isAr ? 'طلب حجز جديد' : 'New Booking Request'}
      </div>
      <div className={s.cardRow}>
        <div className={s.cardDetail} style={{ color: '#78350F' }}>
          📚 <strong>{isAr ? String(m.subject_name_ar || '') : String(m.subject_name_en || '')}</strong>
          <span style={{ color: '#9CA3AF', marginInline: 4 }}>·</span>
          {m.lesson_format === 'online' ? (isAr ? '🖥️ أونلاين' : '🖥️ Online') : (isAr ? '🏠 حضوري' : '🏠 In-Person')}
        </div>
        {m.preferred_date && (
          <div className={s.cardDetail} style={{ color: '#92400E', fontSize: 12 }}>
            📅 {String(m.preferred_date)} {m.preferred_time ? `· ⏰ ${fmt12h(String(m.preferred_time), isAr)}` : ''}
          </div>
        )}
        {msg.body && (
          <div style={{
            fontSize: 13,
            color: '#1C1917',
            fontWeight: 500,
            fontStyle: 'normal',
            lineHeight: 1.6,
            paddingTop: 8,
            borderTop: '2px solid rgba(217,119,6,0.18)',
            marginTop: 6,
            background: 'rgba(255,255,255,0.55)',
            borderRadius: 8,
            padding: '8px 10px',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', display: 'block', marginBottom: 3 }}>
              💬 {isAr ? 'رسالة الطالب' : "Student's message"}
            </span>
            {msg.body}
          </div>
        )}
      </div>

      {bookingStatus === 'pending' && (
        <div className={s.cardActions}>
          <button className={s.btnAccept} onClick={onAccept} disabled={accepting || rejecting}>
            {accepting ? <span className={s.spinner} /> : '✓'} {isAr ? 'قبول الطلب' : 'Accept'}
          </button>
          <button className={s.btnDecline} onClick={onReject} disabled={accepting || rejecting}>
            {rejecting ? <span className={s.spinner} style={{ borderTopColor: '#E11D48', borderColor: 'rgba(225,29,72,0.2)' }} /> : '✕'} {isAr ? 'رفض' : 'Decline'}
          </button>
        </div>
      )}
      {bookingStatus !== 'pending' && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: getStatus(bookingStatus).bg, color: getStatus(bookingStatus).color, fontSize: 12, fontWeight: 700 }}>
          {bookingStatus === 'accepted' ? '✅' : '✕'} {isAr ? getStatus(bookingStatus).ar : getStatus(bookingStatus).en}
        </div>
      )}
    </div>
  );
}

function ContactCard({ msg, isAr }: { msg: CMessage; isAr: boolean }) {
  const m = msg.metadata || {};
  return (
    <div className={s.cardContact}>
      <div className={s.cardTitle} style={{ color: '#065F46' }}>
        📱 {isAr ? 'بيانات التواصل المشتركة' : 'Contact Details Shared'}
      </div>
      {m.phone && (
        <a href={`tel:${m.phone}`} className={s.contactLink} style={{ color: '#047857' }}>
          📞 <span>{String(m.phone)}</span>
        </a>
      )}
      {m.email && (
        <a href={`mailto:${m.email}`} className={s.contactLink} style={{ color: '#047857' }}>
          ✉️ <span>{String(m.email)}</span>
        </a>
      )}
      {m.whatsapp && (
        <a href={`https://wa.me/${String(m.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className={s.contactLink} style={{ color: '#25D366', borderBottom: 'none' }}>
          💬 <span>WhatsApp</span>
        </a>
      )}
    </div>
  );
}

function DateProposalCard({ msg, isAr, canConfirm, onConfirm, confirming }: {
  msg: CMessage; isAr: boolean; canConfirm: boolean; onConfirm: () => void; confirming: boolean;
}) {
  const m = msg.metadata || {};
  const byMe = m.proposed_by === 'tutor';
  return (
    <div className={s.cardDate} style={{ alignSelf: byMe ? 'flex-end' : 'flex-start' }}>
      <div className={s.cardTitle} style={{ color: '#1D4ED8' }}>📅 {isAr ? 'اقتراح موعد' : 'Date Proposal'}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1E40AF' }}>
        📆 {String(m.proposed_date || '')} &nbsp; ⏰ {String(m.proposed_time || '')}
      </div>
      <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 4 }}>
        {byMe ? (isAr ? 'أرسلتَ هذا الاقتراح' : 'You sent this') : (isAr ? 'اقتراح الطالب' : 'Student proposal')}
      </div>
      {canConfirm && !byMe && (
        <button className={s.btnConfirm} onClick={onConfirm} disabled={confirming}>
          {confirming ? <span className={s.spinner} style={{ width: 14, height: 14 }} /> : `✓ ${isAr ? 'تأكيد الموعد' : 'Confirm Date'}`}
        </button>
      )}
    </div>
  );
}

function DateConfirmedCard({ msg, isAr }: { msg: CMessage; isAr: boolean }) {
  const m = msg.metadata || {};
  return (
    <div className={s.cardDateConfirmed}>
      <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#065F46' }}>{isAr ? 'تم تأكيد الموعد!' : 'Date Confirmed!'}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#047857', marginTop: 6 }}>
        📆 {fmtLocalDate(String(m.confirmed_date || ''), isAr)}
        {m.confirmed_time ? <> &nbsp; ⏰ {fmt12h(String(m.confirmed_time), isAr)}</> : ''}
      </div>
    </div>
  );
}

function LessonTypeCard({ msg, isAr }: { msg: CMessage; isAr: boolean }) {
  const m = msg.metadata || {};
  const isTrial = m.lesson_type === 'trial';
  return (
    <div className={s.cardLesson} style={{
      alignSelf: 'flex-end',
      background: isTrial ? 'rgba(139,92,246,0.07)' : 'rgba(15,118,110,0.07)',
      border: `1px solid ${isTrial ? 'rgba(139,92,246,0.2)' : 'rgba(15,118,110,0.2)'}`,
    }}>
      <div className={s.cardTitle} style={{ color: isTrial ? '#5B21B6' : '#065F46' }}>
        {isTrial ? '🎁' : '📦'} {isAr ? (isTrial ? 'حصة تجريبية' : 'باقة حصص') : (isTrial ? 'Trial Class' : 'Lesson Package')}
      </div>
      {!isTrial ? (
        <>
          <div style={{ fontSize: 13, color: '#047857' }}>
            {String(m.lessons_count)} {isAr ? 'حصص' : 'lessons'} × {String(m.per_lesson_amount)} {isAr ? 'جنيه' : 'EGP'}
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#0F766E', marginTop: 4 }}>
            {isAr ? `الإجمالي: ${m.total_amount} جنيه` : `Total: ${m.total_amount} EGP`}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 13, color: '#5B21B6' }}>{isAr ? 'مجانية — لا دفع' : 'Free — no payment'}</div>
      )}
    </div>
  );
}

function PaymentLinkCard({ msg, isAr }: { msg: CMessage; isAr: boolean }) {
  const m = msg.metadata || {};
  return (
    <div className={s.cardPayment}>
      <div className={s.cardTitle} style={{ color: '#92400E' }}>💳 {isAr ? 'رابط الدفع' : 'Payment Link Sent'}</div>
      <div style={{ fontSize: 13, color: '#78350F', marginBottom: 10 }}>
        {String(m.lessons_count)} {isAr ? 'حصص —' : 'lessons —'} <strong>{String(m.amount)} {isAr ? 'جنيه' : 'EGP'}</strong>
      </div>
      <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 5 }}>
        ✓ {isAr ? 'تم إرسال الرابط للطالب عبر واتساب' : 'Link sent to student via WhatsApp'}
      </div>
    </div>
  );
}

function PaymentSuccessCard({ msg, isAr }: { msg: CMessage; isAr: boolean }) {
  const m = msg.metadata || {};
  return (
    <div className={s.cardPaymentSuccess}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#065F46' }}>{isAr ? 'تم الدفع بنجاح!' : 'Payment Received!'}</div>
      <div style={{ fontSize: 13, color: '#047857', marginTop: 6 }}>
        {String(m.lessons_count)} {isAr ? 'حصص —' : 'lessons —'} {String(m.amount)} {isAr ? 'جنيه' : 'EGP'}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export default function MessagesTab({ isAr }: Props) {
  const qc = useQueryClient();
  const myId = useAuthUserId();
  const endRef = useRef<HTMLDivElement>(null);

  const [activeId, setActiveId]             = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [inputVal, setInputVal]             = useState('');
  const [search, setSearch]                 = useState('');
  const [filter, setFilter]                 = useState<FilterStatus>('all');
  const [showDateModal, setShowDateModal]       = useState(false);
  const [showLessonModal, setShowLessonModal]   = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [accepting, setAccepting]           = useState(false);
  const [rejecting, setRejecting]           = useState(false);
  const [confirming, setConfirming]         = useState(false);

  // ── Conversations (refresh 15s)
  const { data: convData } = useQuery({
    queryKey: ['tutor-conversations'],
    queryFn: () => tutorApi.getConversations().then(r => r.data.data as ConvSummary[]),
    refetchInterval: 15000,
  });
  const allConv = convData || [];

  // ── Filtered / searched list
  const conversations = useMemo(() => {
    let list = allConv;
    if (filter !== 'all') list = list.filter(c => c.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        c.student?.name?.toLowerCase().includes(q) ||
        c.subject?.name_ar?.toLowerCase().includes(q) ||
        c.subject?.name_en?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allConv, filter, search]);

  // ── Stats
  const stats = useMemo(() => ({
    total:    allConv.length,
    pending:  allConv.filter(c => c.status === 'pending').length,
    active:   allConv.filter(c => c.status === 'accepted').length,
    unread:   allConv.reduce((a, c) => a + c.unread_count, 0),
  }), [allConv]);

  // ── Group conversations by student (one entry per student in sidebar)
  const studentGroups = useMemo(() => {
    const map = new Map<number, {
      student: ConvSummary['student'];
      bookings: ConvSummary[];
      totalUnread: number;
      latestMsg: ConvSummary['last_message'];
      latestTs: string;
    }>();
    conversations.forEach(c => {
      const sid = c.student.id;
      if (!map.has(sid)) {
        map.set(sid, { student: c.student, bookings: [], totalUnread: 0, latestMsg: null, latestTs: c.created_at });
      }
      const g = map.get(sid)!;
      g.bookings.push(c);
      g.totalUnread += c.unread_count;
      if (c.last_message && (!g.latestMsg || c.last_message.created_at > g.latestTs)) {
        g.latestMsg = c.last_message;
        g.latestTs  = c.last_message.created_at;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.latestTs.localeCompare(a.latestTs));
  }, [conversations]);

  // Select a student: auto-pick their best booking (pending first, else most recent)
  const handleSelectStudent = useCallback((studentId: number) => {
    setSelectedStudentId(studentId);
    const bookings = allConv.filter(c => c.student.id === studentId);
    const best = bookings.find(c => c.status === 'pending')
      || bookings.find(c => c.status === 'accepted')
      || bookings[0];
    if (best) setActiveId(best.booking_id);
  }, [allConv]);

  // Bookings for the currently selected student (used for tabs)
  const selectedStudentBookings = useMemo(() =>
    allConv.filter(c => c.student.id === selectedStudentId),
  [allConv, selectedStudentId]);

  // Auto-select first student on load
  useEffect(() => {
    if (!selectedStudentId && studentGroups.length > 0) {
      handleSelectStudent(studentGroups[0].student.id);
    }
  }, [studentGroups, selectedStudentId, handleSelectStudent]);

  // ── Messages (refresh 10s)
  const { data: chatData } = useQuery({
    queryKey: ['tutor-messages', activeId],
    queryFn: () => tutorApi.getConversationMessages(activeId!).then(r => r.data.data as { booking: BookingDetail; messages: CMessage[] }),
    enabled: !!activeId,
    refetchInterval: 10000,
  });

  const booking  = chatData?.booking;
  const messages = chatData?.messages || [];

  // Scroll to bottom
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  // Invalidate conversations on select
  useEffect(() => {
    if (activeId) qc.invalidateQueries({ queryKey: ['tutor-conversations'] });
  }, [activeId, qc]);

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['tutor-messages', activeId] });
    qc.invalidateQueries({ queryKey: ['tutor-conversations'] });
  }, [qc, activeId]);

  const handleErr = (e: unknown) => {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'حدث خطأ';
    setError(msg);
  };

  // ── Mutations
  const sendMsg = useMutation({
    mutationFn: (body: string) => tutorApi.sendMessage(activeId!, body),
    onSuccess: () => { setInputVal(''); invalidate(); },
    onError: handleErr,
  });

  const dateMut = useMutation({
    mutationFn: (d: { proposed_date: string; proposed_time: string }) => tutorApi.proposeDate(activeId!, d),
    onSuccess: () => { setShowDateModal(false); invalidate(); },
    onError: handleErr,
  });

  const confirmDateMut = useMutation({
    mutationFn: () => tutorApi.confirmDate(activeId!),
    onSuccess: () => { setConfirming(false); invalidate(); },
    onError: handleErr,
  });

  const lessonTypeMut = useMutation({
    mutationFn: (d: { lesson_type: string; lessons_count?: number; hourly_rate?: number }) => tutorApi.setLessonType(activeId!, d),
    onSuccess: () => { setShowLessonModal(false); invalidate(); },
    onError: handleErr,
  });

  const payLinkMut = useMutation({
    mutationFn: () => tutorApi.generatePaymentLink(activeId!),
    onSuccess: invalidate,
    onError: handleErr,
  });

  // Accept
  const handleAccept = async () => {
    setError(null); setAccepting(true);
    try { await tutorApi.acceptBookingChat(activeId!); invalidate(); }
    catch (e) { handleErr(e); }
    finally { setAccepting(false); }
  };

  // Reject
  const handleReject = async () => {
    setError(null); setRejecting(true);
    try { await tutorApi.rejectBookingChat(activeId!); invalidate(); }
    catch (e) { handleErr(e); }
    finally { setRejecting(false); }
  };

  // Confirm date
  const handleConfirmDate = async () => {
    setError(null); setConfirming(true);
    try { await confirmDateMut.mutateAsync(); }
    catch (e) { handleErr(e); setConfirming(false); }
  };

  const canPayLink = booking?.status === 'accepted' && booking?.lesson_type === 'lessons' && booking?.payment_status !== 'paid';
  const isClosed   = ['rejected', 'cancelled'].includes(booking?.status || '');

  // Group messages by day
  const grouped = useMemo(() => {
    const out: Array<{ day: string | null; msg: CMessage }> = [];
    let lastDay = '';
    messages.forEach(m => {
      const day = new Date(m.created_at).toDateString();
      out.push({ day: day !== lastDay ? day : null, msg: m });
      if (day !== lastDay) lastDay = day;
    });
    return out;
  }, [messages]);

  const FILTERS: { key: FilterStatus; ar: string; en: string }[] = [
    { key: 'all',      ar: 'الكل',        en: 'All'      },
    { key: 'pending',  ar: 'في الانتظار', en: 'Pending'  },
    { key: 'accepted', ar: 'مقبول',       en: 'Active'   },
    { key: 'rejected', ar: 'مرفوض',       en: 'Rejected' },
    { key: 'completed',ar: 'مكتمل',       en: 'Completed'},
  ];

  return (
    <div className={s.root}>

      {/* ── Modals ── */}
      {showDateModal && (
        <DateModal isAr={isAr} onClose={() => setShowDateModal(false)} loading={dateMut.isPending}
          onSubmit={(d, t) => dateMut.mutate({ proposed_date: d, proposed_time: t })} />
      )}
      {showLessonModal && booking && (
        <LessonModal isAr={isAr} hourlyRate={parseFloat(booking.hourly_rate || '0')}
          onClose={() => setShowLessonModal(false)} loading={lessonTypeMut.isPending}
          onSubmit={(type, count, rate) => lessonTypeMut.mutate({ lesson_type: type, lessons_count: count, hourly_rate: rate })} />
      )}

      {/* ── Stats Bar ── */}
      <div className={s.statsBar}>
        {[
          { icon: '💬', value: stats.total,   label: isAr ? 'محادثات' : 'Conversations', color: '#0F766E', bg: 'rgba(15,118,110,0.08)' },
          { icon: '⏳', value: stats.pending,  label: isAr ? 'في الانتظار' : 'Pending',   color: '#D97706', bg: 'rgba(217,119,6,0.08)'  },
          { icon: '✅', value: stats.active,   label: isAr ? 'نشطة' : 'Active',           color: '#059669', bg: 'rgba(5,150,105,0.08)'  },
          { icon: '🔔', value: stats.unread,   label: isAr ? 'غير مقروءة' : 'Unread',     color: '#E11D48', bg: 'rgba(225,29,72,0.08)'  },
        ].map((st, i) => (
          <div key={i} className={s.statCard}>
            <div className={s.statIcon} style={{ background: st.bg }}>{st.icon}</div>
            <div className={s.statBody}>
              <div className={s.statValue} style={{ color: st.color }}>{st.value}</div>
              <div className={s.statLabel}>{st.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Error bar ── */}
      {error && (
        <div className={s.errorToast}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B91C1C', fontWeight: 700, fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* ── Main grid ── */}
      <div className={s.mainGrid}>

        {/* ── Sidebar ── */}
        <div className={s.sidebar}>
          <div className={s.sidebarTop}>
            <div className={s.sidebarTitle}>
              {isAr ? 'مركز الرسائل' : 'Message Center'}
              <span className={s.totalBadge}>{studentGroups.length}</span>
            </div>

            {/* Search */}
            <div className={s.searchWrap}>
              <span className={s.searchIcon}>🔍</span>
              <input
                className={s.searchInput}
                placeholder={isAr ? 'ابحث عن طالب أو مادة...' : 'Search by student or subject...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', insetInlineEnd: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 14 }}>✕</button>
              )}
            </div>

            {/* Filter chips */}
            <div className={s.filterRow}>
              {FILTERS.map(f => (
                <button key={f.key} className={`${s.filterChip} ${filter === f.key ? s.filterChipActive : ''}`}
                  onClick={() => setFilter(f.key)}>
                  {isAr ? f.ar : f.en}
                  {f.key !== 'all' && allConv.filter(c => c.status === f.key).length > 0 && (
                    <span style={{ marginInlineStart: 3, opacity: 0.7 }}>({allConv.filter(c => c.status === f.key).length})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Student grouped list */}
          <div className={s.convList}>
            {studentGroups.length === 0 ? (
              <div className={s.convEmpty}>
                <div style={{ fontSize: 36 }}>{search ? '🔍' : '💬'}</div>
                <div>{search ? (isAr ? 'لا نتائج' : 'No results') : (isAr ? 'لا توجد محادثات' : 'No conversations')}</div>
              </div>
            ) : studentGroups.map(g => {
              const isActive = g.student.id === selectedStudentId;
              // pick most-urgent status for the pill
              const urgentStatus = g.bookings.find(b => b.status === 'pending')?.status
                || g.bookings.find(b => b.status === 'accepted')?.status
                || g.bookings[0]?.status || 'pending';
              const st = getStatus(urgentStatus);
              return (
                <div key={g.student.id}
                  className={`${s.convItem} ${isActive ? s.convItemActive : ''}`}
                  onClick={() => handleSelectStudent(g.student.id)}>
                  <div className={s.avatar} style={{ background: isActive ? 'linear-gradient(135deg, #0F766E, #0D9488)' : 'linear-gradient(135deg, #374151, #6B7280)', overflow: 'hidden', padding: 0 }}>
                    <img
                      src={personAvatar(g.student?.avatar, g.student?.name) || ''}
                      alt={g.student?.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
                      onError={e => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        (img.nextSibling as HTMLElement)?.style?.removeProperty('display');
                      }}
                    />
                    <span style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 'inherit', fontWeight: 700 }}>
                      {initials(g.student?.name)}
                    </span>
                    {g.bookings.some(b => b.status === 'accepted') && <span className={s.onlineDot} />}
                  </div>
                  <div className={s.convBody}>
                    <div className={s.convName}>{g.student?.name}</div>
                    <div className={s.convSub}>
                      {g.bookings.length > 1
                        ? (isAr ? `${g.bookings.length} محادثات` : `${g.bookings.length} bookings`)
                        : (isAr ? g.bookings[0]?.subject?.name_ar : g.bookings[0]?.subject?.name_en)}
                    </div>
                    <div className={s.convPreview}>
                      {g.latestMsg ? lastMsgPreview({ last_message: g.latestMsg } as ConvSummary, isAr) : (isAr ? 'لا توجد رسائل' : 'No messages')}
                    </div>
                  </div>
                  <div className={s.convMeta}>
                    {g.latestMsg && (
                      <div className={s.convTime}>{fmtDate(g.latestMsg.created_at, isAr)}</div>
                    )}
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: st.bg, color: st.color }}>
                      {isAr ? st.ar : st.en}
                    </span>
                    {g.totalUnread > 0 && <div className={s.unreadBadge}>{g.totalUnread}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Chat Panel ── */}
        <div className={s.chatWrap}>
          {!activeId || !booking ? (
            <div className={s.emptyChat}>
              <div className={s.emptyIcon}>💬</div>
              <div className={s.emptyTitle}>{isAr ? 'اختر محادثة' : 'Select a conversation'}</div>
              <div className={s.emptyText}>{isAr ? 'اختر محادثة من القائمة لبدء الرسائل' : 'Pick a conversation from the list to view messages'}</div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className={s.chatHeader}>
                <div className={s.avatarLg} style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={personAvatar(booking.student?.avatar, booking.student?.name) || ''}
                    alt={booking.student?.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                    onError={e => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                      (img.nextSibling as HTMLElement)?.style?.removeProperty('display');
                    }}
                  />
                  <span style={{ display: 'none', fontSize: 'inherit', fontWeight: 700 }}>
                    {initials(booking.student?.name)}
                  </span>
                </div>
                <div className={s.chatHeaderInfo}>
                  <div className={s.chatHeaderName}>{booking.student?.name}</div>
                  <div className={s.chatHeaderSub}>
                    📚 {isAr ? booking.subject?.name_ar : booking.subject?.name_en}
                    {booking.confirmed_date && <>&nbsp;·&nbsp; 📅 {fmtLocalDate(booking.confirmed_date, isAr)}
                    {booking.confirmed_time ? <> ⏰ {fmt12h(booking.confirmed_time, isAr)}</> : ''}
                    </>}
                    {booking.payment_status === 'paid' && <span style={{ color: '#059669', fontWeight: 700 }}>· 💰 {isAr ? 'مدفوع' : 'Paid'}</span>}
                  </div>
                </div>

                <div className={s.chatHeaderActions}>
                  {/* Status pill */}
                  {(() => { const st = getStatus(booking.status); return (
                    <span className={s.statusPill} style={{ background: st.bg, color: st.color }}>
                      {isAr ? st.ar : st.en}
                    </span>
                  );})()}
                  {/* WhatsApp direct link */}
                  {booking.student?.phone && (
                    <a href={`https://wa.me/${booking.student.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className={s.headerActionBtn} title="WhatsApp" style={{ color: '#25D366', borderColor: 'rgba(37,211,102,0.3)', textDecoration: 'none' }}>
                      💬
                    </a>
                  )}
                </div>
              </div>

              {/* Booking switcher tabs — only shown when student has >1 bookings */}
              {selectedStudentBookings.length > 1 && (
                <div style={{
                  display: 'flex', gap: 6, padding: '8px 16px',
                  borderBottom: '1px solid rgba(15,118,110,0.1)',
                  overflowX: 'auto', background: 'rgba(15,118,110,0.03)',
                  flexShrink: 0,
                }}>
                  {selectedStudentBookings.map(b => {
                    const st = getStatus(b.status);
                    const isTab = b.booking_id === activeId;
                    return (
                      <button key={b.booking_id} onClick={() => setActiveId(b.booking_id)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '5px 12px', borderRadius: 20, border: '1.5px solid',
                          borderColor: isTab ? '#0F766E' : 'rgba(15,118,110,0.2)',
                          background: isTab ? '#0F766E' : 'transparent',
                          color: isTab ? '#fff' : '#374151',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          whiteSpace: 'nowrap', transition: 'all 0.15s',
                        }}>
                        <span>{isAr ? b.subject?.name_ar : b.subject?.name_en}</span>
                        <span style={{
                          fontSize: 10, padding: '1px 6px', borderRadius: 10,
                          background: isTab ? 'rgba(255,255,255,0.2)' : st.bg,
                          color: isTab ? '#fff' : st.color, fontWeight: 700,
                        }}>
                          {isAr ? st.ar : st.en}
                        </span>
                        {b.unread_count > 0 && (
                          <span style={{ background: '#E11D48', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {b.unread_count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Messages */}
              <div className={s.messagesArea}>
                {messages.length === 0 && (
                  <div className={s.systemMsg}>{isAr ? 'لا توجد رسائل بعد' : 'No messages yet'}</div>
                )}
                {grouped.map(({ day, msg }) => {
                  const isFromMe = msg.sender_id === myId;

                  return (
                    <div key={msg.id} style={{ display: 'contents' }}>
                      {/* Day divider */}
                      {day && <div className={s.dayDivider}>{fmtDate(new Date(day).toISOString(), isAr)}</div>}

                      {/* Booking Request */}
                      {msg.type === 'booking_request' && (
                        <BookingCard msg={msg} isAr={isAr} bookingStatus={booking.status}
                          onAccept={handleAccept} onReject={handleReject}
                          accepting={accepting} rejecting={rejecting} />
                      )}

                      {/* Booking Accepted system */}
                      {msg.type === 'booking_accepted' && (
                        <div className={s.systemMsg}>✅ {isAr ? 'قبلتَ طلب الحجز' : 'You accepted the booking request'}</div>
                      )}

                      {/* Booking Rejected system */}
                      {msg.type === 'booking_rejected' && (
                        <div className={s.systemMsg}>✕ {isAr ? 'رفضتَ الطلب' : 'You declined the request'}{msg.body ? ` — ${msg.body}` : ''}</div>
                      )}

                      {/* Contact shared */}
                      {msg.type === 'contact_shared' && <ContactCard msg={msg} isAr={isAr} />}

                      {/* Date proposal */}
                      {msg.type === 'date_proposal' && (
                        <DateProposalCard msg={msg} isAr={isAr}
                          canConfirm={booking.status === 'accepted'}
                          onConfirm={handleConfirmDate} confirming={confirming} />
                      )}

                      {/* Date confirmed */}
                      {msg.type === 'date_confirmed' && <DateConfirmedCard msg={msg} isAr={isAr} />}

                      {/* Lesson type */}
                      {msg.type === 'lesson_type_set' && <LessonTypeCard msg={msg} isAr={isAr} />}

                      {/* Payment link */}
                      {msg.type === 'payment_link' && <PaymentLinkCard msg={msg} isAr={isAr} />}

                      {/* Payment completed */}
                      {msg.type === 'payment_completed' && <PaymentSuccessCard msg={msg} isAr={isAr} />}

                      {/* Text bubble */}
                      {msg.type === 'text' && (
                        <div className={isFromMe ? s.bubbleTutor : s.bubbleStudent}>
                          {msg.body}
                          <div className={s.bubbleTime}>
                            {fmtTime(msg.created_at, isAr)}
                            {isFromMe && <span className={s.readTick}>{msg.is_read ? '✓✓' : '✓'}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              {/* Toolbar (accepted only) */}
              {booking.status === 'accepted' && (
                <div className={s.toolbar}>
                  <button className={s.toolBtn} onClick={() => setShowDateModal(true)}>
                    📅 {isAr ? 'اقتراح موعد' : 'Propose Date'}
                  </button>
                  <button className={s.toolBtn} onClick={() => setShowLessonModal(true)}>
                    🎯 {isAr ? 'نوع الحصة' : 'Set Lesson Type'}
                  </button>
                  {canPayLink && (
                    <button className={`${s.toolBtn} ${s.toolBtnPay}`} onClick={() => { setError(null); payLinkMut.mutate(); }} disabled={payLinkMut.isPending}>
                      {payLinkMut.isPending ? <span className={s.spinner} style={{ borderTopColor: '#B45309', borderColor: 'rgba(180,83,9,0.2)' }} /> : '💰'}
                      {isAr ? 'توليد رابط دفع' : 'Generate Payment Link'}
                    </button>
                  )}
                </div>
              )}

              {/* Input row */}
              {!isClosed && (
                <div className={s.inputRow}>
                  <input
                    className={s.msgInput}
                    placeholder={isAr ? 'اكتب رسالتك...' : 'Type your message...'}
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && inputVal.trim()) { e.preventDefault(); sendMsg.mutate(inputVal.trim()); } }}
                  />
                  <button className={s.sendBtn}
                    onClick={() => inputVal.trim() && sendMsg.mutate(inputVal.trim())}
                    disabled={!inputVal.trim() || sendMsg.isPending}>
                    {sendMsg.isPending ? <span className={s.spinner} /> : (isAr ? '←' : '→')}
                  </button>
                </div>
              )}

              {/* Closed bar */}
              {isClosed && (
                <div className={s.closedBar}>
                  🔒 {isAr ? 'هذه المحادثة مغلقة' : 'This conversation is closed'}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
