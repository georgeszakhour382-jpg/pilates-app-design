import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en } from './i18n/en';
import { fr } from './i18n/fr';
import { ar } from './i18n/ar';

export type Locale = 'en' | 'fr' | 'ar';
export type Translations = typeof en;

const CATALOGS: Record<Locale, Translations> = { en, fr, ar };

const LS_KEY = 'pilates:lang';

interface LocaleContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (next: Locale) => void;
  /** Right-to-left layout flag — true for `ar`. Apps that depend on
   *  reading-direction (icons that flip, swipe gestures) read this. */
  isRTL: boolean;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  t: en,
  setLocale: () => {},
  isRTL: false,
});

function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const v = window.localStorage.getItem(LS_KEY);
  if (v === 'en' || v === 'fr' || v === 'ar') return v;
  return 'en';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);

  // Persist + set <html lang> + <html dir> so the browser picks correct
  // hyphenation, font fallback, and RTL flow for AR.
  useEffect(() => {
    window.localStorage.setItem(LS_KEY, locale);
    const html = document.documentElement;
    html.setAttribute('lang', locale);
    html.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      t: CATALOGS[locale],
      setLocale: (next) => setLocaleState(next),
      isRTL: locale === 'ar',
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

export function useT(): Translations {
  return useContext(LocaleContext).t;
}
