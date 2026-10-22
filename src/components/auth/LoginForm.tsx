"use client";

import { Eye, EyeOff, Loader2, Mail, Shield, UserCheck, ShieldAlert, Zap } from "lucide-react";
import { useLoginForm } from "@/hooks/useLoginForm";

interface LoginFormProps {
  onSwitchToSignup?: () => void;
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    isLoading,
    error,
    handleSubmit,
    handleGoogleLogin,
    handleDemoLogin,
  } = useLoginForm();

  return (
    <div className="w-full space-y-6">
      {/* Form Header */}
      <div className="space-y-2 text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white dark:bg-white dark:text-zinc-900">
          <Shield className="size-3 text-amber-400" />
          <span>Admin Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
          Sign in
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
          Centralized administrative management for EC POWER Site Visit Companion. Authorized{" "}
          <strong>Company Admins</strong> & <strong>Super Admins</strong> only.
        </p>
      </div>

      {/* Form Error Banner */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-xs sm:text-sm text-red-700 dark:text-red-400 animate-in fade-in flex items-center gap-2">
          <ShieldAlert className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5 text-left">
          <label
            htmlFor="email"
            className="block text-xs font-bold text-slate-700 dark:text-zinc-300"
          >
            Email Address
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@ecpower.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10 transition-colors"
            />
            <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5 text-left">
          <label
            htmlFor="password"
            className="block text-xs font-bold text-slate-700 dark:text-zinc-300"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10 transition-colors pr-10"
            />
            <button
              type="button"
              onClick={toggleShowPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Sign In Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-zinc-100 px-4 py-3 text-sm font-semibold text-white dark:text-zinc-900 shadow-md hover:bg-slate-800 dark:hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign in as Administrator</span>
          )}
        </button>
      </form>
    </div>
  );
}
