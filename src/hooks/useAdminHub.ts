"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminService } from "@/services/admin.service";
import { HttpClient } from "@/lib/api/httpClient";
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
      const http = HttpClient.getInstance();

      // Fetch the 4 core resources in parallel ONCE
      const [comps, members, requests, visitsRes] = await Promise.all([
        AdminService.listCompanies(),
        AdminService.listMembers(),
        AdminService.listPendingRequests(),
        http.get<any>("/visits").catch(() => ({ data: [] })),
      ]);

      if (runId !== loadRunId.current) return;

      const visits: any[] = Array.isArray(visitsRes?.data)
        ? visitsRes.data
        : Array.isArray(visitsRes)
        ? visitsRes
        : [];

      // Compute enriched companies with member and visit counts in-memory
      const enrichedCompanies = comps.map((comp) => {
        const compId = comp.id.toLowerCase();
        const compName = comp.name.trim().toLowerCase();

        const memberCount = members.filter((m) => {
          if (m.companyId && m.companyId.toLowerCase() === compId) return true;
          if (m.companyName && m.companyName.trim().toLowerCase() === compName) return true;
          if (m.requestedCompany && m.requestedCompany.trim().toLowerCase() === compName) return true;
          return AdminService.matchesCompany(m.companyName || m.requestedCompany, comp.name, comp.id, comps);
        }).length;

        const visitCount = visits.filter((v: any) => {
          if (v.companyId && v.companyId.toLowerCase() === compId) return true;
          if (v.companyName && v.companyName.trim().toLowerCase() === compName) return true;
          return AdminService.matchesCompany(v.companyName, comp.name, comp.id, comps);
        }).length;

        return {
          ...comp,
          memberCount,
          visitCount,
        };
      });

      // Compute dashboard metrics in-memory
      const totalVisitsCount = enrichedCompanies.reduce((acc, c) => acc + (c.visitCount || 0), 0);
      const now = Date.now();
      const MS_PER_DAY = 1000 * 60 * 60 * 24;

      const retentionWarningCount = visits.filter((v: any) => {
        const created = new Date(v.createdAt);
        if (isNaN(created.getTime())) return false;
        const ageInDays = Math.floor((now - created.getTime()) / MS_PER_DAY);
        return ageInDays >= 335;
      }).length;

      const computedMetrics = {
        pendingRequestsCount: requests.length,
        totalMembersCount: members.length,
        totalCompaniesCount: isSuperAdmin ? enrichedCompanies.length : 1,
        totalVisitsCount: totalVisitsCount > 0 ? totalVisitsCount : visits.length,
        retentionWarningCount,
      };

      setMetrics(computedMetrics);
      setPendingRequests(requests);
      setCompanies(enrichedCompanies);
    } catch (e) {
      console.error("[useAdminHub] Failed to load admin dashboard:", e);
    } finally {
      if (runId === loadRunId.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [isAuthLoading, user?.id, isSuperAdmin]);

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

