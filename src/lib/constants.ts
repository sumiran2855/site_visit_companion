export const APP_NAME = "Site Visit Companion - Admin Portal";
export const APP_DESCRIPTION = "Centralized administrative management for EC POWER Site Visit Companion.";

export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  AUTH_CALLBACK: "/auth/callback",
  PENDING: "/pending",
  ADMIN: "/admin",
  ADMIN_SUBMISSIONS: "/admin/submissions",
  ADMIN_USERS: "/admin/users",
  ADMIN_COMPANIES: "/admin/companies",
  ADMIN_TEMPLATES: "/admin/template",
  ADMIN_RETENTION: "/admin/retention",
  PRIVACY: "/privacy",
  TERMS: "/terms",
} as const;

export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
  // Backward compatibility aliases
  SUPER_ADMIN: "admin",
  COMPANY_ADMIN: "admin",
  STANDARD: "user",
} as const;
