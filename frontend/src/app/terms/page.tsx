'use client';

import React from 'react';
import Footer from '@/components/layout/Footer';
import { useLocale } from '@/lib/locale';
import styles from '../legal.module.css';

export default function TermsPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const t = {
    title: isAr ? 'شروط وأحكام الاستخدام' : 'Terms of Service',
    lastUpdated: isAr ? 'آخر تحديث: 20 أبريل 2026' : 'Last Updated: April 20, 2026',
    
    docs: isAr ? (
      <>
        <p>مرحبًا بك في موقع <strong>AlemnyPro</strong>. إن استخدامك لمنصتنا كطالب أو كمعلم يعني موافقتك الكاملة على جميع هذه الشروط والأحكام. يُرجى قراءتها بعناية تامة.</p>

        <h2>1. شروط عامة</h2>
        <ul>
          <li>يجب أن تكون التفاصيل التي تقدمها أثناء التسجيل (مثل الاسم وعنوان الإيميل ورقم الواتساب) صحيحة ودقيقة ومحدثة دائمًا.</li>
          <li>يجب الحفاظ على أمان وسرية معلومات الحساب الخاصة بك، وأنت المسؤول الأول عن أي نشاط يحدث عبر حسابك.</li>
          <li>تحتفظ المنصة بكامل الحق في تعديل أو تغيير الشروط والأحكام في أي وقت، وسيتم إعلام المستخدمين بذلك عند أي تغيير جوهري في السياسات.</li>
        </ul>

        <h2>2. قواعد المعلمين (قواعد صارمة)</h2>
        <p>يتحمل المعلمون المسؤوليات والأحكام التالية:</p>
        <ul>
          <li><strong>الالتزام بالمواعيد:</strong> يجب على المعلم الالتزام بحضور جلسات الدروس المُجدولة في أوقاتها المُحددة تجنباً للتقييم المتدني وتعريض حسابه للحظر المؤقت.</li>
          <li><strong>دقة المعلومات والمؤهلات:</strong> من الضروري والموجب تقديم مستندات تثبت الهوية والشهادات العلمية المطلوبة؛ وللمنصة حق مراجعتها.</li>
          <li><strong>الاحترام والمهنية:</strong> على المعلم الحفاظ دائماً على الاحترافية التامة في التعامل، وتجنب مشاركة أي معلومات غير ملائمة أو خادشة للحياء بأي صورة كانت.</li>
          <li><strong>الالتزام داخل المنصة:</strong> يُمنع منعاً باتاً استقطاب الطلاب لإعطائهم دروساً وتلقي المدفوعات خارج إطار بوابات الدفع الرسمية للمنصة حيث يعرض ذلك حساب المعلم للإلغاء الدائم.</li>
        </ul>

        <h2>3. قواعد الطلاب</h2>
        <p>كمستفيد من خدمات AlemnyPro، أنت توافق مسبقاً على:</p>
        <ul>
          <li>دفع رسوم الحجوزات المطلوبة والمحددة قبل بدء الجلسات الأكاديمية لحجز وقت المعلم.</li>
          <li>احترام المعلمين التام وعدم الانخراط مطلقاً في أي أنشطة أو محادثات خارجة عن نطاق السياق التعليمي الأكاديمي.</li>
          <li>يحق لك كطالب رفع نزاع أو شكوى (Dispute) عبر المنصة في حال لم تُنفذ الجلسة بشكل صحيح، وسيتم مراجعة الطلب من قبل الإدارة لحفظ حقوقك.</li>
        </ul>

        <h2>4. سياسة الدفع والاسترداد</h2>
        <ul>
          <li>تُعالج المدفوعات بالكامل عبر بوابات دفع شريكة وآمنة على أعلى المستويات التنظيمية.</li>
          <li>يتم تحويل أرباح المعلمين بانتظام وفقًا لجدول دورة السحب وحسب سياسة العوائد المتفق عليها داخل لوحة التحكم.</li>
          <li>في حالات إلغاء الدروس من قِبل المعلم، يسترد الطالب تلقائياً كامل المبلغ أو يُعاد ترتيب جلسة تعويضية بالتوافق.</li>
          <li>رسوم الخدمة وتوزيع الأرباح موضحة باستمرار في لوحة تحكم المعلم وتكون ملزمة للطرفين منذ لحظة التسجيل.</li>
        </ul>

        <h2>5. حقوق الملكية الفكرية</h2>
        <p>أي محتوى أصلي، شعارات مستخدمة، والتصميمات الرقمية الخاصة بمنصة AlemnyPro محمية بقوانين وحقوق الطبع والنشر ولا يجوز نقلها أو استخدامها بأي شكل من الأشكال بدون موافقة كتابية صريحة. في حين أن المواد الدراسية التي يقدمها ويعدها المعلم تعود ملكيتها الفكرية له حصراً.</p>

        <h2>6. إنهاء الحساب</h2>
        <p>نحتفظ نحن في مؤسسة AlemnyPro بالحق المكتسب في تعليق، أو إنهاء، أو تقييد حساب أي مستخدم بشكل فوري دون إشعار مسبق في حال ثبوت الانتهاك الصريح لهذه الشروط، بما في ذلك سوء السلوك أو محاولة الاحتيال داخل المنصة.</p>
      </>
    ) : (
      <>
        <p>Welcome to <strong>AlemnyPro</strong>. By using our platform, whether as a student or a tutor, you agree to comply with and be bound by the following Terms of Service. Please read them carefully.</p>

        <h2>1. General Terms</h2>
        <ul>
          <li>All information you provide during registration (such as your name, email, and WhatsApp number) must be entirely true, accurate, and kept up-to-date.</li>
          <li>You are solely responsible for keeping your account credentials secure and are liable for any and all activity that occurs under your account.</li>
          <li>We fully reserve the right to modify or adjust these Terms and Conditions at any chosen time. Registered users will be duly notified of significant policy changes.</li>
        </ul>

        <h2>2. Rules for Tutors</h2>
        <p>Tutors are subject to the following professional responsibilities:</p>
        <ul>
          <li><strong>Punctuality:</strong> Tutors must strictly attend scheduled lesson sessions on time to prevent low ratings and temporary account suspensions.</li>
          <li><strong>Accuracy of Qualifications:</strong> It is mandatory to provide valid documentation verifying identity and educational credentials as requested; we reserve the right to audit these continuously.</li>
          <li><strong>Professionalism:</strong> Tutors must maintain utmost professional conduct at all times, avoiding sharing any inappropriate material in any form.</li>
          <li><strong>Platform Compliance:</strong> Attempting to redirect students to conduct lessons or effect payments strictly outside the platform's official payment gateways is heavily prohibited and will lead to an immediate and permanent account ban.</li>
        </ul>

        <h2>3. Rules for Students</h2>
        <p>As a student using AlemnyPro, you actively agree to:</p>
        <ul>
          <li>Promptly pay for booked sessions in advance before lessons commence as required to secure the requested tutor's schedule.</li>
          <li>Respect all tutors fully and never engage in any activities or communications outside the direct scope of your academic learning objectives.</li>
          <li>If a lesson session is not fulfilled as originally agreed, you have the right to file an official dispute via the platform's dashboard, which administration will review fairly to secure your rights.</li>
        </ul>

        <h2>4. Payment and Refund Policies</h2>
        <ul>
          <li>All financial payments are securely processed through official third-party regulated gateway partners.</li>
          <li>Tutor earnings are systematically transferred according to the platform's designated payout schedule explicitly detailed in your dashboard settings.</li>
          <li>In the scenario where a tutor heavily initiates the cancellation of an upcoming class, the student will automatically receive a full refund or a mutually agreed-upon make-up session.</li>
          <li>Platform service fees and earning distributions are completely transparent within the tutor dashboard and are mutually binding following registration.</li>
        </ul>

        <h2>5. Intellectual Property Rights</h2>
        <p>All original visual content, utilized logos, and interface designs of the AlemnyPro platform are robustly protected by international copyright laws and cannot be appropriated without explicit written consent. Contrastingly, any educational material independently generated by a tutor naturally remains their sole intellectual property.</p>

        <h2>6. Account Termination</h2>
        <p>We steadfastly reserve the right to indefinitely suspend, restrict, or formally terminate any user's active account instantly and without prior notice in cases of proven clear violations of these Terms, specifically including grave misconduct, harassment, or documented platform fraud.</p>
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
