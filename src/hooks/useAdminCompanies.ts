"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminService } from "@/services/admin.service";
import type { Company, CreateCompanyInput, UpdateCompanyInput } from "@/types/admin";

export function useAdminCompanies() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin" || user?.role === "admin";
  const isCompanyAdmin = user?.role === "company_admin";

  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [editCompanyTarget, setEditCompanyTarget] = useState<Company | null>(null);
  const [deleteCompanyTarget, setDeleteCompanyTarget] = useState<Company | null>(null);
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

  const loadData = useCallback(async () => {
    try {
      const data = await AdminService.listCompaniesWithCounts();
      setCompanies(data);
    } catch (e) {
      console.error("[useAdminCompanies] Failed to load companies:", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const clearSearchQuery = useCallback(() => {
    setSearchQuery("");
  }, []);

  const { roots, childMap, totalCount } = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.allowedEmailDomains?.some((d) => d.toLowerCase().includes(q)) ||
        c.contactEmail?.toLowerCase().includes(q)
    );

    const children: Record<string, Company[]> = {};
    const rootList: Company[] = [];

    if (q) {
      return {
        roots: filtered,
        childMap: {},
        totalCount: filtered.length,
      };
    }

    companies.forEach((comp) => {
      if (comp.parentId) {
        if (!children[comp.parentId]) children[comp.parentId] = [];
        children[comp.parentId].push(comp);
      } else {
        rootList.push(comp);
      }
    });

    return {
      roots: rootList,
      childMap: children,
      totalCount: companies.length,
    };
  }, [companies, searchQuery]);

  const handleCreateConfirm = useCallback(
    async (input: CreateCompanyInput) => {
      try {
        await AdminService.createCompany(input);
        showToast(input.parentId ? "Sub-company added successfully" : "Company created");
        await loadData();
      } catch (err: unknown) {
        console.error("Create company failed:", err);
        showToast(input.parentId ? "Failed to add sub-company" : "Failed to create company");
      }
    },
    [loadData, showToast]
  );

  const handleEditConfirm = useCallback(
    async (id: string, input: UpdateCompanyInput) => {
      try {
        await AdminService.updateCompany(id, input);
        showToast("Company updated successfully");
        await loadData();
      } catch (err: unknown) {
        console.error("Update company failed:", err);
        showToast("Failed to update company");
      }
    },
    [loadData, showToast]
  );

  const handleDeleteConfirm = useCallback(
    async (id: string) => {
      try {
        await AdminService.deleteCompany(id);
        showToast("Company removed");
        await loadData();
      } catch (err: unknown) {
        console.error("Delete company failed:", err);
        showToast("Failed to remove company");
      }
    },
    [loadData, showToast]
  );

  const openAddSubCompany = useCallback((parentId: string) => {
    setCreateParentId(parentId);
    setIsCreateModalOpen(true);
  }, []);

  const openCreateRoot = useCallback(() => {
    setCreateParentId(null);
    setIsCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditCompanyTarget(null);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteCompanyTarget(null);
  }, []);

  return {
    isSuperAdmin,
    isCompanyAdmin,
    companies,
    searchQuery,
    setSearchQuery,
    clearSearchQuery,
    collapsedNodes,
    isLoading,
    isRefreshing,
    onRefresh,
    toggleCollapse,
    roots,
    childMap,
    totalCount,
    isCreateModalOpen,
    createParentId,
    editCompanyTarget,
    deleteCompanyTarget,
    setEditCompanyTarget,
    setDeleteCompanyTarget,
    openAddSubCompany,
    openCreateRoot,
    closeCreateModal,
    closeEditModal,
    closeDeleteModal,
    handleCreateConfirm,
    handleEditConfirm,
    handleDeleteConfirm,
    toastMessage,
  };
}

