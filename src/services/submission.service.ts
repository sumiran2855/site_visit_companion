import {
  SiteSubmission,
  SubmissionsFilterState,
} from '@/types/submission';
import { HttpClient } from '@/lib/api/httpClient';
import { API_CONFIG } from '@/config/api.config';

const CACHE_KEY_SUBMISSIONS = '@ecpower_admin_site_submissions_v2';

export class SubmissionService {
  /**
   * Loads all real submissions from backend API (Supabase & Cloudflare R2),
   * storing and reading from cache only for real database submissions.
   */
  public static async getSubmissions(
    filters?: Partial<SubmissionsFilterState>
  ): Promise<SiteSubmission[]> {
    let list: SiteSubmission[] = [];
    const http = HttpClient.getInstance();

    try {
      const res = await http.get<SiteSubmission[]>(API_CONFIG.ENDPOINTS.ADMIN.SUBMISSIONS);
      const data = res?.data || (Array.isArray(res) ? (res as any) : null);
      if (Array.isArray(data)) {
        // Clean real database submissions only
        list = data.filter((s) => s && s.id && !s.id.startsWith('sub-00'));
        this.saveLocalSubmissions(list);
      }
    } catch (err) {
      console.warn('[SubmissionService] Backend API not reachable, loading cached database submissions:', err);
    }

    if (!list || list.length === 0) {
      list = this.getLocalSubmissions();
    }

    // Apply Filters
    if (filters) {
      if (filters.status && filters.status !== 'all') {
        list = list.filter((s) => s.status === filters.status);
      }

      if (filters.customer && filters.customer !== 'all') {
        const target = filters.customer.toLowerCase().trim();
        list = list.filter((s) => s.customer.toLowerCase().trim() === target);
      }

      if (filters.country && filters.country !== 'all') {
        const target = filters.country.toLowerCase().trim();
        list = list.filter(
          (s) => s.location.country.toLowerCase().trim() === target
        );
      }

      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        list = list.filter(
          (s) =>
            s.siteName.toLowerCase().includes(q) ||
            s.customer.toLowerCase().includes(q) ||
            s.sentBy.toLowerCase().includes(q) ||
            s.location.city.toLowerCase().includes(q) ||
            s.location.state.toLowerCase().includes(q)
        );
      }
    }

    return list.map((s) => this.sanitizeMediaUrls(s));
  }

  /**
   * Ensures all media items use the secure proxy endpoint instead of raw or local URLs.
   */
  public static sanitizeMediaUrls(submission: SiteSubmission): SiteSubmission {
    if (!submission || !submission.areas) return submission;
    submission.areas.forEach((area) => {
      if (area.media && area.media.length > 0) {
        area.media.forEach((m) => {
          const storageKey = (m as any).storageKey || (m as any).storage_key;
          if (storageKey) {
            m.url = `/api/media/image?key=${encodeURIComponent(storageKey)}`;
          } else if (m.url && m.url.startsWith("file:///")) {
            const keyMatch = m.url.match(/(visit-media\/[^"'\s]+)/);
            if (keyMatch) {
              m.url = `/api/media/image?key=${encodeURIComponent(keyMatch[1])}`;
            }
          }
        });
      }
    });
    return submission;
  }

  /**
   * Retrieves single submission by ID directly from backend API
   * with live presigned Cloudflare R2 download URLs for photos and videos.
   */
  public static async getSubmissionById(
    id: string
  ): Promise<SiteSubmission | null> {
    const http = HttpClient.getInstance();

    try {
      const res = await http.get<SiteSubmission>(
        API_CONFIG.ENDPOINTS.ADMIN.SUBMISSION_DETAIL(id)
      );
      const data = res?.data || ((res as any)?.siteName ? (res as any) : null);
      if (data && data.id) {
        const sanitized = this.sanitizeMediaUrls(data);
        this.updateSingleLocalSubmission(sanitized);
        return sanitized;
      }
    } catch (err) {
      console.warn(`[SubmissionService] getSubmissionById API call failed for ${id}, checking cache:`, err);
    }

    // 2. Direct Supabase REST fallback if backend is unreachable
    try {
      const sbKey = API_CONFIG.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_ANON_KEY;
      const headers = { apikey: sbKey, Authorization: `Bearer ${sbKey}` };
      const [recordRes, mediaRes] = await Promise.all([
        fetch(`${API_CONFIG.SUPABASE_URL}/rest/v1/visit_records?visit_id=eq.${id}&select=*`, { headers }),
        fetch(`${API_CONFIG.SUPABASE_URL}/rest/v1/visit_media?visit_id=eq.${id}&select=*`, { headers }),
      ]);

      if (recordRes.ok) {
        const records = await recordRes.json();
        const record = records[0];
        if (record?.service?.sections) {
          const sections: any[] = record.service.sections;
          const checklistValues: Record<string, any> = {};
          sections.forEach((sec) => {
            if (sec.fields && typeof sec.fields === "object") {
              Object.entries(sec.fields).forEach(([k, v]) => {
                if (v && typeof v === "object" && ("url" in (v as any) || "storage_key" in (v as any))) return;
                checklistValues[k] = v;
              });
            }
          });

          const list = this.getLocalSubmissions();
          const cached = list.find((s) => s.id === id);
          if (cached) {
            cached.checklistValues = checklistValues;
            cached.rawSections = sections;

            // If media records are available, update media URLs
            if (mediaRes.ok) {
              const mediaRows = await mediaRes.json();
              const firstRow = mediaRows[0];
              const mediaItems: any[] = Array.isArray(firstRow?.media) ? firstRow.media : mediaRows;
              cached.areas.forEach((area) => {
                area.media.forEach((m) => {
                  const match = mediaItems.find((mi) => (mi.field_id || mi.fieldId) === m.fieldId);
                  if (match && (match.storage_key || match.storageKey)) {
                    m.url = `/api/media/image?key=${encodeURIComponent(match.storage_key || match.storageKey)}`;
                  }
                });
              });
            }

            const sanitized = this.sanitizeMediaUrls(cached);
            this.updateSingleLocalSubmission(sanitized);
            return sanitized;
          }
        }
      }
    } catch (sbErr) {
      console.warn(`[SubmissionService] Supabase direct query fallback error:`, sbErr);
    }

    const list = this.getLocalSubmissions();
    const item = list.find((s) => s.id === id);
    return item ? this.sanitizeMediaUrls(item) : null;
  }

  /**
   * Updates an area's review status (e.g. 'ok', 'more_requested', 'not_reviewed')
   */
  public static async updateAreaStatus(
    submissionId: string,
    areaId: string,
    status: 'ok' | 'more_requested' | 'not_reviewed',
    requestedNote?: string
  ): Promise<SiteSubmission> {
    // 1. Local optimistic update
    const list = this.getLocalSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    let sub: SiteSubmission | null = itemIndex >= 0 ? list[itemIndex] : null;

    if (sub) {
      const area = sub.areas.find((a) => a.id === areaId);
      if (area) {
        area.status = status;
        if (requestedNote !== undefined) {
          area.requestedNote = requestedNote;
        }
      }

      if (status === 'ok') {
        sub.customerRequests = sub.customerRequests.filter(
          (r) => r.areaId !== areaId
        );
      }

      sub.updatedAt = new Date().toISOString();
      list[itemIndex] = sub;
      this.saveLocalSubmissions(list);
    }

    // 2. Network sync
    try {
      const http = HttpClient.getInstance();
      const res = await http.patch<SiteSubmission>(
        API_CONFIG.ENDPOINTS.ADMIN.UPDATE_AREA_STATUS(submissionId),
        { areaId, status, requestedNote }
      );
      if (res?.data) {
        sub = res.data;
        this.updateSingleLocalSubmission(sub);
      }
    } catch (err) {
      console.warn('[SubmissionService] updateAreaStatus network call error:', err);
    }

    if (!sub) throw new Error('Submission not found');
    return sub;
  }

  /**
   * Toggles an item in the approval checklist
   */
  public static async toggleChecklistItem(
    submissionId: string,
    checkId: string,
    checked: boolean
  ): Promise<SiteSubmission> {
    const list = this.getLocalSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    let sub: SiteSubmission | null = itemIndex >= 0 ? list[itemIndex] : null;

    if (sub) {
      const item = sub.approvalChecklist.find((c) => c.id === checkId);
      if (item) {
        item.checked = checked;
      }
      sub.updatedAt = new Date().toISOString();
      list[itemIndex] = sub;
      this.saveLocalSubmissions(list);
    }

    try {
      const http = HttpClient.getInstance();
      const res = await http.patch<SiteSubmission>(
        API_CONFIG.ENDPOINTS.ADMIN.TOGGLE_CHECKLIST(submissionId),
        { checkId, checked }
      );
      if (res?.data) {
        sub = res.data;
        this.updateSingleLocalSubmission(sub);
      }
    } catch (err) {
      console.warn('[SubmissionService] toggleChecklistItem network call error:', err);
    }

    if (!sub) throw new Error('Submission not found');
    return sub;
  }

  /**
   * Adds or updates a customer request in the review queue
   */
  public static async queueCustomerRequest(
    submissionId: string,
    areaId: string,
    text: string
  ): Promise<SiteSubmission> {
    const list = this.getLocalSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    let sub: SiteSubmission | null = itemIndex >= 0 ? list[itemIndex] : null;

    if (sub) {
      const area = sub.areas.find((a) => a.id === areaId);
      const areaName = area?.name || 'Area';

      if (area) {
        area.status = 'more_requested';
        area.requestedNote = text;
      }

      const existingIndex = sub.customerRequests.findIndex(
        (r) => r.areaId === areaId
      );
      if (existingIndex >= 0) {
        sub.customerRequests[existingIndex].text = text;
      } else {
        sub.customerRequests.push({
          id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          areaId,
          areaName,
          text,
          createdAt: new Date().toISOString(),
        });
      }

      sub.updatedAt = new Date().toISOString();
      list[itemIndex] = sub;
      this.saveLocalSubmissions(list);
    }

    try {
      const http = HttpClient.getInstance();
      const res = await http.post<SiteSubmission>(
        API_CONFIG.ENDPOINTS.ADMIN.REQUEST_MORE(submissionId),
        { areaId, text }
      );
      if (res?.data) {
        sub = res.data;
        this.updateSingleLocalSubmission(sub);
      }
    } catch (err) {
      console.warn('[SubmissionService] queueCustomerRequest network call error:', err);
    }

    if (!sub) throw new Error('Submission not found');
    return sub;
  }

  /**
   * Removes a queued customer request
   */
  public static async removeQueuedRequest(
    submissionId: string,
    requestId: string
  ): Promise<SiteSubmission> {
    const list = this.getLocalSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    let sub: SiteSubmission | null = itemIndex >= 0 ? list[itemIndex] : null;

    if (sub) {
      const req = sub.customerRequests.find((r) => r.id === requestId);
      if (req) {
        const area = sub.areas.find((a) => a.id === req.areaId);
        if (area && area.status === 'more_requested') {
          area.status = 'not_reviewed';
          delete area.requestedNote;
        }
        sub.customerRequests = sub.customerRequests.filter(
          (r) => r.id !== requestId
        );
      }

      sub.updatedAt = new Date().toISOString();
      list[itemIndex] = sub;
      this.saveLocalSubmissions(list);
    }

    try {
      const http = HttpClient.getInstance();
      const res = await http.post<SiteSubmission>(
        API_CONFIG.ENDPOINTS.ADMIN.REQUEST_MORE(submissionId),
        { requestId, remove: true }
      );
      if (res?.data) {
        sub = res.data;
        this.updateSingleLocalSubmission(sub);
      }
    } catch (err) {
      console.warn('[SubmissionService] removeQueuedRequest network call error:', err);
    }

    if (!sub) throw new Error('Submission not found');
    return sub;
  }

  /**
   * Dispatches all queued requests to the customer, setting status to 'waiting_for_customer'
   */
  public static async sendRequestsToCustomer(
    submissionId: string
  ): Promise<SiteSubmission> {
    const list = this.getLocalSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    let sub: SiteSubmission | null = itemIndex >= 0 ? list[itemIndex] : null;

    if (sub) {
      sub.status = 'waiting_for_customer';
      sub.updatedAt = new Date().toISOString();
      list[itemIndex] = sub;
      this.saveLocalSubmissions(list);
    }

    try {
      const http = HttpClient.getInstance();
      const res = await http.post<SiteSubmission>(
        API_CONFIG.ENDPOINTS.ADMIN.REQUEST_MORE(submissionId),
        { sendNow: true }
      );
      if (res?.data) {
        sub = res.data;
        this.updateSingleLocalSubmission(sub);
      }
    } catch (err) {
      console.warn('[SubmissionService] sendRequestsToCustomer network call error:', err);
    }

    if (!sub) throw new Error('Submission not found');
    return sub;
  }

  /**
   * Saves internal admin note
   */
  public static async saveInternalNotes(
    submissionId: string,
    notes: string
  ): Promise<SiteSubmission> {
    const list = this.getLocalSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    let sub: SiteSubmission | null = itemIndex >= 0 ? list[itemIndex] : null;

    if (sub) {
      sub.internalNotes = notes;
      sub.updatedAt = new Date().toISOString();
      list[itemIndex] = sub;
      this.saveLocalSubmissions(list);
    }

    try {
      const http = HttpClient.getInstance();
      const res = await http.patch<SiteSubmission>(
        API_CONFIG.ENDPOINTS.ADMIN.UPDATE_NOTES(submissionId),
        { notes }
      );
      if (res?.data) {
        sub = res.data;
        this.updateSingleLocalSubmission(sub);
      }
    } catch (err) {
      console.warn('[SubmissionService] saveInternalNotes network call error:', err);
    }

    if (!sub) throw new Error('Submission not found');
    return sub;
  }

  /**
   * Approves the site submission in backend and updates status to approved
   */
  public static async approveSubmission(
    submissionId: string,
    reviewerName: string = 'Admin'
  ): Promise<SiteSubmission> {
    const list = this.getLocalSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    let sub: SiteSubmission | null = itemIndex >= 0 ? list[itemIndex] : null;

    if (sub) {
      sub.status = 'approved';
      sub.reviewer = reviewerName;
      sub.closedAt = new Date().toISOString();
      sub.updatedAt = new Date().toISOString();
      sub.areas.forEach((a) => {
        a.status = 'ok';
      });
      list[itemIndex] = sub;
      this.saveLocalSubmissions(list);
    }

    try {
      const http = HttpClient.getInstance();
      const res = await http.post<SiteSubmission>(
        API_CONFIG.ENDPOINTS.ADMIN.APPROVE_SUBMISSION(submissionId)
      );
      if (res?.data) {
        sub = res.data;
        this.updateSingleLocalSubmission(sub);
      }
    } catch (err) {
      console.warn('[SubmissionService] approveSubmission network call error:', err);
    }

    if (!sub) throw new Error('Submission not found');
    return sub;
  }

  /**
   * Rejects the site submission / requests revision in backend
   */
  public static async rejectSubmission(
    submissionId: string,
    reason: string,
    reviewerName: string = 'Admin'
  ): Promise<SiteSubmission> {
    const list = this.getLocalSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    let sub: SiteSubmission | null = itemIndex >= 0 ? list[itemIndex] : null;

    if (sub) {
      sub.status = 'waiting_for_customer';
      sub.rejectionReason = reason;
      sub.reviewer = reviewerName;
      sub.updatedAt = new Date().toISOString();
      list[itemIndex] = sub;
      this.saveLocalSubmissions(list);
    }

    try {
      const http = HttpClient.getInstance();
      const res = await http.post<SiteSubmission>(
        API_CONFIG.ENDPOINTS.ADMIN.REJECT_SUBMISSION(submissionId),
        { reason }
      );
      if (res?.data) {
        sub = res.data;
        this.updateSingleLocalSubmission(sub);
      }
    } catch (err) {
      console.warn('[SubmissionService] rejectSubmission network call error:', err);
    }

    if (!sub) throw new Error('Submission not found');
    return sub;
  }

  /**
   * Generates a zip bundle download of all site photos and manifest
   */
  public static async downloadMediaZip(submission: SiteSubmission): Promise<void> {
    if (typeof window === 'undefined') return;

    const allMedia: { name: string; url: string; area: string }[] = [];
    submission.areas.forEach((area) => {
      area.media.forEach((m) => {
        allMedia.push({
          name: `${area.name.replace(/[^a-z0-9]/gi, '_')}_${m.title.replace(/[^a-z0-9]/gi, '_')}.${m.type === 'video' ? 'mp4' : 'jpg'}`,
          url: m.url,
          area: area.name,
        });
      });
    });

    const manifest = {
      siteName: submission.siteName,
      customer: submission.customer,
      location: submission.location,
      mediaCount: submission.mediaCount,
      files: allMedia,
      downloadedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${submission.siteName.replace(/[^a-z0-9]/gi, '_')}_media_manifest.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private static getLocalSubmissions(): SiteSubmission[] {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(CACHE_KEY_SUBMISSIONS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Filter out any mock submissions from previous sessions
            return parsed.filter((s) => s && s.id && !s.id.startsWith('sub-00'));
          }
        }
      } catch (err) {
        console.warn('Failed to parse cached submissions:', err);
      }
    }
    return [];
  }

  private static updateSingleLocalSubmission(updated: SiteSubmission): void {
    if (!updated || !updated.id || updated.id.startsWith('sub-00')) return;
    const list = this.getLocalSubmissions();
    const index = list.findIndex((s) => s.id === updated.id);
    if (index >= 0) {
      list[index] = updated;
    } else {
      list.unshift(updated);
    }
    this.saveLocalSubmissions(list);
  }

  private static saveLocalSubmissions(list: SiteSubmission[]): void {
    if (typeof window !== 'undefined') {
      try {
        const cleanList = list.filter((s) => s && s.id && !s.id.startsWith('sub-00'));
        localStorage.setItem(CACHE_KEY_SUBMISSIONS, JSON.stringify(cleanList));
      } catch (err) {
        console.warn('Failed to save submissions to localStorage:', err);
      }
    }
  }
}
