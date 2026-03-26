import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Language = "fr" | "zarma" | "ha";

type I18nContextValue = {
  language: Language;
  setLanguage: (value: Language) => void;
  tr: (fr: string, zarma: string, ha: string) => string;
};

const STORAGE_KEY = "microjob_language";

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "fr" || raw === "zarma" || raw === "ha") return raw;
    return "fr";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      tr: (fr, zarma, ha) => (language === "fr" ? fr : language === "zarma" ? zarma : ha),
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return ctx;
}
