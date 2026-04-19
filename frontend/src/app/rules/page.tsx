'use client';

import { useLocale } from '@/lib/locale';
import Footer from '@/components/layout/Footer';
import styles from '../legal.module.css';

export default function RulesPage() {
  const { locale } = useLocale();

  return (
    <>
      
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroTopGlow} />
          <div className="container">
            <h1 className={styles.heroTitle}>
              {locale === 'ar' ? 'قواعد وإرشادات المنصة' : 'Platform Rules & Guidelines'}
            </h1>
            <p className={styles.heroDesc}>
              {locale === 'ar'
                ? 'تعرف على الشروط والقواعد لضمان بيئة تعليمية آمنة للجميع.'
                : 'Learn about the terms and guidelines to ensure a safe learning environment for everyone.'}
            </p>
          </div>
        </section>

        <section className={`container ${styles.contentContainer}`}>
          <div className={styles.lastUpdated}>
            {locale === 'ar' ? 'آخر تحديث: أبريل 2026' : 'Last Updated: April 2026'}
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span aria-hidden="true">🤝</span>
              {locale === 'ar' ? '1. الاحترام المتبادل' : '1. Mutual Respect'}
            </h2>
            <p className={styles.sectionText}>
              {locale === 'ar'
                ? 'نتوقع من جميع المستخدمين (معلمين وطلاب) التعامل باحترام ومهنية. لا يُسمح بأي شكل من أشكال التمييز، التحرش، أو الإساءة اللفظية عبر منصتنا.'
                : 'We expect all users (tutors and students) to interact with respect and professionalism. Any form of discrimination, harassment, or verbal abuse is strictly prohibited on our platform.'}
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span aria-hidden="true">📅</span>
              {locale === 'ar' ? '2. الالتزام بالمواعيد' : '2. Punctuality and Commitment'}
            </h2>
            <p className={styles.sectionText}>
              {locale === 'ar'
                ? 'يجب على المعلم والطالب الالتزام التام بمواعيد الحصص المحجوزة. في حال الرغبة في إلغاء أو تأجيل حصة، يجب إخطار الطرف الآخر بشكل مسبق (على الأقل قبل 24 ساعة).'
                : 'Both tutors and students must strictly adhere to the scheduled class times. If you need to cancel or reschedule a class, you must notify the other party in advance (at least 24 hours prior).'}
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span aria-hidden="true">💸</span>
              {locale === 'ar' ? '3. سياسة الدفع والاسترداد' : '3. Payment and Refund Policy'}
            </h2>
            <p className={styles.sectionText}>
              {locale === 'ar'
                ? 'تتم معالجة جميع المدفوعات بأمان من خلال المنصة أو عبر طرق الدفع المعتمدة. للاسترداد وتفاصيل الإلغاء، يرجى الرجوع لسياسات الدفع وقت إتمام الحجز. لا نتعامل مع المدفوعات النقدية خارج النظام لحماية حقوق المعلم والطالب.'
                : 'All payments are securely processed through the platform or approved payment methods. For refunds and cancellation details, please refer to the payment policies at the time of booking. We do not handle outside cash transactions to protect both the tutor and the student.'}
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span aria-hidden="true">📝</span>
              {locale === 'ar' ? '4. المحتوى التعليمي والملكية الفكرية' : '4. Educational Content and Intellectual Property'}
            </h2>
            <ul className={styles.sectionList}>
              <li>
                {locale === 'ar'
                  ? 'يجب أن يكون المحتوى التعليمي المُقدّم دقيقاً، ومناسباً للمنهج المتفق عليه.'
                  : 'Educational content provided must be accurate and appropriate for the agreed curriculum.'}
              </li>
              <li>
                {locale === 'ar'
                  ? 'يُمنع المعلمون من مشاركة أو استخدام مواد محمية بحقوق الطبع والنشر دون الحصول على الإذن المناسب.'
                  : 'Tutors are prohibited from sharing or using copyrighted materials without proper permission.'}
              </li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span aria-hidden="true">🛡️</span>
              {locale === 'ar' ? '5. أمان وحماية الحساب' : '5. Account Security and Protection'}
            </h2>
            <p className={styles.sectionText}>
              {locale === 'ar'
                ? 'أنت مسؤول عن الحفاظ على سرية معلومات حسابك، بما في ذلك كلمة المرور الخاصة بك. أي نشاط يتم عبر حسابك هو مسؤوليتك بالكامل. إذا لاحظت أي تداخل مشبوه للمعلومات بلّغ الإدارة فوراً.'
                : 'You are responsible for maintaining the confidentiality of your account information, including your password. Any activity conducted through your account is entirely your responsibility. If you notice any suspicious activity, notify administration immediately.'}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
