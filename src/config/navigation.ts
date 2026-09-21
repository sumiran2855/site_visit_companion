import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/types/auth";

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  roles?: UserRole[];
  badge?: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    title: "Visits",
    href: ROUTES.VISITS,
    roles: ["admin", "inspector", "manager", "client"],
  },
  {
    title: "Pending",
    href: ROUTES.PENDING,
    roles: ["admin", "inspector", "manager"],
  },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    title: "Users",
    href: ROUTES.ADMIN_USERS,
    roles: ["admin"],
  },
  {
    title: "Companies",
    href: ROUTES.ADMIN_COMPANIES,
    roles: ["admin"],
  },
  {
    title: "Templates",
    href: ROUTES.ADMIN_TEMPLATES,
    roles: ["admin"],
  },
];

