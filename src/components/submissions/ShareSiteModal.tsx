"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Mail,
  ShieldCheck,
  Loader2,
  Calendar,
} from "lucide-react";
import { SiteSubmission } from "@/types/submission";
import { HttpClient } from "@/lib/api/httpClient";
import { API_CONFIG } from "@/config/api.config";

export interface ShareSiteModalProps {
  isOpen: boolean;
  submission: SiteSubmission;
  onClose: () => void;
}

export const ShareSiteModal: React.FC<ShareSiteModalProps> = ({
  isOpen,
  submission,
  onClose,
}) => {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (!isOpen || !submission?.id) return;

    const fetchOrCreateToken = async () => {
      setIsGenerating(true);
      try {
        // 1. Try backend API share token endpoint
        const http = HttpClient.getInstance();
        const res = await http.post<{ token: string; expiresAt?: string }>(
          `/visits/${submission.id}/share`,
          { expiresInDays: 30 }
        );

        const token = (res?.data as any)?.token || (res as any)?.token;
        if (isMounted && token) {
          setShareToken(token);
          return;
        }
      } catch (err) {
        console.warn("[ShareSiteModal] Backend share token API failed, trying Supabase fallback:", err);
      }

      // 2. Direct Supabase fallback: check existing active token in share_tokens table
      try {
        const sbUrl = API_CONFIG.SUPABASE_URL;
        const sbKey = API_CONFIG.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_ANON_KEY;
        const res = await fetch(
          `${sbUrl}/rest/v1/share_tokens?visit_id=eq.${encodeURIComponent(submission.id)}&order=created_at.desc&limit=1`,
          {
            headers: {
              apikey: sbKey,
              Authorization: `Bearer ${sbKey}`,
            },
          }
        );
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0 && rows[0].token) {
            if (isMounted) setShareToken(rows[0].token);
            return;
          }
        }
      } catch {}

      // 3. Fallback to submission.id (both token and visitId are supported by /shared/[token])
      if (isMounted) {
        setShareToken(submission.id);
      }
    };

    fetchOrCreateToken().finally(() => {
      if (isMounted) setIsGenerating(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, submission?.id]);

  if (!isOpen) return null;

  // Build the public share link
  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://site-visit-companion.vercel.app";

  const activeIdentifier = shareToken || submission.id;
  const shareUrl = `${origin}/shared/${activeIdentifier}`;

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenPreview = () => {
    window.open(shareUrl, "_blank");
  };

  const handleDraftEmail = () => {
    const subject = encodeURIComponent(
      `Site Inspection Report: ${submission.siteName}`
    );
    const body = encodeURIComponent(
      `Hello,\n\nPlease review the preliminary site inspection and technical feasibility assessment for "${submission.siteName}".\n\nOfficial Audit Link: ${shareUrl}\n\nClient: ${submission.customer}\nAudited by: ${submission.sentBy}\n\nRegards,\nEC POWER Team`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Share2 size={17} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                Share Inspection with Client
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                Generate read-only access link
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            Share read-only access to{" "}
            <strong className="text-slate-900 dark:text-white">
              &ldquo;{submission.siteName}&rdquo;
            </strong>{" "}
            with facility managers, engineers, or clients. The link allows inspecting
            the verified checklist, photo evidence, and downloading the official report PDF.
          </p>

          {/* Security & Access Badge */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 text-[11px] text-slate-600 dark:text-zinc-300">
            <ShieldCheck size={15} className="text-emerald-500 shrink-0" />
            <span>Read-only access • No account or login required for clients</span>
          </div>

          {/* Share Link Preview Box */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
              Shareable Web Link
            </label>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 flex items-center justify-between gap-2">
              <span className="flex-1 text-xs font-mono text-slate-700 dark:text-zinc-300 truncate">
                {shareUrl}
              </span>

              {isGenerating ? (
                <Loader2 size={15} className="text-sky-600 animate-spin shrink-0" />
              ) : (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-white dark:bg-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-600 text-slate-600 dark:text-zinc-200 shadow-2xs transition-colors cursor-pointer shrink-0"
                  title="Copy link"
                >
                  {copied ? (
                    <Check size={14} className="text-emerald-600" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              )}
            </div>
            {isGenerating && (
              <p className="text-[10px] text-sky-600 dark:text-sky-400">
                Generating secure share token...
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {/* Primary: Copy Link */}
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white"
              }`}
            >
              {copied ? (
                <>
                  <Check size={15} strokeWidth={2.5} />
                  <span>Link Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy size={15} />
                  <span>Copy Secure Link</span>
                </>
              )}
            </button>

            {/* Secondary Options Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenPreview}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ExternalLink size={13} className="text-slate-400" />
                <span>Open in Web</span>
              </button>

              <button
                type="button"
                onClick={handleDraftEmail}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Mail size={13} className="text-slate-400" />
                <span>Draft Email</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

