'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/lib/locale';
import Header from './Header';
import Footer from './Footer';

const NAV = [
  { href: '/dashboard/student',           icon: '🏠', ar: 'الرئيسية',     en: 'Overview'    },
  { href: '/dashboard/student/messages',  icon: '💬', ar: 'الرسائل',       en: 'Messages'    },
  { href: '/dashboard/student/bookings',  icon: '📋', ar: 'حجوزاتي',      en: 'My Bookings' },
  { href: '/dashboard/student/sessions',  icon: '📚', ar: 'حصصي',         en: 'My Sessions' },
  { href: '/dashboard/student/favorites', icon: '❤️', ar: 'المفضلة',      en: 'Favorites'   },
  { href: '/dashboard/student/profile',   icon: '👤', ar: 'ملفي',          en: 'My Profile'  },
];

interface Props {
  children: React.ReactNode;
  /** Optional title shown in the hero strip */
  title?: string;
  subtitle?: string;
  /** Optional right-side action element */
  action?: React.ReactNode;
}

export default function StudentLayout({ children, title, subtitle, action }: Props) {
  const { locale } = useLocale();
  const isAr      = locale === 'ar';
  const pathname  = usePathname();

  const isActive = (href: string) =>
    href === '/dashboard/student' ? pathname === href : pathname.startsWith(href);

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* ── Hero strip ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1B4965 0%, #2D6A8E 100%)',
        padding: '32px 0 0',
      }}>
        <div className="container" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          {(title || action) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
              <div>
                {title && <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#fff' }}>{title}</h1>}
                {subtitle && <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>{subtitle}</p>}
              </div>
              {action && <div>{action}</div>}
            </div>
          )}

          {/* ── Tab nav ── */}
          <div style={{ display: 'flex', gap: 4 }}>
            {NAV.map(item => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 18px',
                    borderRadius: '10px 10px 0 0',
                    fontSize: 14, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s',
                    background: active ? '#F8FAFC' : 'rgba(255,255,255,0.1)',
                    color:      active ? '#1B4965' : 'rgba(255,255,255,0.85)',
                    borderBottom: active ? '2px solid #F8FAFC' : '2px solid transparent',
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{isAr ? item.ar : item.en}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <main style={{ flex: 1 }}>
        <div className="container" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
