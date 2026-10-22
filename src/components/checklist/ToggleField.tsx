"use client";

import { useState } from "react";
import { Check, X, CheckCircle2, MessageSquare, StickyNote } from "lucide-react";
import type { ChecklistFieldConfig } from "@/config/checklist";

interface ToggleFieldProps {
  config: ChecklistFieldConfig;
  value: string;
  notes?: string;
  onChange: (value: string) => void;
  onNotesChange: (notes: string) => void;
}

export function ToggleField({
  config,
  value,
  notes = "",
  onChange,
  onNotesChange,
}: ToggleFieldProps) {
  const [showNotes, setShowNotes] = useState(Boolean(notes));

  const cleanVal = (value || "").trim().toLowerCase();
  const isYes = cleanVal === "yes" || cleanVal === "true";
  const isNo = cleanVal === "no" || cleanVal === "false";
  const isAnswered = isYes || isNo;

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 p-4 space-y-3 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
            <span>{config.label}</span>
            {config.required && (
              <span className="text-red-500 font-bold text-xs" title="Required field">
                *
              </span>
            )}
          </label>
          {config.description && (
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {config.description}
            </p>
          )}
        </div>

        {isAnswered && (
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        )}
      </div>

      {/* Yes / No Pill Group */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(isYes ? "" : "Yes")}
          className={`flex-1 h-10 inline-flex items-center justify-center gap-2 rounded-xl text-xs font-bold border transition-colors ${
            isYes
              ? "bg-slate-900 dark:bg-sky-600 border-slate-900 dark:border-sky-600 text-white shadow-xs"
              : "bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200"
          }`}
        >
          {isYes && <Check className="size-3.5 stroke-[3]" />}
          <span>Yes</span>
        </button>

        <button
          type="button"
          onClick={() => onChange(isNo ? "" : "No")}
          className={`flex-1 h-10 inline-flex items-center justify-center gap-2 rounded-xl text-xs font-bold border transition-colors ${
            isNo
              ? "bg-slate-900 dark:bg-zinc-700 border-slate-900 dark:border-zinc-700 text-white shadow-xs"
              : "bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200"
          }`}
        >
          {isNo && <X className="size-3.5 stroke-[3]" />}
          <span>No</span>
        </button>
      </div>

      {/* Notes Toggle & Expandable Area */}
      <div className="pt-1">
        {!showNotes ? (
          <button
            type="button"
            onClick={() => setShowNotes(true)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium transition-colors"
          >
            <MessageSquare className="size-3.5" />
            <span>Add notes</span>
          </button>
        ) : (
          <div className="space-y-1.5 bg-slate-50 dark:bg-zinc-800/40 rounded-lg p-2.5 border border-slate-200/60 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1 font-medium">
                <StickyNote className="size-3.5" />
                <span>Field Notes</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowNotes(false);
                  onNotesChange("");
                }}
                className="hover:text-rose-500 transition-colors"
              >
                Clear
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Add observation details or constraints..."
              rows={2}
              className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/10"
            />
          </div>
        )}
      </div>
    </div>
  );
}
