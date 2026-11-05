"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n";
import { ROUTES } from "@/lib/constants";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function TermsPage() {
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
            {t("terms.brand", "EC POWER")}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("terms.title", "Terms of Service")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("terms.subtitle", "Site Visit Companion — User Agreement")}
          </p>
        </div>

        <div className="prose dark:prose-invert text-sm text-muted-foreground space-y-4 leading-relaxed">
          <p>
            {t(
              "terms.p1",
              "Access to the Site Visit Companion is restricted to authenticated and approved personnel. Account registrations require administrator authorization."
            )}
          </p>
          <p>
            {t(
              "terms.p2",
              "By using this application, technicians and administrators agree to input accurate technical installation data and safeguard project confidential materials."
            )}
          </p>
        </div>

        <div className="pt-4">
          <Link
            href={ROUTES.HOME}
            className="inline-flex items-center text-sm font-medium text-foreground hover:underline"
          >
            {t("terms.backToHome", "Back to Home")}
          </Link>
        </div>
      </main>

      <footer className="w-full max-w-2xl pt-12 flex items-center gap-6 text-xs text-muted-foreground">
        <Link
          href={ROUTES.PRIVACY}
          className="hover:text-foreground transition-colors"
        >
          {t("terms.privacyLink", "Privacy")}
        </Link>
        <span>{t("terms.copyright", "© EC POWER")}</span>
      </footer>
    </div>
  );
}
