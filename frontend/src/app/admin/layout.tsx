'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from '@/lib/locale';
import { useEffect, useState } from 'react';
import styles from './admin.module.css';

const NAV_ITEMS = [
  { href: '/admin',               iconEn: '📊', en: 'Dashboard',     ar: 'لوحة التحكم'      },
  { href: '/admin/sessions',      iconEn: '📅', en: 'Sessions',       ar: 'الحصص'            },
  { href: '/admin/verifications', iconEn: '✅', en: 'Verifications', ar: 'طلبات التوثيق'     },
  { href: '/admin/users',         iconEn: '👥', en: 'Users',         ar: 'المستخدمون'       },
  { href: '/admin/subjects',      iconEn: '📚', en: 'Subjects',      ar: 'المواد'            },
  { href: '/admin/disputes',      iconEn: '⚖️', en: 'Disputes',      ar: 'الاعتراضات'       },
  { href: '/admin/settings',      iconEn: '⚙️', en: 'Settings',      ar: 'الإعدادات'        },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname();
  const router     = useRouter();
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const [user,       setUser]       = useState<Record<string, unknown> | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Start as checked if we're already on the login page (avoids spinner flash)
  const [checked, setChecked] = useState(() => pathname === '/admin/login');

  // ── Auth guard ──────────────────────────────────────────────────
  useEffect(() => {
    // Skip guard for the login page itself — it manages its own auth
    if (pathname === '/admin/login') {
      setChecked(true);
      return;
    }

    const token = localStorage.getItem('alemnypro_token');
    const saved = localStorage.getItem('alemnypro_user');

    if (!token || !saved) {
      router.replace('/admin/login');
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      if (parsed?.role !== 'admin') {
        router.replace(parsed?.role === 'tutor' ? '/dashboard/tutor' : '/dashboard/student');
        return;
      }
      setUser(parsed);
    } catch {
      router.replace('/admin/login');
      return;
    }

    setChecked(true);
  }, [pathname, router]);

  // Close mobile sidebar on navigation
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const handleLogout = () => {
    localStorage.removeItem('alemnypro_token');
    localStorage.removeItem('alemnypro_user');
    router.push('/admin/login');
  };

  // On the login page itself — render it directly (no sidebar needed)
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Show spinner while checking auth for all other admin pages
  if (!checked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🛡️</div>
          <p style={{ color: '#6B7280', fontSize: 14 }}>
            {isAr ? 'جاري التحقق من الصلاحيات...' : 'Verifying access...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashLayout}>
      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className={styles.dashOverlay}
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ════════════════════════════════════════
          SIDEBAR
      ════════════════════════════════════════ */}
      <aside
        className={`${styles.dashSidebar} ${mobileOpen ? styles.dashSidebarOpen : ''}`}
        aria-label="Admin navigation"
      >
        {/* Logo */}
        <Link href="/" className={styles.dashLogo}>
          <span style={{ fontSize: '1.5rem' }}>🎓</span>
          <span className={styles.dashLogoText}>
            Alemny<span className={styles.dashLogoAccent}>Pro</span>
          </span>
        </Link>

        {/* Admin pill */}
        <div className={styles.dashAdminBadge}>
          🛡️ {isAr ? 'لوحة المدير' : 'Admin Panel'}
        </div>

        {/* Nav */}
        <p className={styles.dashNavSection}>{isAr ? 'الإدارة' : 'Management'}</p>
        <nav className={styles.dashNav}>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.dashNavLink} ${isActive(item.href) ? styles.dashNavLinkActive : ''}`}
            >
              <span className={styles.dashNavIcon}>{item.iconEn}</span>
              {isAr ? item.ar : item.en}
            </Link>
          ))}

          <div className={styles.dashNavDivider} />

          <Link href="/" className={styles.dashNavLink}>
            <span className={styles.dashNavIcon}>🏠</span>
            {isAr ? 'الرئيسية' : 'Home'}
          </Link>

          <button
            onClick={handleLogout}
            className={styles.dashNavLink}
            style={{ width: '100%', textAlign: 'start', background: 'none', border: 'none', cursor: 'pointer', color: '#E76F51' }}
          >
            <span className={styles.dashNavIcon}>🚪</span>
            {isAr ? 'تسجيل الخروج' : 'Logout'}
          </button>
        </nav>

        {/* User profile box */}
        {user && (
          <div className={styles.dashUserBox}>
            <div className={styles.dashUserAvatar}>
              {(user.name as string)?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.dashUserInfo}>
              <div className={styles.dashUserName}>{user.name as string}</div>
              <div className={styles.dashUserRole}>{isAr ? 'مدير النظام' : 'Administrator'}</div>
            </div>
          </div>
        )}
      </aside>

      {/* ════════════════════════════════════════
          MAIN
      ════════════════════════════════════════ */}
      <main className={styles.dashMain}>
        {/* Mobile top bar */}
        <div className={styles.dashTopBar}>
          <button
            className={styles.dashMobileToggle}
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <span className={styles.dashTopBarTitle}>
            {NAV_ITEMS.find(n => isActive(n.href))
              ? (isAr
                  ? NAV_ITEMS.find(n => isActive(n.href))!.ar
                  : NAV_ITEMS.find(n => isActive(n.href))!.en)
              : (isAr ? 'الإدارة' : 'Admin')}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
            🛡️ {user?.name as string || (isAr ? 'مدير' : 'Admin')}
          </span>
        </div>

        {/* Page content */}
        <div className={styles.dashPageContent}>
          {children}
        </div>
      </main>
    </div>
  );
}
