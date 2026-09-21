"use client";

import { Cloud, Loader2, Save } from "lucide-react";

interface ChecklistProgressProps {
  completedCount: number;
  totalCount: number;
  saveStatus: "synced" | "saving" | "unsaved";
  onSave: () => void;
  isAllExpanded: boolean;
  onToggleExpandAll: () => void;
}

export function ChecklistProgress({
  completedCount,
  totalCount,
  saveStatus,
  onSave,
  isAllExpanded,
  onToggleExpandAll,
}: ChecklistProgressProps) {
  const percent = Math.round((completedCount / (totalCount || 1)) * 100);

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Counts and Progress Status */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Checklist Completion
            </span>
            {/* Cloud Sync Status (Section 9 & 30 requirement) */}
            {saveStatus === "saving" ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400">
                <Loader2 className="size-3 animate-spin" />
                <span>Saving...</span>
              </span>
            ) : saveStatus === "synced" ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <Cloud className="size-3" />
                <span>Synced to cloud</span>
              </span>
            ) : (
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                Unsaved changes
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
              {completedCount} / {totalCount}
            </span>
            <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
              ({percent}%)
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleExpandAll}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {isAllExpanded ? "Collapse all" : "Expand all"}
          </button>

          {/* Explicit Save button (Section 9 requirement) */}
          <button
            type="button"
            onClick={onSave}
            disabled={saveStatus === "saving"}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-zinc-100 px-4 py-2 text-xs sm:text-sm font-semibold text-white dark:text-zinc-900 shadow-sm hover:bg-slate-800 dark:hover:bg-white active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            percent === 100
              ? "bg-emerald-600 dark:bg-emerald-500"
              : "bg-slate-900 dark:bg-zinc-200"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
