"use client";

import React, { Suspense, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, LogIn, RefreshCw, Zap } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { AuthController } from "@/controllers/auth.controller";

function PendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState<string>(() => {
    if (queryEmail) return queryEmail;
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("ec_pending_email") ||
        sessionStorage.getItem("ec_pending_email") ||
        ""
      );
    }
    return "";
  });

  const [requestedCompany, setRequestedCompany] = useState<string>(() => {
    return searchParams.get("company") || "EC POWER";
  });

  const [isChecking, setIsChecking] = useState(false);
  const [approvalState, setApprovalState] = useState<"pending" | "approved" | "rejected">("pending");
  const [statusMessage, setStatusMessage] = useState<string | null>(
    "Your access request is still under review by your company administrator."
  );

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    setStatusMessage(null);

    try {
      const result = await AuthController.getInstance().handleCheckAccountStatus(
        email || undefined,
        requestedCompany || undefined
      );

      if (result.company) {
        setRequestedCompany(result.company);
      }

      if (result.email) {
        setEmail(result.email);
      }

      if (result.isApproved) {
        if (result.hasActiveSession) {
          router.replace(ROUTES.VISITS);
          return;
        }
        setApprovalState("approved");
        setStatusMessage(
          "Your account has been approved by your administrator! Please sign in to access your dashboard."
        );
        return;
      }

      if (result.status === "rejected") {
        setApprovalState("rejected");
        setStatusMessage("Your access request was rejected by an administrator.");
        return;
      }

      setApprovalState("pending");
      setStatusMessage("Your access request is still under review by your company administrator.");
    } catch {
      setApprovalState("pending");
      setStatusMessage("Your access request is still under review by your company administrator.");
    } finally {
      setIsChecking(false);
    }
  }, [email, requestedCompany, router]);

  const handleSignInRedirect = () => {
    const targetUrl = email
      ? `${ROUTES.AUTH}?mode=signin&email=${encodeURIComponent(email)}`
      : `${ROUTES.AUTH}?mode=signin`;
    router.push(targetUrl);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-foreground overflow-hidden selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Decorative Grid & Ambient Blur */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px] blur-[120px] rounded-full pointer-events-none transition-colors duration-500 ${
          approvalState === "approved"
            ? "bg-emerald-100/40 dark:bg-emerald-950/20"
            : "bg-amber-100/40 dark:bg-amber-950/20"
        }`}
      />

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
            {/* Approved State */}
            {approvalState === "approved" ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
                    Registration Approved!
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                    Your account has been verified and approved by the company administrator.
                  </p>
                </div>
              </div>
            ) : approvalState === "rejected" ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-center">
                  <div className="flex items-center justify-center size-16 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                    <AlertCircle className="size-8" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
                    Request Rejected
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                    Your access request was rejected by an administrator. Please reach out to your team lead.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
                  Awaiting Approval
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Your account registration has been submitted and is waiting for administrator authorization.
                </p>
              </div>
            )}

            {/* Requested Company & Email Info Badge */}
            <div className="rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 p-4 text-left space-y-2">
              <div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                  Requested Company
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  {requestedCompany}
                </p>
              </div>
              {email && (
                <div className="pt-1 border-t border-slate-200/60 dark:border-zinc-700/60">
                  <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                    Account Email
                  </span>
                  <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                    {email}
                  </p>
                </div>
              )}
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div
                className={`rounded-xl p-3.5 text-xs text-left leading-relaxed ${
                  approvalState === "approved"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : approvalState === "rejected"
                    ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                }`}
              >
                {statusMessage}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
              {approvalState === "approved" ? (
                <button
                  type="button"
                  onClick={handleSignInRedirect}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-zinc-100 px-4 py-3 text-sm font-semibold text-white dark:text-zinc-900 shadow-md hover:bg-slate-800 dark:hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-all cursor-pointer"
                >
                  <LogIn className="size-4" />
                  <span>Sign In to Dashboard</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={checkStatus}
                  disabled={isChecking}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-zinc-100 px-4 py-3 text-sm font-semibold text-white dark:text-zinc-900 shadow-md hover:bg-slate-800 dark:hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-all disabled:opacity-60 cursor-pointer"
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
              )}

              <button
                type="button"
                onClick={() => router.push(ROUTES.AUTH)}
                className="w-full text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 py-1 transition-colors cursor-pointer"
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
