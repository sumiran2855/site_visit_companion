"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminService } from "@/services/admin.service";
import type { PendingAccessRequest, Company, AdminDashboardMetrics } from "@/types/admin";
import type { UserRole, UserProfile } from "@/types/auth";

const INITIAL_METRICS: AdminDashboardMetrics = {
  pendingRequestsCount: 0,
  totalMembersCount: 0,
  totalCompaniesCount: 0,
  totalVisitsCount: 0,
  retentionWarningCount: 0,
};

export function resolveAdminCompanyName(
  user: UserProfile | null | undefined,
  companies: Company[]
): string | null {
  if (!user) return null;
  return (
    user.companyName ||
    (user.companyId ? companies.find((c) => c.id === user.companyId)?.name : null) ||
    user.requestedCompany ||
    null
  );
}

export function useAdminHub() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const loadRunId = useRef(0);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSuperAdmin = user?.role === "super_admin" || user?.role === "admin";
  const isCompanyAdmin = user?.role === "company_admin";
  const hasAccess = isSuperAdmin || isCompanyAdmin;

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<AdminDashboardMetrics>(INITIAL_METRICS);
  const [pendingRequests, setPendingRequests] = useState<PendingAccessRequest[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Modals state
  const [approveTarget, setApproveTarget] = useState<PendingAccessRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingAccessRequest | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<"approving" | "rejecting" | null>(null);

  const showBanner = useCallback((msg: string) => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
    }
    setBannerMessage(msg);
    bannerTimerRef.current = setTimeout(() => {
      setBannerMessage(null);
      bannerTimerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
    };
  }, []);

  const loadData = useCallback(async () => {
    if (isAuthLoading) return;
    const runId = ++loadRunId.current;
    try {
      const comps = await AdminService.listCompaniesWithCounts();

      const adminCompanyName = resolveAdminCompanyName(user, comps);
      const adminCompanyId = user?.companyId || null;

      const [allMetrics, requests] = await Promise.all([
        AdminService.getDashboardMetrics(
          isSuperAdmin ? undefined : adminCompanyName,
          isSuperAdmin ? undefined : adminCompanyId,
          isSuperAdmin,
          comps
        ),
        AdminService.listPendingRequests(
          isSuperAdmin ? undefined : adminCompanyName || undefined,
          isSuperAdmin ? undefined : adminCompanyId || undefined,
          comps
        ),
      ]);

      if (runId !== loadRunId.current) return;

      setMetrics(allMetrics);
      setPendingRequests(requests);
      setCompanies(comps);
    } catch (e) {
      console.error("[useAdminHub] Failed to load admin dashboard:", e);
    } finally {
      if (runId === loadRunId.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [isAuthLoading, user, isSuperAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  const displayedRequests = useMemo(() => {
    if (isSuperAdmin) return pendingRequests;
    const adminCompanyName = resolveAdminCompanyName(user, companies);
    return pendingRequests.filter((r) =>
      AdminService.matchesCompany(
        r.requestedCompany,
        adminCompanyName,
        user?.companyId,
        companies
      )
    );
  }, [pendingRequests, isSuperAdmin, user, companies]);

  const handleApproveConfirm = useCallback(
    async (
      requestId: string,
      companyId: string,
      companyName: string,
      role: UserRole
    ) => {
      setProcessingRequestId(requestId);
      setProcessingAction("approving");
      try {
        const res = await AdminService.approveRequest(requestId, companyId, companyName, role);
        if (res.success) {
          showBanner("Applicant approved and assigned successfully");
        } else {
          showBanner("Failed to approve request");
        }
        await loadData();
      } catch (e) {
        console.error("Failed to approve request:", e);
        showBanner("Failed to approve request");
      } finally {
        setProcessingRequestId(null);
        setProcessingAction(null);
      }
    },
    [loadData, showBanner]
  );

  const handleRejectConfirm = useCallback(
    async (requestId: string) => {
      setProcessingRequestId(requestId);
      setProcessingAction("rejecting");
      try {
        await AdminService.rejectRequest(requestId);
        showBanner("Access request rejected and purged");
        await loadData();
      } catch (e) {
        console.error("Failed to reject request:", e);
        showBanner("Failed to reject request");
      } finally {
        setProcessingRequestId(null);
        setProcessingAction(null);
      }
    },
    [loadData, showBanner]
  );

  return {
    user,
    isSuperAdmin,
    isCompanyAdmin,
    hasAccess,
    isLoading,
    isRefreshing,
    metrics,
    companies,
    pendingRequests,
    displayedRequests,
    bannerMessage,
    processingRequestId,
    processingAction,
    approveTarget,
    rejectTarget,
    setApproveTarget,
    setRejectTarget,
    loadData,
    onRefresh,
    handleApproveConfirm,
    handleRejectConfirm,
  };
}

