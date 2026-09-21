"use client";

import { useState } from "react";
import { CheckCircle2, MessageSquare, StickyNote } from "lucide-react";
import type { ChecklistFieldConfig } from "@/config/checklist";

interface TextFieldProps {
  config: ChecklistFieldConfig;
  value: string;
  notes?: string;
  onChange: (value: string) => void;
  onNotesChange: (notes: string) => void;
}

export function TextField({
  config,
  value,
  notes = "",
  onChange,
  onNotesChange,
}: TextFieldProps) {
  const [showNotes, setShowNotes] = useState(Boolean(notes));
  const isCompleted = Boolean(value && value.trim().length > 0);

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 p-4 space-y-3 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <label
            htmlFor={config.id}
            className="block text-sm font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5"
          >
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

        {isCompleted && (
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        )}
      </div>

      {/* Main Input */}
      <input
        id={config.id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.placeholder || "Enter text answer..."}
        className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10 transition-colors"
      />

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
                  if (!notes) setShowNotes(false);
                }}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
              >
                Hide
              </button>
            </div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Add field observations or notes..."
              className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 transition-colors resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

