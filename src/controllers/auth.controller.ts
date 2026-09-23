import { AuthService } from "@/services/auth.service";
import { TokenHelper } from "@/lib/helpers/token.helper";
import { ApiError } from "@/types/api";
import type {
  LoginRequestInput,
  LoginResponsePayload,
  SignupRequestInput,
  SignupResponsePayload,
  UserProfile,
} from "@/types/auth";

export interface ControllerResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export class AuthController {
  private static instance: AuthController | null = null;
  private readonly authService: AuthService;

  private constructor(authService?: AuthService) {
    this.authService = authService ?? AuthService.getInstance();
  }

  public static getInstance(): AuthController {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }
    return AuthController.instance;
  }

  /**
   * Initiate Google OAuth flow by redirecting the browser to Supabase Google OAuth provider
   */
  public initiateGoogleOAuth(redirectTo?: string): void {
    if (typeof window === "undefined") return;
    const url = this.authService.getGoogleOAuthUrl(redirectTo);
    window.location.assign(url);
  }

  /**
   * Handle OAuth return: persist access token and fetch user profile via /api/auth/me
   */
  public async handleOAuthCallback(token: string): Promise<ControllerResult<UserProfile>> {
    try {
      TokenHelper.setToken(token);
      const profile = await this.authService.me();
      TokenHelper.setUser(profile);

      return {
        success: true,
        data: profile,
      };
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "OAuth authentication failed";
      const statusCode = err instanceof ApiError ? err.statusCode : 401;

      return {
        success: false,
        error: message,
        statusCode,
      };
    }
  }

  /**
   * Exchange OAuth code for token and authenticate
   */
  public async handleOAuthCode(code: string): Promise<ControllerResult<UserProfile>> {
    try {
      const { access_token } = await this.authService.exchangeOAuthCode(code);
      return this.handleOAuthCallback(access_token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to exchange authorization code";
      return {
        success: false,
        error: message,
        statusCode: 400,
      };
    }
  }

  /**
   * Handle user login: calls service, persists token & user on success
   */
  public async handleLogin(input: LoginRequestInput): Promise<ControllerResult<LoginResponsePayload>> {
    try {
      const result = await this.authService.login(input);
      // Persist auth state
      TokenHelper.setToken(result.token);
      TokenHelper.setUser(result.user);

      return {
        success: true,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "An error occurred during login";
      const statusCode = err instanceof ApiError ? err.statusCode : 500;

      return {
        success: false,
        error: message,
        statusCode,
      };
    }
  }

  /**
   * Handle user signup access request
   */
  public async handleSignup(input: SignupRequestInput): Promise<ControllerResult<SignupResponsePayload>> {
    try {
      const result = await this.authService.signup(input);
      return {
        success: true,
        data: result,
      };
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "An error occurred during signup request";
      const statusCode = err instanceof ApiError ? err.statusCode : 500;

      return {
        success: false,
        error: message,
        statusCode,
      };
    }
  }

  /**
   * Handle session verification and user profile fetching (/me)
   */
  public async handleGetMe(): Promise<ControllerResult<UserProfile>> {
    const token = TokenHelper.getToken();
    if (!token) {
      return {
        success: false,
        error: "No active session token found",
        statusCode: 401,
      };
    }

    try {
      const profile = await this.authService.me();
      TokenHelper.setUser(profile);

      return {
        success: true,
        data: profile,
      };
    } catch (err: unknown) {
      // If token is invalid or user rejected, clear storage
      TokenHelper.clearAuth();
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Session expired or invalid";
      const statusCode = err instanceof ApiError ? err.statusCode : 401;

      return {
        success: false,
        error: message,
        statusCode,
      };
    }
  }

  /**
   * Check status of an account (by active session or by email)
   */
  public async handleCheckAccountStatus(
    email?: string,
    company?: string
  ): Promise<{
    isApproved: boolean;
    status: "pending" | "approved" | "rejected" | "not_found";
    hasActiveSession: boolean;
    email?: string;
    company?: string | null;
    error?: string;
  }> {
    const token = TokenHelper.getToken();
    if (token) {
      const meResult = await this.handleGetMe();
      if (meResult.success && meResult.data) {
        return {
          isApproved: meResult.data.approvalStatus === "approved",
          status: meResult.data.approvalStatus,
          hasActiveSession: true,
          email: meResult.data.email,
        };
      }
    }

    const targetEmail =
      email?.trim() ||
      (typeof window !== "undefined"
        ? localStorage.getItem("ec_pending_email") || sessionStorage.getItem("ec_pending_email")
        : null) ||
      TokenHelper.getUser()?.email;

    const targetCompany =
      company?.trim() ||
      (typeof window !== "undefined"
        ? localStorage.getItem("ec_pending_company") || sessionStorage.getItem("ec_pending_company")
        : null);

    try {
      const statusData = await this.authService.checkStatus(targetEmail || undefined, targetCompany || undefined);
      if (typeof window !== "undefined" && statusData.email) {
        localStorage.setItem("ec_pending_email", statusData.email);
      }
      return {
        isApproved: statusData.approvalStatus === "approved",
        status: statusData.approvalStatus,
        hasActiveSession: false,
        email: statusData.email,
        company: statusData.requestedCompany,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to verify account status";
      return {
        isApproved: false,
        status: "pending",
        hasActiveSession: false,
        error: message,
      };
    }
  }

  /**
   * Handle user logout
   */
  public async handleLogout(): Promise<void> {
    try {
      await this.authService.logout();
    } finally {
      TokenHelper.clearAuth();
    }
  }

  /**
   * Get cached user profile from client storage
   */
  public getStoredUser(): UserProfile | null {
    return TokenHelper.getUser();
  }

  /**
   * Check if token is present in storage
   */
  public hasStoredToken(): boolean {
    return !!TokenHelper.getToken();
  }
}

