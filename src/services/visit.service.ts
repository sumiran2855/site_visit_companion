import { API_CONFIG } from "@/config/api.config";
import { HttpClient } from "@/lib/api/httpClient";
import { TokenHelper } from "@/lib/helpers/token.helper";
import type { VisitItem } from "@/components/visits/VisitCard";

interface BackendVisit {
  id: string;
  siteName: string;
  companyId?: string;
  ownerId?: string;
  status: "in_progress" | "completed" | "scheduled" | "draft";
  completedFields?: number;
  totalFields?: number;
  completionPercentage?: number;
  createdAt: string;
  updatedAt: string;
  shareToken?: string;
}

const STORAGE_KEY = "ec_user_visits";

export class VisitService {
  private static instance: VisitService | null = null;
  private readonly http: HttpClient;

  private constructor(http?: HttpClient) {
    this.http = http ?? HttpClient.getInstance();
  }

  public static getInstance(): VisitService {
    if (!VisitService.instance) {
      VisitService.instance = new VisitService();
    }
    return VisitService.instance;
  }

  private getLocalVisits(): VisitItem[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalVisits(visits: VisitItem[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
    } catch {
      // ignore storage error
    }
  }

  private mapBackendVisit(v: BackendVisit, defaultCompany = ""): VisitItem {
    return {
      id: v.id,
      siteName: v.siteName || "Untitled Visit",
      companyName: defaultCompany || "EC POWER",
      status: v.status || "in_progress",
      completedFields: v.completedFields ?? 0,
      totalFields: v.totalFields ?? 73,
      updatedAt: v.updatedAt
        ? new Date(v.updatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "Recent",
      createdAt: v.createdAt ? v.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
      shareToken: v.shareToken || `token_${v.id.substring(0, 8)}`,
    };
  }

  /**
   * Fetch visits for the active session.
   * If backend is unavailable or user has no company mapped, safely returns local/empty visits.
   */
  public async listVisits(companyName?: string): Promise<VisitItem[]> {
    const localVisits = this.getLocalVisits();
    const token = TokenHelper.getToken();
    if (!token) {
      return localVisits || [];
    }

    try {
      const response = await this.http.get<BackendVisit[] | { visits?: BackendVisit[] }>(
        API_CONFIG.ENDPOINTS.VISITS.LIST
      );

      let rawList: BackendVisit[] = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          rawList = response.data;
        } else if (
          typeof response.data === "object" &&
          Array.isArray((response.data as { visits?: BackendVisit[] }).visits)
        ) {
          rawList = (response.data as { visits?: BackendVisit[] }).visits || [];
        }
      }

      const remoteVisits = rawList.map((v) => this.mapBackendVisit(v, companyName));

      // Merge remote visits with local visits (avoiding duplicates by id)
      const remoteIds = new Set(remoteVisits.map((v) => v.id));
      const combined = [
        ...remoteVisits,
        ...localVisits.filter((v) => !remoteIds.has(v.id)),
      ];

      this.saveLocalVisits(combined);
      return combined;
    } catch {
      // Backend error (e.g. 403 or network issue) -> fallback to local storage or empty array
      return localVisits || [];
    }
  }

  /**
   * Create a new site visit
   */
  public async createVisit(data: { siteName: string; companyName?: string; companyId?: string }): Promise<VisitItem> {
    const newId = `v-${Date.now()}`;
    const localVisit: VisitItem = {
      id: newId,
      siteName: data.siteName,
      companyName: data.companyName || "",
      status: "in_progress",
      completedFields: 0,
      totalFields: 73,
      updatedAt: "Just now",
      createdAt: new Date().toISOString().split("T")[0],
      shareToken: `token_${Math.random().toString(36).substring(2, 9)}`,
    };

    // Attempt to persist on backend
    try {
      const response = await this.http.post<BackendVisit>(API_CONFIG.ENDPOINTS.VISITS.LIST, {
        siteName: data.siteName,
        companyId: data.companyId,
      });

      if (response.success && response.data?.id) {
        localVisit.id = response.data.id;
      }
    } catch {
      // If backend visit creation fails (e.g. standard user has no companyId), keep local visit
    }

    const currentVisits = this.getLocalVisits();
    this.saveLocalVisits([localVisit, ...currentVisits]);
    return localVisit;
  }

  /**
   * Delete a visit by id
   */
  public async deleteVisit(id: string): Promise<void> {
    try {
      await this.http.delete(API_CONFIG.ENDPOINTS.VISITS.DETAILS(id));
    } catch {
      // Ignore backend delete failure
    }

    const updated = this.getLocalVisits().filter((v) => v.id !== id);
    this.saveLocalVisits(updated);
  }
}

