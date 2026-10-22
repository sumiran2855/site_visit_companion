export type UserRole =
  | "user"
  | "admin"
  | "standard"
  | "company_admin"
  | "super_admin"
  | "inspector"
  | "manager"
  | "client";

export type PrimaryUserRole = "user" | "admin";

export type UserStatus = "active" | "inactive" | "pending";

export type ApprovalStatus = "pending" | "approved" | "rejected";

/**
 * Backend Profile representation (matches IProfile in backend)
 */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  requestedCompany?: string | null;
  companyId: string | null;
  companyName?: string | null;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Frontend UI User representation
 */
export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  companyId?: string | null;
  companyName?: string | null;
  requestedCompany?: string | null;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingAccessRequest {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  requestedCompany: string;
  note?: string;
  createdAt: string;
}

export interface AuthSession {
  user: User | null;
  profile: UserProfile | null;
  token?: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  code?: string;
}

export interface LoginRequestInput {
  email: string;
  password: string;
}

export interface LoginResponsePayload {
  token: string;
  user: UserProfile;
}

export interface SignupRequestInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  requestedCompany: string;
}

export interface SignupResponsePayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  requestedCompany: string;
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Helper to map backend UserProfile to frontend User
 */
export function mapProfileToUser(profile: UserProfile, companyName?: string): User {
  const fullName = [profile.firstName, profile.middleName, profile.lastName]
    .filter(Boolean)
    .join(" ");

  const resolvedCompany = profile.requestedCompany || profile.companyName || companyName || null;

  return {
    id: profile.id,
    name: fullName || profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    middleName: profile.middleName,
    email: profile.email,
    role:
      profile.role === "admin" ||
      profile.role === "super_admin" ||
      profile.role === "company_admin"
        ? "admin"
        : "user",
    status: profile.approvalStatus === "approved" ? "active" : "pending",
    companyId: profile.companyId || null,
    companyName: resolvedCompany,
    requestedCompany: profile.requestedCompany || null,
    createdAt: typeof profile.createdAt === "string" ? profile.createdAt : new Date(profile.createdAt).toISOString(),
    updatedAt: typeof profile.updatedAt === "string" ? profile.updatedAt : new Date(profile.updatedAt).toISOString(),
  };
}
