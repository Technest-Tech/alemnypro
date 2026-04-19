'use client';

import { useState, useMemo } from 'react';
import { useLocale } from '@/lib/locale';
import DashboardLayout from '@/components/layout/DashboardLayout';
import styles from '../../dashboard.module.css';
import tabStyles from '../components/tabs.module.css';
import billingStyles from './billing.module.css';

/* ─── Mock data ─────────────────────────────────────────────────────── */
const ALL_INVOICES = [
  { id: 'INV-001', student: 'Ahmed Hassan',   studentAr: 'أحمد حسن',   subject: 'Algebra',   date: '2026-04-10', gross: 200, fee: 30, net: 170, status: 'paid'    },
  { id: 'INV-002', student: 'Sara Mohamed',   studentAr: 'سارة محمد',   subject: 'Physics',   date: '2026-04-08', gross: 250, fee: 37, net: 213, status: 'pending' },
  { id: 'INV-003', student: 'Omar Ali',       studentAr: 'عمر علي',     subject: 'Chemistry', date: '2026-04-05', gross: 200, fee: 30, net: 170, status: 'paid'    },
  { id: 'INV-004', student: 'Lina Khaled',    studentAr: 'لينا خالد',   subject: 'Biology',   date: '2026-04-01', gross: 200, fee: 30, net: 170, status: 'paid'    },
  { id: 'INV-005', student: 'Youssef Nasser', studentAr: 'يوسف ناصر',  subject: 'Math',      date: '2026-03-28', gross: 300, fee: 45, net: 255, status: 'paid'    },
  { id: 'INV-006', student: 'Nour Samir',     studentAr: 'نور سمير',    subject: 'Physics',   date: '2026-03-22', gross: 200, fee: 30, net: 170, status: 'refunded' },
  { id: 'INV-007', student: 'Ahmed Hassan',   studentAr: 'أحمد حسن',   subject: 'Algebra',   date: '2026-03-15', gross: 200, fee: 30, net: 170, status: 'paid'    },
  { id: 'INV-008', student: 'Sara Mohamed',   studentAr: 'سارة محمد',   subject: 'Physics',   date: '2026-03-10', gross: 250, fee: 37, net: 213, status: 'pending' },
];

const SPARK = [120, 200, 170, 240, 300, 210, 255]; // weekly net earnings

type StatusFilter = 'all' | 'paid' | 'pending' | 'refunded';
type SortKey = 'date' | 'gross' | 'net' | 'student';

const STATUS_META: Record<string, { bg: string; color: string; labelEn: string; labelAr: string }> = {
  paid:     { bg: '#D1FAE5', color: '#059669', labelEn: 'Paid ✓',    labelAr: 'مدفوع ✓'       },
  pending:  { bg: '#FEF3C7', color: '#92400E', labelEn: 'Pending',   labelAr: 'في الانتظار'    },
  refunded: { bg: '#FEE2E2', color: '#B91C1C', labelEn: 'Refunded',  labelAr: 'مُستردّ'         },
};

/* ─── Component ─────────────────────────────────────────────────────── */
export default function BillingPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState<StatusFilter>('all');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [sortKey,    setSortKey]    = useState<SortKey>('date');
  const [sortAsc,    setSortAsc]    = useState(false);
  const [exported,   setExported]   = useState(false);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  /* ── Filtered + sorted invoices ── */
  const filtered = useMemo(() => {
    let rows = ALL_INVOICES.filter(inv => {
      const name = isAr ? inv.studentAr : inv.student;
      const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || inv.subject.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = status === 'all' || inv.status === status;
      const matchFrom   = !dateFrom || inv.date >= dateFrom;
      const matchTo     = !dateTo   || inv.date <= dateTo;
      return matchSearch && matchStatus && matchFrom && matchTo;
    });

    rows = [...rows].sort((a, b) => {
      let diff = 0;
      if (sortKey === 'date')    diff = a.date.localeCompare(b.date);
      if (sortKey === 'gross')   diff = a.gross - b.gross;
      if (sortKey === 'net')     diff = a.net - b.net;
      if (sortKey === 'student') diff = a.student.localeCompare(b.student);
      return sortAsc ? diff : -diff;
    });
    return rows;
  }, [search, status, dateFrom, dateTo, sortKey, sortAsc, isAr]);

  /* ── Summary stats ── */
  const totalGross   = filtered.reduce((a, i) => a + i.gross, 0);
  const totalFees    = filtered.reduce((a, i) => a + i.fee,   0);
  const totalNet     = filtered.reduce((a, i) => a + i.net,   0);
  const pendingAmt   = filtered.filter(i => i.status === 'pending').reduce((a, i) => a + i.net, 0);
  const refundedAmt  = filtered.filter(i => i.status === 'refunded').reduce((a, i) => a + i.gross, 0);

  const sparkMax = Math.max(...SPARK);

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? <span style={{ color: '#0F766E' }}>{sortAsc ? ' ▲' : ' ▼'}</span> : <span style={{ opacity: 0.3 }}> ⇅</span>;

  return (
    <DashboardLayout role="tutor">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className={billingStyles.pageHeader}>
        <div>
          <h1 className={billingStyles.pageTitle}>
            🧾 {isAr ? 'الفواتير' : 'Billing'}
          </h1>
          <p className={billingStyles.pageSubtitle}>
            {isAr ? 'تتبّع إيراداتك وفواتيرك بالتفصيل' : 'Track your earnings and invoice history in detail'}
          </p>
        </div>
        <button
          className={billingStyles.exportBtn}
          onClick={() => { setExported(true); setTimeout(() => setExported(false), 2000); }}
        >
          {exported ? (isAr ? '✅ تم التصدير!' : '✅ Exported!') : (isAr ? '⬇ تصدير CSV' : '⬇ Export CSV')}
        </button>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────── */}
      <div className={billingStyles.statsGrid}>

        {/* Net earnings + sparkline */}
        <div className={`${billingStyles.statCard} ${billingStyles.statCardAccent}`}>
          <div className={billingStyles.statIcon} style={{ background: 'rgba(5,150,105,0.12)' }}>💰</div>
          <div className={billingStyles.statBody}>
            <div className={billingStyles.statLabel}>{isAr ? 'صافي المكاسب' : 'Net Earnings'}</div>
            <div className={billingStyles.statValue} style={{ color: '#059669' }}>{totalNet.toLocaleString()} EGP</div>
            <div className={billingStyles.statSub}>{isAr ? `${filtered.length} فاتورة` : `${filtered.length} invoices`}</div>
          </div>
          {/* Sparkline */}
          <div className={tabStyles.sparklineWrap}>
            {SPARK.map((v, i) => (
              <div key={i} className={tabStyles.sparklineBar} style={{ height: `${(v / sparkMax) * 100}%`, background: 'rgba(5,150,105,0.4)', borderRadius: 3 }} />
            ))}
          </div>
        </div>

        <div className={billingStyles.statCard}>
          <div className={billingStyles.statIcon} style={{ background: 'rgba(37,99,235,0.1)' }}>📈</div>
          <div className={billingStyles.statBody}>
            <div className={billingStyles.statLabel}>{isAr ? 'إجمالي الإيرادات' : 'Total Gross'}</div>
            <div className={billingStyles.statValue}>{totalGross.toLocaleString()} EGP</div>
            <div className={billingStyles.statSub} style={{ color: '#E11D48' }}>−{totalFees} {isAr ? 'رسوم المنصة' : 'platform fee'}</div>
          </div>
        </div>

        <div className={billingStyles.statCard}>
          <div className={billingStyles.statIcon} style={{ background: 'rgba(245,158,11,0.12)' }}>⏳</div>
          <div className={billingStyles.statBody}>
            <div className={billingStyles.statLabel}>{isAr ? 'في الانتظار' : 'Pending'}</div>
            <div className={billingStyles.statValue} style={{ color: '#D97706' }}>{pendingAmt} EGP</div>
            <div className={billingStyles.statSub}>{filtered.filter(i => i.status === 'pending').length} {isAr ? 'فاتورة' : 'invoices'}</div>
          </div>
        </div>

        <div className={billingStyles.statCard}>
          <div className={billingStyles.statIcon} style={{ background: 'rgba(220,38,38,0.08)' }}>↩️</div>
          <div className={billingStyles.statBody}>
            <div className={billingStyles.statLabel}>{isAr ? 'المستردات' : 'Refunded'}</div>
            <div className={billingStyles.statValue} style={{ color: '#DC2626' }}>{refundedAmt} EGP</div>
            <div className={billingStyles.statSub}>{filtered.filter(i => i.status === 'refunded').length} {isAr ? 'فاتورة' : 'invoices'}</div>
          </div>
        </div>
      </div>

      {/* ── Filters bar ─────────────────────────────────────────────── */}
      <div className={billingStyles.filtersBar}>

        {/* Search */}
        <div className={billingStyles.searchWrap}>
          <span className={billingStyles.searchIcon}>🔍</span>
          <input
            className={billingStyles.searchInput}
            placeholder={isAr ? 'ابحث باسم الطالب، المادة، أو رقم الفاتورة…' : 'Search by student, subject, or invoice ID…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={billingStyles.searchClear} onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        {/* Status pills */}
        <div className={billingStyles.statusPills}>
          {(['all', 'paid', 'pending', 'refunded'] as StatusFilter[]).map(s => (
            <button
              key={s}
              className={`${billingStyles.statusPill} ${status === s ? billingStyles.statusPillActive : ''}`}
              onClick={() => setStatus(s)}
            >
              {s === 'all'      ? (isAr ? 'الكل' : 'All')
               : s === 'paid'     ? (isAr ? '✓ مدفوع' : '✓ Paid')
               : s === 'pending'  ? (isAr ? '⏳ انتظار' : '⏳ Pending')
               : (isAr ? '↩ مستردّ' : '↩ Refunded')}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className={billingStyles.dateRange}>
          <input
            type="date"
            className={billingStyles.dateInput}
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            title={isAr ? 'من تاريخ' : 'From date'}
          />
          <span className={billingStyles.dateSep}>→</span>
          <input
            type="date"
            className={billingStyles.dateInput}
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            title={isAr ? 'إلى تاريخ' : 'To date'}
          />
          {(dateFrom || dateTo) && (
            <button className={billingStyles.dateReset} onClick={() => { setDateFrom(''); setDateTo(''); }}>
              {isAr ? 'مسح' : 'Clear'}
            </button>
          )}
        </div>
      </div>

      {/* ── Invoice table ────────────────────────────────────────────── */}
      <div className={`${tabStyles.glassCard} ${billingStyles.tableCard}`}>
        <div className={billingStyles.tableHeader}>
          <h2 className={styles.cardTitle}>📋 {isAr ? 'سجل الفواتير' : 'Invoice Ledger'}</h2>
          <span className={billingStyles.tableCount}>
            {filtered.length} {isAr ? 'نتيجة' : 'results'}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className={billingStyles.emptyState}>
            <div className={billingStyles.emptyEmoji}>🔍</div>
            <div className={billingStyles.emptyTitle}>{isAr ? 'لم يتم العثور على فواتير' : 'No invoices found'}</div>
            <div className={billingStyles.emptySubtitle}>{isAr ? 'جرّب تعديل الفلاتر أو البحث' : 'Try adjusting your filters or search'}</div>
            <button className={billingStyles.emptyReset} onClick={() => { setSearch(''); setStatus('all'); setDateFrom(''); setDateTo(''); }}>
              {isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={`${tabStyles.ledgerTable} ${billingStyles.table}`}>
              <thead>
                <tr>
                  <th>{isAr ? 'رقم الفاتورة' : 'Invoice #'}</th>
                  <th className={billingStyles.sortable} onClick={() => toggleSort('student')}>
                    {isAr ? 'الطالب' : 'Student'}<SortIcon k="student" />
                  </th>
                  <th>{isAr ? 'المادة' : 'Subject'}</th>
                  <th className={billingStyles.sortable} onClick={() => toggleSort('date')}>
                    {isAr ? 'التاريخ' : 'Date'}<SortIcon k="date" />
                  </th>
                  <th className={billingStyles.sortable} onClick={() => toggleSort('gross')}>
                    {isAr ? 'الإجمالي' : 'Gross'}<SortIcon k="gross" />
                  </th>
                  <th>{isAr ? 'الرسوم (15%)' : 'Fee (15%)'}</th>
                  <th className={billingStyles.sortable} onClick={() => toggleSort('net')}>
                    {isAr ? 'الصافي' : 'Net'}<SortIcon k="net" />
                  </th>
                  <th>{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const meta = STATUS_META[inv.status];
                  return (
                    <tr key={inv.id}>
                      <td>
                        <span className={billingStyles.invoiceId}>{inv.id}</span>
                      </td>
                      <td>
                        <div className={billingStyles.studentCell}>
                          <div className={billingStyles.studentAvatar}>
                            {(isAr ? inv.studentAr : inv.student).charAt(0)}
                          </div>
                          <span style={{ fontWeight: 700 }}>{isAr ? inv.studentAr : inv.student}</span>
                        </div>
                      </td>
                      <td>
                        <span className={billingStyles.subjectTag}>{inv.subject}</span>
                      </td>
                      <td style={{ color: '#6B7280', fontSize: '0.8125rem' }}>{inv.date}</td>
                      <td className={tabStyles.ledgerGross}>{inv.gross} EGP</td>
                      <td className={tabStyles.ledgerFee}>−{inv.fee} EGP</td>
                      <td className={tabStyles.ledgerNet}>{inv.net} EGP</td>
                      <td>
                        <span className={billingStyles.statusBadge} style={{ background: meta.bg, color: meta.color }}>
                          {isAr ? meta.labelAr : meta.labelEn}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer totals */}
              <tfoot>
                <tr className={billingStyles.totalsRow}>
                  <td colSpan={4} style={{ fontWeight: 800, color: '#1A1A2E', fontSize: '0.8125rem' }}>
                    {isAr ? `الإجمالي (${filtered.length} فاتورة)` : `Totals (${filtered.length} invoices)`}
                  </td>
                  <td className={tabStyles.ledgerGross}>{totalGross.toLocaleString()} EGP</td>
                  <td className={tabStyles.ledgerFee}>−{totalFees} EGP</td>
                  <td className={tabStyles.ledgerNet}>{totalNet.toLocaleString()} EGP</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
