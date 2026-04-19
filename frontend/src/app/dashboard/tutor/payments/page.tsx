'use client';

import { useState } from 'react';
import { useLocale } from '@/lib/locale';
import DashboardLayout from '@/components/layout/DashboardLayout';
import styles from '../../dashboard.module.css';
import tabStyles from '../components/tabs.module.css';

const PAYOUT_METHODS = [
  { id: 'vodafone_cash', icon: '📱', nameAr: 'فودافون كاش', nameEn: 'Vodafone Cash', subAr: 'أسرع طريقة للاستلام',      subEn: 'Fastest payout method'    },
  { id: 'instapay',      icon: '⚡', nameAr: 'إنستاباي',     nameEn: 'InstaPay',       subAr: 'تحويل فوري بين البنوك',   subEn: 'Instant bank transfer'    },
  { id: 'bank_transfer', icon: '🏦', nameAr: 'تحويل بنكي',  nameEn: 'Bank Transfer',  subAr: '2-3 أيام عمل',            subEn: '2-3 business days'        },
];

const PENDING_AMT = 170; // EGP — from a pending session

const RECENT_PAYOUTS = [
  { date: '2026-04-01', amount: 510, method: 'Vodafone Cash' },
  { date: '2026-03-15', amount: 340, method: 'InstaPay'      },
];

export default function PaymentsPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const [selectedPayout, setSelectedPayout] = useState('vodafone_cash');
  const [payoutAccount, setPayoutAccount]   = useState('');
  const [payoutSaved, setPayoutSaved]       = useState(false);

  return (
    <DashboardLayout role="tutor">
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1A1A2E', letterSpacing: '-0.02em' }}>
          💸 {isAr ? 'المدفوعات' : 'Payments'}
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: 4 }}>
          {isAr ? 'أدر طرق الاستلام واسحب أرباحك' : 'Manage your payout methods and withdraw your earnings'}
        </p>
      </div>

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
                  : selectedPayout === 'instapay'   ? (isAr ? 'رقم إنستاباي' : 'InstaPay ID')
                  : (isAr ? 'رقم الحساب البنكي / IBAN' : 'Bank Account / IBAN')}
              </label>
              <input
                className="input"
                placeholder={
                  selectedPayout === 'vodafone_cash' ? '+20 10 xxxx xxxx'
                  : selectedPayout === 'instapay'    ? 'EG000000...'
                  : 'IBAN or Account No.'
                }
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
              {payoutSaved
                ? (isAr ? '✅ تم الحفظ!' : '✅ Saved!')
                : (isAr ? '💾 حفظ طريقة الاستلام' : '💾 Save Payout Method')}
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
                {PENDING_AMT} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#9CA3AF' }}>EGP</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: 20 }}>
                {isAr ? 'مستحق من الحصص المكتملة' : 'Pending from completed sessions'}
              </p>
              <button
                className="btn btn-primary btn-lg"
                disabled={PENDING_AMT < 200}
                style={{ width: '100%' }}
              >
                {PENDING_AMT < 200
                  ? (isAr ? `اسحب عند 200 ج.م (تحتاج ${200 - PENDING_AMT} أكثر)` : `Withdraw at 200 EGP (need ${200 - PENDING_AMT} more)`)
                  : (isAr ? `💸 سحب ${PENDING_AMT} ج.م` : `💸 Withdraw ${PENDING_AMT} EGP`)}
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
              {RECENT_PAYOUTS.map((p, i) => (
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
    </DashboardLayout>
  );
}
