import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AuthController } from "@/controllers/auth.controller";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";

export type AuthCallbackStatus =
  | "loading"
  | "verifying"
  | "requires_company"
  | "submitting_company"
  | "success"
  | "pending"
  | "error";

export interface GoogleUserInfo {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl?: string;
}

interface UseAuthCallbackReturn {
  status: AuthCallbackStatus;
  error: string | null;
  googleUser: GoogleUserInfo | null;
  company: string;
  setCompany: (val: string) => void;
  handleCompanySubmit: (e: React.FormEvent) => Promise<void>;
  retry: () => void;
  goToLogin: () => void;
  goToPending: () => void;
}

function parseJwt(token: string): Record<string, unknown> | null {
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
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function useAuthCallback(): UseAuthCallbackReturn {
  const router = useRouter();
  const { setSession } = useAuth();
  const [status, setStatus] = useState<AuthCallbackStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<GoogleUserInfo | null>(null);
  const [company, setCompany] = useState<string>("");
  const controller = AuthController.getInstance();
  const processedRef = useRef(false);

  const parseUrlParams = (): { accessToken?: string; code?: string; error?: string; errorDesc?: string } => {
    if (typeof window === "undefined") return {};

    const hash = window.location.hash.substring(1);
    const search = window.location.search.substring(1);

    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(search);

    const accessToken = hashParams.get("access_token") || searchParams.get("access_token") || undefined;
    const code = searchParams.get("code") || hashParams.get("code") || undefined;
    const errorParam = hashParams.get("error") || searchParams.get("error") || undefined;
    const errorDesc =
      hashParams.get("error_description") ||
      searchParams.get("error_description") ||
      undefined;

    return { accessToken, code, error: errorParam, errorDesc };
  };

  const registerWithCompany = async (userInfo: GoogleUserInfo, companyName: string) => {
    setStatus("submitting_company");
    setError(null);

    const generatedPassword = `GAuth_${Math.random().toString(36).slice(2)}!A9z`;

    try {
      const signupResult = await controller.handleSignup({
        email: userInfo.email,
        password: generatedPassword,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        requestedCompany: companyName,
      });

      if (!signupResult.success) {
        setStatus("requires_company");
        setError(signupResult.error || "Failed to submit signup request. Please try again.");
        return;
      }

      setStatus("pending");
      setTimeout(() => {
        router.replace(`${ROUTES.PENDING}?company=${encodeURIComponent(companyName)}`);
      }, 600);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup registration failed";
      setStatus("requires_company");
      setError(message);
    }
  };

  const processOAuth = useCallback(async () => {
    const { accessToken, code, error: urlError, errorDesc } = parseUrlParams();

    if (urlError || errorDesc) {
      setStatus("error");
      setError(decodeURIComponent(errorDesc || urlError || "Google authentication was cancelled or rejected"));
      return;
    }

    if (!accessToken && !code) {
      // Check if we already have an active session
      const storedUser = controller.getStoredUser();
      const hasToken = controller.hasStoredToken();
      if (hasToken && storedUser) {
        setStatus("success");
        if (storedUser.approvalStatus === "pending") {
          router.replace(ROUTES.PENDING);
        } else {
          router.replace(ROUTES.VISITS);
        }
        return;
      }

      setStatus("error");
      setError("No authentication credentials found in OAuth response");
      return;
    }

    setStatus("verifying");
    setError(null);

    try {
      let result;
      let effectiveToken = accessToken;

      if (accessToken) {
        result = await controller.handleOAuthCallback(accessToken);
      } else if (code) {
        result = await controller.handleOAuthCode(code);
      }

      if (!result) {
        throw new Error("Unable to complete authentication");
      }

      if (result.success && result.data) {
        if (effectiveToken) {
          setSession(effectiveToken, result.data);
        }
        setStatus("success");

        if (result.data.approvalStatus === "pending") {
          setTimeout(() => router.replace(ROUTES.PENDING), 500);
        } else {
          setTimeout(() => router.replace(ROUTES.VISITS), 500);
        }
        return;
      }

      // Handle specific error statuses
      const errMsg = result.error || "";
      if (errMsg.toLowerCase().includes("not been approved") || errMsg.toLowerCase().includes("pending")) {
        setStatus("pending");
        setTimeout(() => router.replace(ROUTES.PENDING), 800);
        return;
      }

      // If user profile does not exist, prompt for company to complete account creation
      if (errMsg.toLowerCase().includes("profile does not exist") || errMsg.toLowerCase().includes("not found")) {
        const payload = effectiveToken ? parseJwt(effectiveToken) : null;
        const meta = (payload?.user_metadata as Record<string, unknown>) || {};
        const email = String(payload?.email || meta.email || "");
        const fullName = String(meta.full_name || meta.name || "");
        const firstName = String(meta.first_name || meta.given_name || (fullName ? fullName.split(" ")[0] : "User"));
        const lastName = String(
          meta.last_name ||
            meta.family_name ||
            (fullName && fullName.split(" ").length > 1 ? fullName.split(" ").slice(1).join(" ") : "Account")
        );
        const avatarUrl = meta.avatar_url ? String(meta.avatar_url) : meta.picture ? String(meta.picture) : undefined;

        const extractedUser: GoogleUserInfo = {
          email,
          firstName,
          lastName,
          fullName: fullName || `${firstName} ${lastName}`.trim(),
          avatarUrl,
        };

        setGoogleUser(extractedUser);

        // Check if user pre-specified company in signup form prior to clicking Google
        const prefilledCompany =
          typeof window !== "undefined" ? sessionStorage.getItem("ec_pending_company") : null;
        if (prefilledCompany) {
          sessionStorage.removeItem("ec_pending_company");
          await registerWithCompany(extractedUser, prefilledCompany);
          return;
        }

        setStatus("requires_company");
        return;
      }

      setStatus("error");
      setError(errMsg || "Verification failed. Please try signing in again.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setStatus("error");
      setError(message);
    }
  }, [controller, router, setSession]);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;
    processOAuth();
  }, [processOAuth]);

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = company.trim();
    if (!trimmed) {
      setError("Please specify your company or contractor organization.");
      return;
    }

    if (!googleUser) {
      setError("Missing Google account details. Please sign in again.");
      return;
    }

    await registerWithCompany(googleUser, trimmed);
  };

  const retry = () => {
    processedRef.current = false;
    setStatus("loading");
    setError(null);
    processOAuth();
  };

  const goToLogin = () => {
    router.replace(ROUTES.AUTH);
  };

  const goToPending = () => {
    router.replace(ROUTES.PENDING);
  };

  return {
    status,
    error,
    googleUser,
    company,
    setCompany,
    handleCompanySubmit,
    retry,
    goToLogin,
    goToPending,
  };
}
