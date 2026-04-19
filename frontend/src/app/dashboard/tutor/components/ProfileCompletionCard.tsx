'use client';

import Link from 'next/link';
import styles from './ProfileCompletionCard.module.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileData {
  headline_ar?: string;
  headline_en?: string;
  bio_ar?: string;
  bio_en?: string;
  hourly_rate?: number | string;
  lesson_format?: string;
  lesson_format_details?: { formats?: string[] };
  video_url?: string;
  is_live?: boolean;
  experience_years?: number;
  [key: string]: unknown;
}

interface SubjectData {
  id?: number;
  subject_id?: number;
  subject?: { id?: number };
}

interface DocData {
  type?: string;
  status?: string;
}

interface MeData {
  avatar?: string;
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
  [key: string]: unknown;
}

interface Props {
  profileData?: ProfileData;
  meData?: MeData;
  subjectsData?: SubjectData[];
  documentsData?: DocData[];
  isAr: boolean;
}

// ─── Checklist item definition ───────────────────────────────────────────────

interface CheckItem {
  id: string;
  icon: string;
  labelAr: string;
  labelEn: string;
  done: boolean;
  href: string;
  ctaAr: string;
  ctaEn: string;
  weight: number; // % contribution to total
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileCompletionCard({
  profileData,
  meData,
  subjectsData = [],
  documentsData = [],
  isAr,
}: Props) {
  const hasSubject   = subjectsData.length > 0;
  const hasRate      = Number(profileData?.hourly_rate ?? 0) > 0;
  const hasHeadline  = !!(profileData?.headline_ar || profileData?.headline_en);
  const hasBio       = !!(profileData?.bio_ar || profileData?.bio_en);
  const hasFormat    = !!(profileData?.lesson_format_details?.formats?.length || profileData?.lesson_format);
  const hasAvatar    = !!(meData?.avatar);
  const hasVideo     = !!(profileData?.video_url);
  const hasDocuments = documentsData.some(d =>
    ['national_id_front', 'national_id_back', 'national_id', 'criminal_record'].includes(d.type ?? '')
  );
  const isEmailOk    = !!(meData?.email_verified_at);

  const ITEMS: CheckItem[] = [
    {
      id: 'subject',
      icon: '📚',
      labelAr: 'اختر مادة واحدة على الأقل',
      labelEn: 'Add at least one subject',
      done: hasSubject,
      href: '/dashboard/tutor/listings',
      ctaAr: 'إضافة مادة',
      ctaEn: 'Add Subject',
      weight: 20,
    },
    {
      id: 'rate',
      icon: '💰',
      labelAr: 'حدد سعر الساعة',
      labelEn: 'Set your hourly rate',
      done: hasRate,
      href: '/dashboard/tutor/listings',
      ctaAr: 'تحديد السعر',
      ctaEn: 'Set Rate',
      weight: 20,
    },
    {
      id: 'headline',
      icon: '✍️',
      labelAr: 'اكتب عنواناً لإعلانك',
      labelEn: 'Write your ad headline',
      done: hasHeadline,
      href: '/dashboard/tutor/listings',
      ctaAr: 'كتابة العنوان',
      ctaEn: 'Write Headline',
      weight: 15,
    },
    {
      id: 'bio',
      icon: '📝',
      labelAr: 'أضف نبذة تعريفية',
      labelEn: 'Write your bio',
      done: hasBio,
      href: '/dashboard/tutor/listings',
      ctaAr: 'إضافة نبذة',
      ctaEn: 'Write Bio',
      weight: 10,
    },
    {
      id: 'format',
      icon: '📍',
      labelAr: 'حدد مكان التدريس',
      labelEn: 'Set your teaching format',
      done: hasFormat,
      href: '/dashboard/tutor/listings',
      ctaAr: 'تحديد المكان',
      ctaEn: 'Set Format',
      weight: 10,
    },
    {
      id: 'avatar',
      icon: '🖼️',
      labelAr: 'رفع صورة شخصية',
      labelEn: 'Upload a profile photo',
      done: hasAvatar,
      href: '/dashboard/tutor/listings',
      ctaAr: 'رفع صورة',
      ctaEn: 'Upload Photo',
      weight: 10,
    },
    {
      id: 'video',
      icon: '🎬',
      labelAr: 'أضف فيديو تعريفي (اختياري)',
      labelEn: 'Add intro video (optional)',
      done: hasVideo,
      href: '/dashboard/tutor/listings',
      ctaAr: 'إضافة فيديو',
      ctaEn: 'Add Video',
      weight: 5,
    },
    {
      id: 'docs',
      icon: '🔒',
      labelAr: 'رفع وثائق التحقق',
      labelEn: 'Upload verification docs',
      done: hasDocuments,
      href: '/dashboard/tutor/account',
      ctaAr: 'رفع الوثائق',
      ctaEn: 'Upload Docs',
      weight: 10,
    },
    {
      id: 'email',
      icon: '📧',
      labelAr: 'تأكيد البريد الإلكتروني',
      labelEn: 'Verify email address',
      done: isEmailOk,
      href: '/dashboard/tutor',
      ctaAr: 'تأكيد البريد',
      ctaEn: 'Verify Email',
      weight: 0, // bonus, not counted in main %
    },
  ];

  const mainItems   = ITEMS.filter(i => i.weight > 0);
  const completePct = mainItems.reduce((sum, i) => sum + (i.done ? i.weight : 0), 0);
  const doneCount   = ITEMS.filter(i => i.done).length;
  const isReady     = hasSubject && hasRate; // minimum to be searchable
  const isComplete  = completePct >= 90;

  if (isComplete) return null; // hide card when nearly done

  const pendingItems = ITEMS.filter(i => !i.done);
  const nextItem     = pendingItems[0];

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>🚀</div>
          <div>
            <h3 className={styles.title}>
              {isAr ? 'أكمل ملفك واجذب الطلاب' : 'Complete Your Profile'}
            </h3>
            <p className={styles.subtitle}>
              {isAr
                ? `${doneCount} من ${ITEMS.length} مكتملة`
                : `${doneCount} of ${ITEMS.length} done`}
            </p>
          </div>
        </div>
        <div className={styles.pctBadge} style={{
          background: completePct >= 80 ? 'linear-gradient(135deg, #059669, #0D9488)'
            : completePct >= 50 ? 'linear-gradient(135deg, #D97706, #F59E0B)'
            : 'linear-gradient(135deg, #1B4965, #2D6A8E)',
        }}>
          {completePct}%
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{
            width: `${completePct}%`,
            background: completePct >= 80
              ? 'linear-gradient(90deg, #059669, #0D9488)'
              : completePct >= 50
              ? 'linear-gradient(90deg, #D97706, #F59E0B)'
              : 'linear-gradient(90deg, #1B4965, #2D6A8E)',
          }}
        />
      </div>

      {/* Minimum live banner */}
      {!isReady && (
        <div className={styles.minBanner}>
          <span>⚠️</span>
          <span>
            {isAr
              ? 'أضف مادة وسعرًا لكي يتمكن الطلاب من العثور عليك'
              : 'Add a subject and a rate so students can find you'}
          </span>
        </div>
      )}

      {isReady && !isComplete && (
        <div className={styles.readyBanner}>
          <span>✅</span>
          <span>
            {isAr
              ? 'ملفك مرئي للطلاب! أكمل باقي التفاصيل لزيادة الحجوزات'
              : 'Profile is live! Complete more details to boost bookings'}
          </span>
        </div>
      )}

      {/* Checklist */}
      <div className={styles.checklist}>
        {ITEMS.map(item => (
          <div key={item.id} className={`${styles.item} ${item.done ? styles.itemDone : ''}`}>
            <div className={styles.itemLeft}>
              <div className={`${styles.itemCheck} ${item.done ? styles.itemCheckDone : ''}`}>
                {item.done ? '✓' : <span className={styles.itemIcon}>{item.icon}</span>}
              </div>
              <span className={styles.itemLabel}>
                {isAr ? item.labelAr : item.labelEn}
              </span>
            </div>
            {!item.done && (
              <Link href={item.href} className={styles.itemCta}>
                {isAr ? item.ctaAr : item.ctaEn} →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Next step CTA */}
      {nextItem && (
        <Link href={nextItem.href} className={styles.primaryCta}>
          {nextItem.icon} {isAr ? nextItem.ctaAr : nextItem.ctaEn}
          <span className={styles.primaryCtaArrow}>←</span>
        </Link>
      )}
    </div>
  );
}
