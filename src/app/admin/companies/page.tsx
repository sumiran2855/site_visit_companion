"use client";

import React, { useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Plus,
  Search,
  Trash2,
  Users,
  Edit2,
  RotateCw,
  X,
  Mail,
  Phone,
  CornerDownRight,
  ShieldCheck,
  AlertTriangle,
  Check,
} from "lucide-react";
import { useAdminCompanies } from "@/hooks/useAdminCompanies";
import { CompaniesTreeSkeleton } from "@/components/admin/AdminDashboardSkeleton";
import type { Company, CreateCompanyInput, UpdateCompanyInput } from "@/types/admin";

export default function AdminCompaniesPage() {
  const {
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
  } = useAdminCompanies();

  // Create modal form fields
  const [name, setName] = useState("");
  const [domains, setDomains] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Edit modal form fields
  const [editName, setEditName] = useState("");
  const [editDomains, setEditDomains] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const handleOpenEdit = (c: Company) => {
    setEditCompanyTarget(c);
    setEditName(c.name);
    setEditDomains(c.allowedEmailDomains ? c.allowedEmailDomains.join(", ") : "");
    setEditEmail(c.contactEmail || "");
    setEditPhone(c.contactPhone || "");
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const domainList = domains
      .split(/[\s,]+/)
      .map((d) => d.trim().replace(/^@/, "").toLowerCase())
      .filter(Boolean);

    await handleCreateConfirm({
      name: name.trim(),
      parentId: createParentId,
      allowedEmailDomains: domainList,
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
    });

    setName("");
    setDomains("");
    setContactEmail("");
    setContactPhone("");
    closeCreateModal();
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompanyTarget || !editName.trim()) return;

    const domainList = editDomains
      .split(/[\s,]+/)
      .map((d) => d.trim().replace(/^@/, "").toLowerCase())
      .filter(Boolean);

    await handleEditConfirm(editCompanyTarget.id, {
      name: editName.trim(),
      allowedEmailDomains: domainList,
      contactEmail: editEmail.trim() || undefined,
      contactPhone: editPhone.trim() || undefined,
    });

    closeEditModal();
  };

  const submitDelete = async () => {
    if (!deleteCompanyTarget) return;
    await handleDeleteConfirm(deleteCompanyTarget.id);
    closeDeleteModal();
  };

  const renderCompanyNode = (company: Company, depth = 0) => {
    const children = childMap[company.id] || [];
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedNodes[company.id];

    return (
      <div key={company.id} className="space-y-2">
        <div
          className={`p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-zinc-700 ${
            depth > 0 ? "ml-4 sm:ml-8 border-l-4 border-l-sky-500" : ""
          }`}
        >
          {/* Left Info */}
          <div className="flex items-start gap-3">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleCollapse(company.id)}
                className="mt-0.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 cursor-pointer"
              >
                {isCollapsed ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>
            ) : depth > 0 ? (
              <CornerDownRight className="size-4 mt-1 text-slate-400 shrink-0" />
            ) : (
              <Building2 className="size-5 mt-0.5 text-slate-400 shrink-0" />
            )}

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  {company.name}
                </h3>
                {depth === 0 && (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                    Primary Org
                  </span>
                )}
              </div>

              {/* Email Domains / Contact */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 mt-1.5">
                {company.allowedEmailDomains && company.allowedEmailDomains.length > 0 && (
                  <div className="flex items-center gap-1 font-mono text-[11px] bg-slate-50 dark:bg-zinc-800/60 px-2 py-0.5 rounded-md text-slate-700 dark:text-zinc-300">
                    <span>@{company.allowedEmailDomains.join(", @")}</span>
                  </div>
                )}

                {company.contactEmail && (
                  <div className="flex items-center gap-1">
                    <Mail className="size-3 text-slate-400" />
                    <span>{company.contactEmail}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Metrics & Actions */}
          <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-zinc-800">
            {/* Counts */}
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800">
                <Users className="size-3.5" />
                <span>{company.memberCount ?? 0} members</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold">
                <span>{company.visitCount ?? 0} visits</span>
              </span>
            </div>

            {/* Super Admin Buttons */}
            {isSuperAdmin && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openAddSubCompany(company.id)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                  title="Add Branch / Subsidiary"
                >
                  <Plus className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(company)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  title="Edit Company"
                >
                  <Edit2 className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteCompanyTarget(company)}
                  className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors cursor-pointer"
                  title="Delete Company"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Children Render */}
        {hasChildren && !isCollapsed && (
          <div className="space-y-2">
            {children.map((child) => renderCompanyNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
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
            Companies & Hierarchy Tree
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Organize root enterprises, partner branches, and allowed email domains
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300 shadow-xs transition-colors cursor-pointer"
          >
            <RotateCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={openCreateRoot}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Add Company</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search companies by name or domain..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearchQuery}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Companies List */}
      {isLoading ? (
        <CompaniesTreeSkeleton count={4} />
      ) : roots.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center space-y-3">
          <div className="size-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-slate-500">
            <Building2 className="size-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">
            No Companies Found
          </h3>
          <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm mx-auto">
            {searchQuery
              ? `No organizations matched "${searchQuery}".`
              : "No organization units registered yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {roots.map((root) => renderCompanyNode(root))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                {createParentId ? "Add Sub-Company / Branch" : "Create New Organization"}
              </h3>
              <button
                type="button"
                onClick={closeCreateModal}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={submitCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nordic Service Partner A/S"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Allowed Email Domains (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ecpower.dk, partner.com"
                  value={domains}
                  onChange={(e) => setDomains(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Contact Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="service@company.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Contact Phone (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+45 12 34 56 78"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-transparent"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editCompanyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Edit Company
              </h3>
              <button
                type="button"
                onClick={closeEditModal}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={submitEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Allowed Email Domains
                </label>
                <input
                  type="text"
                  value={editDomains}
                  onChange={(e) => setEditDomains(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-transparent"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteCompanyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  Delete Company?
                </h3>
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to delete <strong>{deleteCompanyTarget.name}</strong>? Any child branches will also be removed.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                Delete Company
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
