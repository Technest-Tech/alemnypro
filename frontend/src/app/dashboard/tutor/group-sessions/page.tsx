'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { tutorApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import CreateSessionForm from './components/CreateSessionForm';
import dashStyles from '../../dashboard.module.css';
import styles from './group-sessions.module.css';

export default function TutorGroupSessionsList() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: sessionsResponse, isLoading } = useQuery({
    queryKey: ['tutor-group-sessions'],
    queryFn: () => tutorApi.getGroupSessions().then(r => r.data),
  });

  const sessions = sessionsResponse?.data || [];

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const lowerQ = searchQuery.toLowerCase();
    return sessions.filter((s: Record<string, unknown>) => {
      const arMatch = String(s.title_ar || '').toLowerCase().includes(lowerQ);
      const enMatch = String(s.title_en || '').toLowerCase().includes(lowerQ);
      return arMatch || enMatch;
    });
  }, [sessions, searchQuery]);

  return (
    <DashboardLayout role="tutor">
      {/* Header */}
      <div className={dashStyles.pageHeader}>
        <div>
          <h1 className={dashStyles.pageTitle}>👥 {isAr ? 'الحصص الجماعية' : 'Group Sessions'}</h1>
          <p className={dashStyles.pageSubtitle}>
            {isAr ? 'إدارة دروسك الجماعية وتابع الحجوزات' : 'Manage your group classes and track enrollments'}
          </p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => setIsModalOpen(true)}>
          ➕ {isAr ? 'إنشاء مسار جديد' : 'Create New Session'}
        </button>
      </div>

      {/* Toolbar */}
      {sessions.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <span style={{ position: 'absolute', top: '50%', insetInlineStart: 14, transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              placeholder={isAr ? 'ابحث بعنوان الجلسة...' : 'Search classes...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ paddingInlineStart: 40, width: '100%', borderRadius: 12, border: '1px solid #E2E8F0', backgroundColor: '#fff' }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className={styles.sessionsGrid}>
          <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
        </div>
      ) : sessions.length === 0 ? (
        <div className={dashStyles.pageCard}>
          <div className={dashStyles.emptyState}>
            <span className={dashStyles.emptyEmoji}>👥</span>
            <p className={dashStyles.emptyTitle}>{isAr ? 'لا توجد حصص جماعية بعد' : 'No Group Sessions Yet'}</p>
            <p className={dashStyles.emptyText}>
              {isAr ? 'أنشئ حصتك الجماعية الأولى لتنمية دخلك!' : 'Create your first group session to scale your income!'}
            </p>
            <button className="btn btn-primary btn-md" style={{ marginTop: 16 }} onClick={() => setIsModalOpen(true)}>
              {isAr ? 'إنشاء أول حصة' : 'Create First Session'}
            </button>
          </div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className={dashStyles.pageCard}>
          <div className={dashStyles.emptyState}>
            <span className={dashStyles.emptyEmoji}>🔍</span>
            <p className={dashStyles.emptyTitle}>{isAr ? 'لم يتم العثور على نتائج' : 'No results found'}</p>
          </div>
        </div>
      ) : (
        <div className={styles.sessionsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filteredSessions.map((session: Record<string, unknown>) => {
            const currentEnrollments = (session.active_enrollments_count as number) || 0;
            const target = (session.max_capacity as number) || 0;
            const pct = target > 0 ? Math.min(100, (currentEnrollments / target) * 100) : 0;
            const isMet = currentEnrollments >= ((session.min_threshold as number) || 0);

            return (
              <div 
                key={session.id as number} 
                className={styles.sessionCard}
                onClick={() => router.push(`/dashboard/tutor/group-sessions/${session.id}`)}
                style={{ cursor: 'pointer', background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #E2E8F0', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1B4965', background: '#F1F5F9', padding: '4px 8px', borderRadius: 8 }}>
                    Subject #{session.subject_id as number}
                  </div>
                  <span className={`${styles.statusBadge} ${styles[session.status as string]}`} style={{ fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 12, background: session.status === 'open' ? '#DCFCE7' : '#E2E8F0', color: session.status === 'open' ? '#166534' : '#475569' }}>
                    {(session.status as string).toUpperCase()}
                  </span>
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
                  {isAr ? session.title_ar as string : (session.title_en as string) || (session.title_ar as string)}
                </h3>

                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748B', marginBottom: 20 }}>
                  <span>📅 {new Date(session.session_date as string).toLocaleDateString()}</span>
                  <span>🕒 {(session.session_time as string).substring(0, 5)} ({session.duration_minutes as number}m)</span>
                </div>

                <div style={{ marginBottom: 20, padding: 16, background: '#F8FAFC', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                    <span>{isAr ? 'الطلاب المسجلين' : 'Enrolled'}</span>
                    <span>{currentEnrollments} / {target}</span>
                  </div>
                  <div style={{ height: 8, background: '#E2E8F0', borderRadius: 8, position: 'relative', overflow: 'hidden' }}>
                    <div
                      style={{ height: '100%', background: isMet ? '#10B981' : '#3B82F6', borderRadius: 8, width: `${pct}%`, transition: 'width 0.5s' }}
                    />
                    <div
                      style={{ position: 'absolute', top: 0, bottom: 0, width: 3, background: '#EF4444', left: `${(((session.min_threshold as number) || 0) / target) * 100}%` }}
                      title={isAr ? 'الحد الأدنى' : 'Minimum Threshold'}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 11, color: '#64748B' }}>{isAr ? 'تسعير المقعد' : 'Seat Price'}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{session.seat_price as number} {isAr ? 'ج.م' : 'EGP'}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#3B82F6' }}>
                    {isAr ? 'إدارة ←' : 'Manage →'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isAr ? 'إنشاء جلسة جماعية جديدة' : 'Create New Group Session'}
        maxWidth={700}
      >
        <CreateSessionForm 
          onSuccess={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </DashboardLayout>
  );
}
