"use client";

import { useState, useMemo } from "react";
import { Search, FolderX } from "lucide-react";
import { VisitCard, type VisitItem } from "./VisitCard";

interface VisitListProps {
  visits: VisitItem[];
  companies: string[];
  selectedCompany: string;
  onCompanyChange: (company: string) => void;
  onCopyLink: (visit: VisitItem) => void;
  onDelete: (visit: VisitItem) => void;
  isAdmin?: boolean;
}

export function VisitList({
  visits,
  companies,
  selectedCompany,
  onCompanyChange,
  onCopyLink,
  onDelete,
  isAdmin = false,
}: VisitListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      if (selectedCompany !== "all" && v.companyName !== selectedCompany) {
        return false;
      }
      if (statusFilter !== "all" && v.status !== statusFilter) {
        return false;
      }
      if (
        searchQuery.trim() &&
        !v.siteName.toLowerCase().includes(searchQuery.toLowerCase().trim())
      ) {
        return false;
      }
      return true;
    });
  }, [visits, selectedCompany, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search visits by site or building..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-4 py-2 pl-9 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10 transition-colors"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedCompany}
                onChange={(e) => onCompanyChange(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300 focus:border-slate-900 focus:outline-none transition-colors cursor-pointer"
              >
                <option value="all">All Companies</option>
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-zinc-800/80 p-1 border border-slate-200/80 dark:border-zinc-700/80 text-xs font-medium">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "all"
                  ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm font-semibold"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All ({visits.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("in_progress")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "in_progress"
                  ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm font-semibold"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "completed"
                  ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm font-semibold"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {filteredVisits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVisits.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={visit}
              onCopyLink={onCopyLink}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-zinc-800 p-12 text-center bg-white/50 dark:bg-zinc-900/50">
          <div className="size-12 mx-auto flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 mb-3">
            <FolderX className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
            No site visits found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-1">
            {searchQuery
              ? `No site visits matched "${searchQuery}". Try adjusting your search query.`
              : "You haven't recorded any visits under this selection yet. Start a new visit above to get started."}
          </p>
        </div>
      )}
    </div>
  );
}

