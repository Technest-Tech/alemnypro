'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { adminApi } from '@/lib/api';

const STATUS_BADGE: Record<string, { bg: string; color: string; ar: string; en: string }> = {
  open:             { bg: '#FEF9C3', color: '#CA8A04', ar: 'مفتوح',          en: 'Open'           },
  resolved_tutor:   { bg: '#F0FDF4', color: '#16A34A', ar: 'حُسم للمدرس',    en: 'Resolved: Tutor' },
  resolved_student: { bg: '#EFF6FF', color: '#2563EB', ar: 'حُسم للطالب',    en: 'Resolved: Student' },
  closed:           { bg: '#F3F4F6', color: '#6B7280', ar: 'مغلق',           en: 'Closed'         },
};

interface Dispute {
  id: number; status: string; reason: string; evidence_link?: string;
  created_at: string; resolved_at?: string; admin_note?: string;
  raised_by?: { name: string }; resolved_by?: { name: string };
  session?: {
    id: number; recording_link?: string; gross_amount: number; tutor_payout: number;
    subject?: { name_ar?: string; name_en?: string };
    tutor?: { name: string }; student?: { name: string };
  };
}

export default function AdminDisputesPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const qc   = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('open');
  const [resolving, setResolving]       = useState<Dispute | null>(null);
  const [resolution, setResolution]     = useState<'tutor' | 'student' | null>(null);
  const [adminNote, setAdminNote]       = useState('');
  const [resolveErr, setResolveErr]     = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-disputes', statusFilter],
    queryFn: () => adminApi.getDisputes(statusFilter !== 'all' ? { status: statusFilter } : {}).then(r => r.data.data),
  });

  const disputes: Dispute[] = (data as { data?: Dispute[] })?.data ?? (data as Dispute[]) ?? [];

  const resolveMut = useMutation({
    mutationFn: () => adminApi.resolveDispute(resolving!.id, { resolution: resolution!, admin_note: adminNote }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] });
      setResolving(null); setResolution(null); setAdminNote('');
    },
    onError: () => setResolveErr(isAr ? 'حدث خطأ' : 'Error'),
  });

  return (
    <>
      {/* Resolve Modal */}
      {resolving && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 800 }}>
              ⚖️ {isAr ? 'حسم الاعتراض' : 'Resolve Dispute'} #{resolving.id}
            </h2>

            {/* Session info */}
            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', marginBottom: 18, fontSize: 13 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                {resolving.session?.subject?.name_ar || resolving.session?.subject?.name_en}
              </div>
              <div style={{ color: '#6B7280' }}>
                👨‍🏫 {resolving.session?.tutor?.name} · 👨‍🎓 {resolving.session?.student?.name}
              </div>
              <div style={{ color: '#6B7280', marginTop: 4 }}>
                💰 {resolving.session?.gross_amount} EGP — {isAr ? 'أرباح المدرس' : 'Tutor payout'}: {resolving.session?.tutor_payout} EGP
              </div>
              {resolving.session?.recording_link && (
                <a href={resolving.session.recording_link} target="_blank" rel="noreferrer"
                  style={{ display: 'block', marginTop: 6, color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>
                  📹 {isAr ? 'مشاهدة التسجيل' : 'View Recording'} ↗
                </a>
              )}
            </div>

            {/* Student reason */}
            <div style={{ background: '#FEF9C3', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 13, color: '#92400E' }}>
              <strong>{isAr ? 'سبب الاعتراض:' : 'Student Reason:'}</strong> {resolving.reason}
              {resolving.evidence_link && (
                <a href={resolving.evidence_link} target="_blank" rel="noreferrer"
                  style={{ display: 'block', marginTop: 4, color: '#2563EB', fontWeight: 700 }}>
                  📎 {isAr ? 'دليل الطالب' : 'Student Evidence'} ↗
                </a>
              )}
            </div>

            {/* Resolution choice */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              <button onClick={() => setResolution('tutor')}
                style={{ padding: '14px 10px', borderRadius: 12, border: `2px solid ${resolution === 'tutor' ? '#16A34A' : '#E5E7EB'}`,
                  background: resolution === 'tutor' ? '#F0FDF4' : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.15s' }}>
                👨‍🏫 {isAr ? 'حسم للمدرس' : 'Rule for Tutor'}
                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 400, marginTop: 4 }}>{isAr ? 'إطلاق الأرباح' : 'Release payout'}</div>
              </button>
              <button onClick={() => setResolution('student')}
                style={{ padding: '14px 10px', borderRadius: 12, border: `2px solid ${resolution === 'student' ? '#2563EB' : '#E5E7EB'}`,
                  background: resolution === 'student' ? '#EFF6FF' : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.15s' }}>
                👨‍🎓 {isAr ? 'حسم للطالب' : 'Rule for Student'}
                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 400, marginTop: 4 }}>{isAr ? 'استرداد المبلغ' : 'Refund student'}</div>
              </button>
            </div>

            <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
              {isAr ? 'ملاحظة الإدارة (مطلوبة)' : 'Admin Note (required)'}
            </label>
            <textarea value={adminNote} onChange={e => { setAdminNote(e.target.value); setResolveErr(''); }} rows={3}
              placeholder={isAr ? 'برر قرارك...' : 'Justify your decision...'}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, resize: 'none', boxSizing: 'border-box', marginBottom: 8 }}
            />

            {resolveErr && <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 10 }}>{resolveErr}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setResolving(null); setResolution(null); setAdminNote(''); }}
                style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                {isAr ? 'تراجع' : 'Cancel'}
              </button>
              <button
                onClick={() => { if (!resolution) { setResolveErr(isAr ? 'اختر طرف الحسم' : 'Select a resolution'); return; } if (adminNote.length < 10) { setResolveErr(isAr ? 'أضف ملاحظة كافية' : 'Add a sufficient note'); return; } resolveMut.mutate(); }}
                disabled={resolveMut.isPending}
                style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: resolveMut.isPending ? '#94A3B8' : '#1B4965', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                {resolveMut.isPending ? '...' : (isAr ? 'تأكيد الحسم' : 'Confirm Resolution')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#1A1A2E' }}>
          ⚖️ {isAr ? 'إدارة الاعتراضات' : 'Dispute Management'}
        </h1>
        <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>
          {isAr ? 'راجع اعتراضات الطلاب وتسجيلات الحصص واتخذ قرارك' : 'Review student disputes, session recordings, and make your ruling'}
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['open', 'resolved_tutor', 'resolved_student', 'all'].map(f => (
          <button key={f} onClick={() => setStatusFilter(f)}
            style={{ padding: '6px 14px', borderRadius: 100, border: '1.5px solid', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              borderColor: statusFilter === f ? '#1B4965' : '#E5E7EB',
              background:  statusFilter === f ? '#1B4965' : '#fff',
              color:       statusFilter === f ? '#fff'    : '#6B7280' }}>
            {isAr
              ? { open: '🔴 مفتوحة', resolved_tutor: '✅ للمدرس', resolved_student: '🔵 للطالب', all: 'الكل' }[f]
              : { open: '🔴 Open', resolved_tutor: '✅ Tutor', resolved_student: '🔵 Student', all: 'All' }[f]
            }
          </button>
        ))}
      </div>

      {/* Disputes table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E9EBF0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : !disputes.length ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 700 }}>{isAr ? 'لا توجد اعتراضات' : 'No disputes found'}</div>
          </div>
        ) : (
          disputes.map((d, idx) => {
            const badge = STATUS_BADGE[d.status] || STATUS_BADGE.open;
            const subjectName = (isAr ? d.session?.subject?.name_ar : d.session?.subject?.name_en) || '—';
            return (
              <div key={d.id} style={{ padding: '18px 22px', borderBottom: idx < disputes.length - 1 ? '1px solid #F1F5F9' : 'none', display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: '#1A1A2E' }}>#{d.id} · {subjectName}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 100, background: badge.bg, color: badge.color }}>
                      {isAr ? badge.ar : badge.en}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <span>👨‍🏫 {d.session?.tutor?.name}</span>
                    <span>👨‍🎓 {d.session?.student?.name}</span>
                    <span>💰 {d.session?.gross_amount} EGP</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, color: '#374151', fontStyle: 'italic' }}>
                    &ldquo;{d.reason.length > 120 ? d.reason.slice(0, 120) + '...' : d.reason}&rdquo;
                  </div>
                  {d.session?.recording_link && (
                    <a href={d.session.recording_link} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-block', marginTop: 6, fontSize: 13, color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>
                      📹 {isAr ? 'مشاهدة التسجيل' : 'View Recording'} ↗
                    </a>
                  )}
                  {d.admin_note && d.status !== 'open' && (
                    <div style={{ marginTop: 8, fontSize: 13, color: '#6B7280', padding: '8px 12px', background: '#F8FAFC', borderRadius: 8 }}>
                      📝 {isAr ? 'قرار الإدارة: ' : 'Admin note: '}{d.admin_note}
                    </div>
                  )}
                </div>
                {d.status === 'open' && (
                  <button onClick={() => { setResolving(d); setResolution(null); setAdminNote(''); setResolveErr(''); }}
                    style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: '#1B4965', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                    ⚖️ {isAr ? 'حسم' : 'Resolve'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
