"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  CloudCheck,
  Copy,
  Download,
  Eye,
  FileCode,
  FileDown,
  FileText,
  Grid,
  Heading,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Maximize2,
  Minimize2,
  Minus,
  MoveDown,
  MoveUp,
  PanelLeft,
  PanelRight,
  Plus,
  Printer,
  Redo2,
  RotateCcw,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  Type,
  Undo2,
  X,
  Zap,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type {
  PDFTemplate,
  TemplateElement,
  TemplateElementType,
  TemplatePage,
} from "@/types/template";

// Initial default factory layout matching walkthrough_page-08.png
const DEFAULT_PAGE_1_ELEMENTS: TemplateElement[] = [
  {
    id: "el-cover-1",
    type: "cover_header",
    label: "EC POWER Header",
    content: "Site Visit Checklist - Part 1 of 3 - Project Intake",
    placeholder: "EC POWER Inc. Field Assessment",
    width: "full",
  },
  {
    id: "el-field-site",
    type: "field",
    label: "Site Name",
    placeholder: "{{field:site_name}}",
    width: "half",
    fontSize: "lg",
  },
  {
    id: "el-field-date",
    type: "field",
    label: "Meeting date",
    placeholder: "[value]",
    width: "half",
  },
  {
    id: "el-heading-1",
    type: "heading",
    label: "§ meeting",
    content: "Section: Initial Consultation & Stakeholders",
    width: "full",
  },
  {
    id: "el-field-addr",
    type: "field",
    label: "Site address",
    placeholder: "[value]",
    width: "half",
  },
  {
    id: "el-field-contact",
    type: "field",
    label: "Primary contact name",
    placeholder: "[value]",
    width: "half",
  },
  {
    id: "el-field-role",
    type: "field",
    label: "Contact role",
    placeholder: "[value]",
    width: "half",
  },
  {
    id: "el-field-phone",
    type: "field",
    label: "Contact phone",
    placeholder: "[value]",
    width: "half",
  },
  {
    id: "el-field-attendees",
    type: "field",
    label: "EC POWER / partner attendees",
    placeholder: "[value]",
    width: "full",
  },
  {
    id: "el-divider-1",
    type: "divider",
    width: "full",
  },
  {
    id: "el-heading-2",
    type: "heading",
    label: "§ Boiler / Mechanical Room",
    content: "Physical Plant Assessment & Access Notes",
    width: "full",
  },
  {
    id: "el-field-boiler-model",
    type: "field",
    label: "Existing Boiler Manufacturer & Model",
    placeholder: "[value]",
    width: "half",
  },
  {
    id: "el-field-gas-pressure",
    type: "field",
    label: "Incoming Natural Gas / LPG Pressure (mbar)",
    placeholder: "[value]",
    width: "half",
  },
  {
    id: "el-photos-1",
    type: "photo_grid",
    label: "Boiler Room Photographic Evidence",
    content: "Up to 3 high-resolution tagged media attachments",
    columns: 3,
    width: "full",
  },
];

const DEFAULT_PAGE_2_ELEMENTS: TemplateElement[] = [
  {
    id: "el-heading-checklist",
    type: "heading",
    label: "§ Systematic Technical Checklist",
    content: "Verified field questionnaire and automated compliance checks",
    width: "full",
  },
  {
    id: "el-autoflow",
    type: "autoflow_checklist",
    label: "Auto-flow Checklist Table",
    content: "All sections, questions, technician notes, and Pass/Fail/NA statuses",
    width: "full",
  },
  {
    id: "el-divider-2",
    type: "divider",
    width: "full",
  },
  {
    id: "el-field-signoff",
    type: "field",
    label: "Lead Technician Sign-off",
    placeholder: "{{technician:signature}}",
    width: "half",
  },
  {
    id: "el-field-sign-date",
    type: "field",
    label: "Sign-off Timestamp",
    placeholder: "{{timestamp}}",
    width: "half",
  },
];

const INITIAL_PAGES: TemplatePage[] = [
  {
    id: "page-1",
    title: "Page 1",
    pageNumber: 1,
    elements: DEFAULT_PAGE_1_ELEMENTS,
  },
  {
    id: "page-2",
    title: "Page 2",
    pageNumber: 2,
    elements: DEFAULT_PAGE_2_ELEMENTS,
  },
];

export default function AdminTemplatePage() {
  const [pages, setPages] = useState<TemplatePage[]>(INITIAL_PAGES);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    "el-field-site"
  );
  const [zoomLevel, setZoomLevel] = useState(90); // default 90% as seen in screenshot
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">(
    "saved"
  );

  // History stack for Undo / Redo
  const [history, setHistory] = useState<TemplatePage[][]>([INITIAL_PAGES]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Modals state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isBlankPdfModalOpen, setIsBlankPdfModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Mobile layout tab switcher: "palette" | "canvas" | "inspector"
  const [mobileTab, setMobileTab] = useState<"palette" | "canvas" | "inspector">(
    "canvas"
  );

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const activePage = pages[activePageIndex] || pages[0];
  const selectedElement = activePage.elements.find(
    (el) => el.id === selectedElementId
  );

  // Helper to commit changes and record history
  const updatePagesWithHistory = (newPages: TemplatePage[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newPages);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setPages(newPages);
    setSaveStatus("unsaved");
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setPages(history[prevIndex]);
      showToast("Undone last change.");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setPages(history[nextIndex]);
      showToast("Redone change.");
    }
  };

  // Add an element to the active page
  const handleAddElement = (type: TemplateElementType) => {
    const id = `el-${type}-${Date.now().toString().slice(-4)}`;
    let newElement: TemplateElement;

    switch (type) {
      case "cover_header":
        newElement = {
          id,
          type,
          label: "EC POWER Header",
          content: "Site Visit Checklist - Project Intake",
          placeholder: "EC POWER Inc. Field Assessment",
          width: "full",
        };
        break;
      case "heading":
        newElement = {
          id,
          type,
          label: "§ New Section Heading",
          content: "Section description or guidelines",
          width: "full",
        };
        break;
      case "text_block":
        newElement = {
          id,
          type,
          label: "Information block",
          content:
            "Enter operational instructions, site safety notices, or customer disclaimers here.",
          width: "full",
          fontSize: "sm",
        };
        break;
      case "field":
        newElement = {
          id,
          type,
          label: "Field Label",
          placeholder: "[value]",
          width: "half",
          fontSize: "sm",
        };
        break;
      case "photo_grid":
        newElement = {
          id,
          type,
          label: "Site Photographs",
          content: "Media evidence attachments",
          columns: 3,
          width: "full",
        };
        break;
      case "divider":
        newElement = {
          id,
          type,
          label: "Divider",
          width: "full",
        };
        break;
      case "logo":
        newElement = {
          id,
          type,
          label: "Organization Logo",
          content: "EC POWER Primary Crest",
          width: "half",
          align: "left",
        };
        break;
      case "autoflow_checklist":
        newElement = {
          id,
          type,
          label: "Auto-flow Checklist",
          content: "Dynamic verification tables and responses",
          width: "full",
        };
        break;
      default:
        newElement = { id, type, label: "New Element", width: "full" };
    }

    const updatedPages = pages.map((page, idx) =>
      idx === activePageIndex
        ? { ...page, elements: [...page.elements, newElement] }
        : page
    );

    updatePagesWithHistory(updatedPages);
    setSelectedElementId(id);
    showToast(`Added ${newElement.label} to ${activePage.title}.`);
    // On mobile, jump to canvas to see the new element
    setMobileTab("canvas");
  };

  // Reorder elements
  const handleMoveElement = (elementId: string, direction: "up" | "down") => {
    const curElements = [...activePage.elements];
    const index = curElements.findIndex((el) => el.id === elementId);
    if (index === -1) return;

    if (direction === "up" && index > 0) {
      const temp = curElements[index];
      curElements[index] = curElements[index - 1];
      curElements[index - 1] = temp;
    } else if (direction === "down" && index < curElements.length - 1) {
      const temp = curElements[index];
      curElements[index] = curElements[index + 1];
      curElements[index + 1] = temp;
    } else {
      return;
    }

    const updatedPages = pages.map((page, idx) =>
      idx === activePageIndex ? { ...page, elements: curElements } : page
    );
    updatePagesWithHistory(updatedPages);
  };

  // Delete element
  const handleDeleteElement = (elementId: string) => {
    const updatedPages = pages.map((page, idx) =>
      idx === activePageIndex
        ? {
            ...page,
            elements: page.elements.filter((el) => el.id !== elementId),
          }
        : page
    );
    updatePagesWithHistory(updatedPages);
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
    showToast("Element removed from canvas.");
  };

  // Update selected element property
  const handleUpdateSelectedElement = (updates: Partial<TemplateElement>) => {
    if (!selectedElementId) return;

    const updatedPages = pages.map((page, idx) =>
      idx === activePageIndex
        ? {
            ...page,
            elements: page.elements.map((el) =>
              el.id === selectedElementId ? { ...el, ...updates } : el
            ),
          }
        : page
    );

    updatePagesWithHistory(updatedPages);
  };

  // Add Page
  const handleAddPage = () => {
    const newPageNum = pages.length + 1;
    const newPage: TemplatePage = {
      id: `page-${newPageNum}`,
      title: `Page ${newPageNum}`,
      pageNumber: newPageNum,
      elements: [
        {
          id: `el-heading-p${newPageNum}`,
          type: "heading",
          label: `§ Section ${newPageNum}`,
          content: "Additional Checklist Section",
          width: "full",
        },
      ],
    };

    const updatedPages = [...pages, newPage];
    updatePagesWithHistory(updatedPages);
    setActivePageIndex(updatedPages.length - 1);
    setSelectedElementId(`el-heading-p${newPageNum}`);
    showToast(`Added Page ${newPageNum}.`);
  };

  // Delete Page
  const handleDeletePage = (pageIndexToDelete: number) => {
    if (pages.length <= 1) {
      alert("Template must contain at least one page.");
      return;
    }

    const updatedPages = pages
      .filter((_, idx) => idx !== pageIndexToDelete)
      .map((p, idx) => ({ ...p, pageNumber: idx + 1, title: `Page ${idx + 1}` }));

    updatePagesWithHistory(updatedPages);
    setActivePageIndex(0);
    setSelectedElementId(null);
    showToast("Page deleted.");
  };

  // Save template action
  const handleSaveTemplate = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      showToast("Template layout successfully saved to cloud.");
    }, 600);
  };

  // Reset to default
  const handleConfirmReset = () => {
    setPages(INITIAL_PAGES);
    setActivePageIndex(0);
    setSelectedElementId("el-field-site");
    setHistory([INITIAL_PAGES]);
    setHistoryIndex(0);
    setSaveStatus("saved");
    setIsResetConfirmOpen(false);
    showToast("Template reset to factory default.");
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col select-none">
      {/* Top Main Navigation Header */}
      <AdminHeader
        title="PDF Template Editor"
        subtitle="Visual layout designer for client-facing field inspection reports"
        backHref={ROUTES.VISITS}
        backLabel="Visits"
      />

      {/* Secondary Template Studio Toolbar (Matches Walkthrough Page 8) */}
      <div className="w-full bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-16 z-10 shadow-2xs">
        {/* Left: Quick status and title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
            <LayoutTemplate className="size-4 text-blue-600 dark:text-blue-400" />
            <span>PDF Template Editor</span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:border-zinc-800" />

          {/* Cloud save status */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
            {saveStatus === "saving" ? (
              <span className="flex items-center gap-1.5 text-amber-500 font-medium">
                <span className="size-2 rounded-full bg-amber-400 animate-ping" />
                Saving...
              </span>
            ) : saveStatus === "saved" ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="size-3.5" />
                Saved
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                ● Unsaved changes
              </span>
            )}
          </div>
        </div>

        {/* Center: History, Snap & Zoom Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Undo / Redo */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-md hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors text-slate-700 dark:text-zinc-300"
              title="Undo change (Ctrl+Z)"
            >
              <Undo2 className="size-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-md hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors text-slate-700 dark:text-zinc-300"
              title="Redo change (Ctrl+Y)"
            >
              <Redo2 className="size-3.5" />
            </button>
          </div>

          {/* Snap checkbox */}
          <label className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-zinc-400 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
              className="rounded border-slate-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 size-3.5"
            />
            <span>Snap 2</span>
          </label>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-xl">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Zoom out"
            >
              <Minus className="size-3" />
            </button>
            <input
              type="range"
              min="50"
              max="130"
              step="5"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="w-16 sm:w-24 accent-blue-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none"
            />
            <button
              onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Zoom in"
            >
              <Plus className="size-3" />
            </button>
            <span className="text-[11px] font-mono font-semibold text-slate-700 dark:text-zinc-300 min-w-[34px] text-right">
              {zoomLevel}%
            </span>
          </div>
        </div>

        {/* Right: Primary Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Blank PDF per Section 16 */}
          <button
            onClick={() => setIsBlankPdfModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
            title="Preview blank print-friendly checklist with ruled lines"
          >
            <FileText className="size-3.5 text-slate-500" />
            <span>Blank PDF</span>
          </button>

          {/* Preview PDF per Section 17 */}
          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
            title="Preview generated report populated with visit data and photos"
          >
            <Eye className="size-3.5 text-blue-500" />
            <span>Preview PDF</span>
          </button>

          {/* Save template */}
          <button
            onClick={handleSaveTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors shadow-xs"
          >
            <Save className="size-3.5" />
            <span>Save template</span>
          </button>

          {/* Reset */}
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            title="Reset to factory default"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher (Visible only on mobile/tablet) */}
      <div className="lg:hidden bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-4 py-2 flex items-center justify-around text-xs font-semibold">
        <button
          onClick={() => setMobileTab("palette")}
          className={`flex items-center gap-1.5 py-1 px-3 rounded-lg ${
            mobileTab === "palette"
              ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-900"
              : "text-slate-600 dark:text-zinc-400"
          }`}
        >
          <PanelLeft className="size-3.5" />
          <span>Palette</span>
        </button>
        <button
          onClick={() => setMobileTab("canvas")}
          className={`flex items-center gap-1.5 py-1 px-3 rounded-lg ${
            mobileTab === "canvas"
              ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-900"
              : "text-slate-600 dark:text-zinc-400"
          }`}
        >
          <LayoutTemplate className="size-3.5" />
          <span>Canvas ({activePage.title})</span>
        </button>
        <button
          onClick={() => setMobileTab("inspector")}
          className={`flex items-center gap-1.5 py-1 px-3 rounded-lg ${
            mobileTab === "inspector"
              ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-900"
              : "text-slate-600 dark:text-zinc-400"
          }`}
        >
          <PanelRight className="size-3.5" />
          <span>Inspector</span>
        </button>
      </div>

      {/* Studio Workspace: 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: ADD ELEMENT & PAGES */}
        <aside
          className={`w-full lg:w-64 xl:w-72 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex flex-col shrink-0 overflow-y-auto ${
            mobileTab === "palette" ? "block" : "hidden lg:flex"
          }`}
        >
          {/* Elements Section */}
          <div className="p-4 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Add Element
              </h3>
              <span className="text-[10px] text-slate-400">Click to insert</span>
            </div>

            <div className="space-y-1.5">
              {[
                {
                  type: "cover_header" as TemplateElementType,
                  label: "Cover header",
                  icon: LayoutTemplate,
                  desc: "Header banner with logo & title",
                },
                {
                  type: "heading" as TemplateElementType,
                  label: "Heading",
                  icon: Heading,
                  desc: "Section title (e.g. § Boiler Room)",
                },
                {
                  type: "text_block" as TemplateElementType,
                  label: "Text block",
                  icon: Type,
                  desc: "Instructions or disclaimers",
                },
                {
                  type: "field" as TemplateElementType,
                  label: "Field (label + value)",
                  icon: FileCode,
                  desc: "{{placeholder}} and [value]",
                },
                {
                  type: "photo_grid" as TemplateElementType,
                  label: "Photo grid",
                  icon: ImageIcon,
                  desc: "Media attachments per section",
                },
                {
                  type: "divider" as TemplateElementType,
                  label: "Divider",
                  icon: Minus,
                  desc: "Horizontal section separator",
                },
                {
                  type: "logo" as TemplateElementType,
                  label: "Logo",
                  icon: Zap,
                  desc: "EC POWER corporate brand mark",
                },
                {
                  type: "autoflow_checklist" as TemplateElementType,
                  label: "Auto-flow checklist",
                  icon: Grid,
                  desc: "Dynamic verified question table",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    onClick={() => handleAddElement(item.type)}
                    className="w-full group flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200/70 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-800/40 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all text-left"
                  >
                    <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shadow-2xs">
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center justify-between">
                        <span>+ {item.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pages Navigator Section */}
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Pages ({pages.length})
              </h3>
              <button
                onClick={handleAddPage}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus className="size-3" />
                <span>Add page</span>
              </button>
            </div>

            <div className="space-y-2">
              {pages.map((page, idx) => (
                <div
                  key={page.id}
                  onClick={() => setActivePageIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    activePageIndex === idx
                      ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 font-semibold shadow-2xs"
                      : "bg-slate-50/50 dark:bg-zinc-800/30 border-slate-200/60 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="size-5 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center font-bold text-[10px]">
                      {page.pageNumber}
                    </span>
                    <span>{page.title}</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      ({page.elements.length} items)
                    </span>
                  </div>

                  {pages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(idx);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Delete this page"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER CANVAS: A4 SHEET RENDERER */}
        <main
          className={`flex-1 overflow-auto bg-slate-200/70 dark:bg-zinc-950/80 p-4 sm:p-8 flex justify-center items-start ${
            mobileTab === "canvas" ? "block" : "hidden lg:flex"
          }`}
        >
          {/* Zoom Wrapper */}
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className="w-full max-w-[820px] transition-all"
          >
            {/* A4 Sheet Container */}
            <div className="bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-300/80 min-h-[1120px] p-8 sm:p-12 relative flex flex-col justify-between">
              {/* Top Page Header Marker */}
              <div className="border-b border-slate-200 pb-3 mb-6 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>EC POWER • FIELD AUDIT REPORT SPECIFICATION</span>
                <span>
                  PAGE {activePage.pageNumber} OF {pages.length}
                </span>
              </div>

              {/* Elements on this page */}
              <div className="space-y-4 flex-1">
                {activePage.elements.length === 0 ? (
                  <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <p className="text-sm font-semibold text-slate-500">
                      Page is empty
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose elements from the left palette to construct this page layout.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-12 gap-3">
                    {activePage.elements.map((el) => {
                      const isSelected = selectedElementId === el.id;
                      const colSpan =
                        el.width === "full"
                          ? "col-span-12"
                          : el.width === "third"
                          ? "col-span-12 sm:col-span-4"
                          : "col-span-12 sm:col-span-6";

                      return (
                        <div
                          key={el.id}
                          onClick={() => {
                            setSelectedElementId(el.id);
                            if (window.innerWidth < 1024) {
                              // On mobile switch to inspector
                              setMobileTab("inspector");
                            }
                          }}
                          className={`${colSpan} relative group cursor-pointer transition-all rounded-xl p-2.5 ${
                            isSelected
                              ? "ring-2 ring-blue-600 bg-blue-50/40 shadow-sm"
                              : "hover:ring-1 hover:ring-slate-300 hover:bg-slate-50/60"
                          }`}
                        >
                          {/* Element Actions Overlay (Move / Delete) */}
                          <div
                            className={`absolute -top-3 right-2 z-10 flex items-center gap-1 bg-slate-900 text-white rounded-lg px-1.5 py-0.5 text-[10px] font-semibold shadow-md transition-opacity ${
                              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveElement(el.id, "up");
                              }}
                              className="p-1 hover:text-blue-300"
                              title="Move up"
                            >
                              <MoveUp className="size-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveElement(el.id, "down");
                              }}
                              className="p-1 hover:text-blue-300"
                              title="Move down"
                            >
                              <MoveDown className="size-3" />
                            </button>
                            <span className="h-3 w-px bg-slate-700" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteElement(el.id);
                              }}
                              className="p-1 hover:text-rose-400"
                              title="Delete element"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>

                          {/* Render Element by Type */}
                          {el.type === "cover_header" && (
                            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-5 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-white/10 flex items-center justify-center font-black text-xl text-blue-400 border border-white/20">
                                  EC
                                </div>
                                <div>
                                  <h2 className="font-bold text-base tracking-tight">
                                    EC POWER
                                  </h2>
                                  <p className="text-xs text-blue-200/90 font-medium">
                                    {el.content || "Site Visit Checklist - Part 1 of 3 - Project Intake"}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                                <span>Official Report</span>
                              </div>
                            </div>
                          )}

                          {el.type === "heading" && (
                            <div className="border-b-2 border-slate-800 pb-1.5">
                              <h3 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
                                {el.label}
                              </h3>
                              {el.content && (
                                <p className="text-[11px] text-slate-500 font-normal">
                                  {el.content}
                                </p>
                              )}
                            </div>
                          )}

                          {el.type === "text_block" && (
                            <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/70 leading-relaxed font-serif">
                              {el.content}
                            </div>
                          )}

                          {el.type === "field" && (
                            <div className="border border-slate-200 bg-slate-50/50 p-2.5 rounded-lg">
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                {el.label}
                              </div>
                              <div className="font-mono text-xs font-semibold text-blue-700 bg-white border border-slate-200 px-2 py-1 rounded">
                                {el.placeholder || "[value]"}
                              </div>
                            </div>
                          )}

                          {el.type === "photo_grid" && (
                            <div className="border border-slate-200 bg-slate-50/50 p-3 rounded-xl">
                              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                📷 {el.label}
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3].map((num) => (
                                  <div
                                    key={num}
                                    className="aspect-4/3 rounded-lg border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 p-2 text-center"
                                  >
                                    <ImageIcon className="size-5 mb-1 text-slate-300" />
                                    <span className="text-[10px] font-medium">
                                      Photo {num} slot
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {el.type === "divider" && (
                            <div className="py-2">
                              <hr className="border-t border-slate-300" />
                            </div>
                          )}

                          {el.type === "logo" && (
                            <div className="p-3 bg-slate-100 rounded-lg flex items-center gap-3">
                              <Zap className="size-6 text-blue-600" />
                              <div className="font-bold text-xs uppercase tracking-wider">
                                {el.content || "EC POWER"}
                              </div>
                            </div>
                          )}

                          {el.type === "autoflow_checklist" && (
                            <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                              <div className="bg-slate-100 px-3 py-2 font-bold text-slate-700 uppercase tracking-wider border-b border-slate-300 flex justify-between">
                                <span>Checklist Item</span>
                                <span>Status / Verification</span>
                              </div>
                              <div className="divide-y divide-slate-200 bg-white">
                                <div className="px-3 py-2 flex items-center justify-between">
                                  <span className="font-medium text-slate-800">
                                    Gas supply isolation valve accessible
                                  </span>
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                                    PASS
                                  </span>
                                </div>
                                <div className="px-3 py-2 flex items-center justify-between">
                                  <span className="font-medium text-slate-800">
                                    Adequate boiler room ventilation clearance
                                  </span>
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                                    PASS
                                  </span>
                                </div>
                                <div className="px-3 py-2 flex items-center justify-between">
                                  <span className="font-medium text-slate-800">
                                    Secondary heat pump loop expansion vessel checked
                                  </span>
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                                    PENDING
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Page Footer Marker */}
              <div className="border-t border-slate-200 pt-4 mt-8 flex items-center justify-between text-[10px] text-slate-400">
                <div>
                  EC POWER A/S • Thorsvej 30, 8881 Thorsø, Denmark • www.ecpower.eu
                </div>
                <div>CONFIDENTIAL &amp; PROPRIETARY</div>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT PANEL: INSPECTOR */}
        <aside
          className={`w-full lg:w-72 xl:w-80 bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 flex flex-col shrink-0 overflow-y-auto ${
            mobileTab === "inspector" ? "block" : "hidden lg:flex"
          }`}
        >
          <div className="p-4 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-2">
              <Sliders className="size-3.5" />
              <span>Inspector</span>
            </h3>
          </div>

          <div className="p-4 flex-1">
            {!selectedElement ? (
              <div className="text-center py-12 px-2">
                <div className="size-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Sliders className="size-5" />
                </div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  No element selected
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                  Select an element on the canvas to edit its properties, placeholder bindings, and styling.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Element Type Pill */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-800/60 p-2 rounded-xl border border-slate-200/60 dark:border-zinc-700">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Element Type
                  </span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 capitalize">
                    {selectedElement.type.replace("_", " ")}
                  </span>
                </div>

                {/* Label Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Label / Title
                  </label>
                  <input
                    type="text"
                    value={selectedElement.label || ""}
                    onChange={(e) =>
                      handleUpdateSelectedElement({ label: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Content field if applicable */}
                {selectedElement.type !== "divider" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Content / Subtitle
                    </label>
                    <textarea
                      rows={2}
                      value={selectedElement.content || ""}
                      onChange={(e) =>
                        handleUpdateSelectedElement({ content: e.target.value })
                      }
                      placeholder="Optional descriptive subtext"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Placeholder Syntax field */}
                {selectedElement.type === "field" && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Placeholder Binding
                      </label>
                      <span className="text-[10px] text-blue-500 font-mono">
                        {"{{ }}"}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={selectedElement.placeholder || ""}
                      onChange={(e) =>
                        handleUpdateSelectedElement({ placeholder: e.target.value })
                      }
                      placeholder="{{field:site_name}} or [value]"
                      className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    {/* Quick helper pills */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        "{{field:site_name}}",
                        "{{field:site_address}}",
                        "{{field:date}}",
                        "[value]",
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            handleUpdateSelectedElement({ placeholder: tag })
                          }
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Width Layout */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Element Width
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl text-xs">
                    {(["full", "half", "third"] as const).map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() =>
                          handleUpdateSelectedElement({ width: w })
                        }
                        className={`py-1 rounded-lg capitalize font-medium transition-all ${
                          selectedElement.width === w
                            ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-semibold shadow-2xs"
                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Columns for photo grid */}
                {selectedElement.type === "photo_grid" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Grid Columns
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl text-xs">
                      {([2, 3, 4] as const).map((cols) => (
                        <button
                          key={cols}
                          type="button"
                          onClick={() =>
                            handleUpdateSelectedElement({ columns: cols })
                          }
                          className={`py-1 rounded-lg font-medium transition-all ${
                            selectedElement.columns === cols
                              ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-semibold shadow-2xs"
                              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                          }`}
                        >
                          {cols} Cols
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reorder and Delete Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMoveElement(selectedElement.id, "up")}
                      className="flex-1 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center justify-center gap-1"
                    >
                      <MoveUp className="size-3.5" />
                      <span>Move Up</span>
                    </button>
                    <button
                      onClick={() => handleMoveElement(selectedElement.id, "down")}
                      className="flex-1 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center justify-center gap-1"
                    >
                      <MoveDown className="size-3.5" />
                      <span>Move Down</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteElement(selectedElement.id)}
                    className="w-full py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete this element</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* PREVIEW PDF MODAL (Populated with Visit Data per Section 17) */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2.5">
                <Eye className="size-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Preview Generated PDF Report
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Sample populated report: Benbow Inn (September 16, 2026)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    showToast("Downloaded sample PDF report.");
                    setIsPreviewModalOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  <Download className="size-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Rendered A4 Document Preview */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-zinc-950 flex justify-center">
              <div className="w-full max-w-2xl bg-white text-slate-900 p-8 rounded-lg shadow-xl border border-slate-300 space-y-6">
                {/* Simulated Header */}
                <div className="bg-slate-900 text-white p-5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-white/10 flex items-center justify-center font-black text-xl text-blue-400">
                      EC
                    </div>
                    <div>
                      <h2 className="font-bold text-base">EC POWER Inc.</h2>
                      <p className="text-xs text-blue-200">
                        Site Visit Checklist - Part 1 of 3 - Project Intake
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-300">
                    <div>VISIT ID: VST-2026-0916</div>
                    <div>DATE: 2026-09-16</div>
                  </div>
                </div>

                {/* Populated Field Data */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Site Name
                    </div>
                    <div className="font-semibold text-slate-900 text-sm mt-0.5">
                      The Benbow Inn
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Meeting Date
                    </div>
                    <div className="font-semibold text-slate-900 text-sm mt-0.5">
                      September 16, 2026 • 09:30 AM
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Site Address
                    </div>
                    <div className="font-medium text-slate-800 mt-0.5">
                      445 Lake Blvd, Garberville, CA 95542
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Primary Contact
                    </div>
                    <div className="font-medium text-slate-800 mt-0.5">
                      Michael Vance (General Manager)
                    </div>
                  </div>
                </div>

                {/* Boiler Room Section with Media Attachments per Section 17 */}
                <div className="space-y-3 pt-2">
                  <div className="border-b-2 border-slate-900 pb-1 flex justify-between items-center">
                    <h3 className="font-bold text-sm uppercase">
                      § Boiler / Mechanical Room
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      3 photos verified
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      <div className="h-28 bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-semibold">
                        [Photo: Burner Flue]
                      </div>
                      <div className="p-1.5 text-[10px] text-slate-600 bg-white">
                        Flue gas exhaust connection
                      </div>
                    </div>
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      <div className="h-28 bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-semibold">
                        [Photo: Gas Meter]
                      </div>
                      <div className="p-1.5 text-[10px] text-slate-600 bg-white">
                        Incoming 20 mbar supply line
                      </div>
                    </div>
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      <div className="h-28 bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-semibold">
                        [Photo: Control Panel]
                      </div>
                      <div className="p-1.5 text-[10px] text-slate-600 bg-white">
                        Master BMS integration rack
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BLANK PDF MODAL (Print-Friendly with Ruled Lines per Section 16) */}
      {isBlankPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2.5">
                <Printer className="size-5 text-slate-700 dark:text-zinc-200" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Print-Friendly Blank Checklist (Manual Notes)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Includes blank ruled lines for field engineers to write on clipboard
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  <Printer className="size-3.5" />
                  <span>Print Form</span>
                </button>
                <button
                  onClick={() => setIsBlankPdfModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Ruled Lines Printable Paper */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-zinc-950 flex justify-center">
              <div className="w-full max-w-2xl bg-white text-slate-900 p-8 rounded-lg shadow-xl border border-slate-300 space-y-6">
                <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-base">
                      EC POWER • FIELD AUDIT WORKSHEET
                    </h2>
                    <p className="text-xs text-slate-500">
                      Fill out missing observations manually for later system entry
                    </p>
                  </div>
                  <div className="size-8 rounded border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-500">
                    A4
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <div className="font-bold text-slate-700 mb-1">
                      Site Name &amp; Client Address:
                    </div>
                    <div className="border-b border-dotted border-slate-400 h-6" />
                  </div>

                  <div>
                    <div className="font-bold text-slate-700 mb-1">
                      Primary Contact &amp; On-Site Telephone:
                    </div>
                    <div className="border-b border-dotted border-slate-400 h-6" />
                  </div>

                  <div>
                    <div className="font-bold text-slate-700 mb-1">
                      Existing Boiler / Heat Pump Make &amp; Serial:
                    </div>
                    <div className="border-b border-dotted border-slate-400 h-6" />
                  </div>

                  <div>
                    <div className="font-bold text-slate-700 mb-1">
                      Gas Flow / Static Pressure Reading (mbar):
                    </div>
                    <div className="border-b border-dotted border-slate-400 h-6" />
                  </div>

                  <div>
                    <div className="font-bold text-slate-700 mb-1">
                      Technician Field Observations &amp; Access Obstacles:
                    </div>
                    <div className="space-y-4 pt-2">
                      <div className="border-b border-slate-300 h-5" />
                      <div className="border-b border-slate-300 h-5" />
                      <div className="border-b border-slate-300 h-5" />
                      <div className="border-b border-slate-300 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
              Reset Template to Default?
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mb-4">
              This will discard all customizations and reload the original EC POWER factory template layout.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-2xl shadow-xl text-xs font-medium border border-slate-800 dark:border-zinc-200 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="size-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
