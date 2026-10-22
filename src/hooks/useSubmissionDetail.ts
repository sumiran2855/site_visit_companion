"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  SiteSubmission,
  SubmissionArea,
  SubmissionMedia,
} from "@/types/submission";
import { SubmissionService } from "@/services/submission.service";

export function useSubmissionDetail(id: string) {
  const [submission, setSubmission] = useState<SiteSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAreaId, setActiveAreaId] = useState<string>("");
  const [internalNotes, setInternalNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [isRequestMoreOpen, setIsRequestMoreOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [activeMedia, setActiveMedia] = useState<SubmissionMedia | null>(null);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  const loadSubmission = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await SubmissionService.getSubmissionById(id);
      if (data) {
        setSubmission(data);
        setInternalNotes(data.internalNotes || "");
        if (data.areas && data.areas.length > 0) {
          // If no active area or active area doesn't exist, pick boiler room or first area
          const boilerArea = data.areas.find(
            (a) => a.id === "area-boiler" || a.name.toLowerCase().includes("boiler")
          );
          setActiveAreaId(boilerArea ? boilerArea.id : data.areas[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load submission:", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSubmission();
  }, [loadSubmission]);

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
      showToast(`Area "${activeArea.name}" marked as OK`);
    } catch (err) {
      console.error("Failed to mark area OK:", err);
    }
  }, [submission, activeArea, showToast]);

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
        showToast(`Request queued for "${activeArea.name}"`);
      } catch (err) {
        console.error("Failed to queue request:", err);
      }
    },
    [submission, activeArea, showToast]
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
        showToast("Request removed from queue");
      } catch (err) {
        console.error("Failed to remove request:", err);
      }
    },
    [submission, showToast]
  );

  const handleToggleChecklist = useCallback(
    async (checkId: string, checked: boolean) => {
      if (!submission) return;
      try {
        const updated = await SubmissionService.toggleChecklistItem(
          submission.id,
          checkId,
          checked
        );
        setSubmission(updated);
      } catch (err) {
        console.error("Failed to toggle checklist:", err);
      }
    },
    [submission]
  );

  const handleSaveInternalNotes = useCallback(async () => {
    if (!submission) return;
    setIsSavingNotes(true);
    try {
      const updated = await SubmissionService.saveInternalNotes(
        submission.id,
        internalNotes
      );
      setSubmission(updated);
      showToast("Internal note saved");
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setIsSavingNotes(false);
    }
  }, [submission, internalNotes, showToast]);

  const handleSendRequestsToCustomer = useCallback(async () => {
    if (!submission) return;
    const count = submission.customerRequests.length;
    if (count === 0) {
      showToast("No requests queued to send.");
      return;
    }
    try {
      const updated = await SubmissionService.sendRequestsToCustomer(
        submission.id
      );
      setSubmission(updated);
      showToast(`Successfully dispatched ${count} request(s) to customer`);
    } catch (err) {
      console.error("Failed to send requests:", err);
    }
  }, [submission, showToast]);

  const handleApproveSite = useCallback(async () => {
    if (!submission) return;
    try {
      const updated = await SubmissionService.approveSubmission(
        submission.id,
        "Martin H."
      );
      setSubmission(updated);
      setIsApproveConfirmOpen(false);
      showToast("Site submission successfully approved!");
    } catch (err) {
      console.error("Failed to approve site:", err);
    }
  }, [submission, showToast]);

  const handleRejectSite = useCallback(
    async (reason: string) => {
      if (!submission) return;
      try {
        const updated = await SubmissionService.rejectSubmission(
          submission.id,
          reason,
          "Martin H."
        );
        setSubmission(updated);
        setIsRejectModalOpen(false);
        showToast("Site submission rejected. Customer notified.");
      } catch (err) {
        console.error("Failed to reject site:", err);
      }
    },
    [submission, showToast]
  );

  const handleDownloadZip = useCallback(async () => {
    if (!submission) return;
    try {
      await SubmissionService.downloadMediaZip(submission);
      showToast("Media package manifest downloaded");
    } catch (err) {
      console.error("Failed to download ZIP:", err);
    }
  }, [submission, showToast]);

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
  };
}

