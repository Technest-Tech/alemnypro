'use client';

import { useLocale } from '@/lib/locale';
import styles from './TestimonialsGrid.module.css';

const TESTIMONIALS = [
  {
    nameAr: 'سارة محمود', nameEn: 'Sara Mahmoud', initial: 'س',
    gradientFrom: '#667eea', gradientTo: '#764ba2',
    subjectAr: 'رياضيات — ثانوية عامة', subjectEn: 'Math',
    stars: 5,
    textAr: 'بفضل الأستاذ أحمد، حصلت على 98 في الرياضيات في الثانوية العامة! أسلوبه في الشرح مختلف تماماً عن أي مدرس آخر. أنصح به بشدة لأي طالب.',
    textEn: 'Thanks to Mr. Ahmed, I got 98 in Math! His teaching style is completely different from any other tutor. I learned quickly how to be comfortable with difficult problems. Great Lesson!',
    dateAr: 'منذ يومين', dateEn: '2 days ago'
  },
  {
    nameAr: 'كريم عبدالله', nameEn: 'Karim Abdullah', initial: 'ك',
    gradientFrom: '#f093fb', gradientTo: '#f5576c',
    subjectAr: 'فيزياء وكيمياء', subjectEn: 'Physics',
    stars: 5,
    textAr: 'المنصة سهّلت عليّ إيجاد المدرس المناسب في وقت قصير جداً. الدروس أونلاين مريحة جداً وبنفس الكفاءة. شكراً AlemnyPro!',
    textEn: 'Not only super helpful but made me feel super comfortable. He is very knowledgeable and passionate about what he is talking about. Highly recommended!',
    dateAr: 'منذ ٣ أيام', dateEn: '3 days ago'
  },
  {
    nameAr: 'ندى حسن', nameEn: 'Nada Hassan', initial: 'ن',
    gradientFrom: '#4facfe', gradientTo: '#00f2fe',
    subjectAr: 'لغة إنجليزية — IELTS', subjectEn: 'English',
    stars: 5,
    textAr: 'حصلت على Band 7.5 في IELTS بعد شهرين فقط مع أستاذتي على المنصة. كانت التجربة رائعة والدروس منظمة جداً.',
    textEn: 'She is amazing, very holistic approach to learning and personalized: very excited to work with her! The experience was exactly what I needed.',
    dateAr: 'منذ ٥ أيام', dateEn: '5 days ago'
  },
  {
    nameAr: 'يوسف إبراهيم', nameEn: 'Youssef Ibrahim', initial: 'ي',
    gradientFrom: '#43e97b', gradientTo: '#38f9d7',
    subjectAr: 'برمجة Python', subjectEn: 'Programming',
    stars: 5,
    textAr: 'انتقلت من صفر لتطوير مشاريع حقيقية خلال 3 أشهر! الأستاذ صبور جداً ويشرح بأسلوب عملي يساعدك على الفهم الحقيقي.',
    textEn: 'He is incredibly patient and supportive! After meeting him, I have never felt nervous or embarrassed during a lesson. He is very observant and thoughtful.',
    dateAr: 'منذ أسبوع', dateEn: '1 week ago'
  },
];

export default function TestimonialsGrid({ titleAr, titleEn }: { titleAr?: string, titleEn?: string }) {
  const { locale } = useLocale();

  return (
    <section className={styles.section}>
      <div className="container">
        <h2 className={styles.title}>
          {locale === 'ar' 
            ? (titleAr || 'ماذا يقول طلابنا')
            : (titleEn || 'Our former students review their tutors')}
        </h2>

        <div className={styles.grid}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.header}>
                <div 
                  className={styles.avatar}
                  style={{ background: `linear-gradient(135deg, ${t.gradientFrom}, ${t.gradientTo})` }}
                >
                  {t.initial}
                </div>
                <div className={styles.headerInfo}>
                  <div className={styles.name}>{locale === 'ar' ? t.nameAr : t.nameEn}</div>
                  <div className={styles.subject}>
                    {locale === 'ar' ? `معلم ${t.subjectAr}` : `${t.subjectEn} tutor`}
                  </div>
                  <div className={styles.stars}>
                    {'★'.repeat(t.stars)}
                  </div>
                </div>
              </div>
              <p className={styles.quote}>{locale === 'ar' ? t.textAr : t.textEn}</p>
              <div className={styles.footer}>
                {locale === 'ar' ? t.nameAr.split(' ')[0] : t.nameEn.split(' ')[0]}, {locale === 'ar' ? t.dateAr : t.dateEn}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
