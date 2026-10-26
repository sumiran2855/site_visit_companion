"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { Sparkles, ChevronDown, Check } from "lucide-react";
import {
  TemplateSuggestion,
  filterSuggestions,
} from "@/utils/template-suggestions";

export interface TemplateFieldAutocompleteProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onSelectSuggestion?: (suggestion: TemplateSuggestion) => void;
  suggestions: TemplateSuggestion[];
  placeholder?: string;
  isTextarea?: boolean;
  rows?: number;
  mono?: boolean;
  rightBadge?: React.ReactNode;
  helperNode?: React.ReactNode;
  className?: string;
  sparkleHint?: string;
}

export function TemplateFieldAutocomplete({
  label,
  value,
  onChange,
  onSelectSuggestion,
  suggestions,
  placeholder,
  isTextarea = false,
  rows = 2,
  mono = false,
  rightBadge,
  helperNode,
  className = "",
  sparkleHint = "Auto-suggest from site visit form",
}: TemplateFieldAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();

  const filtered = filterSuggestions(suggestions, value, value, 10);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll active item into view when navigating via keyboard
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (suggestion: TemplateSuggestion) => {
    onChange(suggestion.text);
    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }

    if (!isOpen || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filtered.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filtered.length - 1
      );
    } else if (e.key === "Enter" && !e.shiftKey) {
      if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
        e.preventDefault();
        handleSelect(filtered[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Label & Badges Bar */}
      <div className="flex items-center justify-between mb-1">
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5"
        >
          <span>{label}</span>
          <span
            title={sparkleHint}
            className="inline-flex items-center text-[10px] text-blue-600 dark:text-blue-400 cursor-pointer"
            onClick={() => {
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
          >
            <Sparkles className="size-3" />
          </span>
        </label>
        {rightBadge}
      </div>

      {/* Input Field */}
      <div className="relative">
        {isTextarea ? (
          <textarea
            id={id}
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={rows}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(0);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8 transition-colors ${
              mono ? "font-mono" : ""
            }`}
          />
        ) : (
          <input
            id={id}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(0);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8 transition-colors ${
              mono ? "font-mono" : ""
            }`}
          />
        )}

        {/* Toggle Dropdown Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-2.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-0.5 rounded transition-colors"
          title="Toggle field suggestions"
          tabIndex={-1}
        >
          <ChevronDown
            className={`size-3.5 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-blue-500" : ""
            }`}
          />
        </button>
      </div>

      {/* Autocomplete Suggestions Popover */}
      {isOpen && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100/90 dark:bg-zinc-800/90 border-b border-slate-200/60 dark:border-zinc-700/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="size-3 text-blue-500" />
              <span>Site Visit Form Suggestions</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              {filtered.length}
            </span>
          </div>

          <ul
            ref={listRef}
            className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/60"
          >
            {filtered.map((item, idx) => {
              const isHighlighted = idx === highlightedIndex;
              const isCurrentExact =
                item.text.toLowerCase() === value.trim().toLowerCase();

              return (
                <li
                  key={item.id || item.text}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => handleSelect(item)}
                  className={`px-3 py-2 cursor-pointer transition-colors text-left flex flex-col gap-0.5 ${
                    isHighlighted
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100"
                      : "hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-800 dark:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={`text-xs font-semibold truncate ${
                        mono ? "font-mono" : ""
                      }`}
                    >
                      {item.text}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700/60">
                          {item.badge}
                        </span>
                      )}
                      {isCurrentExact && (
                        <Check className="size-3 text-emerald-500" />
                      )}
                    </div>
                  </div>

                  {/* Secondary info row */}
                  {(item.hint || item.pairedPlaceholder || item.pairedLabel) && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-zinc-400">
                      {item.hint && (
                        <span className="truncate">{item.hint}</span>
                      )}
                      {item.pairedPlaceholder && (
                        <span className="font-mono text-blue-600 dark:text-blue-400 shrink-0 ml-auto text-[9px] bg-blue-50/60 dark:bg-blue-950/40 px-1 py-0.2 rounded">
                          🔗 {item.pairedPlaceholder}
                        </span>
                      )}
                      {item.pairedLabel && !item.pairedPlaceholder && (
                        <span className="text-emerald-600 dark:text-emerald-400 shrink-0 ml-auto text-[9px]">
                          Label: {item.pairedLabel}
                        </span>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="px-3 py-1 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-100 dark:border-zinc-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Press ↑↓ to navigate, Enter to apply</span>
            <span>Esc to close</span>
          </div>
        </div>
      )}

      {/* Helper Node underneath (e.g. pills) */}
      {helperNode}
    </div>
  );
}

