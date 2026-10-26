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
  Check,
  X,
  Send,
  Loader2,
} from "lucide-react";
import { useSubmissionDetail } from "@/hooks/useSubmissionDetail";
import { MediaViewerModal } from "@/components/submissions/MediaViewerModal";
import { RequestMoreModal } from "@/components/submissions/RequestMoreModal";
import { RejectSubmissionModal } from "@/components/submissions/RejectSubmissionModal";
import { ApproveSiteModal } from "@/components/submissions/ApproveSiteModal";
import { PdfReportPreviewModal } from "@/components/submissions/PdfReportPreviewModal";
import { PdfService } from "@/services/pdf.service";

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
    allAreasOk,
    internalNotes,
    setInternalNotes,
    isSavingNotes,
    toastMessage,
    // Modals
    isRequestMoreOpen,
    setIsRequestMoreOpen,
    isRejectModalOpen,
    setIsRejectModalOpen,
    isApproveConfirmOpen,
    setIsApproveConfirmOpen,
    activeMedia,
    // Actions
    handleSelectArea,
    handleMarkAreaOk,
    handleQueueRequest,
    handleRemoveRequest,
    handleToggleChecklist,
    handleSaveInternalNotes,
    handleSendRequestsToCustomer,
    handleApproveSite,
    handleRejectSite,
    handleDownloadZip,
    // Lightbox
    handleOpenMedia,
    handleCloseMedia,
    handleNextMedia,
    handlePrevMedia,
  } = useSubmissionDetail(id);

  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [localToast, setLocalToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setLocalToast(msg);
    setTimeout(() => {
      setLocalToast(null);
    }, 4500);
  };

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
          Submission not found
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested site inspection submission does not exist or has been
          removed.
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

  const pendingRequestsCount = submission.customerRequests.filter((r) => !r.resolved).length;
  const resolvedRequestsCount = submission.customerRequests.filter((r) => r.resolved).length;
  const totalRequestsCount = submission.customerRequests.length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-4">
      {/* Toast Notification Banner */}
      {(toastMessage || localToast) && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white shadow-xl text-xs font-medium flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{localToast || toastMessage}</span>
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

      {/* Top Header Card (Matching Reference Image 2) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {submission.siteName}
            </h1>
            {renderStatusBadge(submission.status)}
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {submission.customer} · Sent by {submission.sentBy} on{" "}
            {submission.formattedDate} · {submission.mediaCount.photos} photos,{" "}
            {submission.mediaCount.videos} videos
          </p>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadZip}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Download size={14} className="text-slate-500 dark:text-zinc-400" />
            Download ZIP
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

      {/* Main 3-Column Review Layout (Matching Reference Image 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ======================================================== */}
        {/* COLUMN 1: AREAS LIST & STATUS (Width: 3/12 cols)         */}
        {/* ======================================================== */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/90 dark:border-zinc-800 shadow-xs p-4 flex flex-col justify-between min-h-[460px]">
          <div>
            <h2 className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5 px-1">
              Areas
            </h2>
            <div className="space-y-1">
              {submission.areas.map((area) => {
                const isSelected = area.id === activeAreaId;

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
                    <span className="truncate mr-2">{area.name}</span>

                    {/* Status Dot */}
                    {area.status === "ok" ? (
                      <span
                        className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"
                        title="OK"
                      />
                    ) : area.status === "more_requested" ? (
                      <span
                        className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"
                        title="More requested"
                      />
                    ) : (
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 shrink-0"
                        title="Not reviewed"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend at bottom of card */}
          <div className="pt-4 mt-6 border-t border-slate-100 dark:border-zinc-800 text-[11px] space-y-1.5 text-slate-500 dark:text-zinc-400 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>OK</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>More requested</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"></span>
              <span>Not reviewed</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUMN 2: ACTIVE AREA DETAILS & MEDIA (Width: 6/12 cols)  */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 space-y-4">
          {activeArea && (
            <>
              {/* Media Card */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/90 dark:border-zinc-800 shadow-xs p-5">
                {/* Area Header & Action Buttons */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {activeArea.name}
                  </h3>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRequestMoreOpen(true)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      Request more
                    </button>
                    <button
                      type="button"
                      onClick={handleMarkAreaOk}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeArea.status === "ok"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700"
                          : "border border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                      }`}
                    >
                      <Check size={13} strokeWidth={2.5} />
                      Mark area OK
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

                          {/* Bottom Label (e.g. Wall 1, 360° room, Floor / drain) */}
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
                      No photos or videos uploaded for this area yet.
                    </div>
                  )}

                  {/* Caption underneath media grid */}
                  <p className="mt-3 text-[11px] text-slate-400 dark:text-zinc-500">
                    Click a photo or video to open it full size. Each file stays
                    linked to the exact field it was taken for.
                  </p>
                </div>
              </div>

              {/* Specifications & Customer Note Card */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/90 dark:border-zinc-800 shadow-xs p-5 space-y-3">
                {/* 3 Metric Columns */}
                <div className="grid grid-cols-3 gap-4 pb-3 border-b border-slate-100 dark:border-zinc-800 text-xs">
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

                {/* Customer Note */}
                {activeArea.customerNote && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">
                      Customer note
                    </span>
                    <p className="text-xs text-slate-700 dark:text-zinc-300 italic">
                      &ldquo;{activeArea.customerNote}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ======================================================== */}
        {/* COLUMN 3: RIGHT SIDEBAR - REVIEW, CHECKLIST & ACTIONS    */}
        {/* (Width: 3/12 cols)                                       */}
        {/* ======================================================== */}
        <div className="lg:col-span-3 space-y-4">
          {/* 1. Approval Checklist Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/90 dark:border-zinc-800 shadow-xs p-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
              Approval checklist
            </h3>
            <div className="space-y-2">
              {submission.approvalChecklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) =>
                      handleToggleChecklist(item.id, e.target.checked)
                    }
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:checked:bg-sky-500 cursor-pointer"
                  />
                  <span
                    className={
                      item.checked
                        ? "font-medium"
                        : "text-slate-500 dark:text-zinc-400"
                    }
                  >
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Message to Customer Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/90 dark:border-zinc-800 shadow-xs p-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Message to customer
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 mb-2.5">
              {pendingRequestsCount > 0
                ? `${pendingRequestsCount} pending request(s) queued.`
                : totalRequestsCount > 0
                ? `All ${resolvedRequestsCount} request(s) resolved.`
                : "No customer requests queued."}
            </p>

            {totalRequestsCount > 0 ? (
              <div className="space-y-2">
                {submission.customerRequests.map((req) => {
                  const isResolved = Boolean(req.resolved);
                  return (
                    <div
                      key={req.id}
                      className={`p-3 rounded-lg border text-[11px] ${
                        isResolved
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                          : "bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-1.5">
                            {isResolved ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                                <Check size={10} />
                                Resolved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                                Pending
                              </span>
                            )}
                            <span className="font-bold text-slate-900 dark:text-white">
                              {req.areaName}
                            </span>
                          </div>
                          <p className="leading-snug text-slate-700 dark:text-zinc-300">
                            {req.text}
                          </p>

                          {/* Technician Response if resolved */}
                          {isResolved && req.technicianResponse && (
                            <div className="mt-1.5 pt-1.5 border-t border-emerald-200 dark:border-emerald-800/60">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                                Technician Response:
                              </p>
                              <p className="text-emerald-950 dark:text-emerald-100 font-medium leading-snug">
                                &ldquo;{req.technicianResponse}&rdquo;
                              </p>
                            </div>
                          )}

                          {/* Attached Response Photos */}
                          {isResolved && Array.isArray(req.responsePhotos) && req.responsePhotos.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {req.responsePhotos.map((photo: any, idx: number) => {
                                const photoUri = photo.remoteUrl || photo.uri;
                                return (
                                  <button
                                    key={photo.id || idx}
                                    type="button"
                                    onClick={() =>
                                      handleOpenMedia({
                                        id: photo.id || `resp-photo-${idx}`,
                                        type: "photo",
                                        title: photo.fileName || `Response Photo #${idx + 1}`,
                                        url: photoUri,
                                        fieldId: photo.fieldId || "",
                                        takenAt: photo.createdAt || new Date().toISOString(),
                                      })
                                    }
                                    className="relative w-14 h-14 rounded-md overflow-hidden border border-emerald-300 dark:border-emerald-700 group hover:opacity-90 transition-opacity cursor-pointer"
                                    title="View response photo"
                                  >
                                    <img
                                      src={photoUri}
                                      alt="Technician response"
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {!isResolved && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRequest(req.id)}
                            className="text-amber-500 hover:text-amber-800 dark:hover:text-amber-100 p-0.5 rounded cursor-pointer"
                            title="Remove from queue"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 italic">
                No customer requests queued. Click &ldquo;Request more&rdquo; on
                any area to queue items.
              </p>
            )}
          </div>

          {/* 3. Internal Note Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/90 dark:border-zinc-800 shadow-xs p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Internal note
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
              placeholder="Only visible to EC Power"
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* 4. Action Buttons (Matching Screenshot) */}
          <div className="space-y-2 pt-1">
            {/* Primary Action: Send X requests to customer */}
            <button
              type="button"
              onClick={handleSendRequestsToCustomer}
              disabled={pendingRequestsCount === 0}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Send size={13} />
              {pendingRequestsCount > 0
                ? `Send ${pendingRequestsCount} request${
                    pendingRequestsCount > 1 ? "s" : ""
                  } to customer`
                : "Send requests to customer"}
            </button>

            {/* Secondary Action: Approve Site */}
            <button
              type="button"
              onClick={() => setIsApproveConfirmOpen(true)}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                allAreasOk
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-slate-300"
              }`}
            >
              <CheckCircle2 size={14} />
              {allAreasOk
                ? "Approve site"
                : "Approve site (all areas OK first)"}
            </button>

            {/* Tertiary / Dangerous Action: Reject Site */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(true)}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline cursor-pointer"
              >
                Reject site...
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODALS                                                   */}
      {/* ======================================================== */}
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

      {activeArea && (
        <RequestMoreModal
          isOpen={isRequestMoreOpen}
          areaName={activeArea.name}
          onClose={() => setIsRequestMoreOpen(false)}
          onSubmit={handleQueueRequest}
        />
      )}

      <RejectSubmissionModal
        isOpen={isRejectModalOpen}
        siteName={submission.siteName}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleRejectSite}
      />

      <ApproveSiteModal
        isOpen={isApproveConfirmOpen}
        submission={submission}
        allAreasOk={allAreasOk}
        onClose={() => setIsApproveConfirmOpen(false)}
        onConfirm={handleApproveSite}
      />

      {submission && (
        <PdfReportPreviewModal
          isOpen={isPdfPreviewOpen}
          submission={submission}
          onClose={() => setIsPdfPreviewOpen(false)}
        />
      )}
    </div>
  );
}
