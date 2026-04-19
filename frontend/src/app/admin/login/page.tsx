'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('admin@alemnypro.com');
  const [password, setPassword] = useState('Admin@123!');

  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);

  // Already logged in as admin? Go straight to dashboard
  useEffect(() => {
    const token = localStorage.getItem('alemnypro_token');
    const user  = localStorage.getItem('alemnypro_user');
    if (token && user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed?.role === 'admin') router.replace('/admin');
      } catch { /* ignore */ }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res  = await authApi.login({ email, password });
      const data = res.data;
      const user  = data.user  || data.data?.user;
      const token = data.token || data.data?.token;

      if (user?.role !== 'admin') {
        setError('هذه الصفحة للمدراء فقط. / This page is for admins only.');
        setLoading(false);
        return;
      }

      localStorage.setItem('alemnypro_token', token);
      localStorage.setItem('alemnypro_user',  JSON.stringify(user));
      router.push('/admin');
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string } } };
      setError(axErr.response?.data?.message || 'البريد أو كلمة المرور غير صحيحة. / Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1628 0%, #1B4965 50%, #0a1628 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* Glow orbs */}
      <div style={{ position: 'fixed', top: '15%', insetInlineStart: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,157,143,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '15%', insetInlineEnd: '10%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,162,97,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛡️</div>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            Admin Portal
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
            AlemnyPro · لوحة إدارة النظام
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#FCA5A5', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
              البريد الإلكتروني / Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '12px 16px', borderRadius: 12,
                border: '1.5px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.07)',
                color: '#fff', fontSize: 14, outline: 'none',
                fontFamily: 'inherit', transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = '#2A9D8F')}
              onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
              كلمة المرور / Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 44px 12px 16px', borderRadius: 12,
                  border: '1.5px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.07)',
                  color: '#fff', fontSize: 14, outline: 'none',
                  fontFamily: 'inherit', direction: 'ltr',
                }}
                onFocus={e => (e.target.style.borderColor = '#2A9D8F')}
                onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 16, color: 'rgba(255,255,255,0.5)', padding: 0, lineHeight: 1,
                }}
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: loading ? 'rgba(42,157,143,0.5)' : 'linear-gradient(135deg, #2A9D8F, #1B4965)',
              color: '#fff', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.01em',
              transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(42,157,143,0.3)',
            }}
          >
            {loading ? '⏳ جاري التحقق...' : '🚀 دخول / Sign In'}
          </button>
        </form>

        {/* Hint */}
        <div style={{ marginTop: 24, padding: '14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.6 }}>
          🔑 <strong style={{ color: 'rgba(255,255,255,0.6)' }}>admin@alemnypro.com</strong> · Admin@123!<br />
          <span style={{ fontSize: 11 }}>🔒 Admin access only · Unauthorized access is logged</span>
        </div>

        {/* Back to site */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>
            ← العودة للموقع / Back to site
          </a>
        </div>
      </div>
    </div>
  );
}
