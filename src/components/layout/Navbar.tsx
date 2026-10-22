"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  FileCode,
  FolderTree,
  Inbox,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
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
  const {
    user,
    logout,
    updateUser,
    switchRole,
    isAuthenticated,
    isLoading,
    isAdmin,
    isSuperAdmin,
    isCompanyAdmin,
  } = useAuth();

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

  const defaultSubtitle = isSuperAdmin
    ? "Super Admin Hub"
    : isCompanyAdmin
    ? "Company Admin Portal"
    : "Admin Console";
  const displaySubtitle = subtitle || defaultSubtitle;
  const userCompany = user?.requestedCompany || user?.companyName || "";

  // Admin Navigation Links
  const navItems = [
    {
      href: ROUTES.ADMIN,
      label: "Dashboard",
      icon: LayoutDashboard,
      isActive: pathname === ROUTES.ADMIN,
      show: true,
    },
    {
      href: ROUTES.ADMIN_SUBMISSIONS,
      label: "Submissions",
      icon: Inbox,
      isActive: pathname.startsWith(ROUTES.ADMIN_SUBMISSIONS),
      show: true,
    },
    {
      href: ROUTES.ADMIN_USERS,
      label: "Accounts",
      icon: Users,
      isActive: pathname.startsWith(ROUTES.ADMIN_USERS),
      show: true,
    },
    {
      href: ROUTES.ADMIN_COMPANIES,
      label: "Companies",
      icon: FolderTree,
      isActive: pathname.startsWith(ROUTES.ADMIN_COMPANIES),
      show: true,
    },
    {
      href: ROUTES.ADMIN_TEMPLATES,
      label: "PDF Template",
      icon: FileCode,
      isActive: pathname.startsWith(ROUTES.ADMIN_TEMPLATES),
      show: true,
    },
    {
      href: ROUTES.ADMIN_RETENTION,
      label: "Retention",
      icon: Trash2,
      isActive: pathname.startsWith(ROUTES.ADMIN_RETENTION),
      show: true,
    },
  ].filter((item) => item.show);

  const fullName =
    [user?.firstName, user?.middleName, user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.email ||
    "Administrator";

  const userInitial = (
    user?.firstName?.charAt(0) ||
    user?.email?.charAt(0) ||
    "A"
  ).toUpperCase();

  const roleLabel = isAdmin ? "Administrator" : "Normal User";

  const handleLogout = async () => {
    setShowUserMenu(false);
    setShowMobileNav(false);
    await logout();
    router.replace(ROUTES.AUTH);
  };

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
      } catch {}

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
        className={`relative z-30 w-full border-b border-slate-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md sticky top-0 ${className}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-3 sm:gap-4">
            {/* Left: Brand + Context */}
            <div className="flex items-center gap-2.5 sm:gap-4">
              {backHref && (
                <Link
                  href={backHref}
                  className="mr-1 p-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  title={backLabel ? `Back to ${backLabel}` : "Go back"}
                >
                  <ArrowLeft className="size-4" />
                </Link>
              )}

              {/* Logo & Brand text */}
              <Link
                href={ROUTES.ADMIN}
                className="flex items-center gap-2.5 select-none group"
              >
                <div className="flex items-center justify-center size-9 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-sm transition-transform group-hover:scale-105">
                  <Zap className="size-4 fill-current text-amber-400 dark:text-slate-900" />
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                      EC POWER
                    </span>
                  </div>
                  <span className="text-[10px] tracking-wider font-semibold text-slate-500 dark:text-zinc-400 uppercase mt-0.5">
                    {displaySubtitle}
                  </span>
                </div>
              </Link>

              {/* Active Company Badge */}
              {isAuthenticated && userCompany ? (
                <>
                  <span className="hidden lg:inline-block h-5 w-px bg-slate-200 dark:border-zinc-800 ml-1" />
                  <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 text-xs font-semibold text-slate-800 dark:text-zinc-200">
                    <Building2 className="size-3.5 text-slate-500 dark:text-zinc-400 shrink-0" />
                    <span className="truncate max-w-[160px]">{userCompany}</span>
                  </div>
                </>
              ) : null}
            </div>

            {/* Center: Desktop Navigation Tabs */}
            {isAuthenticated && isAdmin && (
              <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 dark:bg-zinc-800/90 p-1 rounded-xl text-xs font-medium">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        item.isActive
                          ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-bold shadow-xs"
                          : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right: Actions & User Dropdown */}
            <div className="flex items-center gap-2 sm:gap-3">
              {actions && (
                <div className="flex items-center gap-2">{actions}</div>
              )}

              {/* Authenticated Admin Badge + Dropdown */}
              {isAuthenticated && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer select-none border border-slate-200/80 dark:border-zinc-800"
                    aria-expanded={showUserMenu}
                  >
                    <div className="size-7 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold flex items-center justify-center text-xs shadow-xs">
                      {userInitial}
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 max-w-[120px] truncate leading-tight">
                        {fullName}
                      </span>
                      <span
                        className={`text-[10px] font-semibold leading-none mt-0.5 ${
                          isSuperAdmin
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-sky-600 dark:text-sky-400"
                        }`}
                      >
                        {roleLabel}
                      </span>
                    </div>
                    <ChevronDown className="size-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl py-2 z-50 text-left">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800">
                        <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                          {fullName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                          {user?.email}
                        </p>
                        <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                          <ShieldCheck className="size-3 text-emerald-600" />
                          <span>{roleLabel}</span>
                        </div>
                      </div>

                      {/* Mobile Navigation Links */}
                      <div className="md:hidden py-1 border-b border-slate-100 dark:border-zinc-800">
                        {navItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                          >
                            <item.icon className="size-4 text-slate-400" />
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>

                      {/* Edit Name Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowEditNameModal(true);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-left"
                      >
                        <User className="size-4 text-slate-400" />
                        <span>Edit Profile Name</span>
                      </button>

                      {/* Sign Out */}
                      <div className="pt-1 border-t border-slate-100 dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="size-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Edit Name Modal */}
      {showEditNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Edit Profile Name
              </h3>
              <button
                type="button"
                onClick={() => setShowEditNameModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveName} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Middle Name (Optional)
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-transparent"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditNameModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingName}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-60"
                >
                  {isSavingName ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <Check className="size-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
