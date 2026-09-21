"use client";

import React, { useState } from "react";
import { Plus, Building2, Loader2 } from "lucide-react";

interface CreateVisitFormProps {
  onCreateVisit: (siteName: string) => void;
  isLoading?: boolean;
}

export function CreateVisitForm({
  onCreateVisit,
  isLoading = false,
}: CreateVisitFormProps) {
  const [siteName, setSiteName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) {
      setError("Please enter a site or building name.");
      return;
    }
    setError(null);
    onCreateVisit(siteName.trim());
    setSiteName("");
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-5 sm:p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <Building2 className="size-5 text-slate-600 dark:text-zinc-400" />
          <span>Start a new site visit</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
          Enter the customer site or building location to begin a new inspection checklist.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Site / building name (e.g., Benbow Inn - Main Facility)"
              value={siteName}
              onChange={(e) => {
                setSiteName(e.target.value);
                if (error) setError(null);
              }}
              disabled={isLoading}
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/60 px-4 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !siteName.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 shadow-sm hover:bg-slate-800 dark:hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="size-4" />
                <span>New visit</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 pt-1">{error}</p>
        )}
      </form>
    </div>
  );
}

