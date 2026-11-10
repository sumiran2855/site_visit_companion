"use client";

import React, { useState } from "react";
import { X, Send, AlertCircle } from "lucide-react";
import { useTranslation } from "@/i18n";

export interface RequestMoreModalProps {
  isOpen: boolean;
  areaName: string;
  onClose: () => void;
  onSubmit: (text: string) => void | Promise<void>;
}

export function RequestMoreModal({
  isOpen,
  areaName,
  onClose,
  onSubmit,
}: RequestMoreModalProps) {
  const { t } = useTranslation();
  const [requestText, setRequestText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quickPresets = [
    {
      id: "clearerPhoto",
      text: t("modals.requestMore.presets.clearerPhoto", "Clearer photo of nameplate / serial tag"),
    },
    {
      id: "retakeBlurry",
      text: t("modals.requestMore.presets.retakeBlurry", "Retake blurry photo with more light / flash"),
    },
    {
      id: "widerAngle",
      text: t("modals.requestMore.presets.widerAngle", "Take additional angle showing wider pipe run"),
    },
    {
      id: "verifyModelSerial",
      text: t("modals.requestMore.presets.verifyModelSerial", "Verify and record equipment model and serial number"),
    },
    {
      id: "measurePipe",
      text: t("modals.requestMore.presets.measurePipe", "Measure and note pipe diameter / connection sizing"),
    },
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = requestText.trim();
    if (!clean) return;

    setIsSubmitting(true);
    try {
      await onSubmit(clean);
      setRequestText("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyPreset = (preset: string) => {
    setRequestText((prev) => {
      if (!prev.trim()) return preset;
      return `${prev.trim()}\n• ${preset}`;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t("modals.requestMore.title", "Request Updates on Area")}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {t("modals.requestMore.targetArea", "Target area:")}{" "}
              <span className="font-semibold text-slate-800 dark:text-zinc-200">{areaName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              {t("modals.requestMore.detailsLabel", "Request Details / Instructions for Technician")}
            </label>
            <textarea
              rows={4}
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder={t("modals.requestMore.placeholder", "Describe what needs to be retaken, inspected or clarified...")}
              required
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-1.5">
              {t("modals.requestMore.quickPresetsLabel", "Quick Suggestion Presets:")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p.text)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[11px] text-slate-700 dark:text-zinc-300 transition-colors text-left cursor-pointer"
                >
                  + {p.text}
                </button>
              ))}
            </div>
          </div>

          {/* Notice */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-2.5">
            <AlertCircle size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
              {t(
                "modals.requestMore.notice",
                `This request will be displayed directly on the technician's mobile app on the "${areaName}" section, prompting them to provide additional photos or explanations.`,
                { area: areaName }
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !requestText.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send size={13} />
              <span>
                {isSubmitting
                  ? t("modals.requestMore.sending", "Submitting...")
                  : t("modals.requestMore.send", "Queue Feedback")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RequestMoreModal;
