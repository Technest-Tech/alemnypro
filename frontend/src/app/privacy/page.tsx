'use client';

import React from 'react';
import Footer from '@/components/layout/Footer';
import { useLocale } from '@/lib/locale';
import styles from '../legal.module.css'; // Path is one level up since we put legal.module.css in app/

export default function PrivacyPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const t = {
    title: isAr ? 'سياسة الخصوصية' : 'Privacy Policy',
    lastUpdated: isAr ? 'آخر تحديث: 20 أبريل 2026' : 'Last Updated: April 20, 2026',
    
    docs: isAr ? (
      <>
        <p>نحن في <strong>AlemnyPro</strong> ("منصة علمني برو"، "نحن"، "لنا") نلتزم بحماية خصوصيتك ومعلوماتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية البيانات التي تقدمها عند استخدامك لمنصتنا.</p>

        <h2>1. المعلومات التي نجمعها</h2>
        <p>نقوم بجمع أنواع معينة من المعلومات لتوفير تجربة مستخدم آمنة ومريحة:</p>
        <ul>
          <li><strong>معلومات الحساب:</strong> مثل الاسم الكامل، البريد الإلكتروني، ورقم الهاتف المحمول (الواتساب) عند التسجيل.</li>
          <li><strong>بيانات الملف الشخصي:</strong> بالنسبة للمعلمين، نجمع معلومات الحساب البنكي للتسويات المالية (اختياري)، والمؤهلات الدراسية، والخلفية المهنية.</li>
          <li><strong>معلومات الاستخدام:</strong> بيانات حول كيفية تفاعلك مع خدماتنا (الصفحات التي تزورها، مدة الزيارة).</li>
        </ul>

        <h2>2. كيف نستخدم معلوماتك</h2>
        <p>نستخدم البيانات التي نجمعها للأغراض التالية:</p>
        <ul>
          <li>تسهيل وتسجيل عمليات الحجز والدروس الخصوصية بين الطلاب والمعلمين.</li>
          <li>معالجة المدفوعات المالية وتحويل أرباح المعلمين بأمان وحفظ حقوق الجميع.</li>
          <li>توفير وتطوير وتحسين جودة منصة AlemnyPro.</li>
          <li>إرسال الإشعارات التقنية والإدارية المتعلقة بالمنصة، مثل تذكيرات الجلسات.</li>
        </ul>

        <h2>3. مشاركة المعلومات</h2>
        <p>نحن لا نبيع أو نؤجر أبدًا معلوماتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك في الحالات المحدودة التالية:</p>
        <ul>
          <li><strong>مع مقدمي الخدمات:</strong> مثل بوابات الدفع الإلكتروني الموثوقة لمعالجة المعاملات المالية.</li>
          <li><strong>الالتزام القانوني:</strong> إذا طُلب منا ذلك بموجب أحكام القانون الساري من الجهات الرسمية المعنية.</li>
        </ul>

        <h2>4. أمن البيانات الخاصة بك</h2>
        <p>لقد قمنا بتنفيذ إجراءات أمنية صارمة ومناسبة تقنياً وإدارياً لحماية بياناتك الشخصية من الفقد أو الوصول غير المصرح به أو التغيير. جميع بياناتك مشفرة ومحفوظة باستخدام خوادم مؤمنة.</p>

        <h2>5. حقوقك</h2>
        <p>لديك الحق في الوصول إلى معلوماتك الشخصية التي نحتفظ بها، والقدرة المطلقة على تصحيحها أو طلب حذف حسابك بالكامل عبر لوحة التحكم الخاصة بك في أي وقت.</p>

        <h2>6. تواصل معنا</h2>
        <p>إذا كان لديك أي أسئلة أو استفسارات حول سياسة الخصوصية الخاصة بنا، لا تتردد في الاتصال بنا عبر: <strong>support@alemnypro.com</strong></p>
      </>
    ) : (
      <>
        <p>At <strong>AlemnyPro</strong> ("we", "us", or "our"), we are strongly committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, and safeguard the data you provide when using our platform.</p>

        <h2>1. Information We Collect</h2>
        <p>We collect certain types of information to provide you with a safe and comfortable user experience:</p>
        <ul>
          <li><strong>Account Information:</strong> Such as your full name, email address, and mobile number (WhatsApp) when you register.</li>
          <li><strong>Profile Data:</strong> For tutors, we collect necessary payment/payout details (optional), educational qualifications, and professional background material.</li>
          <li><strong>Usage Information:</strong> Data regarding how you interact with our services (e.g., pages visited, duration of visits).</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the data we collect for the following main purposes:</p>
        <ul>
          <li>To facilitate and record bookings and private lessons between students and tutors.</li>
          <li>To securely process payments and distribute tutor earnings, protecting everyone's rights.</li>
          <li>To provide, develop, and improve the overall quality of the AlemnyPro platform.</li>
          <li>To send you important technical and administrative notifications, such as session reminders.</li>
        </ul>

        <h2>3. Sharing of Information</h2>
        <p>We never sell or rent your personal information to third parties. We may share your information only in the following limited circumstances:</p>
        <ul>
          <li><strong>With Service Providers:</strong> Such as trusted third-party payment gateways to process financial transactions securely.</li>
          <li><strong>Legal Compliance:</strong> If required to do so by applicable laws or official government authorities.</li>
        </ul>

        <h2>4. Data Security</h2>
        <p>We have implemented strict technical and administrative security measures to protect your personal data from loss, unauthorized access, or alteration. All personal data is encrypted and stored safely on secured servers.</p>

        <h2>5. Your Rights</h2>
        <p>You have the absolute right to access the personal information we hold about you, the ability to correct it, or request full deletion of your account via your settings dashboard anytime.</p>

        <h2>6. Contact Us</h2>
        <p>If you have any questions or concerns about our Privacy Policy, please feel free to contact us at: <strong>support@alemnypro.com</strong></p>
      </>
    )
  };

  return (
    <>
      
      <div className={`${styles.page} ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>{t.title}</h1>
            <div className={styles.lastUpdated}>
              <span>📅</span> {t.lastUpdated}
            </div>
          </div>
          <div className={styles.content}>
            {t.docs}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
