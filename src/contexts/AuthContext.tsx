"use client";

import React, { createContext, useCallback, useEffect, useState } from "react";
import { AuthController } from "@/controllers/auth.controller";
import { TokenHelper } from "@/lib/helpers/token.helper";
import type {
  LoginRequestInput,
  LoginResponsePayload,
  SignupRequestInput,
  SignupResponsePayload,
  UserProfile,
} from "@/types/auth";
import type { ControllerResult } from "@/controllers/auth.controller";

export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginRequestInput) => Promise<ControllerResult<LoginResponsePayload>>;
  signup: (input: SignupRequestInput) => Promise<ControllerResult<SignupResponsePayload>>;
  loginWithGoogle: (redirectTo?: string) => void;
  setSession: (token: string, user: UserProfile) => void;
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
    const result = await controller.handleGetMe();
    if (result.success && result.data) {
      setUser(result.data);
    } else {
      setUser(null);
      setToken(null);
    }
    setIsLoading(false);
  }, [controller]);

  useEffect(() => {
    // Initial session hydration
    refreshUser();
  }, [refreshUser]);

  const login = async (input: LoginRequestInput): Promise<ControllerResult<LoginResponsePayload>> => {
    setIsLoading(true);
    const result = await controller.handleLogin(input);
    if (result.success && result.data) {
      setUser(result.data.user);
      setToken(result.data.token);
    }
    setIsLoading(false);
    return result;
  };

  const signup = async (input: SignupRequestInput): Promise<ControllerResult<SignupResponsePayload>> => {
    return controller.handleSignup(input);
  };

  const loginWithGoogle = (redirectTo?: string): void => {
    controller.initiateGoogleOAuth(redirectTo);
  };

  const setSession = (newToken: string, newUser: UserProfile): void => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    await controller.handleLogout();
    setUser(null);
    setToken(null);
    setIsLoading(false);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    signup,
    loginWithGoogle,
    setSession,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

