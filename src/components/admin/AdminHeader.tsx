"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FileText,
  Users,
  Zap,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export function AdminHeader({
  actions,
}: AdminHeaderProps) {
  const pathname = usePathname();

  const navLinks = [
    {
      href: ROUTES.ADMIN_USERS,
      label: "Accounts",
      icon: Users,
      isActive: pathname.startsWith(ROUTES.ADMIN_USERS),
    },
    {
      href: ROUTES.ADMIN_COMPANIES,
      label: "Companies",
      icon: Building2,
      isActive: pathname.startsWith(ROUTES.ADMIN_COMPANIES),
    },
    {
      href: ROUTES.ADMIN_TEMPLATES,
      label: "Edit PDF template",
      icon: FileText,
      isActive: pathname.startsWith(ROUTES.ADMIN_TEMPLATES),
    },
  ];

  return (
    <header className="relative z-20 w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2 select-none">
              <div className="flex items-center justify-center size-8 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-sm">
                <Zap className="size-4 fill-current" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  EC POWER
                </span>
                <span className="text-[10px] tracking-wider font-medium text-slate-500 dark:text-zinc-400 uppercase">
                  Admin Console
                </span>
              </div>
            </div>
          </div>

          {/* Center/Right Nav tabs */}
          <div className="flex items-center gap-1 sm:gap-2">
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl text-xs font-medium">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      link.isActive
                        ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-semibold shadow-xs"
                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Custom Header Actions (e.g. Create company, Blank PDF, Save template) */}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>

        {/* Mobile Navigation Tabs (visible on phone/tablet) */}
        <div className="md:hidden border-t border-slate-100 dark:border-zinc-800 py-2 flex items-center gap-1 overflow-x-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                  link.isActive
                    ? "bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

