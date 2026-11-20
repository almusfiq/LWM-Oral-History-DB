import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'bn';

const LANG_KEY = 'lwm-lang';

// Bangla is the default; English only when the visitor has chosen it.
function readLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'bn';
  } catch {
    return 'bn';
  }
}

interface LangValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Interface text only: stories and their details stay in Bangla. */
  t: (en: string, bn: string) => string;
}

const LangContext = createContext<LangValue>({ lang: 'bn', setLang: () => {}, t: (_en, bn) => bn });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lang === 'bn' ? 'মুক্তিযুদ্ধ জাদুঘর' : 'Liberation War Museum';
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    try { localStorage.setItem(LANG_KEY, next); } catch { /* private mode: still switches for this visit */ }
  };

  return <LangContext.Provider value={{ lang, setLang, t: (en, bn) => (lang === 'bn' ? bn : en) }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

const bnDigits = '০১২৩৪৫৬৭৮৯';
/** Numbers in the current language's digits (counts, steps). */
export const num = (value: number | string, lang: Lang) =>
  lang === 'bn' ? String(value).replace(/[0-9]/g, (d) => bnDigits[Number(d)]) : String(value);

export function LangToggle({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  const { lang, setLang } = useLang();
  const base = dark ? 'border-white/15 bg-white/[0.04]' : 'border-line bg-surface-raised';
  const idle = dark ? 'text-white/60 hover:text-white' : 'text-ink-muted hover:text-ink';
  return (
    <div role="group" aria-label="Language / ভাষা" className={`inline-flex shrink-0 items-center rounded-xl border p-0.5 text-[12px] font-semibold ${base} ${className}`}>
      {(['bn', 'en'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          lang={code}
          className={`rounded-[9px] px-1.5 sm:px-2 py-1 transition-colors ${lang === code ? 'bg-forest text-white' : idle}`}
        >
          {code === 'en' ? 'EN' : <><span className="sm:hidden">বাং</span><span className="max-sm:hidden">বাংলা</span></>}
        </button>
      ))}
    </div>
  );
}
