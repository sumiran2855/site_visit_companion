import { API_CONFIG } from "@/config/api.config";
import { CHECKLIST_SECTIONS_CONFIG } from "@/config/checklist.config";
import { PdfService, type ReportPhotoItem } from "./pdf.service";

export interface SharedVisitPayload {
  visit: {
    id: string;
    siteName: string;
    status: string;
    completedFields: number;
    totalFields: number;
    completionPercentage: number;
    createdAt: string;
    updatedAt: string;
    companyName?: string;
    technicianName?: string;
    address?: string | null;
  };
  service?: {
    sections?: Array<{
      section_id: string;
      section_name: string;
      fields: Record<string, any>;
    }>;
    review?: {
      status?: string;
      customerRequests?: Array<{
        id: string;
        areaId: string;
        areaName: string;
        text: string;
        createdAt: string;
        resolved?: boolean;
        resolvedAt?: string;
        technicianResponse?: string;
        responsePhotos?: any[];
      }>;
    };
  } | null;
  answers: Array<{
    sectionId: string;
    fieldId: string;
    value: string;
    notes?: string | null;
  }>;
  media: Array<{
    id: string;
    sectionId: string;
    fieldId: string;
    type: "photo" | "video";
    fileName: string;
    signedUrl: string;
    notes?: string | null;
  }>;
}

export class SharedVisitService {
  /**
   * Retrieves shared visit inspection data by share token or visit ID.
   * 1. Attempts backend public endpoint /public/shared/:token
   * 2. Attempts backend public endpoint /public/visits/:id
   * 3. Fallback: Direct Supabase query if backend is unreachable
   */
  public static async getSharedVisit(
    identifier: string
  ): Promise<SharedVisitPayload> {
    const cleanId = (identifier || "").trim();
    if (!cleanId) {
      throw new Error("Missing share identifier");
    }

    const prodBackend = "https://site-visit-companion-backend.onrender.com/api";
    const base = API_CONFIG.BASE_URL;
    const isLocal = base.includes("localhost") || base.includes("127.0.0.1");
    const candidateBases = Array.from(new Set([isLocal ? prodBackend : base, prodBackend]));

    // 1. Try public shared endpoint across candidate bases
    for (const b of candidateBases) {
      try {
        const res = await fetch(`${b}/public/shared/${cleanId}`);
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json?.data?.visit) {
            return json.data as SharedVisitPayload;
          }
        }
      } catch {}
    }

    // 2. Try public visits fallback endpoint across candidate bases
    for (const b of candidateBases) {
      try {
        const res = await fetch(`${b}/public/visits/${cleanId}`);
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json?.data?.visit) {
            return json.data as SharedVisitPayload;
          }
        }
      } catch {}
    }

    // 3. Fallback directly to Supabase REST API
    return await this.fetchFromSupabaseDirect(cleanId);
  }

  /**
   * Direct Supabase REST fetch fallback when backend server is sleeping / warming up
   */
  private static async fetchFromSupabaseDirect(
    cleanId: string
  ): Promise<SharedVisitPayload> {
    const sbUrl = API_CONFIG.SUPABASE_URL;
    const sbKey =
      API_CONFIG.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_ANON_KEY;
    const headers = {
      apikey: sbKey,
      Authorization: `Bearer ${sbKey}`,
    };

    let targetVisitId = cleanId;

    // Check if cleanId is a share token
    try {
      const tokenRes = await fetch(
        `${sbUrl}/rest/v1/share_tokens?token=eq.${encodeURIComponent(cleanId)}&select=*`,
        { headers }
      );
      if (tokenRes.ok) {
        const tokens = await tokenRes.json();
        if (Array.isArray(tokens) && tokens.length > 0 && tokens[0].visit_id) {
          targetVisitId = tokens[0].visit_id;
        }
      }
    } catch {}

    // Fetch visit, visit_records, and visit_media in parallel
    const [visitRes, recordRes, mediaRes] = await Promise.all([
      fetch(
        `${sbUrl}/rest/v1/visits?id=eq.${encodeURIComponent(targetVisitId)}&select=*`,
        { headers }
      ),
      fetch(
        `${sbUrl}/rest/v1/visit_records?visit_id=eq.${encodeURIComponent(targetVisitId)}&select=*`,
        { headers }
      ),
      fetch(
        `${sbUrl}/rest/v1/visit_media?visit_id=eq.${encodeURIComponent(targetVisitId)}&select=*`,
        { headers }
      ),
    ]);

    if (!visitRes.ok) {
      throw new Error("Unable to retrieve shared site visit from database.");
    }

    const visits = await visitRes.json();
    const rawVisit = Array.isArray(visits) && visits.length > 0 ? visits[0] : null;

    if (!rawVisit) {
      throw new Error("Shared visit not found or the link has expired.");
    }

    const records = recordRes.ok ? await recordRes.json() : [];
    const rawRecord = Array.isArray(records) && records.length > 0 ? records[0] : null;

    const mediaRows = mediaRes.ok ? await mediaRes.json() : [];

    // Synthesize answers from service sections
    const answers: SharedVisitPayload["answers"] = [];
    if (rawRecord?.service?.sections && Array.isArray(rawRecord.service.sections)) {
      rawRecord.service.sections.forEach((sec: any) => {
        if (sec?.fields && typeof sec.fields === "object") {
          Object.entries(sec.fields).forEach(([fieldKey, fieldVal]) => {
            if (fieldKey.endsWith("_notes")) return;
            if (fieldVal === null || fieldVal === undefined) return;
            if (typeof fieldVal === "object") return;

            let valStr = String(fieldVal).trim();
            if (valStr.toLowerCase() === "true" || valStr.toLowerCase() === "yes") valStr = "Yes";
            if (valStr.toLowerCase() === "false" || valStr.toLowerCase() === "no") valStr = "No";

            const notesKey = `${fieldKey}_notes`;
            const notesVal = sec.fields[notesKey] ? String(sec.fields[notesKey]) : null;

            answers.push({
              sectionId: sec.section_id || sec.id,
              fieldId: fieldKey,
              value: valStr,
              notes: notesVal,
            });
          });
        }
      });
    }

    // Map media items
    const media: SharedVisitPayload["media"] = (Array.isArray(mediaRows) ? mediaRows : []).map(
      (m: any) => ({
        id: m.id,
        sectionId: m.section_id || m.sectionId || "sec-general",
        fieldId: m.field_id || m.fieldId || "general",
        type: m.type === "video" ? "video" : "photo",
        fileName: m.file_name || m.fileName || "media.jpg",
        signedUrl:
          m.storage_key || m.storageKey
            ? `/api/media/image?key=${encodeURIComponent(m.storage_key || m.storageKey)}`
            : m.url || "",
        notes: m.notes ?? null,
      })
    );

    // Calculate completion count
    const answeredCount = answers.filter((a) => a.value !== "").length;
    const totalFields = 67;
    const completionPercentage = Math.min(
      100,
      Math.max(0, Math.round((answeredCount / totalFields) * 100))
    );

    return {
      visit: {
        id: rawVisit.id,
        siteName: rawVisit.site_name || rawVisit.siteName || "Site Visit Assessment",
        status: rawVisit.status || "completed",
        completedFields: answeredCount,
        totalFields,
        completionPercentage,
        createdAt: rawVisit.created_at || rawVisit.createdAt || new Date().toISOString(),
        updatedAt: rawVisit.updated_at || rawVisit.updatedAt || new Date().toISOString(),
        companyName: rawVisit.company_name || rawVisit.companyName || "EC POWER Inc.",
        technicianName: rawVisit.technician_name || rawVisit.technicianName || "Certified Field Technician",
        address: rawVisit.address || null,
      },
      service: rawRecord?.service ?? null,
      answers,
      media,
    };
  }

  /**
   * Triggers download of the official generated PDF report
   */
  public static async downloadPdfReport(
    data: SharedVisitPayload,
    shareToken?: string
  ): Promise<boolean> {
    const valuesMap: Record<string, string> = {};
    const notesMap: Record<string, string> = {};
    const photosMap: Record<string, ReportPhotoItem[]> = {};

    // Index all media by fieldId and sectionId
    const mediaByField = new Map<string, SharedVisitPayload["media"]>();
    const mediaBySection = new Map<string, SharedVisitPayload["media"]>();

    data.media.forEach((m) => {
      if (m.fieldId) {
        const list = mediaByField.get(m.fieldId) || [];
        list.push(m);
        mediaByField.set(m.fieldId, list);
      }
      if (m.sectionId) {
        const list = mediaBySection.get(m.sectionId) || [];
        list.push(m);
        mediaBySection.set(m.sectionId, list);
      }
    });

    const assignedMediaIds = new Set<string>();

    CHECKLIST_SECTIONS_CONFIG.forEach((sec) => {
      // 1. Assign answered values and notes
      sec.fields.forEach((f) => {
        const ans = data.answers.find((a) => a.fieldId === f.id);
        if (ans && ans.value) {
          valuesMap[f.id] = ans.value;
          if (ans.notes) notesMap[f.id] = ans.notes;
        }

        // 2. Assign photos that explicitly match this field ID
        const matched = mediaByField.get(f.id) || [];
        if (matched.length > 0) {
          photosMap[f.id] = matched.map((m) => {
            assignedMediaIds.add(m.id);
            return {
              id: m.id,
              fileName: m.fileName,
              uri: m.signedUrl,
              remoteUrl: m.signedUrl,
              sectionId: m.sectionId,
            };
          });
        }
      });

      // 3. For any remaining photos in this section that didn't match a specific fieldId,
      // assign them to the primary photo field of this section ONCE (not to every field!)
      const sectionRemaining = (mediaBySection.get(sec.id) || []).filter(
        (m) => !assignedMediaIds.has(m.id)
      );

      if (sectionRemaining.length > 0) {
        const photoFields = sec.fields.filter((f) => f.type === "photo");
        const targetFieldId = photoFields[0]?.id || `${sec.id}_photos`;
        const existing = photosMap[targetFieldId] || [];
        photosMap[targetFieldId] = [
          ...existing,
          ...sectionRemaining.map((m) => {
            assignedMediaIds.add(m.id);
            return {
              id: m.id,
              fileName: m.fileName,
              uri: m.signedUrl,
              remoteUrl: m.signedUrl,
              sectionId: m.sectionId,
            };
          }),
        ];
      }
    });

    return await PdfService.downloadReport({
      visitId: data.visit.id,
      shareToken,
      siteName: data.visit.siteName,
      companyName: data.visit.companyName,
      technicianName: data.visit.technicianName,
      values: valuesMap,
      notes: notesMap,
      photos: photosMap,
    });
  }
}

