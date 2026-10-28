import { API_CONFIG } from "@/config/api.config";
import { ROUTES } from "@/lib/constants";
import { HttpClient } from "@/lib/api/httpClient";
import { TokenHelper } from "@/lib/helpers/token.helper";
import type {
  ApprovalStatus,
  LoginRequestInput,
  LoginResponsePayload,
  SignupRequestInput,
  SignupResponsePayload,
  UserProfile,
  UserRole,
} from "@/types/auth";

export class AuthService {
  private static instance: AuthService | null = null;
  private readonly http: HttpClient;

  private constructor(http?: HttpClient) {
    this.http = http ?? HttpClient.getInstance();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Generates the Supabase Google OAuth authorization URL
   */
  public getGoogleOAuthUrl(redirectTo?: string): string {
    const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const redirectUri = redirectTo || `${fallbackOrigin}${ROUTES.AUTH_CALLBACK}`;
    return `${API_CONFIG.SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}`;
  }

  /**
   * Exchanges an authorization code for an access token session with Supabase
   */
  public async exchangeOAuthCode(code: string): Promise<{ access_token: string; refresh_token?: string }> {
    const url = `${API_CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=authorization_code`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: API_CONFIG.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ auth_code: code }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error_description || errJson.msg || "Failed to exchange OAuth code");
    }

    return response.json();
  }

  /**
   * Submit login credentials to backend (POST /api/auth/login)
   */
  public async login(credentials: LoginRequestInput): Promise<LoginResponsePayload> {
    const response = await this.http.post<LoginResponsePayload>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      credentials,
      { requiresAuth: false }
    );

    if (!response.data) {
      throw new Error("No data returned from login API");
    }

    return response.data;
  }

  /**
   * Submit access/signup request to backend (POST /api/auth/signup)
   */
  public async signup(input: SignupRequestInput): Promise<SignupResponsePayload> {
    const response = await this.http.post<SignupResponsePayload>(
      API_CONFIG.ENDPOINTS.AUTH.SIGNUP,
      input,
      { requiresAuth: false }
    );

    if (!response.data) {
      throw new Error("No data returned from signup API");
    }

    return response.data;
  }

  /**
   * Check account approval status by email or company (GET /api/auth/status)
   */
  public async checkStatus(email?: string, company?: string): Promise<{
    email: string;
    approvalStatus: "pending" | "approved" | "rejected" | "not_found";
    requestedCompany?: string | null;
  }> {
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    if (company) params.set("company", company);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await this.http.get<{
      email: string;
      approvalStatus: "pending" | "approved" | "rejected" | "not_found";
      requestedCompany?: string | null;
    }>(`${API_CONFIG.ENDPOINTS.AUTH.STATUS}${queryString}`, {
      requiresAuth: false,
    });

    if (!response.data) {
      throw new Error("No status information returned");
    }

    return response.data;
  }

  /**
   * Resolves a user profile from local storage cache or decodes the Supabase JWT
   */
  public resolveProfileFromTokenOrStorage(token?: string): UserProfile | null {
    const effectiveToken = token || TokenHelper.getToken();
    if (!effectiveToken) return TokenHelper.getUser();

    const payload = TokenHelper.decodeJwt<Record<string, unknown>>(effectiveToken);
    if (!payload) return TokenHelper.getUser();

    const meta = (payload.user_metadata as Record<string, unknown>) || {};
    const appMeta = (payload.app_metadata as Record<string, unknown>) || {};
    const email = String(payload.email || meta.email || "");
    const fullName = String(meta.full_name || meta.name || "");
    const firstName = String(meta.first_name || meta.given_name || (fullName ? fullName.split(" ")[0] : "Admin"));
    const lastName = String(
      meta.last_name ||
        meta.family_name ||
        (fullName && fullName.split(" ").length > 1 ? fullName.split(" ").slice(1).join(" ") : "User")
    );

    // 1. Check if user already exists in members list
    if (typeof window !== "undefined" && window.localStorage && email) {
      try {
        const cachedMembers = window.localStorage.getItem("ecpower_cached_members");
        if (cachedMembers) {
          const list = JSON.parse(cachedMembers) as Array<Record<string, unknown>>;
          const found = list.find(
            (m) => typeof m.email === "string" && m.email.trim().toLowerCase() === email.trim().toLowerCase()
          );
          if (found) {
            const role =
              found.role === "admin" || found.role === "super_admin" || found.role === "company_admin"
                ? "admin"
                : "user";
            return {
              id: String(found.id || payload.sub || `usr-${Date.now()}`),
              email: String(found.email || email),
              firstName: String(found.firstName || firstName),
              lastName: String(found.lastName || lastName),
              middleName: typeof found.middleName === "string" ? found.middleName : null,
              companyId: typeof found.companyId === "string" ? found.companyId : null,
              companyName: typeof found.companyName === "string" ? found.companyName : "EC POWER Inc.",
              requestedCompany: typeof found.requestedCompany === "string" ? found.requestedCompany : null,
              role,
              approvalStatus:
                found.status === "active"
                  ? "approved"
                  : found.approvalStatus === "approved" || found.approvalStatus === "rejected"
                  ? (found.approvalStatus as ApprovalStatus)
                  : "approved",
              createdAt: typeof found.createdAt === "string" ? found.createdAt : new Date().toISOString(),
              updatedAt: typeof found.updatedAt === "string" ? found.updatedAt : new Date().toISOString(),
            };
          }
        }
      } catch (e) {
        console.warn("Failed reading cached members", e);
      }
    }

    // 2. Check if auth intent was admin login or if user has admin claims or email domain
    const isExplicitAdminIntent =
      typeof window !== "undefined" && window.sessionStorage?.getItem("ec_auth_intent") === "admin_login";
    const isAdminEmail = email.toLowerCase().includes("admin") || email.toLowerCase().endsWith("@ecpower.com");
    const isAdminClaim =
      appMeta.role === "admin" ||
      appMeta.role === "super_admin" ||
      meta.role === "admin" ||
      meta.role === "super_admin";

    const resolvedRole: UserRole = isExplicitAdminIntent || isAdminEmail || isAdminClaim ? "admin" : "user";
    const approvalStatus: ApprovalStatus = resolvedRole === "admin" ? "approved" : "pending";

    const profile: UserProfile = {
      id: typeof payload.sub === "string" ? payload.sub : `usr-${Date.now()}`,
      email,
      firstName,
      lastName,
      middleName: null,
      companyId: "comp-001",
      companyName: "EC POWER Inc.",
      requestedCompany: "EC POWER Inc.",
      role: resolvedRole,
      approvalStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If resolved as admin, also sync to members cache so the admin user management table is immediately aware
    if (typeof window !== "undefined" && window.localStorage && profile.role === "admin") {
      try {
        const raw = window.localStorage.getItem("ecpower_cached_members");
        const list = (raw ? JSON.parse(raw) : []) as Array<Record<string, unknown>>;
        if (
          !list.some(
            (m) => typeof m.email === "string" && m.email.trim().toLowerCase() === email.trim().toLowerCase()
          )
        ) {
          list.unshift({
            id: profile.id,
            name: `${firstName} ${lastName}`.trim(),
            firstName,
            lastName,
            email,
            role: "admin",
            status: "active",
            companyId: "comp-001",
            companyName: "EC POWER Inc.",
            requestedCompany: "EC POWER Inc.",
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          });
          window.localStorage.setItem("ecpower_cached_members", JSON.stringify(list));
        }
      } catch {}
    }

    return profile;
  }

  /**
   * Fetch current authenticated user's profile (GET /api/auth/me) with fallback resolution
   */
  public async me(token?: string): Promise<UserProfile> {
    try {
      const response = await this.http.get<UserProfile>(
        API_CONFIG.ENDPOINTS.AUTH.ME,
        { requiresAuth: true }
      );

      if (response.data) {
        return response.data;
      }
    } catch (err: unknown) {
      const fallback = this.resolveProfileFromTokenOrStorage(token);
      if (fallback) {
        return fallback;
      }
      throw err;
    }

    const fallback = this.resolveProfileFromTokenOrStorage(token);
    if (fallback) {
      return fallback;
    }

    throw new Error("No user profile returned from /me API");
  }

  /**
   * Authenticate with backend using Google OAuth token
   */
  public async googleLogin(token: string): Promise<LoginResponsePayload> {
    try {
      const response = await this.http.post<LoginResponsePayload>(
        API_CONFIG.ENDPOINTS.AUTH.GOOGLE,
        { token },
        { requiresAuth: false }
      );
      if (response.data) {
        return response.data;
      }
    } catch {}

    const profile = await this.me(token);
    return { token, user: profile };
  }

  /**
   * Update profile information (PATCH /api/auth/profile)
   */
  public async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const response = await this.http.patch<UserProfile>(
      API_CONFIG.ENDPOINTS.AUTH.PROFILE,
      updates,
      { requiresAuth: true }
    );

    if (!response.data) {
      throw new Error("Failed to update profile");
    }

    return response.data;
  }

  /**
   * Revoke session on backend (POST /api/auth/logout)
   */
  public async logout(): Promise<void> {
    try {
      await this.http.post<void>(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {}, { requiresAuth: true });
    } catch (err) {
      // Even if network or token is expired, client clears state
      console.warn("Backend logout notification failed", err);
    }
  }
}

