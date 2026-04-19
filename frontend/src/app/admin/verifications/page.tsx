'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { adminApi } from '@/lib/api';
import styles from '../admin.module.css';

type VerificationStatus = 'pending' | 'approved' | 'rejected';

interface TutorUser {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
}

interface TutorProfile {
  id?: number;
  verification_status?: string;
  user?: TutorUser;
}

interface VerificationRecord {
  id: number;
  tutor_profile_id?: number;
  tutor?: TutorUser;
  tutorProfile?: TutorProfile;
  document_type?: string;
  document_url?: string;
  type?: string;
  file_path?: string;
  access_url?: string;
  status: VerificationStatus;
  admin_notes?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
}

interface QueueResponse {
  data?: VerificationRecord[];
  total?: number;
}

const DOC_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  national_id: { ar: 'بطاقة الهوية', en: 'National ID' },
  criminal_record: { ar: 'الفيش الجنائي', en: 'Criminal Record' },
  certificate: { ar: 'شهادة', en: 'Certificate' },
  university_degree: { ar: 'شهادة جامعية', en: 'University Degree' },
  teaching_certificate: { ar: 'شهادة تدريس', en: 'Teaching Certificate' },
  experience_letter: { ar: 'خطاب خبرة', en: 'Experience Letter' },
};

const STATUS_META: Record<VerificationStatus, { ar: string; en: string; bg: string; color: string }> = {
  pending: { ar: 'قيد المراجعة', en: 'Pending Review', bg: '#FEF3C7', color: '#92400E' },
  approved: { ar: 'مقبول', en: 'Approved', bg: '#DCFCE7', color: '#166534' },
  rejected: { ar: 'مرفوض', en: 'Rejected', bg: '#FEE2E2', color: '#B91C1C' },
};

function getTutor(record: VerificationRecord): TutorUser {
  return record.tutorProfile?.user || record.tutor || {};
}

function getDocumentType(record: VerificationRecord) {
  return record.type || record.document_type || 'unknown';
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name?: string) {
  if (!name) return 'T';
  return name.trim().charAt(0).toUpperCase();
}

export default function AdminVerificationsPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  
  const [viewingDoc, setViewingDoc] = useState<{ id: number; url: string; type: string } | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-verifications', statusFilter],
    queryFn: () =>
      adminApi
        .getVerificationQueue(statusFilter !== 'all' ? { status: statusFilter } : {})
        .then((r) => r.data.data),
  });

  const response = (data || {}) as QueueResponse;
  const list = response.data || ((Array.isArray(data) ? data : []) as VerificationRecord[]);
  const total = response.total || list.length;

  const counts = list.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0 }
  );

  const grouped = useMemo(() => {
    const map = new Map<number, { tutor: TutorUser; records: VerificationRecord[] }>();
    list.forEach((r) => {
      const tId = r.tutor_profile_id || r.tutorProfile?.id || r.id; // fallback to r.id if no tutor
      if (!map.has(tId)) {
        map.set(tId, { tutor: getTutor(r), records: [] });
      }
      map.get(tId)!.records.push(r);
    });
    return Array.from(map.values());
  }, [list]);

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => adminApi.approveVerification(id, notes ? { notes } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      setReviewingId(null);
      setReviewNote('');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) => adminApi.rejectVerification(id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      setReviewingId(null);
      setReviewNote('');
    },
  });

  const openReview = (record: VerificationRecord) => {
    if (reviewingId === record.id) {
      setReviewingId(null);
      setReviewNote('');
      return;
    }
    setReviewingId(record.id);
    setReviewNote(record.admin_notes || '');
  };

  const confirmApprove = (id: number) => {
    approveMutation.mutate({ id, notes: reviewNote.trim() || undefined });
  };

  const confirmReject = (id: number) => {
    if (reviewNote.trim().length < 5) return;
    rejectMutation.mutate({ id, notes: reviewNote.trim() });
  };

  const handleViewDoc = async (id: number) => {
    try {
      setIsLoadingDoc(id);
      const res = await adminApi.getVerificationFile(id);
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const isImage = res.headers['content-type']?.startsWith('image/');
      setViewingDoc({ id, url, type: isImage ? 'image' : 'pdf' });
    } catch (err) {
      console.error(err);
      alert(isAr ? 'فشل تحميل الملف. ربما تم حذفه.' : 'Failed to load file. It might have been deleted.');
    } finally {
      setIsLoadingDoc(null);
    }
  };

  const statusOptions = [
    { val: 'pending', ar: 'في الانتظار', en: 'Pending' },
    { val: 'approved', ar: 'مقبول', en: 'Approved' },
    { val: 'rejected', ar: 'مرفوض', en: 'Rejected' },
    { val: 'all', ar: 'الكل', en: 'All' },
  ] as const;

  return (
    <>
      <div className={styles.dashHeader} style={{ position: 'static', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className={styles.dashTitle}>🛡️ {isAr ? 'توثيق المعلمين' : 'Tutor Verifications'}</h1>
          <p className={styles.dashSubtitle} style={{ marginTop: 6 }}>
            {isAr
              ? 'راجع الوثائق المرفقة لكل معلم لضمان جودة المنصة وموثوقيتها.'
              : 'Review tutor attached documents to ensure platform quality and trust.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', background: 'var(--bg-alt)', padding: 6, borderRadius: 12, border: '1px solid var(--border-light)' }}>
          {statusOptions.map((opt) => (
            <button
              key={opt.val}
              style={{
                border: 'none',
                background: statusFilter === opt.val ? '#FFFFFF' : 'transparent',
                color: statusFilter === opt.val ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: statusFilter === opt.val ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: statusFilter === opt.val ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => setStatusFilter(opt.val)}
            >
              {isAr ? opt.ar : opt.en}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          { key: 'total', labelAr: 'إجمالي النتائج', labelEn: 'Results', value: total, bg: '#EFF6FF', color: '#1D4ED8', icon: '📋' },
          { key: 'pending', labelAr: 'قيد المراجعة', labelEn: 'Pending', value: counts.pending, bg: '#FEF3C7', color: '#92400E', icon: '⏳' },
          { key: 'approved', labelAr: 'مقبولة', labelEn: 'Approved', value: counts.approved, bg: '#DCFCE7', color: '#166534', icon: '✅' },
          { key: 'rejected', labelAr: 'مرفوضة', labelEn: 'Rejected', value: counts.rejected, bg: '#FEE2E2', color: '#B91C1C', icon: '❌' },
        ].map((card) => (
          <div
            key={card.key}
            className={styles.dashCard}
            style={{ margin: 0, padding: '1rem 1.1rem', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {isAr ? card.labelAr : card.labelEn}
              </div>
              <strong style={{ fontSize: 24, color: 'var(--text-primary)' }}>{card.value}</strong>
            </div>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: card.bg,
                color: card.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 280, borderRadius: 16 }} />
          ))
        ) : grouped.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', background: 'var(--bg-alt)', borderRadius: 16, border: '1px dashed var(--border-light)' }}>
            <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem', opacity: 0.8 }}>📭</span>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
              {isAr ? 'لا توجد طلبات هنا' : 'No verification requests here'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
              {isAr ? 'لم نتمكن من العثور على أي مرفقات مطابقة لحالة الفلتر الحالي. يمكنك تغيير الفلتر للاطلاع على الوثائق الأخرى.' : 'We couldn\'t find any attachments matching the current filter status. Try checking other statuses.'}
            </p>
          </div>
        ) : (
          grouped.map(({ tutor, records }) => (
            <div
              key={tutor.id || Math.random()}
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid var(--border-light)',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
              }}
            >
              {/* Tutor Header */}
              <div style={{ padding: '1.2rem', background: '#F8FAFC', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 18,
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
                  }}
                >
                  {getInitials(tutor.name)}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: 18, color: 'var(--text-primary)' }}>
                    {tutor.name || (isAr ? 'معلم بدون اسم' : 'Unnamed Tutor')}
                  </h3>
                  <div style={{ display: 'flex', gap: 16, color: 'var(--text-secondary)', fontSize: 13, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>✉️ {tutor.email || '—'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>📞 <span dir="ltr">{tutor.phone || '—'}</span></span>
                  </div>
                </div>
                <div style={{ background: '#E0E7FF', color: '#4338CA', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  {records.length} {isAr ? 'مرفقات' : 'Attachments'}
                </div>
              </div>

              {/* Tutor Documents Grid */}
              <div style={{ padding: '1.2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                  {records.map((record) => {
                    const docType = getDocumentType(record);
                    const docLabel = DOC_TYPE_LABELS[docType];
                    const status = STATUS_META[record.status] || STATUS_META.pending;
                    const isReviewOpen = reviewingId === record.id;

                    return (
                      <div
                        key={record.id}
                        style={{
                          border: '1px solid var(--border-light)',
                          borderRadius: 12,
                          background: 'var(--bg-alt)',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                          transition: 'all 0.2s',
                        }}
                      >
                        {/* Doc Header */}
                        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <span style={{ fontSize: 20 }}>📄</span>
                              <strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>
                                {isAr ? (docLabel?.ar || docType) : (docLabel?.en || docType)}
                              </strong>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div>📅 {isAr ? 'تاريخ الرفع:' : 'Uploaded:'} {formatDate(record.created_at, locale)}</div>
                              {record.reviewed_at && <div>🕒 {isAr ? 'تاريخ المراجعة:' : 'Reviewed:'} {formatDate(record.reviewed_at, locale)}</div>}
                            </div>
                          </div>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: status.bg,
                              color: status.color,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {isAr ? status.ar : status.en}
                          </span>
                        </div>

                        {/* Doc Actions */}
                        <div style={{ padding: '0.8rem 1rem', background: '#FFFFFF', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
                          <button
                            className="btn btn-sm"
                            style={{
                              background: '#F1F5F9', color: '#334155', border: 'none',
                              flex: 1, display: 'flex', justifyContent: 'center', gap: 6
                            }}
                            onClick={() => handleViewDoc(record.id)}
                            disabled={isLoadingDoc === record.id}
                          >
                            {isLoadingDoc === record.id ? '...' : '👁️'} 
                            {isAr ? 'عرض الملف' : 'View File'}
                          </button>
                          
                          {record.status === 'pending' && (
                            <button
                              className="btn btn-sm"
                              style={{
                                background: isReviewOpen ? '#FEE2E2' : '#3B82F6',
                                color: isReviewOpen ? '#B91C1C' : '#FFFFFF',
                                border: 'none', flex: 1,
                                display: 'flex', justifyContent: 'center', gap: 6
                              }}
                              onClick={() => openReview(record)}
                            >
                              {isReviewOpen ? '✖' : '📝'} 
                              {isReviewOpen ? (isAr ? 'إلغاء المراجعة' : 'Cancel Review') : (isAr ? 'مراجعة' : 'Review')}
                            </button>
                          )}
                        </div>

                        {/* Admin Notes Preview */}
                        {record.admin_notes && !isReviewOpen && (
                          <div style={{ padding: '0.8rem 1rem', background: '#FFFBEB', borderTop: '1px solid #FEF3C7', fontSize: 12, color: '#92400E' }}>
                            <strong>{isAr ? 'ملاحظات:' : 'Notes:'}</strong> {record.admin_notes}
                          </div>
                        )}

                        {/* Review Form Expansion */}
                        {isReviewOpen && (
                          <div style={{ padding: '1rem', background: '#F8FAFC', borderTop: '1px solid var(--border-light)' }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                              {isAr ? 'قرار الإدارة وملاحظاتها' : 'Admin Decision & Notes'}
                            </label>
                            <textarea
                              className="input"
                              rows={2}
                              value={reviewNote}
                              onChange={(e) => setReviewNote(e.target.value)}
                              placeholder={isAr ? 'أضف ملاحظة توضح سبب الموافقة أو الرفض...' : 'Add a note explaining approval or rejection...'}
                              style={{ resize: 'vertical', width: '100%', padding: '8px 12px', fontSize: 13, borderColor: '#CBD5E1' }}
                            />
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                              <button
                                className="btn btn-sm"
                                style={{ background: '#10B981', color: '#fff', border: 'none', flex: 1 }}
                                onClick={() => confirmApprove(record.id)}
                                disabled={approveMutation.isPending || rejectMutation.isPending}
                              >
                                ✅ {isAr ? 'قبول' : 'Approve'}
                              </button>
                              <button
                                className="btn btn-sm"
                                style={{ background: '#EF4444', color: '#fff', border: 'none', flex: 1 }}
                                onClick={() => confirmReject(record.id)}
                                disabled={approveMutation.isPending || rejectMutation.isPending || reviewNote.trim().length < 5}
                              >
                                ❌ {isAr ? 'رفض' : 'Reject'}
                              </button>
                            </div>
                            {reviewNote.trim().length > 0 && reviewNote.trim().length < 5 && (
                              <div style={{ fontSize: 11, color: '#EF4444', marginTop: 6, textAlign: 'center' }}>
                                {isAr ? 'يرجى كتابة سبب واضح (5 أحرف على الأقل)' : 'Please provide a clear reason (min 5 chars)'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Document Viewer Modal Overlay */}
      {viewingDoc && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)',
          zIndex: 99999, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '2rem'
        }}>
          <div style={{
            width: '100%', maxWidth: 1000, background: '#FFFFFF', borderRadius: 20, overflow: 'hidden',
            display: 'flex', flexDirection: 'column', maxHeight: '90vh',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.5rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  🔍
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, color: '#0F172A' }}>{isAr ? 'معاينة المرفق' : 'Attachment Preview'}</h3>
                  <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>ID: #{viewingDoc.id}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <a
                  href={viewingDoc.url}
                  download={`Attachment_${viewingDoc.id}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', background: '#3B82F6', color: '#FFF', borderRadius: 8,
                    textDecoration: 'none', fontSize: 14, fontWeight: 600, transition: 'background 0.2s'
                  }}
                >
                  📥 {isAr ? 'تحميل مباشر' : 'Download'}
                </a>
                <button
                  onClick={() => setViewingDoc(null)}
                  style={{
                    border: 'none', background: '#F1F5F9', color: '#475569',
                    width: 36, height: 36, borderRadius: '50%',
                    fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  &times;
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, overflow: 'auto', padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#F1F5F9' }}>
              {viewingDoc.type === 'image' ? (
                <img
                  src={viewingDoc.url}
                  alt={`Document ${viewingDoc.id}`}
                  style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
              ) : (
                <iframe
                  src={viewingDoc.url}
                  width="100%"
                  height="100%"
                  style={{ border: 'none', borderRadius: 8, minHeight: '65vh', background: '#fff' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
