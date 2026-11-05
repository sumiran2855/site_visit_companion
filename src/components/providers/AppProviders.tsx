"use client";

import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { I18nProvider } from "@/components/providers/I18nProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>{children}</AuthProvider>
    </I18nProvider>
  );
}

