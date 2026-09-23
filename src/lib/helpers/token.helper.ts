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
    this.removeUser();
  }
}

