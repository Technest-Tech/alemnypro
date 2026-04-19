'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tutorApi } from '@/lib/api';
import s from './SubjectPickerModal.module.css';

/* ─── Level label map (bilingual) ──────────────────────────────────── */
const LEVEL_LABELS: Record<string, { ar: string; en: string; color: string; text: string }> = {
  children:     { ar: 'أطفال',                    en: 'Children',          color: '#FFF7ED', text: '#C2410C' },
  primary:      { ar: 'ابتدائي',                  en: 'Primary',           color: '#F0FDF4', text: '#15803D' },
  preparatory:  { ar: 'إعدادي',                   en: 'Preparatory',       color: '#ECFDF5', text: '#047857' },
  secondary_1:  { ar: 'أول ثانوي',                en: 'Sec. Year 1',       color: '#EFF6FF', text: '#1D4ED8' },
  secondary_2:  { ar: 'ثاني ثانوي',               en: 'Sec. Year 2',       color: '#EFF6FF', text: '#2563EB' },
  secondary_3:  { ar: 'ثالث ثانوي',               en: 'Sec. Year 3 (Thanawya)', color: '#EEF2FF', text: '#4338CA' },
  igcse_ol:     { ar: 'IGCSE O Level',             en: 'IGCSE O Level',     color: '#FDF4FF', text: '#7E22CE' },
  igcse_al:     { ar: 'IGCSE A Level',             en: 'IGCSE A Level',     color: '#FAF5FF', text: '#6D28D9' },
  ib:           { ar: 'IB بكالوريا دولية',         en: 'IB',                color: '#FFF1F2', text: '#BE123C' },
  university:   { ar: 'جامعي',                    en: 'University',        color: '#F0F9FF', text: '#0369A1' },
  postgraduate: { ar: 'دراسات عليا',              en: 'Postgraduate',      color: '#F8FAFC', text: '#475569' },
  adults:       { ar: 'بالغون',                   en: 'Adults',            color: '#FAFAF9', text: '#57534E' },
  beginner:     { ar: 'مبتدئ',                    en: 'Beginner',          color: '#ECFDF5', text: '#15803D' },
  intermediate: { ar: 'متوسط',                    en: 'Intermediate',      color: '#FFFBEB', text: '#B45309' },
  advanced:     { ar: 'متقدم',                    en: 'Advanced',          color: '#EFF6FF', text: '#1D4ED8' },
  professional: { ar: 'احترافي',                  en: 'Professional',      color: '#F5F3FF', text: '#6D28D9' },
};

function levelLabel(key: string, isAr: boolean): string {
  const l = LEVEL_LABELS[key];
  return l ? (isAr ? l.ar : l.en) : key;
}

/* ─── Types ──────────────────────────────────────────────────────── */
interface Subject {
  id: number;
  name_ar: string;
  name_en: string;
  levels?: string[];
  category?: { name_ar?: string; name_en?: string };
}

interface MySubject {
  id: number;
  subject_id?: number;
  subject?: Subject;
  name_ar?: string;
  name_en?: string;
  levels?: string[];
}

interface Props {
  isAr: boolean;
  allSubjects: Subject[];
  mySubjects: MySubject[];
  onClose: () => void;
  onSaved: () => void;
}

/* build map: subjectId → enrolled record */
function buildEnrolledMap(mySubjects: MySubject[]): Map<number, MySubject> {
  const m = new Map<number, MySubject>();
  for (const s of (mySubjects || [])) {
    const sid = s.subject_id ?? (s.subject?.id) ?? s.id;
    if (sid) m.set(sid, s);
  }
  return m;
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#0F766E,#14B8A6)',
  'linear-gradient(135deg,#6366F1,#818CF8)',
  'linear-gradient(135deg,#DB2777,#F472B6)',
  'linear-gradient(135deg,#D97706,#FBBF24)',
  'linear-gradient(135deg,#7C3AED,#A78BFA)',
  'linear-gradient(135deg,#0369A1,#38BDF8)',
];

export default function SubjectPickerModal({ isAr, allSubjects, mySubjects, onClose, onSaved }: Props) {
  const qc = useQueryClient();
  const overlayRef = useRef<HTMLDivElement>(null);

  const enrolledMap = buildEnrolledMap(mySubjects);
  const [search, setSearch] = useState('');

  // selectedId → Set of chosen level keys
  const [pendingMap, setPendingMap] = useState<Map<number, Set<string>>>(new Map());
  const [saving, setSaving] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  /* ── filter + group ── */
  const q = search.trim().toLowerCase();
  const filtered = allSubjects.filter(sub => {
    if (!q) return true;
    return (sub.name_ar || '').toLowerCase().includes(q)
      || (sub.name_en || '').toLowerCase().includes(q);
  });

  const grouped: Record<string, Subject[]> = {};
  for (const sub of filtered) {
    const cat = isAr
      ? (sub.category?.name_ar || 'أخرى')
      : (sub.category?.name_en || 'Other');
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(sub);
  }

  /* ── toggle subject selection ── */
  function toggleSubject(subId: number) {
    if (enrolledMap.has(subId)) return;
    setPendingMap(prev => {
      const next = new Map(prev);
      if (next.has(subId)) next.delete(subId);
      else next.set(subId, new Set());
      return next;
    });
  }

  /* ── toggle a level within a pending subject ── */
  function toggleLevel(subId: number, levelKey: string) {
    setPendingMap(prev => {
      const next = new Map(prev);
      const levels = new Set(next.get(subId) ?? []);
      if (levels.has(levelKey)) levels.delete(levelKey);
      else levels.add(levelKey);
      next.set(subId, levels);
      return next;
    });
  }

  /* ── select all levels for a subject ── */
  function selectAllLevels(subId: number, subjectLevels: string[]) {
    setPendingMap(prev => {
      const next = new Map(prev);
      const cur = next.get(subId) ?? new Set<string>();
      const allSelected = subjectLevels.every(l => cur.has(l));
      next.set(subId, allSelected ? new Set() : new Set(subjectLevels));
      return next;
    });
  }

  const addMutation = useMutation({
    mutationFn: (data: { subject_id: number; levels: string[] }) => tutorApi.addSubject(data),
  });

  async function handleSave() {
    if (pendingMap.size === 0) { onClose(); return; }
    setSaving(true);
    const entries = Array.from(pendingMap.entries());
    const results = await Promise.allSettled(
      entries.map(([subject_id, levelSet]) =>
        addMutation.mutateAsync({ subject_id, levels: Array.from(levelSet) })
      )
    );
    const ok = new Set<number>();
    results.forEach((r, i) => { if (r.status === 'fulfilled') ok.add(entries[i][0]); });
    setSavedIds(ok);
    await qc.invalidateQueries({ queryKey: ['tutor-subjects'] });
    setSaving(false);
    if (ok.size > 0) {
      onSaved();
      setTimeout(onClose, 600);
    }
  }

  const pendingCount = pendingMap.size;
  const totalSelected = enrolledMap.size + pendingCount;

  /* ── Render a single subject card (used in both enrolled + category sections) ── */
  function renderCard(sub: Subject, catIdx: number, si: number) {
    const enrolled     = enrolledMap.has(sub.id);
    const pending      = pendingMap.has(sub.id);
    const saved        = savedIds.has(sub.id);
    const subLevels    = sub.levels ?? [];
    const chosenSet    = pendingMap.get(sub.id) ?? new Set<string>();
    const enrolledRec  = enrolledMap.get(sub.id);
    const enrolledLevels = enrolledRec?.levels ?? [];

    return (
      <div
        key={sub.id}
        className={`${s.subjectCard} ${enrolled ? s.subjectCardEnrolled : ''} ${pending ? s.subjectCardPending : ''} ${saved ? s.subjectCardSaved : ''}`}
      >
        {/* ── Card top row ── */}
        <div
          className={s.subjectCardTop}
          onClick={() => toggleSubject(sub.id)}
          role="checkbox"
          aria-checked={enrolled || pending}
          tabIndex={enrolled ? -1 : 0}
          onKeyDown={e => { if (!enrolled && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); toggleSubject(sub.id); }}}
        >
          {/* avatar */}
          <div
            className={s.subjectAvatar}
            style={{ background: AVATAR_COLORS[(catIdx * 10 + si) % AVATAR_COLORS.length] }}
          >
            {(isAr ? sub.name_ar : sub.name_en).charAt(0)}
          </div>

          {/* info */}
          <div className={s.subjectInfo}>
            <span className={s.subjectName}>
              {isAr ? sub.name_ar : sub.name_en}
            </span>
            {enrolled && (
              <span className={s.enrolledBadge}>
                {isAr ? '✓ مسجّل' : '✓ Enrolled'}
              </span>
            )}
            {saved && (
              <span className={s.savedBadge}>
                {isAr ? '✓ تمت الإضافة' : '✓ Added'}
              </span>
            )}
            {/* show enrolled levels */}
            {enrolled && enrolledLevels.length > 0 && (
              <div className={s.levelChips}>
                {enrolledLevels.map((lk: string) => {
                  const lInfo = LEVEL_LABELS[lk];
                  return (
                    <span
                      key={lk}
                      className={s.levelChip}
                      style={lInfo ? { background: lInfo.color, color: lInfo.text } : {}}
                    >
                      {levelLabel(lk, isAr)}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* checkmark */}
          <div className={s.subjectCheck}>
            {enrolled ? (
              <span className={s.checkEnrolled}>✓</span>
            ) : pending ? (
              <span className={s.checkPending}>✓</span>
            ) : (
              <span className={s.checkEmpty} />
            )}
          </div>
        </div>

        {/* ── Level picker (visible only when pending) ── */}
        {pending && !enrolled && subLevels.length > 0 && (
          <div className={s.levelPicker} onClick={e => e.stopPropagation()}>
            <div className={s.levelPickerHeader}>
              <span className={s.levelPickerTitle}>
                🎓 {isAr ? 'اختر المستويات التي تدرّسها:' : 'Select levels you teach:'}
              </span>
              <button
                type="button"
                className={s.levelPickerSelectAll}
                onClick={() => selectAllLevels(sub.id, subLevels)}
              >
                {subLevels.every(l => chosenSet.has(l))
                  ? (isAr ? 'إلغاء الكل' : 'Deselect All')
                  : (isAr ? 'اختيار الكل' : 'Select All')}
              </button>
            </div>
            <div className={s.levelGrid}>
              {subLevels.map(lk => {
                const chosen = chosenSet.has(lk);
                const lInfo  = LEVEL_LABELS[lk];
                return (
                  <button
                    key={lk}
                    type="button"
                    className={`${s.levelBtn} ${chosen ? s.levelBtnChosen : ''}`}
                    style={chosen && lInfo ? { background: lInfo.color, color: lInfo.text, borderColor: lInfo.text + '55' } : {}}
                    onClick={() => toggleLevel(sub.id, lk)}
                  >
                    {chosen && <span className={s.levelBtnCheck}>✓</span>}
                    {levelLabel(lk, isAr)}
                  </button>
                );
              })}
            </div>
            {chosenSet.size === 0 && (
              <p className={s.levelHint}>
                {isAr ? '💡 يمكنك الإضافة بدون تحديد مستوى أو اختر واحداً أو أكثر' : '💡 You can add without selecting levels, or pick one or more'}
              </p>
            )}
          </div>
        )}

        {/* No levels defined by admin */}
        {pending && !enrolled && subLevels.length === 0 && (
          <div className={s.levelPicker}>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
              {isAr ? 'ℹ️ لا توجد مستويات محددة لهذه المادة' : 'ℹ️ No levels defined by admin for this subject yet'}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={s.overlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div className={s.modal} role="dialog" aria-modal="true">

        {/* ── Header ── */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            <div className={s.headerIcon}>📚</div>
            <div>
              <h2 className={s.headerTitle}>
                {isAr ? 'اختر المواد التي تدرّسها' : 'Choose Subjects You Teach'}
              </h2>
              <p className={s.headerSub}>
                {isAr
                  ? `لديك ${enrolledMap.size} مادة مسجّلة · اختر مواد إضافية وحدد المستويات`
                  : `You have ${enrolledMap.size} enrolled subject${enrolledMap.size !== 1 ? 's' : ''} · Select more and pick levels`}
              </p>
            </div>
          </div>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* ── Search ── */}
        <div className={s.searchWrap}>
          <span className={s.searchIcon}>🔍</span>
          <input
            className={s.search}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isAr ? 'ابحث عن مادة...' : 'Search subjects...'}
            dir={isAr ? 'rtl' : 'ltr'}
            autoFocus
          />
          {search && (
            <button className={s.searchClear} onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        {/* ── Legend ── */}
        <div className={s.legend}>
          <span className={s.legendItem}>
            <span className={s.legendDotEnrolled} /> {isAr ? 'مسجّل بالفعل' : 'Already enrolled'}
          </span>
          <span className={s.legendItem}>
            <span className={s.legendDotPending} /> {isAr ? 'محدد للإضافة' : 'Selected to add'}
          </span>
          <span className={s.legendItem} style={{ marginInlineStart: 'auto', color: '#9CA3AF' }}>
            {isAr ? 'اختر المستويات بعد الاختيار' : 'Pick levels after selecting a subject'}
          </span>
        </div>

        {/* ── Body ── */}
        <div className={s.body}>
          {/* ══ Enrolled subjects pinned section (shown when teacher has subjects, no active search) ══ */}
          {enrolledMap.size > 0 && !q && (() => {
            // Resolve full subject objects for enrolled subjects
            const enrolledSubs = allSubjects.filter(sub => enrolledMap.has(sub.id));
            if (enrolledSubs.length === 0) return null;
            return (
              <div className={s.catSection}>
                <div className={`${s.catLabel} ${s.catLabelEnrolled}`}>
                  ✓ {isAr ? 'موادك الحالية' : 'Your Enrolled Subjects'} ({enrolledSubs.length})
                </div>
                <div className={s.subjectList}>
                  {enrolledSubs.map((sub, si) => renderCard(sub, 99, si))}
                </div>
              </div>
            );
          })()}

          {/* ══ All subjects grouped by category ══ */}
          {Object.keys(grouped).length === 0 && !q ? null :
            Object.keys(grouped).length === 0 ? (
              <div className={s.empty}>
                <span>🔍</span>
                <p>{isAr ? 'لا توجد مواد بهذا البحث' : 'No subjects found'}</p>
              </div>
            ) : (
              Object.entries(grouped).map(([cat, subs], catIdx) => {
                // When not searching, exclude enrolled subjects (they're shown above)
                const visibleSubs = q ? subs : subs.filter(s => !enrolledMap.has(s.id));
                if (visibleSubs.length === 0) return null;
                return (
                  <div key={cat} className={s.catSection}>
                    <div className={s.catLabel}>{cat}</div>
                    <div className={s.subjectList}>
                      {visibleSubs.map((sub, si) => renderCard(sub, catIdx, si))}
                    </div>
                  </div>
                );
              })
            )
          }
        </div>


        {/* ── Footer ── */}
        <div className={s.footer}>
          <div className={s.footerInfo}>
            {pendingCount > 0 ? (
              <span className={s.footerCount}>
                {isAr ? `+${pendingCount} مادة للإضافة` : `+${pendingCount} subject${pendingCount !== 1 ? 's' : ''} to add`}
              </span>
            ) : (
              <span className={s.footerTotal}>
                {isAr ? `${totalSelected} مادة محددة` : `${totalSelected} subject${totalSelected !== 1 ? 's' : ''} total`}
              </span>
            )}
          </div>
          <div className={s.footerBtns}>
            <button className={s.cancelBtn} onClick={onClose} disabled={saving}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              className={s.saveBtn}
              onClick={handleSave}
              disabled={saving || pendingCount === 0}
            >
              {saving
                ? (isAr ? '⏳ جاري الحفظ...' : '⏳ Saving...')
                : pendingCount > 0
                  ? (isAr ? `حفظ ${pendingCount} مادة` : `Save ${pendingCount} Subject${pendingCount !== 1 ? 's' : ''}`)
                  : (isAr ? 'إغلاق' : 'Close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
