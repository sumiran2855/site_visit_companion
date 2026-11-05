"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  SiteSubmission,
  SubmissionArea,
  SubmissionMedia,
} from "@/types/submission";
import { SubmissionService } from "@/services/submission.service";
import { useTranslation } from "@/i18n";

export function useSubmissionDetail(id: string) {
  const { t } = useTranslation();
  const [submission, setSubmission] = useState<SiteSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAreaId, setActiveAreaId] = useState<string>("");
  const [internalNotes, setInternalNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeMedia, setActiveMedia] = useState<SubmissionMedia | null>(null);
  const [isRequestMoreOpen, setIsRequestMoreOpen] = useState(false);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  const loadSubmission = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      await Promise.resolve();
      setIsLoading(true);
    }
    try {
      const data = await SubmissionService.getSubmissionById(id);
      if (data) {
        setSubmission(data);
        setInternalNotes(data.internalNotes || "");
        if (data.areas && data.areas.length > 0) {
          setActiveAreaId((prev) => {
            if (prev && data.areas.some((a) => a.id === prev)) return prev;
            const boilerArea = data.areas.find(
              (a) => a.id === "area-boiler" || a.name.toLowerCase().includes("boiler")
            );
            return boilerArea ? boilerArea.id : data.areas[0].id;
          });
        }
      }
    } catch (err) {
      console.error("Failed to load submission:", err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isCancelled = false;
    Promise.resolve().then(() => {
      if (!isCancelled) {
        loadSubmission();
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [loadSubmission]);

  // Background auto-refresh polling (every 3.5s) and window focus refresh
  // to ensure technician updates from mobile show up in real time without manual reload
  useEffect(() => {
    let isCancelled = false;

    const poll = async () => {
      try {
        const fresh = await SubmissionService.getSubmissionById(id);
        if (fresh && !isCancelled) {
          setSubmission(fresh);
        }
      } catch {
        console.log("Failed to poll submission data, will retry...");
      }
    };

    const intervalId = setInterval(poll, 3500);

    const onFocus = () => {
      poll();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [id]);

  // Active Area Object
  const activeArea = useMemo<SubmissionArea | null>(() => {
    if (!submission || !submission.areas) return null;
    return (
      submission.areas.find((a) => a.id === activeAreaId) ||
      submission.areas[0] ||
      null
    );
  }, [submission, activeAreaId]);

  // All Media flat list for lightbox viewer navigation
  const allMedia = useMemo<SubmissionMedia[]>(() => {
    if (!activeArea || !activeArea.media) return [];
    return activeArea.media;
  }, [activeArea]);

  // Are all areas marked OK?
  const allAreasOk = useMemo(() => {
    if (!submission || !submission.areas || submission.areas.length === 0)
      return false;
    return submission.areas.every((a) => a.status === "ok");
  }, [submission]);

  // Handlers
  const handleSelectArea = useCallback((areaId: string) => {
    setActiveAreaId(areaId);
  }, []);

  const handleMarkAreaOk = useCallback(async () => {
    if (!submission || !activeArea) return;
    try {
      const updated = await SubmissionService.updateAreaStatus(
        submission.id,
        activeArea.id,
        "ok"
      );
      setSubmission(updated);
      showToast(
        t(
          "submissionDetail.toasts.areaMarkedOk",
          `Area "${activeArea.name}" marked as OK`,
          { area: activeArea.name }
        )
      );
    } catch (err) {
      console.error("Failed to mark area OK:", err);
    }
  }, [submission, activeArea, showToast, t]);

  const handleQueueRequest = useCallback(
    async (text: string) => {
      if (!submission || !activeArea) return;
      try {
        const updated = await SubmissionService.queueCustomerRequest(
          submission.id,
          activeArea.id,
          text
        );
        setSubmission(updated);
        setIsRequestMoreOpen(false);
        showToast(
          t(
            "submissionDetail.toasts.requestQueued",
            `Request queued for "${activeArea.name}"`,
            { area: activeArea.name }
          )
        );
      } catch (err) {
        console.error("Failed to queue request:", err);
      }
    },
    [submission, activeArea, showToast, t]
  );

  const handleRemoveRequest = useCallback(
    async (requestId: string) => {
      if (!submission) return;
      try {
        const updated = await SubmissionService.removeQueuedRequest(
          submission.id,
          requestId
        );
        setSubmission(updated);
        showToast(
          t(
            "submissionDetail.toasts.requestRemoved",
            "Request removed from queue"
          )
        );
      } catch (err) {
        console.error("Failed to remove request:", err);
      }
    },
    [submission, showToast, t]
  );

  const handleSendRequestsToCustomer = useCallback(async () => {
    if (!submission) return;
    const count = (submission.customerRequests || []).length;
    if (count === 0) {
      showToast(
        t(
          "submissionDetail.toasts.noRequestsToSend",
          "No requests queued to send."
        )
      );
      return;
    }
    try {
      const updated = await SubmissionService.sendRequestsToCustomer(
        submission.id
      );
      setSubmission(updated);
      showToast(
        t(
          "submissionDetail.toasts.dispatchedSuccess",
          "Successfully dispatched request(s) to technician"
        )
      );
    } catch (err) {
      console.error("Failed to send requests:", err);
    }
  }, [submission, showToast, t]);

  const handleSaveInternalNotes = useCallback(async () => {
    if (!submission) return;
    setIsSavingNotes(true);
    try {
      const updated = await SubmissionService.saveInternalNotes(
        submission.id,
        internalNotes
      );
      setSubmission(updated);
      showToast(
        t("submissionDetail.toasts.notesSaved", "Internal note saved")
      );
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setIsSavingNotes(false);
    }
  }, [submission, internalNotes, showToast, t]);

  const handleDownloadZip = useCallback(async () => {
    if (!submission) return;
    try {
      await SubmissionService.downloadMediaZip(submission);
      showToast(
        t(
          "submissionDetail.toasts.zipDownloaded",
          "Media package manifest downloaded"
        )
      );
    } catch (err) {
      console.error("Failed to download ZIP:", err);
    }
  }, [submission, showToast, t]);

  // Media Lightbox Navigation
  const handleOpenMedia = useCallback((media: SubmissionMedia) => {
    setActiveMedia(media);
  }, []);

  const handleCloseMedia = useCallback(() => {
    setActiveMedia(null);
  }, []);

  const handleNextMedia = useCallback(() => {
    if (!activeMedia || allMedia.length === 0) return;
    const currentIndex = allMedia.findIndex((m) => m.id === activeMedia.id);
    const nextIndex = (currentIndex + 1) % allMedia.length;
    setActiveMedia(allMedia[nextIndex]);
  }, [activeMedia, allMedia]);

  const handlePrevMedia = useCallback(() => {
    if (!activeMedia || allMedia.length === 0) return;
    const currentIndex = allMedia.findIndex((m) => m.id === activeMedia.id);
    const prevIndex = (currentIndex - 1 + allMedia.length) % allMedia.length;
    setActiveMedia(allMedia[prevIndex]);
  }, [activeMedia, allMedia]);

  return {
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
  };
}

