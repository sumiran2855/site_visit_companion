"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Globe,
  Mail,
  MoreVertical,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  Edit2,
  CornerDownRight,
  AlertTriangle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  ArrowLeft,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { Company } from "@/types/company";

// Initial realistic company hierarchy matching walkthrough page 10
const INITIAL_COMPANIES: Company[] = [
  {
    id: "comp-001",
    name: "EC POWER Inc.",
    parentId: null,
    allowedEmailDomains: ["ecpower.dk", "ecpower.com", "ecpower.eu"],
    contactEmail: "admin@ecpower.dk",
    memberCount: 24,
    visitCount: 142,
    isActive: true,
    createdAt: "2026-01-10",
    updatedAt: "2026-09-18",
  },
  {
    id: "comp-002",
    name: "TEST POWER INC",
    parentId: "comp-001",
    allowedEmailDomains: ["testpower.com"],
    contactEmail: "operations@testpower.com",
    memberCount: 8,
    visitCount: 39,
    isActive: true,
    createdAt: "2026-04-12",
    updatedAt: "2026-09-19",
  },
  {
    id: "comp-003",
    name: "Nordic Energy Solutions",
    parentId: null,
    allowedEmailDomains: ["nordicenergy.se", "nordicenergy.no"],
    contactEmail: "service@nordicenergy.se",
    memberCount: 12,
    visitCount: 67,
    isActive: true,
    createdAt: "2026-03-01",
    updatedAt: "2026-09-15",
  },
  {
    id: "comp-004",
    name: "Alpine Power Systems",
    parentId: null,
    allowedEmailDomains: ["alpinepower.ch"],
    contactEmail: "info@alpinepower.ch",
    memberCount: 5,
    visitCount: 18,
    isActive: true,
    createdAt: "2026-05-20",
    updatedAt: "2026-08-30",
  },
];

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedParents, setCollapsedParents] = useState<Record<string, boolean>>({});

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyParentId, setNewCompanyParentId] = useState<string>("");
  const [newCompanyDomains, setNewCompanyDomains] = useState("");
  const [newCompanyEmail, setNewCompanyEmail] = useState("");

  const [editCompanyTarget, setEditCompanyTarget] = useState<Company | null>(null);
  const [editName, setEditName] = useState("");
  const [editDomains, setEditDomains] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

  // Active dropdown menu for company row
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Toggle tree node collapse
  const toggleCollapse = (companyId: string) => {
    setCollapsedParents((prev) => ({
      ...prev,
      [companyId]: !prev[companyId],
    }));
  };

  // Structured hierarchy: root companies and their direct children
  const { rootCompanies, childrenMap, totalCount } = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.allowedEmailDomains?.some((d) => d.toLowerCase().includes(q)) ||
        c.contactEmail?.toLowerCase().includes(q)
    );

    const childMap: Record<string, Company[]> = {};
    const roots: Company[] = [];

    // If searching, we display flat matched results or matched parents
    if (q) {
      return {
        rootCompanies: filtered,
        childrenMap: {},
        totalCount: filtered.length,
      };
    }

    companies.forEach((comp) => {
      if (comp.parentId) {
        if (!childMap[comp.parentId]) childMap[comp.parentId] = [];
        childMap[comp.parentId].push(comp);
      } else {
        roots.push(comp);
      }
    });

    return {
      rootCompanies: roots,
      childrenMap: childMap,
      totalCount: companies.length,
    };
  }, [companies, searchQuery]);

  // Handle Create Company / Sub-Company
  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    const domainsArray = newCompanyDomains
      .split(/[,;\s]+/)
      .map((d) => d.trim().replace(/^@/, ""))
      .filter(Boolean);

    const newCompany: Company = {
      id: `comp-${Date.now().toString().slice(-4)}`,
      name: newCompanyName.trim(),
      parentId: newCompanyParentId ? newCompanyParentId : null,
      allowedEmailDomains: domainsArray.length > 0 ? domainsArray : undefined,
      contactEmail: newCompanyEmail.trim() || undefined,
      memberCount: 0,
      visitCount: 0,
      isActive: true,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    setCompanies((prev) => [...prev, newCompany]);
    setIsCreateModalOpen(false);
    setNewCompanyName("");
    setNewCompanyParentId("");
    setNewCompanyDomains("");
    setNewCompanyEmail("");
    showToast(
      newCompany.parentId
        ? `Sub-company "${newCompany.name}" added successfully.`
        : `Company "${newCompany.name}" created.`
    );
  };

  // Open modal pre-configured to create sub-company under specific parent
  const handleOpenAddSubCompany = (parentId: string) => {
    setNewCompanyParentId(parentId);
    setNewCompanyName("");
    setNewCompanyDomains("");
    setNewCompanyEmail("");
    setIsCreateModalOpen(true);
    setOpenMenuId(null);
  };

  // Handle Edit / Rename
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompanyTarget || !editName.trim()) return;

    const domainsArray = editDomains
      .split(/[,;\s]+/)
      .map((d) => d.trim().replace(/^@/, ""))
      .filter(Boolean);

    setCompanies((prev) =>
      prev.map((c) =>
        c.id === editCompanyTarget.id
          ? {
              ...c,
              name: editName.trim(),
              allowedEmailDomains: domainsArray,
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : c
      )
    );

    showToast(`Updated organization "${editName.trim()}".`);
    setEditCompanyTarget(null);
    setEditName("");
    setEditDomains("");
  };

  // Handle Delete Company
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    // Check if this company has sub-companies
    const hasChildren = companies.some((c) => c.parentId === deleteTarget.id);
    if (hasChildren) {
      alert("Cannot delete a company with active sub-companies. Please reassign or delete sub-companies first.");
      return;
    }

    setCompanies((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    showToast(`Company "${deleteTarget.name}" deleted.`);
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 pb-24">
      {/* Admin Header */}
      <AdminHeader
        title="Companies"
        subtitle="Manage company hierarchy, subsidiaries, and email domain scopes"
        backHref={ROUTES.ADMIN_USERS}
        backLabel="Accounts"
        actions={
          <button
            onClick={() => {
              setNewCompanyParentId("");
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-all font-semibold text-xs shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Create company</span>
          </button>
        }
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Back to Accounts Button */}
        <div>
          <Link
            href={ROUTES.VISITS}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all text-xs font-semibold shadow-xs group"
            title="Go back to Accounts"
            aria-label="Go back to Accounts"
          >
            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to visits</span>
          </Link>
        </div>

        {/* Page Top Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              <span>EC POWER</span>
              <span>/</span>
              <span className="text-slate-900 dark:text-white">Organization Directory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Companies
            </h1>
            <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1">
              You can create sub-companies within your own organization. Visits and members are scoped accordingly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={ROUTES.VISITS}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
            >
              <span>Visits</span>
            </Link>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search organizations by name, domain, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-zinc-400 self-end sm:self-auto px-1">
              <FolderTree className="size-4 text-slate-400" />
              <span>
                Total: <strong className="text-slate-800 dark:text-zinc-200">{companies.length}</strong> companies
              </span>
            </div>
          </div>
        </div>

        {/* Hierarchy Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Hierarchy ({totalCount})
            </h2>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500">
              Parent &amp; Sub-company structure
            </span>
          </div>

          {rootCompanies.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 p-12 text-center">
              <Building2 className="size-10 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                No organizations found
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
                No companies match your current search query.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rootCompanies.map((company) => {
                const children = childrenMap[company.id] || [];
                const hasChildren = children.length > 0;
                const isCollapsed = collapsedParents[company.id];

                return (
                  <div
                    key={company.id}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden transition-all"
                  >
                    {/* Parent Row */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left info */}
                      <div className="flex items-start gap-3 min-w-0">
                        {hasChildren ? (
                          <button
                            onClick={() => toggleCollapse(company.id)}
                            className="mt-0.5 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                            title={isCollapsed ? "Expand sub-companies" : "Collapse sub-companies"}
                          >
                            {isCollapsed ? (
                              <ChevronRight className="size-4" />
                            ) : (
                              <ChevronDown className="size-4" />
                            )}
                          </button>
                        ) : (
                          <div className="p-1 text-slate-300 dark:text-zinc-700">
                            <Building2 className="size-4" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-base text-slate-900 dark:text-white tracking-tight truncate">
                              {company.name}
                            </span>
                            {company.parentId ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                SUB
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                                Organization
                              </span>
                            )}
                          </div>

                          {/* Domain tags & details */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
                            {company.allowedEmailDomains && company.allowedEmailDomains.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Globe className="size-3 text-slate-400" />
                                <span>
                                  {company.allowedEmailDomains.map((d) => `@${d}`).join(", ")}
                                </span>
                              </div>
                            )}
                            {company.contactEmail && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="size-3 text-slate-400" />
                                <span>{company.contactEmail}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right metrics & actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-zinc-800/80">
                        {/* Metrics */}
                        <div className="flex items-center gap-3 text-xs">
                          <div
                            className="flex items-center gap-1 text-slate-600 dark:text-zinc-400"
                            title="Active Members"
                          >
                            <Users className="size-3.5 text-slate-400" />
                            <span>{company.memberCount ?? 0} members</span>
                          </div>
                          <span className="text-slate-300 dark:text-zinc-700">|</span>
                          <div
                            className="flex items-center gap-1 text-slate-600 dark:text-zinc-400"
                            title="Visits Scoped"
                          >
                            <FileSpreadsheet className="size-3.5 text-slate-400" />
                            <span>{company.visitCount ?? 0} visits</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 relative">
                          <button
                            onClick={() => handleOpenAddSubCompany(company.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
                            title="Add child sub-company"
                          >
                            <Plus className="size-3.5" />
                            <span className="hidden sm:inline">Add sub-company</span>
                          </button>

                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenuId(openMenuId === company.id ? null : company.id)
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                              title="More options"
                            >
                              <MoreVertical className="size-4" />
                            </button>

                            {openMenuId === company.id && (
                              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg py-1 z-30 text-xs font-medium">
                                <button
                                  onClick={() => {
                                    setEditCompanyTarget(company);
                                    setEditName(company.name);
                                    setEditDomains(
                                      company.allowedEmailDomains?.join(", ") || ""
                                    );
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 text-left transition-colors"
                                >
                                  <Edit2 className="size-3.5 text-slate-400" />
                                  <span>Rename / Edit</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteTarget(company);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition-colors"
                                >
                                  <Trash2 className="size-3.5" />
                                  <span>Remove company</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sub-companies (Nested Tree Lines) */}
                    {hasChildren && !isCollapsed && (
                      <div className="bg-slate-50/70 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800/80 pl-6 sm:pl-10 pr-4 sm:pr-6 py-2 space-y-2">
                        {children.map((child) => (
                          <div
                            key={child.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2.5 px-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/60 shadow-2xs"
                          >
                            {/* Tree Elbow connector + child info */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              <CornerDownRight className="size-4 text-slate-400 dark:text-zinc-500 shrink-0" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                                    {child.name}
                                  </span>
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    SUB
                                  </span>
                                </div>
                                {child.allowedEmailDomains && child.allowedEmailDomains.length > 0 && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                    <Globe className="size-2.5 text-slate-400" />
                                    <span>{child.allowedEmailDomains.map((d) => `@${d}`).join(", ")}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Sub-company metrics & actions */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                              <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-[11px]">
                                <span>{child.memberCount ?? 0} members</span>
                                <span>•</span>
                                <span>{child.visitCount ?? 0} visits</span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditCompanyTarget(child);
                                    setEditName(child.name);
                                    setEditDomains(child.allowedEmailDomains?.join(", ") || "");
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                                  title="Edit sub-company"
                                >
                                  <Edit2 className="size-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(child)}
                                  className="p-1 rounded-md text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                  title="Remove sub-company"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* CREATE / ADD SUB-COMPANY MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                  {newCompanyParentId ? "Add Sub-Company" : "Create Company"}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TEST POWER INC"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Parent Organization
                </label>
                <select
                  value={newCompanyParentId}
                  onChange={(e) => setNewCompanyParentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">None (Top-level Organization)</option>
                  {companies
                    .filter((c) => !c.parentId)
                    .map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                  Leave as None to establish an independent parent organization.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Allowed Email Domains
                </label>
                <input
                  type="text"
                  placeholder="e.g. testpower.com, testpower.dk"
                  value={newCompanyDomains}
                  onChange={(e) => setNewCompanyDomains(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                  Comma-separated domains. Users signing up with these email domains will automatically be routed here.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Contact / Support Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="operations@testpower.com"
                  value={newCompanyEmail}
                  onChange={(e) => setNewCompanyEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors shadow-xs"
                >
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / RENAME MODAL */}
      {editCompanyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Edit2 className="size-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                  Edit Organization Details
                </h3>
              </div>
              <button
                onClick={() => setEditCompanyTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Allowed Email Domains
                </label>
                <input
                  type="text"
                  value={editDomains}
                  onChange={(e) => setEditDomains(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                  Separate multiple domains with commas (e.g. ecpower.dk, ecpower.com)
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditCompanyTarget(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-5">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900/60">
                <AlertTriangle className="size-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Remove Company?
              </h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-zinc-400 mb-4 leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-slate-900 dark:text-white">
                {deleteTarget.name}
              </strong>
              ? Any scoped data must be transferred before company removal.
            </p>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 mb-4">
              <div className="font-semibold mb-0.5">Safeguard notice:</div>
              {deleteTarget.memberCount && deleteTarget.memberCount > 0 ? (
                <div>
                  This organization currently has {deleteTarget.memberCount} member(s). You must move members in the Accounts screen prior to removal.
                </div>
              ) : (
                <div>
                  This action is irreversible and will remove all scoped settings.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-xs"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-2xl shadow-xl text-xs font-medium border border-slate-800 dark:border-zinc-200 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="size-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
