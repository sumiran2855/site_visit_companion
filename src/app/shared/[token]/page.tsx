"use client";

import { use, useEffect, useState, useCallback, useMemo } from "react";
import {
  Building2,
  Calendar,
  User,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Download,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Zap,
  MapPin,
  Check,
  X,
  Share2,
  FileCheck2,
} from "lucide-react";
import {
  SharedVisitService,
  type SharedVisitPayload,
} from "@/services/shared-visit.service";
import { CHECKLIST_SECTIONS_CONFIG } from "@/config/checklist.config";
import { MediaViewerModal } from "@/components/submissions/MediaViewerModal";
import type { SubmissionMedia } from "@/types/submission";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function SharedVisitPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { token } = resolvedParams;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [data, setData] = useState<SharedVisitPayload | null>(null);

  // Accordion state for checklist sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "sec-meeting": true,
    "sec-consumption": true,
    "sec-boiler-room": true,
  });

  // Action states
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Media lightbox modal state
  const [activeMedia, setActiveMedia] = useState<SubmissionMedia | null>(null);

  const loadData = useCallback(async () => {
    if (!token) {
      setErrorMessage("Missing share token in link.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = await SharedVisitService.getSharedVisit(token);
      setData(payload);
    } catch (err: any) {
      console.error("[SharedVisitPage] Error loading visit:", err);
      setErrorMessage(
        err?.message || "Shared site visit not found or link has expired."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleExpandAll = () => {
    const all: Record<string, boolean> = {};
    CHECKLIST_SECTIONS_CONFIG.forEach((s) => {
      all[s.id] = true;
    });
    setOpenSections(all);
  };

  const handleCollapseAll = () => {
    setOpenSections({});
  };

  // Helper to extract field value
  const getFieldValue = (sectionId: string, fieldId: string): string => {
    if (!data) return "";
    if (data.service?.sections) {
      const sec = data.service.sections.find(
        (s) => s.section_id === sectionId || (s as any).id === sectionId
      );
      if (sec?.fields && sec.fields[fieldId] !== undefined) {
        const raw = sec.fields[fieldId];
        if (typeof raw === "boolean") return raw ? "Yes" : "No";
        if (typeof raw === "string") {
          const l = raw.trim().toLowerCase();
          if (l === "true" || l === "yes") return "Yes";
          if (l === "false" || l === "no") return "No";
          return raw;
        }
        return String(raw);
      }
    }

    const ans = data.answers.find(
      (a) => a.fieldId === fieldId || a.sectionId === sectionId
    );
    if (ans && ans.value !== undefined && ans.value !== "") {
      const l = ans.value.trim().toLowerCase();
      if (l === "true" || l === "yes") return "Yes";
      if (l === "false" || l === "no") return "No";
      return ans.value;
    }

    return "";
  };

  // Helper to extract field note
  const getFieldNote = (sectionId: string, fieldId: string): string | null => {
    if (!data) return null;
    if (data.service?.sections) {
      const sec = data.service.sections.find(
        (s) => s.section_id === sectionId || (s as any).id === sectionId
      );
      if (sec?.fields) {
        const note = sec.fields[`${fieldId}_notes`];
        if (note) return String(note);
      }
    }
    const ans = data.answers.find((a) => a.fieldId === fieldId);
    return ans?.notes || null;
  };

  // Helper to get media for a section without duplication
  const getSectionMedia = (sectionId: string) => {
    if (!data?.media) return [];
    return data.media.filter((m) => m.sectionId === sectionId);
  };

  const handleOpenMedia = (mediaItem: any) => {
    setActiveMedia({
      id: mediaItem.id,
      type: mediaItem.type === "video" ? "video" : "photo",
      title: mediaItem.fileName || "Evidence Media",
      url: mediaItem.signedUrl || mediaItem.url,
      thumbnailUrl: mediaItem.signedUrl || mediaItem.url,
      fieldId: mediaItem.fieldId || "",
      takenAt: data?.visit.updatedAt || new Date().toISOString(),
      notes: mediaItem.notes || undefined,
    });
  };

  const handleDownloadPdf = async () => {
    if (!data || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      await SharedVisitService.downloadPdfReport(data, token);
    } catch (err) {
      console.error("[SharedVisitPage] Failed to download PDF:", err);
      alert("Unable to generate PDF report at this moment. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#15438F] border border-white/20 flex items-center justify-center mb-4 shadow-xl">
          <Zap className="size-7 sm:size-8 text-amber-400 fill-current animate-pulse" />
        </div>
        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
          Loading Site Visit Report...
        </h2>
        <p className="text-[11px] sm:text-xs text-slate-400 dark:text-zinc-500 mb-4 text-center">
          Retrieving verified inspection records and high-resolution media
        </p>
        <Loader2 className="size-5 sm:size-6 text-sky-600 animate-spin" />
      </div>
    );
  }

  // Error State
  if (errorMessage || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 flex items-center justify-center mb-4 shadow-sm">
          <AlertCircle className="size-6 sm:size-7 text-rose-600 dark:text-rose-400" />
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
          Unable to Open Inspection Report
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mb-5 leading-relaxed">
          {errorMessage ||
            "This share link is invalid or may have expired. Please request a new link from your service technician or administrator."}
        </p>
        <button
          type="button"
          onClick={loadData}
          className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 shadow-sm transition-all cursor-pointer"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const { visit } = data;
  const meetingDateStr = getFieldValue("sec-meeting", "mc_meeting_date");
  const siteAddressStr =
    visit.address ||
    [
      getFieldValue("sec-meeting", "mc_address_street"),
      getFieldValue("sec-meeting", "mc_address_city"),
      getFieldValue("sec-meeting", "mc_address_state"),
      getFieldValue("sec-meeting", "mc_address_zip"),
    ]
      .filter(Boolean)
      .join(", ");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 antialiased pb-24 md:pb-12">
      {/* Top Mobile-Responsive Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Brand Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#15438F] flex items-center justify-center shadow-md shrink-0">
              <Zap className="size-4 sm:size-5 text-amber-400 fill-current" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black tracking-wider text-slate-900 dark:text-white truncate">
                  EC POWER
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shrink-0">
                  Audit Report
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 hidden sm:block truncate">
                Technical Site Assessment & Feasibility
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="py-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Copy link"
            >
              {copySuccess ? (
                <>
                  <Check size={13} className="text-emerald-500 shrink-0" />
                  <span className="text-emerald-600 font-bold text-[11px] sm:text-xs">
                    Copied
                  </span>
                </>
              ) : (
                <>
                  <Share2 size={13} className="shrink-0" />
                  <span className="hidden sm:inline text-xs">Share</span>
                </>
              )}
            </button>

            {/* Desktop Download Button (Mobile has floating bottom bar) */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="hidden md:flex py-1.5 px-3.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 shadow-sm transition-all items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Preparing PDF...</span>
                </>
              ) : (
                <>
                  <Download size={13} />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-3.5 sm:px-6 py-4 sm:py-7 space-y-4 sm:space-y-6">
        {/* Verification Status Banner */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-between gap-2.5 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck size={17} className="text-sky-600 dark:text-sky-400 shrink-0" />
            <p className="text-[11px] sm:text-xs text-sky-900 dark:text-sky-200 leading-snug truncate">
              <span className="font-bold">Authorized Audit:</span> Read-only technical verification with photo evidence.
            </p>
          </div>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300 shrink-0 bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded-full">
            Verified
          </span>
        </div>

        {/* Hero Overview Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 sm:pb-5 border-b border-slate-100 dark:border-zinc-800">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  {visit.status === "completed"
                    ? "✓ Audit Completed"
                    : visit.status === "in_progress"
                    ? "In Progress"
                    : "Verified"}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                  REF: {visit.id.substring(0, 8)}
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight break-words">
                {visit.siteName}
              </h1>
              {siteAddressStr ? (
                <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-zinc-400 pt-0.5">
                  <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-snug break-words">{siteAddressStr}</span>
                </div>
              ) : null}
            </div>

            {/* Desktop Card Action Button */}
            <div className="hidden sm:block shrink-0">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="py-2 px-3.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isDownloadingPdf ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Download size={13} />
                )}
                <span>Download Report PDF</span>
              </button>
            </div>
          </div>

          {/* 2x2 Grid on Mobile, 4-col on Desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 pt-4">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-0.5">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                <Calendar size={11} className="shrink-0" />
                Date
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {meetingDateStr || new Date(visit.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-0.5">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                <User size={11} className="shrink-0" />
                Technician
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {visit.technicianName || "Certified Field Technician"}
              </p>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-0.5">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                <Building2 size={11} className="shrink-0" />
                Partner
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {visit.companyName || "EC POWER Inc."}
              </p>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-0.5">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                <ImageIcon size={11} className="shrink-0" />
                Evidence
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {data.media.length} item{data.media.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {/* Verification Progress Bar */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
              <span className="text-slate-600 dark:text-zinc-400">
                Checklist Audit Progress
              </span>
              <span className="text-slate-900 dark:text-white font-mono">
                {visit.completedFields} / {visit.totalFields} verified ({visit.completionPercentage}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div
                style={{ width: `${visit.completionPercentage}%` }}
                className="h-full rounded-full bg-sky-500 transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {/* Section Header Controls */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Inspection Sections
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
              Audit data, compliance checks, and attached media
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleExpandAll}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              Expand all
            </button>
            <span className="text-slate-300 dark:text-zinc-700">•</span>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:underline cursor-pointer"
            >
              Collapse all
            </button>
          </div>
        </div>

        {/* Checklist Accordion Sections */}
        <div className="space-y-3 sm:space-y-4">
          {CHECKLIST_SECTIONS_CONFIG.map((section) => {
            const isOpen = Boolean(openSections[section.id]);
            const sectionMedia = getSectionMedia(section.id);
            const answeredCount = section.fields.filter(
              (f) => getFieldValue(section.id, f.id) !== ""
            ).length;
            const isComplete = answeredCount === section.fields.length;

            return (
              <div
                key={section.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs overflow-hidden"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-3.5 sm:p-4.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors text-left cursor-pointer gap-2"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isComplete
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {section.number}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block truncate">
                        {section.sectionTag}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {section.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400">
                      {answeredCount}/{section.fields.length}
                    </span>
                    {sectionMedia.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-1">
                        <ImageIcon size={9} />
                        {sectionMedia.length}
                      </span>
                    )}
                    {isOpen ? (
                      <ChevronUp size={16} className="text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-400 shrink-0" />
                    )}
                  </div>
                </button>

                {/* Accordion Content */}
                {isOpen && (
                  <div className="p-3.5 sm:p-5 pt-0 border-t border-slate-100 dark:border-zinc-800 space-y-4">
                    {section.instructions && (
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 italic bg-slate-50 dark:bg-zinc-800/40 p-2.5 sm:p-3 rounded-xl border border-slate-100 dark:border-zinc-800/80 mt-3 leading-relaxed">
                        {section.instructions}
                      </p>
                    )}

                    {/* Field Questions & Values */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5 mt-3">
                      {section.fields
                        .filter((f) => f.type !== "photo" && f.type !== "video")
                        .map((field) => {
                          const val = getFieldValue(section.id, field.id);
                          const note = getFieldNote(section.id, field.id);
                          const isYes = val === "Yes";
                          const isNo = val === "No";

                          return (
                            <div
                              key={field.id}
                              className="p-3 rounded-xl sm:rounded-2xl bg-slate-50/70 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/80 space-y-1"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 leading-snug flex-1">
                                  {field.label}
                                </span>

                                {val ? (
                                  isYes ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white flex items-center gap-1 shrink-0 shadow-xs">
                                      <Check size={9} /> Yes
                                    </span>
                                  ) : isNo ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white flex items-center gap-1 shrink-0 shadow-xs">
                                      <X size={9} /> No
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-700 shrink-0">
                                      {val}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 italic">
                                    Not recorded
                                  </span>
                                )}
                              </div>

                              {note && (
                                <p className="text-[11px] text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-800/80 p-2 rounded-lg border border-slate-200/60 dark:border-zinc-700/60 mt-1 leading-snug">
                                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                                    Note:
                                  </span>{" "}
                                  {note}
                                </p>
                              )}
                            </div>
                          );
                        })}
                    </div>

                    {/* Section Media Gallery (Thumb-friendly on mobile) */}
                    {sectionMedia.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
                          Attached Photos ({sectionMedia.length})
                        </span>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {sectionMedia.map((mediaItem) => (
                            <button
                              key={mediaItem.id}
                              type="button"
                              onClick={() => handleOpenMedia(mediaItem)}
                              className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-sky-500 transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              <img
                                src={mediaItem.signedUrl}
                                alt={mediaItem.fileName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-slate-950/25 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="p-1 rounded bg-white/90 text-slate-900 text-[9px] font-bold shadow-xs">
                                  View
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Card for Desktop */}
        <div className="hidden sm:block p-6 rounded-3xl bg-slate-900 text-white text-center space-y-2.5 shadow-md">
          <h3 className="text-base font-bold">
            Download Official Inspection PDF Report
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Compiled multi-section audit specification with verified technical tables, notes, and evidence media.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="py-2.5 px-6 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-md transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isDownloadingPdf ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span>Download Official Report PDF</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-4 text-center text-[10px] text-slate-400 dark:text-zinc-500">
          <p>
            EC POWER Official Field Inspection Companion • Verified via Supabase & Cloudflare R2
          </p>
        </footer>
      </main>

      {/* Sticky Mobile Floating Action Bar (Mobile Browser Experience) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 p-3 shadow-2xl safe-area-bottom">
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isDownloadingPdf}
          className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-slate-900 active:bg-slate-800 dark:bg-sky-600 dark:active:bg-sky-500 shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isDownloadingPdf ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Generating Official PDF...</span>
            </>
          ) : (
            <>
              <Download size={16} />
              <span>Download Report PDF</span>
            </>
          )}
        </button>
      </div>

      {/* Media Lightbox Modal */}
      {activeMedia && (
        <MediaViewerModal
          media={activeMedia}
          onClose={() => setActiveMedia(null)}
        />
      )}
    </div>
  );
}
