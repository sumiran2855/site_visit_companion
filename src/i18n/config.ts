import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import de from "./locales/de.json";
import da from "./locales/da.json";
import pl from "./locales/pl.json";

export const LANGUAGE_STORAGE_KEY = "i18nextLng";
export const DEFAULT_LANGUAGE = "en";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "da", name: "Danish", nativeName: "Dansk", flag: "🇩🇰" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const resources = {
  en: {
    translation: en,
    auth: en,
    common: en,
  },
  de: {
    translation: de,
    auth: de,
    common: de,
  },
  da: {
    translation: da,
    auth: da,
    common: da,
  },
  pl: {
    translation: pl,
    auth: pl,
    common: pl,
  },
} as const;

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: "translation",
    fallbackNS: ["translation", "auth", "common"],
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

export default i18n;
