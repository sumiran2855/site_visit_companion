"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronDown,
  Users,
  Zap,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { CreateVisitForm } from "@/components/visits/CreateVisitForm";
import { VisitList } from "@/components/visits/VisitList";
import type { VisitItem } from "@/components/visits/VisitCard";
import { VisitService } from "@/services/visit.service";

export default function MySiteVisitsPage() {
  const router = useRouter();
  const { user: authUser, isLoading: isAuthLoading } = useAuth();

  // Auth Guard: redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthLoading && !authUser) {
      router.replace(ROUTES.AUTH);
    }
  }, [isAuthLoading, authUser, router]);

  // User details derived from authenticated session
  const userRole = authUser?.role || "standard";
  const userCompany = authUser?.requestedCompany || authUser?.companyName || "";
  const isSuperAdmin = userRole === "super_admin" || userRole === "admin";

  // Visits State - dynamically loaded, no mock visits
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [isLoadingVisits, setIsLoadingVisits] = useState(true);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("all");
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VisitItem | null>(null);

  // Fetch visits for the authenticated user / company
  useEffect(() => {
    // If not authenticated or during logout, do not fetch visits
    if (!authUser) {
      setVisits([]);
      setIsLoadingVisits(false);
      return;
    }

    let isMounted = true;
    const fetchVisits = async () => {
      setIsLoadingVisits(true);
      try {
        const comp = authUser.requestedCompany || authUser.companyName || undefined;
        const data = await VisitService.getInstance().listVisits(comp);
        if (isMounted) {
          setVisits(data);
        }
      } catch {
        if (isMounted) setVisits([]);
      } finally {
        if (isMounted) setIsLoadingVisits(false);
      }
    };

    fetchVisits();
    return () => {
      isMounted = false;
    };
  }, [authUser]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Companies available in system
  const allCompanies = Array.from(new Set(visits.map((v) => v.companyName).filter(Boolean)));

  // Scoped visits: Normal users see visits for their company, or all their visits if unassigned
  const visibleVisits = isSuperAdmin
    ? visits
    : userCompany
    ? visits.filter((v) => !v.companyName || v.companyName === userCompany)
    : visits;

  // Handle create new visit
  const handleCreateVisit = async (siteName: string) => {
    setIsCreating(true);
    try {
      const newVisit = await VisitService.getInstance().createVisit({
        siteName,
        companyName: userCompany || undefined,
        companyId: authUser?.companyId || undefined,
      });

      setVisits((prev) => [newVisit, ...prev]);
      showToast(`Created visit: ${siteName}`);
      router.push(ROUTES.VISIT_DETAILS(newVisit.id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create visit";
      showToast(msg);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle copy shareable link
  const handleCopyLink = (visit: VisitItem) => {
    const shareUrl = `${window.location.origin}${ROUTES.SHARED_VISIT(visit.shareToken)}`;
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    showToast("Shareable link copied to clipboard!");
  };

  // Handle delete visit
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await VisitService.getInstance().deleteVisit(deleteTarget.id);
      setVisits((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      showToast(`Deleted visit "${deleteTarget.siteName}"`);
    } catch {
      setVisits((prev) => prev.filter((v) => v.id !== deleteTarget.id));
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-foreground overflow-x-hidden selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Background Grid & Ambient Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-sky-100/30 dark:bg-sky-950/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Navbar */}
      <Navbar />

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

          {isSuperAdmin ? (
            <div className="text-xs text-slate-500 dark:text-zinc-400">
              <span>Showing visits for: </span>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                {selectedCompanyFilter === "all"
                  ? "All Companies"
                  : selectedCompanyFilter}
              </span>
            </div>
          ) : userCompany ? (
            <div className="text-xs text-slate-500 dark:text-zinc-400">
              <span>Showing visits for: </span>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                {userCompany}
              </span>
            </div>
          ) : null}
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

          {isLoadingVisits ? (
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 p-12 text-center bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm">
              <div className="size-8 mx-auto border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Loading your site visits...
              </p>
            </div>
          ) : (
            <VisitList
              visits={visibleVisits}
              companies={allCompanies}
              selectedCompany={selectedCompanyFilter}
              onCompanyChange={setSelectedCompanyFilter}
              onCopyLink={handleCopyLink}
              onDelete={(visit) => setDeleteTarget(visit)}
              isAdmin={isSuperAdmin}
            />
          )}
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
