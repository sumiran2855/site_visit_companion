export type UserRole =
  | "standard"
  | "company_admin"
  | "super_admin"
  | "admin"
  | "inspector"
  | "manager"
  | "client";

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
  companyId: string | null;
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
  email: string;
  role: UserRole;
  status: UserStatus;
  companyId?: string;
  companyName?: string;
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

  return {
    id: profile.id,
    name: fullName || profile.email,
    email: profile.email,
    role: profile.role,
    status: profile.approvalStatus === "approved" ? "active" : "pending",
    companyId: profile.companyId || undefined,
    companyName: companyName,
    createdAt: typeof profile.createdAt === "string" ? profile.createdAt : new Date(profile.createdAt).toISOString(),
    updatedAt: typeof profile.updatedAt === "string" ? profile.updatedAt : new Date(profile.updatedAt).toISOString(),
  };
}
