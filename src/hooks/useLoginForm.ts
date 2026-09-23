import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import { ROUTES } from "@/lib/constants";

export function useLoginForm() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await login({ email: trimmedEmail, password });

      if (!result.success) {
        setError(result.error || "Login failed. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      // Check user approval status
      const approvalStatus = result.data?.user.approvalStatus;
      if (approvalStatus === "pending") {
        router.push(ROUTES.PENDING);
        return;
      }

      // Route to visits dashboard
      router.push(ROUTES.VISITS);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError(null);
    setIsLoading(true);
    try {
      loginWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to initiate Google authentication";
      setError(message);
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
    error,
    handleSubmit,
    handleGoogleLogin,
  };
}

