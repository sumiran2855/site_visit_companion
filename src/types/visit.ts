export type VisitStatus =
  | "draft"
  | "scheduled"
  | "in_progress"
  | "pending_review"
  | "completed"
  | "cancelled";

export type ChecklistItemStatus = "pass" | "fail" | "na" | "pending";

export interface ChecklistItem {
  id: string;
  category: string;
  question: string;
  description?: string;
  status: ChecklistItemStatus;
  notes?: string;
  photos?: string[];
  isRequired: boolean;
}

export interface ChecklistSection {
  id: string;
  title: string;
  description?: string;
  items: ChecklistItem[];
}

export interface VisitTemplate {
  id: string;
  name: string;
  description?: string;
  sections: ChecklistSection[];
  createdAt: string;
  updatedAt: string;
}

export interface Visit {
  id: string;
  title: string;
  companyId: string;
  inspectorId: string;
  status: VisitStatus;
  scheduledDate: string;
  completedDate?: string;
  location?: string;
  summary?: string;
  shareToken?: string;
  sections: ChecklistSection[];
  createdAt: string;
  updatedAt: string;
}

export type CreateVisitInput = Omit<Visit, "id" | "createdAt" | "updatedAt">;
export type UpdateVisitInput = Partial<CreateVisitInput>;

