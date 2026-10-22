"use client";

import React from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { SiteSubmission } from "@/types/submission";

export interface ApproveSiteModalProps {
  isOpen: boolean;
  submission: SiteSubmission;
  allAreasOk: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ApproveSiteModal: React.FC<ApproveSiteModalProps> = ({
  isOpen,
  submission,
  allAreasOk,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

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
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
            <CheckCircle2 size={18} />
            <span>Approve Site Submission</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            You are approving the site submission for{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {submission.siteName}
            </span>{" "}
            ({submission.customer}).
          </p>

          {!allAreasOk ? (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5">
              <AlertCircle
                size={16}
                className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
              />
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <span className="font-bold block">
                  Notice: Not all areas marked OK
                </span>
                Proceeding with approval will mark all remaining areas as
                verified and change status to <strong>Approved</strong>.
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5">
              <CheckCircle2
                size={16}
                className="text-emerald-600 dark:text-emerald-400 shrink-0"
              />
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                All inspection areas have been verified and marked OK.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Confirm Approval
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

