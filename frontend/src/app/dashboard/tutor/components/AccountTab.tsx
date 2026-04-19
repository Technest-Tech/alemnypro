'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { tutorApi } from '@/lib/api';
import Link from 'next/link';
import styles from '../../dashboard.module.css';
import tabStyles from './tabs.module.css';

interface Props { isAr: boolean; }

type SubTab = 'profile' | 'invoices' | 'payments';

const PAYOUT_METHODS = [
  { id: 'vodafone_cash', icon: '📱', nameAr: 'فودافون كاش', nameEn: 'Vodafone Cash', subAr: 'أسرع طريقة للاستلام', subEn: 'Fastest payout method' },
  { id: 'instapay',      icon: '⚡', nameAr: 'إنستاباي',     nameEn: 'InstaPay',       subAr: 'تحويل فوري بين البنوك', subEn: 'Instant bank transfer' },
  { id: 'bank_transfer', icon: '🏦', nameAr: 'تحويل بنكي',  nameEn: 'Bank Transfer',  subAr: '2-3 أيام عمل', subEn: '2-3 business days' },
];

// Mock invoice data built from session financial model
const MOCK_INVOICES = [
  { id: 1, student: 'Ahmed Hassan',   studentAr: 'أحمد حسن',   subject: 'Algebra',   date: '2026-04-10', gross: 200, fee: 30, net: 170, status: 'paid'    },
  { id: 2, student: 'Sara Mohamed',   studentAr: 'سارة محمد',   subject: 'Physics',   date: '2026-04-08', gross: 200, fee: 30, net: 170, status: 'pending' },
  { id: 3, student: 'Omar Ali',       studentAr: 'عمر علي',     subject: 'Chemistry', date: '2026-04-05', gross: 200, fee: 30, net: 170, status: 'paid'    },
  { id: 4, student: 'Lina Khaled',    studentAr: 'لينا خالد',   subject: 'Biology',   date: '2026-04-01', gross: 200, fee: 30, net: 170, status: 'paid'    },
];

export default function AccountTab({ isAr }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('profile');
  const [selectedPayout, setSelectedPayout] = useState('vodafone_cash');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [payoutSaved, setPayoutSaved] = useState(false);
  const [verDocType, setVerDocType] = useState('national_id');
  const [verFile, setVerFile] = useState<File | null>(null);
  const [verSuccess, setVerSuccess] = useState(false);

  const totalGross = MOCK_INVOICES.reduce((a, i) => a + i.gross, 0);
  const totalFees  = MOCK_INVOICES.reduce((a, i) => a + i.fee, 0);
  const totalNet   = MOCK_INVOICES.reduce((a, i) => a + i.net, 0);
  const pendingAmt = MOCK_INVOICES.filter(i => i.status === 'pending').reduce((a, i) => a + i.net, 0);

  const verMutation = useMutation({
    mutationFn: (fd: FormData) => tutorApi.uploadVerification(fd),
    onSuccess: () => { setVerSuccess(true); setVerFile(null); },
  });

  const handleVerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verFile) return;
    const fd = new FormData();
    fd.append('document_type', verDocType);
    fd.append('document', verFile);
    verMutation.mutate(fd);
  };

  const subTabs: Array<{ id: SubTab; label: string; labelAr: string }> = [
    { id: 'profile',  label: '👤 Profile',  labelAr: '👤 الملف الشخصي' },
    { id: 'invoices', label: '🧾 Invoices', labelAr: '🧾 الفواتير'       },
    { id: 'payments', label: '💸 Payments', labelAr: '💸 المدفوعات'      },
  ];

  return (
    <div>
      {/* Sub-tab nav */}
      <div className={tabStyles.subTabsRow}>
        {subTabs.map(t => (
          <button
            key={t.id}
            className={`${tabStyles.subTabBtn} ${subTab === t.id ? tabStyles.subTabBtnActive : ''}`}
            onClick={() => setSubTab(t.id)}
          >
            {isAr ? t.labelAr : t.label}
          </button>
        ))}
      </div>

      {/* ── Profile Sub-Tab ── */}
      {subTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* General Info */}
          <div className={tabStyles.glassCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>👤 {isAr ? 'المعلومات العامة' : 'General Info'}</h2>
            </div>
            <div className={styles.cardBody} style={{ paddingTop: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'name',     labelAr: 'الاسم الكامل',  labelEn: 'Full Name',    placeholder: 'Mohamed Ahmed'      },
                  { key: 'email',    labelAr: 'البريد الإلكتروني', labelEn: 'Email', placeholder: 'name@email.com'       },
                  { key: 'phone',    labelAr: 'رقم الهاتف',    labelEn: 'Phone',        placeholder: '+20 10 xxxx xxxx'   },
                  { key: 'location', labelAr: 'المنطقة',       labelEn: 'Location',     placeholder: 'Cairo, Maadi'       },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 5 }}>
                      {isAr ? f.labelAr : f.labelEn}
                    </label>
                    <input className="input" placeholder={f.placeholder} style={{ width: '100%' }} />
                  </div>
                ))}
                <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 4 }}>
                  {isAr ? '💾 حفظ المعلومات' : '💾 Save Info'}
                </button>
              </div>
            </div>
          </div>

          {/* ID & Diploma Verification (Egypt-specific) */}
          <div className={tabStyles.glassCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>🔒 {isAr ? 'توثيق الهوية والمؤهلات' : 'ID & Credentials'}</h2>
            </div>
            <div className={styles.cardBody} style={{ paddingTop: 16 }}>
              {/* Egypt-specific context banner */}
              <div style={{ background: 'rgba(15,118,110,0.06)', border: '1px solid rgba(15,118,110,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ fontSize: '0.75rem', color: '#0F766E', fontWeight: 600, margin: 0 }}>
                  🇪🇬 {isAr ? 'نقبل: بطاقة الرقم القومي، الشهادات الجامعية، صحيفة الحالة الجنائية' : 'We accept: National ID, University Degrees, Criminal Record Certificate'}
                </p>
              </div>

              {verSuccess ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyEmoji}>🎉</span>
                  <p className={styles.emptyTitle} style={{ color: '#059669' }}>
                    {isAr ? 'تم الرفع بنجاح!' : 'Uploaded successfully!'}
                  </p>
                  <button className="btn btn-outline btn-sm" onClick={() => setVerSuccess(false)}>
                    {isAr ? 'رفع وثيقة أخرى' : 'Upload another'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 5 }}>
                      {isAr ? 'نوع الوثيقة' : 'Document Type'}
                    </label>
                    <select className="input select" value={verDocType} onChange={e => setVerDocType(e.target.value)} style={{ width: '100%' }}>
                      <option value="national_id">{isAr ? 'بطاقة الرقم القومي' : 'National ID'}</option>
                      <option value="university_degree">{isAr ? 'شهادة جامعية' : 'University Degree'}</option>
                      <option value="teaching_certificate">{isAr ? 'شهادة تدريس' : 'Teaching Certificate'}</option>
                      <option value="criminal_record">{isAr ? 'صحيفة الحالة الجنائية' : 'Criminal Record'}</option>
                    </select>
                  </div>
                  <div
                    onClick={() => document.getElementById('ver-file-account')?.click()}
                    style={{
                      border: `2px dashed ${verFile ? '#0F766E' : '#D1D5DB'}`,
                      borderRadius: 12,
                      padding: '20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: verFile ? 'rgba(15,118,110,0.04)' : '#F9FAFB',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input id="ver-file-account" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => setVerFile(e.target.files?.[0] || null)} />
                    <span style={{ fontSize: '1.75rem', display: 'block', marginBottom: 6 }}>{verFile ? '✅' : '📎'}</span>
                    <p style={{ fontSize: 13, fontWeight: 600, color: verFile ? '#059669' : '#374151', margin: 0 }}>
                      {verFile ? verFile.name : (isAr ? 'اضغط لاختيار ملف' : 'Click to select file')}
                    </p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>PDF, JPG, PNG — {isAr ? 'الحد الأقصى 5MB' : 'Max 5MB'}</p>
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={!verFile || verMutation.isPending} style={{ width: '100%' }}>
                    {verMutation.isPending ? (isAr ? 'جاري الرفع...' : 'Uploading...') : (isAr ? '📤 رفع الوثيقة' : '📤 Upload Document')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Invoices Sub-Tab ── */}
      {subTab === 'invoices' && (
        <div>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: isAr ? 'إجمالي الإيرادات' : 'Total Gross',     val: `${totalGross} EGP`,  cls: tabStyles.ledgerGross  },
              { label: isAr ? 'رسوم المنصة (15%)' : 'Platform Fee (15%)', val: `-${totalFees} EGP`, cls: tabStyles.ledgerFee    },
              { label: isAr ? 'صافي المكاسب' : 'Net Earnings',        val: `${totalNet} EGP`,   cls: tabStyles.ledgerNet    },
            ].map(s => (
              <div key={s.label} className={tabStyles.glassStat} style={{ padding: 18 }}>
                <div className={tabStyles.glassStatLabel}>{s.label}</div>
                <div className={`${tabStyles.glassStatValue} ${s.cls}`} style={{ fontSize: '1.5rem' }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Ledger Table */}
          <div className={tabStyles.glassCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>🧾 {isAr ? 'سجل الفواتير' : 'Invoice Ledger'}</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className={tabStyles.ledgerTable}>
                <thead>
                  <tr>
                    <th>{isAr ? 'الطالب' : 'Student'}</th>
                    <th>{isAr ? 'المادة' : 'Subject'}</th>
                    <th>{isAr ? 'التاريخ' : 'Date'}</th>
                    <th>{isAr ? 'الإجمالي' : 'Gross'}</th>
                    <th>{isAr ? 'الرسوم' : 'Fee'}</th>
                    <th>{isAr ? 'الصافي' : 'Net'}</th>
                    <th>{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_INVOICES.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 700 }}>{isAr ? inv.studentAr : inv.student}</td>
                      <td>{inv.subject}</td>
                      <td style={{ color: '#6B7280' }}>{inv.date}</td>
                      <td className={tabStyles.ledgerGross}>{inv.gross} EGP</td>
                      <td className={tabStyles.ledgerFee}>-{inv.fee} EGP</td>
                      <td className={tabStyles.ledgerNet}>{inv.net} EGP</td>
                      <td>
                        <span style={{
                          padding: '2px 10px',
                          borderRadius: 100,
                          fontSize: 11,
                          fontWeight: 700,
                          background: inv.status === 'paid' ? '#D1FAE5' : '#FEF3C7',
                          color: inv.status === 'paid' ? '#059669' : '#92400E',
                        }}>
                          {inv.status === 'paid' ? (isAr ? 'مدفوع ✓' : 'Paid ✓') : (isAr ? 'في الانتظار' : 'Pending')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Payments Sub-Tab ── */}
      {subTab === 'payments' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Payout preferences */}
          <div className={tabStyles.glassCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>💸 {isAr ? 'طريقة الاستلام' : 'Payout Method'}</h2>
            </div>
            <div className={styles.cardBody} style={{ paddingTop: 16 }}>
              <div className={tabStyles.payoutMethods}>
                {PAYOUT_METHODS.map(m => (
                  <div
                    key={m.id}
                    className={`${tabStyles.payoutMethod} ${selectedPayout === m.id ? tabStyles.payoutMethodActive : ''}`}
                    onClick={() => setSelectedPayout(m.id)}
                  >
                    <span className={tabStyles.payoutMethodIcon}>{m.icon}</span>
                    <div>
                      <div className={tabStyles.payoutMethodName}>{isAr ? m.nameAr : m.nameEn}</div>
                      <div className={tabStyles.payoutMethodSub}>{isAr ? m.subAr : m.subEn}</div>
                    </div>
                    {selectedPayout === m.id && (
                      <span className={tabStyles.payoutMethodCheck}>✓</span>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 6 }}>
                  {selectedPayout === 'vodafone_cash' ? (isAr ? 'رقم فودافون' : 'Vodafone Number')
                    : selectedPayout === 'instapay'    ? (isAr ? 'رقم إنستاباي' : 'InstaPay ID')
                    : (isAr ? 'رقم الحساب البنكي / IBAN' : 'Bank Account / IBAN')}
                </label>
                <input
                  className="input"
                  placeholder={selectedPayout === 'vodafone_cash' ? '+20 10 xxxx xxxx' : selectedPayout === 'instapay' ? 'EG000000...' : 'IBAN or Account No.'}
                  value={payoutAccount}
                  onChange={e => setPayoutAccount(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div className={tabStyles.payoutMinNote}>
                ⚠️ {isAr ? 'الحد الأدنى للسحب: 200 ج.م' : 'Minimum payout threshold: 200 EGP'}
              </div>

              <button
                className="btn btn-primary btn-sm"
                style={{ width: '100%', marginTop: 16 }}
                onClick={() => { setPayoutSaved(true); setTimeout(() => setPayoutSaved(false), 2500); }}
              >
                {payoutSaved ? (isAr ? '✅ تم الحفظ!' : '✅ Saved!') : (isAr ? '💾 حفظ طريقة الاستلام' : '💾 Save Payout Method')}
              </button>
            </div>
          </div>

          {/* Pending payout */}
          <div className={tabStyles.glassCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>🏦 {isAr ? 'المستحقات' : 'Pending Payout'}</h2>
            </div>
            <div className={styles.cardBody} style={{ paddingTop: 16 }}>
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#059669', letterSpacing: '-0.04em', marginBottom: 4 }}>
                  {pendingAmt} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#9CA3AF' }}>EGP</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: 20 }}>
                  {isAr ? 'مستحق من الحصص المكتملة' : 'Pending from completed sessions'}
                </p>
                <button
                  className="btn btn-primary btn-lg"
                  disabled={pendingAmt < 200}
                  style={{ width: '100%' }}
                >
                  {pendingAmt < 200
                    ? (isAr ? `اسحب عند 200 ج.م (تحتاج ${200 - pendingAmt} أكثر)` : `Withdraw at 200 EGP (need ${200 - pendingAmt} more)`)
                    : (isAr ? `💸 سحب ${pendingAmt} ج.م` : `💸 Withdraw ${pendingAmt} EGP`)}
                </button>
                <p style={{ fontSize: '0.6875rem', color: '#9CA3AF', marginTop: 12 }}>
                  {isAr ? 'المدفوعات عبر: فودافون كاش / إنستاباي / تحويل بنكي' : 'Via Vodafone Cash · InstaPay · Bank Transfer'}
                </p>
              </div>

              {/* Payment history summary */}
              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                  {isAr ? 'آخر عمليات السحب' : 'Recent Payouts'}
                </div>
                {[
                  { date: '2026-04-01', amount: 510, method: 'Vodafone Cash' },
                  { date: '2026-03-15', amount: 340, method: 'InstaPay' },
                ].map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F9FAFB' }}>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1A1A2E' }}>{p.amount} EGP</div>
                      <div style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>{p.date} · {p.method}</div>
                    </div>
                    <span style={{ background: '#D1FAE5', color: '#059669', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 100 }}>
                      {isAr ? 'تم ✓' : 'Done ✓'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
