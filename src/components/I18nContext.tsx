"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";

export type Language = "es" | "en";

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (es: string, en: string) => string;
}

const I18N_STORAGE_KEY = "synergia_lang_v1";

const I18nContext = createContext<I18nContextValue>({
  lang: "es",
  setLang: () => {},
  toggleLang: () => {},
  t: (es) => es,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("es");

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem(I18N_STORAGE_KEY);
        if (saved === "es" || saved === "en") {
          setLangState(saved);
          document.documentElement.lang = saved;
        } else {
          const browserLang =
            typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "es";
          const detected: Language = browserLang.startsWith("en") ? "en" : "es";
          setLangState(detected);
          document.documentElement.lang = detected;
        }
      } catch {
        document.documentElement.lang = "es";
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem(I18N_STORAGE_KEY, next);
      document.documentElement.lang = next;
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "es" ? "en" : "es");
  }, [lang, setLang]);

  const t = useCallback(
    (es: string, en: string) => (lang === "en" ? en : es),
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
