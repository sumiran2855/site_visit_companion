"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { ROUTES } from "@/lib/constants";

interface SignupFormProps {
  onSwitchToSignin?: () => void;
}

export function SignupForm({ onSwitchToSignin }: SignupFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [step, setStep] = useState<"account" | "company">("account");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    // Move to company intake step as specified in project spec
    setStep("company");
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!company.trim()) {
      setError("Please specify the company or organization you work for.");
      return;
    }

    setIsLoading(true);

    // Simulate account registration & route to pending approval screen
    setTimeout(() => {
      setIsLoading(false);
      router.push(`${ROUTES.PENDING}?company=${encodeURIComponent(company)}`);
    }, 800);
  };

  const handleGoogleSignup = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("company");
    }, 800);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2 text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          {step === "account" ? "Create an account" : "Tell us about your company"}
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
          EC POWER Site Visit Checklist
        </p>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed pt-1">
          {step === "account"
            ? "Use Google or an account created for this checklist. Your Lovable editor login is separate."
            : "Enter the customer or service company you are assigned to. Administrators will verify your access request."}
        </p>
      </div>

      {step === "account" && (
        <>
          {/* Google Sign-up Action */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-zinc-200 shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-700/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="size-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-zinc-800" />
            <span className="absolute bg-white dark:bg-zinc-900 px-3 text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-medium">
              or
            </span>
          </div>
        </>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-xs sm:text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Main Account Form */}
      {step === "account" ? (
        <form onSubmit={handleAccountSubmit} className="space-y-4">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="space-y-1.5">
              <label
                htmlFor="firstName"
                className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300"
              >
                First name
              </label>
              <input
                id="firstName"
                type="text"
                required
                autoComplete="given-name"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="lastName"
                className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300"
              >
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                required
                autoComplete="family-name"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10 transition-colors"
              />
            </div>
          </div>

          {/* Middle Name (optional) */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="middleName"
              className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300"
            >
              Middle name (optional)
            </label>
            <input
              id="middleName"
              type="text"
              autoComplete="additional-name"
              placeholder=""
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10 transition-colors"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="signup-email"
              className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300"
            >
              Email
            </label>
            <div className="relative">
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                placeholder="technician@ecpower.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10 transition-colors"
              />
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="signup-password"
              className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-zinc-100 px-4 py-3 text-sm font-semibold text-white dark:text-zinc-900 shadow-md hover:bg-slate-800 dark:hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              Create account
            </button>
          </div>
        </form>
      ) : (
        /* Step 2: Company Intake Step */
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="company"
              className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300"
            >
              Your company name
            </label>
            <input
              id="company"
              type="text"
              required
              autoFocus
              placeholder="e.g. TEST POWER INC"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10 transition-colors"
            />
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Your requested company will be sent to the administrator for verification.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep("account")}
              className="w-1/3 rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-2/3 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-zinc-100 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white dark:text-zinc-900 shadow-md hover:bg-slate-800 dark:hover:bg-white transition-all disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Access Request</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Switch to Sign In */}
      <div className="pt-2 text-center text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
        Have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignin}
          className="font-semibold text-slate-900 dark:text-zinc-200 underline underline-offset-4 hover:text-slate-700 dark:hover:text-white transition-colors"
        >
          Sign in instead
        </button>
      </div>
    </div>
  );
}
