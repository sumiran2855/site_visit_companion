import { API_CONFIG } from "@/config/api.config";
import type { UserProfile } from "@/types/auth";

export class TokenHelper {
  private static isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  }

  public static getToken(): string | null {
    if (!this.isBrowser()) return null;
    try {
      return localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    } catch {
      return null;
    }
  }

  public static setToken(token: string): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (err) {
      console.error("Failed to persist auth token", err);
    }
  }

  public static removeToken(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    } catch (err) {
      console.error("Failed to remove auth token", err);
    }
  }

  public static getRefreshToken(): string | null {
    if (!this.isBrowser()) return null;
    try {
      const direct = localStorage.getItem(API_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
      if (direct) return direct;

      // Fallback: check standard Supabase auth storage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("sb-") || key.includes("supabase")) && key.endsWith("-auth-token")) {
          const val = localStorage.getItem(key);
          if (val) {
            try {
              const parsed = JSON.parse(val);
              if (parsed?.refresh_token) return String(parsed.refresh_token);
            } catch {}
          }
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  public static setRefreshToken(token: string): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (err) {
      console.error("Failed to persist refresh token", err);
    }
  }

  public static removeRefreshToken(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem(API_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    } catch (err) {
      console.error("Failed to remove refresh token", err);
    }
  }

  public static getUser(): UserProfile | null {
    if (!this.isBrowser()) return null;
    try {
      const raw = localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_USER);
      if (!raw) return null;
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  }

  public static setUser(user: UserProfile): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    } catch (err) {
      console.error("Failed to persist user profile", err);
    }
  }

  public static removeUser(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem(API_CONFIG.STORAGE_KEYS.AUTH_USER);
    } catch (err) {
      console.error("Failed to remove user profile", err);
    }
  }

  public static clearAuth(): void {
    this.removeToken();
    this.removeRefreshToken();
    this.removeUser();
  }

  public static isTokenExpired(token?: string | null): boolean {
    const t = token ?? this.getToken();
    if (!t) return true;
    if (t.startsWith("demo_jwt_token_") || t.startsWith("admin_session_")) {
      return false;
    }
    const payload = this.decodeJwt<{ exp?: number }>(t);
    if (!payload || !payload.exp) return false;
    // Considered expired if within 60 seconds of expiration
    return Date.now() >= payload.exp * 1000 - 60000;
  }

  public static decodeJwt<T = Record<string, unknown>>(token: string): T | null {
    try {
      const base64Url = token.split(".")[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload) as T;
    } catch {
      return null;
    }
  }
}

