'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ar, en, Translations } from '@/lib/translations';

type Locale = 'ar' | 'en';

interface LocaleContextType {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  dir: 'rtl' | 'ltr';
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'ar',
  t: ar,
  setLocale: () => {},
  dir: 'rtl',
});

const translations: Record<Locale, Translations> = { ar, en };

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ar');

  useEffect(() => {
    const saved = localStorage.getItem('alemnypro_locale') as Locale;
    if (saved && (saved === 'ar' || saved === 'en')) {
      setLocaleState(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('alemnypro_locale', locale);
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  return (
    <LocaleContext.Provider
      value={{
        locale,
        t: translations[locale],
        setLocale,
        dir: locale === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
}
