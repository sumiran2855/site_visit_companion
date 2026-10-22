import { API_CONFIG } from "@/config/api.config";
import { HttpClient } from "@/lib/api/httpClient";
import { TokenHelper } from "@/lib/helpers/token.helper";
import type { PDFTemplate } from "@/types/admin";
import { DEFAULT_EC_POWER_PDF_TEMPLATE } from "@/config/default-template.config";

const TEMPLATE_ENDPOINT = "/pdf-templates";
const CACHE_KEY_TEMPLATE = "ecpower_cached_pdf_template";

/**
 * All PDFs and the template editor go through the backend, which renders every report
 * from the single active template (Admin-saved, else built-in default).
 */
export class PdfService {
  public static async getActiveTemplate(): Promise<PDFTemplate | null> {
    try {
      const res = await HttpClient.getInstance().get<PDFTemplate>(`${TEMPLATE_ENDPOINT}/active`, {
        requiresAuth: false,
      });
      if (res.data && Array.isArray(res.data.pages) && res.data.pages.length > 0) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(CACHE_KEY_TEMPLATE, JSON.stringify(res.data));
        }
        return res.data;
      }
    } catch {}

    // Fallback to local storage
    if (typeof window !== "undefined") {
      const cached = window.localStorage.getItem(CACHE_KEY_TEMPLATE);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
            return parsed;
          }
        } catch {}
      }
    }

    return DEFAULT_EC_POWER_PDF_TEMPLATE;
  }

  public static async saveTemplate(template: PDFTemplate): Promise<PDFTemplate> {
    const toSave: PDFTemplate = {
      ...template,
      updatedAt: new Date().toISOString().split("T")[0],
      isDefault: true,
    };

    if (typeof window !== "undefined") {
      window.localStorage.setItem(CACHE_KEY_TEMPLATE, JSON.stringify(toSave));
    }

    try {
      const res = await HttpClient.getInstance().post<PDFTemplate>(TEMPLATE_ENDPOINT, {
        ...toSave,
        isDefault: true,
      });
      return res.data ?? toSave;
    } catch {}

    return toSave;
  }

  /** Downloads the report PDF. Returns false if the backend could not produce it. */
  public static async downloadReport(opts: {
    visitId: string;
    shareToken?: string;
    siteName: string;
  }): Promise<boolean> {
    const { visitId, shareToken, siteName } = opts;
    const base = API_CONFIG.BASE_URL;
    const authToken = shareToken ? null : TokenHelper.getToken();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzQuery = tz ? `?tz=${encodeURIComponent(tz)}` : "";
    const endpoints = [
      shareToken
        ? `${base}/public/shared/${shareToken}/export/report-pdf`
        : `${base}/visits/${visitId}/export/report-pdf`,
      `${base}/public/visits/${visitId}/export/report-pdf`,
    ].map((e) => `${e}${tzQuery}`);

    try {
      for (const [i, endpoint] of endpoints.entries()) {
        const res = await fetch(endpoint, {
          headers: i === 0 && authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        if (!res.ok) continue;

        const url = window.URL.createObjectURL(await res.blob());
        const a = document.createElement("a");
        a.href = url;
        a.download = `${siteName.trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "SiteVisit"}_Inspection_Report.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return true;
      }
    } catch {
      // fall through
    }
    return false;
  }
}
