'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/lib/api';
import { useLocale } from '@/lib/locale';
import StudentLayout from '@/components/layout/StudentLayout';
import s from '../../tutor/messages/messages.module.css';

// ─── Types ────────────────────────────────────────────────────────

interface ConvSummary {
  booking_id: number; status: string; lesson_type: string | null; payment_status: string;
  payment_token: string | null;
  tutor: { id: number; name: string; avatar: string | null; phone: string | null; email: string | null };
  subject: { id: number; name_ar: string; name_en: string };
  last_message: { type: string; body: string | null; created_at: string } | null;
  unread_count: number; created_at: string;
}

interface CMessage {
  id: number; booking_request_id: number; sender_id: number; type: string;
  body: string | null; metadata: Record<string, unknown> | null;
  is_read: boolean; created_at: string;
  sender: { id: number; name: string; avatar: string | null; role: string };
}

interface BookingDetail {
  id: number; status: string; lesson_type: string | null; payment_status: string;
  payment_token: string | null; lessons_count: number; total_amount: string;
  hourly_rate: string; confirmed_date: string | null; confirmed_time: string | null;
  tutor: { id: number; name: string; avatar: string | null; phone: string | null; email: string | null };
  subject: { name_ar: string; name_en: string };
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
  const datePart = raw.split('T')[0];
  const [y, mo, d] = datePart.split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  return date.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDate(ts: string, isAr: boolean) {
  const d = new Date(ts); const today = new Date(); const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return isAr ? 'اليوم' : 'Today';
  if (d.toDateString() === yesterday.toDateString()) return isAr ? 'أمس'   : 'Yesterday';
  return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' });
}

function lastMsgPreview(c: ConvSummary, isAr: boolean) {
  if (!c.last_message) return isAr ? 'لا توجد رسائل' : 'No messages';
  const t = c.last_message.type;
  const map: Record<string, string> = {
    booking_request:  isAr ? '📋 طلب حجزك' : '📋 Your booking request',
    booking_accepted: isAr ? '✅ تم القبول' : '✅ Accepted',
    booking_rejected: isAr ? '❌ تم الرفض' : '❌ Rejected',
    date_proposal:    isAr ? '📅 اقتراح موعد' : '📅 Date proposal',
    date_confirmed:   isAr ? '✅ موعد مؤكد' : '✅ Date confirmed',
    lesson_type_set:  isAr ? '🎯 نوع الحصة' : '🎯 Lesson type set',
    payment_link:     isAr ? '💳 رابط الدفع' : '💳 Payment link',
    payment_completed:isAr ? '🎉 تم الدفع' : '🎉 Payment received',
    contact_shared:   isAr ? '📱 بيانات التواصل' : '📱 Contact shared',
  };
  return map[t] || c.last_message.body?.substring(0, 45) || '';
}

function useAuthUserId(): number | null {
  const [uid, setUid] = useState<number | null>(null);
  useEffect(() => {
    try { const u = JSON.parse(localStorage.getItem('alemnypro_user') || '{}'); if (u?.id) setUid(u.id); } catch { /* */ }
  }, []);
  return uid;
}

// ─── Date Modal ───────────────────────────────────────────────────

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
          <button className={s.btnPrimary} disabled={!date || !time || loading} onClick={() => onSubmit(date, time)}
            style={{ background: 'linear-gradient(135deg, #1B4965, #2D6A8E)' }}>
            {loading ? <span className={s.spinner} /> : (isAr ? 'إرسال الاقتراح' : 'Send Proposal')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Student Messages Page ────────────────────────────────────────

export default function StudentMessagesPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const qc = useQueryClient();
  const myId = useAuthUserId();
  const endRef = useRef<HTMLDivElement>(null);

  const [activeId, setActiveId]         = useState<number | null>(null);
  const [selectedTutorId, setSelectedTutorId] = useState<number | null>(null);
  const [inputVal, setInputVal]         = useState('');
  const [search, setSearch]             = useState('');
  const [filter, setFilter]             = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');
  const [showDateModal, setShowDateModal] = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [confirming, setConfirming]     = useState(false);

  // Conversations list
  const { data: convData } = useQuery({
    queryKey: ['student-conversations'],
    queryFn: () => studentApi.getConversations().then(r => r.data.data as ConvSummary[]),
    refetchInterval: 15000,
  });
  const allConv = convData || [];

  // Filter + search
  const conversations = useMemo(() => {
    let list = allConv;
    if (filter !== 'all') list = list.filter(c => c.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        c.tutor?.name?.toLowerCase().includes(q) ||
        c.subject?.name_ar?.toLowerCase().includes(q) ||
        c.subject?.name_en?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allConv, filter, search]);

  // Group by tutor
  const tutorGroups = useMemo(() => {
    const map = new Map<number, {
      tutor: ConvSummary['tutor'];
      bookings: ConvSummary[];
      totalUnread: number;
      latestMsg: ConvSummary['last_message'];
      latestTs: string;
    }>();
    conversations.forEach(c => {
      const tid = c.tutor.id;
      if (!map.has(tid)) {
        map.set(tid, { tutor: c.tutor, bookings: [], totalUnread: 0, latestMsg: null, latestTs: c.created_at });
      }
      const g = map.get(tid)!;
      g.bookings.push(c);
      g.totalUnread += c.unread_count;
      if (c.last_message && (!g.latestMsg || c.last_message.created_at > g.latestTs)) {
        g.latestMsg = c.last_message;
        g.latestTs  = c.last_message.created_at;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.latestTs.localeCompare(a.latestTs));
  }, [conversations]);

  const handleSelectTutor = useCallback((tutorId: number) => {
    setSelectedTutorId(tutorId);
    const bookings = allConv.filter(c => c.tutor.id === tutorId);
    const best = bookings.find(c => c.status === 'pending')
      || bookings.find(c => c.status === 'accepted')
      || bookings[0];
    if (best) setActiveId(best.booking_id);
  }, [allConv]);

  const selectedTutorBookings = useMemo(() =>
    allConv.filter(c => c.tutor.id === selectedTutorId),
  [allConv, selectedTutorId]);

  useEffect(() => {
    if (!selectedTutorId && tutorGroups.length > 0) handleSelectTutor(tutorGroups[0].tutor.id);
  }, [tutorGroups, selectedTutorId, handleSelectTutor]);

  // Messages for active conv
  const { data: chatData, isLoading: chatLoading } = useQuery({
    queryKey: ['student-messages', activeId],
    queryFn: () => studentApi.getConversationMessages(activeId!).then(r => r.data.data as { booking: BookingDetail; messages: CMessage[] }),
    enabled: !!activeId,
    refetchInterval: 10000,
  });

  const booking  = chatData?.booking;
  const messages = chatData?.messages || [];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);
  useEffect(() => { if (activeId) qc.invalidateQueries({ queryKey: ['student-conversations'] }); }, [activeId, qc]);

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['student-messages', activeId] });
    qc.invalidateQueries({ queryKey: ['student-conversations'] });
  }, [qc, activeId]);

  const handleErr = (e: unknown) => {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'حدث خطأ';
    setError(msg);
  };

  // Mutations
  const sendMsg = useMutation({
    mutationFn: (body: string) => studentApi.sendMessage(activeId!, body),
    onSuccess: () => { setInputVal(''); invalidate(); },
    onError: handleErr,
  });

  const dateMut = useMutation({
    mutationFn: (d: { proposed_date: string; proposed_time: string }) => studentApi.proposeDate(activeId!, d),
    onSuccess: () => { setShowDateModal(false); invalidate(); },
    onError: handleErr,
  });

  const handleConfirm = async () => {
    setConfirming(true); setError(null);
    try { await studentApi.confirmDate(activeId!); invalidate(); }
    catch (e) { handleErr(e); }
    finally { setConfirming(false); }
  };

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

  const isClosed = ['rejected', 'cancelled'].includes(booking?.status || '');

  const FILTERS = [
    { key: 'all'      as const, ar: 'الكل',        en: 'All'      },
    { key: 'pending'  as const, ar: 'في الانتظار', en: 'Pending'  },
    { key: 'accepted' as const, ar: 'نشطة',        en: 'Active'   },
    { key: 'completed'as const, ar: 'مكتملة',      en: 'Completed'},
  ];

  // Student brand: navy (#1B4965) instead of teal
  const BRAND = { gradient: 'linear-gradient(135deg, #1B4965, #2D6A8E)', color: '#1B4965', shadow: 'rgba(27,73,101,0.3)' };

  return (
    <StudentLayout
      title={isAr ? '💬 مركز الرسائل' : '💬 Message Center'}
      subtitle={isAr ? 'تواصل مع معلميك وتابع طلبات الحجز والحصص من مكان واحد' : 'Talk to your tutors and track your bookings, scheduling & payments in one place'}
    >

        {/* ── Modals ── */}
        {showDateModal && (
          <DateModal isAr={isAr} onClose={() => setShowDateModal(false)} loading={dateMut.isPending}
            onSubmit={(d, t) => dateMut.mutate({ proposed_date: d, proposed_time: t })} />
        )}

        {/* ── Error toast ── */}
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
                {isAr ? 'محادثاتي' : 'My Conversations'}
                <span className={s.totalBadge} style={{ background: 'rgba(27,73,101,0.1)', color: '#1B4965' }}>{tutorGroups.length}</span>
              </div>

              {/* Search */}
              <div className={s.searchWrap}>
                <span className={s.searchIcon}>🔍</span>
                <input className={s.searchInput}
                  placeholder={isAr ? 'ابحث عن معلم أو مادة...' : 'Search by tutor or subject...'}
                  value={search} onChange={e => setSearch(e.target.value)} />
                {search && (
                  <button onClick={() => setSearch('')} style={{ position: 'absolute', insetInlineEnd: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 14 }}>✕</button>
                )}
              </div>

              {/* Filter chips */}
              <div className={s.filterRow}>
                {FILTERS.map(f => (
                  <button key={f.key} className={`${s.filterChip} ${filter === f.key ? s.filterChipActive : ''}`}
                    onClick={() => setFilter(f.key)}
                    style={filter === f.key ? { borderColor: '#1B4965', background: 'rgba(27,73,101,0.08)', color: '#1B4965' } : {}}>
                    {isAr ? f.ar : f.en}
                    {f.key !== 'all' && allConv.filter(c => c.status === f.key).length > 0 && (
                      <span style={{ marginInlineStart: 3, opacity: 0.7 }}>
                        ({allConv.filter(c => c.status === f.key).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tutor grouped list */}
            <div className={s.convList}>
              {tutorGroups.length === 0 ? (
                <div className={s.convEmpty}>
                  <div style={{ fontSize: 36 }}>{search ? '🔍' : '📚'}</div>
                  <div style={{ fontWeight: 700, color: '#374151' }}>
                    {search ? (isAr ? 'لا نتائج' : 'No results') : (isAr ? 'لا توجد محادثات بعد' : 'No conversations yet')}
                  </div>
                  {!search && (
                    <a href="/search" style={{ color: '#1B4965', fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>
                      🔍 {isAr ? 'ابحث عن معلم' : 'Find a tutor'}
                    </a>
                  )}
                </div>
              ) : tutorGroups.map(g => {
                const isActive = g.tutor.id === selectedTutorId;
                const urgentStatus = g.bookings.find(b => b.status === 'pending')?.status
                  || g.bookings.find(b => b.status === 'accepted')?.status
                  || g.bookings[0]?.status || 'pending';
                const st = getStatus(urgentStatus);
                return (
                  <div key={g.tutor.id}
                    className={`${s.convItem} ${isActive ? s.convItemActive : ''}`}
                    style={isActive ? { borderInlineStartColor: '#1B4965' } : {}}
                    onClick={() => handleSelectTutor(g.tutor.id)}>
                    <div className={s.avatar} style={{ background: isActive ? BRAND.gradient : 'linear-gradient(135deg, #374151, #6B7280)' }}>
                      {initials(g.tutor?.name)}
                      {g.bookings.some(b => b.status === 'accepted') && <span className={s.onlineDot} />}
                    </div>
                    <div className={s.convBody}>
                      <div className={s.convName}>{g.tutor?.name}</div>
                      <div className={s.convSub}>
                        {g.bookings.length > 1
                          ? (isAr ? `${g.bookings.length} حجوزات` : `${g.bookings.length} bookings`)
                          : (isAr ? g.bookings[0]?.subject?.name_ar : g.bookings[0]?.subject?.name_en)}
                      </div>
                      <div className={s.convPreview}>
                        {g.latestMsg ? lastMsgPreview({ last_message: g.latestMsg } as ConvSummary, isAr) : (isAr ? 'لا توجد رسائل' : 'No messages')}
                      </div>
                    </div>
                    <div className={s.convMeta}>
                      {g.latestMsg && <div className={s.convTime}>{fmtDate(g.latestMsg.created_at, isAr)}</div>}
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: st.bg, color: st.color }}>
                        {isAr ? st.ar : st.en}
                      </span>
                      {g.totalUnread > 0 && (
                        <div className={s.unreadBadge} style={{ background: '#1B4965' }}>{g.totalUnread}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Chat panel ── */}
          <div className={s.chatWrap}>
            {!activeId || !booking ? (
              <div className={s.emptyChat}>
                <div className={s.emptyIcon} style={{ background: 'linear-gradient(135deg, rgba(27,73,101,0.08), rgba(45,106,142,0.04))', borderColor: 'rgba(27,73,101,0.12)' }}>
                  💬
                </div>
                <div className={s.emptyTitle}>
                  {chatLoading ? (isAr ? 'جاري التحميل...' : 'Loading...') : (isAr ? 'اختر محادثة' : 'Select a conversation')}
                </div>
                <div className={s.emptyText}>
                  {isAr ? 'اختر محادثة من القائمة لبدء التواصل مع معلمك' : 'Pick a conversation from the list to start chatting with your tutor'}
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className={s.chatHeader}>
                  <div className={s.avatarLg} style={{ background: BRAND.gradient, boxShadow: `0 3px 12px ${BRAND.shadow}` }}>
                    {initials(booking.tutor?.name)}
                  </div>
                  <div className={s.chatHeaderInfo}>
                    <div className={s.chatHeaderName}>{booking.tutor?.name}</div>
                    <div className={s.chatHeaderSub}>
                      📚 {isAr ? booking.subject?.name_ar : booking.subject?.name_en}
                      {booking.confirmed_date && <>&nbsp;·&nbsp; 📅 {fmtLocalDate(booking.confirmed_date, isAr)}
                      {booking.confirmed_time ? <> ⏰ {fmt12h(booking.confirmed_time, isAr)}</> : ''}
                      </>}
                      {booking.payment_status === 'paid' && (
                        <span style={{ color: '#059669', fontWeight: 700 }}>&nbsp;· 💰 {isAr ? 'مدفوع' : 'Paid'}</span>
                      )}
                    </div>
                  </div>
                  <div className={s.chatHeaderActions}>
                    {(() => { const st = getStatus(booking.status); return (
                      <span className={s.statusPill} style={{ background: st.bg, color: st.color }}>
                        {isAr ? st.ar : st.en}
                      </span>
                    ); })()}
                    {booking.tutor?.phone && (
                      <a href={`https://wa.me/${booking.tutor.phone.replace(/\D/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className={s.headerActionBtn}
                        style={{ color: '#25D366', borderColor: 'rgba(37,211,102,0.3)', textDecoration: 'none' }}>
                        💬
                      </a>
                    )}
                  </div>
                </div>

                {/* Booking switcher tabs — only shown when tutor has >1 bookings */}
                {selectedTutorBookings.length > 1 && (
                  <div style={{
                    display: 'flex', gap: 6, padding: '8px 16px',
                    borderBottom: '1px solid rgba(27,73,101,0.1)',
                    overflowX: 'auto', background: 'rgba(27,73,101,0.03)',
                    flexShrink: 0,
                  }}>
                    {selectedTutorBookings.map(b => {
                      const st = getStatus(b.status);
                      const isTab = b.booking_id === activeId;
                      return (
                        <button key={b.booking_id} onClick={() => setActiveId(b.booking_id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '5px 12px', borderRadius: 20, border: '1.5px solid',
                            borderColor: isTab ? '#1B4965' : 'rgba(27,73,101,0.2)',
                            background: isTab ? '#1B4965' : 'transparent',
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
                    const m = msg.metadata || {};

                    return (
                      <div key={msg.id} style={{ display: 'contents' }}>
                        {/* Day divider */}
                        {day && <div className={s.dayDivider}>{fmtDate(new Date(day).toISOString(), isAr)}</div>}

                        {/* ── Booking Request ── */}
                        {msg.type === 'booking_request' && (
                          <div className={s.cardBookingRequest}>
                            <div className={s.cardTitle} style={{ color: '#92400E' }}>
                              📋 {isAr ? 'طلبك للحجز' : 'Your Booking Request'}
                            </div>
                            <div className={s.cardRow}>
                              <div className={s.cardDetail} style={{ color: '#78350F' }}>
                                📚 <strong>{isAr ? String(m.subject_name_ar || '') : String(m.subject_name_en || '')}</strong>
                                <span style={{ color: '#9CA3AF', marginInline: 4 }}>·</span>
                                {m.lesson_format === 'online' ? (isAr ? '🖥️ أونلاين' : '🖥️ Online') : (isAr ? '🏠 حضوري' : '🏠 In-Person')}
                              </div>
                              {Boolean(m.preferred_date) && (
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
                                  marginTop: 6,
                                  background: 'rgba(255,255,255,0.55)',
                                  borderRadius: 8,
                                  padding: '8px 10px',
                                  borderTop: '2px solid rgba(217,119,6,0.18)',
                                  paddingTop: 8,
                                }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', display: 'block', marginBottom: 3 }}>
                                    💬 {isAr ? 'رسالتك' : 'Your message'}
                                  </span>
                                  {msg.body}
                                </div>
                              )}
                            </div>
                            <div>
                              {booking.status === 'pending' && (
                                <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, background: 'rgba(217,119,6,0.1)', color: '#B45309', fontWeight: 700 }}>
                                  ⏳ {isAr ? 'في انتظار رد المعلم' : 'Awaiting tutor response'}
                                </span>
                              )}
                              {booking.status === 'accepted' && (
                                <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, background: 'rgba(5,150,105,0.1)', color: '#059669', fontWeight: 700 }}>
                                  ✅ {isAr ? 'تم القبول' : 'Accepted'}
                                </span>
                              )}
                              {booking.status === 'rejected' && (
                                <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, background: 'rgba(225,29,72,0.1)', color: '#E11D48', fontWeight: 700 }}>
                                  ✕ {isAr ? 'تم الرفض' : 'Declined'}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Booking accepted */}
                        {msg.type === 'booking_accepted' && (
                          <div className={s.systemMsg} style={{ background: 'rgba(5,150,105,0.06)', color: '#065F46', borderRadius: 12, padding: '8px 18px', fontWeight: 700, maxWidth: '80%', alignSelf: 'center', textAlign: 'center' }}>
                            🎉 {isAr ? 'قبل المعلم طلبك! تواصل معه من بيانات أدناه.' : 'The tutor accepted your request! See contact info below.'}
                          </div>
                        )}

                        {/* Booking rejected */}
                        {msg.type === 'booking_rejected' && (
                          <div className={s.systemMsg} style={{ background: 'rgba(225,29,72,0.06)', color: '#B91C1C', borderRadius: 12, padding: '8px 18px', fontWeight: 700, maxWidth: '80%', alignSelf: 'center', textAlign: 'center' }}>
                            😔 {isAr ? 'عذراً، رفض المعلم طلبك.' : 'Sorry, the tutor declined your request.'}
                            {msg.body && <div style={{ fontSize: 12, fontWeight: 400, marginTop: 4 }}>{msg.body}</div>}
                          </div>
                        )}

                        {/* Contact shared */}
                        {msg.type === 'contact_shared' && (
                          <div className={s.cardContact}>
                            <div className={s.cardTitle} style={{ color: '#065F46' }}>
                              📱 {isAr ? 'بيانات تواصل المعلم' : "Tutor's Contact Details"}
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
                        )}

                        {/* Date proposal */}
                        {msg.type === 'date_proposal' && (() => {
                          const byTutor = m.proposed_by === 'tutor';
                          return (
                            <div className={s.cardDate} style={{ alignSelf: byTutor ? 'flex-start' : 'flex-end' }}>
                              <div className={s.cardTitle} style={{ color: '#1D4ED8' }}>📅 {isAr ? 'اقتراح موعد' : 'Date Proposal'}</div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: '#1E40AF' }}>
                                📆 {String(m.proposed_date || '')} &nbsp; ⏰ {String(m.proposed_time || '')}
                              </div>
                              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 4 }}>
                                {byTutor ? (isAr ? 'اقتراح المعلم' : 'Tutor proposal') : (isAr ? 'أرسلتَ هذا الاقتراح' : 'You sent this')}
                              </div>
                              {byTutor && booking.status === 'accepted' && (
                                <button className={s.btnConfirm} onClick={handleConfirm} disabled={confirming}
                                  style={{ background: BRAND.gradient }}>
                                  {confirming ? <span className={s.spinner} style={{ width: 14, height: 14 }} /> : `✓ ${isAr ? 'تأكيد الموعد' : 'Confirm Date'}`}
                                </button>
                              )}
                            </div>
                          );
                        })()}

                        {/* Date confirmed */}
                        {msg.type === 'date_confirmed' && (
                          <div className={s.cardDateConfirmed}>
                            <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#065F46' }}>{isAr ? 'تم تأكيد الموعد!' : 'Date Confirmed!'}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#047857', marginTop: 6 }}>
                              📆 {fmtLocalDate(String(m.confirmed_date || ''), isAr)}
                              {m.confirmed_time ? <> &nbsp; ⏰ {fmt12h(String(m.confirmed_time), isAr)}</> : ''}
                            </div>
                          </div>
                        )}

                        {/* Lesson type */}
                        {msg.type === 'lesson_type_set' && (() => {
                          const isTrial = m.lesson_type === 'trial';
                          return (
                            <div className={s.cardLesson} style={{
                              alignSelf: 'flex-start',
                              background: isTrial ? 'rgba(139,92,246,0.07)' : 'rgba(27,73,101,0.07)',
                              border: `1px solid ${isTrial ? 'rgba(139,92,246,0.2)' : 'rgba(27,73,101,0.2)'}`,
                            }}>
                              <div className={s.cardTitle} style={{ color: isTrial ? '#5B21B6' : '#1B4965' }}>
                                {isTrial ? '🎁' : '📦'} {isAr ? (isTrial ? 'حصة تجريبية' : 'باقة حصص') : (isTrial ? 'Trial Class' : 'Lesson Package')}
                              </div>
                              {!isTrial ? (
                                <>
                                  <div style={{ fontSize: 13, color: '#1B4965' }}>
                                    {String(m.lessons_count)} {isAr ? 'حصص' : 'lessons'} × {String(m.per_lesson_amount)} {isAr ? 'جنيه' : 'EGP'}
                                  </div>
                                  <div style={{ fontSize: 20, fontWeight: 900, color: '#1B4965', marginTop: 4 }}>
                                    {isAr ? `الإجمالي: ${m.total_amount} جنيه` : `Total: ${m.total_amount} EGP`}
                                  </div>
                                </>
                              ) : (
                                <div style={{ fontSize: 13, color: '#5B21B6' }}>{isAr ? 'مجانية — لا دفع مطلوب' : 'Free — no payment required'}</div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Payment link — student sees Pay Now button */}
                        {msg.type === 'payment_link' && (
                          <div className={s.cardContact} style={{ alignSelf: 'flex-start', background: 'linear-gradient(135deg, rgba(217,119,6,0.08), rgba(245,158,11,0.04))', borderColor: 'rgba(217,119,6,0.22)' }}>
                            <div className={s.cardTitle} style={{ color: '#92400E' }}>💳 {isAr ? 'رابط الدفع جاهز!' : 'Payment Link Ready!'}</div>
                            <div style={{ fontSize: 14, color: '#78350F', fontWeight: 600, marginBottom: 12 }}>
                              {String(m.lessons_count)} {isAr ? 'حصص —' : 'lessons —'} <strong>{String(m.amount)} {isAr ? 'جنيه' : 'EGP'}</strong>
                            </div>
                            {booking.payment_status !== 'paid' ? (
                              <a href={String(m.payment_url || '#')} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 10, background: 'linear-gradient(135deg, #D97706, #B45309)', color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: 14, boxShadow: '0 3px 12px rgba(217,119,6,0.35)' }}>
                                ⚡ {isAr ? 'ادفع الآن' : 'Pay Now'}
                              </a>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#059669', fontWeight: 700, padding: '6px 12px', borderRadius: 8, background: 'rgba(5,150,105,0.1)' }}>
                                ✅ {isAr ? 'تم الدفع' : 'Paid'}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Payment completed */}
                        {msg.type === 'payment_completed' && (
                          <div className={s.cardPaymentSuccess}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#065F46' }}>{isAr ? 'تم الدفع بنجاح!' : 'Payment Successful!'}</div>
                            <div style={{ fontSize: 13, color: '#047857', marginTop: 6 }}>
                              {String(m.lessons_count)} {isAr ? 'حصص —' : 'lessons —'} {String(m.amount)} {isAr ? 'جنيه' : 'EGP'}
                            </div>
                          </div>
                        )}

                        {/* Text bubble — student = right/navy, tutor = left/gray */}
                        {msg.type === 'text' && (
                          <div className={isFromMe ? s.bubbleTutor : s.bubbleStudent}
                            style={isFromMe ? { background: BRAND.gradient, boxShadow: `0 2px 10px ${BRAND.shadow}` } : {}}>
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

                {/* Toolbar */}
                {booking.status === 'accepted' && (
                  <div className={s.toolbar}>
                    <button className={s.toolBtn} onClick={() => setShowDateModal(true)}
                      style={{ borderColor: 'rgba(27,73,101,0.3)' }}>
                      📅 {isAr ? 'اقتراح موعد' : 'Propose Date'}
                    </button>
                  </div>
                )}

                {/* Input */}
                {!isClosed && (
                  <div className={s.inputRow}>
                    <input className={s.msgInput}
                      placeholder={isAr ? 'اكتب رسالتك للمعلم...' : 'Type your message to the tutor...'}
                      value={inputVal}
                      onChange={e => setInputVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && inputVal.trim()) { e.preventDefault(); sendMsg.mutate(inputVal.trim()); } }} />
                    <button className={s.sendBtn} style={{ background: BRAND.gradient, boxShadow: `0 3px 10px ${BRAND.shadow}` }}
                      onClick={() => inputVal.trim() && sendMsg.mutate(inputVal.trim())}
                      disabled={!inputVal.trim() || sendMsg.isPending}>
                      {sendMsg.isPending ? <span className={s.spinner} /> : (isAr ? '←' : '→')}
                    </button>
                  </div>
                )}

                {/* Closed */}
                {isClosed && (
                  <div className={s.closedBar}>
                    🔒 {isAr ? 'هذه المحادثة مغلقة' : 'This conversation is closed'}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
    </StudentLayout>
  );
}
