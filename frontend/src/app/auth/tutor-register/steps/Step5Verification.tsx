'use client';

import { useState, useRef, useCallback } from 'react';
import { onboardingApi } from '@/lib/api';
import styles from '../tutor-register.module.css';

interface Props {
  locale: 'ar' | 'en';
  onNext: () => void;
  onBack: () => void;
  uploadedDocs?: { type: string; status: string; original_filename: string }[];
}

const REQUIRED_DOCS = [
  {
    id: 'national_id_front',
    icon: '🪪',
    labelAr: 'الهوية القومية — الوجه الأمامي',
    labelEn: 'National ID — Front Side',
    required: true,
  },
  {
    id: 'national_id_back',
    icon: '🪪',
    labelAr: 'الهوية القومية — الوجه الخلفي',
    labelEn: 'National ID — Back Side',
    required: true,
  },
  {
    id: 'criminal_record',
    icon: '📜',
    labelAr: 'فيش وتشبيه (شهادة حسن السيرة)',
    labelEn: 'Criminal Record Certificate',
    required: true,
  },
  {
    id: 'university_degree',
    icon: '🎓',
    labelAr: 'شهادة جامعية أو مؤهل علمي (اختياري)',
    labelEn: 'University Degree or Qualification (Optional)',
    required: false,
  },
];

type FileMap = Partial<Record<string, { file: File; preview: string }>>;

export default function Step5Verification({ locale, onNext, onBack, uploadedDocs = [] }: Props) {
  const [files, setFiles]       = useState<FileMap>({});
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError]       = useState('');
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const isAr = locale === 'ar';

  // A doc is "satisfied" if a new file was picked OR it was already uploaded to backend
  const isDocSatisfied = (docId: string) =>
    !!files[docId] || uploadedDocs.some(d => d.type === docId);

  const requiredDone = REQUIRED_DOCS.filter(d => d.required).every(d => isDocSatisfied(d.id));
  const canNext = requiredDone;

  // If all required docs are already uploaded and no new files selected, skip re-upload
  const allAlreadyUploaded = REQUIRED_DOCS.filter(d => d.required).every(d => uploadedDocs.some(u => u.type === d.id));

  const handleFileChange = useCallback((docId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError(isAr ? 'حجم الملف يتجاوز 5MB' : 'File size exceeds 5MB');
      return;
    }
    const preview = URL.createObjectURL(file);
    setFiles(prev => ({ ...prev, [docId]: { file, preview } }));
    setError('');
  }, [isAr]);

  const handleDrop = useCallback((docId: string, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(docId, file);
  }, [handleFileChange]);

  const handleNext = async () => {
    if (!canNext || loading) return;

    // If all docs already on server and no new files selected, skip upload
    const newFiles = REQUIRED_DOCS.filter(d => !!files[d.id]);
    if (allAlreadyUploaded && newFiles.length === 0) {
      onNext();
      return;
    }

    setLoading(true);
    setError('');
    const formData = new FormData();
    REQUIRED_DOCS.forEach(doc => {
      const f = files[doc.id];
      if (f) formData.append(doc.id, f.file);
      // For already-uploaded required docs with no new file, we still need them
      // so skip — backend already has them, only send new ones
    });
    try {
      await onboardingApi.saveStep5(formData);
      onNext();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || (isAr ? 'خطأ في الرفع' : 'Upload error'));
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHero}>
        <span className={styles.stepEmoji}>🔒</span>
        <h1 className={styles.cardTitle}>
          {isAr ? <>التوثيق <span className={styles.accentText}>والتحقق</span></> : <>Trust & <span className={styles.accentText}>Verification</span></>}
        </h1>
        <p className={styles.cardSubtitle}>
          {isAr ? 'أمانك أولويتنا' : "Your safety is our priority."}
        </p>
      </div>

      <div className={styles.infoBox}>
        <span>🛡️</span>
        <div>
          <strong>{isAr ? 'لماذا نحتاج هذه الوثائق؟' : 'Why do we need these documents?'}</strong>
          <p>{isAr
            ? 'وثائقك مشفرة ومخزنة بشكل آمن. فقط مشرفو AlemnyPro يمكنهم الوصول إليها لمراجعة حساب "موثق".'
            : "Your documents are encrypted and stored securely. Only AlemnyPro admin reviewers can access them to grant you the 'Verified' badge."}</p>
        </div>
      </div>

      <div className={styles.docsList}>
        {REQUIRED_DOCS.map(doc => {
          const uploaded = files[doc.id];
          return (
            <div
              key={doc.id}
              className={`${styles.docUpload} ${uploaded ? styles.docUploaded : ''}`}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(doc.id, e)}
            >
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className={styles.hiddenFileInput}
                ref={el => { fileRefs.current[doc.id] = el; }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFileChange(doc.id, f);
                }}
                id={`file-${doc.id}`}
              />

              {uploaded ? (
                <div className={styles.docPreview}>
                  {uploaded.file.type.startsWith('image/') ? (
                    <img src={uploaded.preview} alt="preview" className={styles.docThumb} />
                  ) : (
                    <span className={styles.docPdfIcon}>📄</span>
                  )}
                  <div className={styles.docInfo}>
                    <span className={styles.docName}>{uploaded.file.name}</span>
                    <span className={styles.docSize}>
                      {(uploaded.file.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button
                    className={styles.docRemove}
                    onClick={() => setFiles(prev => { const n = { ...prev }; delete n[doc.id]; return n; })}
                  >
                    ✕
                  </button>
                </div>
              ) : (() => {
                // Check if already uploaded to server
                const serverDoc = uploadedDocs.find(d => d.type === doc.id);
                if (serverDoc) {
                  return (
                    <div className={styles.docPreview}>
                      <span className={styles.docPdfIcon}>✅</span>
                      <div className={styles.docInfo}>
                        <span className={styles.docName}>{serverDoc.original_filename}</span>
                        <span className={styles.docSize} style={{ color: 'var(--success)' }}>
                          {isAr ? 'تم الرفع مسبقاً' : 'Already uploaded'}
                        </span>
                      </div>
                      <label htmlFor={`file-${doc.id}`} style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'underline' }}>
                        {isAr ? 'استبدال' : 'Replace'}
                      </label>
                    </div>
                  );
                }
                return (
                  <label htmlFor={`file-${doc.id}`} className={styles.docLabel}>
                    <span className={styles.docIcon}>{doc.icon}</span>
                    <div>
                      <strong>{isAr ? doc.labelAr : doc.labelEn}</strong>
                      <p className={styles.docHint}>
                        {isAr
                          ? 'اسحب الملف هنا أو انقر للاختيار (JPG, PNG, PDF — max 5MB)'
                          : 'Drag file here or click to choose (JPG, PNG, PDF — max 5MB)'}
                      </p>
                    </div>
                    {!doc.required && (
                      <span className={styles.optionalBadge}>{isAr ? 'اختياري' : 'Optional'}</span>
                    )}
                  </label>
                );
              })()}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className={styles.uploadProgress}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }} />
          <span>{isAr ? 'جاري الرفع...' : 'Uploading...'}</span>
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
