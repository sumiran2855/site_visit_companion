import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/types/auth";

export function useLoginForm() {
  const router = useRouter();
  const { login, loginWithGoogle, demoLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("errors.emailRequired");
      return;
    }

    if (!password) {
      setError("errors.passwordRequired");
      return;
    }

    setIsLoading(true);

    try {
      const result = await login({ email: trimmedEmail, password });

      if (!result.success) {
        setError(result.error || "errors.loginFailed");
        setIsLoading(false);
        return;
      }

      const approvalStatus = result.data?.user.approvalStatus;
      if (approvalStatus === "pending") {
        router.push(ROUTES.PENDING);
        return;
      }

      const role = result.data?.user.role;
      const isAdminRole =
        role === "super_admin" || role === "company_admin" || role === "admin";

      if (!isAdminRole) {
        router.push(ROUTES.HOME);
        return;
      }

      router.push(ROUTES.ADMIN);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "errors.unexpectedError";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("ec_auth_intent", "admin_login");
      }
      loginWithGoogle();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "errors.googleAuthFailed";
      setError(message);
      setIsGoogleLoading(false);
    }
  };

  const handleDemoLogin = async (
    role: UserRole = "admin"
  ) => {
    setError(null);
    setIsLoading(true);
    try {
      await demoLogin(role);
      if (role === "user" || role === "standard") {
        router.push(ROUTES.HOME);
      } else {
        router.push(ROUTES.ADMIN);
      }
    } catch {
      setError("errors.demoLoginFailed");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    isLoading,
    isGoogleLoading,
    error,
    handleSubmit,
    handleGoogleLogin,
    handleDemoLogin,
  };
}
