'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './LocationPicker.module.css';

interface LocationResult {
  lat: number;
  lon: number;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

interface Props {
  initialValue?: string;
  onSelect: (label: string, lat: number, lon: number) => void;
  isAr?: boolean;
}

export default function LocationPicker({ initialValue = '', onSelect, isAr = false }: Props) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const leafletRef  = useRef<typeof import('leaflet') | null>(null);
  const mapInstance = useRef<import('leaflet').Map | null>(null);
  const markerRef   = useRef<import('leaflet').Marker | null>(null);

  const [query, setQuery]         = useState(initialValue);
  const [results, setResults]     = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected]   = useState<LocationResult | null>(null);
  const [showDrop, setShowDrop]   = useState(false);
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Init Leaflet (client-only) ──────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    import('leaflet').then(L => {
      leafletRef.current = L;

      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!, {
        center: [30.0444, 31.2357], // Cairo default
        zoom: 12,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Click on map to pick location
      map.on('click', async (e: import('leaflet').LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        placeMarker(L, map, lat, lng);

        // Reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${isAr ? 'ar' : 'en'}`,
            { headers: { 'User-Agent': 'AlemnyPro/1.0' } }
          );
          const data = await res.json();
          const label = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setQuery(label);
          setSelected({ lat, lon: lng, display_name: label, address: data.address });
          onSelect(label, lat, lng);
        } catch {
          const label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setQuery(label);
          onSelect(label, lat, lng);
        }
      });

      mapInstance.current = map;
    });

    // Inject Leaflet CSS once
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function placeMarker(L: typeof import('leaflet'), map: import('leaflet').Map, lat: number, lon: number) {
    if (markerRef.current) markerRef.current.remove();
    const marker = L.marker([lat, lon], {
      icon: L.divIcon({
        className: '',
        html: `<div class="${styles.customPin}">📍</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      }),
    }).addTo(map);
    markerRef.current = marker;
    map.flyTo([lat, lon], 14, { animate: true, duration: 0.8 });
  }

  // ── Search via Nominatim ─────────────────────────────────────────
  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=${isAr ? 'ar' : 'en'}`,
        { headers: { 'User-Agent': 'AlemnyPro/1.0' } }
      );
      const data: LocationResult[] = await res.json();
      setResults(data);
      setShowDrop(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [isAr]);

  function handleQueryChange(val: string) {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 500);
  }

  function pickResult(r: LocationResult) {
    setQuery(r.display_name);
    setSelected(r);
    setShowDrop(false);
    setResults([]);
    onSelect(r.display_name, parseFloat(String(r.lat)), parseFloat(String(r.lon)));

    const L = leafletRef.current;
    const map = mapInstance.current;
    if (L && map) {
      placeMarker(L, map, parseFloat(String(r.lat)), parseFloat(String(r.lon)));
    }
  }

  function handleGeolocate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lon } = pos.coords;
      const L = leafletRef.current;
      const map = mapInstance.current;
      if (L && map) placeMarker(L, map, lat, lon);

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=${isAr ? 'ar' : 'en'}`,
          { headers: { 'User-Agent': 'AlemnyPro/1.0' } }
        );
        const data = await res.json();
        const label = data.display_name || `${lat}, ${lon}`;
        setQuery(label);
        setSelected({ lat, lon, display_name: label });
        onSelect(label, lat, lon);
      } catch {
        const label = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        setQuery(label);
        onSelect(label, lat, lon);
      }
    }, undefined, { enableHighAccuracy: true });
  }

  return (
    <div className={styles.wrap}>
      {/* Search Bar */}
      <div className={styles.searchRow}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => results.length > 0 && setShowDrop(true)}
            placeholder={isAr ? 'ابحث عن موقعك...' : 'Search for your location...'}
            autoComplete="off"
          />
          {searching && <span className={styles.spinner}>⏳</span>}
          {query && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => { setQuery(''); setResults([]); setShowDrop(false); }}
            >✕</button>
          )}
        </div>
        <button
          type="button"
          className={styles.geoBtn}
          onClick={handleGeolocate}
          title={isAr ? 'موقعي الحالي' : 'Use my location'}
        >
          🎯
        </button>
      </div>

      {/* Dropdown suggestions */}
      {showDrop && results.length > 0 && (
        <ul className={styles.dropdown}>
          {results.map((r, i) => (
            <li
              key={i}
              className={styles.dropdownItem}
              onMouseDown={() => pickResult(r)}
            >
              <span className={styles.dropdownPin}>📍</span>
              <span className={styles.dropdownText}>{r.display_name}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Map container */}
      <div ref={mapRef} className={styles.map} />

      {/* Selected chip */}
      {selected && (
        <div className={styles.selectedChip}>
          <span>✅</span>
          <span className={styles.selectedChipText}>{selected.display_name}</span>
        </div>
      )}

      <p className={styles.hint}>
        {isAr ? '💡 انقر على الخريطة أو ابحث عن موقعك أعلاه' : '💡 Click on the map or search above to pick your location'}
      </p>
    </div>
  );
}
