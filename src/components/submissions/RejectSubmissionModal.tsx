"use client";

import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

export interface RejectSubmissionModalProps {
  isOpen: boolean;
  siteName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const RejectSubmissionModal: React.FC<RejectSubmissionModalProps> = ({
  isOpen,
  siteName,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-base">
            <AlertTriangle size={18} />
            <span>Reject Site Submission</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-zinc-400">
            You are about to reject the site submission for{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {siteName}
            </span>
            . Please provide an explanation that will be returned to the
            customer.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              Rejection Reason
            </label>
            <textarea
              rows={4}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Electrical tie-in capacity insufficient for XRGI unit without sub-station transformer upgrade..."
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 p-3 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
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
              disabled={!reason.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              Reject Site
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

