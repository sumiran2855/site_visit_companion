"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Calendar,
  User,
  CheckCircle2,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Video,
  Lock,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Smartphone,
  Share2,
  X,
  ShieldCheck,
} from "lucide-react";
import { CHECKLIST_SECTIONS_CONFIG } from "@/config/checklist";
import { API_CONFIG } from "@/config/api.config";
import { ROUTES } from "@/lib/constants";
import { PdfService } from "@/services/pdf.service";

interface SharedVisitPayload {
  visit: {
    id: string;
    siteName: string;
    status: string;
    completedFields: number;
    totalFields: number;
    completionPercentage: number;
    createdAt: string;
    updatedAt: string;
    companyName?: string;
    technicianName?: string;
  };
  service?: {
    sections?: Array<{
      section_id: string;
      section_name: string;
      fields: Record<string, any>;
    }>;
  } | null;
  answers: Array<{
    sectionId: string;
    fieldId: string;
    value: string;
  }>;
  media: Array<{
    id: string;
    sectionId: string;
    fieldId: string;
    type: string;
    fileName: string;
    signedUrl: string;
    notes: string | null;
  }>;
}

interface SharedVisitViewProps {
  tokenOrId: string;
}

export function SharedVisitView({ tokenOrId }: SharedVisitViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [data, setData] = useState<SharedVisitPayload | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Accordion open/close state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "sec-meeting": true,
    "sec-consumption": true,
    "sec-boiler-room": true,
  });

  const fetchData = useCallback(async () => {
    if (!tokenOrId) {
      setErrorMessage("No share identifier provided.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Try public shared endpoint
      const baseUrl = API_CONFIG.BASE_URL;
      let res: Response;
      try {
        res = await fetch(`${baseUrl}/public/shared/${tokenOrId}`);
      } catch (err: any) {
        throw new Error(`Unable to connect to the API server at ${baseUrl}. Please check your connection.`);
      }

      let json = await res.json();

      // 2. Fallback to public visits endpoint
      if (!res.ok || !json.success) {
        try {
          const fallbackRes = await fetch(`${baseUrl}/public/visits/${tokenOrId}`);
          const fallbackJson = await fallbackRes.json();
          if (fallbackRes.ok && fallbackJson.success) {
            json = fallbackJson;
          }
        } catch {}
      }

      if (json && json.success && json.data) {
        setData(json.data);
      } else {
        setErrorMessage(json?.message || "Shared visit assessment not found or link has expired.");
      }
    } catch (e: any) {
      console.warn("Fetch error:", e);
      setErrorMessage(e?.message || "Failed to load shared site visit.");
    } finally {
      setIsLoading(false);
    }
  }, [tokenOrId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
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

  const handleCopyLink = async () => {
    if (typeof window !== "undefined") {
      let success = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(window.location.href);
          success = true;
        }
      } catch {}

      if (!success) {
        try {
          const el = document.createElement("textarea");
          el.value = window.location.href;
          el.setAttribute("readonly", "");
          el.style.position = "fixed";
          el.style.left = "-9999px";
          document.body.appendChild(el);
          el.focus();
          el.select();
          success = document.execCommand("copy");
          document.body.removeChild(el);
        } catch {}
      }

      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handlePrint = async () => {
    const downloaded = await PdfService.downloadReport({
      visitId: data?.visit?.id ?? tokenOrId,
      shareToken: tokenOrId,
      siteName: data?.visit?.siteName || "SiteVisit",
    });
    if (downloaded) return;

    // Backend unavailable: fall back to browser print. Open all sections before printing
    handleExpandAll();
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Helper to extract field value
  const getFieldValue = (sectionId: string, fieldId: string): string => {
    if (!data) return "";

    // 1. Check service document sections
    if (data.service?.sections) {
      const sec = data.service.sections.find((s) => s.section_id === sectionId);
      if (sec?.fields && sec.fields[fieldId] !== undefined) {
        const val = sec.fields[fieldId];
        if (typeof val === "boolean") return val ? "Yes" : "No";
        if (typeof val === "string") return val;
        if (typeof val === "object" && val !== null) {
          if (val.url || val.storage_key) return ""; // Media handled separately
          return JSON.stringify(val);
        }
        return String(val);
      }
    }

    // 2. Check flat answers array
    const ans = data.answers?.find(
      (a) => a.fieldId === fieldId || (a.sectionId === sectionId && a.fieldId === fieldId)
    );
    if (ans && ans.value !== undefined && ans.value !== "") {
      if (ans.value === "true") return "Yes";
      if (ans.value === "false") return "No";
      return ans.value;
    }

    return "";
  };

  // Helper to get media items for a field
  const getFieldMedia = (sectionId: string, fieldId: string) => {
    if (!data?.media) return [];
    return data.media.filter(
      (m) => m.fieldId === fieldId || (m.sectionId === sectionId && m.fieldId === fieldId)
    );
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="relative mb-6">
          <div className="size-16 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center animate-pulse">
            <ShieldCheck className="size-8 text-sky-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2">
          Loading Site Visit Assessment
        </h2>
        <p className="text-xs text-slate-400 max-w-sm">
          Verifying security token and retrieving technical audit data...
        </p>
      </div>
    );
  }

  // Error Screen
  if (errorMessage || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="size-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
          <AlertCircle className="size-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2">
          Unable to Open Shared Visit
        </h2>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
          {errorMessage || "This share link is invalid, has expired, or the site visit was removed."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <button
            type="button"
            onClick={fetchData}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors"
          >
            <RefreshCw className="size-4" />
            <span>Retry</span>
          </button>
          <Link
            href={ROUTES.HOME}
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const { visit } = data;
  const siteName = visit.siteName || "Untitled Inspection";
  const companyName = visit.companyName || "EC POWER";
  const technicianName = visit.technicianName || "EC POWER Certified Technician";
  const inspectionDate = visit.createdAt
    ? new Date(visit.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Recent";
  const completionPercentage = visit.completionPercentage || 0;

  // Deep Link URI for mobile app
  const appDeepLink = `sitevisitcompanionmobile://shared/${tokenOrId}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col font-sans">
      {/* Top Banner for Mobile Users: Deep Link Prompt */}
      <div className="bg-sky-600 text-white px-4 py-2 text-xs flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <Smartphone className="size-4 shrink-0" />
          <span className="font-medium truncate">
            Have the Site Visit Companion mobile app installed?
          </span>
        </div>
        <a
          href={appDeepLink}
          className="ml-3 shrink-0 px-3 py-1 rounded-lg bg-white text-sky-700 font-bold hover:bg-sky-50 transition-colors text-xs"
        >
          Open in Mobile App
        </a>
      </div>

      {/* Main Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#15438F] flex items-center justify-center text-white font-black text-sm shadow-sm overflow-hidden">
              EC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                  EC POWER
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                  VERIFIED REPORT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                XRGI Technical Pre-Installation Assessment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-200 transition-colors"
              title="Copy shareable link"
            >
              {copiedLink ? (
                <>
                  <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Copied!
                  </span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Copy Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white text-xs font-semibold text-white dark:text-zinc-900 shadow-sm transition-colors"
            >
              <Printer className="size-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Inspection Header Card */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 text-[11px] font-black uppercase tracking-wider">
              Technical Audit
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
              {completionPercentage}% Complete
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[11px] font-medium border border-slate-200 dark:border-zinc-700 ml-auto">
              <Lock className="size-3 text-slate-500" />
              Read-Only
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            {siteName}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 shrink-0">
                <Building2 className="size-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Company</p>
                <p className="font-bold text-slate-900 dark:text-zinc-100">{companyName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 shrink-0">
                <Calendar className="size-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Audit Date</p>
                <p className="font-bold text-slate-900 dark:text-zinc-100">{inspectionDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 shrink-0">
                <User className="size-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Certified Inspector</p>
                <p className="font-bold text-slate-900 dark:text-zinc-100">{technicianName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Fields Audited</p>
                <p className="font-bold text-emerald-700 dark:text-emerald-400">
                  {visit.completedFields || 0} of {visit.totalFields || 67}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section List Controls */}
        <div className="flex items-center justify-between px-1 print:hidden">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Checklist Sections & Evidence
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExpandAll}
              className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold"
            >
              Expand All
            </button>
            <span className="text-slate-300 dark:text-zinc-700">|</span>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="text-xs text-slate-500 dark:text-zinc-400 hover:underline font-medium"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Checklist Sections Accordion */}
        <div className="space-y-4">
          {CHECKLIST_SECTIONS_CONFIG.map((sec, idx) => {
            const isOpen = !!openSections[sec.id];
            return (
              <section
                key={sec.id}
                className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs print:break-inside-avoid print:border-slate-300"
              >
                {/* Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(sec.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors print:pointer-events-none"
                >
                  <div className="flex items-center gap-3.5 flex-1 mr-4">
                    <div className="size-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-xs font-black text-sky-700 dark:text-sky-300 shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {sec.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        {sec.fields.length} Parameters
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 print:hidden">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                      Section {idx + 1}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="size-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="size-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Section Content */}
                {(isOpen || true) && (
                  <div
                    className={`px-4 sm:px-6 pb-6 pt-2 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/40 ${
                      isOpen ? "block" : "hidden print:block"
                    }`}
                  >
                    {sec.instructions && (
                      <div className="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 mb-4 text-xs text-sky-900 dark:text-sky-300 italic">
                        &ldquo;{sec.instructions}&rdquo;
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {sec.fields.map((f) => {
                        const val = getFieldValue(sec.id, f.id);
                        const mediaItems = getFieldMedia(sec.id, f.id);

                        return (
                          <div
                            key={f.id}
                            className={`p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800/80 ${
                              f.type === "photo" || f.type === "video" ? "md:col-span-2" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                                {f.label}
                                {f.required && (
                                  <span className="text-rose-500 ml-1" title="Required">*</span>
                                )}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-slate-100 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400">
                                {f.type}
                              </span>
                            </div>

                            {/* Field Display Logic */}
                            {f.type === "photo" ? (
                              <div className="mt-2 space-y-2">
                                {mediaItems.length > 0 ? (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {mediaItems.map((m) => (
                                      <div
                                        key={m.id}
                                        className="group relative rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden bg-slate-100 dark:bg-zinc-800 aspect-square cursor-pointer"
                                        onClick={() =>
                                          setPreviewImage({ url: m.signedUrl, title: m.fileName })
                                        }
                                      >
                                        {m.signedUrl ? (
                                          <img
                                            src={m.signedUrl}
                                            alt={m.fileName || "Inspection Evidence"}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                            loading="lazy"
                                          />
                                        ) : (
                                          <div className="flex flex-col items-center justify-center h-full p-2 text-center text-slate-400">
                                            <ImageIcon className="size-6 mb-1" />
                                            <span className="text-[10px] truncate max-w-full">
                                              {m.fileName}
                                            </span>
                                          </div>
                                        )}
                                        {m.notes && (
                                          <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 p-1.5 text-[10px] text-white truncate">
                                            {m.notes}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400 italic">No photos recorded</p>
                                )}
                              </div>
                            ) : f.type === "video" ? (
                              <div className="mt-2 space-y-2">
                                {mediaItems.length > 0 ? (
                                  <div className="space-y-2">
                                    {mediaItems.map((v) => (
                                      <div
                                        key={v.id}
                                        className="p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 flex items-center justify-between gap-3"
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <Video className="size-5 text-sky-600 dark:text-sky-400 shrink-0" />
                                          <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                                              {v.fileName || "360° Walkthrough Video"}
                                            </p>
                                            {v.notes && (
                                              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                                                {v.notes}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        {v.signedUrl && (
                                          <a
                                            href={v.signedUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0"
                                          >
                                            <span>Play / Download</span>
                                            <ExternalLink className="size-3" />
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400 italic">No video recordings attached</p>
                                )}
                              </div>
                            ) : (
                              <div className="mt-1">
                                {val ? (
                                  <p className="text-xs font-medium text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">
                                    {val}
                                  </p>
                                ) : (
                                  <p className="text-xs text-slate-400 italic">Not provided</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 mt-12 py-6 text-xs text-slate-500 dark:text-zinc-400 print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} EC POWER A/S. Confidential Technical Assessment.</p>
          <div className="flex items-center gap-4">
            <Link href={ROUTES.PRIVACY} className="hover:underline">
              Privacy Policy
            </Link>
            <Link href={ROUTES.TERMS} className="hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 size-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X className="size-5" />
          </button>
          <div
            className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-h-[75vh] w-auto rounded-xl object-contain shadow-2xl"
            />
            {previewImage.title && (
              <p className="text-xs text-slate-300 font-mono mt-3">
                {previewImage.title}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SharedVisitView;