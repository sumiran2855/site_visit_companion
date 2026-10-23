"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  FileCheck2,
  Loader2,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Eye,
} from "lucide-react";
import type { SiteSubmission } from "@/types/submission";
import type { PDFTemplate } from "@/types/admin";
import { PdfService } from "@/services/pdf.service";

export interface PdfReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: SiteSubmission;
}

export const PdfReportPreviewModal: React.FC<PdfReportPreviewModalProps> = ({
  isOpen,
  onClose,
  submission,
}) => {
  const [activeTab, setActiveTab] = useState<"preview" | "pdf">("preview");
  const [zoom, setZoom] = useState<number>(100);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [iframeHeight, setIframeHeight] = useState<number>(1400);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [activeTemplate, setActiveTemplate] = useState<PDFTemplate | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const pdfIframeRef = useRef<HTMLIFrameElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sanitized site & file name
  const sanitizedSite =
    submission.siteName.trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "SiteVisit";
  const fileName = `${sanitizedSite}_Inspection_Report.pdf`;

  // Measure and adjust iframe height
  const handleIframeLoad = () => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc) {
        const measured = Math.max(
          doc.documentElement.scrollHeight,
          doc.body.scrollHeight,
          1200
        );
        setIframeHeight(measured + 60);
      }
    } catch {}
  };

  // Compile and fetch on open
  useEffect(() => {
    if (!isOpen) return;

    // Reset view state
    setZoom(100);
    setActiveTab("preview");
    setPdfBlob(null);
    setPdfBlobUrl(null);
    setIsDownloading(false);
    setNotice(null);

    // 1. Instant HTML preview compilation with currently available data
    const reportData = PdfService.extractReportData(submission);
    const instantHtml = PdfService.compileTemplateHtml({
      visitId: submission.id,
      siteName: submission.siteName,
      companyName: submission.customer,
      technicianName: submission.sentBy,
      values: reportData.values,
      notes: reportData.notes,
      photos: reportData.photos,
    });
    setHtmlContent(instantHtml);

    // 2. Fetch full raw checklist values from Supabase visit_records
    PdfService.fetchRawChecklistValues(submission.id)
      .then((raw) => {
        if (raw && (Object.keys(raw.values).length > 0 || Object.keys(raw.photos).length > 0)) {
          Object.assign(reportData.values, raw.values);
          Object.assign(reportData.notes, raw.notes);
          if (raw.photos) {
            Object.entries(raw.photos).forEach(([fId, pList]) => {
              if (pList && pList.length > 0) {
                const existingList = reportData.photos[fId] || [];
                pList.forEach((p) => {
                  if (!existingList.some((e) => e.uri === p.uri)) {
                    existingList.push(p);
                  }
                });
                reportData.photos[fId] = existingList;
              }
            });
          }

          const updatedHtml = PdfService.compileTemplateHtml({
            visitId: submission.id,
            siteName: submission.siteName,
            companyName: submission.customer,
            technicianName: submission.sentBy,
            values: reportData.values,
            notes: reportData.notes,
            photos: reportData.photos,
            template: activeTemplate || undefined,
          });
          setHtmlContent(updatedHtml);
        }
      })
      .catch(() => {});

    // 3. Load active template from Supabase/Backend
    PdfService.getActiveTemplate()
      .then((tmpl) => {
        if (tmpl) {
          setActiveTemplate(tmpl);
          const customHtml = PdfService.compileTemplateHtml({
            visitId: submission.id,
            siteName: submission.siteName,
            companyName: submission.customer,
            technicianName: submission.sentBy,
            values: reportData.values,
            notes: reportData.notes,
            photos: reportData.photos,
            template: tmpl,
          });
          setHtmlContent(customHtml);
        }
      })
      .catch(() => {});

    // 4. Start background generation of official high-res PDF binary
    setIsGeneratingPdf(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    PdfService.fetchReportPdfBlob(
      {
        visitId: submission.id,
        siteName: submission.siteName,
        companyName: submission.customer,
        technicianName: submission.sentBy,
        values: reportData.values,
        notes: reportData.notes,
        photos: reportData.photos,
      },
      controller.signal
    )
      .then((blob) => {
        if (blob) {
          setPdfBlob(blob);
          const url = window.URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.warn("[PdfReportPreviewModal] Backend PDF fetch notice:", err);
        }
      })
      .finally(() => {
        setIsGeneratingPdf(false);
      });

    // Cleanup when closing
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setPdfBlobUrl((prevUrl) => {
        if (prevUrl) {
          try {
            window.URL.revokeObjectURL(prevUrl);
          } catch {}
        }
        return null;
      });
    };
  }, [isOpen, submission]);

  // Keyboard shortcut for Escape & Body lock
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // Actions
  const handlePrint = () => {
    if (activeTab === "preview") {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
      }
    } else if (pdfIframeRef.current?.contentWindow) {
      pdfIframeRef.current.contentWindow.focus();
      pdfIframeRef.current.contentWindow.print();
    } else {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    if (isDownloading) return;

    // 1. If PDF blob is already available, download immediately
    if (pdfBlob) {
      PdfService.downloadBlob(pdfBlob, fileName);
      setNotice("Inspection report PDF downloaded successfully.");
      setTimeout(() => setNotice(null), 4000);
      return;
    }

    // 2. If backend generation is currently in progress, wait for it or fetch
    setIsDownloading(true);
    setNotice("Generating high-resolution official PDF...");

    try {
      const reportData = PdfService.extractReportData(submission);
      const raw = await PdfService.fetchRawChecklistValues(submission.id).catch(() => null);
      if (raw) {
        Object.assign(reportData.values, raw.values);
        Object.assign(reportData.notes, raw.notes);
        Object.assign(reportData.photos, raw.photos);
      }
      const blob = await PdfService.fetchReportPdfBlob({
        visitId: submission.id,
        siteName: submission.siteName,
        companyName: submission.customer,
        technicianName: submission.sentBy,
        values: reportData.values,
        notes: reportData.notes,
        photos: reportData.photos,
      });

      if (blob) {
        setPdfBlob(blob);
        const url = window.URL.createObjectURL(blob);
        setPdfBlobUrl(url);
        PdfService.downloadBlob(blob, fileName);
        setNotice("Inspection report PDF downloaded successfully.");
      } else {
        // Fallback: trigger print dialog to save as PDF
        setNotice("Opening print dialog — select 'Save as PDF' to save.");
        handlePrint();
      }
    } catch (err) {
      console.error("[PdfReportPreviewModal] Download error:", err);
      setNotice("Direct download timed out. Opening printable preview.");
      handlePrint();
    } finally {
      setIsDownloading(false);
      setTimeout(() => setNotice(null), 5000);
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 10, 150));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 10, 60));
  const handleResetZoom = () => setZoom(100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl h-[94vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/95 z-20 shrink-0 gap-3">
          {/* Left Brand & Document Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white font-black text-xs shadow-md shrink-0">
              EC
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">
                  PDF Report Preview
                </h3>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {activeTemplate ? activeTemplate.name : "Standard Template"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {submission.siteName} · {submission.customer} · {submission.formattedDate}
              </p>
            </div>
          </div>

          {/* Center Tabs: Instant Interactive Preview vs Official PDF Binary */}
          <div className="hidden md:flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === "preview"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye size={13} />
              <span>Interactive Preview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pdf")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === "pdf"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCheck2 size={13} />
              <span>Official PDF</span>
              {isGeneratingPdf ? (
                <Loader2 size={11} className="animate-spin text-sky-300 ml-0.5" />
              ) : pdfBlobUrl ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
              ) : null}
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Controls (Active in Preview tab) */}
            {activeTab === "preview" && (
              <div className="hidden lg:flex items-center bg-slate-800/90 rounded-xl border border-slate-700/70 p-0.5 text-xs text-slate-300">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoom <= 60}
                  className="p-1.5 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-2 py-0.5 font-mono text-[11px] font-semibold hover:text-white transition-colors cursor-pointer"
                  title="Reset Zoom to 100%"
                >
                  {zoom}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoom >= 150}
                  className="p-1.5 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={13} />
                </button>
              </div>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold hover:border-slate-600 transition-colors cursor-pointer"
              title="Print document or Save via Print"
            >
              <Printer size={13} className="text-slate-400" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
            >
              {isDownloading ? (
                <Loader2 size={13} className="animate-spin text-white" />
              ) : (
                <Download size={13} />
              )}
              <span>
                {isDownloading
                  ? "Preparing PDF..."
                  : "Download PDF"}
              </span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              title="Close Preview (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Floating Notice / Toast */}
        {notice && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-slate-950/95 border border-sky-500/40 text-sky-200 text-xs font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={14} className="text-sky-400 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Modal Body / Viewer Canvas */}
        <div className="flex-1 overflow-auto bg-slate-950/80 p-2 sm:p-4 md:p-6 flex flex-col items-center">
          {activeTab === "preview" ? (
            /* ======================================================== */
            /* TAB 1: Instant Interactive Document Preview (HTML)       */
            /* ======================================================== */
            <div
              className="transition-all duration-150 ease-out flex flex-col items-center w-full"
              style={{
                transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
                transformOrigin: "top center",
              }}
            >
              <div
                className="w-full max-w-[880px] bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-300 dark:border-zinc-700/80 overflow-hidden"
                style={{
                  minHeight: `${iframeHeight}px`,
                }}
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={htmlContent}
                  title="Inspection Report Document"
                  onLoad={handleIframeLoad}
                  className="w-full border-0 block"
                  style={{
                    height: `${iframeHeight}px`,
                  }}
                />
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* TAB 2: Official Native Chromium PDF Binary Viewer        */
            /* ======================================================== */
            <div className="w-full h-full flex flex-col items-center justify-center">
              {pdfBlobUrl ? (
                <div className="w-full h-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
                  <iframe
                    ref={pdfIframeRef}
                    src={`${pdfBlobUrl}#view=FitH`}
                    title="Official PDF Document"
                    className="w-full h-full border-0"
                  />
                </div>
              ) : isGeneratingPdf ? (
                <div className="flex flex-col items-center justify-center p-8 max-w-md text-center bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <Loader2 size={28} className="animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">
                      Compiling Official PDF Report
                    </h4>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      Rendering high-resolution photos, vector checklist data, and
                      inspector sign-offs via Chromium engine. This takes a few seconds...
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-sky-300 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Eye size={13} />
                    View Instant Preview
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 max-w-md text-center bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <AlertCircle size={28} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">
                      Official PDF Renderer Offline
                    </h4>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      The Chromium PDF rendering service took longer than expected or is currently offline. You can preview the full interactive document or print / save as PDF directly.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab("preview")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      <Eye size={13} />
                      Open Preview
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                    >
                      <Printer size={13} />
                      Print / Save as PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Status Bar */}
        <div className="px-4 sm:px-6 py-2.5 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-300">
              EC POWER Official Audit Template
            </span>
            <span className="text-slate-600">·</span>
            <span>22 photos embedded</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-slate-500">
              Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px]">Esc</kbd> to close
            </span>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
            >
              Download PDF ({fileName})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

