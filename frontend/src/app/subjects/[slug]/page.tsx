'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { publicApi } from '@/lib/api';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import styles from './subject.module.css';
import TestimonialsGrid from '@/components/ui/TestimonialsGrid/TestimonialsGrid';
import { tutorImgSrc } from '@/lib/tutorImage';


// ── Subject metadata ──
const SUBJECT_META: Record<string, { icon: string; nameAr: string; nameEn: string; gradient: string }> = {
  math: { icon: '📐', nameAr: 'رياضيات', nameEn: 'Mathematics', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  mathematics: { icon: '📐', nameAr: 'رياضيات', nameEn: 'Mathematics', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  physics: { icon: '🔬', nameAr: 'فيزياء', nameEn: 'Physics', gradient: 'linear-gradient(135deg, #0F2027, #2C5364)' },
  chemistry: { icon: '⚗️', nameAr: 'كيمياء', nameEn: 'Chemistry', gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  biology: { icon: '🧬', nameAr: 'أحياء', nameEn: 'Biology', gradient: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  arabic: { icon: '📖', nameAr: 'لغة عربية', nameEn: 'Arabic', gradient: 'linear-gradient(135deg, #c94b4b, #4b134f)' },
  english: { icon: '🌍', nameAr: 'لغة إنجليزية', nameEn: 'English', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  french: { icon: '🌐', nameAr: 'فرنساوي', nameEn: 'French', gradient: 'linear-gradient(135deg, #0052D4, #6FB1FC)' },
  programming: { icon: '💻', nameAr: 'برمجة', nameEn: 'Programming', gradient: 'linear-gradient(135deg, #0f0c29, #302b63)' },
  python: { icon: '🐍', nameAr: 'بايثون', nameEn: 'Python', gradient: 'linear-gradient(135deg, #1a1a2e, #16213e)' },
  history: { icon: '🏛️', nameAr: 'تاريخ', nameEn: 'History', gradient: 'linear-gradient(135deg, #834d9b, #d04ed6)' },
  geography: { icon: '🌏', nameAr: 'جغرافيا', nameEn: 'Geography', gradient: 'linear-gradient(135deg, #56ab2f, #a8e063)' },
};
const DEFAULT_META = { icon: '📚', nameAr: 'مادة', nameEn: 'Subject', gradient: 'linear-gradient(135deg,#1B4965,#2D6A8F)' };

// ── Verified Badge ──
function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── FAQ Data ──
const FAQ_DATA = [
  {
    qAr: 'ما هو متوسط سعر الدرس الخصوصي؟',
    qEn: 'What is the average price of a private lesson?',
    aAr: 'متوسط السعر يتراوح بين 100 - 300 ج.م للساعة حسب مستوى المعلم والمادة. معظم المعلمين يقدمون أول درس مجاني.',
    aEn: 'The average price ranges from 100 - 300 EGP/hour depending on the tutor level and subject. Most tutors offer the first lesson free.',
  },
  {
    qAr: 'كيف أختار المعلم المناسب؟',
    qEn: 'How do I choose the right tutor?',
    aAr: 'يمكنك الاطلاع على تقييمات الطلاب السابقين، والمؤهلات، وسنوات الخبرة. كما يمكنك حجز درس تجريبي مجاني مع أغلب المعلمين.',
    aEn: 'You can check previous student reviews, qualifications, and years of experience. You can also book a free trial lesson with most tutors.',
  },
  {
    qAr: 'هل يمكنني أخذ الدروس أونلاين؟',
    qEn: 'Can I take lessons online?',
    aAr: 'نعم! معظم معلمينا يقدمون دروس أونلاين عبر Zoom أو Google Meet أو منصتنا المدمجة. سهل ومريح من أي مكان.',
    aEn: 'Yes! Most of our tutors offer online lessons via Zoom, Google Meet, or our built-in platform. Easy and convenient from anywhere.',
  },
  {
    qAr: 'كيف يتم الدفع؟',
    qEn: 'How does payment work?',
    aAr: 'الدفع آمن 100% عبر المنصة. لا يحصل المعلم على المبلغ إلا بعد إتمام الدرس. يمكنك الإلغاء واسترداد المبلغ في أي وقت قبل الدرس.',
    aEn: 'Payment is 100% secure through the platform. The tutor only receives payment after the lesson is completed. You can cancel and get a refund anytime before the lesson.',
  },
  {
    qAr: 'كم عدد المعلمين المتاحين؟',
    qEn: 'How many tutors are available?',
    aAr: 'لدينا مئات المعلمين المعتمدين في جميع المواد والمراحل الدراسية عبر مصر. العدد يتزايد يومياً.',
    aEn: 'We have hundreds of certified tutors across all subjects and levels in Egypt. The number is growing daily.',
  },
];

export default function SubjectLandingPage() {
  const { slug } = useParams();
  const { locale } = useLocale();
  const slugStr = slug as string;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = useCallback((i: number) => {
    setOpenFaq(prev => prev === i ? null : i);
  }, []);

  // Fetch tutors for this subject
  const { data: results, isLoading } = useQuery({
    queryKey: ['subject-tutors', slugStr],
    queryFn: () => publicApi.searchTutors({ subject: slugStr }).then(r => r.data.data),
    enabled: !!slugStr,
  });

  const tutors = Array.isArray(results?.data || results) ? (results?.data || results) : [];
  const total = results?.total || tutors.length || 0;

  const meta = SUBJECT_META[slugStr.toLowerCase()] || DEFAULT_META;
  const subjectName = locale === 'ar' ? meta.nameAr : meta.nameEn;

  // Teacher images (original)
  const teacherImages = [
    '/images/teacher1.png',
    '/images/teacher2.png',
    '/images/teacher3.png',
    '/images/teacher4.jpg',
    '/images/teacher5.png',
  ];

  // Subject images
  const subjectImages = [
    '/images/subjects1.jpeg',
    '/images/subjects2.jpeg',
    '/images/subjects3.jpg',
    '/images/subjects4.jpeg',
    '/images/subjects5.jpeg',
    '/images/subjects6.jpeg',
  ];

  return (
    <>
      
      <main>
        {/* ═══════════════════════════════════════════
            HERO — Superprof-style with 3 overlapping images
        ═══════════════════════════════════════════ */}
        <section className={styles.hero}>
          <div className={`container ${styles.heroContent}`}>
            {/* Left side — Text */}
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                {locale === 'ar'
                  ? `ابحث عن أفضل معلمي ${subjectName}`
                  : `Find ${subjectName} tutors near you`}
              </h1>

              <ul className={styles.heroBullets}>
                <li><span className={styles.bulletIcon}>🎓</span> {locale === 'ar' ? `احجز دروس ${subjectName} وتفوق في مادتك` : `Take ${subjectName} classes and master the subject`}</li>
                <li><span className={styles.bulletIcon}>👨‍🏫</span> {locale === 'ar' ? `${total || '50'}+ معلم ${subjectName} متاح` : `${total || '50'}+ ${subjectName} tutors available`}</li>
                <li><span className={styles.bulletIcon}>🔒</span> {locale === 'ar' ? 'دفع آمن ومضمون' : 'Secure payment'}</li>
                <li><span className={styles.bulletIcon}>⭐</span> {locale === 'ar' ? 'تقييمات حقيقية ومعتمدة' : 'Verified reviews'}</li>
              </ul>

              {/* Search bar */}
              <div className={styles.heroSearchBar}>
                <div className={styles.heroSearchField}>
                  <span className={styles.heroSearchIcon}>📚</span>
                  <span className={styles.heroSearchText}>{subjectName}</span>
                </div>
                <div className={styles.heroSearchDivider} />
                <div className={styles.heroSearchField}>
                  <span className={styles.heroSearchIcon}>📍</span>
                  <span className={styles.heroSearchText}>{locale === 'ar' ? 'أونلاين أو حضوري' : 'Online or In-Person'}</span>
                </div>
                <Link href={`/search?subject=${slugStr}`} className={styles.heroSearchBtn}>
                  {locale === 'ar' ? 'ابحث' : 'Search'}
                </Link>
              </div>
            </div>

            {/* Right side — 3 overlapping images */}
            <div className={styles.heroVisual}>
              <div className={styles.heroImageCluster}>
                <div className={`${styles.heroImg} ${styles.heroImg1}`}>
                  <img src={subjectImages[0]} alt={subjectName} />
                </div>
                <div className={`${styles.heroImg} ${styles.heroImg2}`}>
                  <img src={subjectImages[1]} alt={subjectName} />
                </div>
                <div className={`${styles.heroImg} ${styles.heroImg3}`}>
                  <img src={subjectImages[2]} alt={subjectName} />
                </div>
              </div>
            </div>
          </div>

          {/* Rating bar */}
          <div className={styles.heroRatingBar}>
            <span className={styles.ratingLabel}>{locale === 'ar' ? 'ممتاز' : 'Excellent'} (4.9)</span>
            <span className={styles.ratingStarsInline}>★★★★★</span>
            <span className={styles.ratingMeta}>{locale === 'ar' ? '• آلاف التقييمات من الطلاب' : '• Thousands of student reviews'}</span>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            BREADCRUMBS + TUTOR GRID
        ═══════════════════════════════════════════ */}
        <section className={styles.tutorsSection}>
          <div className="container">
            {/* Breadcrumbs */}
            <div className={styles.breadcrumbs}>
              <Link href="/">{locale === 'ar' ? 'الرئيسية' : 'Home'}</Link>
              <span>›</span>
              <Link href="/search">{locale === 'ar' ? 'المواد' : 'Subjects'}</Link>
              <span>›</span>
              <span>{subjectName}</span>
            </div>

            <h2 className={styles.tutorsSectionTitle}>
              {locale === 'ar'
                ? `تعلم ${subjectName} مع أفضل المعلمين الخصوصيين`
                : `Learn ${subjectName} with the help of one of our expert tutors`}
            </h2>

            {/* Tutor Cards Grid — Same card style as homepage */}
            {isLoading ? (
              <div className={styles.tutorsGrid}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={styles.tutorCardSkeleton}>
                    <div className="skeleton" style={{ height: 240, borderRadius: '16px 16px 0 0' }} />
                    <div style={{ padding: 16 }}>
                      <div className="skeleton skeleton-title" />
                      <div className="skeleton skeleton-text" style={{ marginTop: 8 }} />
                      <div className="skeleton" style={{ height: 36, borderRadius: 8, marginTop: 12 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : tutors.length === 0 ? (
              <div className={styles.emptyState}>
                <span style={{ fontSize: '3rem' }}>🔍</span>
                <p>{locale === 'ar' ? 'لا يوجد معلمون حالياً — جرّب البحث' : 'No tutors found — try searching'}</p>
                <Link href="/search" className="btn btn-primary btn-md" style={{ marginTop: 12 }}>
                  {locale === 'ar' ? 'بحث المعلمين' : 'Search Tutors'}
                </Link>
              </div>
            ) : (
              <div className={styles.tutorsGrid}>
                {tutors.slice(0, 6).map((tutor: Record<string, unknown>, idx: number) => {
                  const user = tutor.user as Record<string, unknown>;
                  const isVerified = tutor.verification_status === 'verified';
                  const imageSrc = tutorImgSrc(user);


                  return (
                    <Link key={tutor.id as number} href={`/tutor/${tutor.slug}`} className={styles.teacherCard}>
                      <div className={styles.teacherImageWrap}>
                        <img src={imageSrc} alt={user?.name as string || ''} className={styles.teacherCoverImage} />
                        <span className={styles.favoriteBadge}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        </span>
                        <div className={styles.ratingOverlay}>
                          <span className={styles.ratingStarIcon}>★</span>
                          <span>{tutor.avg_rating as string}</span>
                          <span className={styles.ratingCount}>({tutor.total_reviews as number})</span>
                        </div>
                      </div>
                      <div className={styles.teacherContent}>
                        <div className={styles.teacherNameRow}>
                          <span className={styles.teacherName}>{user?.name as string}</span>
                          {isVerified && <VerifiedBadge size={16} />}
                        </div>
                        <div className={styles.teacherHeadline}>
                          {locale === 'ar' ? tutor.headline_ar as string : tutor.headline_en as string}
                        </div>
                        <div className={styles.teacherSubjects}>
                          {((tutor.subjects as Record<string, unknown>[]) || []).slice(0, 3).map((s: Record<string, unknown>) => (
                            <span key={s.id as number} className={styles.teacherSubjectTag}>
                              {locale === 'ar' ? s.name_ar as string : s.name_en as string}
                            </span>
                          ))}
                        </div>
                        <div className={styles.teacherFooter}>
                          <div className={styles.teacherPrice}>
                            <span className={styles.priceNum}>{tutor.hourly_rate as string}</span>
                            <span className={styles.priceUnit}>{locale === 'ar' ? 'ج.م/ساعة' : 'EGP/hr'}</span>
                          </div>
                          {!!tutor.is_first_lesson_free && (
                            <span className={styles.freeTag}>🎁 {locale === 'ar' ? 'أول ساعة مجانية' : '1st hr free'}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* See more CTA */}
            {tutors.length > 0 && (
              <div className={styles.seeMoreWrap}>
                <Link href={`/search?subject=${slugStr}`} className={styles.seeMoreBtn}>
                  {locale === 'ar' ? 'عرض المزيد من المعلمين →' : 'See more tutors →'}
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            STATS ROW — 3 highlight cards
        ═══════════════════════════════════════════ */}
        <section className={styles.statsSection}>
          <div className="container">
            <div className={styles.statsGrid}>
              {[
                { num: '4.9', unitAr: '/5', unitEn: '/5', descAr: 'أكثر من 500 تقييم من طلاب حقيقيين', descEn: 'Over 500 ratings from real students', icon: '⭐' },
                { num: '150', unitAr: 'ج.م/س', unitEn: 'EGP/hr', descAr: 'متوسط سعر الدرس. 95% من المعلمين يقدمون أول ساعة مجاناً', descEn: 'Average lesson price. 95% of tutors offer the first hour free', icon: '💰' },
                { num: '3', unitAr: 'ساعات', unitEn: 'hrs', descAr: 'سرعة الاستجابة. معلمونا يردون في أقل من 3 ساعات', descEn: 'Response time. Our tutors typically respond in less than 3 hours', icon: '⏱️' },
              ].map((stat, i) => (
                <div key={i} className={styles.statCard}>
                  <div className={styles.statTop}>
                    <span className={styles.statNum}>{stat.num}<small>{locale === 'ar' ? stat.unitAr : stat.unitEn}</small></span>
                    <span className={styles.statIcon}>{stat.icon}</span>
                  </div>
                  <p className={styles.statDesc}>{locale === 'ar' ? stat.descAr : stat.descEn}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            TESTIMONIALS GRID
        ═══════════════════════════════════════════ */}
        <TestimonialsGrid
          titleAr={`ماذا يقول طلابنا عن دروس ${subjectName}`}
          titleEn={`Our former students review their ${subjectName} tutors`}
        />

        {/* ═══════════════════════════════════════════
            HOW IT WORKS — 3 steps
        ═══════════════════════════════════════════ */}
        <section className={styles.howSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>
              {locale === 'ar'
                ? `تعلم ${subjectName} لم يكن بهذه البساطة`
                : `Learning ${subjectName} has never been this simple`}
            </h2>

            <div className={styles.stepsGrid}>
              {[
                {
                  num: '01',
                  titleAr: 'اختر',
                  titleEn: 'Choose',
                  descAr: 'تصفح المعلمين المعتمدين واختر الأنسب لك حسب ميزانيتك ومستواك وجدولك.',
                  descEn: 'Browse verified tutors and choose the best fit based on your budget, level, and schedule.',
                  image: teacherImages[3],
                },
                {
                  num: '02',
                  titleAr: 'تواصل',
                  titleEn: 'Connect',
                  descAr: 'تواصل مع معلمك، وضّح احتياجاتك، واتفقوا على الموعد والطريقة المناسبة.',
                  descEn: 'Exchange with your tutor, explain your needs and discuss availability. Schedule your classes securely.',
                  image: teacherImages[4],
                },
                {
                  num: '03',
                  titleAr: 'تقدّم',
                  titleEn: 'Progress',
                  descAr: 'اختر وقتك، احجز دروسك، وادفع بأمان. كل ما عليك هو التعلّم!',
                  descEn: 'Choose your time and book your lessons, then pay securely. All that\'s left is to learn!',
                  image: teacherImages[0],
                },
              ].map((step, i) => (
                <div key={i} className={styles.stepCard}>
                  <span className={styles.stepNum}>{step.num}</span>
                  <h3 className={styles.stepTitle}>{locale === 'ar' ? step.titleAr : step.titleEn}</h3>
                  <p className={styles.stepDesc}>{locale === 'ar' ? step.descAr : step.descEn}</p>
                  <div className={styles.stepImageWrap}>
                    <img src={step.image} alt="" className={styles.stepImage} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            FAQ
        ═══════════════════════════════════════════ */}
        <section className={styles.faqSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>FAQ</h2>
            <div className={styles.faqList}>
              {FAQ_DATA.map((faq, i) => (
                <div key={i} className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ''}`}>
                  <button className={styles.faqQuestion} onClick={() => toggleFaq(i)}>
                    <span>{locale === 'ar' ? faq.qAr : faq.qEn}</span>
                    <span className={styles.faqChevron}>{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && (
                    <div className={styles.faqAnswer}>
                      {locale === 'ar' ? faq.aAr : faq.aEn}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            CTA BANNER
        ═══════════════════════════════════════════ */}
        <section className={styles.ctaBanner}>
          <div className="container">
            <div className={styles.ctaBannerInner}>
              <h2 className={styles.ctaBannerTitle}>
                {locale === 'ar'
                  ? `دروس ${subjectName} مصممة لتناسب وتيرتك وأهدافك`
                  : `Flexible ${subjectName} courses designed to match your pace and individual goal`}
              </h2>
              <p className={styles.ctaBannerDesc}>
                {locale === 'ar'
                  ? `ادرس بثقة مع معلمي ${subjectName} المعتمدين الذين سيوجهوك في كل خطوة.`
                  : `Study confidently with our ${subjectName} tutors who are here to guide you every step of the way.`}
              </p>
              <Link href={`/search?subject=${slugStr}`} className={styles.ctaBannerBtn}>
                {locale === 'ar' ? 'عرض المزيد من المعلمين →' : 'See more tutors →'}
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            ESSENTIAL INFO TABLE
        ═══════════════════════════════════════════ */}
        <section className={styles.infoSection}>
          <div className="container">
            <h2 className={styles.sectionTitle} style={{ textAlign: 'center' }}>
              {locale === 'ar'
                ? `معلومات أساسية عن دروس ${subjectName}`
                : `Essential information about your ${subjectName} lessons`}
            </h2>
            <div className={styles.infoTable}>
              {[
                { labelAr: 'متوسط السعر', labelEn: 'Average price', valueAr: '150 ج.م/ساعة', valueEn: '150 EGP/hr', icon: '💰' },
                { labelAr: 'متوسط وقت الاستجابة', labelEn: 'Average response time', valueAr: '3 ساعات', valueEn: '3h', icon: '⏱️' },
                { labelAr: 'المعلمون المتاحون', labelEn: 'Tutors available', valueAr: `${total || '50'}+`, valueEn: `${total || '50'}+`, icon: '👨‍🏫' },
                { labelAr: 'صيغة الدرس', labelEn: 'Lesson format', valueAr: 'حضوري أو أونلاين', valueEn: 'Face-to-face or online', icon: '🖥️' },
              ].map((row, i) => (
                <div key={i} className={styles.infoRow}>
                  <div className={styles.infoLabel}>
                    <span className={styles.infoIcon}>✅</span>
                    <span>{locale === 'ar' ? row.labelAr : row.labelEn} :</span>
                  </div>
                  <span className={styles.infoValue}>{locale === 'ar' ? row.valueAr : row.valueEn}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
