export type UserRole =
  | "standard"
  | "company_admin"
  | "super_admin"
  | "admin"
  | "inspector"
  | "manager"
  | "client";

export type UserStatus = "active" | "inactive" | "pending";

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
  token?: string;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  code?: string;
}

