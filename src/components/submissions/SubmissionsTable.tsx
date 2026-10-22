"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteSubmission } from "@/types/submission";

export interface SubmissionsTableProps {
  submissions: SiteSubmission[];
  isLoading?: boolean;
}

export const SubmissionsTable: React.FC<SubmissionsTableProps> = ({
  submissions,
  isLoading,
}) => {
  const router = useRouter();

  const renderStatusBadge = (status: SiteSubmission["status"]) => {
    switch (status) {
      case "in_review":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            In review
          </span>
        );
      case "new":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
            New
          </span>
        );
      case "waiting_for_customer":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
            Waiting for customer
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Approved
          </span>
        );
      case "draft":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
            Draft
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/90 dark:border-zinc-800 p-8 shadow-xs">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 bg-slate-100 dark:bg-zinc-800/50 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/90 dark:border-zinc-800 p-12 text-center shadow-xs">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white">
          No site submissions found
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Try adjusting your search query, status tab, or customer filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/90 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                <th className="py-3 px-5">Site</th>
                <th className="py-3 px-5">Customer</th>
                <th className="py-3 px-5">Sent By</th>
                <th className="py-3 px-5">Sent</th>
                <th className="py-3 px-5">Media</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Reviewer</th>
                <th className="py-3 px-5 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs">
              {submissions.map((sub) => {
                const locationStr = [
                  sub.location.city,
                  sub.location.state,
                  sub.location.country,
                ]
                  .filter(Boolean)
                  .join(", ");

                return (
                  <tr
                    key={sub.id}
                    onClick={() => router.push(`/admin/submissions/${sub.id}`)}
                    className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                  >
                    {/* Site Column */}
                    <td className="py-4 px-5">
                      <Link
                        href={`/admin/submissions/${sub.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-sky-800 dark:text-sky-400 hover:underline block text-[13px]"
                      >
                        {sub.siteName}
                      </Link>
                      <span className="text-slate-400 dark:text-zinc-500 text-[11px] block mt-0.5">
                        {locationStr}
                      </span>
                    </td>

                    {/* Customer Column */}
                    <td className="py-4 px-5 text-slate-700 dark:text-zinc-300 font-medium">
                      {sub.customer}
                    </td>

                    {/* Sent By Column */}
                    <td className="py-4 px-5 text-slate-600 dark:text-zinc-400">
                      {sub.sentBy}
                    </td>

                    {/* Sent Date Column */}
                    <td className="py-4 px-5 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                      {sub.formattedDate}
                    </td>

                    {/* Media Count Column */}
                    <td className="py-4 px-5 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                      {sub.mediaCount.photos} photos · {sub.mediaCount.videos}{" "}
                      videos
                    </td>

                    {/* Status Column */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      {renderStatusBadge(sub.status)}
                    </td>

                    {/* Reviewer Column */}
                    <td className="py-4 px-5 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                      {sub.reviewer || "—"}
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/submissions/${sub.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 hover:underline text-xs"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Disclaimer / Retention Note from Screenshot */}
      <p className="text-[11px] text-slate-400 dark:text-zinc-500 px-1">
        Example rows. Files are deleted automatically 12 months after a site is
        closed.
      </p>
    </div>
  );
};

