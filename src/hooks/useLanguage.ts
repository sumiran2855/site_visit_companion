"use client";

import { useCallback } from "react";
import { useTranslation } from "@/i18n";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LanguageOption,
  SUPPORTED_LANGUAGES,
  SupportedLanguageCode,
} from "@/i18n/config";

export function useLanguage() {
  const { i18n, t, mounted } = useTranslation();

  const currentLanguageCode = mounted
    ? i18n.language || DEFAULT_LANGUAGE
    : DEFAULT_LANGUAGE;

  const currentLanguage: LanguageOption =
    SUPPORTED_LANGUAGES.find((item) => item.code === currentLanguageCode) ||
    SUPPORTED_LANGUAGES.find((item) => item.code === DEFAULT_LANGUAGE) ||
    SUPPORTED_LANGUAGES[0];

  const changeLanguage = useCallback(
    async (code: SupportedLanguageCode) => {
      try {
        await i18n.changeLanguage(code);
        if (typeof window !== "undefined") {
          localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
          document.documentElement.lang = code;
        }
      } catch (error) {
        console.error("Failed to change language:", error);
      }
    },
    [i18n]
  );

  return {
    currentLanguage,
    currentLanguageCode,
    supportedLanguages: SUPPORTED_LANGUAGES,
    changeLanguage,
    t,
    i18n,
    mounted,
  };
}
