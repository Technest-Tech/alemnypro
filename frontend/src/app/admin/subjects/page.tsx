'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { adminApi } from '@/lib/api';
import styles from '../admin.module.css';

/* ─── All possible level keys ──────────────────────────────────────── */
const ALL_LEVELS = [
  { key: 'children',     ar: 'أطفال',              en: 'Children' },
  { key: 'primary',      ar: 'ابتدائي',             en: 'Primary (Grades 1-6)' },
  { key: 'preparatory',  ar: 'إعدادي',              en: 'Preparatory (Grades 7-9)' },
  { key: 'secondary_1',  ar: 'أول ثانوي',           en: 'Secondary Year 1' },
  { key: 'secondary_2',  ar: 'ثاني ثانوي',          en: 'Secondary Year 2' },
  { key: 'secondary_3',  ar: 'ثالث ثانوي (ثانوية عامة)', en: 'Secondary Year 3 (Thanawya)' },
  { key: 'igcse_ol',     ar: 'IGCSE O Level',       en: 'IGCSE O Level' },
  { key: 'igcse_al',     ar: 'IGCSE A Level',       en: 'IGCSE A Level' },
  { key: 'ib',           ar: 'البكالوريا الدولية IB', en: 'IB (International Baccalaureate)' },
  { key: 'university',   ar: 'جامعي',               en: 'University' },
  { key: 'postgraduate', ar: 'دراسات عليا',         en: 'Postgraduate' },
  { key: 'adults',       ar: 'بالغون',              en: 'Adults (General)' },
  { key: 'beginner',     ar: 'مستوى مبتدئ',         en: 'Beginner Level' },
  { key: 'intermediate', ar: 'مستوى متوسط',         en: 'Intermediate Level' },
  { key: 'advanced',     ar: 'مستوى متقدم',         en: 'Advanced Level' },
  { key: 'professional', ar: 'مستوى احترافي',       en: 'Professional Level' },
];

const EMPTY_FORM = { name_ar: '', name_en: '', category_id: '', icon: '', levels: [] as string[] };

function LevelPicker({
  selected, onChange, isAr,
}: { selected: string[]; onChange: (v: string[]) => void; isAr: boolean }) {
  const toggle = (key: string) =>
    onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key]);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
      {ALL_LEVELS.map(l => (
        <button
          key={l.key}
          type="button"
          onClick={() => toggle(l.key)}
          style={{
            padding: '4px 12px',
            borderRadius: 100,
            fontSize: 12,
            fontWeight: 700,
            border: '1.5px solid',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
            background: selected.includes(l.key) ? 'var(--primary)' : 'transparent',
            color: selected.includes(l.key) ? '#fff' : 'var(--text-muted)',
            borderColor: selected.includes(l.key) ? 'var(--primary)' : 'var(--border)',
          }}
        >
          {isAr ? l.ar : l.en}
        </button>
      ))}
      {ALL_LEVELS.length > 0 && (
        <button
          type="button"
          onClick={() => onChange(selected.length === ALL_LEVELS.length ? [] : ALL_LEVELS.map(l => l.key))}
          style={{
            padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 800,
            border: '1.5px dashed var(--primary)', cursor: 'pointer', fontFamily: 'inherit',
            background: 'transparent', color: 'var(--primary)', transition: 'all 0.15s',
          }}
        >
          {selected.length === ALL_LEVELS.length
            ? (isAr ? 'إلغاء الكل' : 'Deselect All')
            : (isAr ? 'اختيار الكل' : 'Select All')}
        </button>
      )}
    </div>
  );
}

export default function AdminSubjectsPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [editLevels, setEditLevels] = useState<string[]>([]);
  const [editingLevelsFor, setEditingLevelsFor] = useState<number | null>(null);

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['admin-subjects'],
    queryFn: () => adminApi.getSubjects().then(r => r.data.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.getCategories().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      setForm(EMPTY_FORM);
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      adminApi.updateSubject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      setEditingLevelsFor(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteSubject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-subjects'] }),
  });

  const list = Array.isArray(subjects) ? subjects : [];

  return (
    <>
      {/* Header */}
      <div className={styles.dashHeader} style={{ position: 'static', marginBottom: 24 }}>
        <div>
          <h1 className={styles.dashTitle}>📚 {isAr ? 'إدارة المواد' : 'Manage Subjects'}</h1>
          <p className={styles.dashSubtitle}>
            {isAr ? 'أضف وعدّل المواد الدراسية ومستوياتها' : 'Add and manage academic subjects with their teaching levels'}
          </p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => { setShowForm(s => !s); setForm(EMPTY_FORM); }}>
          ➕ {isAr ? 'مادة جديدة' : 'New Subject'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className={styles.dashCard} style={{ marginBottom: 20 }}>
          <h2 className={styles.dashCardTitle}>➕ {isAr ? 'إضافة مادة جديدة' : 'Add New Subject'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: 16 }}>
            <div className="input-group">
              <label className="input-label">{isAr ? 'الاسم بالعربية' : 'Name (Arabic)'}</label>
              <input className="input" value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">{isAr ? 'الاسم بالإنجليزية' : 'Name (English)'}</label>
              <input className="input" value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">{isAr ? 'التصنيف' : 'Category'}</label>
              <select className="input select" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                <option value="">{isAr ? '— اختر —' : '— Choose —'}</option>
                {(Array.isArray(categories) ? categories : []).map((c: Record<string, unknown>) => (
                  <option key={c.id as number} value={c.id as number}>
                    {isAr ? c.name_ar as string : c.name_en as string}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 16 }}>
            <label className="input-label" style={{ fontWeight: 700 }}>
              🎓 {isAr ? 'المستويات المتاحة لهذه المادة' : 'Available Teaching Levels for This Subject'}
            </label>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
              {isAr
                ? 'اختر المستويات التي يمكن للمعلم التدريس بها في هذه المادة'
                : 'Select which student levels teachers can choose when adding this subject'}
            </p>
            <LevelPicker selected={form.levels} onChange={lvls => setForm(f => ({ ...f, levels: lvls }))} isAr={isAr} />
            {form.levels.length > 0 && (
              <p style={{ fontSize: 11, color: 'var(--primary)', marginTop: 6, fontWeight: 700 }}>
                {form.levels.length} {isAr ? 'مستوى محدد' : 'levels selected'}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary btn-md"
              onClick={() => createMutation.mutate({ ...form })}
              disabled={createMutation.isPending || !form.name_ar || !form.name_en}
            >
              {createMutation.isPending ? '...' : (isAr ? 'حفظ المادة' : 'Save Subject')}
            </button>
            <button className="btn btn-ghost btn-md" onClick={() => setShowForm(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.dashCard} style={{ margin: 0 }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />)}
          </div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            {isAr ? 'لا توجد مواد' : 'No subjects yet'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {list.map((s: Record<string, unknown>) => {
              const subjectLevels = Array.isArray(s.levels) ? s.levels as string[] : [];
              const isExpanded = editingLevelsFor === (s.id as number);
              return (
                <div key={s.id as number} style={{ background: 'var(--bg-alt)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  {/* Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700 }}>{s.icon as string} {isAr ? s.name_ar as string : s.name_en as string}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12, marginInlineStart: 8 }}>
                        {isAr ? s.name_en as string : s.name_ar as string}
                      </span>
                      {subjectLevels.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                          {subjectLevels.slice(0, 4).map((lk: string) => {
                            const lInfo = ALL_LEVELS.find(l => l.key === lk);
                            return (
                              <span key={lk} style={{
                                padding: '1px 7px', borderRadius: 100, fontSize: 10, fontWeight: 700,
                                background: 'rgba(var(--primary-rgb),0.1)', color: 'var(--primary)',
                              }}>
                                {lInfo ? (isAr ? lInfo.ar : lInfo.en) : lk}
                              </span>
                            );
                          })}
                          {subjectLevels.length > 4 && (
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>
                              +{subjectLevels.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {!!(s.category) && (() => {
                        const cat = s.category as Record<string, unknown>;
                        return (
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--primary-50, #E0F2FE)', color: 'var(--primary)' }}>
                            {isAr ? String(cat.name_ar) : String(cat.name_en)}
                          </span>
                        );
                      })()}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          if (isExpanded) {
                            setEditingLevelsFor(null);
                          } else {
                            setEditingLevelsFor(s.id as number);
                            setEditLevels(subjectLevels);
                          }
                        }}
                        style={{ fontSize: 12, fontWeight: 700 }}
                      >
                        🎓 {isExpanded ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'تعديل المستويات' : 'Edit Levels')}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => {
                          if (window.confirm(isAr ? 'هل تريد حذف هذه المادة؟' : 'Delete this subject?')) {
                            deleteMutation.mutate(s.id as number);
                          }
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Inline levels editor */}
                  {isExpanded && (
                    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: '#fff' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                        🎓 {isAr ? 'المستويات المتاحة لهذه المادة' : 'Available Teaching Levels'}
                      </p>
                      <LevelPicker selected={editLevels} onChange={setEditLevels} isAr={isAr} />
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => updateMutation.mutate({ id: s.id as number, data: { levels: editLevels } })}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? '...' : (isAr ? 'حفظ' : 'Save')}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingLevelsFor(null)}>
                          {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
