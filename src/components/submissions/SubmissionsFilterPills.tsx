"use client";

import React from "react";
import { SubmissionStatus } from "@/types/submission";
import { useTranslation } from "@/i18n";

export interface SubmissionsFilterPillsProps {
  activeStatus: SubmissionStatus;
  onChange: (status: SubmissionStatus) => void;
  counts: {
    all: number;
    completed: number;
    in_progress: number;
    draft: number;
  };
}

export const SubmissionsFilterPills: React.FC<SubmissionsFilterPillsProps> = ({
  activeStatus,
  onChange,
  counts,
}) => {
  const { t } = useTranslation();

  const tabs: { id: SubmissionStatus; label: string; count?: number }[] = [
    { id: "all", label: t("submissions.filterPills.all", "All"), count: counts.all },
    { id: "completed", label: t("submissions.filterPills.completed", "Completed"), count: counts.completed },
    { id: "in_progress", label: t("submissions.filterPills.in_progress", "In progress"), count: counts.in_progress },
    { id: "draft", label: t("submissions.filterPills.draft", "Drafts"), count: counts.draft },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((tab) => {
        const isActive = activeStatus === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              isActive
                ? "bg-slate-900 text-white shadow-xs dark:bg-sky-500 dark:text-slate-950 font-semibold"
                : "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-800/80"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`ml-1.5 ${
                  isActive
                    ? "text-slate-300 dark:text-slate-900 font-bold"
                    : "text-slate-500 dark:text-zinc-400"
                }`}
              >
                · {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

