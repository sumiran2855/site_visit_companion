"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminService } from "@/services/admin.service";
import type { PDFTemplate, TemplateElement, TemplatePage } from "@/types/admin";
import { DEFAULT_EC_POWER_PDF_TEMPLATE } from "@/config/default-template.config";

export function useAdminTemplate() {
  const { user } = useAuth();
  const isElevatedAdmin = user?.role === "super_admin" || user?.role === "company_admin" || user?.role === "admin";

  const [template, setTemplate] = useState<PDFTemplate>(DEFAULT_EC_POWER_PDF_TEMPLATE);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isSaving, setIsSaving] = useState(false);

  // Modals & Drawer state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [showPlaceholdersHelper, setShowPlaceholdersHelper] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    AdminService.getTemplateForEditing()
      .then(({ template: data, unpublishedDraft }) => {
        if (!isMounted) return;
        if (data && Array.isArray(data.pages) && data.pages.length > 0) {
          setTemplate(data);
        }
        if (unpublishedDraft) {
          showToast("Loaded earlier edits — click Save to make them the active template");
        }
      })
      .catch((e) => {
        console.error("[useAdminTemplate] Failed to load template:", e);
      });

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const pages =
    template.pages && template.pages.length > 0
      ? template.pages
      : DEFAULT_EC_POWER_PDF_TEMPLATE.pages;
  const currentPage: TemplatePage = pages[activePageIndex] || pages[0];

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0 || !currentPage) return;
      const newElements = [...currentPage.elements];
      const temp = newElements[index - 1];
      newElements[index - 1] = newElements[index];
      newElements[index - 1] = temp;
      newElements[index] = temp; // Fix standard swap
      const newElem = [...currentPage.elements];
      const [moved] = newElem.splice(index, 1);
      newElem.splice(index - 1, 0, moved);

      const newPages = [...template.pages];
      newPages[activePageIndex] = { ...currentPage, elements: newElem };
      setTemplate((prev) => ({ ...prev, pages: newPages }));
    },
    [currentPage, activePageIndex, template.pages]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (!currentPage || index === currentPage.elements.length - 1) return;
      const newElem = [...currentPage.elements];
      const [moved] = newElem.splice(index, 1);
      newElem.splice(index + 1, 0, moved);

      const newPages = [...template.pages];
      newPages[activePageIndex] = { ...currentPage, elements: newElem };
      setTemplate((prev) => ({ ...prev, pages: newPages }));
    },
    [currentPage, activePageIndex, template.pages]
  );

  const handleDeleteElement = useCallback(
    (id: string) => {
      if (!currentPage) return;
      const newElements = currentPage.elements.filter((el) => el.id !== id);
      const newPages = [...template.pages];
      newPages[activePageIndex] = { ...currentPage, elements: newElements };
      setTemplate((prev) => ({ ...prev, pages: newPages }));
      showToast("Element removed");
    },
    [currentPage, activePageIndex, template.pages, showToast]
  );

  const handleAddElement = useCallback(
    (newElement: TemplateElement) => {
      if (!currentPage) return;
      const newElements = [...currentPage.elements, newElement];
      const newPages = [...template.pages];
      newPages[activePageIndex] = { ...currentPage, elements: newElements };
      setTemplate((prev) => ({ ...prev, pages: newPages }));
      showToast(`Added ${newElement.label || "Element"}`);
    },
    [currentPage, activePageIndex, template.pages, showToast]
  );

  const handleAddPage = useCallback(() => {
    const pageNum = template.pages.length + 1;
    const newPage: TemplatePage = {
      id: `page-${Date.now()}`,
      title: `Page ${pageNum}`,
      pageNumber: pageNum,
      elements: [
        {
          id: `el-heading-${Date.now()}`,
          type: "heading",
          label: `Section ${pageNum}`,
          content: "Additional Inspection Findings",
          width: "full",
        },
      ],
    };
    setTemplate((prev) => ({ ...prev, pages: [...prev.pages, newPage] }));
    setActivePageIndex(template.pages.length);
    showToast(`Added Page ${pageNum}`);
  }, [template.pages.length, showToast]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const saved = await AdminService.saveTemplate(template);
      setTemplate(saved);
      showToast("Template saved successfully");
    } catch {
      showToast("Error saving template");
    } finally {
      setIsSaving(false);
    }
  }, [template, showToast]);

  const handleConfirmReset = useCallback(async () => {
    const restored = await AdminService.resetTemplate();
    setTemplate(restored);
    setActivePageIndex(0);
    showToast("Factory layout loaded — save to make it active");
  }, [showToast]);

  const handleZoomIn = useCallback(() => setZoomLevel((z) => Math.min(150, z + 15)), []);
  const handleZoomOut = useCallback(() => setZoomLevel((z) => Math.max(70, z - 15)), []);
  const handleZoomReset = useCallback(() => setZoomLevel(100), []);

  const togglePlaceholdersHelper = useCallback(() => {
    setShowPlaceholdersHelper((prev) => !prev);
  }, []);

  const openAddModal = useCallback(() => setIsAddModalOpen(true), []);
  const closeAddModal = useCallback(() => setIsAddModalOpen(false), []);
  const openPreviewModal = useCallback(() => setIsPreviewModalOpen(true), []);
  const closePreviewModal = useCallback(() => setIsPreviewModalOpen(false), []);
  const openResetModal = useCallback(() => setIsResetModalOpen(true), []);
  const closeResetModal = useCallback(() => setIsResetModalOpen(false), []);

  return {
    template,
    pages,
    currentPage,
    activePageIndex,
    setActivePageIndex,
    zoomLevel,
    isSaving,
    isElevatedAdmin,
    isAddModalOpen,
    isPreviewModalOpen,
    isResetModalOpen,
    showPlaceholdersHelper,
    toastMessage,
    handleMoveUp,
    handleMoveDown,
    handleDeleteElement,
    handleAddElement,
    handleAddPage,
    handleSave,
    handleConfirmReset,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    togglePlaceholdersHelper,
    openAddModal,
    closeAddModal,
    openPreviewModal,
    closePreviewModal,
    openResetModal,
    closeResetModal,
  };
}

