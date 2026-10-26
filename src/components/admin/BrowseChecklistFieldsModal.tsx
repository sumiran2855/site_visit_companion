"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Search,
  Sparkles,
  Check,
  FileCode,
  Tag,
  Copy,
  Layers,
} from "lucide-react";
import { CHECKLIST_SECTIONS_CONFIG } from "@/config/checklist.config";

export interface SelectedFieldPayload {
  id: string;
  label: string;
  placeholderToken: string;
  description?: string;
  sectionTitle: string;
}

interface BrowseChecklistFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectField: (payload: SelectedFieldPayload) => void;
  currentPlaceholder?: string;
}

export function BrowseChecklistFieldsModal({
  isOpen,
  onClose,
  onSelectField,
  currentPlaceholder,
}: BrowseChecklistFieldsModalProps) {
  const [search, setSearch] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<string>("all");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const sectionsWithFilteredFields = useMemo(() => {
    const q = search.trim().toLowerCase();

    return CHECKLIST_SECTIONS_CONFIG.map((sec) => {
      // Filter fields by search query
      const matchedFields = sec.fields.filter((f) => {
        if (!q) return true;
        return (
          f.label.toLowerCase().includes(q) ||
          f.id.toLowerCase().includes(q) ||
          f.type.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q)) ||
          (f.placeholder && f.placeholder.toLowerCase().includes(q)) ||
          sec.title.toLowerCase().includes(q)
        );
      });

      return {
        ...sec,
        fields: matchedFields,
      };
    }).filter((sec) => {
      if (activeSectionId !== "all" && sec.id !== activeSectionId) return false;
      return sec.fields.length > 0;
    });
  }, [search, activeSectionId]);

  const totalMatchingFields = useMemo(() => {
    return sectionsWithFilteredFields.reduce(
      (acc, s) => acc + s.fields.length,
      0
    );
  }, [sectionsWithFilteredFields]);

  const handleCopy = (token: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-800/40">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Site Visit Form Fields</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  {totalMatchingFields} Available
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Click any field to bind its dynamic token and label to the
                selected PDF template element.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 space-y-3 bg-white dark:bg-zinc-900">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by field name, ID (e.g. mc_site_name), section, or type..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Section filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            <button
              onClick={() => setActiveSectionId("all")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                activeSectionId === "all"
                  ? "bg-blue-600 text-white font-semibold shadow-2xs"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200"
              }`}
            >
              All Sections (11)
            </button>
            {CHECKLIST_SECTIONS_CONFIG.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSectionId(sec.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                  activeSectionId === sec.id
                    ? "bg-blue-600 text-white font-semibold shadow-2xs"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200"
                }`}
              >
                Sec {sec.number}: {sec.title.split("(")[0].trim()}
              </button>
            ))}
          </div>
        </div>

        {/* Fields List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {sectionsWithFilteredFields.length === 0 ? (
            <div className="py-16 text-center">
              <Layers className="size-8 mx-auto text-slate-300 dark:text-zinc-600 mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                No fields match &quot;{search}&quot;
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Try searching for broader keywords like &quot;boiler&quot;,
                &quot;meter&quot;, or &quot;date&quot;.
              </p>
            </div>
          ) : (
            sectionsWithFilteredFields.map((sec) => (
              <div key={sec.id} className="space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="size-5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center">
                      {sec.number}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      {sec.title}
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {sec.fields.length} items
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sec.fields.map((field) => {
                    const token = `{{field:${field.id}}}`;
                    const isSelected = currentPlaceholder === token;

                    return (
                      <div
                        key={field.id}
                        onClick={() =>
                          onSelectField({
                            id: field.id,
                            label: field.label,
                            placeholderToken: token,
                            description: field.description || field.placeholder,
                            sectionTitle: sec.title,
                          })
                        }
                        className={`group relative p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20"
                            : "bg-slate-50/60 dark:bg-zinc-800/40 border-slate-200/80 dark:border-zinc-800 hover:bg-slate-100/80 dark:hover:bg-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                            {field.label}
                          </h4>
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700/60">
                            {field.type}
                          </span>
                        </div>

                        {/* Description or placeholder if available */}
                        {(field.description || field.placeholder) && (
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-1 mb-2">
                            {field.description || field.placeholder}
                          </p>
                        )}

                        {/* Token pill & Actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800/60">
                          <code className="text-[10px] font-mono font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded">
                            {token}
                          </code>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleCopy(token, e)}
                              title="Copy placeholder token"
                              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
                            >
                              {copiedToken === token ? (
                                <Check className="size-3 text-emerald-500" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>

                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                              Insert →
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <span>Tip: selecting binds token to placeholder &amp; auto-fills label</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 font-semibold text-slate-700 dark:text-zinc-200 text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

