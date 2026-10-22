export interface PendingAccessRequest {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  requestedCompany: string;
  note?: string;
  status?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

export interface Company {
  id: string;
  name: string;
  parentId?: string | null;
  allowedEmailDomains?: string[];
  contactEmail?: string;
  contactPhone?: string;
  registrationNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  memberCount?: number;
  visitCount?: number;
  isActive: boolean;
  children?: Company[];
  createdAt: string;
  updatedAt: string;
}

export type CreateCompanyInput = {
  name: string;
  parentId?: string | null;
  allowedEmailDomains?: string[];
  contactEmail?: string;
  contactPhone?: string;
  registrationNumber?: string;
  address?: string;
  city?: string;
  country?: string;
};

export type UpdateCompanyInput = Partial<CreateCompanyInput> & {
  isActive?: boolean;
};

export type TemplateElementType =
  | 'cover_header'
  | 'heading'
  | 'text_block'
  | 'field'
  | 'photo_grid'
  | 'divider'
  | 'logo'
  | 'autoflow_checklist';

export interface TemplateElement {
  id: string;
  type: TemplateElementType;
  label?: string;
  content?: string;
  placeholder?: string;
  width?: 'full' | 'half' | 'third';
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  align?: 'left' | 'center' | 'right';
  columns?: 1 | 2 | 3 | 4;
  showBorder?: boolean;
}

export interface TemplatePage {
  id: string;
  title: string;
  pageNumber: number;
  elements: TemplateElement[];
}

export interface PDFTemplate {
  id: string;
  name: string;
  version: string;
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margins: 'normal' | 'compact' | 'wide';
  pages: TemplatePage[];
  isDefault?: boolean;
  updatedAt: string;
}

export interface AdminDashboardMetrics {
  pendingRequestsCount: number;
  totalMembersCount: number;
  totalCompaniesCount: number;
  totalVisitsCount: number;
  retentionWarningCount: number;
}

export interface ExpiringVisitItem {
  id: string;
  siteName: string;
  companyId?: string | null;
  companyName?: string | null;
  createdAt: string;
  ageInDays: number;
  daysRemaining: number;
  isExpired: boolean;
  status: string;
  mediaCount?: number;
}

export interface RetentionCleanupResult {
  purgedVisits: number;
  deletedFilesCount: number;
  freedSpaceMB: number;
  timestamp: string;
}

export interface RetentionStorageMetrics {
  totalVisits: number;
  expiringIn30Days: number;
  pastRetentionDays: number;
  activeVisits: number;
  retentionPeriodDays: number;
  totalMediaCount: number;
  totalPhotosCount: number;
  totalVideosCount: number;
  estimatedStorageMB: number;
  oldestVisitDate: string | null;
  newestVisitDate: string | null;
  expiringVisits: ExpiringVisitItem[];
  lastCleanup?: RetentionCleanupResult | null;
}

