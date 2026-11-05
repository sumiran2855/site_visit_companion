"use client";

import { useTranslation as useI18nTranslation } from "react-i18next";
import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_LANGUAGE } from "./config";

const emptySubscribe = () => () => {};

export function useAppTranslation(ns?: string) {
  const { t: baseT, i18n, ready } = useI18nTranslation(ns);

  // useSyncExternalStore is the standard React 19 API for SSR/client synchronization
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const t = useCallback(
    (
      key: string,
      defaultValueOrOptions?: Record<string, unknown> | string,
      maybeOptions?: Record<string, unknown>
    ): string => {
      let defaultValue: string | undefined;
      let opts: Record<string, unknown> = {};

      if (typeof defaultValueOrOptions === "string") {
        defaultValue = defaultValueOrOptions;
        if (maybeOptions && typeof maybeOptions === "object") {
          opts = { ...maybeOptions };
        }
      } else if (defaultValueOrOptions && typeof defaultValueOrOptions === "object") {
        opts = { ...defaultValueOrOptions };
      }

      if (defaultValue !== undefined) {
        opts.defaultValue = defaultValue;
      }

      // Prior to client hydration, enforce default language to prevent SSR mismatch
      if (!isClient) {
        opts.lng = DEFAULT_LANGUAGE;
      }

      return String(baseT(key, opts));
    },
    [baseT, isClient]
  );

  return { t, i18n, ready, mounted: isClient };
}
