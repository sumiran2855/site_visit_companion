"use client";

import { useState } from "react";
import { Check, CheckCircle2, MessageSquare, StickyNote } from "lucide-react";
import type { ChecklistFieldConfig } from "@/config/checklist";

interface CheckboxFieldProps {
  config: ChecklistFieldConfig;
  value: string;
  notes?: string;
  onChange: (value: string) => void;
  onNotesChange: (notes: string) => void;
}

export function CheckboxField({
  config,
  value,
  notes = "",
  onChange,
  onNotesChange,
}: CheckboxFieldProps) {
  const [showNotes, setShowNotes] = useState(Boolean(notes));

  const cleanVal = (value || "").trim().toLowerCase();
  const isChecked = cleanVal === "true" || cleanVal === "yes";

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 p-4 space-y-3 transition-all">
      {/* Toggle button row */}
      <button
        type="button"
        onClick={() => onChange(isChecked ? "" : "true")}
        className="w-full flex items-start gap-3 text-left group"
      >
        <div
          className={`size-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
            isChecked
              ? "bg-slate-900 dark:bg-sky-600 border-slate-900 dark:border-sky-600 text-white"
              : "border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 group-hover:border-slate-400"
          }`}
        >
          {isChecked && <Check className="size-3.5 stroke-[3]" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
            <span>{config.label}</span>
            {config.required && (
              <span className="text-red-500 font-bold text-xs" title="Required field">
                *
              </span>
            )}
          </div>
          {config.description && (
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {config.description}
            </p>
          )}
        </div>

        {isChecked && (
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        )}
      </button>

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
              placeholder="Add observation details..."
              rows={2}
              className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/10"
            />
          </div>
        )}
      </div>
    </div>
  );
}
