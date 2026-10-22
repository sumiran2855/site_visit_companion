"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { ROUTES } from "@/lib/constants";
import { Zap } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(ROUTES.AUTH);
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-16 h-16 rounded-2xl bg-[#15438F] border border-white/20 flex items-center justify-center mb-4 shadow-xl">
          <Zap className="size-8 text-amber-400 fill-current animate-pulse" />
        </div>
        <h2 className="text-xl font-black tracking-widest text-white mb-1">
          EC POWER
        </h2>
        <p className="text-[11px] font-bold tracking-widest uppercase text-amber-400 mb-6">
          Admin Console
        </p>
        <div className="size-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Role-Based Access Control: Exclusively for Company Admin and Super Admin
  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      <Navbar />
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}

