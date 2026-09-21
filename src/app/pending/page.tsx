"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, Loader2, RefreshCw, Zap } from "lucide-react";
import { ROUTES } from "@/lib/constants";

function PendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedCompany = searchParams.get("company") || "TEST POWER INC";
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCheckStatus = () => {
    setIsChecking(true);
    setStatusMessage(null);

    setTimeout(() => {
      setIsChecking(false);
      setStatusMessage("Your access request is still under review by your company administrator.");
    }, 1000);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-foreground overflow-hidden selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Decorative Grid & Ambient Blur */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-amber-100/40 dark:bg-amber-950/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 select-none">
            <div className="flex items-center justify-center size-8 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-sm">
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
          </div>
        </div>
      </header>

      {/* Main Card */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
                Awaiting Approval
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Your account registration has been submitted and is waiting for administrator authorization.
              </p>
            </div>

            {/* Requested Company Badge */}
            <div className="rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 p-4 text-left space-y-1">
              <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Requested Company
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                {requestedCompany}
              </p>
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className="rounded-lg bg-slate-100 dark:bg-zinc-800 p-3 text-xs text-slate-700 dark:text-zinc-300">
                {statusMessage}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={isChecking}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-zinc-100 px-4 py-3 text-sm font-semibold text-white dark:text-zinc-900 shadow-md hover:bg-slate-800 dark:hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-all disabled:opacity-60"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Checking status...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-4" />
                    <span>Check now</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push(ROUTES.AUTH)}
                className="w-full text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 py-1 transition-colors"
              >
                Sign out / Switch account
              </button>
            </div>
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
          <span>&copy; {new Date().getFullYear()} EC POWER. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

export default function PendingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
          <div className="size-6 border-2 border-slate-900 border-t-transparent dark:border-white rounded-full animate-spin" />
        </div>
      }
    >
      <PendingContent />
    </Suspense>
  );
}
