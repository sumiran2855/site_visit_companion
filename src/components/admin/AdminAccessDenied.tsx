"use client";

import React from "react";
import { ShieldAlert, LogOut, Smartphone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function AdminAccessDenied() {
  const { user, logout, switchRole } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
          <ShieldAlert className="size-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            Administrator Access Required
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
            Admin Web Portal
          </h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
            This web application is exclusively reserved for <strong>Administrators</strong>.
            Normal users and technicians must use the Site Visit Companion mobile app.
          </p>
        </div>

        {/* Current user info */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800 text-left text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-400">Logged in as:</span>
            <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate max-w-[200px]">
              {user?.email}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Current Role:</span>
            <span className="font-bold text-slate-700 dark:text-zinc-300 capitalize">
              {user?.role === "admin" ? "Administrator" : "Normal User"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Company:</span>
            <span className="text-slate-700 dark:text-zinc-300">
              {user?.companyName || user?.requestedCompany || "Unassigned"}
            </span>
          </div>
        </div>

        {/* Mobile notice */}
        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 flex items-start gap-3 text-left">
          <Smartphone className="size-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div className="text-xs text-sky-900 dark:text-sky-200 space-y-1">
            <p className="font-bold">Field Technicians & Normal Users</p>
            <p className="text-sky-700 dark:text-sky-300 leading-snug">
              Please open the Site Visit Companion mobile app on iOS or Android to complete inspections, upload media, and generate client reports.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => logout()}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-white transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>Sign out of Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
