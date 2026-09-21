"use client";

import { useState } from "react";
import { Check, Copy, Mail, Share2, X } from "lucide-react";
import { ROUTES } from "@/lib/constants";

interface ShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  siteName: string;
  shareToken: string;
  onToast: (msg: string) => void;
}

export function ShareMenu({
  isOpen,
  onClose,
  siteName,
  shareToken,
  onToast,
}: ShareMenuProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${origin}${ROUTES.SHARED_VISIT(shareToken)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    onToast("Shareable link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailDraft = () => {
    const subject = encodeURIComponent(`Site Visit Checklist Report: ${siteName}`);
    const body = encodeURIComponent(
      `Hello,\n\nPlease review the site visit checklist and survey documentation for "${siteName}" at the following link:\n\n${shareUrl}\n\nBest regards,\nEC POWER Site Visit Companion`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
    onToast("Email draft opened in your mail application");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-900 dark:text-zinc-100">
              <Share2 className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50 leading-tight">
                Share Site Visit
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Token-protected, read-only guest access
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Share Link Input with Copy Button */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
            Shareable Token URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 px-3 py-2 text-xs text-slate-700 dark:text-zinc-300 select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center size-9 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-white transition-colors shrink-0"
              title="Copy link"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>

        {/* Action Buttons (Section 13 requirement) */}
        <div className="pt-2 space-y-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-zinc-100 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white dark:text-zinc-900 shadow-sm hover:bg-slate-800 dark:hover:bg-white transition-colors"
          >
            <Copy className="size-4" />
            <span>Copy Link</span>
          </button>

          <button
            type="button"
            onClick={handleEmailDraft}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700/60 transition-colors"
          >
            <Mail className="size-4" />
            <span>Email Draft</span>
          </button>
        </div>
      </div>
    </div>
  );
}

