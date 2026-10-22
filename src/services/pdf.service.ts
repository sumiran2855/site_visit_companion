import { API_CONFIG } from "@/config/api.config";
import { HttpClient } from "@/lib/api/httpClient";
import { TokenHelper } from "@/lib/helpers/token.helper";
import type { PDFTemplate } from "@/types/template";

const TEMPLATE_ENDPOINT = "/pdf-templates";

/**
 * All PDFs and the template editor go through the backend, which renders every report
 * from the single active template (Admin-saved, else built-in default).
 */
export class PdfService {
  public static async getActiveTemplate(): Promise<PDFTemplate | null> {
    const res = await HttpClient.getInstance().get<PDFTemplate>(`${TEMPLATE_ENDPOINT}/active`, {
      requiresAuth: false,
    });
    return res.data ?? null;
  }

  public static async saveTemplate(template: PDFTemplate): Promise<PDFTemplate> {
    const res = await HttpClient.getInstance().post<PDFTemplate>(TEMPLATE_ENDPOINT, {
      ...template,
      isDefault: true,
    });
    return res.data ?? template;
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
      // fall through to caller's fallback
    }
    return false;
  }
}
