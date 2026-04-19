'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveAuth } from '@/lib/auth';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      router.push('/auth/login?error=' + error);
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        saveAuth(token, user);

        // Redirect based on role
        if (user.role === 'admin') router.push('/admin');
        else if (user.role === 'tutor') router.push('/dashboard/tutor');
        else router.push('/dashboard/student');
      } catch {
        router.push('/auth/login?error=invalid_callback');
      }
    } else {
      router.push('/auth/login');
    }
  }, [searchParams, router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0F2027, #1B4965)' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔄</span>
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>جاري تسجيل الدخول...</p>
        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>Signing you in...</p>
      </div>
    </div>
  );
}
