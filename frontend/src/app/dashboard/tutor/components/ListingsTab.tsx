'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tutorApi, publicApi } from '@/lib/api';
import Link from 'next/link';
import styles from './listings.module.css';
import SubjectPickerModal from './SubjectPickerModal';
import LocationPickerModal, { type LocationData } from './LocationPickerModal';

interface Props { isAr: boolean; }

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <div className={styles.sparklineWrap}>
      {data.map((v, i) => (
        <div
          key={i}
          className={styles.sparklineBar}
          style={{
            height: `${Math.round((v / max) * 100)}%`,
            background: i === data.length - 1 ? color : `${color}66`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      type="button"
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}

// ─── Location Chip ────────────────────────────────────────────────────────────
function LocationChip({
  icon, label, active, onClick,
}: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`${styles.locationChip} ${active ? styles.locationChipActive : ''}`}
      onClick={onClick}
    >
      <span className={styles.locationChipIcon}>{icon}</span>
      {label}
    </button>
  );
}

const SPARKLINE_1 = [3, 5, 4, 8, 11, 7, 14, 10, 16, 12, 18, 22];
const SPARKLINE_2 = [1, 2, 4, 3, 6, 5, 8, 7, 10, 9, 12, 14];
const SPARKLINE_3 = [0, 1, 2, 1, 3, 2, 4, 3, 5, 4, 6, 8];
const SPARKLINE_4 = [0, 0, 1, 1, 2, 2, 3, 2, 4, 3, 3, 4];

// ─── Arabic translations for Laravel backend validation ───────────────────────

/** Maps Laravel snake_case field keys → Arabic display names */
const FIELD_NAMES_AR: Record<string, string> = {
  headline_ar:           'عنوان الإعلان (عربي)',
  headline_en:           'عنوان الإعلان (إنجليزي)',
  bio_ar:                'النبذة التعريفية (عربي)',
  bio_en:                'النبذة التعريفية (إنجليزي)',
  bio_method_ar:         'عن الدروس (عربي)',
  bio_method_en:         'عن الدروس (إنجليزي)',
  hourly_rate:           'سعر الساعة',
  hourly_rate_online:    'سعر الساعة أونلاين',
  experience_years:      'سنوات الخبرة',
  education_level:       'المؤهل الدراسي',
  pack_5h_price:         'باقة 5 ساعات',
  pack_10h_price:        'باقة 10 ساعات',
  travel_expenses:       'مصاريف التنقل',
  lesson_format:         'طريقة التدريس',
  is_first_lesson_free:  'الدرس الأول مجاني',
  first_lesson_duration: 'مدة الدرس الأول',
  video_url:             'رابط الفيديو',
  avatar:                'صورة الملف الشخصي',
};

/**
 * Translates a single Laravel validation message to Arabic.
 * Handles the most common rule messages by regex matching.
 */
function translateValidationMessage(rawField: string, message: string): string {
  const fieldAr = FIELD_NAMES_AR[rawField] ?? rawField.replace(/_/g, ' ');

  // Map common Laravel validation rule messages → Arabic
  const rules: Array<[RegExp, string | ((...args: string[]) => string)]> = [
    [/must be a string/i,                              `يجب أن يكون نصاً`],
    [/must be a number|must be numeric/i,              `يجب أن يكون رقماً`],
    [/must be an integer/i,                            `يجب أن يكون رقماً صحيحاً`],
    [/is required/i,                                   `حقل مطلوب`],
    [/may not be greater than (\d+)/i,                 (_: string, n: string) => `يجب ألا يتجاوز ${n}`],
    [/must be at least (\d+)/i,                        (_: string, n: string) => `يجب أن يكون ${n} على الأقل`],
    [/must be greater than or equal to (\d+)/i,        (_: string, n: string) => `يجب أن يكون ${n} أو أكثر`],
    [/must be less than or equal to (\d+)/i,           (_: string, n: string) => `يجب أن يكون ${n} أو أقل`],
    [/must be between (\d+) and (\d+)/i,               (_: string, a: string, b: string) => `يجب أن يكون بين ${a} و${b}`],
    [/must not be greater than (\d+) characters/i,     (_: string, n: string) => `يجب ألا يتجاوز ${n} حرفاً`],
    [/must be at least (\d+) characters/i,             (_: string, n: string) => `يجب أن يكون ${n} أحرف على الأقل`],
    [/must be a valid url/i,                           `يجب أن يكون رابطاً صحيحاً`],
    [/must be a valid email/i,                         `يجب أن يكون بريداً إلكترونياً صحيحاً`],
    [/has already been taken/i,                        `هذه القيمة مستخدمة مسبقاً`],
    [/must be a valid date/i,                          `يجب أن يكون تاريخاً صحيحاً`],
    [/must be a file/i,                                `يجب رفع ملف`],
    [/must be an image/i,                              `يجب أن يكون صورة`],
    [/the selected .+ is invalid/i,                    `الخيار المحدد غير صالح`],
    [/is not a valid/i,                                `قيمة غير صالحة`],
  ];

  for (const [pattern, replacement] of rules) {
    if (pattern.test(message)) {
      const translated = typeof replacement === 'function'
        ? message.replace(pattern, replacement as (...args: string[]) => string)
        : replacement;
      return `${fieldAr}: ${translated}`;
    }
  }

  // Fallback: keep original message but prepend translated field name
  return `${fieldAr}: ${message}`;
}

// ─── Error Modal ─────────────────────────────────────────────────────────────
interface ErrorItem { field?: string; message: string; }

function ErrorModal({ errors, onClose, isAr }: { errors: ErrorItem[]; onClose: () => void; isAr: boolean }) {
  return (
    <div className={styles.errorOverlay} onClick={onClose}>
      <div className={styles.errorModal} onClick={e => e.stopPropagation()}>
        <div className={styles.errorModalHeader}>
          <div className={styles.errorModalIcon}>⚠️</div>
          <div>
            <h3 className={styles.errorModalTitle}>
              {isAr ? 'يوجد أخطاء في النموذج' : 'Please fix the following errors'}
            </h3>
            <p className={styles.errorModalSubtitle}>
              {isAr ? `${errors.length} ${errors.length === 1 ? 'خطأ' : 'أخطاء'} بحاجة للمراجعة` : `${errors.length} issue${errors.length !== 1 ? 's' : ''} need your attention`}
            </p>
          </div>
          <button className={styles.errorModalClose} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <ul className={styles.errorModalList}>
          {errors.map((err, i) => (
            <li key={i} className={styles.errorModalItem}>
              <span className={styles.errorModalDot} />
              {err.field && <span className={styles.errorModalField}>{err.field}: </span>}
              <span>{err.message}</span>
            </li>
          ))}
        </ul>
        <button className={styles.errorModalBtn} onClick={onClose}>
          {isAr ? 'حسناً، سأصلح ذلك' : 'Got it, I\'ll fix these'}
        </button>
      </div>
    </div>
  );
}

// ─── Success Modal ────────────────────────────────────────────────────────────
function SuccessModal({ onClose, isAr }: { onClose: () => void; isAr: boolean }) {
  return (
    <div className={styles.errorOverlay} onClick={onClose}>
      <div className={styles.successModal} onClick={e => e.stopPropagation()}>
        <button className={styles.successModalClose} onClick={onClose} aria-label="Close">✕</button>
        <div className={styles.successModalBody}>
          <div className={styles.successModalIconWrap}>
            <span className={styles.successModalIcon}>✅</span>
          </div>
          <h3 className={styles.successModalTitle}>
            {isAr ? 'تم الحفظ بنجاح!' : 'Changes Saved!'}
          </h3>
          <p className={styles.successModalSubtitle}>
            {isAr
              ? 'تم تحديث ملفك الشخصي وسيظهر للطلاب فوراً.'
              : 'Your profile has been updated and is now live for students.'}
          </p>
          <button className={styles.successModalBtn} onClick={onClose}>
            {isAr ? '👍 رائع!' : '👍 Awesome!'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ListingsTab({ isAr }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState<ErrorItem[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [isTogglingLive, setIsTogglingLive] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationData, setLocationData] = useState<LocationData>({
    atHome: true,
    atPupil: false,
    online: true,
    addressLabel: '',
    lat: null,
    lng: null,
    radius: 20,
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['tutor-profile'],
    queryFn: () => tutorApi.getProfile().then(r => r.data.data),
    staleTime: 300_000,
  });

  const { data: meData } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => tutorApi.getMe().then(r => r.data.data),
    staleTime: 60_000,
  });

  const { data: stats } = useQuery({
    queryKey: ['tutor-stats'],
    queryFn: () => tutorApi.getDashboardStats().then(r => r.data.data),
    staleTime: 30_000,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['tutor-subjects'],
    queryFn: () => tutorApi.getSubjects().then(r => r.data.data),
    staleTime: 300_000,
  });

  const { data: allSubjectsData } = useQuery({
    queryKey: ['all-subjects'],
    queryFn: () => publicApi.getSubjects().then(r => r.data.data),
    staleTime: 600_000,
  });

  const [form, setForm] = useState({
    headline_ar: '', headline_en: '', bio_ar: '', bio_en: '',
    bio_method_ar: '', bio_method_en: '',
    hourly_rate: '', hourly_rate_online: '', experience_years: '', education_level: '',
    pack_5h_price: '', pack_10h_price: '', travel_expenses: '',
    lesson_format: 'both', is_first_lesson_free: false, first_lesson_duration: '60',
  });

  // Populate form from profile
  useEffect(() => {
    if (profile) {
      setForm({
        headline_ar:          profile.headline_ar          || '',
        headline_en:          profile.headline_en          || '',
        bio_ar:               profile.bio_ar               || '',
        bio_en:               profile.bio_en               || '',
        bio_method_ar:        profile.bio_method_ar        || '',
        bio_method_en:        profile.bio_method_en        || '',
        hourly_rate:          profile.hourly_rate          || '',
        hourly_rate_online:   profile.hourly_rate_online   || '',
        experience_years:     profile.experience_years     || '',
        education_level:      profile.education_level      || profile.education || '',
        pack_5h_price:        profile.pack_5h_price        || '',
        pack_10h_price:       profile.pack_10h_price       || '',
        travel_expenses:      profile.travel_expenses      || '',
        lesson_format:        profile.lesson_format        || 'both',
        is_first_lesson_free: profile.is_first_lesson_free || false,
        first_lesson_duration:profile.first_lesson_duration|| '60',
      });

      // Video URL from backend — pre-fill and reveal the input
      if (profile.video_url) {
        setVideoUrl(profile.video_url as string);
        setShowVideoInput(true);
      }

      // Listing live state from backend
      setIsLive(profile.is_live !== undefined ? Boolean(profile.is_live) : true);

      // Derive location UI state from saved profile fields
      const fmt = (profile.lesson_format as string) || 'both';
      setLocationData(prev => ({
        ...prev,
        atHome:       fmt === 'in_person' || fmt === 'both',
        atPupil:      !!profile.travel_expenses,
        online:       fmt === 'online'    || fmt === 'both',
        addressLabel: (profile.location_label as string) || '',
        radius:       profile.travel_expenses ? Number(profile.travel_expenses) : 20,
      }));
    }
  }, [profile]);

  // ── Frontend validation ──────────────────────────────────────────────────
  const validateForm = (): ErrorItem[] => {
    const errs: ErrorItem[] = [];
    if (!form.hourly_rate || Number(form.hourly_rate) <= 0)
      errs.push({ field: isAr ? 'سعر الساعة' : 'Hourly Rate', message: isAr ? 'يجب إدخال سعر ساعة أكبر من صفر' : 'Hourly rate must be greater than 0' });
    if (form.pack_5h_price && form.hourly_rate && Number(form.pack_5h_price) >= Number(form.hourly_rate) * 5)
      errs.push({ field: isAr ? 'باقة 5 ساعات' : '5h Pack', message: isAr ? 'سعر الباقة يجب أن يكون أقل من السعر العادي 5 ساعات' : 'Pack price should be less than 5× the hourly rate (it\'s a discount)' });
    if (form.pack_10h_price && form.hourly_rate && Number(form.pack_10h_price) >= Number(form.hourly_rate) * 10)
      errs.push({ field: isAr ? 'باقة 10 ساعات' : '10h Pack', message: isAr ? 'سعر الباقة يجب أن يكون أقل من السعر العادي 10 ساعات' : 'Pack price should be less than 10× the hourly rate (it\'s a discount)' });
    if (!form.headline_ar && !form.headline_en)
      errs.push({ field: isAr ? 'عنوان الإعلان' : 'Ad Title', message: isAr ? 'يجب إدخال عنوان الإعلان (عربي أو إنجليزي)' : 'At least one headline (Arabic or English) is required' });
    if (form.experience_years && (Number(form.experience_years) < 0 || Number(form.experience_years) > 60))
      errs.push({ field: isAr ? 'سنوات الخبرة' : 'Experience Years', message: isAr ? 'يجب أن تكون سنوات الخبرة بين 0 و60' : 'Experience years must be between 0 and 60' });
    return errs;
  };

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => tutorApi.updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tutor-profile'] });
      setShowSuccessModal(true);
      setErrorModal([]);
    },
    onError: (err: unknown) => {
      // Parse backend errors: Laravel returns { message, errors: { field: [msg] } }
      const resp = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      const items: ErrorItem[] = [];

      if (resp?.errors) {
        // Field-level validation errors from Laravel
        Object.entries(resp.errors).forEach(([field, messages]) => {
          messages.forEach(msg => {
            if (isAr) {
              // Fully translated: message already includes the Arabic field name
              items.push({ message: translateValidationMessage(field, msg) });
            } else {
              // English: show raw field key as label, raw message as body
              items.push({ field: field.replace(/_/g, ' '), message: msg });
            }
          });
        });
      } else if (resp?.message) {
        items.push({ message: resp.message });
      } else {
        items.push({ message: isAr ? 'فشل الحفظ، حاول مجدداً' : 'Save failed, please try again' });
      }

      setErrorModal(items);
    },
  });

  // Toggle is_live and persist immediately to backend
  const handleToggleLive = async () => {
    if (isTogglingLive) return;
    setIsTogglingLive(true);
    const next = !isLive;
    setIsLive(next);
    try {
      await tutorApi.updateProfile({ is_live: next });
      qc.invalidateQueries({ queryKey: ['tutor-profile'] });
    } catch {
      setIsLive(!next); // revert on error
    } finally {
      setIsTogglingLive(false);
    }
  };

  // Avatar upload handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await tutorApi.uploadAvatar(fd);
      qc.invalidateQueries({ queryKey: ['auth-me'] });
      qc.invalidateQueries({ queryKey: ['tutor-profile'] });
    } catch {
      // silent fail — user can retry
    } finally {
      setIsUploadingAvatar(false);
      // reset file input so same file can be re-selected
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const update = (key: string, val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }));

  function getYouTubeId(url: string): string | null {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
      /^([A-Za-z0-9_-]{11})$/,  // bare ID
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m?.[1]) return m[1];
    }
    return null;
  }
  const youtubeId = getYouTubeId(videoUrl);

  const name = (profile?.name as string) || (meData?.name as string) || '';
  const avatarUrl = (meData?.avatar as string) || (profile?.avatar as string) || '';
  const avgRating        = (stats?.avg_rating        as number) ?? 0;
  const totalReviews     = (stats?.total_reviews     as number) ?? 0;
  const completedBookings= (stats?.completed_bookings as number) ?? 0;
  const totalStudents    = (stats?.total_students    as number) ?? 0;
  const tutorSlug = (profile?.slug as string) ?? '';

  // subjects must be declared before statCards which references subjects.length
  const subjects: string[] = Array.isArray(subjectsData)
    ? (subjectsData as Array<{ subject?: { name_ar?: string; name_en?: string }; name_ar?: string; name_en?: string }>).map(s => {
        const sub = s.subject || s;
        return isAr ? (sub.name_ar || '') : (sub.name_en || '');
      }).filter(Boolean)
    : [];

  const statCards = [
    {
      icon: '🎓',
      label: isAr ? 'الطلاب المسجلون' : 'Total Students',
      value: String(totalStudents),
      delta: totalStudents > 0 ? `+${totalStudents}` : '—',
      deltaUp: totalStudents > 0,
      color: '#1B4965',
      sparkline: SPARKLINE_1,
    },
    {
      icon: '⭐',
      label: isAr ? 'متوسط التقييم' : 'Avg. Rating',
      value: avgRating > 0 ? avgRating.toFixed(1) : '—',
      delta: `(${totalReviews} ${isAr ? 'تقييم' : 'reviews'})`,
      deltaUp: avgRating >= 4,
      color: '#F4A261',
      sparkline: SPARKLINE_2,
    },
    {
      icon: '💬',
      label: isAr ? 'الجلسات المكتملة' : 'Completed Sessions',
      value: String(completedBookings),
      delta: completedBookings > 0 ? `+${completedBookings}` : '—',
      deltaUp: completedBookings > 0,
      color: '#2A9D8F',
      sparkline: SPARKLINE_3,
    },
    {
      icon: '📚',
      label: isAr ? 'المواد المدرّسة' : 'Subjects Taught',
      value: String(subjects.length),
      delta: subjects.length > 0 ? `+${subjects.length}` : '—',
      deltaUp: subjects.length > 0,
      color: '#E63946',
      sparkline: SPARKLINE_4,
    },
  ];


  if (isLoading) {
    return (
      <div className={styles.skeletonWrap}>
        <div className={styles.skeletonRow}>
          {[1, 2, 3, 4].map(i => <div key={i} className={styles.skeletonCard} style={{ height: 90 }} />)}
        </div>
        <div className={styles.skeletonMain}>
          <div className={styles.skeletonLeft}>
            {[1, 2, 3].map(i => <div key={i} className={styles.skeletonCard} style={{ height: 140 }} />)}
          </div>
          <div className={styles.skeletonCard} style={{ height: 420 }} />
        </div>
      </div>
    );
  }

  const allSubjects = Array.isArray(allSubjectsData) ? allSubjectsData as Array<{ id: number; name_ar: string; name_en: string; category?: { name_ar?: string; name_en?: string } }> : [];
  const mySubjectsRaw = Array.isArray(subjectsData) ? subjectsData as Array<Record<string, unknown>> : [];

  return (
    <>
    {showSubjectPicker && (
      <SubjectPickerModal
        isAr={isAr}
        allSubjects={allSubjects}
        mySubjects={mySubjectsRaw as unknown as Parameters<typeof SubjectPickerModal>[0]['mySubjects']}
        onClose={() => setShowSubjectPicker(false)}
        onSaved={() => qc.invalidateQueries({ queryKey: ['tutor-subjects'] })}
      />
    )}
    {showLocationPicker && (
      <LocationPickerModal
        isAr={isAr}
        initial={locationData}
        onClose={() => setShowLocationPicker(false)}
        onSaved={(data) => {
          setLocationData(data);
          qc.invalidateQueries({ queryKey: ['tutor-profile'] });
        }}
      />
    )}
    {/* ── Error Modal Popup ── */}
    {errorModal.length > 0 && (
      <ErrorModal errors={errorModal} onClose={() => setErrorModal([])} isAr={isAr} />
    )}
    {/* ── Success Modal Popup ── */}
    {showSuccessModal && (
      <SuccessModal onClose={() => setShowSuccessModal(false)} isAr={isAr} />
    )}

    <form onSubmit={e => {
      e.preventDefault();
      // Run frontend validation first
      const frontendErrors = validateForm();
      if (frontendErrors.length > 0) {
        setErrorModal(frontendErrors);
        return;
      }
      mutation.mutate({
        ...form,
        video_url: videoUrl || null,
        experience_years: form.experience_years ? parseInt(form.experience_years as string) : 0,
      });
    }}>

      {/* ═══ Statistics Banner ═══ */}
      <div className={styles.statsSection}>
        <div className={styles.statsSectionHeader}>
          <span className={styles.statsSectionLabel}>
            {isAr ? 'الإحصائيات · آخر 30 يوماً' : 'Statistics · over the last 30 days'}
          </span>
        </div>
        <div className={styles.statsGrid}>
          {statCards.map(s => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statCardInner}>
                <div className={styles.statIcon} style={{ background: `${s.color}18`, color: s.color }}>
                  {s.icon}
                </div>
                <div className={styles.statInfo}>
                  <p className={styles.statLabel}>{s.label}</p>
                  <div className={styles.statValueRow}>
                    <span className={styles.statValue}>{s.value}</span>
                    <span className={`${styles.statDelta} ${s.deltaUp ? styles.deltaUp : styles.deltaDown}`}>
                      {s.deltaUp ? '↑' : '↓'} {s.delta}
                    </span>
                  </div>
                </div>
              </div>
              <Sparkline data={s.sparkline} color={s.color} />
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Two Column Layout ═══ */}
      <div className={styles.mainLayout}>

        {/* ─── LEFT: Main Content ─── */}
        <div className={styles.mainContent}>

          {/* Courses Taught */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                📚 {isAr ? 'المواد التي أدرّسها' : 'Courses taught'}
              </h2>
              <button
                type="button"
                className={styles.editLink}
                onClick={() => setShowSubjectPicker(true)}
              >
                ➕ {isAr ? 'إضافة مادة' : 'Add Subject'}
              </button>
            </div>
            <div className={styles.sectionBody}>
              {subjects.length > 0 ? (
                <div className={styles.subjectChips}>
                  {subjects.map((s, i) => (
                    <span key={i} className={styles.subjectChip}>{s}</span>
                  ))}
                  <button
                    type="button"
                    className={styles.subjectChipAdd}
                    onClick={() => setShowSubjectPicker(true)}
                  >
                    ＋ {isAr ? 'إضافة' : 'Add more'}
                  </button>
                </div>
              ) : (
                <div className={styles.emptySubjects}>
                  <span>📖</span>
                  <p>{isAr ? 'لم تضف مواد بعد' : 'No subjects added yet'}</p>
                  <button
                    type="button"
                    className={styles.addLink}
                    onClick={() => setShowSubjectPicker(true)}
                  >
                    {isAr ? '+ أضف مادة' : '+ Add a subject'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Ad Title / Headline */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                🏷️ {isAr ? 'عنوان الإعلان' : 'Ad title'}
              </h2>
              <span className={styles.editHintBadge}>{isAr ? 'يظهر للطلاب' : 'Visible to students'}</span>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    {isAr ? 'العنوان بالعربية' : 'Arabic headline'}
                  </label>
                  <input
                    className={styles.fieldInput}
                    value={form.headline_ar}
                    onChange={e => update('headline_ar', e.target.value)}
                    placeholder={isAr ? 'مُعلم رياضيات خبير...' : 'Expert tutor in...'}
                    dir="rtl"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    {isAr ? 'العنوان بالإنجليزية' : 'English headline'}
                  </label>
                  <input
                    className={styles.fieldInput}
                    value={form.headline_en}
                    onChange={e => update('headline_en', e.target.value)}
                    placeholder="Expert Math Tutor..."
                    dir="ltr"
                  />
                </div>
              </div>
              <div className={styles.fieldGroup} style={{ marginTop: 14 }}>
                <label className={styles.fieldLabel}>
                  {isAr ? 'النبذة التعريفية (عربي)' : 'Bio (Arabic)'}
                </label>
                <textarea
                  className={styles.fieldTextarea}
                  rows={4}
                  value={form.bio_ar}
                  onChange={e => update('bio_ar', e.target.value)}
                  placeholder={isAr ? 'اكتب عن خبرتك وأسلوبك في التدريس...' : 'Write about your experience...'}
                  dir="rtl"
                />
              </div>
              <div className={styles.fieldGroup} style={{ marginTop: 14 }}>
                <label className={styles.fieldLabel}>
                  {isAr ? 'النبذة التعريفية (إنجليزي)' : 'Bio (English)'}
                </label>
                <textarea
                  className={styles.fieldTextarea}
                  rows={4}
                  value={form.bio_en}
                  onChange={e => update('bio_en', e.target.value)}
                  placeholder="Tell students about your teaching approach and experience..."
                  dir="ltr"
                />
              </div>
              {/* About the courses */}
              <div className={styles.fieldGroup} style={{ marginTop: 14 }}>
                <label className={styles.fieldLabel}>
                  📝 {isAr ? 'عن الدروس (عربي)' : 'About the courses (Arabic)'}
                </label>
                <textarea
                  className={styles.fieldTextarea}
                  rows={3}
                  value={form.bio_method_ar ?? ''}
                  onChange={e => update('bio_method_ar', e.target.value)}
                  placeholder={isAr ? 'صف أسلوبك في التدريس، مناهجك، وما يميز دروسك...' : 'Describe your teaching method and what makes your lessons unique...'}
                  dir="rtl"
                />
              </div>
              <div className={styles.fieldGroup} style={{ marginTop: 14 }}>
                <label className={styles.fieldLabel}>
                  📝 {isAr ? 'عن الدروس (إنجليزي)' : 'About the courses (English)'}
                </label>
                <textarea
                  className={styles.fieldTextarea}
                  rows={3}
                  value={form.bio_method_en ?? ''}
                  onChange={e => update('bio_method_en', e.target.value)}
                  placeholder="Describe your teaching style, curriculum, and what sets your lessons apart..."
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Location / Teaching Modes */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                📍 {isAr ? 'مكان التدريس' : 'Location'}
              </h2>
              <button
                type="button"
                className={styles.editLink}
                onClick={() => setShowLocationPicker(true)}
              >
                ✏️ {isAr ? 'تعديل' : 'Edit'}
              </button>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.locationChips}>
                <LocationChip
                  icon="🏠"
                  label={isAr ? 'في منزلي' : 'At my place'}
                  active={locationData.atHome}
                  onClick={() => setShowLocationPicker(true)}
                />
                <LocationChip
                  icon="🌐"
                  label={isAr ? 'أونلاين' : 'Online'}
                  active={locationData.online}
                  onClick={() => setShowLocationPicker(true)}
                />
                <LocationChip
                  icon="🏫"
                  label={isAr ? 'عند الطالب' : "At student's place"}
                  active={locationData.atPupil}
                  onClick={() => setShowLocationPicker(true)}
                />
              </div>
              {/* Address summary pill */}
              {locationData.atHome && locationData.addressLabel && (
                <div style={{
                  marginTop: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  background: 'rgba(27,73,101,0.05)',
                  border: '1.5px solid rgba(27,73,101,0.12)',
                  borderRadius: 12,
                  fontSize: '0.8125rem',
                  color: '#1B4965',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                }}
                  onClick={() => setShowLocationPicker(true)}
                >
                  <span>📌</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {locationData.addressLabel}
                  </span>
                  {locationData.atPupil && (
                    <span style={{
                      marginLeft: 8,
                      padding: '2px 8px',
                      background: 'rgba(244,162,97,0.12)',
                      border: '1px solid rgba(244,162,97,0.3)',
                      borderRadius: 100,
                      fontSize: '0.6875rem',
                      color: '#C05621',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}>
                      {isAr ? `نطاق ${locationData.radius} كم` : `${locationData.radius} km radius`}
                    </span>
                  )}
                </div>
              )}
              {/* Prompt to set address when atHome is on but no label */}
              {locationData.atHome && !locationData.addressLabel && (
                <button
                  type="button"
                  style={{
                    marginTop: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 16px',
                    background: 'transparent',
                    border: '1.5px dashed rgba(27,73,101,0.3)',
                    borderRadius: 12,
                    fontSize: '0.8125rem',
                    color: '#64748B',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                    fontFamily: 'inherit',
                  }}
                  onClick={() => setShowLocationPicker(true)}
                >
                  🗺️ {isAr ? 'حدد عنوانك على الخريطة' : 'Set your address on the map'}
                </button>
              )}
            </div>
          </div>

          {/* ════ Pricing Section ════ */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                💰 {isAr ? 'التسعير' : 'Pricing'}
              </h2>
              <span className={styles.editHintBadge}>{isAr ? 'يظهر للطلاب' : 'Visible to students'}</span>
            </div>
            <div className={styles.sectionBody}>

              {/* ── Hourly Rates ── */}
              {/* onlineOnly = teacher only teaches online */}
              {(() => {
                const onlineOnly = form.lesson_format === 'online';
                return (
                  <div className={styles.pricingBlock}>
                    <div className={styles.pricingBlockLabel}>
                      {isAr ? 'سعر الساعة' : 'Hourly Rates'}
                    </div>
                    <div className={styles.pricingFieldRow}>
                      {/* In-person — disabled when online-only */}
                      <div className={`${styles.pricingFieldGroup} ${onlineOnly ? styles.pricingFieldDisabled : ''}`}>
                        <label className={styles.pricingFieldLabel}>
                          🏠 {isAr ? 'حضوري' : 'In-person'}
                          {onlineOnly && (
                            <span className={styles.pricingDisabledHint}>
                              {isAr ? '— غير متاح (أونلاين فقط)' : '— N/A (online only)'}
                            </span>
                          )}
                        </label>
                        <div className={styles.pricingInputWrap}>
                          <input
                            type="number"
                            className={styles.pricingFieldInput}
                            value={onlineOnly ? '' : form.hourly_rate}
                            onChange={e => update('hourly_rate', e.target.value)}
                            placeholder={onlineOnly ? (isAr ? 'معطّل' : 'Disabled') : '0'}
                            min={0}
                            disabled={onlineOnly}
                          />
                          <span className={styles.pricingCurrency}>{isAr ? 'ج.م/س' : 'EGP/h'}</span>
                        </div>
                      </div>
                      {/* Online */}
                      <div className={styles.pricingFieldGroup}>
                        <label className={styles.pricingFieldLabel}>
                          🌐 {isAr ? 'أونلاين' : 'Online'}
                        </label>
                        <div className={styles.pricingInputWrap}>
                          <input
                            type="number"
                            className={styles.pricingFieldInput}
                            value={form.hourly_rate_online}
                            onChange={e => update('hourly_rate_online', e.target.value)}
                            placeholder={onlineOnly ? '0' : (isAr ? 'اختياري' : 'Optional')}
                            min={0}
                          />
                          <span className={styles.pricingCurrency}>{isAr ? 'ج.م/س' : 'EGP/h'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Course Packs ── */}
              <div className={styles.pricingBlock}>
                <div className={styles.pricingBlockLabel}>
                  {isAr ? 'باقات الدروس' : 'Course Packs'}
                </div>
                <div className={styles.pricingPackInfo}>
                  <span className={styles.pricingPackInfoIcon}>📦</span>
                  <p>
                    {isAr
                      ? 'الباقات هي ساعات دروس عادةً بسعر مخفض مفضّل.'
                      : 'The packs are hours of lessons often at a preferential rate.'}
                  </p>
                </div>
                <div className={styles.pricingFieldRow} style={{ marginTop: 12 }}>
                  <div className={styles.pricingFieldGroup}>
                    <label className={styles.pricingFieldLabel}>
                      {isAr ? 'باقة 5 ساعات' : '5 hours'}
                    </label>
                    <div className={styles.pricingInputWrap}>
                      <input
                        type="number"
                        className={styles.pricingFieldInput}
                        value={form.pack_5h_price}
                        onChange={e => update('pack_5h_price', e.target.value)}
                        placeholder="0"
                        min={0}
                      />
                      <span className={styles.pricingCurrency}>{isAr ? 'ج.م' : 'EGP'}</span>
                    </div>
                  </div>
                  <div className={styles.pricingFieldGroup}>
                    <label className={styles.pricingFieldLabel}>
                      {isAr ? 'باقة 10 ساعات' : '10 hours'}
                    </label>
                    <div className={styles.pricingInputWrap}>
                      <input
                        type="number"
                        className={styles.pricingFieldInput}
                        value={form.pack_10h_price}
                        onChange={e => update('pack_10h_price', e.target.value)}
                        placeholder="0"
                        min={0}
                      />
                      <span className={styles.pricingCurrency}>{isAr ? 'ج.م' : 'EGP'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Travel expenses — disabled when online-only ── */}
              {(() => {
                const onlineOnly = form.lesson_format === 'online';
                return (
                  <div className={`${styles.pricingBlock} ${onlineOnly ? styles.pricingFieldDisabled : ''}`}>
                    <div className={styles.pricingBlockLabel}>
                      {isAr ? 'مصاريف التنقل' : 'Travel expenses'}
                      {onlineOnly && (
                        <span className={styles.pricingDisabledHint}>
                          {isAr ? '— غير متاح (أونلاين فقط)' : '— N/A (online only)'}
                        </span>
                      )}
                    </div>
                    <div className={styles.pricingFieldGroup}>
                      <label className={styles.pricingFieldLabel}>
                        {isAr ? 'تكلفة التنقل' : 'Travel expenses'}
                      </label>
                      <div className={styles.pricingInputWrap}>
                        <input
                          type="number"
                          className={styles.pricingFieldInput}
                          value={onlineOnly ? '' : form.travel_expenses}
                          onChange={e => update('travel_expenses', e.target.value)}
                          placeholder={onlineOnly ? (isAr ? 'معطّل' : 'Disabled') : '0'}
                          min={0}
                          disabled={onlineOnly}
                        />
                        <span className={styles.pricingCurrency}>{isAr ? 'ج.م' : 'EGP'}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── 1st class offered ── */}
              <div className={styles.pricingBlock}>
                <label className={styles.pricingToggleRow}>
                  <div className={styles.pricingToggleInfo}>
                    <span className={styles.pricingToggleLabel}>
                      1<sup>st</sup> {isAr ? 'درس مجاني' : 'class offered'}
                    </span>
                    <span className={styles.pricingToggleSub}>
                      {isAr ? 'يرفع الحجوزات بنسبة 40% ✨' : 'Increases bookings by 40% ✨'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.is_first_lesson_free}
                    onChange={e => update('is_first_lesson_free', e.target.checked)}
                    className={styles.hiddenCheck}
                  />
                  <div className={`${styles.freeToggleBox} ${form.is_first_lesson_free ? styles.freeToggleBoxOn : ''}`}>
                    <span className={styles.freeToggleThumb} />
                  </div>
                </label>

                {/* Duration picker — visible only when toggle is ON */}
                {form.is_first_lesson_free && (
                  <div className={styles.pricingDurationWrap}>
                    <select
                      className={styles.pricingDurationSelect}
                      value={form.first_lesson_duration}
                      onChange={e => update('first_lesson_duration', e.target.value)}
                    >
                      <option value="30">{isAr ? '30 دقيقة مجاناً' : '30 minutes offered'}</option>
                      <option value="45">{isAr ? '45 دقيقة مجاناً' : '45 minutes offered'}</option>
                      <option value="60">{isAr ? '60 دقيقة مجاناً' : '60 minutes offered'}</option>
                      <option value="90">{isAr ? '90 دقيقة مجاناً' : '90 minutes offered'}</option>
                    </select>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Video Introduction */}

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                🎬 {isAr ? 'فيديو تعريفي' : 'Video Introduction'}
              </h2>
              <button
                type="button"
                className={styles.editLink}
                onClick={() => setShowVideoInput(v => !v)}
              >
                {showVideoInput ? (isAr ? 'إخفاء' : 'Hide') : '✏️ ' + (isAr ? 'تعديل' : 'Edit')}
              </button>
            </div>
            <div className={styles.sectionBody}>
              {showVideoInput && (
                <div className={styles.fieldGroup} style={{ marginBottom: 14 }}>
                  <label className={styles.fieldLabel}>{isAr ? 'رابط YouTube' : 'YouTube URL'}</label>
                  <input
                    className={styles.fieldInput}
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://youtu.be/..."
                    dir="ltr"
                  />
                </div>
              )}
              {youtubeId ? (
                <div className={styles.videoWrap}>
                  <iframe
                    className={styles.videoIframe}
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="Tutor Introduction"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className={styles.videoPlaceholder} onClick={() => setShowVideoInput(true)}>
                  <div className={styles.videoPlaceholderIcon}>🎥</div>
                  <p className={styles.videoPlaceholderText}>
                    {isAr ? 'أضف فيديو تعريفياً لجذب المزيد من الطلاب' : 'Add a video intro to attract more students'}
                  </p>
                  <span className={styles.videoPlaceholderHint}>
                    {isAr ? 'اضغط لإضافة رابط YouTube' : 'Click to add a YouTube link'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className={styles.saveBtn}
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? (isAr ? '⏳ جاري الحفظ...' : '⏳ Saving...')
              : (isAr ? '💾 حفظ جميع التغييرات' : '💾 Save All Changes')}
          </button>
        </div>

        {/* ─── RIGHT: Sidebar ─── */}
        <div className={styles.sidebar}>

          {/* Profile Preview Card */}
          <div className={styles.profileCard}>
            {/* Avatar */}
            <div className={styles.profileCardAvatarWrap}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={name} className={styles.profileCardAvatar} />
              ) : (
                <div className={styles.profileCardAvatarFallback}>
                  {(name.charAt(0) || '?').toUpperCase()}
                </div>
              )}
              <button
                type="button"
                className={styles.profileCardAvatarEditBtn}
                onClick={() => fileRef.current?.click()}
                title={isAr ? 'تغيير الصورة' : 'Change photo'}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? '⏳' : '📷'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>

            {/* Name & Rating */}
            <h3 className={styles.profileCardName}>{name || '—'}</h3>
            <div className={styles.profileCardRating}>
              <span className={styles.starIcon}>⭐</span>
              <span className={styles.ratingValue}>{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
              <span className={styles.ratingCount}>({totalReviews} {isAr ? 'تقييم' : 'reviews'})</span>
            </div>
            <div className={styles.profileCardRate}>
              <span className={styles.rateLabel}>{isAr ? 'السعر بالساعة' : 'Hourly rate'}</span>
              <span className={styles.rateValue}>
                {(() => {
                  const displayRate = form.hourly_rate_online || form.hourly_rate;
                  return displayRate ? `${displayRate} ${isAr ? 'ج.م' : 'EGP'}` : '—';
                })()}
              </span>
            </div>

            {/* Divider */}
            <div className={styles.profileCardDivider} />

            {/* Live Toggle */}
            <div className={styles.listingToggleRow}>
              <div>
                <p className={styles.listingToggleLabel}>{isAr ? 'الإعلان مفعّل' : 'Online Listing'}</p>
                <p className={styles.listingToggleSub}>
                  {isLive
                    ? (isAr ? 'ظاهر للطلاب ✅' : 'Visible to students ✅')
                    : (isAr ? 'مخفي حالياً 🔒' : 'Currently hidden 🔒')}
                </p>
              </div>
              <Toggle
                checked={isLive}
                onChange={handleToggleLive}
              />
            </div>

            {/* Divider */}
            <div className={styles.profileCardDivider} />

            {/* Action Buttons */}
            <div className={styles.profileCardActions}>
              <Link
                href={tutorSlug ? `/tutor/${encodeURIComponent(tutorSlug)}` : '#'}
                className={styles.profileActionBtn}
                target={tutorSlug ? '_blank' : undefined}
              >
                <span>👁️</span>
                {isAr ? 'معاينة كطالب' : 'Seeing as a student'}
              </Link>
              <button type="button" className={`${styles.profileActionBtn} ${styles.profileActionBtnDanger}`}>
                <span>🗑️</span>
                {isAr ? 'حذف الإعلان' : 'Remove Ad'}
              </button>
            </div>
          </div>

          {/* Quick Tips Card */}
          <div className={styles.tipsCard}>
            <h4 className={styles.tipsTitle}>
              💡 {isAr ? 'نصائح لزيادة الحجوزات' : 'Tips to boost bookings'}
            </h4>
            <ul className={styles.tipsList}>
              {[
                isAr ? 'أضف فيديو تعريفياً لرفع ظهورك بـ 3×' : 'Add a video intro to get 3× more views',
                isAr ? 'فعّل الدرس الأول مجاناً' : 'Enable a free first trial lesson',
                isAr ? 'احرص على الرد السريع على الطلاب' : 'Reply to students within 30 minutes',
                isAr ? 'اطلب تقييمات من طلابك' : 'Ask students for reviews after sessions',
              ].map((tip, i) => (
                <li key={i} className={styles.tipsItem}>
                  <span className={styles.tipsDot} />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </form>
    </>
  );
}
