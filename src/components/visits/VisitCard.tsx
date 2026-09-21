"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";

export interface VisitItem {
  id: string;
  siteName: string;
  companyName: string;
  status: "in_progress" | "completed" | "scheduled" | "draft";
  completedFields: number;
  totalFields: number;
  updatedAt: string;
  createdAt: string;
  shareToken: string;
}

interface VisitCardProps {
  visit: VisitItem;
  onCopyLink: (visit: VisitItem) => void;
  onDelete: (visit: VisitItem) => void;
}

export function VisitCard({ visit, onCopyLink, onDelete }: VisitCardProps) {
  const progressPercent = Math.round(
    (visit.completedFields / (visit.totalFields || 1)) * 100
  );

  const getStatusBadge = () => {
    switch (visit.status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
            <CheckCircle2 className="size-3" />
            <span>Completed</span>
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/50">
            <span className="size-1.5 rounded-full bg-sky-500 animate-pulse" />
            <span>In Progress</span>
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50">
            <Clock className="size-3" />
            <span>Scheduled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="group relative rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
            {visit.companyName}
          </span>
          {getStatusBadge()}
        </div>

        {/* Site Name */}
        <Link
          href={ROUTES.VISIT_DETAILS(visit.id)}
          className="block group-hover:text-slate-900 dark:group-hover:text-white"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 tracking-tight line-clamp-1 hover:underline">
            {visit.siteName}
          </h3>
        </Link>

        {/* Progress Bar & Counter */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-zinc-400 font-medium">
              Checklist Progress
            </span>
            <span className="font-semibold text-slate-700 dark:text-zinc-200">
              {visit.completedFields} / {visit.totalFields} ({progressPercent}%)
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progressPercent === 100
                  ? "bg-emerald-600 dark:bg-emerald-500"
                  : "bg-slate-900 dark:bg-zinc-200"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Date / Metadata */}
        <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500">
          <Calendar className="size-3.5" />
          <span>Last modified: {visit.updatedAt}</span>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Copy Link Button */}
          <button
            type="button"
            onClick={() => onCopyLink(visit)}
            title="Copy shareable link"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-slate-100/70 hover:bg-slate-200/70 dark:bg-zinc-800/70 dark:hover:bg-zinc-800 transition-colors"
          >
            <Copy className="size-3.5" />
            <span className="hidden sm:inline">Copy link</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(visit)}
            title="Delete visit"
            className="inline-flex items-center justify-center size-8 rounded-lg text-slate-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        {/* Open Button */}
        <Link
          href={ROUTES.VISIT_DETAILS(visit.id)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-white transition-colors"
        >
          <span>Open</span>
          <ExternalLink className="size-3" />
        </Link>
      </div>
    </div>
  );
}
