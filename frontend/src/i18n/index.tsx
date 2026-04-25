import { createContext, useContext, useState, useCallback } from 'react';
import es from './locales/es';
import en from './locales/en';
import fr from './locales/fr';
import de from './locales/de';
import pt from './locales/pt';
import it from './locales/it';
import nl from './locales/nl';
import pl from './locales/pl';
import sv from './locales/sv';
import da from './locales/da';
import no from './locales/no';
import cs from './locales/cs';
import ro from './locales/ro';
import ca from './locales/ca';
import tr from './locales/tr';
import zh from './locales/zh';
import hi from './locales/hi';
import ar from './locales/ar';
import ru from './locales/ru';
import ja from './locales/ja';

export const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'ca', label: 'Català' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pl', label: 'Polski' },
  { code: 'sv', label: 'Svenska' },
  { code: 'da', label: 'Dansk' },
  { code: 'no', label: 'Norsk' },
  { code: 'cs', label: 'Čeština' },
  { code: 'ro', label: 'Română' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ja', label: '日本語' },
];

const locales: Record<string, Record<string, string>> = {
  es, en, fr, de, it, pt, nl, pl, sv, da, no, cs, ro, ca, tr, ru, zh, hi, ar, ja,
};

function detectLanguage(): string {
  const saved = localStorage.getItem('language');
  if (saved && locales[saved]) return saved;
  const browser = navigator.language.split('-')[0];
  return locales[browser] ? browser : 'es';
}

interface I18nContextType {
  lang: string;
  setLang: (l: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<string>(detectLanguage);

  function setLang(l: string) {
    localStorage.setItem('language', l);
    setLangState(l);
  }

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    const dict = locales[lang] || {};
    const fallback = locales['es'] || {};
    let str = dict[key] ?? fallback[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{{${k}}}`, String(v));
      });
    }
    return str;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
