'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { adminApi } from '@/lib/api';

const SETTING_ICONS: Record<string, string> = {
  platform_fee_pct:        '💰',
  dispute_window_hours:    '⏰',
  min_session_duration:    '⏱',
  max_session_duration:    '⏱',
  default_currency:        '💲',
  max_lessons_per_booking: '📦',
};

interface Setting {
  id: number; key: string; value: string | number | boolean;
  type: string; label_en: string; label_ar: string;
  description_en?: string; description_ar?: string; is_public: boolean;
}

export default function AdminSettingsPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const qc   = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminApi.getSettings().then(r => r.data.data as Setting[]),
  });

  const settings = data || [];
  const [editing, setEditing] = useState<Record<string, string | number | boolean>>({});
  const [saved, setSaved]     = useState<string | null>(null);
  const [err, setErr]         = useState<string | null>(null);

  const updateMut = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => adminApi.updateSetting(key, value),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      setSaved(vars.key);
      setEditing(prev => { const n = { ...prev }; delete n[vars.key]; return n; });
      setTimeout(() => setSaved(null), 2500);
    },
    onError: () => setErr(isAr ? 'حدث خطأ أثناء الحفظ' : 'Error saving'),
  });

  const set = (key: string, val: string | number | boolean) => setEditing(prev => ({ ...prev, [key]: val }));

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem 0' }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#1A1A2E' }}>
          ⚙️ {isAr ? 'إعدادات المنصة' : 'Platform Settings'}
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>
          {isAr ? 'التغييرات تسري فوراً على الحصص الجديدة فقط' : 'Changes apply instantly to new sessions only'}
        </p>
      </div>

      {/* Warning banner */}
      <div style={{ background: '#FEF3C7', borderRadius: 14, padding: '14px 18px', marginBottom: 24, fontSize: 14, color: '#92400E', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <span>
          {isAr
            ? 'تغيير نسبة العمولة يؤثر فقط على الحصص التي تُجدَّل بعد تاريخ التغيير. الحصص الحالية تحتفظ بنسبتها المسجلة عند الإنشاء.'
            : 'Changing commission only affects sessions scheduled AFTER this change. Existing sessions keep their original rate.'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {settings.map((s) => {
          const val      = editing[s.key] ?? s.value;
          const isDirty  = editing[s.key] !== undefined;
          const icon     = SETTING_ICONS[s.key] || '⚙️';
          const label    = isAr ? s.label_ar : s.label_en;
          const desc     = isAr ? s.description_ar : s.description_en;

          return (
            <div key={s.key} style={{
              background: '#fff',
              border: `1.5px solid ${saved === s.key ? '#86EFAC' : isDirty ? '#93C5FD' : '#E9EBF0'}`,
              borderRadius: 16, padding: '20px 22px', transition: 'all 0.2s',
              boxShadow: isDirty ? '0 4px 12px rgba(59,130,246,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#1A1A2E' }}>{label}</span>
                </div>
                {s.is_public && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#F0FDF4', color: '#16A34A' }}>
                    {isAr ? 'عام' : 'PUBLIC'}
                  </span>
                )}
              </div>

              {desc && <p style={{ margin: '0 0 14px', fontSize: 13, color: '#9CA3AF', lineHeight: 1.5 }}>{desc}</p>}

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {s.type === 'boolean' ? (
                  <select value={String(val)} onChange={e => set(s.key, e.target.value === 'true')}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14 }}>
                    <option value="true">{isAr ? 'مفعّل' : 'Enabled'}</option>
                    <option value="false">{isAr ? 'معطّل' : 'Disabled'}</option>
                  </select>
                ) : s.key === 'default_currency' ? (
                  <select value={String(val)} onChange={e => set(s.key, e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14 }}>
                    <option value="EGP">EGP — جنيه مصري</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="SAR">SAR — ريال سعودي</option>
                  </select>
                ) : (
                  <input
                    type="number" value={String(val)}
                    step={s.type === 'decimal' ? '0.5' : '1'}
                    min={s.key === 'platform_fee_pct' ? 0 : 1}
                    max={s.key === 'platform_fee_pct' ? 50 : undefined}
                    onChange={e => set(s.key, s.type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value))}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit' }}
                  />
                )}

                <button
                  onClick={() => updateMut.mutate({ key: s.key, value: val })}
                  disabled={!isDirty || updateMut.isPending}
                  style={{
                    padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700,
                    cursor: isDirty ? 'pointer' : 'default',
                    background: saved === s.key ? '#16A34A' : isDirty ? '#1B4965' : '#E5E7EB',
                    color: isDirty || saved === s.key ? '#fff' : '#9CA3AF',
                    transition: 'all 0.2s',
                  }}
                >
                  {saved === s.key ? '✓' : (isAr ? 'حفظ' : 'Save')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {err && <p style={{ color: '#DC2626', fontSize: 14, marginTop: 16 }}>{err}</p>}
    </>
  );
}
