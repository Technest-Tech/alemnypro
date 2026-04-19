'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocaleProvider } from '@/lib/locale';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthModalProvider } from '@/lib/AuthModalContext';
import AuthModal from '@/components/ui/AuthModal/AuthModal';
import FavoriteEffect from '@/components/ui/FavoriteEffect/FavoriteEffect';
import { saveAuth } from '@/lib/auth';

// ─── Session bridge ───────────────────────────────────────────────────────────
// Existing sessions were written to localStorage before the cookie-based
// middleware was introduced. This syncs them into cookies once on mount so
// the middleware can read them on the NEXT navigation.
function SessionBridge() {
  useEffect(() => {
    const token = localStorage.getItem('alemnypro_token');
    const userRaw = localStorage.getItem('alemnypro_user');
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        saveAuth(token, user); // writes cookies if not already set
      } catch { /* malformed data — ignore */ }
    }
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionBridge />
      <LocaleProvider>
        <AuthModalProvider>
          {children}
          {/* Global Auth Modal — triggered by any page via useAuthModal() */}
          <AuthModal />
          {/* Global Favorite Effect — particles + toast on heart click */}
          <FavoriteEffect />
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: '#1A1A2E',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: '12px',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                padding: '12px 16px',
                border: '1px solid rgba(255,255,255,0.1)'
              },
              success: {
                iconTheme: { primary: '#10B981', secondary: '#fff' }
              },
              error: {
                iconTheme: { primary: '#EF4444', secondary: '#fff' }
              }
            }}
          />
        </AuthModalProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
