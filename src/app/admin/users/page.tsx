"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  MoreVertical,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { User, UserRole, PendingAccessRequest } from "@/types/auth";

// Initial realistic mock data for members
const INITIAL_MEMBERS: User[] = [
  {
    id: "usr-001",
    name: "Alex Jensen",
    email: "alex.jensen@testpower.com",
    role: "super_admin",
    status: "active",
    companyId: "comp-001",
    companyName: "TEST POWER INC",
    createdAt: "2026-08-15",
    updatedAt: "2026-09-20",
  },
  {
    id: "usr-002",
    name: "Sarah Lindqvist",
    email: "sarah.l@ecpower.dk",
    role: "company_admin",
    status: "active",
    companyId: "comp-002",
    companyName: "EC POWER Inc.",
    createdAt: "2026-08-20",
    updatedAt: "2026-09-18",
  },
  {
    id: "usr-003",
    name: "Michael Brandt",
    email: "m.brandt@testpower.com",
    role: "standard",
    status: "active",
    companyId: "comp-001",
    companyName: "TEST POWER INC",
    createdAt: "2026-09-02",
    updatedAt: "2026-09-19",
  },
  {
    id: "usr-004",
    name: "Klaus Nørgaard",
    email: "klaus@nordicenergy.se",
    role: "standard",
    status: "active",
    companyId: "comp-003",
    companyName: "Nordic Energy Solutions",
    createdAt: "2026-09-05",
    updatedAt: "2026-09-15",
  },
  {
    id: "usr-005",
    name: "Elena Rostova",
    email: "e.rostova@ecpower.dk",
    role: "company_admin",
    status: "active",
    companyId: "comp-002",
    companyName: "EC POWER Inc.",
    createdAt: "2026-09-10",
    updatedAt: "2026-09-17",
  },
  {
    id: "usr-006",
    name: "Tobias Møller",
    email: "tobias.m@testpower.com",
    role: "standard",
    status: "active",
    companyId: "comp-001",
    companyName: "TEST POWER INC",
    createdAt: "2026-09-12",
    updatedAt: "2026-09-16",
  },
];

// Initial realistic mock data for pending requests
const INITIAL_PENDING_REQUESTS: PendingAccessRequest[] = [
  {
    id: "req-001",
    firstName: "Martin",
    lastName: "Hansen",
    email: "it@ecpower.dk",
    requestedCompany: "EC POWER Inc.",
    note: "Requested via technician invitation portal for field audit team",
    createdAt: "Today, 09:30 AM",
  },
  {
    id: "req-002",
    firstName: "Freja",
    lastName: "Poulsen",
    email: "freja.p@energymaintain.com",
    requestedCompany: "TEST POWER INC",
    note: "Contractor surveyor for hotel boiler room assessments",
    createdAt: "Yesterday, 04:15 PM",
  },
];

const AVAILABLE_COMPANIES = [
  "EC POWER Inc.",
  "TEST POWER INC",
  "Nordic Energy Solutions",
  "Alpine Power Systems",
];

export default function AdminUsersPage() {
  const backHref = ROUTES.VISITS;
  const backLabel = "Visits";

  const [members, setMembers] = useState<User[]>(INITIAL_MEMBERS);
  const [pendingRequests, setPendingRequests] = useState<PendingAccessRequest[]>(
    INITIAL_PENDING_REQUESTS
  );
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [approveTarget, setApproveTarget] = useState<PendingAccessRequest | null>(null);
  const [assignedCompany, setAssignedCompany] = useState("");
  const [assignedRole, setAssignedRole] = useState<UserRole>("standard");

  const [rejectTarget, setRejectTarget] = useState<PendingAccessRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [moveTarget, setMoveTarget] = useState<User | null>(null);
  const [moveToCompany, setMoveToCompany] = useState("");

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (selectedCompanyFilter !== "all" && member.companyName !== selectedCompanyFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = member.name.toLowerCase().includes(q);
        const matchesEmail = member.email.toLowerCase().includes(q);
        const matchesCompany = member.companyName?.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesCompany;
      }
      return true;
    });
  }, [members, selectedCompanyFilter, searchQuery]);

  // Filtered pending requests
  const filteredPending = useMemo(() => {
    return pendingRequests.filter((req) => {
      if (selectedCompanyFilter !== "all" && req.requestedCompany !== selectedCompanyFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${req.firstName} ${req.lastName}`.toLowerCase();
        return fullName.includes(q) || req.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [pendingRequests, selectedCompanyFilter, searchQuery]);

  // Actions: Approve
  const handleOpenApprove = (req: PendingAccessRequest) => {
    setApproveTarget(req);
    setAssignedCompany(req.requestedCompany || AVAILABLE_COMPANIES[0]);
    setAssignedRole("standard");
  };

  const confirmApprove = () => {
    if (!approveTarget) return;

    const newMember: User = {
      id: `usr-${Date.now()}`,
      name: [approveTarget.firstName, approveTarget.middleName, approveTarget.lastName]
        .filter(Boolean)
        .join(" "),
      email: approveTarget.email,
      role: assignedRole,
      status: "active",
      companyName: assignedCompany,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    setMembers([newMember, ...members]);
    setPendingRequests(pendingRequests.filter((r) => r.id !== approveTarget.id));
    showToast(`Approved ${newMember.name} and assigned to ${assignedCompany}`);
    setApproveTarget(null);
  };

  // Actions: Reject
  const confirmReject = () => {
    if (!rejectTarget) return;
    setPendingRequests(pendingRequests.filter((r) => r.id !== rejectTarget.id));
    showToast(`Access request from ${rejectTarget.email} was rejected and purged`);
    setRejectTarget(null);
  };

  // Actions: Delete member
  const confirmDeleteMember = () => {
    if (!deleteTarget) return;
    setMembers(members.filter((m) => m.id !== deleteTarget.id));
    showToast(`Removed member ${deleteTarget.name}. All data has been purged.`);
    setDeleteTarget(null);
  };

  // Actions: Move member company
  const handleOpenMove = (user: User) => {
    setMoveTarget(user);
    setMoveToCompany(user.companyName || AVAILABLE_COMPANIES[0]);
  };

  const confirmMoveCompany = () => {
    if (!moveTarget || !moveToCompany) return;
    setMembers(
      members.map((m) =>
        m.id === moveTarget.id ? { ...m, companyName: moveToCompany } : m
      )
    );
    showToast(`Moved ${moveTarget.name} to ${moveToCompany}`);
    setMoveTarget(null);
  };

  // Actions: Change user role
  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setMembers(
      members.map((m) => (m.id === userId ? { ...m, role: newRole } : m))
    );
    const roleLabels: Record<string, string> = {
      standard: "Standard User",
      company_admin: "CO. ADMIN",
      super_admin: "SUPER",
    };
    showToast(`Updated user role to ${roleLabels[newRole] || newRole}`);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/70 dark:border-amber-700/60">
            <Shield className="size-3 fill-amber-500 text-amber-600" />
            <span>SUPER</span>
          </span>
        );
      case "company_admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300/70 dark:border-sky-700/60">
            <span>CO. ADMIN</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
            <span>Standard User</span>
          </span>
        );
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-foreground overflow-x-hidden selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Background Decorative Grid and Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-sky-100/30 dark:bg-sky-950/20 blur-[120px] rounded-full pointer-events-none" />
      {/* Top Header */}
      <AdminHeader
        title="Accounts"
        subtitle="Manage access requests, members, and roles"
        backHref={ROUTES.VISITS}
        backLabel="Visits"
        actions={
          <Link
            href={ROUTES.ADMIN_COMPANIES}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shadow-xs"
          >
            <Building2 className="size-3.5" />
            <span className="hidden sm:inline">Companies</span>
          </Link>
        }
      />

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Back to Visits Button */}
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all text-xs font-semibold shadow-xs group"
            title={`Go back to ${backLabel}`}
            aria-label={`Go back to ${backLabel}`}
          >
            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to {backLabel.toLowerCase()}</span>
          </Link>
        </div>
        {/* Page Title & Super Admin Context */}
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            EC POWER &bull; Access & Security
          </span>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
              Accounts
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              You&apos;re a super admin &mdash; you see everyone.
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-4 py-2 pl-9 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10 transition-colors"
              />
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Filter by Company */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="companyFilter"
                className="text-xs font-semibold text-slate-500 dark:text-zinc-400 whitespace-nowrap"
              >
                Filter by company:
              </label>
              <select
                id="companyFilter"
                value={selectedCompanyFilter}
                onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-slate-900 cursor-pointer shadow-xs"
              >
                <option value="all">All companies</option>
                {AVAILABLE_COMPANIES.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 1: PENDING REQUESTS (Section 19 requirement) */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300 flex items-center gap-2">
              <Clock className="size-4 text-amber-500" />
              <span>Pending Requests ({filteredPending.length})</span>
            </h2>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500">
              New accounts awaiting administrator approval
            </span>
          </div>

          {filteredPending.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 p-6 text-center text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              No pending access requests matching active filters.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPending.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl border border-amber-200/90 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 backdrop-blur-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-amber-300 dark:hover:border-amber-800"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/80">
                        PENDING
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-50 truncate">
                        {req.firstName} {req.middleName ? `${req.middleName} ` : ""}{req.lastName}
                      </h3>
                      <span className="text-xs text-slate-400 dark:text-zinc-500">
                        &bull; {req.createdAt}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-zinc-300 flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-slate-700 dark:text-zinc-200">
                        {req.email}
                      </span>
                      <span className="text-slate-300 dark:text-zinc-700">|</span>
                      <span>
                        Requested: <strong className="font-semibold">{req.requestedCompany}</strong>
                      </span>
                    </div>

                    {req.note && (
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 pt-0.5 italic">
                        &ldquo;{req.note}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenApprove(req)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <UserCheck className="size-3.5" />
                      <span>Approve &amp; assign...</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectTarget(req)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <UserX className="size-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: MEMBERS (Section 19 requirement) */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300 flex items-center gap-2">
              <Users className="size-4 text-slate-500" />
              <span>Members ({filteredMembers.length})</span>
            </h2>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500">
              Active technician &amp; administrator directory
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  {/* Member info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="size-10 rounded-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm flex items-center justify-center shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-50 truncate">
                          {member.name}
                        </span>
                        {getRoleBadge(member.role)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 flex-wrap">
                        <span className="font-mono text-slate-700 dark:text-zinc-300">
                          {member.email}
                        </span>
                        <span>&bull;</span>
                        <span className="inline-flex items-center gap-1 font-medium text-slate-800 dark:text-zinc-200">
                          <Building2 className="size-3 text-slate-400" />
                          <span>{member.companyName}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Role Selector */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Role Selector */}
                    <div className="flex items-center gap-1">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                        className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer shadow-xs focus:outline-none focus:border-slate-900"
                        title="Change user role"
                      >
                        <option value="standard">Standard User</option>
                        <option value="company_admin">CO. ADMIN</option>
                        <option value="super_admin">SUPER</option>
                      </select>
                    </div>

                    {/* Move Company Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenMove(member)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 transition-colors shadow-xs"
                      title="Move to another company"
                    >
                      Move...
                    </button>

                    {/* Delete User Button */}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(member)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                      title="Delete member"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Modal 1: Approve & Assign Modal (Section 19 requirement) */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                <UserCheck className="size-5 text-emerald-600" />
                <span>Approve &amp; Assign Account</span>
              </h3>
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700 text-xs space-y-1">
              <p className="font-semibold text-slate-900 dark:text-zinc-100">
                {approveTarget.firstName} {approveTarget.lastName}
              </p>
              <p className="text-slate-500 dark:text-zinc-400 font-mono">
                {approveTarget.email}
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1.5 text-left">
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                  Assign Company:
                </label>
                <select
                  value={assignedCompany}
                  onChange={(e) => setAssignedCompany(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 font-medium text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-slate-900"
                >
                  {AVAILABLE_COMPANIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Technician will strictly see visits scoped to this company.
                </p>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                  Initial Role:
                </label>
                <select
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 font-medium text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-slate-900"
                >
                  <option value="standard">Standard User (Field Technician)</option>
                  <option value="company_admin">CO. ADMIN (Company Administrator)</option>
                  <option value="super_admin">SUPER (Global Super Administrator)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmApprove}
                className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-white shadow-xs"
              >
                Approve &amp; Grant Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Reject Access Confirmation */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60">
                <AlertTriangle className="size-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Reject Access Request?
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              Are you sure you want to reject the request from <strong>{rejectTarget.email}</strong>? The request will be fully purged, allowing the user to submit a new application later if appropriate.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReject}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Move Company Modal */}
      {moveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
              Move User to Company
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              Select a new company for <strong>{moveTarget.name}</strong>. Their survey view will update to visits belonging to the selected company.
            </p>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Target Company:
              </label>
              <select
                value={moveToCompany}
                onChange={(e) => setMoveToCompany(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-slate-900"
              >
                {AVAILABLE_COMPANIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMoveTarget(null)}
                className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmMoveCompany}
                className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-white"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Delete Member Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60">
                <AlertTriangle className="size-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Delete Member Account?
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong> ({deleteTarget.email})? As specified in Section 19, deleting a member permanently removes their account association so they can sign up again cleanly if needed.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteMember}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700"
              >
                Delete Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 dark:bg-zinc-100 px-4 py-3 text-xs sm:text-sm font-medium text-white dark:text-zinc-900 shadow-xl border border-slate-800 dark:border-zinc-200 animate-in slide-in-from-bottom-5 duration-200">
          <Check className="size-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
