"use client";

import { useState } from "react";
import {
  Search,
  Check,
  X,
  AlertTriangle,
  UserCheck,
  Building2,
  Mail,
  Shield,
  RotateCw,
  Trash2,
  ArrowRightLeft,
} from "lucide-react";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import {
  AccountsRequestsSkeleton,
  AccountsMembersTableSkeleton,
} from "@/components/admin/AdminDashboardSkeleton";
import { useTranslation } from "@/i18n";
import type { PendingAccessRequest } from "@/types/admin";
import type { User, UserRole } from "@/types/auth";

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const {
    user,
    isSuperAdmin,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedCompanyFilter,
    setSelectedCompanyFilter,
    isLoading,
    isRefreshing,
    onRefresh,
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
  } = useAdminUsers();

  // Approve modal local form state
  const [assignedCompanyId, setAssignedCompanyId] = useState("");
  const [assignedRole, setAssignedRole] = useState<UserRole>("user");
  const [newRole, setNewRole] = useState<UserRole>("user");
  const [newCompanyId, setNewCompanyId] = useState("");

  const openApprove = (req: PendingAccessRequest) => {
    setApproveTarget(req);
    const matched = companies.find(
      (c) =>
        c.name.trim().toLowerCase() === req.requestedCompany.trim().toLowerCase() ||
        c.id === user?.companyId
    );
    setAssignedCompanyId(matched?.id || user?.companyId || companies[0]?.id || "");
    setAssignedRole("user");
  };

  const openChangeRole = (m: User) => {
    setRoleTarget(m);
    setNewRole(m.role);
  };

  const openMoveCompany = (m: User) => {
    setMoveTarget(m);
    setNewCompanyId(m.companyId || companies[0]?.id || "");
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    const selected = companies.find((c) => c.id === assignedCompanyId);
    await handleApproveConfirm(
      approveTarget.id,
      assignedCompanyId,
      selected?.name || approveTarget.requestedCompany,
      assignedRole
    );
    setApproveTarget(null);
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    await handleRejectConfirm(rejectTarget.id);
    setRejectTarget(null);
  };

  const confirmRole = async () => {
    if (!roleTarget) return;
    await handleRoleConfirm(roleTarget.id, newRole);
    setRoleTarget(null);
  };

  const confirmMove = async () => {
    if (!moveTarget) return;
    const selected = companies.find((c) => c.id === newCompanyId);
    await handleMoveConfirm(moveTarget.id, newCompanyId, selected?.name || "Company");
    setMoveTarget(null);
  };

  const confirmPurge = async () => {
    if (!purgeTarget) return;
    await handlePurgeConfirm(purgeTarget.id);
    setPurgeTarget(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold shadow-md animate-in fade-in">
          <Check className="size-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
            {t("users.title", "Accounts Management")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            {t("users.subtitle", "Manage pending technician signups, role permissions, and company assignments")}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing || isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RotateCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{t("common.refreshData", "Refresh")}</span>
        </button>
      </div>

      {/* Sub-tabs & Search/Filter Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/60 dark:bg-zinc-900/90 max-w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("requests")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "requests"
                  ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
              }`}
            >
              <span>{t("users.tabs.requests", "Pending Requests")}</span>
              {isLoading ? (
                <span className="inline-block w-4 h-4 rounded-full bg-slate-300 dark:bg-zinc-700 animate-pulse" />
              ) : filteredRequests.length > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white">
                  {filteredRequests.length}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "members"
                  ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
              }`}
            >
              <span>{t("users.tabs.members", "Approved Members")}</span>
              {isLoading ? (
                <span className="inline-block w-4 h-4 rounded-full bg-slate-300 dark:bg-zinc-700 animate-pulse" />
              ) : (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300">
                  {filteredMembers.length}
                </span>
              )}
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("users.searchPlaceholder", "Search by name, email, or company...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Company Filter Pills */}
        {isLoading ? (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">{t("users.orgLabel", "Org:")}</span>
            <div className="h-6 w-24 bg-slate-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
            <div className="h-6 w-28 bg-slate-100 dark:bg-zinc-800/60 rounded-xl animate-pulse" />
            <div className="h-6 w-20 bg-slate-100 dark:bg-zinc-800/60 rounded-xl animate-pulse" />
          </div>
        ) : companyPills.length > 1 ? (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">{t("users.orgLabel", "Org:")}</span>
            <button
              type="button"
              onClick={() => setSelectedCompanyFilter("all")}
              className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                selectedCompanyFilter === "all"
                  ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold"
                  : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50"
              }`}
            >
              {t("users.allCompanies", "All Organizations")}
            </button>
            {companyPills.map((cp) => (
              <button
                key={cp}
                type="button"
                onClick={() => setSelectedCompanyFilter(cp)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                  selectedCompanyFilter === cp
                    ? "bg-sky-600 text-white font-bold"
                    : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50"
                }`}
              >
                {cp}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Main Content Area */}
      {activeTab === "requests" ? (
        /* Pending Requests List */
        isLoading ? (
          <AccountsRequestsSkeleton count={4} />
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center space-y-3">
            <div className="size-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600">
              <Check className="size-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">
              {t("dashboard.pendingRequests.emptyTitle", "No Pending Requests")}
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm mx-auto">
              {t("dashboard.pendingRequests.emptyDesc", "There are currently no technician signups awaiting verification.")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                        {req.firstName} {req.lastName}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="size-3" />
                        <span>{req.email}</span>
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400">{req.createdAt}</span>
                  </div>

                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                    <Building2 className="size-3.5 text-slate-400" />
                    <span>{t("dashboard.pendingRequests.requestedCompany", "Requested:")} <strong>{req.requestedCompany}</strong></span>
                  </div>

                  {req.note && (
                    <p className="text-xs text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl italic">
                      &ldquo;{req.note}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    disabled={processingRequestId === req.id}
                    onClick={() => setRejectTarget(req)}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    {t("dashboard.pendingRequests.reject", "Reject")}
                  </button>
                  <button
                    type="button"
                    disabled={processingRequestId === req.id}
                    onClick={() => openApprove(req)}
                    className="flex-1 py-2 px-3 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-colors shadow-xs cursor-pointer"
                  >
                    {t("dashboard.pendingRequests.approve", "Approve")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Approved Members Table */
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">{t("users.table.user", "Member")}</th>
                  <th className="py-3 px-4">{t("users.table.company", "Organization")}</th>
                  <th className="py-3 px-4">{t("users.table.role", "Role")}</th>
                  <th className="py-3 px-4">{t("common.status", "Status")}</th>
                  {isSuperAdmin && <th className="py-3 px-4 text-right">{t("users.table.actions", "Actions")}</th>}
                </tr>
              </thead>
              {isLoading ? (
                <AccountsMembersTableSkeleton rows={5} isSuperAdmin={isSuperAdmin} />
              ) : (
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isSuperAdmin ? 5 : 4}
                        className="py-12 text-center text-slate-400 dark:text-zinc-500"
                      >
                        {searchQuery || selectedCompanyFilter !== "all"
                          ? t("users.table.noMatchFilter", "No members match the current search or filter criteria.")
                          : t("users.table.noMembersRegistered", "No approved members found.")}
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => {
                      const isSuper = member.role === "super_admin";
                      const isCoAdmin = member.role === "company_admin";

                      return (
                        <tr
                          key={member.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-zinc-100 text-sm">
                              {member.name}
                            </div>
                            <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                              <Mail className="size-3" />
                              <span>{member.email}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-zinc-200">
                              <Building2 className="size-3.5 text-slate-400" />
                              <span>
                                {member.companyName || member.requestedCompany || t("accessDenied.unassigned", "Unassigned")}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                member.role === "admin" || isSuper || isCoAdmin
                                  ? "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                                  : "bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800"
                              }`}
                            >
                              <Shield className="size-3" />
                              <span>
                                {member.role === "admin" || isSuper || isCoAdmin
                                  ? t("users.roles.admin", "Administrator")
                                  : t("users.roles.technician", "Technician")}
                              </span>
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              <span>{t("users.status.active", "Active")}</span>
                            </span>
                          </td>

                          {isSuperAdmin && (
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openChangeRole(member)}
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold transition-colors cursor-pointer"
                                  title={t("users.table.changeRole", "Change Role")}
                                >
                                  {t("common.role", "Role")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openMoveCompany(member)}
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold transition-colors cursor-pointer"
                                  title={t("users.table.moveCompany", "Move Organization")}
                                >
                                  {t("users.table.moveButton", "Move")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPurgeTarget(member)}
                                  className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors cursor-pointer"
                                  title={t("users.table.purgeUser", "Purge User")}
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="size-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  {t("dashboard.approveModal.title", "Approve Access Request")}
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
                {t("dashboard.pendingRequests.requestedCompany", "Requested:")} <strong>{approveTarget.requestedCompany}</strong>
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {t("dashboard.approveModal.assignCompanyLabel", "Assign Organization Unit")}
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
                  {t("dashboard.approveModal.assignRoleLabel", "Assign User Role")}
                </label>
                <select
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-transparent"
                >
                  <option value="user" className="dark:bg-zinc-900">
                    {t("dashboard.approveModal.roleUser", "Technician")}
                  </option>
                  <option value="admin" className="dark:bg-zinc-900">
                    {t("dashboard.approveModal.roleAdmin", "Administrator")}
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
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                disabled={processingAction === "approving"}
                onClick={confirmApprove}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 disabled:opacity-60"
              >
                {processingAction === "approving"
                  ? t("dashboard.approveModal.approving", "Approving...")
                  : t("dashboard.approveModal.confirmButton", "Confirm & Approve")}
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
                  {t("dashboard.rejectModal.title", "Reject Request?")}
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
              {t("dashboard.rejectModal.warning", "Are you sure you want to reject the access request for")}{" "}
              <strong>
                {rejectTarget.firstName} {rejectTarget.lastName}
              </strong>{" "}
              ({rejectTarget.email})?
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                disabled={processingAction === "rejecting"}
                onClick={confirmReject}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-60"
              >
                {processingAction === "rejecting"
                  ? t("dashboard.rejectModal.rejecting", "Rejecting...")
                  : t("dashboard.rejectModal.confirmButton", "Reject & Purge")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal (Super Admin) */}
      {roleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="size-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  {t("users.modals.changeRoleTitle", "Change Role")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRoleTarget(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400">
              {t("users.modals.changeRoleDesc", "Update authorization tier for")}{" "}
              <strong>{roleTarget.name}</strong> ({roleTarget.email}):
            </p>

            <div className="space-y-2">
              {(["user", "admin"] as UserRole[]).map((r) => (
                <label
                  key={r}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    newRole === r
                      ? "border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-bold"
                      : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={newRole === r}
                    onChange={() => setNewRole(r)}
                    className="accent-sky-600 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold block">
                      {r === "user"
                        ? t("dashboard.approveModal.roleUser", "Technician")
                        : t("dashboard.approveModal.roleAdmin", "Administrator")}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 block font-normal mt-0.5">
                      {r === "user"
                        ? t("users.roles.technicianDesc", "Can perform field inspections, capture site media and submit visits")
                        : t("users.roles.adminDesc", "Full access to web admin portal, companies, template and reviews")}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoleTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={confirmRole}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700"
              >
                {t("users.modals.saveRole", "Save Role")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Company Modal (Super Admin) */}
      {moveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="size-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  {t("users.modals.moveCompanyTitle", "Move Organization")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMoveTarget(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400">
              {t("users.modals.transferUserDesc", `Transfer ${moveTarget.name} to a different company branch:`, { name: moveTarget.name })}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                {t("users.modals.targetOrgLabel", "Target Organization")}
              </label>
              <select
                value={newCompanyId}
                onChange={(e) => setNewCompanyId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-transparent"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id} className="dark:bg-zinc-900">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMoveTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={confirmMove}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700"
              >
                {t("users.modals.confirmMove", "Confirm Move")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purge User Modal (Super Admin) */}
      {purgeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="size-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  {t("users.modals.purgeUserTitle", "Purge User Account?")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPurgeTarget(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              {t("users.modals.purgeWarning", "Are you sure you want to permanently delete the account for")}{" "}
              <strong>{purgeTarget.name}</strong> ({purgeTarget.email})? {t("users.modals.purgeWarningAction", "This action cannot be undone.")}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPurgeTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={confirmPurge}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                {t("users.modals.confirmPurge", "Purge Account")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
