import { API_CONFIG } from "@/config/api.config";
import { ROUTES } from "@/lib/constants";
import { HttpClient } from "@/lib/api/httpClient";
import type {
  LoginRequestInput,
  LoginResponsePayload,
  SignupRequestInput,
  SignupResponsePayload,
  UserProfile,
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
   * Fetch current authenticated user's profile (GET /api/auth/me)
   */
  public async me(): Promise<UserProfile> {
    const response = await this.http.get<UserProfile>(
      API_CONFIG.ENDPOINTS.AUTH.ME,
      { requiresAuth: true }
    );

    if (!response.data) {
      throw new Error("No user profile returned from /me API");
    }

    return response.data;
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

