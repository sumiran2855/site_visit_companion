"use client";

import { useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  FileImage,
  ImageIcon,
  MessageSquare,
  StickyNote,
  Trash2,
  Upload,
} from "lucide-react";
import type { ChecklistFieldConfig } from "@/config/checklist";

export interface PhotoMediaItem {
  id: string;
  fileName: string;
  fileSize: string;
  url?: string;
  notes?: string;
}

interface PhotoFieldProps {
  config: ChecklistFieldConfig;
  photos: PhotoMediaItem[];
  notes?: string;
  onAddPhotos: (newPhotos: PhotoMediaItem[]) => void;
  onRemovePhoto: (id: string) => void;
  onNotesChange: (notes: string) => void;
}

export function PhotoField({
  config,
  photos,
  notes = "",
  onAddPhotos,
  onRemovePhoto,
  onNotesChange,
}: PhotoFieldProps) {
  const [showNotes, setShowNotes] = useState(Boolean(notes));
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const isCompleted = photos.length > 0;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: PhotoMediaItem[] = Array.from(files).map((file) => {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fileName: file.name,
        fileSize: `${sizeInMB} MB`,
        url: URL.createObjectURL(file),
      };
    });

    onAddPhotos(newItems);
  };

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 p-4 space-y-3.5 transition-all">
      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
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
        accept="image/*"
        multiple
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
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-200/60 dark:border-sky-800/50">
              <ImageIcon className="size-3" />
              <span>Photo</span>
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

      {/* Photo Actions: Camera vs Library */}
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-zinc-100 px-4 py-2 text-xs sm:text-sm font-semibold text-white dark:text-zinc-900 shadow-sm hover:bg-slate-800 dark:hover:bg-white active:scale-[0.98] transition-all"
        >
          <Camera className="size-4" />
          <span>Take photo</span>
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700/60 transition-colors"
        >
          <Upload className="size-4" />
          <span>Choose from library</span>
        </button>
      </div>

      {/* Uploaded Photos Grid / Cards */}
      {photos.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="flex items-center justify-between gap-2.5 p-2.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {photo.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={photo.url}
                      alt={photo.fileName}
                      className="size-10 rounded-md object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                    />
                  ) : (
                    <div className="size-10 rounded-md bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-slate-500 shrink-0">
                      <FileImage className="size-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-zinc-200 truncate">
                      {photo.fileName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {photo.fileSize}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemovePhoto(photo.id)}
                  title="Remove photo"
                  className="size-8 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-colors shrink-0"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Field Notes Toggle & Expandable Area */}
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
              placeholder="Add observation notes for this photo..."
              className="w-full rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 transition-colors resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
