"use client";

import React, { useState } from "react";
import { X, AlertCircle, PlusCircle } from "lucide-react";

export interface RequestMoreModalProps {
  isOpen: boolean;
  areaName: string;
  initialText?: string;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

export const RequestMoreModal: React.FC<RequestMoreModalProps> = ({
  isOpen,
  areaName,
  initialText = "",
  onClose,
  onSubmit,
}) => {
  const [text, setText] = useState(initialText);

  if (!isOpen) return null;

  const presets = [
    `${areaName}: meter photo is blurry – please retake close-up.`,
    `${areaName}: add photo of outside wall for exhaust, roof edge visible.`,
    `${areaName}: please verify door clearance & threshold height.`,
    `${areaName}: gas regulator tag unreadable, retake with high contrast.`,
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <AlertCircle className="text-amber-500" size={18} />
            <span>Request more information</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              Inspection Area
            </label>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700 text-xs font-bold text-slate-800 dark:text-zinc-200">
              {areaName}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              Instructions for Customer / Field Tech
            </label>
            <textarea
              rows={4}
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. meter photo is blurry – please retake close-up..."
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 p-3 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block mb-1.5">
              Quick Suggestions:
            </span>
            <div className="flex flex-col gap-1.5">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setText(preset)}
                  className="text-left text-[11px] p-2 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate mr-2">{preset}</span>
                  <PlusCircle size={13} className="shrink-0 text-slate-400" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              Queue Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

