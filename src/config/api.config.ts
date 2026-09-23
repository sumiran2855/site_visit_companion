export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  SUPABASE_URL: (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sstbiqlmaghpjezclafs.supabase.co").replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, ""),
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzdGJpcWxtYWdocGplemNsYWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNjA0MzUsImV4cCI6MjEwNTYzNjQzNX0.-HdAxG2BYO5L_WbPqtYB4Mfw29K1xIJN23Eef84q46Y",
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
    },
    COMPANIES: {
      LIST: "/companies",
      DETAILS: (id: string) => `/companies/${id}`,
    },
    VISITS: {
      LIST: "/visits",
      DETAILS: (id: string) => `/visits/${id}`,
    },
  },
} as const;

