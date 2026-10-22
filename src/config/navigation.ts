import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/types/auth";

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  roles?: UserRole[];
  badge?: string;
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: ROUTES.ADMIN,
    roles: ["admin"],
  },
  {
    title: "Submissions",
    href: ROUTES.ADMIN_SUBMISSIONS,
    roles: ["admin"],
  },
  {
    title: "Accounts",
    href: ROUTES.ADMIN_USERS,
    roles: ["admin"],
  },
  {
    title: "Companies",
    href: ROUTES.ADMIN_COMPANIES,
    roles: ["admin"],
  },
  {
    title: "PDF Template",
    href: ROUTES.ADMIN_TEMPLATES,
    roles: ["admin"],
  },
  {
    title: "Retention",
    href: ROUTES.ADMIN_RETENTION,
    roles: ["admin"],
  },
];
