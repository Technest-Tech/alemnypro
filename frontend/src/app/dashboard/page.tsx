'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /dashboard — smart redirect based on user role stored in localStorage.
 * This acts as a universal "go to my dashboard" link usable anywhere in the app.
 */
export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('alemnypro_token');
    const user  = JSON.parse(localStorage.getItem('alemnypro_user') || 'null');

    if (!token || !user) {
      // Not logged in — send to login
      router.replace('/auth/login');
      return;
    }

    const role = user.role;

    if (role === 'admin') {
      router.replace('/admin');
    } else if (role === 'tutor') {
      router.replace('/dashboard/tutor');
    } else {
      router.replace('/dashboard/student');
    }
  }, [router]);

  // Briefly shown while redirecting
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      flexDirection: 'column',
      gap: '16px',
      fontFamily: 'var(--font-body)',
    }}>
      <span style={{ fontSize: '3rem' }}>🎓</span>
      <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>جاري التوجيه...</p>
    </div>
  );
}
