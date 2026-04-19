'use client';

import { useLocale } from '@/lib/locale';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import styles from './become.module.css';

export default function BecomeTutorPage() {
  const { locale } = useLocale();

  const steps = [
    {
      icon: '📝',
      ar: { title: 'سجّل حسابك', desc: 'أنشئ حساب معلم مجاناً في أقل من دقيقتين.' },
      en: { title: 'Create Your Account', desc: 'Sign up as a tutor for free in under 2 minutes.' },
    },
    {
      icon: '👤',
      ar: { title: 'أكمل ملفك الشخصي', desc: 'أضف خبراتك ومواد التدريس والسعر.' },
      en: { title: 'Complete Your Profile', desc: 'Add your expertise, subjects, and pricing.' },
    },
    {
      icon: '✅',
      ar: { title: 'وثّق هويتك', desc: 'ارفع وثائق التحقق للحصول على شارة الموثوقية.' },
      en: { title: 'Get Verified', desc: 'Upload verification documents to get your trust badge.' },
    },
    {
      icon: '🚀',
      ar: { title: 'ابدأ التدريس', desc: 'استقبل طلبات الحجز من الطلاب وابدأ التعليم.' },
      en: { title: 'Start Teaching', desc: 'Receive booking requests and start earning.' },
    },
  ];

  const perks = [
    { icon: '💰', ar: 'اضبط سعرك بحرية', en: 'Set your own rate' },
    { icon: '🕐', ar: 'مواعيد مرنة', en: 'Flexible schedule' },
    { icon: '🌍', ar: 'دروس أونلاين أو حضوري', en: 'Online or in-person' },
    { icon: '🛡️', ar: 'دفع آمن ومضمون', en: 'Secure payments' },
    { icon: '📊', ar: 'إحصائيات أداء', en: 'Performance analytics' },
    { icon: '🎓', ar: 'مجتمع معلمين نشط', en: 'Active tutor community' },
  ];

  return (
    <>
      
      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroInner}>
              <div className={styles.heroContent}>
                <span className={styles.heroBadge}>🧑‍🏫 {locale === 'ar' ? 'انضم كمعلم' : 'Join as a Tutor'}</span>
                <h1 className={styles.heroTitle}>
                  {locale === 'ar'
                    ? 'شارك علمك\nواكسب دخلاً إضافياً'
                    : 'Share Your Knowledge\nEarn Extra Income'}
                </h1>
                <p className={styles.heroDesc}>
                  {locale === 'ar'
                    ? 'انضم لأكثر من 500 معلم على منصة AlemnyPro وابدأ في تدريس طلاب من جميع أنحاء مصر.'
                    : 'Join 500+ tutors on AlemnyPro and start teaching students all across Egypt.'}
                </p>
                <div className={styles.heroActions}>
                  <Link href="/auth/tutor-register" className="btn btn-secondary btn-lg">
                    🚀 {locale === 'ar' ? 'ابدأ التدريس' : 'Start Teaching'}
                  </Link>
                  <Link href="/search" className="btn btn-white btn-lg">
                    {locale === 'ar' ? 'تصفح المعلمين' : 'Browse Tutors'}
                  </Link>
                </div>
                <div className={styles.heroStats}>
                  <div className={styles.heroStat}>
                    <strong>500+</strong>
                    <span>{locale === 'ar' ? 'معلم نشط' : 'Active Tutors'}</span>
                  </div>
                  <div className={styles.heroStatDivider} />
                  <div className={styles.heroStat}>
                    <strong>2,000+</strong>
                    <span>{locale === 'ar' ? 'طالب' : 'Students'}</span>
                  </div>
                  <div className={styles.heroStatDivider} />
                  <div className={styles.heroStat}>
                    <strong>100 ج.م</strong>
                    <span>{locale === 'ar' ? 'متوسط السعر/ساعة' : 'Avg Rate/hr'}</span>
                  </div>
                </div>
              </div>
              <div className={styles.heroVisual}>
                <div className={styles.visualCard}>
                  <span className={styles.visualEmoji}>🎓</span>
                  <div className={styles.visualText}>
                    <strong>{locale === 'ar' ? 'د. سارة خالد' : 'Sara Khalid, PhD'}</strong>
                    <span>{locale === 'ar' ? 'مُعلمة فيزياء — القاهرة' : 'Physics Tutor — Cairo'}</span>
                    <span style={{ color: '#FBBF24' }}>⭐ 4.9 (87 reviews)</span>
                  </div>
                </div>
                <div className={`${styles.visualCard} ${styles.visualCardRight}`}>
                  <span className={styles.visualEmoji}>💡</span>
                  <div className={styles.visualText}>
                    <strong>{locale === 'ar' ? 'محمود أحمد' : 'Mahmoud Ahmed'}</strong>
                    <span>{locale === 'ar' ? 'مُعلم رياضيات — الإسكندرية' : 'Math Tutor — Alexandria'}</span>
                    <span style={{ color: '#FBBF24' }}>⭐ 5.0 (124 reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className={`section ${styles.steps}`}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
              <h2 className="section-title">{locale === 'ar' ? 'كيف تبدأ؟' : 'How It Works'}</h2>
              <p className="section-subtitle">{locale === 'ar' ? '4 خطوات بسيطة للبدء في التدريس' : '4 simple steps to start teaching'}</p>
            </div>
            <div className={styles.stepsGrid}>
              {steps.map((step, i) => (
                <div key={i} className={styles.stepCard}>
                  <div className={styles.stepNum}>{i + 1}</div>
                  <div className={styles.stepIcon}>{step.icon}</div>
                  <h3 className={styles.stepTitle}>{locale === 'ar' ? step.ar.title : step.en.title}</h3>
                  <p className={styles.stepDesc}>{locale === 'ar' ? step.ar.desc : step.en.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Perks */}
        <section className={`section ${styles.perks}`}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
              <h2 className="section-title">{locale === 'ar' ? 'مميزاتك كمعلم' : 'Your Tutor Benefits'}</h2>
            </div>
            <div className={styles.perksGrid}>
              {perks.map((perk, i) => (
                <div key={i} className={styles.perkCard}>
                  <span className={styles.perkIcon}>{perk.icon}</span>
                  <span className={styles.perkText}>{locale === 'ar' ? perk.ar : perk.en}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <div className="container" style={{ textAlign: 'center' }}>
            <h2 className={styles.ctaTitle}>{locale === 'ar' ? 'هل أنت مستعد؟' : 'Ready to Start?'}</h2>
            <p className={styles.ctaDesc}>
              {locale === 'ar' ? 'انضم لمجتمع المعلمين على AlemnyPro اليوم' : 'Join the AlemnyPro tutor community today'}
            </p>
            <Link href="/auth/register?role=tutor" className="btn btn-secondary btn-lg">
              🚀 {locale === 'ar' ? 'سجّل كمعلم الآن' : 'Register as a Tutor Now'}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
