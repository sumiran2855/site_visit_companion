"use client";

import React from "react";
import { ChevronDown, Info } from "lucide-react";
import type { ChecklistSectionConfig } from "@/config/checklist";
import { TextField } from "./TextField";
import { PhotoField, type PhotoMediaItem } from "./PhotoField";
import { VideoField, type VideoMediaItem } from "./VideoField";

interface ChecklistSectionProps {
  section: ChecklistSectionConfig;
  isOpen: boolean;
  onToggle: () => void;
  formValues: Record<string, string>;
  formNotes: Record<string, string>;
  formPhotos: Record<string, PhotoMediaItem[]>;
  formVideos: Record<string, VideoMediaItem[]>;
  onTextChange: (fieldId: string, value: string) => void;
  onNotesChange: (fieldId: string, notes: string) => void;
  onAddPhotos: (fieldId: string, photos: PhotoMediaItem[]) => void;
  onRemovePhoto: (fieldId: string, photoId: string) => void;
  onAddVideos: (fieldId: string, videos: VideoMediaItem[]) => void;
  onRemoveVideo: (fieldId: string, videoId: string) => void;
}

export function ChecklistSection({
  section,
  isOpen,
  onToggle,
  formValues,
  formNotes,
  formPhotos,
  formVideos,
  onTextChange,
  onNotesChange,
  onAddPhotos,
  onRemovePhoto,
  onAddVideos,
  onRemoveVideo,
}: ChecklistSectionProps) {
  // Calculate completed fields in this section
  const totalFields = section.fields.length;
  const completedFields = section.fields.filter((field) => {
    if (field.type === "text") {
      const val = formValues[field.id];
      return Boolean(val && val.trim().length > 0);
    }
    if (field.type === "photo") {
      const photos = formPhotos[field.id] || [];
      return photos.length > 0;
    }
    if (field.type === "video") {
      const vids = formVideos[field.id] || [];
      return vids.length > 0;
    }
    return false;
  }).length;

  const isAllComplete = completedFields === totalFields && totalFields > 0;

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-sm overflow-hidden transition-all">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="flex items-center justify-center size-8 rounded-lg bg-slate-100 dark:bg-zinc-800 font-bold text-xs text-slate-700 dark:text-zinc-300 shrink-0">
            {section.number}
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-zinc-500 uppercase">
              SECTION {section.number}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-50 truncate">
              {section.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isAllComplete
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50"
                : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
            }`}
          >
            {completedFields} / {totalFields}
          </span>
          <ChevronDown
            className={`size-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="px-5 pb-6 pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-4">
          {/* Section Instructions Banner (Section 10 requirement) */}
          {section.instructions && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 text-amber-900 dark:text-amber-300 text-xs sm:text-sm leading-relaxed">
              <Info className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <p>{section.instructions}</p>
            </div>
          )}

          {/* List of Section Fields */}
          <div className="space-y-4 pt-1">
            {section.fields.map((field) => {
              if (field.type === "text") {
                return (
                  <TextField
                    key={field.id}
                    config={field}
                    value={formValues[field.id] || ""}
                    notes={formNotes[field.id] || ""}
                    onChange={(val) => onTextChange(field.id, val)}
                    onNotesChange={(notes) => onNotesChange(field.id, notes)}
                  />
                );
              }
              if (field.type === "photo") {
                return (
                  <PhotoField
                    key={field.id}
                    config={field}
                    photos={formPhotos[field.id] || []}
                    notes={formNotes[field.id] || ""}
                    onAddPhotos={(newPhotos) => onAddPhotos(field.id, newPhotos)}
                    onRemovePhoto={(photoId) => onRemovePhoto(field.id, photoId)}
                    onNotesChange={(notes) => onNotesChange(field.id, notes)}
                  />
                );
              }
              if (field.type === "video") {
                return (
                  <VideoField
                    key={field.id}
                    config={field}
                    videos={formVideos[field.id] || []}
                    notes={formNotes[field.id] || ""}
                    onAddVideos={(newVideos) => onAddVideos(field.id, newVideos)}
                    onRemoveVideo={(videoId) => onRemoveVideo(field.id, videoId)}
                    onNotesChange={(notes) => onNotesChange(field.id, notes)}
                  />
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

