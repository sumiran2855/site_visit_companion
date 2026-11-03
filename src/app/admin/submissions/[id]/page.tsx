"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Download,
  FileText,
  CheckCircle2,
  Video,
  Image as ImageIcon,
  Share2,
  Check,
  Send,
  AlertCircle,
  Trash2,
  MessageSquare,
  Clock,
} from "lucide-react";
import { useSubmissionDetail } from "@/hooks/useSubmissionDetail";
import { MediaViewerModal } from "@/components/submissions/MediaViewerModal";
import { PdfReportPreviewModal } from "@/components/submissions/PdfReportPreviewModal";
import { ShareSiteModal } from "@/components/submissions/ShareSiteModal";
import { RequestMoreModal } from "@/components/submissions/RequestMoreModal";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SubmissionDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const {
    submission,
    isLoading,
    activeArea,
    activeAreaId,
    internalNotes,
    setInternalNotes,
    isSavingNotes,
    toastMessage,
    activeMedia,
    handleSelectArea,
    handleSaveInternalNotes,
    handleDownloadZip,
    handleOpenMedia,
    handleCloseMedia,
    handleNextMedia,
    handlePrevMedia,
    isRequestMoreOpen,
    setIsRequestMoreOpen,
    allAreasOk,
    handleMarkAreaOk,
    handleQueueRequest,
    handleRemoveRequest,
    handleSendRequestsToCustomer,
  } = useSubmissionDetail(id);

  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12 text-center animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-zinc-800 rounded w-1/3 mx-auto mb-4"></div>
        <div className="h-4 bg-slate-100 dark:bg-zinc-800/60 rounded w-1/4 mx-auto mb-10"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-96 bg-slate-100 dark:bg-zinc-800/40 rounded-xl"></div>
          <div className="h-96 bg-slate-100 dark:bg-zinc-800/40 rounded-xl"></div>
          <div className="h-96 bg-slate-100 dark:bg-zinc-800/40 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
          Inspection not found
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested site inspection does not exist or has been removed.
        </p>
        <Link
          href="/admin/submissions"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
        >
          <ChevronLeft size={16} />
          Back to Submissions
        </Link>
      </div>
    );
  }

  const renderStatusBadge = (status: typeof submission.status) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Completed
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
            In progress
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

  const handleOpenPdfReport = () => {
    if (!submission) return;
    setIsPdfPreviewOpen(true);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-4">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white shadow-xl text-xs font-medium flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb Navigation */}
      <div>
        <Link
          href="/admin/submissions"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={14} />
          Submissions
        </Link>
      </div>

      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {submission.siteName}
            </h1>
            {renderStatusBadge(submission.status)}
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {submission.customer} · Inspected by {submission.sentBy} on{" "}
            {submission.formattedDate} · {submission.mediaCount.photos} photos,{" "}
            {submission.mediaCount.videos} videos
          </p>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Share2 size={14} className="text-slate-500 dark:text-zinc-400" />
            <span>Share site</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadZip}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Download size={14} className="text-slate-500 dark:text-zinc-400" />
            <span>Download ZIP</span>
          </button>
          <button
            type="button"
            onClick={handleOpenPdfReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer"
          >
            <FileText size={14} className="text-slate-500 dark:text-zinc-400" />
            <span>PDF report</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Review Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMN 1: AREAS LIST */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/90 dark:border-zinc-800 shadow-xs p-4 flex flex-col justify-between min-h-[460px]">
          <div>
            <h2 className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5 px-1">
              Survey Areas
            </h2>
            <div className="space-y-1">
              {submission.areas.map((area) => {
                const isSelected = area.id === activeAreaId;
                const mediaCount = area.media ? area.media.length : 0;
                const isAreaOk = area.status === "ok";
                const isMoreRequested = area.status === "more_requested";

                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => handleSelectArea(area.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-slate-100 text-slate-900 font-bold dark:bg-zinc-800 dark:text-white ring-1 ring-slate-300 dark:ring-zinc-700"
                        : "text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      {isAreaOk && (
                        <span
                          className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                          title="Area OK"
                        />
                      )}
                      {isMoreRequested && (
                        <span
                          className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                          title="Updates Requested"
                        />
                      )}
                      {!isAreaOk && !isMoreRequested && (
                        <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-zinc-600 shrink-0" />
                      )}
                      <span className="truncate">{area.name}</span>
                    </div>
                    {mediaCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                        {mediaCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {allAreasOk && (
            <div className="mt-4 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2">
              <CheckCircle2
                size={14}
                className="text-emerald-600 dark:text-emerald-400 shrink-0"
              />
              <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                All areas verified OK
              </span>
            </div>
          )}
        </div>

        {/* COLUMN 2: ACTIVE AREA DETAILS & MEDIA */}
        <div className="lg:col-span-6 space-y-4">
          {activeArea && (
            <>
              {/* Media Card */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/90 dark:border-zinc-800 shadow-xs p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {activeArea.name}
                    </h3>
                    {activeArea.status === "ok" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <Check size={10} /> Area OK
                      </span>
                    )}
                    {activeArea.status === "more_requested" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        <AlertCircle size={10} /> Request Pending
                      </span>
                    )}
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                      · {activeArea.media?.length || 0} media item(s)
                    </span>
                  </div>

                  {/* Actions for this area */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsRequestMoreOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                    >
                      <AlertCircle size={12} />
                      <span>Request more</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleMarkAreaOk}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        activeArea.status === "ok"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                          : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                      }`}
                    >
                      <Check size={12} />
                      <span>{activeArea.status === "ok" ? "Area OK" : "Mark area OK"}</span>
                    </button>
                  </div>
                </div>

                {/* Media Grid */}
                <div className="pt-4">
                  {activeArea.media && activeArea.media.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {activeArea.media.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleOpenMedia(item)}
                          className="group relative rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800/80 overflow-hidden cursor-pointer hover:shadow-md transition-all aspect-4/3 flex flex-col justify-between"
                        >
                          {/* Image / Video Preview */}
                          {item.type === "video" ? (
                            <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
                              <video
                                src={item.url}
                                muted
                                playsInline
                                preload="metadata"
                                className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                  <Video size={18} />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={item.url}
                              alt={item.title}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          )}

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/40 pointer-events-none"></div>

                          {/* Top Tag (Photo or Video) */}
                          <div className="relative p-2 flex items-center justify-between z-10">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white ${
                                item.type === "video"
                                  ? "bg-rose-600/90"
                                  : "bg-slate-900/80"
                              }`}
                            >
                              {item.type === "video" ? (
                                <Video size={10} />
                              ) : (
                                <ImageIcon size={10} />
                              )}
                              {item.type === "video" ? "Video" : "Photo"}
                            </span>

                            {item.duration && (
                              <span className="text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                                {item.duration}
                              </span>
                            )}
                          </div>

                          {/* Bottom Label */}
                          <div className="relative p-2 z-10">
                            <span className="text-xs font-semibold text-white drop-shadow-sm line-clamp-1">
                              {item.title}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No photos or videos uploaded for this area.
                    </div>
                  )}

                  <p className="mt-3 text-[11px] text-slate-400 dark:text-zinc-500">
                    Click a photo or video to view full size.
                  </p>
                </div>
              </div>

              {/* Specifications Card */}
              {Object.keys(activeArea.specs).length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/90 dark:border-zinc-800 shadow-xs p-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Specifications
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    {Object.entries(activeArea.specs).map(([label, val]) => (
                      <div key={label}>
                        <span className="text-slate-400 dark:text-zinc-500 text-[11px] block">
                          {label}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs mt-0.5 block">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer/Admin Request on Area */}
              {activeArea.customerNote && (
                <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-900/60 p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <AlertCircle size={13} />
                    <span>Active Request for Technician:</span>
                  </div>
                  <p className="text-xs text-amber-900 dark:text-amber-200 whitespace-pre-wrap pl-4">
                    {activeArea.customerNote}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* COLUMN 3: RIGHT SIDEBAR */}
        <div className="lg:col-span-3 space-y-4">
          {/* 1. Requests & Technician Responses Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/90 dark:border-zinc-800 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Requests & Responses ({(submission.customerRequests || []).length})
              </h3>
              {(submission.customerRequests || []).some((r) => !r.resolved) && (
                <button
                  type="button"
                  onClick={handleSendRequestsToCustomer}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 transition-colors cursor-pointer"
                  title="Dispatch queued requests to technician app"
                >
                  <Send size={11} />
                  <span>Dispatch</span>
                </button>
              )}
            </div>

            {submission.customerRequests && submission.customerRequests.length > 0 ? (
              <div className="space-y-3 pt-1">
                {submission.customerRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs block">
                          {req.areaName}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {req.resolved ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 size={10} /> Resolved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            <Clock size={10} /> Pending
                          </span>
                        )}
                        {!req.resolved && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRequest(req.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                            title="Remove request"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Admin Request Text */}
                    <div className="text-xs text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 p-2 rounded border border-slate-100 dark:border-zinc-700/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Admin Note:
                      </span>
                      {req.text}
                    </div>

                    {/* Technician Response if present */}
                    {req.technicianResponse && (
                      <div className="text-xs text-emerald-900 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded border border-emerald-200/70 dark:border-emerald-900/50">
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-0.5">
                          <MessageSquare size={10} />
                          <span>Technician Response:</span>
                        </div>
                        <p className="whitespace-pre-wrap">{req.technicianResponse}</p>
                      </div>
                    )}

                    {/* Response Photos if attached by technician */}
                    {req.responsePhotos && req.responsePhotos.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Submitted Photos ({req.responsePhotos.length}):
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {req.responsePhotos.map((photo, idx) => (
                            <button
                              key={photo.id || idx}
                              type="button"
                              onClick={() =>
                                handleOpenMedia({
                                  id: photo.id || `req-photo-${idx}`,
                                  type: "photo",
                                  title: photo.fileName || `Technician Response Photo`,
                                  url: photo.url,
                                  fieldId: photo.fieldId || "",
                                  takenAt: photo.createdAt || "",
                                })
                              }
                              className="relative aspect-square rounded-md overflow-hidden border border-slate-200 dark:border-zinc-700 hover:opacity-90 group cursor-pointer"
                            >
                              <img
                                src={photo.url}
                                alt={photo.fileName || "Technician Photo"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center rounded-lg bg-slate-50 dark:bg-zinc-800/40 border border-dashed border-slate-200 dark:border-zinc-700/80">
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  No requests sent for this site inspection. Use &quot;Request more&quot; on any area to ask the technician for clearer photos or information.
                </p>
              </div>
            )}
          </div>

          {/* 2. Overview Metadata Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/90 dark:border-zinc-800 shadow-xs p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Site Overview
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 dark:text-zinc-500 block text-[11px]">
                  Site Name
                </span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  {submission.siteName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-zinc-500 block text-[11px]">
                  Customer / Organization
                </span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  {submission.customer}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-zinc-500 block text-[11px]">
                  Inspector
                </span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  {submission.sentBy}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-zinc-500 block text-[11px]">
                  Date Recorded
                </span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  {submission.formattedDate}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Internal Note Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/90 dark:border-zinc-800 shadow-xs p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Internal Note
              </h3>
              {internalNotes !== (submission.internalNotes || "") && (
                <button
                  type="button"
                  onClick={handleSaveInternalNotes}
                  disabled={isSavingNotes}
                  className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  {isSavingNotes ? "Saving..." : "Save note"}
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Internal notes visible to internal team only"
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>
      </div>

      {/* MODALS */}
      {activeMedia && (
        <MediaViewerModal
          media={activeMedia}
          areaName={activeArea?.name}
          onClose={handleCloseMedia}
          onNext={handleNextMedia}
          onPrev={handlePrevMedia}
          hasMultiple={Boolean(activeArea?.media && activeArea.media.length > 1)}
        />
      )}

      {submission && (
        <PdfReportPreviewModal
          isOpen={isPdfPreviewOpen}
          submission={submission}
          onClose={() => setIsPdfPreviewOpen(false)}
        />
      )}

      {submission && (
        <ShareSiteModal
          isOpen={isShareModalOpen}
          submission={submission}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {submission && (
        <RequestMoreModal
          isOpen={isRequestMoreOpen}
          areaName={activeArea?.name || ""}
          onClose={() => setIsRequestMoreOpen(false)}
          onSubmit={handleQueueRequest}
        />
      )}
    </div>
  );
}
