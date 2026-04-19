'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { studentApi, publicApi } from '@/lib/api';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './booking.module.css';
import { useAuthModal } from '@/lib/AuthModalContext';
import dynamic from 'next/dynamic';
import { tutorImgSrc } from '@/lib/tutorImage';


// Lazy-load the Leaflet map to avoid SSR issues
const MapPicker = dynamic(() => import('@/components/ui/MapPicker/MapPicker'), { ssr: false });

type SubjectRecord = { id: number; name_ar: string; name_en: string };
type NominatimResult = { place_id: number; display_name: string; lat: string; lon: string };


/** Tutor tier from performance data — mirrors search/profile pages */
function getTutorLevel(tutor: Record<string, unknown>): { label: { ar: string; en: string }; color: string; bg: string } {
  const rating  = Number(tutor.avg_rating)    || 0;
  const reviews = Number(tutor.total_reviews) || 0;
  const students = Number(tutor.total_students) || 0;
  if (rating >= 4.9 && reviews >= 80 && students >= 60) return { label: { ar: 'سفير', en: 'Ambassador' }, color: '#fff', bg: 'linear-gradient(135deg,#6366f1,#818cf8)' };
  if (rating >= 4.7 && reviews >= 40 && students >= 30) return { label: { ar: 'بريميوم', en: 'Premium' }, color: '#fff', bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)' };
  if (rating >= 4.5 && reviews >= 15)                   return { label: { ar: 'نجم', en: 'Star' }, color: '#fff', bg: 'linear-gradient(135deg,#10b981,#34d399)' };
  if (reviews >= 5 || students >= 3)                    return { label: { ar: 'صاعد', en: 'Rising' }, color: '#fff', bg: 'linear-gradient(135deg,#3b82f6,#60a5fa)' };
  return { label: { ar: 'جديد', en: 'New' }, color: '#374151', bg: '#f3f4f6' };
}

/** Simple debounce hook */
function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

export default function BookingPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const searchParams = useSearchParams();
  const router = useRouter();
  const tutorSlug = searchParams.get('tutor') || '';
  const { openAuthModal } = useAuthModal();

  // Auth guard
  useEffect(() => {
    const token = localStorage.getItem('alemnypro_token');
    if (!token) {
      openAuthModal({
        reason: 'book',
        onSuccess: () => window.location.reload(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: tutor } = useQuery({
    queryKey: ['tutor', tutorSlug],
    queryFn: () => publicApi.getTutor(tutorSlug).then(r => r.data.data),
    enabled: !!tutorSlug,
  });

  const [form, setForm] = useState({
    preferred_date: '',
    preferred_time: '',
    subject_id: '',
    format: 'online',
    message: '',
    address: '',
  });
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill message when tutor loads + set correct default format (fix #2)
  useEffect(() => {
    if (!tutor) return;
    // Fix #2: default format from tutor's lesson_format
    const tf = tutor.lesson_format as string | undefined;
    const defaultFormat = tf === 'in_person' ? 'in_person' : 'online';
    setForm(f => ({ ...f, format: f.format === 'online' && tf === 'in_person' ? 'in_person' : f.format || defaultFormat }));

    // Auto-fill message
    if (form.message) return;
    const name = tutor?.user?.name || '';
    const demoAr = `مرحباً ${name}،\nأنا مهتم بالتعلم معك. أود أن نبدأ بتحديد أساسيات المادة والأهداف التي أسعى إلى تحقيقها.\nأتطلع للتحدث معك!`;
    const demoEn = `Hi ${name},\nI'm interested in learning with you. I'd love to start with the fundamentals and set clear goals together.\nLooking forward to it!`;
    setForm(f => ({ ...f, message: isAr ? demoAr : demoEn }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutor]);

  // ── Subject dropdown ──────────────────────────────────────────
  const [subjectOpen, setSubjectOpen] = useState(false);
  const subjectRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (subjectRef.current && !subjectRef.current.contains(e.target as Node)) setSubjectOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Address autocomplete ──────────────────────────────────────
  const [addressQuery, setAddressQuery]         = useState('');
  const [addressResults, setAddressResults]     = useState<NominatimResult[]>([]);
  const [addressLoading, setAddressLoading]     = useState(false);
  const [addressDropOpen, setAddressDropOpen]   = useState(false);
  const addressRef                              = useRef<HTMLDivElement>(null);
  const debouncedAddress                        = useDebounce(addressQuery, 450);

  // Close autocomplete on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (addressRef.current && !addressRef.current.contains(e.target as Node)) setAddressDropOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Fetch Nominatim results when debounced query changes
  useEffect(() => {
    if (debouncedAddress.length < 3) { setAddressResults([]); setAddressDropOpen(false); return; }
    setAddressLoading(true);
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedAddress)}&limit=6&countrycodes=eg&addressdetails=1`,
      { headers: { 'Accept-Language': isAr ? 'ar' : 'en' } }
    )
      .then(r => r.json())
      .then((results: NominatimResult[]) => {
        setAddressResults(results);
        setAddressDropOpen(results.length > 0);
      })
      .catch(() => setAddressResults([]))
      .finally(() => setAddressLoading(false));
  }, [debouncedAddress, isAr]);

  // User picks an autocomplete suggestion
  const handleAddressSelect = useCallback((result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setForm(f => ({ ...f, address: result.display_name }));
    setAddressQuery(result.display_name);
    setMapCoords({ lat, lng }); // panMap via MapPicker effect
    setAddressDropOpen(false);
  }, []);

  // Map click reverse-geocodes and fills address field
  const handleAddressResolved = useCallback((address: string) => {
    setForm(f => ({ ...f, address }));
    setAddressQuery(address);
  }, []);

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  // ── Submission ────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => studentApi.createBooking(data),
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => router.push('/dashboard/student'), 2500);
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || (isAr ? 'حدث خطأ' : 'Booking failed'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorSlug || !tutor) return;

    const tutorUserId = tutor?.user?.id;
    if (!tutorUserId) {
      setError(isAr ? 'لم يتم تحميل بيانات المعلم' : 'Tutor data not loaded');
      return;
    }

    const payload: Record<string, unknown> = {
      tutor_id:        tutorUserId,          // backend expects user.id integer
      subject_id:      Number(form.subject_id),
      lesson_format:   form.format,          // backend field name is lesson_format
      message:         form.message || null,
      preferred_date:  form.preferred_date  || null,
      preferred_time:  form.preferred_time  || null,
    };
    if (form.format === 'in_person') {
      if (form.address)    payload.address   = form.address;
      if (mapCoords)       { payload.latitude = mapCoords.lat; payload.longitude = mapCoords.lng; }
    }
    mutation.mutate(payload);
  };

  // ── Derived values ────────────────────────────────────────────
  const tutorSubjects: SubjectRecord[] = Array.isArray(tutor?.subjects) ? tutor.subjects : [];
  const selectedSubject = tutorSubjects.find(s => String(s.id) === form.subject_id);
  const tutorName = tutor?.user?.name || '';
  const tutorFormat = tutor?.lesson_format as string | undefined;
  const tutorId    = Number(tutor?.id) || 0;
  const isVerified  = tutor?.verification_status === 'verified';
  const level       = tutor ? getTutorLevel(tutor as Record<string, unknown>) : null;
  const imageSrc    = tutorImgSrc(tutor?.user as Record<string, unknown> | undefined);

  // Fix #1: show correct price depending on selected format
  const displayRate = (form.format === 'online' && tutor?.hourly_rate_online)
    ? Number(tutor.hourly_rate_online)
    : Number(tutor?.hourly_rate) || 0;

  const formatOptions = [
    ...(tutorFormat !== 'in_person' ? [{ val: 'online',    labelAr: 'أونلاين 💻', labelEn: 'Online 💻'    }] : []),
    ...(tutorFormat !== 'online'    ? [{ val: 'in_person', labelAr: 'حضوري 📍',   labelEn: 'In-Person 📍' }] : []),
    ...(!tutorFormat || tutorFormat === 'both' ? [
      { val: 'online',    labelAr: 'أونلاين 💻', labelEn: 'Online 💻'    },
      { val: 'in_person', labelAr: 'حضوري 📍',   labelEn: 'In-Person 📍' },
    ] : []),
  ].filter((v, i, a) => a.findIndex(x => x.val === v.val) === i);

  return (
    <>
      
      <main className={styles.page}>
        <div className="container">

          {/* Back button */}
          <button
            onClick={() => tutorSlug ? router.push(`/tutor/${tutorSlug}`) : router.back()}
            className={styles.backBtn}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            {isAr ? 'العودة للملف الشخصي' : 'Back to Profile'}
          </button>

          <div className={styles.layout}>

            {/* ══ FORM CARD ══════════════════════════════════════ */}
            <div className={styles.formCard}>

              <div className={styles.formHeader}>
                <div className={styles.formHeaderIcon}>📅</div>
                <div>
                  <h1 className={styles.title}>
                    {tutor?.is_first_lesson_free
                      ? (isAr ? 'احجز درسك التجريبي المجاني' : 'Book Your Free Trial Lesson')
                      : (isAr ? 'طلب حجز درس' : 'Book a Lesson')}
                  </h1>
                  <p className={styles.subtitle}>
                    {isAr ? `مع ${tutorName}` : `with ${tutorName}`}
                  </p>
                </div>
              </div>

              {success ? (
                <div className={styles.successBox}>
                  <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}>🎉</span>
                  <h2>{isAr ? 'تم إرسال طلبك بنجاح!' : 'Booking request sent!'}</h2>
                  <p>{isAr ? 'سيتواصل معك المعلم قريباً' : 'The tutor will contact you soon'}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && <div className={styles.errorBox}>{error}</div>}

                  <div className={styles.fields}>

                    {/* ── Modern Subject Dropdown ── */}
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>
                        📚 {isAr ? 'المادة الدراسية' : 'Subject'}
                      </label>

                      {/* Fix #3: no-subjects helpful state */}
                      {tutorSubjects.length === 0 ? (
                        <div className={styles.noSubjectsNote}>
                          ℹ️ {isAr
                            ? 'لم يضف المعلم مواد بعد. يمكنك إرسال طلب الحجز وسيتفقان على المادة لاحقاً.'
                            : "This tutor hasn't added subjects yet. You can still send a booking request and discuss the subject directly."}
                        </div>
                      ) : (
                      <div className={styles.subjectDropdown} ref={subjectRef}>
                        <button
                          type="button"
                          className={`${styles.subjectTrigger} ${subjectOpen ? styles.subjectTriggerOpen : ''} ${!form.subject_id ? styles.subjectTriggerEmpty : ''}`}
                          onClick={() => setSubjectOpen(v => !v)}
                        >
                          {selectedSubject ? (
                            <span className={styles.subjectSelected}>{isAr ? selectedSubject.name_ar : selectedSubject.name_en}</span>
                          ) : (
                            <span className={styles.subjectPlaceholder}>{isAr ? '— اختر المادة —' : '— Choose a subject —'}</span>
                          )}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ transition: 'transform 0.2s', transform: subjectOpen ? 'rotate(180deg)' : 'rotate(0)', flexShrink: 0 }}>
                            <path d="m6 9 6 6 6-6"/>
                          </svg>
                        </button>
                        {subjectOpen && (
                          <div className={styles.subjectMenu}>
                            {tutorSubjects.map(s => (
                              <button type="button" key={s.id}
                                className={`${styles.subjectOption} ${String(s.id) === form.subject_id ? styles.subjectOptionActive : ''}`}
                                onClick={() => { update('subject_id', String(s.id)); setSubjectOpen(false); }}>
                                <span className={styles.subjectOptionName}>{isAr ? s.name_ar : s.name_en}</span>
                                {String(s.id) === form.subject_id && (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      )}
                    </div>

                    {/* ── Date + Time ── */}
                    <div className={styles.dateTimeRow}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>📅 {isAr ? 'التاريخ المقترح' : 'Preferred Date'}</label>
                        <input type="date" className={styles.fieldInput}
                          value={form.preferred_date} onChange={e => update('preferred_date', e.target.value)}
                          required min={new Date().toISOString().split('T')[0]} />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>🕐 {isAr ? 'الوقت المقترح' : 'Preferred Time'}</label>
                        <input type="time" className={styles.fieldInput}
                          value={form.preferred_time} onChange={e => update('preferred_time', e.target.value)} required />
                      </div>
                    </div>

                    {/* ── Format toggle ── */}
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>🖥️ {isAr ? 'نوع الدرس' : 'Lesson Format'}</label>
                      <div className={styles.formatToggle}>
                        {formatOptions.map(opt => (
                          <button key={opt.val} type="button"
                            className={`${styles.formatOption} ${form.format === opt.val ? styles.formatOptionActive : ''}`}
                            onClick={() => update('format', opt.val)}>
                            {isAr ? opt.labelAr : opt.labelEn}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── In-Person: Address Autocomplete + Map ── */}
                    {form.format === 'in_person' && (
                      <div className={styles.addressSection}>

                        {/* Live search address field */}
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel}>
                            📍 {isAr ? 'عنوان الدرس' : 'Lesson Address'}
                          </label>
                          <div className={styles.addressSearchWrap} ref={addressRef}>
                            <div className={styles.addressInputRow}>
                              <svg className={styles.addressSearchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                              </svg>
                              <input
                                type="text"
                                className={styles.addressInput}
                                placeholder={isAr ? 'ابحث عن العنوان...' : 'Search for address...'}
                                value={addressQuery}
                                onChange={e => {
                                  setAddressQuery(e.target.value);
                                  update('address', e.target.value);
                                }}
                                onFocus={() => addressResults.length > 0 && setAddressDropOpen(true)}
                                autoComplete="off"
                              />
                              {addressLoading && <span className={styles.addressSpinner} />}
                              {addressQuery && !addressLoading && (
                                <button type="button" className={styles.addressClear}
                                  onClick={() => { setAddressQuery(''); update('address', ''); setAddressResults([]); setAddressDropOpen(false); }}>
                                  ✕
                                </button>
                              )}
                            </div>

                            {/* Results dropdown — also shows no-results state */}
                            {(addressDropOpen || (debouncedAddress.length >= 3 && !addressLoading && addressResults.length === 0 && addressQuery)) && (
                              <div className={styles.addressMenu}>
                                {addressResults.length > 0
                                  ? addressResults.map(r => (
                                    <button type="button" key={r.place_id} className={styles.addressOption}
                                      onClick={() => handleAddressSelect(r)}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                                      </svg>
                                      <span className={styles.addressOptionText}>{r.display_name}</span>
                                    </button>
                                  ))
                                  : (
                                    <div className={styles.addressNoResults}>
                                      🔍 {isAr ? 'لا توجد نتائج' : 'No results found'}
                                    </div>
                                  )
                                }
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Map */}
                        <div className={styles.mapWrapper}>
                          <p className={styles.mapHint}>
                            📌 {isAr ? 'اضغط على الخريطة لتحديد الموقع بدقة، أو اسحب الدبوس' : 'Click the map to pin location, or drag the pin'}
                          </p>
                          <div className={styles.mapContainer}>
                            <MapPicker
                              value={mapCoords}
                              onChange={setMapCoords}
                              onAddressResolved={handleAddressResolved}
                            />
                          </div>
                          {mapCoords && (
                            <p className={styles.coordsBadge}>
                              📍 {mapCoords.lat.toFixed(5)}, {mapCoords.lng.toFixed(5)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Message ── */}
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>💬 {isAr ? 'رسالة للمعلم' : 'Message to tutor'}</label>
                      <textarea
                        className={styles.fieldInput}
                        rows={5}
                        value={form.message}
                        onChange={e => update('message', e.target.value)}
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  </div>

                  <button type="submit" className={styles.submitBtn}
                    disabled={mutation.isPending || (tutorSubjects.length > 0 && !form.subject_id)}>
                    {mutation.isPending
                      ? <><span className={styles.spinner} /> {isAr ? 'جاري الإرسال...' : 'Sending...'}</>
                      : <>🚀 {isAr ? 'إرسال طلب الحجز' : 'Send Booking Request'}</> }
                  </button>
                </form>
              )}
            </div>

            {/* ══ TUTOR CARD ════════════════════════════════════ */}
            {tutor && (
              <div className={styles.tutorCard}>

                {/* Fix #4: real cover image */}
                <div className={styles.tutorCardImgWrap}>
                  <img src={imageSrc} alt={tutorName} className={styles.tutorCardImg} />
                  {/* Fix #7: Level badge */}
                  {level && (
                    <div className={styles.tutorCardLevel} style={{ background: level.bg, color: level.color }}>
                      {isAr ? level.label.ar : level.label.en}
                    </div>
                  )}
                </div>

                <div className={styles.tutorCardBody}>
                  <div className={styles.tutorCardName}>{tutorName}</div>

                  {/* Fix #6: Verification badge */}
                  <div className={isVerified ? styles.tutorCardVerified : styles.tutorCardUnverified}>
                    {isVerified ? (
                      <><svg width={10} height={10} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#16a34a"/><path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {isAr ? 'هوية موثّقة' : 'Identity verified'}</>
                    ) : (
                      <><svg width={10} height={10} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#d97706" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="#d97706" strokeWidth="2" strokeLinecap="round"/></svg>
                      {isAr ? 'لم يتم التحقق بعد' : 'Not verified yet'}</>
                    )}
                  </div>

                  <div className={styles.tutorCardHeadline}>{isAr ? tutor.headline_ar : tutor.headline_en}</div>

                  <div className={styles.tutorCardStats}>
                    <div className={styles.tutorCardStat}>
                      <span>⭐</span>
                      <div>
                        <div className={styles.tutorCardStatValue}>{Number(tutor.avg_rating) > 0 ? Number(tutor.avg_rating).toFixed(1) : '—'}</div>
                        <div className={styles.tutorCardStatLabel}>{isAr ? 'التقييم' : 'Rating'}</div>
                      </div>
                    </div>
                    <div className={styles.tutorCardStatDivider} />
                    <div className={styles.tutorCardStat}>
                      <span>👥</span>
                      <div>
                        <div className={styles.tutorCardStatValue}>{tutor.total_students || 0}+</div>
                        <div className={styles.tutorCardStatLabel}>{isAr ? 'طالب' : 'Students'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Fix #1 + duration hint */}
                  <div className={styles.tutorCardPriceRow}>
                    <div className={styles.tutorCardPrice}>
                      <span className={styles.tutorCardPriceNum}>{displayRate.toLocaleString()}</span>
                      <span className={styles.tutorCardPriceUnit}>{isAr ? 'ج.م / ساعة' : 'EGP / hr'}</span>
                    </div>
                    {tutor.first_lesson_duration && (
                      <span className={styles.tutorCardDuration}>
                        ⏱ {tutor.first_lesson_duration as string} {isAr ? 'د' : 'min'}
                      </span>
                    )}
                  </div>
                  {form.format === 'online' && tutor.hourly_rate_online && Number(tutor.hourly_rate_online) !== Number(tutor.hourly_rate) && (
                    <div className={styles.tutorCardOnlineNote}>
                      💻 {isAr ? 'سعر الأونلاين مختلف عن سعر الحضوري' : 'Online rate differs from in-person'}
                    </div>
                  )}

                  {tutor.is_first_lesson_free && (
                    <div className={styles.tutorCardFree}>
                      🎁 {isAr ? 'الدرس الأول مجاناً!' : 'First lesson is FREE!'}
                    </div>
                  )}

                  {/* Fix #5: pack pricing mention */}
                  {(tutor.pack_5h_price || tutor.pack_10h_price) && (
                    <div className={styles.tutorCardPacks}>
                      <div className={styles.tutorCardPacksTitle}>📦 {isAr ? 'باقات متاحة:' : 'Package deals:'}</div>
                      {tutor.pack_5h_price && (
                        <div>{isAr ? '٥ ساعات:' : '5 hrs:'} <strong>{Number(tutor.pack_5h_price).toLocaleString()}</strong> {isAr ? 'ج.م' : 'EGP'}</div>
                      )}
                      {tutor.pack_10h_price && (
                        <div>{isAr ? '١٠ ساعات:' : '10 hrs:'} <strong>{Number(tutor.pack_10h_price).toLocaleString()}</strong> {isAr ? 'ج.م' : 'EGP'}</div>
                      )}
                    </div>
                  )}

                  <Link href={`/tutor/${tutorSlug}`} className={styles.tutorCardBackLink}>
                    {isAr ? '← عرض الملف الشخصي' : '← View Full Profile'}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
