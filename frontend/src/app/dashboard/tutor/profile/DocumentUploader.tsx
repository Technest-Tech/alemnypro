'use client';

import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { tutorApi } from '@/lib/api';
import styles from './DocumentUploader.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocType =
  | 'national_id'
  | 'criminal_record'
  | 'certificate';

export type UploadStatus = 'idle' | 'uploading' | 'pending' | 'approved' | 'rejected';

interface Props {
  /** Which doc category — controls allowed types in the selector */
  category: 'identity' | 'diploma';
  /** Current status from the server */
  status?: UploadStatus;
  /** While verification query is still fetching — show skeleton */
  isLoading?: boolean;
  /** Callback fired after a successful upload */
  onUploaded?: (docType: DocType) => void;
  isAr?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const IDENTITY_TYPES: { value: DocType; ar: string; en: string }[] = [
  { value: 'national_id',     ar: 'بطاقة الرقم القومي',    en: 'National ID'     },
  { value: 'criminal_record', ar: 'صحيفة الحالة الجنائية', en: 'Criminal Record'  },
];

const DIPLOMA_TYPES: { value: DocType; ar: string; en: string }[] = [
  { value: 'certificate', ar: 'شهادة / دبلوم', en: 'Certificate / Diploma' },
];

function statusMeta(s: UploadStatus, isAr: boolean) {
  switch (s) {
    case 'approved': return { icon: '✅', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', text: isAr ? 'تمت الموافقة' : 'Approved' };
    case 'pending':  return { icon: '⏳', color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', text: isAr ? 'قيد المراجعة' : 'Under Review' };
    case 'rejected': return { icon: '❌', color: '#991B1B', bg: '#FEF2F2', border: '#FCA5A5', text: isAr ? 'مرفوضة — أعد الرفع' : 'Rejected — Upload again' };
    default:         return null;
  }
}

function isImage(file: File) {
  return file.type.startsWith('image/');
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DocumentUploader({ category, status, isLoading = false, onUploaded, isAr = false }: Props) {
  const [open, setOpen]             = useState(false);
  const [docType, setDocType]       = useState<DocType>(category === 'identity' ? 'national_id' : 'certificate');
  const [file, setFile]             = useState<File | null>(null);
  const [preview, setPreview]       = useState<string | null>(null);
  const [dragging, setDragging]     = useState(false);
  const [progress, setProgress]     = useState(0);
  const [uploading, setUploading]   = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [error, setError]           = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const types = category === 'identity' ? IDENTITY_TYPES : DIPLOMA_TYPES;
  const meta  = statusMeta(status ?? 'idle', isAr);

  // ──────────────────────────────────────────────────────────────────

  function pickFile(f: File) {
    setFile(f);
    setError('');
    setUploadDone(false);
    setProgress(0);
    if (isImage(f)) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) pickFile(f);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }, []);

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); setDragging(true); }
  function handleDragLeave()                    { setDragging(false); }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError('');
    setProgress(10);

    const fd = new FormData();
    fd.append('type', docType);          // backend expects 'type'
    fd.append('file', file);             // backend expects 'file'

    // Fake progress animation while uploading
    const ticker = setInterval(() => {
      setProgress(p => (p < 85 ? p + 8 : p));
    }, 200);

    try {
      await tutorApi.uploadVerification(fd);
      clearInterval(ticker);
      setProgress(100);
      setUploadDone(true);
      onUploaded?.(docType);
      setTimeout(() => setOpen(false), 1800);
    } catch (err: unknown) {
      clearInterval(ticker);
      setProgress(0);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || (isAr ? 'فشل الرفع، حاول مجدداً' : 'Upload failed, please try again'));
    } finally {
      setUploading(false);
    }
  }

  function closeModal() {
    setOpen(false);
    setFile(null);
    setPreview(null);
    setProgress(0);
    setError('');
    setUploadDone(false);
  }

  // ── Status Banner (when we have server status) ────────────────────

  const StatusBanner = meta ? (
    <div className={styles.statusBanner} style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}>
      <span className={styles.statusIcon}>{meta.icon}</span>
      <div>
        <p className={styles.statusText}>{meta.text}</p>
        {status === 'pending' && (
          <p className={styles.statusSub}>
            {isAr ? 'سيقوم فريقنا بالمراجعة خلال 24-48 ساعة' : 'Our team will review within 24–48 hours'}
          </p>
        )}
        {status === 'rejected' && (
          <p className={styles.statusSub}>
            {isAr ? 'يرجى رفع وثيقة أوضح أو مختلفة' : 'Please upload a clearer or different document'}
          </p>
        )}
      </div>
    </div>
  ) : null;

  // ── Loading skeleton (query still in-flight) ────────────────────

  if (isLoading) {
    return (
      <div className={styles.uploaderRoot}>
        <div className={styles.skeletonRing} />
        <div className={styles.skeletonLine} style={{ width: '70%' }} />
        <div className={styles.skeletonLine} style={{ width: '50%' }} />
        <div className={styles.skeletonBtn} />
      </div>
    );
  }

  // ── Verified state ────────────────────────────────────────────────

  if (status === 'approved') {
    return (
      <div className={styles.verifiedState}>
        <div className={styles.verifiedIconRing}>
          <span className={styles.verifiedEmoji}>
            {category === 'identity' ? '🪪' : '🎓'}
          </span>
          <span className={styles.verifiedCheck}>✓</span>
        </div>
        {StatusBanner}
        <button type="button" className={styles.reuploadBtn} onClick={() => setOpen(true)}>
          🔄 {isAr ? 'تحديث الوثيقة' : 'Update Document'}
        </button>
      </div>
    );
  }

  // ── Default (needs upload / pending / rejected) ───────────────────

  return (
    <>
      <div className={styles.uploaderRoot}>
        {/* Illustration */}
        <div className={styles.illustration}>
          <div className={styles.illustrationRing}>
            <span className={styles.illustrationEmoji}>
              {category === 'identity' ? '🪪' : '📄'}
            </span>
          </div>
        </div>

        {StatusBanner}

        {!meta && (
          <p className={styles.hint}>
            {category === 'identity'
              ? (isAr ? 'برهن على هويتك بتحميل وثيقة رسمية' : 'Prove your identity by uploading an official document')
              : (isAr ? 'ارفع شهادتك الأكاديمية لزيادة مصداقيتك' : 'Upload your degree to boost your credibility')}
          </p>
        )}

        <button
          type="button"
          className={status === 'pending' ? styles.pendingBtn : styles.openBtn}
          onClick={() => setOpen(true)}
          disabled={status === 'pending'}
        >
          {status === 'pending'
            ? (isAr ? '⏳ قيد المراجعة' : '⏳ Under Review')
            : `📤 ${isAr ? (category === 'identity' ? 'رفع وثيقة الهوية' : 'رفع الشهادة') : (category === 'identity' ? 'Upload ID Document' : 'Upload Diploma')}`}
        </button>

        <p className={styles.acceptedFormats}>
          {isAr ? 'نقبل: JPG، PNG، PDF — الحد الأقصى 5MB' : 'Accepted: JPG, PNG, PDF — Max 5MB'}
        </p>
      </div>

      {/* ── Upload Modal ── */}
      {open && typeof window !== 'undefined' && createPortal(
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className={styles.modal}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {category === 'identity'
                  ? (isAr ? '🪪 رفع وثيقة الهوية' : '🪪 Upload ID Document')
                  : (isAr ? '🎓 رفع الشهادة الأكاديمية' : '🎓 Upload Academic Diploma')}
              </h3>
              <button type="button" className={styles.modalClose} onClick={closeModal}>✕</button>
            </div>

            <div className={styles.modalBody}>

              {/* Success state */}
              {uploadDone ? (
                <div className={styles.successState}>
                  <div className={styles.successIcon}>🎉</div>
                  <h4 className={styles.successTitle}>{isAr ? 'تم الرفع بنجاح!' : 'Uploaded Successfully!'}</h4>
                  <p className={styles.successSub}>
                    {isAr ? 'سيقوم فريقنا بالمراجعة خلال 24-48 ساعة.' : 'Our team will review it within 24–48 hours.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Doc type selector */}
                  <div className={styles.typeRow}>
                    {types.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        className={`${styles.typeChip} ${docType === t.value ? styles.typeChipActive : ''}`}
                        onClick={() => setDocType(t.value)}
                      >
                        {isAr ? t.ar : t.en}
                      </button>
                    ))}
                  </div>

                  {/* Drop zone */}
                  <div
                    className={`${styles.dropzone} ${dragging ? styles.dropzoneDragging : ''} ${file ? styles.dropzoneHasFile : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !file && inputRef.current?.click()}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,.pdf"
                      style={{ display: 'none' }}
                      onChange={handleInputChange}
                    />

                    {file ? (
                      <div className={styles.filePreview}>
                        {preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={preview} alt="preview" className={styles.imagePreview} />
                        ) : (
                          <div className={styles.pdfPreview}>
                            <span className={styles.pdfIcon}>📄</span>
                            <span className={styles.pdfName}>{file.name}</span>
                            <span className={styles.pdfSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        )}
                        <button
                          type="button"
                          className={styles.removeFile}
                          onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); }}
                        >
                          ✕ {isAr ? 'إزالة' : 'Remove'}
                        </button>
                      </div>
                    ) : (
                      <div className={styles.dropzoneEmpty}>
                        <span className={styles.dropzoneIcon}>📎</span>
                        <p className={styles.dropzoneTitle}>
                          {isAr ? 'اسحب الملف هنا أو اضغط للاختيار' : 'Drag & drop or click to browse'}
                        </p>
                        <p className={styles.dropzoneSub}>JPG, PNG, PDF — max 5 MB</p>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {uploading && (
                    <div className={styles.progressWrap}>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                      </div>
                      <span className={styles.progressLabel}>{progress}%</span>
                    </div>
                  )}

                  {/* Error */}
                  {error && <p className={styles.error}>{error}</p>}

                  {/* Action buttons */}
                  <div className={styles.actions}>
                    <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      className={styles.uploadBtn}
                      onClick={handleUpload}
                      disabled={!file || uploading}
                    >
                      {uploading
                        ? (isAr ? '⏳ جاري الرفع...' : '⏳ Uploading...')
                        : (isAr ? '📤 رفع الوثيقة' : '📤 Upload Document')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
