"use client";

import React from "react";
import { Navbar, type NavbarProps } from "@/components/layout/Navbar";

export interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

/**
 * AdminHeader renders the unified Navbar configured with Admin Console context.
 * Delegates directly to Navbar to ensure DRY principle.
 */
export function AdminHeader({
  subtitle = "Admin Console",
  actions,
  backHref,
  backLabel,
}: AdminHeaderProps) {
  return (
    <Navbar
      subtitle={subtitle}
      actions={actions}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
