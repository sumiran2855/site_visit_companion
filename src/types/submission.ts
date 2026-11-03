export type SubmissionStatus =
  | 'all'
  | 'completed'
  | 'in_progress'
  | 'draft';

export function normalizeSubmissionStatus(
  status: unknown
): 'completed' | 'in_progress' | 'draft' {
  if (typeof status !== 'string') return 'draft';
  const clean = status.toLowerCase().trim();
  if (clean === 'completed' || clean === 'approved') return 'completed';
  if (clean === 'in_progress' || clean === 'in_review') return 'in_progress';
  return 'draft';
}

export type AreaStatus = 'ok' | 'more_requested' | 'not_reviewed';

export interface CustomerRequest {
  id: string;
  areaId: string;
  areaName: string;
  text: string;
  createdAt: string;
  resolved?: boolean;
  resolvedAt?: string;
  technicianResponse?: string;
  responsePhotos?: Array<{
    id: string;
    url: string;
    fileName?: string;
    createdAt?: string;
    fieldId?: string;
    remoteUrl?: string;
    uri?: string;
  }>;
}

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
  media: SubmissionMedia[];
  specs: Record<string, string>;
  customerNote?: string;
  requestedNote?: string;
  rawFields?: Record<string, any>;
  status?: AreaStatus;
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
  status: 'completed' | 'in_progress' | 'draft';
  mediaCount: {
    photos: number;
    videos: number;
  };
  areas: SubmissionArea[];
  customerRequests: CustomerRequest[];
  internalNotes: string;
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

