'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { publicApi } from '@/lib/api';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function GroupSessionsDiscovery() {
  const { locale } = useLocale();

  const { data: response, isLoading } = useQuery({
    queryKey: ['public-group-sessions'],
    queryFn: () => publicApi.getGroupSessions().then(r => r.data),
  });

  const sessions = response?.data?.data || []; // Laravel pagination structure

  return (
    <>
      
      <main style={{ padding: '6rem 2rem 4rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--text)' }}>
            {locale === 'ar' ? 'تعلم مع النخبة، بتكلفة أقل' : 'Learn from the best, for less'}
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto' }}>
            {locale === 'ar' 
              ? 'انضم إلى جلسات جماعية متميزة مع أفضل المعلمين. الجلسة تقام فقط عند اكتمال الحد الأدنى للطلاب، مما يضمن لك أفضل تجربة وأقل تكلفة.' 
              : 'Join premium group classes with top tutors. Sessions only run when the minimum capacity is met, ensuring a great experience at a fraction of the cost.'}
          </p>
        </div>

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton" style={{ height: 350, borderRadius: 16 }} />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <h3>{locale === 'ar' ? 'لا توجد جلسات متاحة حالياً' : 'No upcoming sessions right now'}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{locale === 'ar' ? 'يرجى العودة لاحقاً لاكتشاف جلسات جديدة' : 'Check back later for new sessions'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
            {sessions.map((session: any) => {
              const currentCount = session.active_enrollments_count || 0;
              const isThresholdMet = currentCount >= session.min_threshold;
              
              return (
                <Link href={`/group-sessions/${session.id}`} key={session.id} style={{ display: 'block', textDecoration: 'none' }}>
                  <div style={{ 
                    background: 'var(--bg-card)', 
                    border: '1px solid var(--border-light)', 
                    borderRadius: 20, 
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    boxShadow: 'var(--shadow-sm)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Cover Image */}
                    <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                      <img 
                        src={(() => {
                          const slug = session.subject?.slug || '';
                          const map: Record<string, string> = {
                            'mathematics': '/images/group-math.png',
                            'physics': '/images/group-physics.png',
                            'english': '/images/group-english.png',
                            'python': '/images/group-python.png',
                            'chemistry': '/images/group-chemistry.png',
                          };
                          return map[slug] || '/images/group-math.png';
                        })()}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />
                      {session.is_first_session_free && (
                        <span style={{ position: 'absolute', top: 12, right: 12, fontSize: '0.7rem', fontWeight: 800, background: '#FEF08A', color: '#854D0E', padding: '4px 10px', borderRadius: 20, zIndex: 2 }}>
                          🎁 {locale === 'ar' ? 'مجاناً' : 'FREE'}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 12px', borderRadius: 20 }}>
                        {locale === 'ar' ? session.subject.name_ar : session.subject.name_en}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                      {locale === 'ar' ? session.title_ar : session.title_en || session.title_ar}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--border-strong)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {session.tutor.first_name} {session.tutor.last_name}
                      </span>
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                      <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: 12, marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{locale === 'ar' ? 'الطلاب' : 'Seats taken'}</span>
                          <span style={{ color: isThresholdMet ? '#10B981' : 'var(--text)' }}>{currentCount} / {session.max_capacity}</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
                           <div style={{ height: '100%', width: `${Math.min(100, (currentCount / session.max_capacity) * 100)}%`, background: isThresholdMet ? '#10B981' : 'var(--primary)', transition: 'width 0.5s' }} />
                           <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${(session.min_threshold / session.max_capacity) * 100}%`, width: 2, background: 'red', zIndex: 2 }} />
                        </div>
                        {!isThresholdMet && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                            {locale === 'ar' ? `تبقى ${session.min_threshold - currentCount} لتأكيد الجلسة` : `Need ${session.min_threshold - currentCount} more to confirm`}
                          </div>
                        )}
                        {isThresholdMet && (
                          <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.5rem', textAlign: 'center', fontWeight: 600 }}>
                            ✓ {locale === 'ar' ? 'الجلسة مؤكدة!' : 'Session Confirmed!'}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(session.session_date).toLocaleDateString()}
                          </span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)' }}>
                            {session.seat_price} {locale === 'ar' ? 'ج.م' : 'EGP'}
                          </span>
                        </div>
                        <button className="btn btn-primary btn-sm" style={{ padding: '0.5rem 1.5rem' }}>
                          {locale === 'ar' ? 'التفاصيل' : 'View Details'}
                        </button>
                      </div>
                    </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
