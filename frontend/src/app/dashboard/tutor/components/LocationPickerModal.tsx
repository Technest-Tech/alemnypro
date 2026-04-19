'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './LocationPickerModal.module.css';
import { tutorApi } from '@/lib/api';

/* ─── Types ──────────────────────────────────────────────────────────────── */
export interface LocationData {
  atHome: boolean;       // teach at tutor's own place
  atPupil: boolean;      // teach at student's home / public place
  online: boolean;       // online / visio
  addressLabel: string;  // human-readable address
  lat: number | null;
  lng: number | null;
  radius: number;        // km — travel radius
}

interface Props {
  isAr: boolean;
  initial: LocationData;
  onClose: () => void;
  onSaved: (data: LocationData) => void;
}

/* ─── Nominatim Geocoder ─────────────────────────────────────────────────── */
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: { country?: string; state?: string; city?: string; town?: string };
}

async function geocodeSearch(q: string): Promise<NominatimResult[]> {
  if (!q.trim() || q.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'ar,en' } });
  return res.json();
}

/* ─── Leaf (dynamic map — only renders client-side) ─────────────────────── */
interface LeafMapProps {
  lat: number;
  lng: number;
  radius: number;       // km
  onMove: (lat: number, lng: number) => void;
}

function LeafMap({ lat, lng, radius, onMove }: LeafMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  const circleRef = useRef<unknown>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!containerRef.current) return;
    if (mapRef.current) return; // already initialised

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      // Fix Leaflet's default icon path (webpack breaks it)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current!, {
        center: [lat, lng],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      const circle = L.circle([lat, lng], {
        radius: radius * 1000,
        color: '#1B4965',
        fillColor: '#1B4965',
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '6 4',
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        circle.setLatLng(pos);
        onMove(pos.lat, pos.lng);
      });

      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng(e.latlng);
        circle.setLatLng(e.latlng);
        onMove(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
    });

    return () => {
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker & circle when lat/lng changes externally (e.g. from search)
  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = mapRef.current as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const marker = markerRef.current as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const circle = circleRef.current as any;
      if (!map || !marker || !circle) return;
      const pos = { lat, lng };
      map.setView(pos, 13, { animate: true });
      marker.setLatLng(pos);
      circle.setLatLng(pos);
    });
  }, [lat, lng]);

  // Update circle radius when radius slider changes
  useEffect(() => {
    if (!circleRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (circleRef.current as any).setRadius(radius * 1000);
  }, [radius]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

/* ─── Main Modal ─────────────────────────────────────────────────────────── */
export default function LocationPickerModal({ isAr, initial, onClose, onSaved }: Props) {
  const [atHome, setAtHome] = useState(initial.atHome);
  const [atPupil, setAtPupil] = useState(initial.atPupil);
  const [online, setOnline] = useState(initial.online);
  const [addressLabel, setAddressLabel] = useState(initial.addressLabel);
  const [lat, setLat] = useState<number>(initial.lat ?? 30.0444);   // default Cairo
  const [lng, setLng] = useState<number>(initial.lng ?? 31.2357);
  const [radius, setRadius] = useState(initial.radius || 20);
  const [searchQ, setSearchQ] = useState(initial.addressLabel || '');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load Leaflet CSS once
  useEffect(() => {
    if (document.querySelector('#leaflet-css')) { setMapReady(true); return; }
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.onload = () => setMapReady(true);
    document.head.appendChild(link);
  }, []);

  // Debounced geocode search
  const handleSearch = useCallback((q: string) => {
    setSearchQ(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await geocodeSearch(q);
      setSuggestions(results);
    }, 400);
  }, []);

  const pickSuggestion = (s: NominatimResult) => {
    setLat(parseFloat(s.lat));
    setLng(parseFloat(s.lon));
    setAddressLabel(s.display_name);
    setSearchQ(s.display_name);
    setSuggestions([]);
  };

  const handleMapMove = useCallback((la: number, lo: number) => {
    setLat(la);
    setLng(lo);
    // Reverse geocode to update label
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${la}&lon=${lo}`)
      .then(r => r.json())
      .then(d => {
        if (d?.display_name) {
          setAddressLabel(d.display_name);
          setSearchQ(d.display_name);
        }
      })
      .catch(() => {});
  }, []);

  const fillPercent = ((radius - 1) / (99)) * 100;

  // Derive lesson_format for backend
  function getLessonFormat(): string {
    if (online && (atHome || atPupil)) return 'both';
    if (online) return 'online';
    return 'in_person';
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await tutorApi.updateProfile({
        lesson_format:   getLessonFormat(),
        // Save location label when either home-based mode is active
        location_label:  (atHome || atPupil) ? addressLabel : null,
        travel_expenses: atPupil ? radius : null,
      });
      onSaved({ atHome, atPupil, online, addressLabel, lat, lng, radius });
      onClose();
    } catch {
      // keep open so user can retry
    } finally {
      setIsSaving(false);
    }
  };

  // ── Translations ──
  const t = {
    title:  isAr ? 'مكان التدريس' : 'Teaching Place',
    sub:    isAr ? 'اختر أين تفضّل إعطاء الدروس' : 'Choose where you prefer to give lessons',
    atHome: isAr ? 'في منزلي' : 'At my place',
    atHomeSub: isAr ? 'يأتي الطلاب إليك' : 'Students come to you',
    atPupil: isAr ? 'في منزل الطالب / مكان عام' : "At the student's home / public place",
    atPupilSub: isAr ? 'أنت تتنقل إلى الطالب' : 'You travel to the student',
    online: isAr ? 'أونلاين (فيديو)' : 'Online (Video)',
    onlineSub: isAr ? 'دروس عبر الإنترنت' : 'Lessons via Zoom, Meet…',
    searchPlaceholder: isAr ? 'ابحث عن عنوانك...' : 'Search your address…',
    yourAddress:       isAr ? 'عنوانك' : 'Your address',
    yourBase:          isAr ? 'موقعك الأساسي (نقطة الانطلاق)' : 'Your base location (starting point)',
    mapHint: isAr ? 'انقر على الخريطة أو اسحب الدبوس لضبط موقعك' : 'Click the map or drag the pin to set your location',
    radiusLabel: isAr ? 'نطاق التنقل' : 'Radius of movement',
    radiusHint: isAr ? 'أقصى مسافة تتنقل إليها من موقعك' : 'Max distance you can travel from your location',
    cancel: isAr ? 'إلغاء' : 'Cancel',
    save:   isAr ? 'حفظ' : 'Save',
    saving: isAr ? 'جاري الحفظ...' : 'Saving…',
    selectOnMap: isAr ? 'اختر على الخريطة' : 'Selected on map',
    noResults: isAr ? 'لا نتائج — حاول تفصيلاً أكثر' : 'No results — try a more detailed address',
  };

  // Show address+map panel whenever either mode that needs a physical location is on
  const showAddressPanel = atHome || atPupil;

  return (
    <div className={styles.backdrop} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true">

        {/* ── Header ── */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <div className={styles.modalTitleIcon}>📍</div>
            <div>
              <div className={styles.modalTitleText}>{t.title}</div>
              <div className={styles.modalTitleSub}>{t.sub}</div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close">✕</button>
        </div>

        {/* ── Body ── */}
        <div className={styles.modalBody}>

          {/* ─ Mode Cards ─ */}
          <div className={styles.modeCards}>

            {/* At home */}
            <div
              className={`${styles.modeCard} ${atHome ? styles.modeCardActive : ''}`}
              onClick={() => setAtHome(v => !v)}
            >
              <div className={styles.modeIcon}>🏠</div>
              <div className={styles.modeInfo}>
                <div className={styles.modeLabel}>{t.atHome}</div>
                <div className={styles.modeSub}>{t.atHomeSub}</div>
              </div>
              <div className={styles.modeCheck}>
                <span className={styles.modeCheckIcon}>✓</span>
              </div>
            </div>

            {/* ── At pupil / public ── */}
            <div
              className={`${styles.modeCard} ${atPupil ? styles.modeCardActive : ''}`}
              onClick={() => setAtPupil(v => !v)}
            >
              <div className={styles.modeIcon}>🏫</div>
              <div className={styles.modeInfo}>
                <div className={styles.modeLabel}>{t.atPupil}</div>
                <div className={styles.modeSub}>{t.atPupilSub}</div>
              </div>
              <div className={styles.modeCheck}>
                <span className={styles.modeCheckIcon}>✓</span>
              </div>
            </div>

            {/* ── Combined address + map + radius panel ─────────────────────
                 Shown whenever atHome OR atPupil is active.
                 Label adapts: "your address" vs "your base location".
                 Radius slider only appears when atPupil is on.
            ──────────────────────────────────────────────────────────────── */}
            {showAddressPanel && (
              <div className={styles.expandPanel}>
                <div style={{ padding: '2px 8px 10px 8px' }}>

                  {/* Context-sensitive label */}
                  <div style={{ marginBottom: 8, fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
                    📌 {atHome ? t.yourAddress : t.yourBase}
                  </div>

                  {/* ── Search + Map wrapped in position:relative so the
                       dropdown is absolute relative to this outer box,
                       NOT relative to the input — this is the same pattern
                       as the working profile/LocationPicker.tsx ── */}
                  <div className={styles.searchMapWrap}>

                    {/* Search row */}
                    <div className={styles.searchRow}>
                      <div className={styles.searchBox}>
                        <span className={styles.searchBoxIcon}>🔍</span>
                        <input
                          className={styles.searchBoxInput}
                          value={searchQ}
                          onChange={e => handleSearch(e.target.value)}
                          onFocus={() => suggestions.length > 0 && setSuggestions(s => [...s])}
                          onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                          placeholder={t.searchPlaceholder}
                          dir={isAr ? 'rtl' : 'ltr'}
                          autoComplete="off"
                        />
                        {searchQ && (
                          <button
                            type="button"
                            className={styles.searchClearBtn}
                            onMouseDown={e => { e.preventDefault(); setSearchQ(''); setAddressLabel(''); setSuggestions([]); }}
                          >✕</button>
                        )}
                      </div>
                      {/* GPS locate-me button */}
                      <button
                        type="button"
                        className={styles.geoBtn}
                        title={isAr ? 'موقعي الحالي' : 'Use my location'}
                        onClick={() => {
                          if (!navigator.geolocation) return;
                          navigator.geolocation.getCurrentPosition(async pos => {
                            const { latitude: la, longitude: lo } = pos.coords;
                            setLat(la); setLng(lo);
                            try {
                              const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${la}&lon=${lo}`);
                              const d = await r.json();
                              if (d?.display_name) { setAddressLabel(d.display_name); setSearchQ(d.display_name); }
                            } catch { /* ignore */ }
                          });
                        }}
                      >🎯</button>
                    </div>

                    {/* Dropdown — positioned absolute relative to .searchMapWrap
                         so it floats ABOVE the map, matching the working pattern */}
                    {suggestions.length > 0 && (
                      <ul className={styles.dropdown}>
                        {suggestions.map(s => (
                          <li
                            key={s.place_id}
                            className={styles.dropdownItem}
                            onMouseDown={() => pickSuggestion(s)}
                          >
                            <span className={styles.dropdownPin}>📍</span>
                            <span className={styles.dropdownText}>{s.display_name}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Map — z-index:0 keeps it under the dropdown */}
                    <div className={styles.mapWrap}>
                      {mapReady
                        ? <LeafMap lat={lat} lng={lng} radius={atPupil ? radius : 0} onMove={handleMapMove} />
                        : <div className={styles.mapSkeleton} />
                      }
                    </div>

                  </div>{/* /searchMapWrap */}

                  {/* Selected badge — shown below map */}
                  {addressLabel && (
                    <div className={styles.selectedBadge} style={{ marginTop: 10 }}>
                      <span className={styles.selectedBadgePin}>✅</span>
                      <span className={styles.selectedBadgeText}>{addressLabel}</span>
                      <button
                        className={styles.selectedBadgeClear}
                        type="button"
                        onClick={() => { setAddressLabel(''); setSearchQ(''); }}
                      >✕</button>
                    </div>
                  )}

                  <p className={styles.mapHint}>{t.mapHint}</p>

                  {/* Radius slider — only when atPupil is on */}
                  {atPupil && (
                    <div className={styles.radiusWrap} style={{ marginTop: 16 }}>
                      <div className={styles.radiusHeader}>
                        <div>
                          <div className={styles.radiusLabel}>
                            🗺️ {t.radiusLabel}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 2, fontWeight: 500 }}>
                            {t.radiusHint}
                          </div>
                        </div>
                        <div className={styles.radiusValue}>
                          <span className={styles.radiusValueNum}>{radius}</span>
                          <span className={styles.radiusValueUnit}>km</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        dir="ltr"
                        className={styles.radiusSlider}
                        style={{ '--fill': `${fillPercent}%` } as React.CSSProperties}
                        min={1}
                        max={100}
                        step={1}
                        value={radius}
                        onChange={e => setRadius(Number(e.target.value))}
                      />
                      <div className={styles.radiusMarks}>
                        {['1', '25', '50', '75', '100'].map(v => (
                          <span key={v} className={styles.radiusMark}>{v} km</span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* ── Online ── */}
            <div
              className={`${styles.modeCard} ${online ? styles.modeCardActive : ''}`}
              onClick={() => setOnline(v => !v)}
            >
              <div className={styles.modeIcon}>🌐</div>
              <div className={styles.modeInfo}>
                <div className={styles.modeLabel}>{t.online}</div>
                <div className={styles.modeSub}>{t.onlineSub}</div>
              </div>
              <div className={styles.modeCheck}>
                <span className={styles.modeCheckIcon}>✓</span>
              </div>
            </div>

          </div>{/* /modeCards */}
        </div>{/* /modalBody */}

        {/* ── Footer ── */}
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} type="button" onClick={onClose}>
            {t.cancel}
          </button>
          <button
            className={styles.saveBtn}
            type="button"
            onClick={handleSave}
            disabled={isSaving || (!atHome && !atPupil && !online)}
          >
            {isSaving
              ? <><div className={styles.spinner} />{t.saving}</>
              : <>💾 {t.save}</>
            }
          </button>
        </div>

      </div>
    </div>
  );
}
