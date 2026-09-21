"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Zap } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";

function AuthContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const [authMode, setAuthMode] = useState<"signin" | "signup">(initialMode);

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-foreground overflow-hidden selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Decorative Grid & Ambient Blur */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-sky-100/40 dark:bg-sky-950/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href={ROUTES.HOME} className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center size-8 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-sm transition-transform group-hover:scale-105">
              <Zap className="size-4 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                EC POWER
              </span>
              <span className="text-[10px] tracking-wider font-medium text-slate-500 dark:text-zinc-400 uppercase">
                Field Operations
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* Auth Card Container */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="w-full max-w-md">
          {/* Form Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
            {authMode === "signin" ? (
              <LoginForm onSwitchToSignup={() => setAuthMode("signup")} />
            ) : (
              <SignupForm onSwitchToSignin={() => setAuthMode("signin")} />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-6">
            <Link
              href={ROUTES.PRIVACY}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href={ROUTES.TERMS}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span>&copy; {new Date().getFullYear()} EC POWER. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-300 dark:text-zinc-700">|</span>
            <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-zinc-500">EN / DE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
          <div className="size-6 border-2 border-slate-900 border-t-transparent dark:border-white rounded-full animate-spin" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
