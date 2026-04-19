'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { tutorApi } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import dashStyles from '../../../dashboard.module.css';
import styles from '../../group-sessions.module.css';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function GroupSessionDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();

  const { data: sessionResponse, isLoading, refetch } = useQuery({
    queryKey: ['tutor-group-session', id],
    queryFn: () => tutorApi.getGroupSession(id).then(r => r.data),
  });

  const session = sessionResponse?.data;

  const handleCancel = async () => {
    const reason = prompt(isAr ? 'سبب الإلغاء؟ (سيتم إرساله للطلاب وربما يترتب عليه غرامة)' : 'Cancellation Reason? (Students will be notified, penalties may apply)');
    if (!reason) return;

    try {
      await tutorApi.cancelGroupSession(id, reason);
      toast.success(isAr ? 'تم الإلغاء ورد الأموال للطلاب' : 'Cancelled and refunded students.');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error cancelling');
    }
  };

  const handleComplete = async () => {
    const report = prompt(isAr ? 'ضع تقريراً مختصراً عن الجلسة' : 'Write a short completion report');
    if (!report) return;

    try {
      await tutorApi.completeGroupSession(id, report);
      toast.success(isAr ? 'تم إنهاء الجلسة! نرجو أن تكون قد استمتعت!' : 'Session completed! Funds will be released.');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error completing session');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="tutor">
        <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
      </DashboardLayout>
    );
  }
  
  if (!session) {
    return (
      <DashboardLayout role="tutor">
        <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>{isAr ? 'غير موجود' : 'Not Found'}</div>
      </DashboardLayout>
    );
  }

  const currentEnrollments = session.active_enrollments_count || 0;
  const isThresholdMet = currentEnrollments >= session.min_threshold;
  const isFull = currentEnrollments >= session.max_capacity;

  return (
    <DashboardLayout role="tutor">
      <div className={dashStyles.pageHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span className={`${styles.statusBadge} ${styles[session.status as string]}`}>
              {(session.status as string).toUpperCase()}
            </span>
            {session.is_first_session_free && <span className={styles.sessionSubjectBadge}>🎁 {isAr ? 'جلسة مجانية' : 'Free Session'}</span>}
          </div>
          <h1 className={dashStyles.pageTitle}>
            {isAr ? session.title_ar as string : (session.title_en as string) || (session.title_ar as string)}
          </h1>
          <p className={dashStyles.pageSubtitle}>
            {isAr ? session.description_ar as string : (session.description_en as string) || (session.description_ar as string)}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link href="/dashboard/tutor/group-sessions" className="btn btn-outline btn-md">
            {isAr ? 'عودة' : 'Back'}
          </Link>
          {session.status === 'open' || session.status === 'confirmed' ? (
            <button onClick={handleCancel} className="btn btn-outline btn-md" style={{ borderColor: '#EF4444', color: '#EF4444' }}>
              {isAr ? 'إلغاء لحصة' : 'Cancel Session'}
            </button>
          ) : null}
          {session.status === 'confirmed' ? (
            <button onClick={handleComplete} className="btn btn-primary btn-md" style={{ background: '#059669', borderColor: '#059669' }}>
              {isAr ? 'إنهاء وصرف الأرباح' : 'Complete & Payout'}
            </button>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px' }}>
        {/* Details Card */}
        <div className={dashStyles.pageCard}>
          <p className={dashStyles.pageCardTitle}>📝 {isAr ? 'التفاصيل' : 'Details'}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: 14 }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid #E5E7EB' }}>
              <strong style={{ color: '#6B7280' }}>{isAr ? 'التاريخ' : 'Date'}</strong> 
              <span style={{ fontWeight: 600, color: '#1A1A2E' }}>{new Date(session.session_date as string).toLocaleDateString()}</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid #E5E7EB' }}>
              <strong style={{ color: '#6B7280' }}>{isAr ? 'الوقت' : 'Time'}</strong> 
              <span style={{ fontWeight: 600, color: '#1A1A2E' }}>{(session.session_time as string).substring(0, 5)}</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid #E5E7EB' }}>
              <strong style={{ color: '#6B7280' }}>{isAr ? 'المدة' : 'Duration'}</strong> 
              <span style={{ fontWeight: 600, color: '#1A1A2E' }}>{session.duration_minutes as number} {isAr ? 'دقيقة' : 'mins'}</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid #E5E7EB' }}>
              <strong style={{ color: '#6B7280' }}>{isAr ? 'التنسيق' : 'Format'}</strong> 
              <span style={{ fontWeight: 600, color: '#1A1A2E' }}>{session.lesson_format === 'online' ? (isAr ? 'أونلاين' : 'Online') : (isAr ? 'حضوري' : 'In Person')}</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ color: '#6B7280' }}>{isAr ? 'التسعير' : 'Pricing'}</strong> 
              <span style={{ fontWeight: 800, color: '#1A1A2E', fontSize: 16 }}>{session.seat_price as number} EGP {session.pricing_model === 'monthly_subscription' ? '/ mo' : ''}</span>
            </li>
          </ul>

          {session.meeting_link && (
            <div style={{ marginTop: '20px', padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <strong style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#475569' }}>{isAr ? 'رابط الاجتماع' : 'Meeting Link'}:</strong> 
              <a href={session.meeting_link as string} target="_blank" rel="noreferrer" style={{ color: '#1B4965', fontWeight: 600, wordBreak: 'break-all' }}>{session.meeting_link as string}</a>
            </div>
          )}
          
          {session.status === 'open' && !session.meeting_link && (
            <div style={{ marginTop: '20px', padding: '12px 14px', background: '#FFFBEB', borderRadius: '10px', fontSize: '13px', color: '#92400E' }}>
              📝 {isAr ? 'يمكنك إضافة رابط الزووم بعد تأكيد العدد' : 'Add meeting link before students join'}
            </div>
          )}
        </div>

        {/* Enrollments Card */}
        <div className={dashStyles.pageCard}>
          <p className={dashStyles.pageCardTitle}>👥 {isAr ? 'الطلاب المسجلين' : 'Enrollments'}</p>
          
          <div className={styles.progressWrap} style={{ margin: 0, padding: 16, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <div className={styles.progressHeader}>
              <span style={{ color: '#4B5563' }}>{isAr ? 'تحقيق التارجت' : 'Threshold Goal'}</span>
              <span style={{ fontWeight: 800, color: '#1A1A2E' }}>{currentEnrollments} / {session.min_threshold as number} {isAr ? 'الحد الأدنى' : 'Min'} (Max {session.max_capacity as number})</span>
            </div>
            <div className={styles.progressBar} style={{ background: '#E5E7EB', height: 10, borderRadius: 10 }}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${Math.min(100, (currentEnrollments / (session.max_capacity as number)) * 100)}%`, background: isThresholdMet ? '#10B981' : '#F59E0B' }}
              />
              <div 
                className={styles.progressThreshold}
                style={{ left: `${((session.min_threshold as number) / (session.max_capacity as number)) * 100}%`, background: '#EF4444', width: 3 }}
              />
            </div>
            {!isThresholdMet && session.status !== 'cancelled' && (
              <p style={{ fontSize: '12px', marginTop: '10px', color: '#B45309', fontWeight: 600 }}>
                ⚠️ {isAr ? `نحتاج لتسجيل ${(session.min_threshold as number) - currentEnrollments} طلاب آخرين لتأكيد وإقامة الجلسة.` : `Need ${(session.min_threshold as number) - currentEnrollments} more students to lock.`}
              </p>
            )}
          </div>

          <div style={{ marginTop: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>
              {isAr ? 'قائمة الحجوزات' : 'Enrolled Students'}
            </h4>
            
            {(!session.enrollments || (session.enrollments as any[]).length === 0) ? (
              <div className={dashStyles.emptyState} style={{ padding: 24 }}>
                <span className={dashStyles.emptyEmoji}>🤔</span>
                <p className={dashStyles.emptyText} style={{ margin: 0 }}>
                  {isAr ? 'لا توجد تسجيلات حتى الآن' : 'No enrollments yet'}
                </p>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(session.enrollments as any[]).map((enrollment: any) => (
                  <li key={enrollment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E0E7FF', color: '#3730A3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800 }}>
                        {enrollment.student.first_name[0]}{enrollment.student.last_name[0]}
                       </div>
                       <div>
                         <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A1A2E' }}>
                           {enrollment.student.first_name} {enrollment.student.last_name}
                         </div>
                         <div style={{ fontSize: '12px', color: '#64748B', marginTop: 2 }}>
                           {new Date(enrollment.enrolled_at).toLocaleDateString()}
                         </div>
                       </div>
                    </div>
                    <span className={`${styles.statusBadge} ${enrollment.status === 'enrolled' ? styles.confirmed : styles.cancelled}`} style={{ fontSize: 11 }}>
                      {enrollment.status.toUpperCase()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
