"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AuthController } from "@/controllers/auth.controller";
import { AuthService } from "@/services/auth.service";
import { TokenHelper } from "@/lib/helpers/token.helper";
import type {
  LoginRequestInput,
  LoginResponsePayload,
  SignupRequestInput,
  SignupResponsePayload,
  UserProfile,
  UserRole,
} from "@/types/auth";
import type { ControllerResult } from "@/controllers/auth.controller";

export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  isUser: boolean;
  login: (input: LoginRequestInput) => Promise<ControllerResult<LoginResponsePayload>>;
  signup: (input: SignupRequestInput) => Promise<ControllerResult<SignupResponsePayload>>;
  loginWithGoogle: (redirectTo?: string) => void;
  demoLogin: (role?: UserRole) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  setSession: (token: string, user: UserProfile) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const controller = AuthController.getInstance();

  const refreshUser = useCallback(async () => {
    const storedToken = TokenHelper.getToken();
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    const cachedUser = TokenHelper.getUser();
    if (cachedUser) {
      setUser(cachedUser);
    }

    const result = await controller.handleGetMe();
    if (result.success && result.data) {
      setUser(result.data);
      TokenHelper.setUser(result.data);
    }
    setIsLoading(false);
  }, [controller]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (
    input: LoginRequestInput
  ): Promise<ControllerResult<LoginResponsePayload>> => {
    setIsLoading(true);
    const result = await controller.handleLogin(input);
    if (result.success && result.data) {
      setToken(result.data.token);
      setUser(result.data.user);
      TokenHelper.setToken(result.data.token);
      TokenHelper.setUser(result.data.user);
    }
    setIsLoading(false);
    return result;
  };

  const signup = async (
    input: SignupRequestInput
  ): Promise<ControllerResult<SignupResponsePayload>> => {
    setIsLoading(true);
    const result = await controller.handleSignup(input);
    setIsLoading(false);
    return result;
  };

  const loginWithGoogle = (redirectTo?: string): void => {
    if (typeof window !== "undefined") {
      const url = AuthService.getInstance().getGoogleOAuthUrl(redirectTo);
      window.location.href = url;
    }
  };

  const demoLogin = async (
    targetRole: UserRole = "admin"
  ): Promise<void> => {
    setIsLoading(true);
    const isAdminRole =
      targetRole === "admin" ||
      targetRole === "super_admin" ||
      targetRole === "company_admin";

    const normalizedRole: UserRole = isAdminRole ? "admin" : "user";

    const demoProfile: UserProfile = {
      id: isAdminRole ? "demo-admin-01" : "demo-user-01",
      email: isAdminRole ? "admin@ecpower.com" : "user@ecpower.com",
      firstName: isAdminRole ? "Alex" : "Thomas",
      lastName: isAdminRole ? "Jensen" : "Lindqvist",
      middleName: null,
      requestedCompany: "EC POWER Inc.",
      companyId: "comp-001",
      companyName: "EC POWER Inc.",
      role: normalizedRole,
      approvalStatus: "approved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const demoToken = `demo_jwt_token_${Date.now()}`;
    TokenHelper.setToken(demoToken);
    TokenHelper.setUser(demoProfile);
    setToken(demoToken);
    setUser(demoProfile);
    setIsLoading(false);
  };

  const switchRole = async (targetRole: UserRole): Promise<void> => {
    if (!user) return;
    const normalizedRole: UserRole =
      targetRole === "admin" ||
      targetRole === "super_admin" ||
      targetRole === "company_admin"
        ? "admin"
        : "user";

    const updated: UserProfile = {
      ...user,
      role: normalizedRole,
    };
    TokenHelper.setUser(updated);
    setUser(updated);
  };

  const setSession = (newToken: string, newUser: UserProfile): void => {
    TokenHelper.setToken(newToken);
    TokenHelper.setUser(newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const updateUser = (updates: Partial<UserProfile>): void => {
    setUser((prev) => {
      if (!prev) return null;
      const updated: UserProfile = { ...prev, ...updates };
      TokenHelper.setUser(updated);
      return updated;
    });
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    await controller.handleLogout();
    TokenHelper.clearAuth();
    setUser(null);
    setToken(null);
    setIsLoading(false);
  };

  const rawRole = user?.role;
  const isAdmin =
    rawRole === "admin" ||
    rawRole === "super_admin" ||
    rawRole === "company_admin";
  const isUser = !isAdmin;
  const isSuperAdmin = isAdmin;
  const isCompanyAdmin = isAdmin;

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    isAdmin,
    isSuperAdmin,
    isCompanyAdmin,
    isUser,
    login,
    signup,
    loginWithGoogle,
    demoLogin,
    switchRole,
    setSession,
    updateUser,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
