'use client';

import { useState, useEffect, useRef } from 'react';
import { onboardingApi } from '@/lib/api';
import styles from '../tutor-register.module.css';

interface Props {
  locale: 'ar' | 'en';
  onNext: () => void;
  onBack: () => void;
  initialData?: {
    formats?: string[];
    travel_radius_km?: number;
    location_lat?: number | null;
    location_lng?: number | null;
    location_label?: string;
  };
}

const FORMATS = [
  {
    id: 'online',
    icon: '💻',
    titleAr: 'أونلاين',
    titleEn: 'Online',
    descAr: 'دروس عبر Zoom أو Google Meet',
    descEn: 'Lessons via Zoom or Google Meet',
  },
  {
    id: 'my_place',
    icon: '🏠',
    titleAr: 'عندي',
    titleEn: 'At My Place',
    descAr: 'الطلاب يأتون إليك',
    descEn: 'Students come to you',
  },
  {
    id: 'student_place',
    icon: '🚗',
    titleAr: 'عند الطالب',
    titleEn: "At Student's Place",
    descAr: 'أنت تذهب إلى الطالب',
    descEn: 'You travel to the student',
  },
];

const RADIUS_OPTIONS = [5, 10, 15, 20, 25];

export default function Step3Format({ locale, onNext, onBack, initialData }: Props) {
  const [formats, setFormats]             = useState<string[]>(initialData?.formats?.length ? initialData.formats : ['online']);
  const [radius, setRadius]               = useState(initialData?.travel_radius_km ?? 10);
  const [locationLabel, setLocationLabel] = useState(initialData?.location_label ?? '');
  const [locationLat, setLocationLat]     = useState<number | null>(initialData?.location_lat ?? null);
  const [locationLng, setLocationLng]     = useState<number | null>(initialData?.location_lng ?? null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const mapRef = useRef<HTMLDivElement>(null);

  const isAr          = locale === 'ar';
  const needsTravel   = formats.includes('student_place');
  const canNext       = formats.length >= 1 && (!needsTravel || locationLabel);

  // Lazy-load Leaflet for the map
  useEffect(() => {
    if (!needsTravel || !mapRef.current) return;
    let map: import('leaflet').Map;
    let marker: import('leaflet').Marker;

    import('leaflet').then(L => {
      // Fix default marker icons
      // @ts-expect-error leaflet internal
      delete L.default.Icon.Default.prototype._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current) return;

      // Default to Cairo
      const defaultLat = locationLat ?? 30.0444;
      const defaultLng = locationLng ?? 31.2357;

      map = L.default.map(mapRef.current).setView([defaultLat, defaultLng], 12);
      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      marker = L.default.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        setLocationLat(pos.lat);
        setLocationLng(pos.lng);
        // Reverse geocode with Nominatim (free)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json`
          );
          const data = await res.json();
          const label = data.display_name?.split(',').slice(0, 3).join(', ') || '';
          setLocationLabel(label);
        } catch {
          setLocationLabel(`${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
        }
      });

      map.on('click', async (e: import('leaflet').LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setLocationLat(lat);
        setLocationLng(lng);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          const label = data.display_name?.split(',').slice(0, 3).join(', ') || '';
          setLocationLabel(label);
        } catch {
          setLocationLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      });
    });

    return () => {
      map?.remove();
    };
  }, [needsTravel]);

  const toggleFormat = (id: string) => {
    setFormats(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleNext = async () => {
    if (!canNext || loading) return;
    setLoading(true);
    setError('');
    try {
      await onboardingApi.saveStep3({
        formats,
        travel_radius_km: needsTravel ? radius : null,
        location_lat: locationLat,
        location_lng: locationLng,
        location_label: locationLabel || null,
      });
      onNext();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || (isAr ? 'حدث خطأ' : 'Error saving'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHero}>
        <span className={styles.stepEmoji}>📍</span>
        <h1 className={styles.cardTitle}>
          {isAr ? <>أين <span className={styles.accentText}>تُدرّس؟</span></> : <>Where do you <span className={styles.accentText}>teach?</span></>}
        </h1>
        <p className={styles.cardSubtitle}>
          {isAr ? 'حدد شكل التدريس وضع حدودك' : "Where do you work best? Set your boundaries."}
        </p>
      </div>

      {/* Format Cards */}
      <div className={styles.formatGrid}>
        {FORMATS.map(f => (
          <button
            key={f.id}
            className={`${styles.formatCard} ${formats.includes(f.id) ? styles.formatCardActive : ''}`}
            onClick={() => toggleFormat(f.id)}
            id={`format-${f.id}`}
            type="button"
          >
            <span className={styles.formatIcon}>{f.icon}</span>
            <strong className={styles.formatTitle}>{isAr ? f.titleAr : f.titleEn}</strong>
            <p className={styles.formatDesc}>{isAr ? f.descAr : f.descEn}</p>
            {formats.includes(f.id) && <span className={styles.formatCheck}>✓</span>}
          </button>
        ))}
      </div>

      {/* Travel Configuration */}
      {needsTravel && (
        <div className={styles.travelSection}>
          <div className={styles.infoBox}>
            <span>🗺️</span>
            <div>
              <strong>{isAr ? 'نطاق التنقل' : 'Travel Radius'}</strong>
              <p>{isAr
                ? 'انقر على الخريطة لتحديد موقعك، ثم اختر نطاق تنقلك'
                : 'Click the map to set your location, then choose your travel radius'}</p>
            </div>
          </div>

          {/* Radius Selector */}
          <div className={styles.radiusRow}>
            <label className={styles.configLabel}>
              {isAr ? `نطاق التنقل: ${radius} كم` : `Travel radius: ${radius} km`}
            </label>
            <div className={styles.radiusBtns}>
              {RADIUS_OPTIONS.map(r => (
                <button
                  key={r}
                  className={`${styles.radiusBtn} ${radius === r ? styles.radiusBtnActive : ''}`}
                  onClick={() => setRadius(r)}
                  type="button"
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>

          {/* OpenStreetMap with Leaflet */}
          <div className={styles.mapContainer}>
            <link
              rel="stylesheet"
              href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            />
            <div ref={mapRef} className={styles.map} id="leaflet-map" />
          </div>

          {locationLabel && (
            <div className={styles.locationLabel}>
              📍 {locationLabel}
              <span className={styles.radiusBadge}>
                {isAr ? `نطاق ${radius} كم` : `${radius}km radius`}
              </span>
            </div>
          )}
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.btnRow}>
        <button className={styles.backBtn} onClick={onBack}>
          {isAr ? '→ رجوع' : '← Back'}
        </button>
        <button className={styles.nextBtn} onClick={handleNext} disabled={!canNext || loading}>
          {loading ? <span className={styles.btnSpinner} /> : (isAr ? 'التالي ←' : 'Next →')}
        </button>
      </div>
    </div>
  );
}
