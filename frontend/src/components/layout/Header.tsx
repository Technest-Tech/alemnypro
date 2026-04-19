'use client';
/* eslint-disable @next/next/no-html-link-for-pages */

import Link from 'next/link';
import { useLocale } from '@/lib/locale';
import styles from './Header.module.css';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi } from '@/lib/api';

interface StoredUser {
  name: string;
  role: 'tutor' | 'student' | 'admin';
  avatar?: string;
  onboarding_status?: string;
}

export default function Header() {
  const { t, locale, setLocale } = useLocale();
  const router   = useRouter();
  const pathname = usePathname();

  // Helper: returns navLink + navLinkActive when the path matches
  const nl = (href: string) => {
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
    return `${styles.navLink}${isActive ? ' ' + styles.navLinkActive : ''}`;
  };
  const mnl = (href: string) => {
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
    return `${styles.mobileNavLink}${isActive ? ' ' + styles.mobileNavLinkActive : ''}`;
  };
  const [menuOpen, setMenuOpen]       = useState(false);
  const [isScrolled, setIsScrolled]   = useState(false);
  const [user, setUser]               = useState<StoredUser | null>(null);
  const [liveAvatar, setLiveAvatar]   = useState<string | null>(null); // fresh from /auth/me
  const [isMounted, setIsMounted]     = useState(false);
  const [dropOpen, setDropOpen]       = useState(false);
  const [imgError, setImgError]       = useState(false);
  const dropRef                       = useRef<HTMLDivElement>(null);

  // ── Hydrate from localStorage then fetch fresh avatar ────────────────────
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem('alemnypro_user');
    if (stored) setUser(JSON.parse(stored));

    // Fetch latest avatar from /auth/me (silently — non-blocking)
    const token = localStorage.getItem('alemnypro_token');
    if (token) {
      authApi.me().then(r => {
        const data = r.data?.data;
        if (data?.avatar) {
          setLiveAvatar(data.avatar);
          // Keep localStorage in sync
          const s = localStorage.getItem('alemnypro_user');
          if (s) {
            const parsed = JSON.parse(s);
            parsed.avatar = data.avatar;
            localStorage.setItem('alemnypro_user', JSON.stringify(parsed));
          }
        }
      }).catch(() => { /* ignore — user just sees initials */ });
    }

    // Listen for in-modal login / avatar update events
    const onAuthChange = () => {
      const s = localStorage.getItem('alemnypro_user');
      setUser(s ? JSON.parse(s) : null);
      setLiveAvatar(null);
      setImgError(false);

      // Re-fetch fresh avatar after auth change
      const tok = localStorage.getItem('alemnypro_token');
      if (tok) {
        authApi.me().then(r => {
          if (r.data?.data?.avatar) setLiveAvatar(r.data.data.avatar);
        }).catch(() => {});
      }
    };
    window.addEventListener('alemnypro-auth-change', onAuthChange);
    return () => window.removeEventListener('alemnypro-auth-change', onAuthChange);
  }, []);

  // ── Scroll effect ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dashboardUrl = user?.role === 'admin'
    ? '/admin'
    : user?.role === 'tutor'
      ? '/dashboard/tutor'
      : '/dashboard/student';

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('alemnypro_token');
    localStorage.removeItem('alemnypro_user');
    setUser(null);
    setLiveAvatar(null);
    setDropOpen(false);
    router.push('/');
  };

  // Resolved avatar: prefer live fetch → localStorage → null (show initials)
  const avatarSrc = imgError ? null : (liveAvatar || user?.avatar || null);
  const initials  = user?.name?.charAt(0)?.toUpperCase() || '?';

  // ── Avatar element (reused in both desktop & mobile) ─────────────────────
  const AvatarCircle = ({ size = 32 }: { size?: number }) => (
    avatarSrc ? (
      <img
        src={avatarSrc}
        className={styles.avatarImg}
        style={{ width: size, height: size }}
        alt={user?.name || 'Profile'}
        onError={() => setImgError(true)}
      />
    ) : (
      <span className={styles.avatarInitials} style={{ width: size, height: size, fontSize: size * 0.42 }}>
        {initials}
      </span>
    )
  );

  const isBottomNavActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href);
  };

  const bottomNavAccountHref = user ? dashboardUrl : '/auth/login';


  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}>
        <div className={`container ${styles.inner}`}>
          {/* Logo */}
          <a href="/" className={styles.logo}>
            <span className={styles.logoIcon}>🎓</span>
            <span className={styles.logoText}>
              Alemny<span className={styles.logoAccent}>Pro</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className={styles.nav}>
            <Link href="/search"        className={nl('/search')}>{t.nav.findTutor}</Link>
            <Link href="/subjects"      className={nl('/subjects')}>{t.nav.subjects}</Link>
            <Link href="/become-a-tutor" className={nl('/become-a-tutor')}>{t.nav.becomeTutor}</Link>
          </nav>

          {/* Actions */}
          <div className={styles.actions}>
            {/* Language Toggle */}
            <button
              className={styles.langToggle}
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            >
              {locale === 'ar' ? 'EN' : 'عربي'}
            </button>

            {!isMounted ? (
              /* ── Hydration placeholder ── */
              <div style={{ width: 140, height: 36 }} />
            ) : user ? (
              /* ── Logged-in: avatar dropdown ── */
              <div className={styles.userMenu} ref={dropRef}>
                <button
                  className={styles.avatarBtn}
                  onClick={() => setDropOpen(o => !o)}
                  aria-label="User menu"
                  aria-expanded={dropOpen}
                >
                  <AvatarCircle size={32} />
                  <span className={styles.avatarName}>{user.name.split(' ')[0]}</span>
                  <span className={`${styles.avatarCaret} ${dropOpen ? styles.avatarCaretOpen : ''}`}>▼</span>
                </button>

                {dropOpen && (
                  <div className={styles.dropdown}>
                    {/* Dropdown header — shows full avatar + name + role */}
                    <div className={styles.dropHeader}>
                      <div className={styles.dropHeaderAvatar}>
                        <AvatarCircle size={42} />
                        <div className={styles.dropHeaderInfo}>
                          <span className={styles.dropName}>{user.name}</span>
                          <span className={styles.dropRole}>
                            {user.role === 'tutor'
                              ? (locale === 'ar' ? '🧑‍🏫 معلم' : '🧑‍🏫 Tutor')
                              : user.role === 'admin'
                                ? (locale === 'ar' ? '🛡️ مدير' : '🛡️ Admin')
                                : (locale === 'ar' ? '🎒 طالب' : '🎒 Student')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <hr className={styles.dropDivider} />

                    <Link href={dashboardUrl} className={styles.dropItem} onClick={() => setDropOpen(false)}>
                      📊 {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                    </Link>
                    {user.role === 'tutor' && (
                      <Link href="/dashboard/tutor/profile" className={styles.dropItem} onClick={() => setDropOpen(false)}>
                        👤 {locale === 'ar' ? 'ملفي الشخصي' : 'My Profile'}
                      </Link>
                    )}
                    {user.role === 'student' && (
                      <Link href="/dashboard/student" className={styles.dropItem} onClick={() => setDropOpen(false)}>
                        👤 {locale === 'ar' ? 'حسابي' : 'My Account'}
                      </Link>
                    )}

                    <hr className={styles.dropDivider} />
                    <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={handleLogout}>
                      🚪 {locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── Logged-out: Login + Register ── */
              <>
                <Link href="/auth/login" className={`btn btn-ghost btn-sm ${styles.loginBtn}`}>
                  {t.nav.login}
                </Link>
                <Link href="/auth/register" className={`btn btn-primary btn-sm ${styles.registerBtn}`}>
                  {t.nav.register}
                </Link>
              </>
            )}
          </div>

          {/* Mobile: Language Toggle + Menu Button */}
          <div className={styles.mobileHeaderActions}>
            <button
              className={styles.mobileLangToggle}
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            >
              {locale === 'ar' ? 'EN' : 'AR'}
            </button>
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Full-Screen Menu Overlay */}
        <div className={`${styles.mobileMenuOverlay} ${menuOpen ? styles.mobileMenuOverlayOpen : ''}`}>
          <nav className={styles.mobileNav}>
            <a href="/search"         className={mnl('/search')}         onClick={() => setMenuOpen(false)}>{t.nav.findTutor}</a>
            <a href="/subjects"        className={mnl('/subjects')}        onClick={() => setMenuOpen(false)}>{t.nav.subjects}</a>
            <a href="/become-a-tutor" className={mnl('/become-a-tutor')} onClick={() => setMenuOpen(false)}>{t.nav.becomeTutor}</a>

            <div className={styles.mobileActions}>
              {user ? (
                <>
                  {/* Mobile: show avatar + name row */}
                  <div className={styles.mobileUserRow}>
                    <AvatarCircle size={40} />
                    <div className={styles.mobileUserInfo}>
                      <span className={styles.mobileUserName}>{user.name}</span>
                      <span className={styles.mobileUserRole}>
                        {user.role === 'tutor'
                          ? (locale === 'ar' ? '🧑‍🏫 معلم' : '🧑‍🏫 Tutor')
                          : (locale === 'ar' ? '🎒 طالب' : '🎒 Student')}
                      </span>
                    </div>
                  </div>
                  <a href={dashboardUrl} className="btn btn-primary btn-md" style={{ width: '100%' }} onClick={() => setMenuOpen(false)}>
                    📊 {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                  </a>
                  <button className="btn btn-outline btn-md" style={{ width: '100%' }} onClick={handleLogout}>
                    🚪 {locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                  </button>
                </>
              ) : (
                <>
                  <a href="/auth/login" className="btn btn-outline btn-md" style={{ width: '100%' }} onClick={() => setMenuOpen(false)}>
                    {t.nav.login}
                  </a>
                  <a href="/auth/register" className="btn btn-primary btn-md" style={{ width: '100%' }} onClick={() => setMenuOpen(false)}>
                    {t.nav.register}
                  </a>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* ── Mobile Bottom Navigation Bar ── */}
      {isMounted && (
        <nav className={styles.bottomNav} aria-label="Mobile navigation">
          {/* Home */}
          <a
            href="/"
            className={`${styles.bottomNavItem} ${isBottomNavActive('/') ? styles.bottomNavItemActive : ''}`}
          >
            <span className={styles.bottomNavIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            <span className={styles.bottomNavLabel}>{locale === 'ar' ? 'الرئيسية' : 'Home'}</span>
          </a>

          {/* Search */}
          <a
            href="/search"
            className={`${styles.bottomNavItem} ${isBottomNavActive('/search') ? styles.bottomNavItemActive : ''}`}
          >
            <span className={styles.bottomNavIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <span className={styles.bottomNavLabel}>{locale === 'ar' ? 'البحث' : 'Search'}</span>
          </a>

          {/* Subjects */}
          <a
            href="/subjects"
            className={`${styles.bottomNavItem} ${isBottomNavActive('/subjects') ? styles.bottomNavItemActive : ''}`}
          >
            <span className={styles.bottomNavIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </span>
            <span className={styles.bottomNavLabel}>{locale === 'ar' ? 'المواد' : 'Subjects'}</span>
          </a>

          {/* Account / Login */}
          <a
            href={bottomNavAccountHref}
            className={`${styles.bottomNavItem} ${(isBottomNavActive('/auth/login') || isBottomNavActive('/dashboard') || isBottomNavActive('/admin')) ? styles.bottomNavItemActive : ''}`}
          >
            <span className={styles.bottomNavIcon}>
              {user ? (
                <div className={styles.bottomNavAvatar}>
                  <AvatarCircle size={24} />
                </div>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              )}
            </span>
            <span className={styles.bottomNavLabel}>
              {user
                ? (locale === 'ar' ? 'حسابي' : 'Account')
                : (locale === 'ar' ? 'دخول' : 'Login')}
            </span>
          </a>
        </nav>
      )}
    </>
  );
}
