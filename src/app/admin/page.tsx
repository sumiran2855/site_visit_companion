"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  Clock,
  ChevronRight,
  Inbox,
  Check,
  RotateCw,
  X,
  AlertTriangle,
  Mail,
  UserCheck,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useAdminHub } from "@/hooks/useAdminHub";
import {
  AdminMetricsRowSkeleton,
  PendingRequestCardSkeleton,
} from "@/components/admin/AdminDashboardSkeleton";
import type { PendingAccessRequest } from "@/types/admin";
import type { UserRole } from "@/types/auth";

export default function AdminHubPage() {
  const {
    user,
    isSuperAdmin,
    isCompanyAdmin,
    isLoading,
    isRefreshing,
    metrics,
    companies,
    displayedRequests,
    bannerMessage,
    processingRequestId,
    processingAction,
    approveTarget,
    rejectTarget,
    setApproveTarget,
    setRejectTarget,
    onRefresh,
    handleApproveConfirm,
    handleRejectConfirm,
  } = useAdminHub();

  // Approve modal form state
  const [assignedCompanyId, setAssignedCompanyId] = useState<string>("");
  const [assignedRole, setAssignedRole] = useState<UserRole>("user");

  const openApproveModal = (req: PendingAccessRequest) => {
    setApproveTarget(req);
    const matchedComp = companies.find(
      (c) =>
        c.name.trim().toLowerCase() === req.requestedCompany.trim().toLowerCase() ||
        c.id === user?.companyId
    );
    setAssignedCompanyId(matchedComp?.id || user?.companyId || companies[0]?.id || "");
    setAssignedRole("user");
  };

  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    const selectedCompany = companies.find((c) => c.id === assignedCompanyId);
    const companyName = selectedCompany?.name || approveTarget.requestedCompany;
    await handleApproveConfirm(
      approveTarget.id,
      assignedCompanyId,
      companyName,
      assignedRole
    );
    setApproveTarget(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    await handleRejectConfirm(rejectTarget.id);
    setRejectTarget(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      {bannerMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl flex items-center justify-between text-sm font-semibold shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="size-4 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
        </div>
      )}

      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
              {isSuperAdmin ? "Super Admin Hub" : "Company Admin Portal"}
            </h1>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                isSuperAdmin
                  ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  : "bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800"
              }`}
            >
              {isSuperAdmin ? "Global" : user?.companyName || "Organization"}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            {isSuperAdmin
              ? "Global Management, Company Hierarchy & System Controls"
              : `Administrative oversight for ${user?.companyName || "your organization"}`}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing || isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RotateCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Row */}
      {isLoading ? (
        <AdminMetricsRowSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Requests */}
          <Link
            href={ROUTES.ADMIN_USERS}
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Requests
              </span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400">
                <Clock className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100">
                {metrics.pendingRequestsCount}
              </div>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                Pending Approval
              </p>
            </div>
          </Link>

          {/* Active Members */}
          <Link
            href={ROUTES.ADMIN_USERS}
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-sky-300 dark:hover:border-sky-700 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Members
              </span>
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400">
                <Users className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100">
                {metrics.totalMembersCount}
              </div>
              <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 mt-0.5">
                Active Users
              </p>
            </div>
          </Link>

          {/* Companies */}
          <Link
            href={ROUTES.ADMIN_COMPANIES}
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Companies
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
                <Building2 className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100">
                {metrics.totalCompaniesCount}
              </div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                Org Units
              </p>
            </div>
          </Link>

          {/* Site Submissions */}
          <Link
            href={ROUTES.ADMIN_SUBMISSIONS}
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-violet-300 dark:hover:border-violet-700 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Submissions
              </span>
              <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400">
                <Inbox className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100">
                {metrics.totalVisitsCount}
              </div>
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mt-0.5">
                Site Reviews
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Main Section: Pending Access Requests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Pending Access Requests
            </h2>
            {isLoading ? (
              <span className="h-5 w-6 rounded-full bg-slate-200 dark:bg-zinc-800 animate-pulse" />
            ) : displayedRequests.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                {displayedRequests.length}
              </span>
            ) : null}
          </div>
          <Link
            href={ROUTES.ADMIN_USERS}
            className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
          >
            <span>View All</span>
            <ChevronRight className="size-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <PendingRequestCardSkeleton key={i} />
            ))}
          </div>
        ) : displayedRequests.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center space-y-3">
            <div className="size-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <Check className="size-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                All Caught Up
              </h4>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                No technician access requests pending review
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                        {req.firstName} {req.lastName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Mail className="size-3" />
                        <span>{req.email}</span>
                      </p>
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                        <Building2 className="size-3 text-slate-400" />
                        <span>{req.requestedCompany}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {req.createdAt}
                    </span>
                  </div>

                  {req.note && (
                    <p className="text-xs text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/60 p-2.5 rounded-xl italic">
                      "{req.note}"
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    disabled={processingRequestId === req.id}
                    onClick={() => setRejectTarget(req)}
                    className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={processingRequestId === req.id}
                    onClick={() => openApproveModal(req)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-colors shadow-xs cursor-pointer"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="size-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  Approve Access Request
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 text-xs space-y-1">
              <p className="font-bold text-slate-900 dark:text-zinc-100">
                {approveTarget.firstName} {approveTarget.lastName}
              </p>
              <p className="text-slate-500">{approveTarget.email}</p>
              <p className="text-slate-500">
                Requested Org: <strong>{approveTarget.requestedCompany}</strong>
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Assign Organization Unit
                </label>
                <select
                  value={assignedCompanyId}
                  onChange={(e) => setAssignedCompanyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-transparent"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id} className="dark:bg-zinc-900">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Assign User Role
                </label>
                <select
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-transparent"
                >
                  <option value="user" className="dark:bg-zinc-900">
                    Normal User
                  </option>
                  <option value="admin" className="dark:bg-zinc-900">
                    Administrator
                  </option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingAction === "approving"}
                onClick={handleConfirmApprove}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 disabled:opacity-60"
              >
                {processingAction === "approving" ? "Approving..." : "Confirm & Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  Reject Request?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to reject the access request for{" "}
              <strong>
                {rejectTarget.firstName} {rejectTarget.lastName}
              </strong>{" "}
              ({rejectTarget.email})? This action will permanently remove the pending signup.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingAction === "rejecting"}
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-60"
              >
                {processingAction === "rejecting" ? "Rejecting..." : "Reject & Purge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

