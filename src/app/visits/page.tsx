"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  ChevronDown,
  FileText,
  LogOut,
  Shield,
  User,
  Users,
  Zap,
  X,
  AlertTriangle,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { CreateVisitForm } from "@/components/visits/CreateVisitForm";
import { VisitList } from "@/components/visits/VisitList";
import type { VisitItem } from "@/components/visits/VisitCard";
import type { UserRole } from "@/types/auth";

// Initial realistic mock data
const INITIAL_VISITS: VisitItem[] = [
  {
    id: "v-001",
    siteName: "Benbow Inn - Main Facility",
    companyName: "TEST POWER INC",
    status: "in_progress",
    completedFields: 65,
    totalFields: 73,
    updatedAt: "Today, 11:42 AM",
    createdAt: "2026-09-16",
    shareToken: "token_benbow_8f92a",
  },
  {
    id: "v-002",
    siteName: "Harbor View Hotel - XRGI Survey",
    companyName: "TEST POWER INC",
    status: "completed",
    completedFields: 73,
    totalFields: 73,
    updatedAt: "Yesterday, 3:15 PM",
    createdAt: "2026-09-14",
    shareToken: "token_harbor_23b8c",
  },
  {
    id: "v-003",
    siteName: "Grandview Apartments - Boiler Facility",
    companyName: "EC POWER Inc.",
    status: "in_progress",
    completedFields: 24,
    totalFields: 29,
    updatedAt: "Sep 18, 2026",
    createdAt: "2026-09-12",
    shareToken: "token_grandview_5a11d",
  },
  {
    id: "v-004",
    siteName: "Copenhagen Tech Campus - Energy Audit",
    companyName: "EC POWER Inc.",
    status: "scheduled",
    completedFields: 0,
    totalFields: 73,
    updatedAt: "Sep 10, 2026",
    createdAt: "2026-09-10",
    shareToken: "token_techcampus_99e31",
  },
];

export default function MySiteVisitsPage() {
  const router = useRouter();

  // User Profile State
  const [userRole, setUserRole] = useState<UserRole>("standard");
  const [firstName, setFirstName] = useState("Alex");
  const [lastName, setLastName] = useState("Jensen");
  const [middleName, setMiddleName] = useState("");
  const [userCompany] = useState("TEST POWER INC");

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

  // Visits State
  const [visits, setVisits] = useState<VisitItem[]>(INITIAL_VISITS);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("all");
  const [isCreating, setIsCreating] = useState(false);

  // Modals & Popovers
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [newFirstName, setNewFirstName] = useState(firstName);
  const [newLastName, setNewLastName] = useState(lastName);
  const [newMiddleName, setNewMiddleName] = useState(middleName);
  const [deleteTarget, setDeleteTarget] = useState<VisitItem | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const isSuperAdmin = userRole === "super_admin" || userRole === "admin";

  // Companies available in system
  const allCompanies = Array.from(new Set(visits.map((v) => v.companyName)));

  // Scoped visits: Normal users must only see visits belonging to their own company
  const visibleVisits = isSuperAdmin
    ? visits
    : visits.filter((v) => v.companyName === userCompany);

  // Handle create new visit
  const handleCreateVisit = (siteName: string) => {
    setIsCreating(true);
    setTimeout(() => {
      const newId = `v-${Date.now()}`;
      const newVisit: VisitItem = {
        id: newId,
        siteName,
        companyName: userCompany,
        status: "in_progress",
        completedFields: 0,
        totalFields: 73,
        updatedAt: "Just now",
        createdAt: new Date().toISOString().split("T")[0],
        shareToken: `token_${Math.random().toString(36).substring(2, 9)}`,
      };

      setVisits([newVisit, ...visits]);
      setIsCreating(false);
      showToast(`Created visit: ${siteName}`);

      // Open new visit checklist
      router.push(ROUTES.VISIT_DETAILS(newId));
    }, 400);
  };

  // Handle copy shareable link
  const handleCopyLink = (visit: VisitItem) => {
    const shareUrl = `${window.location.origin}${ROUTES.SHARED_VISIT(visit.shareToken)}`;
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    showToast("Shareable link copied to clipboard!");
  };

  // Handle delete visit
  const confirmDelete = () => {
    if (!deleteTarget) return;
    setVisits(visits.filter((v) => v.id !== deleteTarget.id));
    showToast(`Deleted visit "${deleteTarget.siteName}"`);
    setDeleteTarget(null);
  };

  // Handle edit name save
  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim()) return;
    setFirstName(newFirstName.trim());
    setLastName(newLastName.trim());
    setMiddleName(newMiddleName.trim());
    setShowEditNameModal(false);
    showToast("Profile name updated successfully");
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-foreground overflow-x-hidden selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Background Grid & Ambient Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-sky-100/30 dark:bg-sky-950/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Top Header */}
      <header className="relative z-20 w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand + Company Context */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 select-none">
              <div className="flex items-center justify-center size-8 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-sm">
                <Zap className="size-4 fill-current" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  EC POWER
                </span>
                <span className="text-[10px] tracking-wider font-medium text-slate-500 dark:text-zinc-400 uppercase">
                  Site Visit Companion
                </span>
              </div>
            </div>

            <span className="hidden md:inline-block h-5 w-px bg-slate-200 dark:bg-zinc-800" />

            {/* Current Active Company Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 text-xs font-semibold text-slate-800 dark:text-zinc-200">
              <Building2 className="size-3.5 text-slate-500 dark:text-zinc-400" />
              <span>{userCompany}</span>
            </div>
          </div>

          {/* Right Navigation & Admin Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Super Admin Quick Links */}
            {isSuperAdmin && (
              <div className="hidden lg:flex items-center gap-1 border-r border-slate-200 dark:border-zinc-800 pr-3 mr-1 text-xs font-medium">
                <Link
                  href={ROUTES.ADMIN_USERS}
                  className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                >
                  <Users className="size-3.5" />
                  <span>Accounts</span>
                </Link>
                <Link
                  href={ROUTES.ADMIN_COMPANIES}
                  className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                >
                  <Building2 className="size-3.5" />
                  <span>Companies</span>
                </Link>
                <Link
                  href={ROUTES.ADMIN_TEMPLATES}
                  className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                >
                  <FileText className="size-3.5" />
                  <span>Edit PDF template</span>
                </Link>
              </div>
            )}

            {/* Role Demo Switcher (Simulates Role Perspectives) */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100/80 dark:bg-zinc-800/80 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              <Shield className="size-3 text-slate-400" />
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="bg-transparent border-0 text-slate-700 dark:text-zinc-300 font-semibold cursor-pointer outline-none focus:ring-0"
              >
                <option value="standard">Standard User</option>
                <option value="company_admin">Company Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            {/* User Profile Dropdown / Actions */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                aria-expanded={showUserMenu}
              >
                <div className="size-8 rounded-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs flex items-center justify-center">
                  {firstName.charAt(0)}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 leading-tight">
                    {fullName}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 capitalize">
                    {userRole.replace("_", " ")}
                  </span>
                </div>
                <ChevronDown className="size-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-1.5 z-30 text-xs space-y-1">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800">
                      <p className="font-semibold text-slate-900 dark:text-zinc-100">
                        {fullName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {userCompany}
                      </p>
                    </div>

                    {/* Edit my name (Mandated in Section 8 for all users) */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        setNewFirstName(firstName);
                        setNewLastName(lastName);
                        setNewMiddleName(middleName);
                        setShowEditNameModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-left"
                    >
                      <User className="size-3.5 text-slate-400" />
                      <span>Edit my name</span>
                    </button>

                    {/* Super Admin Options in Mobile/Dropdown */}
                    {isSuperAdmin && (
                      <div className="lg:hidden border-t border-slate-100 dark:border-zinc-800 pt-1">
                        <Link
                          href={ROUTES.ADMIN_USERS}
                          onClick={() => setShowUserMenu(false)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        >
                          <Users className="size-3.5 text-slate-400" />
                          <span>Accounts</span>
                        </Link>
                        <Link
                          href={ROUTES.ADMIN_TEMPLATES}
                          onClick={() => setShowUserMenu(false)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        >
                          <FileText className="size-3.5 text-slate-400" />
                          <span>Edit PDF template</span>
                        </Link>
                      </div>
                    )}

                    {/* Sign Out Action */}
                    <div className="border-t border-slate-100 dark:border-zinc-800 pt-1">
                      <Link
                        href={ROUTES.AUTH}
                        onClick={() => setShowUserMenu(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <LogOut className="size-3.5" />
                        <span>Sign out</span>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Page Title & Context */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
              Field Operations
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 mt-1">
              My Site Visits
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Manage inspection surveys, capture field checklist documentation, and share project archives.
            </p>
          </div>

          <div className="text-xs text-slate-500 dark:text-zinc-400">
            <span>Showing visits for: </span>
            <span className="font-semibold text-slate-800 dark:text-zinc-200">
              {isSuperAdmin && selectedCompanyFilter === "all"
                ? "All Companies"
                : isSuperAdmin
                ? selectedCompanyFilter
                : userCompany}
            </span>
          </div>
        </div>

        {/* Start a New Site Visit Area (Section 8 requirement) */}
        <CreateVisitForm
          onCreateVisit={handleCreateVisit}
          isLoading={isCreating}
        />

        {/* Existing Visits List / Grid (Section 8 requirement) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
              Existing Visits ({visibleVisits.length})
            </h2>
          </div>

          <VisitList
            visits={visibleVisits}
            companies={allCompanies}
            selectedCompany={selectedCompanyFilter}
            onCompanyChange={setSelectedCompanyFilter}
            onCopyLink={handleCopyLink}
            onDelete={(visit) => setDeleteTarget(visit)}
            isAdmin={isSuperAdmin}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-6">
            <Link
              href={ROUTES.PRIVACY}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href={ROUTES.TERMS}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span>&copy; {new Date().getFullYear()} EC POWER. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-300 dark:text-zinc-700">|</span>
            <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-zinc-500">EN / DE</span>
          </div>
        </div>
      </footer>

      {/* Edit My Name Modal (Section 8 requirement) */}
      {showEditNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                Edit My Name
              </h3>
              <button
                type="button"
                onClick={() => setShowEditNameModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveName} className="space-y-4">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-firstName"
                    className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300"
                  >
                    First name
                  </label>
                  <input
                    id="edit-firstName"
                    type="text"
                    required
                    autoComplete="given-name"
                    placeholder="Alex"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-lastName"
                    className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300"
                  >
                    Last name
                  </label>
                  <input
                    id="edit-lastName"
                    type="text"
                    required
                    autoComplete="family-name"
                    placeholder="Jensen"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10 transition-colors"
                  />
                </div>
              </div>

              {/* Middle Name (optional) */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="edit-middleName"
                  className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300"
                >
                  Middle name (optional)
                </label>
                <input
                  id="edit-middleName"
                  type="text"
                  autoComplete="additional-name"
                  placeholder=""
                  value={newMiddleName}
                  onChange={(e) => setNewMiddleName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditNameModal(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-white transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="size-10 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center border border-red-200/60 dark:border-red-900/40">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50">
                  Delete Site Visit
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 dark:text-white">
                &ldquo;{deleteTarget.siteName}&rdquo;
              </strong>{" "}
              and all of its recorded checklist entries, photos, and notes?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
              >
                Delete Visit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification (Section 34 requirement) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 dark:bg-zinc-100 px-4 py-3 text-xs sm:text-sm font-medium text-white dark:text-zinc-900 shadow-xl border border-slate-800 dark:border-zinc-200 animate-in slide-in-from-bottom-5 duration-200">
          <Check className="size-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
