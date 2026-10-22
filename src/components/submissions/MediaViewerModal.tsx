"use client";

import React, { useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Video,
  Image as ImageIcon,
  Maximize2,
} from "lucide-react";
import { SubmissionMedia } from "@/types/submission";

export interface MediaViewerModalProps {
  media: SubmissionMedia | null;
  areaName?: string;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasMultiple?: boolean;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  media,
  areaName,
  onClose,
  onNext,
  onPrev,
  hasMultiple,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && onNext) onNext();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
    },
    [onClose, onNext, onPrev]
  );

  useEffect(() => {
    if (media) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [media, handleKeyDown]);

  if (!media) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                media.type === "video"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
              }`}
            >
              {media.type === "video" ? (
                <Video size={13} />
              ) : (
                <ImageIcon size={13} />
              )}
              {media.type}
            </span>
            <div>
              <h4 className="text-sm font-semibold text-white">
                {media.title}
              </h4>
              <p className="text-[11px] text-slate-400">
                {areaName ? `${areaName} · ` : ""}
                {media.takenAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={media.url}
              download={`${media.title.replace(/\s+/g, "_")}.jpg`}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Download full media"
            >
              <Download size={18} />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Media Content Display */}
        <div className="relative flex-1 bg-black/60 flex items-center justify-center p-4 min-h-[350px] overflow-hidden">
          {hasMultiple && onPrev && (
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/70 hover:bg-slate-800 text-white border border-slate-700/50 shadow-lg cursor-pointer transition-all z-10"
              title="Previous file (Left Arrow)"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {media.type === "video" ? (
            <div className="w-full max-w-3xl aspect-video rounded-lg overflow-hidden bg-slate-950 flex flex-col items-center justify-center relative">
              <img
                src={media.url}
                alt={media.title}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                <div className="w-16 h-16 rounded-full bg-sky-600/90 text-white flex items-center justify-center shadow-lg">
                  <Video size={30} />
                </div>
                <span className="mt-3 text-xs font-medium text-slate-200 bg-slate-900/80 px-3 py-1 rounded-full">
                  360° Video Recording ({media.duration || "0:45"})
                </span>
              </div>
            </div>
          ) : (
            <div className="relative max-h-[65vh] flex items-center justify-center">
              <img
                src={media.url}
                alt={media.title}
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-md"
              />
            </div>
          )}

          {hasMultiple && onNext && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/70 hover:bg-slate-800 text-white border border-slate-700/50 shadow-lg cursor-pointer transition-all z-10"
              title="Next file (Right Arrow)"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900 text-xs text-slate-400 flex items-center justify-between">
          <span>
            {media.resolution ? `Resolution: ${media.resolution}` : ""}{" "}
            {media.fileSize ? `· Size: ${media.fileSize}` : ""}
          </span>
          <span className="text-[11px] text-slate-500">
            Linked to inspection field: {media.fieldId}
          </span>
        </div>
      </div>
    </div>
  );
};

