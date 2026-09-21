"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  FileVideo,
  MessageSquare,
  StickyNote,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import type { ChecklistFieldConfig } from "@/config/checklist";

export interface VideoMediaItem {
  id: string;
  fileName: string;
  fileSize: string;
  url?: string;
  notes?: string;
}

interface VideoFieldProps {
  config: ChecklistFieldConfig;
  videos: VideoMediaItem[];
  notes?: string;
  onAddVideos: (newVideos: VideoMediaItem[]) => void;
  onRemoveVideo: (id: string) => void;
  onNotesChange: (notes: string) => void;
}

export function VideoField({
  config,
  videos,
  notes = "",
  onAddVideos,
  onRemoveVideo,
  onNotesChange,
}: VideoFieldProps) {
  const [showNotes, setShowNotes] = useState(Boolean(notes));
  const recordInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const isCompleted = videos.length > 0;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: VideoMediaItem[] = Array.from(files).map((file) => {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fileName: file.name,
        fileSize: `${sizeInMB} MB`,
        url: URL.createObjectURL(file),
      };
    });

    onAddVideos(newItems);
  };

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 p-4 space-y-3.5 transition-all">
      {/* Hidden File Inputs */}
      <input
        ref={recordInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Field Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-800/50">
              <Video className="size-3" />
              <span>Video</span>
            </span>
            <label className="text-sm font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1">
              <span>{config.label}</span>
              {config.required && (
                <span className="text-red-500 font-bold text-xs" title="Required field">
                  *
                </span>
              )}
            </label>
          </div>

          {config.instructions && (
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 italic">
              &ldquo;{config.instructions}&rdquo;
            </p>
          )}
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

      {/* Video Actions: Record vs Library */}
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => recordInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-900 dark:bg-purple-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-purple-800 dark:hover:bg-purple-500 active:scale-[0.98] transition-all"
        >
          <Video className="size-4" />
          <span>Record video</span>
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700/60 transition-colors"
        >
          <Upload className="size-4" />
          <span>Choose video</span>
        </button>
      </div>

      {/* Uploaded Videos List */}
      {videos.length > 0 && (
        <div className="space-y-2 pt-1">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="flex items-center justify-between gap-2.5 p-2.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-10 rounded-md bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <FileVideo className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-zinc-200 truncate">
                    {vid.fileName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {vid.fileSize}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRemoveVideo(vid.id)}
                title="Remove video"
                className="size-8 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-colors shrink-0"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notes Toggle */}
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
              placeholder="Add observation notes for this video recording..."
              className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 transition-colors resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

