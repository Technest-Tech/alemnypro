'use client';

import { useEffect, useRef } from 'react';

interface Props {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
  onAddressResolved?: (address: string) => void;
}

export default function MapPicker({ value, onChange, onAddressResolved }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<import('leaflet').Map | null>(null);
  const markerRef    = useRef<import('leaflet').Marker | null>(null);

  /* ── Build map once on mount ─────────────────────────────── */
  useEffect(() => {
    if (!containerRef.current) return;

    // Guard: Leaflet stamps _leaflet_id on the container when initialized
    const el = containerRef.current as HTMLDivElement & { _leaflet_id?: number };
    if (el._leaflet_id) return;

    import('leaflet').then(L => {
      // Extra guard inside async callback (strict-mode double fire)
      if ((containerRef.current as typeof el)?._leaflet_id) return;

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const defaultCenter: [number, number] = value
        ? [value.lat, value.lng]
        : [30.0444, 31.2357]; // Cairo

      const map = L.map(containerRef.current!, {
        center: defaultCenter,
        zoom: value ? 15 : 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      if (value) {
        markerRef.current = L.marker([value.lat, value.lng], { draggable: true }).addTo(map);
        markerRef.current.on('dragend', (e) => {
          const pos = (e.target as import('leaflet').Marker).getLatLng();
          placeMarker(pos.lat, pos.lng, L);
        });
      }

      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        placeMarker(e.latlng.lat, e.latlng.lng, L);
      });
    });

    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch { /* already removed */ }
        mapRef.current  = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Shared helper ──────────────────────────────────────── */
  function placeMarker(lat: number, lng: number, L: typeof import('leaflet')) {
    onChange({ lat, lng });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else if (mapRef.current) {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
      markerRef.current.on('dragend', (e) => {
        const pos = (e.target as import('leaflet').Marker).getLatLng();
        placeMarker(pos.lat, pos.lng, L);
      });
    }

    if (onAddressResolved) {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'ar,en' } }
      )
        .then(r => r.json())
        .then(data => { if (data?.display_name) onAddressResolved(data.display_name); })
        .catch(() => {});
    }
  }

  /* ── Sync external coords → pan map ───────────────────── */
  useEffect(() => {
    if (!value || !mapRef.current) return;
    import('leaflet').then(L => {
      mapRef.current!.flyTo([value.lat, value.lng], 15, { animate: true, duration: 0.8 });
      if (markerRef.current) {
        markerRef.current.setLatLng([value.lat, value.lng]);
      } else {
        markerRef.current = L.marker([value.lat, value.lng], { draggable: true }).addTo(mapRef.current!);
        markerRef.current.on('dragend', (e) => {
          const pos = (e.target as import('leaflet').Marker).getLatLng();
          placeMarker(pos.lat, pos.lng, L);
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }} />
    </>
  );
}
