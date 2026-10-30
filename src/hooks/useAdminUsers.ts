"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminService } from "@/services/admin.service";
import type { PendingAccessRequest, Company } from "@/types/admin";
import type { User, UserRole } from "@/types/auth";

export type UsersTab = "members" | "requests";

export function useAdminUsers() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const loadRunId = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSuperAdmin = user?.role === "super_admin" || user?.role === "admin";
  const isCompanyAdmin = user?.role === "company_admin";
  const hasAccess = isSuperAdmin || isCompanyAdmin;

  const [activeTab, setActiveTab] = useState<UsersTab>("requests");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [members, setMembers] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingAccessRequest[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Processing state
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<"approving" | "rejecting" | null>(null);

  // Modals
  const [approveTarget, setApproveTarget] = useState<PendingAccessRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingAccessRequest | null>(null);
  const [roleTarget, setRoleTarget] = useState<User | null>(null);
  const [moveTarget, setMoveTarget] = useState<User | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<User | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    if (isAuthLoading) return;
    const runId = ++loadRunId.current;
    try {
      const comps = await AdminService.listCompanies();

      const adminCompanyName =
        user?.companyName ||
        (user?.companyId ? comps.find((c) => c.id === user?.companyId)?.name : null) ||
        user?.requestedCompany ||
        null;
      const adminCompanyId = user?.companyId || null;

      const [membersData, requestsData] = await Promise.all([
        AdminService.listMembers(
          isSuperAdmin ? undefined : adminCompanyName || undefined,
          isSuperAdmin ? undefined : adminCompanyId || undefined
        ),
        AdminService.listPendingRequests(
          isSuperAdmin ? undefined : adminCompanyName || undefined,
          isSuperAdmin ? undefined : adminCompanyId || undefined,
          comps
        ),
      ]);

      if (runId !== loadRunId.current) return;

      const approvedOnly = membersData.filter((m) => m.status === "active");
      setMembers(approvedOnly);
      setPendingRequests(requestsData);
      setCompanies(comps);

      if (requestsData.length === 0) {
        setActiveTab((tab) => (tab === "requests" ? "members" : tab));
      }
    } catch (e) {
      console.error("[useAdminUsers] Failed to load users data:", e);
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

  // Unique list of company names for filtering pills
  const companyPills = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => c.name && set.add(c.name));
    members.forEach((m) => m.companyName && set.add(m.companyName));
    pendingRequests.forEach((r) => r.requestedCompany && set.add(r.requestedCompany));
    return Array.from(set).sort();
  }, [companies, members, pendingRequests]);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Must be an approved active member (never pending)
      if (member.status !== "active") return false;

      if (selectedCompanyFilter !== "all") {
        const targetComp = companies.find(
          (c) => c.name.toLowerCase() === selectedCompanyFilter.toLowerCase()
        );
        const compId = member.companyId?.toLowerCase();
        if (targetComp && compId) {
          if (compId !== targetComp.id.toLowerCase()) return false;
        } else {
          const mCompName =
            member.companyName ||
            (compId ? companies.find((c) => c.id.toLowerCase() === compId)?.name : null) ||
            member.requestedCompany;

          const matches = AdminService.matchesCompany(
            mCompName,
            selectedCompanyFilter,
            targetComp?.id,
            companies
          );
          if (!matches) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = member.name.toLowerCase().includes(q);
        const matchEmail = member.email.toLowerCase().includes(q);
        const matchCompany = (member.companyName || member.requestedCompany || "")
          .toLowerCase()
          .includes(q);
        const matchRole = member.role.toLowerCase().includes(q);
        return matchName || matchEmail || matchCompany || matchRole;
      }
      return true;
    });
  }, [members, selectedCompanyFilter, searchQuery, companies]);

  const filteredRequests = useMemo(() => {
    return pendingRequests.filter((req) => {
      if (selectedCompanyFilter !== "all") {
        const targetComp = companies.find(
          (c) => c.name.toLowerCase() === selectedCompanyFilter.toLowerCase()
        );
        const matches = AdminService.matchesCompany(
          req.requestedCompany,
          selectedCompanyFilter,
          targetComp?.id,
          companies
        );
        if (!matches) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${req.firstName} ${req.lastName}`.toLowerCase();
        const matchName = fullName.includes(q);
        const matchEmail = req.email.toLowerCase().includes(q);
        const matchCompany = req.requestedCompany.toLowerCase().includes(q);
        return matchName || matchEmail || matchCompany;
      }
      return true;
    });
  }, [pendingRequests, selectedCompanyFilter, searchQuery, companies]);

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
          showToast("Applicant approved and account created");
        } else {
          showToast("Failed to approve applicant");
        }
        await loadData();
      } catch (e) {
        console.error("Approve failed:", e);
        showToast("Failed to approve applicant");
      } finally {
        setProcessingRequestId(null);
        setProcessingAction(null);
      }
    },
    [loadData, showToast]
  );

  const handleRejectConfirm = useCallback(
    async (requestId: string) => {
      setProcessingRequestId(requestId);
      setProcessingAction("rejecting");
      try {
        await AdminService.rejectRequest(requestId);
        showToast("Access request rejected and purged");
        await loadData();
      } catch (e) {
        console.error("Reject failed:", e);
        showToast("Failed to reject request");
      } finally {
        setProcessingRequestId(null);
        setProcessingAction(null);
      }
    },
    [loadData, showToast]
  );

  const handleRoleConfirm = useCallback(
    async (userId: string, newRole: UserRole) => {
      try {
        await AdminService.updateUserRole(userId, newRole);
        showToast("User role updated successfully");
        await loadData();
      } catch (e) {
        console.error("Update role failed:", e);
        showToast("Failed to update user role");
      }
    },
    [loadData, showToast]
  );

  const handleMoveConfirm = useCallback(
    async (userId: string, newCompanyId: string, newCompanyName: string) => {
      try {
        await AdminService.moveUserCompany(userId, newCompanyId, newCompanyName);
        showToast("User transferred to new company successfully");
        await loadData();
      } catch (e) {
        console.error("Move company failed:", e);
        showToast("Failed to move user company");
      }
    },
    [loadData, showToast]
  );

  const handlePurgeConfirm = useCallback(
    async (userId: string) => {
      try {
        await AdminService.purgeUser(userId);
        showToast("User account permanently purged from directory");
        await loadData();
      } catch (e) {
        console.error("Purge user failed:", e);
        showToast("Failed to purge user");
      }
    },
    [loadData, showToast]
  );

  return {
    user,
    isSuperAdmin,
    isCompanyAdmin,
    hasAccess,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedCompanyFilter,
    setSelectedCompanyFilter,
    isLoading,
    isRefreshing,
    onRefresh,
    members,
    pendingRequests,
    companies,
    filteredMembers,
    filteredRequests,
    companyPills,
    processingRequestId,
    processingAction,
    approveTarget,
    setApproveTarget,
    rejectTarget,
    setRejectTarget,
    roleTarget,
    setRoleTarget,
    moveTarget,
    setMoveTarget,
    purgeTarget,
    setPurgeTarget,
    toastMessage,
    handleApproveConfirm,
    handleRejectConfirm,
    handleRoleConfirm,
    handleMoveConfirm,
    handlePurgeConfirm,
  };
}

