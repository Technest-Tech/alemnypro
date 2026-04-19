'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { adminApi } from '@/lib/api';
import Link from 'next/link';
import styles from './admin.module.css';
import dash from './dashboard-analytics.module.css';
import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function trendPct(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function TrendBadge({ curr, prev }: { curr: number; prev: number }) {
  const pct = trendPct(curr, prev);
  const up  = pct >= 0;
  return (
    <span className={`${dash.trend} ${up ? dash.trendUp : dash.trendDown}`}>
      {up ? '↑' : '↓'} {Math.abs(pct)}%
    </span>
  );
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1)     + 'K';
  return n.toLocaleString();
}

function EGP(n: number) {
  return n.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' EGP';
}

/* Custom tooltip for recharts */
const ChartTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: {name:string; value:number; color:string}[]; label?: string
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={dash.chartTooltip}>
      <p className={dash.chartTooltipLabel}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0', fontSize: 13 }}>
          {p.name}: <strong>{typeof p.value === 'number' && p.value > 100 ? EGP(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MOCK chart fallback (shown when backend has no data)
───────────────────────────────────────────── */
function genMockChart() {
  const months = ['Mar 08','Mar 09','Mar 10','Mar 11','Mar 12','Mar 13','Mar 14',
    'Mar 15','Mar 16','Mar 17','Mar 18','Mar 19','Mar 20','Mar 21',
    'Mar 22','Mar 23','Mar 24','Mar 25','Mar 26','Mar 27','Mar 28',
    'Mar 29','Mar 30','Mar 31','Apr 01','Apr 02','Apr 03','Apr 04','Apr 05','Apr 06'];
  return months.map((label, i) => ({
    label,
    revenue:    Math.round(800 + Math.sin(i * 0.4) * 400 + i * 30),
    commission: Math.round((800 + Math.sin(i * 0.4) * 400 + i * 30) * 0.1),
    users:      Math.max(0, Math.round(3 + Math.cos(i * 0.3) * 2)),
    sessions:   Math.max(0, Math.round(5 + Math.sin(i * 0.5) * 3 + i * 0.2)),
  }));
}

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
interface StatCardProps {
  icon: string; value: string | number; label: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal';
  trend?: { curr: number; prev: number };
  sub?: string;
  href?: string;
}
function StatCard({ icon, value, label, color, trend, sub, href }: StatCardProps) {
  const inner = (
    <div className={`${dash.statCard} ${dash[color]}`}>
      <div className={dash.statCardTop}>
        <div className={`${dash.statCardIcon} ${dash[`icon_${color}`]}`}>{icon}</div>
        {trend && <TrendBadge curr={trend.curr} prev={trend.prev} />}
      </div>
      <div className={dash.statCardValue}>{value}</div>
      <div className={dash.statCardLabel}>{label}</div>
      {sub && <div className={dash.statCardSub}>{sub}</div>}
    </div>
  );
  if (href) return <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link>;
  return inner;
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function AdminDashboard() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [chartMetric, setChartMetric] = useState<'revenue' | 'users' | 'sessions'>('revenue');

  useEffect(() => {
    const saved = localStorage.getItem('alemnypro_user');
    if (saved) { try { setUser(JSON.parse(saved)); } catch { /* ignore */ } }
  }, []);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getDashboardStats().then(r => r.data.data),
    refetchInterval: 60_000,
  });

  const { data: chartData } = useQuery({
    queryKey: ['admin-chart'],
    queryFn: () => adminApi.getDashboardChart(30).then(r => r.data.data),
  });

  const { data: pendingVerifications } = useQuery({
    queryKey: ['admin-verifications-pending'],
    queryFn: () => adminApi.getVerificationQueue({ status: 'pending' }).then(r => r.data.data),
  });

  const { data: openDisputes } = useQuery({
    queryKey: ['admin-disputes-open'],
    queryFn: () => adminApi.getDisputes({ status: 'open' }).then(r => r.data.data),
  });

  const queue    = (pendingVerifications?.data || pendingVerifications || []).slice(0, 4);
  const disputes = ((openDisputes as {data?: unknown[]})?.data || openDisputes || []).slice(0, 4) as Record<string, unknown>[];
  const chart    = (chartData && Array.isArray(chartData) && chartData.length > 0)
    ? chartData : genMockChart();

  // Pie chart data for session status
  const pieData = [
    { name: isAr ? 'مكتملة'  : 'Confirmed',  value: stats?.confirmed_sessions  || 12, color: '#2A9D8F' },
    { name: isAr ? 'مجدولة'  : 'Scheduled',  value: stats?.scheduled_sessions  || 8,  color: '#1B4965' },
    { name: isAr ? 'متنازع عليها' : 'Disputed', value: stats?.disputed_sessions || 2,  color: '#E76F51' },
  ];

  const greeting = isAr
    ? `مرحباً${user?.name ? ' ' + user.name : ''}،`
    : `Welcome back${user?.name ? ', ' + user.name : ''}`;

  const now = new Date().toLocaleString(isAr ? 'ar-EG' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <>
      {/* ══════════════════════════════════════════════
          TOP HEADER
      ══════════════════════════════════════════════ */}
      <div className={dash.pageHeader}>
        <div>
          <h1 className={dash.pageTitle}>{greeting}</h1>
          <p className={dash.pageSubtitle}>🗓 {now} · {isAr ? 'لوحة التحليلات والإدارة' : 'Analytics & Management Dashboard'}</p>
        </div>
        <div className={dash.headerActions}>
          <button className={dash.refreshBtn} onClick={() => window.location.reload()}>
            ↻ {isAr ? 'تحديث' : 'Refresh'}
          </button>
          <Link href="/admin/settings" className={dash.settingsBtn}>
            ⚙️ {isAr ? 'الإعدادات' : 'Settings'}
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          KPI STAT CARDS — ROW 1
      ══════════════════════════════════════════════ */}
      <div className={dash.kpiGrid}>
        <StatCard
          icon="👥" color="blue" label={isAr ? 'إجمالي المستخدمين' : 'Total Users'}
          value={statsLoading ? '—' : fmt(stats?.total_users || 0)}
          trend={{ curr: stats?.new_users_this_week || 0, prev: stats?.new_users_prev_week || 0 }}
          sub={isAr ? `${stats?.new_users_this_week || 0} هذا الأسبوع` : `${stats?.new_users_this_week || 0} this week`}
          href="/admin/users"
        />
        <StatCard
          icon="🧑‍🏫" color="green" label={isAr ? 'المعلمون' : 'Tutors'}
          value={statsLoading ? '—' : fmt(stats?.total_tutors || 0)}
          trend={{ curr: stats?.new_tutors_this_week || 0, prev: stats?.new_tutors_prev_week ?? 1 }}
          sub={isAr ? `${stats?.verified_tutors || 0} موثق` : `${stats?.verified_tutors || 0} verified`}
          href="/admin/users"
        />
        <StatCard
          icon="💰" color="teal" label={isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}
          value={statsLoading ? '—' : EGP(stats?.total_revenue || 0)}
          trend={{ curr: stats?.revenue_this_week || 0, prev: stats?.revenue_prev_week ?? 1 }}
          sub={isAr ? `عمولة: ${EGP(stats?.total_commission || 0)}` : `Commission: ${EGP(stats?.total_commission || 0)}`}
        />
        <StatCard
          icon="🔒" color="purple" label={isAr ? 'في الإيداع' : 'In Escrow'}
          value={statsLoading ? '—' : EGP(stats?.escrow_amount || 0)}
          sub={isAr ? `متنازع: ${EGP(stats?.open_disputes_amount || 0)}` : `Disputed: ${EGP(stats?.open_disputes_amount || 0)}`}
        />
        <StatCard
          icon="📅" color="orange" label={isAr ? 'إجمالي الحجوزات' : 'Total Bookings'}
          value={statsLoading ? '—' : fmt(stats?.total_bookings || 0)}
          sub={isAr ? `${stats?.pending_bookings || 0} معلق` : `${stats?.pending_bookings || 0} pending`}
        />
        <StatCard
          icon="⏳" color="red" label={isAr ? 'توثيق معلق' : 'Pending Verif.'}
          value={statsLoading ? '—' : stats?.pending_verifications || 0}
          sub={isAr ? 'بحاجة لمراجعة' : 'Needs review'}
          href="/admin/verifications"
        />
      </div>

      {/* ══════════════════════════════════════════════
          REVENUE / USERS CHART
      ══════════════════════════════════════════════ */}
      <div className={dash.chartCard}>
        <div className={dash.chartCardHeader}>
          <div>
            <h2 className={dash.chartTitle}>
              📈 {isAr ? 'الأداء خلال 30 يوماً' : 'Performance — Last 30 Days'}
            </h2>
            <p className={dash.chartSubtitle}>
              {isAr ? 'الإيرادات والمستخدمين والحصص اليومية' : 'Daily revenue, signups & sessions'}
            </p>
          </div>
          <div className={dash.chartTabs}>
            {([
              { key: 'revenue',  ar: '💰 الإيرادات', en: '💰 Revenue'  },
              { key: 'users',    ar: '👥 المستخدمون', en: '👥 Users'    },
              { key: 'sessions', ar: '📚 الحصص',     en: '📚 Sessions' },
            ] as const).map(t => (
              <button key={t.key}
                className={`${dash.chartTab} ${chartMetric === t.key ? dash.chartTabActive : ''}`}
                onClick={() => setChartMetric(t.key)}
              >
                {isAr ? t.ar : t.en}
              </button>
            ))}
          </div>
        </div>

        <div className={dash.chartWrap}>
          <ResponsiveContainer width="100%" height={280}>
            {chartMetric === 'revenue' ? (
              <AreaChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1B4965" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1B4965" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="com" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F4A261" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F4A261" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={v => fmt(v)} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} />
                <Area type="monotone" dataKey="revenue"    name={isAr ? 'الإيرادات' : 'Revenue'}    stroke="#1B4965" fill="url(#rev)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="commission" name={isAr ? 'العمولة'   : 'Commission'} stroke="#F4A261" fill="url(#com)" strokeWidth={2} dot={false} />
              </AreaChart>
            ) : chartMetric === 'users' ? (
              <BarChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="users" name={isAr ? 'مستخدمون جدد' : 'New Users'} fill="#2D6A8F" radius={[4,4,0,0]} />
              </BarChart>
            ) : (
              <BarChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="sessions" name={isAr ? 'حصص' : 'Sessions'} fill="#2A9D8F" radius={[4,4,0,0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          BOTTOM GRID  (Finance + Pie + Queues)
      ══════════════════════════════════════════════ */}
      <div className={dash.bottomGrid}>

        {/* ── Financial Breakdown ── */}
        <div className={dash.infoCard}>
          <div className={dash.infoCardHeader}>
            <h3 className={dash.infoCardTitle}>💳 {isAr ? 'ملخص مالي' : 'Financial Summary'}</h3>
          </div>
          <div className={dash.financeList}>
            {[
              { label: isAr ? 'إجمالي الإيرادات'  : 'Gross Revenue',    value: EGP(stats?.total_revenue    || 0), color: '#1B4965', icon: '💰' },
              { label: isAr ? 'عمولة المنصة'       : 'Platform Fee',     value: EGP(stats?.total_commission || 0), color: '#2A9D8F', icon: '📊' },
              { label: isAr ? 'مدفوعات للمعلمين'  : 'Tutor Payouts',    value: EGP(stats?.total_payouts    || 0), color: '#F4A261', icon: '👨‍🏫' },
              { label: isAr ? 'أموال في الحضانة'  : 'Escrow Balance',   value: EGP(stats?.escrow_amount    || 0), color: '#457B9D', icon: '🔒' },
              { label: isAr ? 'متنازع عليه'        : 'Open Disputes $',  value: EGP(stats?.open_disputes_amount || 0), color: '#E76F51', icon: '⚖️' },
            ].map(r => (
              <div key={r.label} className={dash.financeRow}>
                <span className={dash.financeIcon}>{r.icon}</span>
                <span className={dash.financeLabel}>{r.label}</span>
                <span className={dash.financeValue} style={{ color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div className={dash.financeFooter}>
            <Link href="/admin/disputes" className={dash.footerLink}>
              {isAr ? 'إدارة الاعتراضات' : 'Manage Disputes'} →
            </Link>
          </div>
        </div>

        {/* ── Session Distribution Pie ── */}
        <div className={dash.infoCard}>
          <div className={dash.infoCardHeader}>
            <h3 className={dash.infoCardTitle}>🍩 {isAr ? 'توزيع الحصص' : 'Session Status'}</h3>
            <span className={dash.infoCardSub}>{isAr ? 'إجمالي' : 'Total'}: {fmt(stats?.total_sessions || pieData.reduce((a,b)=>a+b.value,0))}</span>
          </div>
          <div className={dash.pieWrap}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                  paddingAngle={4} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [fmt(Number(v) || 0), '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className={dash.pieLegend}>
            {pieData.map(p => (
              <div key={p.name} className={dash.pieLegendItem}>
                <span className={dash.pieDot} style={{ background: p.color }} />
                <span className={dash.pieLegendLabel}>{p.name}</span>
                <span className={dash.pieLegendValue}>{fmt(p.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Pending Verifications Queue ── */}
        <div className={`${dash.infoCard} ${dash.infoCardWide}`}>
          <div className={dash.infoCardHeader}>
            <h3 className={dash.infoCardTitle}>✅ {isAr ? 'طلبات التوثيق' : 'Pending Verifications'}</h3>
            <Link href="/admin/verifications" className={dash.infoCardLink}>
              {isAr ? 'عرض الكل' : 'View All'}
            </Link>
          </div>
          {queue.length === 0 ? (
            <div className={dash.emptyState}>
              <span style={{ fontSize: '2rem' }}>🎉</span>
              <p>{isAr ? 'لا توجد طلبات معلقة' : 'No pending verifications'}</p>
            </div>
          ) : (
            <div className={dash.queueList}>
              {queue.map((v: Record<string, unknown>) => (
                <div key={v.id as number} className={dash.queueItem}>
                  <div className={dash.queueAvatar}>
                    {((v.tutor as Record<string, unknown>)?.name as string || 'T').charAt(0)}
                  </div>
                  <div className={dash.queueInfo}>
                    <p className={dash.queueName}>
                      {(v.tutor as Record<string, unknown>)?.name as string || `Tutor #${v.tutor_profile_id}`}
                    </p>
                    <p className={dash.queueMeta}>{v.document_type as string} · {new Date(v.created_at as string).toLocaleDateString()}</p>
                  </div>
                  <Link href="/admin/verifications" className={dash.queueAction}>
                    {isAr ? 'مراجعة' : 'Review'}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Open Disputes Queue ── */}
        <div className={`${dash.infoCard} ${dash.infoCardWide}`}>
          <div className={dash.infoCardHeader}>
            <h3 className={dash.infoCardTitle}>⚖️ {isAr ? 'الاعتراضات المفتوحة' : 'Open Disputes'}</h3>
            <Link href="/admin/disputes" className={dash.infoCardLink}>
              {isAr ? 'عرض الكل' : 'View All'}
            </Link>
          </div>
          {disputes.length === 0 ? (
            <div className={dash.emptyState}>
              <span style={{ fontSize: '2rem' }}>✅</span>
              <p>{isAr ? 'لا توجد اعتراضات مفتوحة' : 'No open disputes'}</p>
            </div>
          ) : (
            <div className={dash.queueList}>
              {disputes.map((d: Record<string, unknown>) => (
                <div key={d.id as number} className={dash.queueItem}>
                  <div className={`${dash.queueAvatar} ${dash.queueAvatarRed}`}>⚖️</div>
                  <div className={dash.queueInfo}>
                    <p className={dash.queueName}>
                      {(isAr
                        ? (d.session as Record<string,unknown>)?.subject as Record<string,unknown>
                        : (d.session as Record<string, unknown>)?.subject as Record<string, unknown>
                      )?.name_en as string || `Dispute #${d.id}`}
                    </p>
                    <p className={dash.queueMeta}>
                      {((d.session as Record<string,unknown>)?.tutor as Record<string,unknown>)?.name as string} ·{' '}
                      {((d.session as Record<string,unknown>)?.gross_amount as number)?.toLocaleString()} EGP
                    </p>
                  </div>
                  <Link href="/admin/disputes" className={`${dash.queueAction} ${dash.queueActionRed}`}>
                    {isAr ? 'حسم' : 'Resolve'}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ══════════════════════════════════════════════
          QUICK ACTIONS
      ══════════════════════════════════════════════ */}
      <div className={dash.quickActions}>
        {[
          { href: '/admin/verifications', icon: '✅', ar: 'طلبات التوثيق',    en: 'Verifications'    },
          { href: '/admin/users',         icon: '👥', ar: 'إدارة المستخدمين', en: 'Manage Users'     },
          { href: '/admin/subjects',      icon: '📚', ar: 'إدارة المواد',      en: 'Subjects'         },
          { href: '/admin/disputes',      icon: '⚖️', ar: 'الاعتراضات',       en: 'Disputes'         },
          { href: '/admin/settings',      icon: '⚙️', ar: 'الإعدادات',        en: 'Settings'         },
        ].map(a => (
          <Link key={a.href} href={a.href} className={dash.quickAction}>
            <span className={dash.quickActionIcon}>{a.icon}</span>
            <span className={dash.quickActionLabel}>{isAr ? a.ar : a.en}</span>
          </Link>
        ))}
      </div>

      {/* Invisible spacer */}
      <div style={{ height: 32 }} />
    </>
  );
}
