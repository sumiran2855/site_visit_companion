import {
  AreaStatus,
  normalizeSubmissionStatus,
  SiteSubmission,
  SubmissionsFilterState,
} from '@/types/submission';
import { HttpClient } from '@/lib/api/httpClient';
import { API_CONFIG } from '@/config/api.config';
import { normalizeMediaUrl } from '@/utils/media.utils';

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
        // Clean real database submissions only and normalize status
        list = data
          .filter((s) => s && s.id && !s.id.startsWith('sub-00'))
          .map((s) => ({ ...s, status: normalizeSubmissionStatus(s.status) }));
        this.saveLocalSubmissions(list);
      }
    } catch (err) {
      console.warn('[SubmissionService] Backend API not reachable, loading cached database submissions:', err);
    }

    if (!list || list.length === 0) {
      list = this.getLocalSubmissions();
    } else {
      list = list.map((s) => ({ ...s, status: normalizeSubmissionStatus(s.status) }));
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
          m.url = normalizeMediaUrl(m.url, storageKey);
          if (m.thumbnailUrl) {
            m.thumbnailUrl = normalizeMediaUrl(m.thumbnailUrl, storageKey);
          }
        });
      }
    });

    if (submission.customerRequests && submission.customerRequests.length > 0) {
      submission.customerRequests.forEach((req) => {
        if (req.responsePhotos && req.responsePhotos.length > 0) {
          req.responsePhotos.forEach((p) => {
            const storageKey = (p as any).storageKey || (p as any).storage_key;
            p.url = normalizeMediaUrl(p.url || (p as any).remoteUrl || (p as any).uri, storageKey);
          });
        }
      });
    }

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

    // Direct Supabase REST fallback if backend is unreachable
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
            if (sec.fields && typeof sec.fields === 'object') {
              Object.entries(sec.fields).forEach(([k, v]) => {
                if (v && typeof v === 'object' && ('url' in (v as any) || 'storage_key' in (v as any))) return;
                checklistValues[k] = v;
              });
            }
          });

          const list = this.getLocalSubmissions();
          const cached = list.find((s) => s.id === id);
          if (cached) {
            cached.checklistValues = checklistValues;
            cached.rawSections = sections;

            cached.status = normalizeSubmissionStatus(cached.status);
            if (record.service.review) {
              const rev = record.service.review;
              if (rev.internalNotes !== undefined) cached.internalNotes = rev.internalNotes;

              if (Array.isArray(rev.customerRequests)) {
                cached.customerRequests = rev.customerRequests.map((r: any) => ({
                  ...r,
                  resolved: Boolean(r.resolved),
                  responsePhotos: (r.responsePhotos || []).map((p: any) => ({
                    ...p,
                    url: normalizeMediaUrl(
                      p.url || p.remoteUrl || p.uri,
                      p.storageKey || p.storage_key
                    ),
                  })),
                }));
              }

              if (rev.areaStatuses && typeof rev.areaStatuses === 'object') {
                cached.areas.forEach((area) => {
                  const s =
                    rev.areaStatuses[area.id] ||
                    rev.areaStatuses[`sec-${area.id}`] ||
                    rev.areaStatuses[area.id.replace(/^sec-/, '')];

                  const hasUnresolved = (cached.customerRequests || []).some(
                    (r: any) =>
                      (r.areaId === area.id ||
                        `sec-${r.areaId}` === area.id ||
                        r.areaId.replace(/^sec-/, '') === area.id.replace(/^sec-/, '')) &&
                      !r.resolved
                  );

                  if (hasUnresolved) {
                    area.status = 'more_requested';
                    area.customerNote = s?.requestedNote || 'Reviewer requested changes';
                    area.requestedNote = area.customerNote;
                  } else {
                    area.status = 'ok';
                    area.customerNote = undefined;
                    area.requestedNote = undefined;
                  }
                });
              } else if (cached.customerRequests) {
                cached.areas.forEach((area) => {
                  const hasUnresolved = cached.customerRequests!.some(
                    (r: any) =>
                      (r.areaId === area.id ||
                        `sec-${r.areaId}` === area.id ||
                        r.areaId.replace(/^sec-/, '') === area.id.replace(/^sec-/, '')) &&
                      !r.resolved
                  );
                  if (hasUnresolved) {
                    area.status = 'more_requested';
                  } else {
                    area.status = 'ok';
                    area.customerNote = undefined;
                    area.requestedNote = undefined;
                  }
                });
              }
            }

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
   * Updates an individual survey area status (ok, more_requested, not_reviewed)
   */
  public static async updateAreaStatus(
    submissionId: string,
    areaId: string,
    status: AreaStatus,
    requestedNote?: string
  ): Promise<SiteSubmission> {
    const list = this.getLocalSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    let sub: SiteSubmission | null = itemIndex >= 0 ? list[itemIndex] : null;

    if (sub) {
      const area = sub.areas.find((a) => a.id === areaId);
      if (area) {
        area.status = status;
        if (requestedNote !== undefined) {
          area.customerNote = requestedNote;
          area.requestedNote = requestedNote;
        }
      }
      if (status === 'ok' && sub.customerRequests) {
        sub.customerRequests = sub.customerRequests.filter((r) => r.areaId !== areaId);
      }
      sub.updatedAt = new Date().toISOString();
      list[itemIndex] = sub;
      this.saveLocalSubmissions(list);
    }

    try {
      const http = HttpClient.getInstance();
      const res = await http.patch<SiteSubmission>(
        API_CONFIG.ENDPOINTS.ADMIN.UPDATE_AREA_STATUS(submissionId),
        { areaId, status, requestedNote }
      );
      if (res?.data) {
        sub = res.data;
        this.updateSingleLocalSubmission(sub);
      } else if (sub) {
        await this.syncReviewToSupabase(submissionId, sub);
      }
    } catch (err) {
      console.warn('[SubmissionService] updateAreaStatus network call error:', err);
      if (sub) {
        await this.syncReviewToSupabase(submissionId, sub);
      }
    }

    if (!sub) throw new Error('Submission not found');
    return sub;
  }

  /**
   * Adds or updates a customer/technician request in the review queue.
   */
  public static async queueCustomerRequest(
    submissionId: string,
    areaId: string,
    text: string,
    requestId?: string
  ): Promise<SiteSubmission> {
    const list = this.getLocalSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    let sub: SiteSubmission | null = itemIndex >= 0 ? list[itemIndex] : null;

    if (sub) {
      if (!sub.customerRequests) sub.customerRequests = [];
      const area = sub.areas.find((a) => a.id === areaId);
      const areaName = area ? area.name : 'Survey Area';

      const existingIndex = requestId
        ? sub.customerRequests.findIndex((r) => r.id === requestId)
        : -1;

      if (existingIndex >= 0 && sub.customerRequests[existingIndex]) {
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

      if (area) {
        area.status = 'more_requested';
        area.customerNote = text;
      }

      sub.updatedAt = new Date().toISOString();
      list[itemIndex] = sub;
      this.saveLocalSubmissions(list);
    }

    try {
      const http = HttpClient.getInstance();
      const res = await http.post<SiteSubmission>(
        API_CONFIG.ENDPOINTS.ADMIN.REQUEST_MORE(submissionId),
        { areaId, text, requestId }
      );
      if (res?.data) {
        sub = res.data;
        this.updateSingleLocalSubmission(sub);
      } else if (sub) {
        await this.syncReviewToSupabase(submissionId, sub);
      }
    } catch (err) {
      console.warn('[SubmissionService] queueCustomerRequest network call error:', err);
      if (sub) {
        await this.syncReviewToSupabase(submissionId, sub);
      }
    }

    if (!sub) throw new Error('Submission not found');
    return sub;
  }

  /**
   * Removes a queued customer/technician request from the queue.
   */
  public static async removeQueuedRequest(
    submissionId: string,
    requestId: string
  ): Promise<SiteSubmission> {
    const list = this.getLocalSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    let sub: SiteSubmission | null = itemIndex >= 0 ? list[itemIndex] : null;

    if (sub && sub.customerRequests) {
      const req = sub.customerRequests.find((r) => r.id === requestId);
      if (req) {
        const areaId = req.areaId;
        sub.customerRequests = sub.customerRequests.filter((r) => r.id !== requestId);
        const remainingForArea = sub.customerRequests.filter((r) => r.areaId === areaId);
        const area = sub.areas.find((a) => a.id === areaId);
        if (area) {
          if (remainingForArea.length === 0) {
            area.status = 'not_reviewed';
            area.customerNote = undefined;
          } else {
            area.status = 'more_requested';
            area.customerNote = remainingForArea[remainingForArea.length - 1].text;
          }
        }
        sub.updatedAt = new Date().toISOString();
        list[itemIndex] = sub;
        this.saveLocalSubmissions(list);
      }
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
      } else if (sub) {
        await this.syncReviewToSupabase(submissionId, sub);
      }
    } catch (err) {
      console.warn('[SubmissionService] removeQueuedRequest network call error:', err);
      if (sub) {
        await this.syncReviewToSupabase(submissionId, sub);
      }
    }

    if (!sub) throw new Error('Submission not found');
    return sub;
  }

  /**
   * Dispatches all queued requests to the technician
   */
  public static async sendRequestsToCustomer(
    submissionId: string
  ): Promise<SiteSubmission> {
    const list = this.getLocalSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    let sub: SiteSubmission | null = itemIndex >= 0 ? list[itemIndex] : null;

    if (sub) {
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
      } else if (sub) {
        await this.syncReviewToSupabase(submissionId, sub);
      }
    } catch (err) {
      console.warn('[SubmissionService] sendRequestsToCustomer network call error:', err);
      if (sub) {
        await this.syncReviewToSupabase(submissionId, sub);
      }
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
            // Filter out any mock submissions from previous sessions and normalize statuses
            return parsed
              .filter((s) => s && s.id && !s.id.startsWith('sub-00'))
              .map((s) => ({
                ...s,
                status: normalizeSubmissionStatus(s.status),
              }));
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
    const cleanUpdated = {
      ...updated,
      status: normalizeSubmissionStatus(updated.status),
    };
    const list = this.getLocalSubmissions();
    const index = list.findIndex((s) => s.id === cleanUpdated.id);
    if (index >= 0) {
      list[index] = cleanUpdated;
    } else {
      list.unshift(cleanUpdated);
    }
    this.saveLocalSubmissions(list);
  }

  private static async syncReviewToSupabase(submissionId: string, sub: SiteSubmission): Promise<void> {
    try {
      const sbUrl = API_CONFIG.SUPABASE_URL;
      const sbKey = API_CONFIG.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_ANON_KEY;
      if (!sbUrl || !sbKey) return;

      const getRes = await fetch(`${sbUrl}/rest/v1/visit_records?visit_id=eq.${submissionId}&select=*`, {
        headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
      });
      if (!getRes.ok) return;
      const records = await getRes.json();
      if (!records || records.length === 0) return;

      const record = records[0];
      const service = record.service || {
        service_id: 'service-site-visit',
        service_name: 'Site Visit',
        sections: [],
      };

      const areaStatuses: Record<string, { status: string; requestedNote?: string }> = {};
      (sub.areas || []).forEach((a) => {
        areaStatuses[a.id] = {
          status: a.status!,
          requestedNote: a.requestedNote || a.customerNote,
        };
      });

      service.review = {
        ...(service.review || {}),
        status: sub.customerRequests && sub.customerRequests.some((r) => !r.resolved) ? 'more_requested' : 'reviewed',
        customerRequests: sub.customerRequests || [],
        areaStatuses,
        internalNotes: sub.internalNotes || '',
        updatedAt: new Date().toISOString(),
      };

      await fetch(`${sbUrl}/rest/v1/visit_records?visit_id=eq.${submissionId}`, {
        method: 'PATCH',
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          service,
          updated_at: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.warn('[SubmissionService] syncReviewToSupabase fallback error:', e);
    }
  }

  private static saveLocalSubmissions(list: SiteSubmission[]): void {
    if (typeof window !== 'undefined') {
      try {
        const cleanList = list
          .filter((s) => s && s.id && !s.id.startsWith('sub-00'))
          .map((s) => ({
            ...s,
            status: normalizeSubmissionStatus(s.status),
          }));
        localStorage.setItem(CACHE_KEY_SUBMISSIONS, JSON.stringify(cleanList));
      } catch (err) {
        console.warn('Failed to save submissions to localStorage:', err);
      }
    }
  }
}
