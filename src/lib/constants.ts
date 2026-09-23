export const APP_NAME = "Site Visit Companion";
export const APP_DESCRIPTION = "Manage site inspections, audit visits, and checklists effortlessly.";

export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  AUTH_CALLBACK: "/auth/callback",
  PENDING: "/pending",
  VISITS: "/visits",
  VISIT_DETAILS: (id: string) => `/visits/${id}`,
  ADMIN_USERS: "/admin/users",
  ADMIN_COMPANIES: "/admin/companies",
  ADMIN_TEMPLATES: "/admin/template",
  SHARED_VISIT: (token: string) => `/shared/${token}`,
  PRIVACY: "/privacy",
  TERMS: "/terms",
} as const;

export const VISIT_STATUS_LABELS = {
  draft: "Draft",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  pending_review: "Pending Review",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;

export const CHECKLIST_STATUS_LABELS = {
  pass: "Pass",
  fail: "Fail",
  na: "N/A",
  pending: "Pending",
} as const;

