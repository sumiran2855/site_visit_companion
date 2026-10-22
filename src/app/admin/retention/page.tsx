"use client";

import React, { useState } from "react";
import {
  Trash2,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  HardHat,
  Image as ImageIcon,
  Video,
  Database,
  Calendar,
  Clock,
  ShieldAlert,
  Play,
  X,
  Building2,
  Check,
} from "lucide-react";
import { useAdminRetention } from "@/hooks/useAdminRetention";

export default function AdminRetentionPage() {
  const {
    isSuperAdmin,
    isCompanyAdmin,
    metrics,
    isLoading,
    isRefreshing,
    isRunning,
    errorMessage,
    lastRunResult,
    showConfirmModal,
    setShowConfirmModal,
    notification,
    setNotification,
    fetchRetentionData,
    onRefresh,
    triggerCleanup,
  } = useAdminRetention();

  const pastRetentionDays = metrics?.pastRetentionDays ?? 0;
  const expiringIn30Days = metrics?.expiringIn30Days ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-md animate-in fade-in ${
            notification.type === "success"
              ? "bg-emerald-600 text-white"
              : notification.type === "error"
              ? "bg-rose-600 text-white"
              : "bg-sky-600 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="size-4 shrink-0" />
            <div>
              <p className="font-bold text-sm">{notification.title}</p>
              <p className="opacity-90">{notification.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg hover:bg-black/10 text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
            Data Retention & Storage
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Automated 1-Year Compliance Window & Storage Capacity Health
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300 shadow-xs transition-colors cursor-pointer"
          >
            <RotateCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              disabled={isRunning || isLoading}
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Play className="size-3.5 fill-current" />
              <span>{isRunning ? "Running Purge..." : "Run Purge Now"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-200">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchRetentionData()}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Policy Card & Last Cleanup Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Compliance Policy Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-100 font-bold text-sm">
            <ShieldAlert className="size-4 text-sky-600" />
            <h3>1-Year Retention Policy Active</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            All checklist surveys, inspection answers, photographs, and video recordings older than{" "}
            <strong>365 days</strong> are subject to automated data retention purge to ensure strict compliance with storage standards and privacy policies.
          </p>
          <div className="pt-2 flex items-center gap-3 text-[11px] font-semibold text-slate-500">
            <span>Cutoff: 365 Days</span>
            <span>•</span>
            <span>Warning Trigger: 335 Days</span>
            <span>•</span>
            <span>Cloudflare R2 Object Storage</span>
          </div>
        </div>

        {/* Last Run Execution Summary */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-100 font-bold text-sm">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <h3>Last Cleanup Execution</h3>
            </div>
            {lastRunResult && (
              <span className="text-[10px] text-slate-400">
                {new Date(lastRunResult.timestamp).toLocaleString()}
              </span>
            )}
          </div>

          {lastRunResult ? (
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60">
                <div className="text-base font-extrabold text-slate-900 dark:text-zinc-100">
                  {lastRunResult.purgedVisits}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Visits Purged</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60">
                <div className="text-base font-extrabold text-slate-900 dark:text-zinc-100">
                  {lastRunResult.deletedFilesCount}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Files Deleted</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60">
                <div className="text-base font-extrabold text-emerald-600">
                  {lastRunResult.freedSpaceMB} MB
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Freed Space</div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic pt-2">
              No cleanup execution recorded yet in this session.
            </p>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Past Retention Period */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Past 365 Days
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
              <Trash2 className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-rose-600">
              {metrics?.pastRetentionDays ?? 0}
            </div>
            <p className="text-xs font-semibold text-rose-600 mt-0.5">
              Due for immediate purge
            </p>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Expiring &lt;30d
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-600">
              {metrics?.expiringIn30Days ?? 0}
            </div>
            <p className="text-xs font-semibold text-amber-600 mt-0.5">
              Approaching retention cutoff
            </p>
          </div>
        </div>

        {/* Active Inspections */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Visits
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <HardHat className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100">
              {metrics?.activeVisits ?? 0}
            </div>
            <p className="text-xs font-semibold text-emerald-600 mt-0.5">
              Within compliance window
            </p>
          </div>
        </div>

        {/* Storage Volume */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Estimated Storage
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600">
              <Database className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100">
              {metrics?.estimatedStorageMB ?? 0} MB
            </div>
            <p className="text-xs font-semibold text-sky-600 mt-0.5">
              {metrics?.totalPhotosCount ?? 0} photos, {metrics?.totalVideosCount ?? 0} videos
            </p>
          </div>
        </div>
      </div>

      {/* Expiring Visits Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Visits Approaching or Past 365-Day Retention
          </h2>
          <span className="text-xs text-slate-400 font-semibold">
            {metrics?.expiringVisits.length ?? 0} visits queued
          </span>
        </div>

        {metrics?.expiringVisits.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center space-y-3">
            <div className="size-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600">
              <Check className="size-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">
              All Visits Compliant
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm mx-auto">
              No site visits or attached media are approaching or past the 365-day compliance window.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Site Name</th>
                    <th className="py-3 px-4">Organization</th>
                    <th className="py-3 px-4">Inspection Date</th>
                    <th className="py-3 px-4">Age (Days)</th>
                    <th className="py-3 px-4">Media Items</th>
                    <th className="py-3 px-4 text-right">Retention Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {metrics?.expiringVisits.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-zinc-100">
                          {item.siteName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {item.id.slice(0, 12)}...
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-medium">
                          <Building2 className="size-3 text-slate-400" />
                          <span>{item.companyName || "Unassigned"}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-zinc-400">
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-zinc-200">
                        {item.ageInDays} days
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-zinc-400">
                        {item.mediaCount ?? 0} files
                      </td>

                      <td className="py-3 px-4 text-right">
                        {item.isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <Trash2 className="size-3" />
                            <span>Expired ({item.ageInDays - 365}d overdue)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="size-3" />
                            <span>Expires in {item.daysRemaining}d</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  Execute 1-Year Retention Cleanup?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              {pastRetentionDays > 0 ? (
                <>
                  Found <strong>{pastRetentionDays} visit(s)</strong> older than 365 days. Running
                  cleanup will permanently remove all inspection checklist answers, photos, and
                  videos for these visits from Cloudflare R2 and Supabase.
                </>
              ) : (
                <>
                  All inspections are currently within the 365-day compliance window. Running cleanup
                  will perform a verification scan and prune any orphaned storage files older than 365 days.
                </>
              )}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRunning}
                onClick={triggerCleanup}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 disabled:opacity-60"
              >
                {isRunning ? "Running..." : "Run Purge Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

