"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n";
import { ROUTES } from "@/lib/constants";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-6 sm:p-12 md:p-20 bg-background text-foreground">
      {/* Top bar with Language Switcher */}
      <div className="w-full max-w-2xl flex justify-end pb-4">
        <LanguageSwitcher align="right" />
      </div>

      <main className="w-full max-w-2xl my-auto space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {t("privacy.brand", "EC POWER")}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("privacy.title", "Privacy Policy")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "privacy.subtitle",
              "Site Visit Companion — Data Protection & Privacy Notice"
            )}
          </p>
        </div>

        <div className="prose dark:prose-invert text-sm text-muted-foreground space-y-4 leading-relaxed">
          <p>
            {t(
              "privacy.p1",
              "The Site Visit Companion is designed for field technicians and authorized personnel to record site survey information, upload field media, and prepare project installation reports."
            )}
          </p>
          <p>
            {t(
              "privacy.p2",
              "All data and media recorded are processed securely under strict company-level access controls and are retained in compliance with project data protection guidelines."
            )}
          </p>
        </div>

        <div className="pt-4">
          <Link
            href={ROUTES.HOME}
            className="inline-flex items-center text-sm font-medium text-foreground hover:underline"
          >
            {t("privacy.backToHome", "Back to Home")}
          </Link>
        </div>
      </main>

      <footer className="w-full max-w-2xl pt-12 flex items-center gap-6 text-xs text-muted-foreground">
        <Link
          href={ROUTES.TERMS}
          className="hover:text-foreground transition-colors"
        >
          {t("privacy.termsLink", "Terms")}
        </Link>
        <span>{t("privacy.copyright", "© EC POWER")}</span>
      </footer>
    </div>
  );
}
