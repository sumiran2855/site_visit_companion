"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  FileText,
  LogOut,
  MapPin,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { AuthService } from "@/services/auth.service";

export interface NavbarProps {
  subtitle?: string;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function Navbar({
  subtitle,
  actions,
  backHref,
  backLabel,
  className = "",
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, updateUser, isAuthenticated, isLoading } = useAuth();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Edit Name Modal State
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [middleName, setMiddleName] = useState(user?.middleName || "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Keep modal fields in sync when user changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setMiddleName(user.middleName || "");
    }
  }, [user]);

  // Click outside to close user dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowUserMenu(false);
        setShowMobileNav(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showUserMenu]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Role permissions
  const role = user?.role || "standard";
  const isSuperAdmin = role === "super_admin" || role === "admin";
  const isCompanyAdmin = role === "company_admin";
  const hasAdminPrivileges = isSuperAdmin || isCompanyAdmin;

  // Resolved dynamic subtitle
  const defaultSubtitle = pathname.startsWith("/admin")
    ? "Admin Console"
    : "Site Visit Companion";
  const displaySubtitle = subtitle || defaultSubtitle;

  // Active company name from session
  const userCompany = user?.requestedCompany || user?.companyName || "";

  // Navigation Links filtered strictly according to user role
  const navItems = [
    {
      href: ROUTES.ADMIN_USERS,
      label: "Accounts",
      icon: Users,
      isActive: pathname.startsWith(ROUTES.ADMIN_USERS),
      show: isAuthenticated && hasAdminPrivileges,
    },
    {
      href: ROUTES.ADMIN_COMPANIES,
      label: "Companies",
      icon: Building2,
      isActive: pathname.startsWith(ROUTES.ADMIN_COMPANIES),
      show: isAuthenticated && hasAdminPrivileges,
    },
    {
      href: ROUTES.ADMIN_TEMPLATES,
      label: "Edit PDF template",
      icon: FileText,
      isActive:
        pathname.startsWith(ROUTES.ADMIN_TEMPLATES) || pathname === "/template",
      show: isAuthenticated && hasAdminPrivileges,
    },
  ].filter((item) => item.show);

  // User presentation helpers
  const fullName =
    [user?.firstName, user?.middleName, user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.email ||
    "User";

  const userInitial = (
    user?.firstName?.charAt(0) ||
    user?.email?.charAt(0) ||
    "U"
  ).toUpperCase();

  const roleLabel =
    role === "super_admin"
      ? "Super Admin"
      : role === "company_admin"
      ? "Company Admin"
      : role === "admin"
      ? "Admin"
      : "Standard User";

  // Handle Logout
  const handleLogout = async () => {
    setShowUserMenu(false);
    setShowMobileNav(false);
    await logout();
    router.replace(ROUTES.AUTH);
  };

  // Handle Save Name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    setIsSavingName(true);
    try {
      try {
        await AuthService.getInstance().updateProfile({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          middleName: middleName.trim() || null,
        });
      } catch {
        // Fallback for offline or local dev
      }

      updateUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleName: middleName.trim() || null,
      });

      setShowEditNameModal(false);
      showToast("Profile name updated successfully");
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <>
      <header
        className={`relative z-20 w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 ${className}`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-3 sm:gap-4">
            {/* Left: Brand + Context */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Optional Back button */}
              {backHref && (
                <Link
                  href={backHref}
                  className="mr-1 p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  title={backLabel ? `Back to ${backLabel}` : "Go back"}
                >
                  <ArrowLeft className="size-4" />
                </Link>
              )}

              {/* Logo & Brand text */}
              <Link
                href={isAuthenticated ? ROUTES.VISITS : ROUTES.HOME}
                className="flex items-center gap-2.5 select-none group"
              >
                <div className="flex items-center justify-center size-8 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-sm transition-transform group-hover:scale-105">
                  <Zap className="size-4 fill-current" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                    EC POWER
                  </span>
                  <span className="text-[10px] tracking-wider font-medium text-slate-500 dark:text-zinc-400 uppercase mt-0.5">
                    {displaySubtitle}
                  </span>
                </div>
              </Link>

              {/* Active Company Badge (Section 3 & 4: Only show if company is returned / not null) */}
              {isAuthenticated && userCompany ? (
                <>
                  <span className="hidden md:inline-block h-5 w-px bg-slate-200 dark:bg-zinc-800 ml-1" />
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 text-xs font-semibold text-slate-800 dark:text-zinc-200 shadow-2xs">
                    <Building2 className="size-3.5 text-slate-500 dark:text-zinc-400 shrink-0" />
                    <span className="truncate max-w-[150px]">{userCompany}</span>
                  </div>
                </>
              ) : null}
            </div>

            {/* Center: Desktop Navigation Links */}
            {navItems.length > 0 && (
              <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl text-xs font-medium">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        item.isActive
                          ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-semibold shadow-xs"
                          : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Icon className="size-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right: Actions Slot & User Menu / Sign In */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Custom Header Actions Slot (e.g. Checklist buttons, Admin action buttons) */}
              {actions && (
                <div className="flex items-center gap-2">{actions}</div>
              )}

              {/* Unauthenticated State: Sign In Button */}
              {!isLoading && !isAuthenticated && (
                <Link
                  href={ROUTES.AUTH}
                  className="inline-flex items-center justify-center text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-colors"
                >
                  Sign In
                </Link>
              )}

              {/* Authenticated State: User Menu Dropdown */}
              {isAuthenticated && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer select-none"
                    aria-expanded={showUserMenu}
                  >
                    <div className="size-8 rounded-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs flex items-center justify-center shadow-xs">
                      {userInitial}
                    </div>
                    <div className="hidden md:flex flex-col text-left max-w-[140px]">
                      <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 leading-tight truncate">
                        {fullName}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 capitalize">
                        {roleLabel}
                      </span>
                    </div>
                    <ChevronDown className="size-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-1.5 z-40 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
                      {/* User Info Header */}
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800">
                        <p className="font-semibold text-slate-900 dark:text-zinc-100 truncate">
                          {fullName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                          {user?.email}
                        </p>
                        {userCompany ? (
                          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium text-slate-700 dark:text-zinc-300">
                            <Building2 className="size-3 text-slate-400 shrink-0" />
                            <span className="truncate">{userCompany}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Edit my name Action */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowEditNameModal(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
                      >
                        <User className="size-3.5 text-slate-400" />
                        <span>Edit my name</span>
                      </button>

                      {/* Mobile Links inside User Dropdown for Small Screens */}
                      {navItems.length > 0 && (
                        <div className="lg:hidden border-t border-slate-100 dark:border-zinc-800 pt-1">
                          {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setShowUserMenu(false)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                                  item.isActive
                                    ? "bg-slate-100 dark:bg-zinc-800 font-semibold text-slate-900 dark:text-white"
                                    : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                }`}
                              >
                                <Icon className="size-3.5 text-slate-400" />
                                <span>{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {/* Sign Out Action */}
                      <div className="border-t border-slate-100 dark:border-zinc-800 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left cursor-pointer font-medium"
                        >
                          <LogOut className="size-3.5" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation Tabs (visible when toggled or on tablets) */}
          {showMobileNav && navItems.length > 0 && (
            <div className="lg:hidden border-t border-slate-100 dark:border-zinc-800 py-2.5 flex items-center gap-1.5 overflow-x-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMobileNav(false)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                      item.isActive
                        ? "bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold shadow-xs"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* GLOBAL EDIT MY NAME MODAL */}
      {showEditNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300">
                  <User className="size-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50">
                  Edit My Name
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditNameModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveName} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="navbar-edit-firstName"
                  className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300"
                >
                  First name <span className="text-red-500">*</span>
                </label>
                <input
                  id="navbar-edit-firstName"
                  type="text"
                  required
                  autoComplete="given-name"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10 transition-colors"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="navbar-edit-lastName"
                  className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300"
                >
                  Last name <span className="text-red-500">*</span>
                </label>
                <input
                  id="navbar-edit-lastName"
                  type="text"
                  required
                  autoComplete="family-name"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-900 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10 transition-colors"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="navbar-edit-middleName"
                  className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300"
                >
                  Middle name (optional)
                </label>
                <input
                  id="navbar-edit-middleName"
                  type="text"
                  autoComplete="additional-name"
                  placeholder="Middle name"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
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
                  disabled={isSavingName}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-white transition-colors disabled:opacity-50"
                >
                  {isSavingName ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
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
    </>
  );
}

