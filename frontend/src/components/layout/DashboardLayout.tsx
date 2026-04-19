'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from '@/lib/locale';
import { authApi } from '@/lib/api';
import { clearAuth } from '@/lib/auth';
import styles from './DashboardLayout.module.css';

// ─── Nav items (tutor) ───────────────────────────────────────────────────────

// Primary nav items
const TUTOR_NAV_TOP = [
  { href: '/dashboard/tutor',                icon: '📊', labelAr: 'الرئيسية',      labelEn: 'Overview'       },
  { href: '/dashboard/tutor/messages',       icon: '💬', labelAr: 'الرسائل',        labelEn: 'Messages'       },
  { href: '/dashboard/tutor/listings',       icon: '🏷️', labelAr: 'إعلاناتي',      labelEn: 'My Listings'    },
  { href: '/dashboard/tutor/evaluations',    icon: '⭐', labelAr: 'التقييمات',     labelEn: 'Evaluations'    },
];

// "My Profile" dropdown — each item is its own isolated page
const TUTOR_ACCOUNT_ITEMS = [
  { href: '/dashboard/tutor/profile',        icon: '✏️', labelAr: 'ملفي الشخصي',   labelEn: 'My Profile'      },
  { href: '/dashboard/tutor/billing',        icon: '🧾', labelAr: 'الفواتير',        labelEn: 'Billing'         },
  { href: '/dashboard/tutor/payments',       icon: '💸', labelAr: 'المدفوعات',       labelEn: 'Payments'        },
];

// Scheduling items
const TUTOR_NAV_BOTTOM_MAIN = [
  { href: '/dashboard/tutor/sessions',       icon: '📚', labelAr: 'الحصص',         labelEn: 'Sessions'       },
  { href: '/dashboard/tutor/group-sessions', icon: '👥', labelAr: 'حصص جماعية',   labelEn: 'Group Sessions'  },
];

const TUTOR_NAV_BOTTOM = [
  { href: '/dashboard/tutor/premium',        icon: '⚡', labelAr: 'بريميوم',      labelEn: 'Premium',  premium: true },
];


const STUDENT_NAV = [
  { href: '/dashboard/student',             icon: '📊', labelAr: 'الرئيسية',    labelEn: 'Overview'  },
  { href: '/dashboard/student/messages',    icon: '💬', labelAr: 'الرسائل',      labelEn: 'Messages'  },
  { href: '/dashboard/student/bookings',    icon: '📋', labelAr: 'حجوزاتي',     labelEn: 'My Bookings' },
  { href: '/dashboard/student/tutors',      icon: '🧑‍🏫', labelAr: 'معلميّ',       labelEn: 'My Tutors'   },
  { href: '/dashboard/student/sessions',    icon: '▶️', labelAr: 'دروسي',        labelEn: 'Sessions'    },
];

interface StoredUser {
  name: string;
  email: string;
  role: 'tutor' | 'student' | 'admin';
  avatar?: string;
}

interface Props {
  children: React.ReactNode;
  role?: 'tutor' | 'student';
  /** Onboarding completion pct for sidebar ring (0-100) */
  completionPct?: number;
  /** Number of pending bookings for badge */
  pendingCount?: number;
}

export default function DashboardLayout({
  children,
  role = 'tutor',
  completionPct = 0,
  pendingCount = 0,
}: Props) {
  const { locale } = useLocale();
  const pathname   = usePathname();
  const router     = useRouter();
  const isAr       = locale === 'ar';

  const [user, setUser]             = useState<StoredUser | null>(null);
  const [drawerOpen, setDrawerOpen]  = useState(false);
  const [collapsed, setCollapsed]    = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('alemnypro_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Auto-expand dropdown when on any of its sub-pages
  useEffect(() => {
    const isOnAccountPage = TUTOR_ACCOUNT_ITEMS.some(item => pathname.startsWith(item.href));
    if (isOnAccountPage) setAccountOpen(true);
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuth(); // clears both localStorage AND cookies
    router.push('/');
  }, [router]);

  const nav = role === 'tutor' ? TUTOR_NAV_TOP : STUDENT_NAV;
  const initials = user?.name?.substring(0, 2).toUpperCase() || '??';

  // SVG progress ring
  const radius    = 18;
  const circ      = 2 * Math.PI * radius;
  const dashOffset = circ - (completionPct / 100) * circ;

  const isActive = (href: string) =>
    href === `/dashboard/${role}`
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <div className={`${styles.layout} ${isAr ? styles.rtl : ''}`} dir={isAr ? 'rtl' : 'ltr'}>

      {/* ─── Mobile backdrop ─── */}
      {drawerOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside className={`${styles.sidebar} ${drawerOpen ? styles.sidebarOpen : ''} ${collapsed ? styles.sidebarCollapsed : ''}`}>
        {/* Logo + collapse button */}
        <div
          className={styles.logoHeader}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}
        >
          <Link href={`/dashboard/${role}`} className={styles.logo} style={{ padding: 0, border: 'none', margin: 0, flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <span className={styles.logoEmoji}>🎓</span>
            <span className={styles.logoText}>
              Alemny<span className={styles.logoAccent}>Pro</span>
            </span>
          </Link>
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? (isAr ? 'توسيع' : 'Expand') : (isAr ? 'طي' : 'Collapse')}
          >
            {isAr
              ? (collapsed ? '‹' : '›')
              : (collapsed ? '›' : '‹')}
          </button>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {/* Top nav items: Overview, Messages, Listings, Evaluations */}
          {nav.map(item => {
            const active = isActive(item.href);
            const label  = isAr ? item.labelAr : item.labelEn;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={label}
                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{label}</span>
              </Link>
            );
          })}

          {/* My Profile dropdown (tutor only) */}
          {role === 'tutor' && (
            <>
              {/* Dropdown trigger */}
              <button
                className={`${styles.navItem} ${styles.navDropdownTrigger} ${accountOpen ? styles.navDropdownOpen : ''} ${
                  TUTOR_ACCOUNT_ITEMS.some(i => isActive(i.href)) ? styles.navItemActive : ''
                }`}
                onClick={() => setAccountOpen(o => !o)}
                title={isAr ? 'ملفي الشخصي' : 'My Profile'}
              >
                <span className={styles.navIcon}>👤</span>
                <span className={styles.navLabel}>{isAr ? 'ملفي الشخصي' : 'My Profile'}</span>
                <span className={`${styles.navChevron} ${accountOpen ? styles.navChevronOpen : ''}`}>▾</span>
              </button>

              {/* Dropdown children — each a fully isolated page */}
              <div className={`${styles.navChildren} ${accountOpen ? styles.navChildrenOpen : ''}`}>
                {TUTOR_ACCOUNT_ITEMS.map(item => {
                  const active = isActive(item.href);
                  const label  = isAr ? item.labelAr : item.labelEn;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={label}
                      className={`${styles.navItem} ${styles.navChild} ${active ? styles.navItemActive : ''}`}
                    >
                      <span className={styles.navIcon}>{item.icon}</span>
                      <span className={styles.navLabel}>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {/* Bottom nav items: Bookings, Sessions, Group Sessions */}
          {role === 'tutor' && (
            <>
              <div className={styles.navDivider} />
              {TUTOR_NAV_BOTTOM_MAIN.map(item => {
                const active = isActive(item.href);
                const label  = isAr ? item.labelAr : item.labelEn;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={label}
                    className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navLabel}>{label}</span>
                    {item.href.includes('bookings') && pendingCount > 0 && (
                      <span className={styles.navBadge}>{pendingCount}</span>
                    )}
                  </Link>
                );
              })}
            </>
          )}

          {/* Premium link */}
          {role === 'tutor' && TUTOR_NAV_BOTTOM.map(item => {
            const active = isActive(item.href);
            const label  = isAr ? item.labelAr : item.labelEn;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={label}
                className={`${styles.navItem} ${styles.navPremium} ${active ? styles.navItemActive : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{label}</span>
                <span className={styles.navPremiumDot} />
              </Link>
            );
          })}
        </nav>


        {/* Spacer */}
        <div className={styles.navSpacer} />

        {/* Back to site */}
        <Link href="/" className={`${styles.navItem} ${styles.navItemSite}`}>
          <span className={styles.navIcon}>🏠</span>
          <span className={styles.navLabel}>{isAr ? 'الموقع الرئيسي' : 'Main Site'}</span>
        </Link>

        {/* User box */}
        {user && (
          <div className={styles.userBox}>
            <div className={styles.avatarWrap}>
              {/* Progress ring */}
              {role === 'tutor' && completionPct < 100 && (
                <svg className={styles.progressRing} viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r={radius} className={styles.ringBg} />
                  <circle
                    cx="22" cy="22" r={radius}
                    className={styles.ringFill}
                    strokeDasharray={circ}
                    strokeDashoffset={dashOffset}
                  />
                </svg>
              )}
              {user.avatar ? (
                <img src={user.avatar} className={styles.avatar} alt={user.name} />
              ) : (
                <div className={styles.avatarFallback}>{initials}</div>
              )}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userRole}>
                {role === 'tutor'
                  ? (isAr ? '🧑‍🏫 معلم' : '🧑‍🏫 Tutor')
                  : (isAr ? '🎒 طالب' : '🎒 Student')}
                {role === 'tutor' && completionPct < 100 && (
                  <span className={styles.completionPct}>{completionPct}%</span>
                )}
              </span>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout} title={isAr ? 'خروج' : 'Logout'}>
              🚪
            </button>
          </div>
        )}
      </aside>

      {/* ─── Main content ─── */}
      <div className={styles.main}>
        {/* Mobile top bar */}
        <div className={styles.mobileTopBar}>
          <button
            className={styles.hamburger}
            onClick={() => setDrawerOpen(o => !o)}
            aria-label="Open menu"
          >
            <span /><span /><span />
          </button>
          <Link href={`/dashboard/${role}`} className={styles.mobileLogo}>🎓 AlemnyPro</Link>
          <div style={{ width: 40 }} />
        </div>

        {/* Page content */}
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
