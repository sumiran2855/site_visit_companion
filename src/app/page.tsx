import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  FileDown,
  Layers,
  ShieldCheck,
  Smartphone,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-foreground overflow-hidden selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Background Decorative Grid and Ambient Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-sky-100/40 dark:bg-sky-950/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
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

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Cloud Sync Active
            </span>
            <Link
              href={ROUTES.AUTH}
              className="inline-flex items-center justify-center text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col justify-center max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 text-xs font-medium text-slate-600 dark:text-zinc-300 shadow-sm">
              <span className="font-semibold text-slate-900 dark:text-white">EC POWER</span>
              <span className="text-slate-400 dark:text-zinc-500">•</span>
            </div>

            {/* Main Title */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
                Site Visit Checklist
              </h1>
              <p className="text-lg sm:text-xl font-medium text-slate-500 dark:text-zinc-400">
                Digital field survey companion for XRGI installations
              </p>
            </div>

            {/* Description */}
            <p className="text-base sm:text-lg leading-relaxed text-slate-600 dark:text-zinc-300 max-w-xl">
              Fill in on your phone during the site visit. Photos, videos, and notes sync to the cloud, so you can download the full folder from your laptop when you get back.
            </p>

            {/* CTA Group */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Link
                href={ROUTES.AUTH}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-md hover:bg-slate-800 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 active:scale-[0.99] transition-all dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                <span>Sign in to start</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-500 dark:text-zinc-400 px-2">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Authorized Personnel & Partner Access</span>
              </div>
            </div>

            {/* Key feature highlights */}
            <div className="pt-6 border-t border-slate-200/80 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-slate-700 dark:text-zinc-300">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Smartphone className="size-4 text-slate-500 dark:text-zinc-400 shrink-0" />
                <span>Mobile & Camera Ready</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Cloud className="size-4 text-slate-500 dark:text-zinc-400 shrink-0" />
                <span>Real-Time Cloud Save</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <FileDown className="size-4 text-slate-500 dark:text-zinc-400 shrink-0" />
                <span>ZIP & PDF Generation</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Preview / Survey Card Mockup */}
          <div className="lg:col-span-5 w-full">
            <div className="relative mx-auto max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-xl">
              {/* Header of Mockup */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-lg bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
                    <Layers className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                      XRGI Survey Intake
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Site: Benbow Inn
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Synced
                </span>
              </div>

              {/* Progress Bar inside Mockup */}
              <div className="py-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-zinc-400">
                    Overall Completion
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    65 / 73 (89%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-slate-900 dark:bg-zinc-200 rounded-full w-[89%]" />
                </div>
              </div>

              {/* Checklist Sections Sample */}
              <div className="space-y-2.5 pt-1">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium text-slate-800 dark:text-zinc-200">
                      1. Meeting Context
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">Complete</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium text-slate-800 dark:text-zinc-200">
                      5. Boiler & Mechanical Room
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">4 Photos • 1 Video</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium text-slate-800 dark:text-zinc-200">
                      6. Electric Meter Room
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">Complete</span>
                </div>
              </div>

              {/* Footer Note inside Mockup */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                <span>Last auto-saved 2 mins ago</span>
                <span className="font-medium text-slate-700 dark:text-zinc-300">Ready to Export</span>
              </div>
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
