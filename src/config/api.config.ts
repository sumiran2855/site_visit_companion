export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  SUPABASE_URL: (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://loilxmrdnvwvfykfbztg.supabase.co"
  )
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/+$/, ""),
  SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvaWx4bXJkbnZ3dmZ5a2ZienRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMjIwMzYsImV4cCI6MjEwNTc5ODAzNn0.7izYIfQVXFepva7PRUHrBrwHtS_hz7Ahnv69W9DcBuE",
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvaWx4bXJkbnZ3dmZ5a2ZienRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDIyMjAzNiwiZXhwIjoyMTA1Nzk4MDM2fQ.vmdGBR48B2nJp3u314XKlIa3quJfaq-N0iMlQaG0fRs",
  TIMEOUT_MS: 15000,
  STORAGE_KEYS: {
    AUTH_TOKEN: "ec_auth_token",
    AUTH_USER: "ec_auth_user",
  },
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      SIGNUP: "/auth/signup",
      STATUS: "/auth/status",
      ME: "/auth/me",
      LOGOUT: "/auth/logout",
      PROFILE: "/auth/profile",
      GOOGLE: "/auth/google",
    },
    ADMIN: {
      REQUESTS: "/admin/requests",
      APPROVE_REQUEST: (id: string) => `/admin/requests/${id}/approve`,
      REJECT_REQUEST: (id: string) => `/admin/requests/${id}/reject`,
      MEMBERS: "/admin/members",
      UPDATE_ROLE: (id: string) => `/admin/members/${id}/role`,
      MOVE_COMPANY: (id: string) => `/admin/members/${id}/company`,
      PURGE_USER: (id: string) => `/admin/members/${id}`,
      RETENTION_CLEANUP: "/admin/retention/cleanup",
      SUBMISSIONS: "/admin/submissions",
      SUBMISSION_DETAIL: (id: string) => `/admin/submissions/${id}`,
      APPROVE_SUBMISSION: (id: string) => `/admin/submissions/${id}/approve`,
      REJECT_SUBMISSION: (id: string) => `/admin/submissions/${id}/reject`,
      REQUEST_MORE: (id: string) => `/admin/submissions/${id}/request-more`,
      UPDATE_AREA_STATUS: (id: string) => `/admin/submissions/${id}/area-status`,
      UPDATE_NOTES: (id: string) => `/admin/submissions/${id}/notes`,
      TOGGLE_CHECKLIST: (id: string) => `/admin/submissions/${id}/checklist`,
    },
    COMPANIES: {
      LIST: "/companies",
      TREE: "/companies/tree",
      DETAILS: (id: string) => `/companies/${id}`,
      CREATE: "/companies",
      UPDATE: (id: string) => `/companies/${id}`,
      DELETE: (id: string) => `/companies/${id}`,
    },
    TEMPLATES: {
      LIST: "/pdf-templates",
      DEFAULT: "/pdf-templates/default",
      ACTIVE: "/pdf-templates/active",
      DETAILS: (id: string) => `/pdf-templates/${id}`,
      SAVE: "/pdf-templates",
      PREVIEW: "/pdf-templates/preview",
      SET_DEFAULT: (id: string) => `/pdf-templates/${id}/default`,
      FALLBACK_DEFAULT: "/templates/default",
      FALLBACK_ACTIVE: "/templates/active",
      FALLBACK_SAVE: "/templates",
      FALLBACK_PREVIEW: "/templates/preview",
    },
    VISITS: {
      LIST: "/visits",
      DETAILS: (id: string) => `/visits/${id}`,
    },
    MEDIA: {
      LIST: (visitId: string) => `/visits/${visitId}/media`,
    },
    SHARED: {
      GET: (token: string) => `/public/shared/${token}`,
      VISIT: (id: string) => `/public/visits/${id}`,
    },
    EXPORT: {
      ZIP: (visitId: string) => `/visits/${visitId}/export/zip`,
      PRINT_PDF: (visitId: string) => `/visits/${visitId}/export/print-pdf`,
      REPORT_PDF: (visitId: string) => `/visits/${visitId}/export/report-pdf`,
      PUBLIC_REPORT_PDF: (visitId: string) => `/public/visits/${visitId}/export/report-pdf`,
      SHARED_ZIP: (token: string) => `/public/shared/${token}/export/zip`,
      SHARED_REPORT_PDF: (token: string) => `/public/shared/${token}/export/report-pdf`,
    },
  },
} as const;
