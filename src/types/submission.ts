export type SubmissionStatus =
  | 'all'
  | 'new'
  | 'in_review'
  | 'waiting_for_customer'
  | 'approved'
  | 'draft';

export type AreaStatus = 'ok' | 'more_requested' | 'not_reviewed';

export interface SubmissionMedia {
  id: string;
  type: 'photo' | 'video';
  title: string;
  url: string;
  thumbnailUrl?: string;
  fieldId: string;
  takenAt: string;
  resolution?: string;
  fileSize?: string;
  duration?: string; // e.g. "0:45" for video
  notes?: string;
}

export interface SubmissionArea {
  id: string;
  name: string;
  status: AreaStatus;
  requestedNote?: string;
  media: SubmissionMedia[];
  specs: Record<string, string>;
  customerNote?: string;
  rawFields?: Record<string, any>;
}

export interface ApprovalChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface CustomerRequest {
  id: string;
  areaId: string;
  areaName: string;
  text: string;
  createdAt: string;
}

export interface SiteSubmission {
  id: string;
  siteName: string;
  location: {
    city: string;
    state: string;
    country: string;
    address?: string;
  };
  customer: string;
  customerId?: string;
  sentBy: string;
  sentAt: string; // ISO string
  formattedDate: string; // e.g. "Oct 21"
  status: 'new' | 'in_review' | 'waiting_for_customer' | 'approved' | 'draft';
  reviewer: string | null;
  mediaCount: {
    photos: number;
    videos: number;
  };
  areas: SubmissionArea[];
  approvalChecklist: ApprovalChecklistItem[];
  customerRequests: CustomerRequest[];
  internalNotes: string;
  rejectionReason?: string;
  closedAt?: string;
  rawSections?: any[];
  checklistValues?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionsFilterState {
  status: SubmissionStatus;
  search: string;
  customer: string;
  country: string;
}

