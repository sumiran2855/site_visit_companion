export interface Company {
  id: string;
  name: string;
  registrationNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  country?: string;
  isActive: boolean;
  parentId?: string | null;
  allowedEmailDomains?: string[];
  memberCount?: number;
  visitCount?: number;
  children?: Company[];
  createdAt: string;
  updatedAt: string;
}

export type CreateCompanyInput = Omit<Company, "id" | "createdAt" | "updatedAt">;
export type UpdateCompanyInput = Partial<CreateCompanyInput>;

