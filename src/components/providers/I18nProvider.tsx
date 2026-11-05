"use client";

import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, {
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
} from "@/i18n/config";

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (
        saved &&
        SUPPORTED_LANGUAGES.some((l) => l.code === saved) &&
        saved !== i18n.language
      ) {
        i18n.changeLanguage(saved);
        if (typeof document !== "undefined") {
          document.documentElement.lang = saved;
        }
      }
    } catch {
      // ignore storage access issues
    }
  }, []);

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      if (typeof document !== "undefined") {
        document.documentElement.lang = lng;
      }
    };
    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

