'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from '@/lib/locale';
import Footer from '@/components/layout/Footer';
import styles from './about.module.css';

export default function AboutPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const t = {
    hero: {
      badge: isAr ? '✨ تعرف علينا' : '✨ GET TO KNOW US',
      title1: isAr ? 'نحن نغير مفهوم' : 'We are changing',
      titleGradient: isAr ? 'التعليم' : 'Education',
      title2: isAr ? 'في الوطن العربي' : 'in the Arab World',
      subtitle: isAr
        ? 'منصة علمني برو هي الوجهة الأولى للطلاب والمعلمين للوصول إلى أعلى مستويات التميز الأكاديمي عبر توفير تجربة تعليمية حديثة، موثوقة، وسهلة الاستخدام.'
        : 'AlemnyPro is the premier destination for students and tutors to achieve academic excellence through a modern, reliable, and user-friendly educational experience.',
    },
    stats: [
      { num: '+٥٠,٠٠٠', numEn: '50K+', label: isAr ? 'طالب نشط' : 'Active Students' },
      { num: '+٢,٠٠٠', numEn: '2K+', label: isAr ? 'معلم محترف' : 'Expert Tutors' },
      { num: '+١٠٠,٠٠٠', numEn: '100K+', label: isAr ? 'ساعة دراسية' : 'Hours Taught' },
      { num: '%٩٩', numEn: '99%', label: isAr ? 'نسبة الرضا' : 'Satisfaction Rate' }
    ],
    values: {
      title: isAr ? 'لماذا تختار علمني برو؟' : 'Why Choose AlemnyPro?',
      subtitle: isAr 
        ? 'بنينا منصتنا على أسس الجودة والتكنولوجيا الحديثة لضمان نجاح كل من المعلم والطالب.' 
        : 'We built our platform on the foundations of quality and modern technology to ensure the success of both tutors and students.',
      cards: [
        {
          icon: '💎',
          title: isAr ? 'جودة لا يُعلى عليها' : 'Unmatched Quality',
          desc: isAr 
            ? 'نحن نختار معلمينا بعناية فائقة لضمان حصولك على أفضل تجربة تعليمية.' 
            : 'We carefully select our tutors to guarantee you the best possible learning experience.'
        },
        {
          icon: '🚀',
          title: isAr ? 'تجربة مستخدم حديثة' : 'Modern Experience',
          desc: isAr 
            ? 'واجهة تفاعلية سهلة الاستخدام تناسب جميع الأجهزة، لتتعلم في أي وقت وأي مكان.' 
            : 'An interactive, easy-to-use interface that fits all devices, so you can learn anytime, anywhere.'
        },
        {
          icon: '🛡️',
          title: isAr ? 'أمان وثقة تامة' : 'Absolute Trust & Security',
          desc: isAr 
            ? 'أنظمة حماية متطورة وعمليات دفع آمنة تضمن حقوق المعلم والطالب بنسبة 100%.' 
            : 'Advanced security systems and safe payment gateways ensure 100% rights for both tutors and students.'
        }
      ]
    },
    story: {
      quote: isAr 
        ? '"هدفنا ليس فقط تقديم منصة تعليمية، بل خلق مجتمع يدعم شغف التعلم ويصل بالطالب لأعلى المراتب."' 
        : '"Our goal is not just to provide an educational platform, but to create a community that supports the passion for learning and elevates students to the highest ranks."',
      author: isAr ? 'فريق مؤسسي علمني برو' : 'AlemnyPro Founding Team',
      role: isAr ? 'منصة التعليم الرائدة للمستقبل' : 'The Leading EdTech Platform for the Future'
    },
    cta: {
      title: isAr ? 'هل أنت مستعد للبدء؟' : 'Are You Ready to Start?',
      desc: isAr 
        ? 'انضم إلى آلاف الطلاب والمعلمين الذين يثقون في علمني برو.' 
        : 'Join thousands of students and tutors who trust AlemnyPro.',
      btnStudent: isAr ? 'ابدأ كطالب 🎓' : 'Start Learning 🎓',
      btnTutor: isAr ? 'أصبح معلماً 🚀' : 'Become a Tutor 🚀'
    }
  };

  return (
    <>
      
      <div className={`${styles.page} ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* ──Hero Section── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className={styles.badge}>{t.hero.badge}</div>
          <h1 className={styles.title}>
            {t.hero.title1} <br />
            <span className={styles.gradientText}>{t.hero.titleGradient}</span>{' '}
            {t.hero.title2}
          </h1>
          <p className={styles.subtitle}>{t.hero.subtitle}</p>
        </div>
      </section>

      {/* ──Stats Section── */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {t.stats.map((stat, i) => (
            <div key={i} className={styles.statItem}>
              <div className={styles.statNumber}>{isAr ? stat.num : stat.numEn}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ──Values Section── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t.values.title}</h2>
          <p className={styles.sectionSubtitle}>{t.values.subtitle}</p>
        </div>
        <div className={styles.valuesGrid}>
          {t.values.cards.map((card, i) => (
            <div key={i} className={styles.valueCard}>
              <div className={styles.valueIconWrap}>{card.icon}</div>
              <div>
                <h3 className={styles.valueTitle}>{card.title}</h3>
                <p className={styles.valueDesc}>{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──Story / Vision Quote── */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.storySection}>
          <div className={styles.storyContent}>
            <div className={styles.storyQuote}>{t.story.quote}</div>
            <div className={styles.storyAuthor}>
              {t.story.author}
              <span>{t.story.role}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ──CTA Section── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <div className={styles.ctaBg} />
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>{t.cta.title}</h2>
            <p className={styles.ctaDesc}>{t.cta.desc}</p>
            <div className={styles.ctaButtons}>
              <Link href="/auth/register" className={styles.ctaBtnPrimary}>
                {t.cta.btnStudent}
              </Link>
              <Link href="/auth/tutor-register" className={styles.ctaBtnSecondary}>
                {t.cta.btnTutor}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
      <Footer />
    </>
  );
}
