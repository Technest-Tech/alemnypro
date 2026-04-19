'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { publicApi, studentApi } from '@/lib/api';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useAuthModal } from '@/lib/AuthModalContext';

export default function GroupSessionEnroll() {
  const params = useParams();
  const id = Number(params.id);
  const { locale } = useLocale();
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  
  const [user, setUser] = useState<any>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    const loadUser = () => {
      const saved = localStorage.getItem('alemnypro_user');
      if (saved) setUser(JSON.parse(saved));
      else setUser(null);
    };
    loadUser();
    window.addEventListener('alemnypro-auth-change', loadUser);
    return () => window.removeEventListener('alemnypro-auth-change', loadUser);
  }, []);

  const { data: sessionResponse, isLoading, refetch } = useQuery({
    queryKey: ['public-group-session', id],
    queryFn: () => publicApi.getGroupSession(id).then(r => r.data),
  });

  const session = sessionResponse?.data;

  const handleEnroll = async () => {
    if (!user) {
      openAuthModal({
        reason: 'enroll',
        onSuccess: () => {
          // Re-load user then trigger enroll
          const saved = localStorage.getItem('alemnypro_user');
          if (saved) setUser(JSON.parse(saved));
          // Give state a tick to update then auto-trigger enroll
          setTimeout(() => handleEnroll(), 100);
        },
      });
      return;
    }

    if (user.role !== 'student') {
      toast.error(locale === 'ar' ? 'فقط حساب الطالب يمكنه الدفع والحجز' : 'Only student accounts can enroll');
      return;
    }

    setIsEnrolling(true);
    try {
      await studentApi.enrollGroupSession(id);
      toast.success(locale === 'ar' ? 'تم تأكيد حجزك بنجاح! رصيدك في أمان حتى تكتمل الجلسة.' : 'Seat reserved successfully! Funds held in escrow until session starts.');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error enrolling');
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) return <><main style={{ padding: '6rem 2rem', textAlign: 'center' }}>Loading...</main><Footer /></>;
  if (!session) return <><main style={{ padding: '6rem 2rem', textAlign: 'center' }}>Not Found</main><Footer /></>;

  const currentCount = session.active_enrollments_count || 0;
  const isThresholdMet = currentCount >= session.min_threshold;
  const isFull = currentCount >= session.max_capacity;

  return (
    <>
      
      <main style={{ padding: '6rem 2rem 4rem', maxWidth: 1000, margin: '0 auto' }}>
        
        <Link href="/group-sessions" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}>
          ← {locale === 'ar' ? 'العودة للمجموعات' : 'Back to Sessions'}
        </Link>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '3rem' }}>
          
          {/* Main Info */}
          <div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
               <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-50)', padding: '4px 12px', borderRadius: 20 }}>
                  {locale === 'ar' ? session.subject.name_ar : session.subject.name_en}
               </span>
               <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: '4px 12px', borderRadius: 20 }}>
                  {session.lesson_format === 'online' ? (locale === 'ar' ? 'أونلاين' : 'Online') : (locale === 'ar' ? 'حضوري' : 'In Person')}
               </span>
               {session.status === 'confirmed' && (
                 <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#10B981', background: '#D1FAE5', padding: '4px 12px', borderRadius: 20 }}>
                  ✓ {locale === 'ar' ? 'رحلة مؤكدة' : 'Confirmed'}
                 </span>
               )}
            </div>

            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--text)' }}>
              {locale === 'ar' ? session.title_ar : session.title_en || session.title_ar}
            </h1>

            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: 1.6 }}>
              {locale === 'ar' ? session.description_ar : session.description_en || session.description_ar}
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>{locale === 'ar' ? 'معلم الجلسة' : 'Tutor'}</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 24, border: '1px solid var(--border-light)' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--border-strong)', flexShrink: 0 }} />
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                  {session.tutor.first_name} {session.tutor.last_name}
                </h3>
                  <Link href={`/tutors/${session.tutor.tutor_profile?.slug || session.tutor.id}`} style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none', display: 'inline-block', marginTop: '0.5rem' }}>
                    {locale === 'ar' ? 'عرض الملف الشخصي' : 'View Profile'} → 
                </Link>
              </div>
            </div>
          </div>

          {/* Sticky Booking Card */}
          <div>
            <div style={{ position: 'sticky', top: '6rem', background: 'var(--bg-card)', padding: '2rem', borderRadius: 24, border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'سعر المقعد' : 'Seat Price'}</span>
                <div>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text)' }}>
                    {session.is_first_session_free ? '0' : session.seat_price}
                  </span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    {locale === 'ar' ? 'ج.م' : 'EGP'}
                  </span>
                </div>
              </div>

              {session.is_first_session_free && (
                <div style={{ background: '#FEF08A', color: '#854D0E', padding: '1rem', borderRadius: 12, marginBottom: '1.5rem', textAlign: 'center', fontWeight: 700 }}>
                  🎁 {locale === 'ar' ? 'أول حصة مجاناً! احجز دون دفع' : 'First class FREE! Enroll without paying'}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>📅 {locale === 'ar' ? 'التاريخ' : 'Date'}</span>
                  <span style={{ fontWeight: 600 }}>{new Date(session.session_date).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>🕒 {locale === 'ar' ? 'التوقيت' : 'Time'}</span>
                  <span style={{ fontWeight: 600 }}>{session.session_time.substring(0,5)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>⏳ {locale === 'ar' ? 'المدة' : 'Duration'}</span>
                  <span style={{ fontWeight: 600 }}>{session.duration_minutes} {locale === 'ar' ? 'دقيقة' : 'm'}</span>
                </div>
              </div>

              {/* Threshold Progress */}
              <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 16, marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {isThresholdMet 
                      ? (locale === 'ar' ? 'الجلسة مؤكدة!' : 'Session Confirmed!') 
                      : (locale === 'ar' ? 'في انتظار اكتمال العدد' : 'Awaiting Threshold')}
                  </span>
                  <span style={{ color: isThresholdMet ? '#10B981' : 'var(--text)' }}>{currentCount} / {session.max_capacity}</span>
                </div>
                <div style={{ height: 8, background: 'var(--border-light)', borderRadius: 8, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (currentCount / session.max_capacity) * 100)}%`, background: isThresholdMet ? '#10B981' : 'var(--primary)', transition: 'width 0.5s' }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${(session.min_threshold / session.max_capacity) * 100}%`, width: 2, background: 'red', zIndex: 2 }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                  {!isThresholdMet ? (
                     locale === 'ar' ? `إذا لم تنضم طالبان فلن يتم خصم أي مبلغ.` : 'If the threshold is not met by the start date, you get a full refund.'
                  ) : (
                     locale === 'ar' ? 'تم الوصول للحد الأدنى. الجلسة مقامة بالتأكيد!' : 'Minimum threshold reached. This session is guaranteed to run.'
                  )}
                </div>
              </div>

              <button 
                className="btn btn-primary btn-block" 
                style={{ height: '3.5rem', fontSize: '1.25rem' }} 
                onClick={handleEnroll}
                disabled={isEnrolling || isFull || (session.status !== 'open' && session.status !== 'confirmed')}
              >
                {isEnrolling ? '...' : 
                 isFull ? (locale === 'ar' ? 'المقاعد ممتلئة' : 'Fully Booked') : 
                 (session.status !== 'open' && session.status !== 'confirmed') ? (locale === 'ar' ? 'مغلق' : 'Closed') :
                 (locale === 'ar' ? 'احجز مقعدك الآن' : 'Reserve Your Seat')}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                🔒 {locale === 'ar' ? 'أموالك محفوظة في محفظة أمني حتى انتهاء الجلسة' : 'Payments are held securely in Escrow'}
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
