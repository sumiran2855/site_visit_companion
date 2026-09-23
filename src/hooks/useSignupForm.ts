import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import { ROUTES } from "@/lib/constants";

export function useSignupForm() {
  const router = useRouter();
  const { signup, loginWithGoogle } = useAuth();

  const [step, setStep] = useState<"account" | "company">("account");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const goToAccountStep = () => {
    setStep("account");
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setStep("company");
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedCompany = company.trim();
    if (!trimmedCompany) {
      setError("Please specify the company or organization you work for.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signup({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleName: middleName.trim() || undefined,
        requestedCompany: trimmedCompany,
      });

      if (!result.success) {
        setError(result.error || "Failed to submit signup request. Please try again.");
        setIsLoading(false);
        return;
      }

      // Navigate to pending screen
      if (typeof window !== "undefined") {
        sessionStorage.setItem("ec_pending_email", email.trim());
        sessionStorage.setItem("ec_pending_company", trimmedCompany);
      }
      router.push(
        `${ROUTES.PENDING}?company=${encodeURIComponent(trimmedCompany)}&email=${encodeURIComponent(email.trim())}`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred during signup.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    setError(null);
    setIsLoading(true);
    try {
      if (typeof window !== "undefined" && company.trim()) {
        sessionStorage.setItem("ec_pending_company", company.trim());
      }
      loginWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to initiate Google sign up";
      setError(message);
      setIsLoading(false);
    }
  };

  return {
    step,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    middleName,
    setMiddleName,
    email,
    setEmail,
    password,
    setPassword,
    company,
    setCompany,
    showPassword,
    toggleShowPassword,
    isLoading,
    error,
    handleAccountSubmit,
    handleFinalSubmit,
    handleGoogleSignup,
    goToAccountStep,
  };
}

