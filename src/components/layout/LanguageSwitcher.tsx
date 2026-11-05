"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { SupportedLanguageCode } from "@/i18n/config";

interface LanguageSwitcherProps {
  className?: string;
  align?: "left" | "right";
}

export function LanguageSwitcher({
  className = "",
  align = "right",
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentLanguage, supportedLanguages, changeLanguage, t } =
    useLanguage();

  // Close on outside click or touch
  useEffect(() => {
    function handleOutsideInteraction(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideInteraction);
      document.addEventListener("touchstart", handleOutsideInteraction, {
        passive: true,
      });
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideInteraction);
      document.removeEventListener("touchstart", handleOutsideInteraction);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectLanguage = (code: SupportedLanguageCode) => {
    changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
    >
      {/* Switcher Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t("language.select", {
          defaultValue: "Select language",
        })}
        className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-slate-900 dark:focus-visible:outline-zinc-100 select-none"
      >
        <Globe className="size-3.5 text-slate-500 dark:text-zinc-400 shrink-0" />
        <span className="flex items-center gap-1.5">
          <span className="text-sm leading-none">{currentLanguage.flag}</span>
          <span className="hidden sm:inline font-medium">
            {currentLanguage.nativeName}
          </span>
          <span className="sm:hidden font-semibold uppercase text-[11px]">
            {currentLanguage.code}
          </span>
        </span>
        <ChevronDown
          className={`size-3 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div
          role="listbox"
          aria-label={t("language.select", {
            defaultValue: "Select language",
          })}
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } top-full mt-2 w-48 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl shadow-slate-900/20 dark:shadow-black/70 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-slate-900/5 dark:ring-white/10`}
        >
          <div className="px-2.5 py-1 mb-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-zinc-500">
            {t("language.select", {
              defaultValue: "Select language",
            })}
          </div>
          <div className="space-y-0.5">
            {supportedLanguages.map((lang) => {
              const isSelected = lang.code === currentLanguage.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onPointerDown={(e) => {
                    // Prevent default bubbling that may cause outside click handlers to misfire
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectLanguage(lang.code as SupportedLanguageCode);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left touch-manipulation ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-900 font-semibold"
                      : "text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 active:bg-slate-200 dark:active:bg-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className="leading-tight font-medium">
                        {lang.nativeName}
                      </span>
                      {lang.nativeName !== lang.name && (
                        <span
                          className={`text-[10px] leading-tight ${
                            isSelected
                              ? "text-slate-300 dark:text-zinc-600"
                              : "text-slate-400 dark:text-zinc-500"
                          }`}
                        >
                          {lang.name}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <Check
                      className={`size-4 shrink-0 ${
                        isSelected
                          ? "text-white dark:text-zinc-900"
                          : "text-slate-900 dark:text-white"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
