import { API_CONFIG } from "@/config/api.config";
import { HttpClient } from "@/lib/api/httpClient";
import { TokenHelper } from "@/lib/helpers/token.helper";
import type { PDFTemplate, TemplateElement } from "@/types/admin";
import type { SiteSubmission } from "@/types/submission";
import { DEFAULT_EC_POWER_PDF_TEMPLATE } from "@/config/default-template.config";
import { CHECKLIST_SECTIONS_CONFIG } from "@/config/checklist.config";

const TEMPLATE_ENDPOINT = "/pdf-templates";
const CACHE_KEY_TEMPLATE = "ecpower_cached_pdf_template";

export interface ReportPhotoItem {
  id: string;
  fileName: string;
  uri: string;
  remoteUrl?: string;
  sectionId?: string;
}

export interface DownloadReportOptions {
  visitId: string;
  shareToken?: string;
  siteName: string;
  companyName?: string;
  technicianName?: string;
  values?: Record<string, string>;
  notes?: Record<string, string>;
  photos?: Record<string, ReportPhotoItem[]>;
}

/**
 * All PDFs and the template editor go through the backend, which renders every report
 * from the single active template (Admin-saved, else built-in default).
 * Falls back to local template HTML compilation if backend is unavailable.
 */
export class PdfService {
  /**
   * Fetches active template from backend, Supabase REST, or local cache
   */
  public static async getActiveTemplate(): Promise<PDFTemplate> {
    // 1. Try Backend API
    const http = HttpClient.getInstance();
    const candidateEndpoints = [
      `${TEMPLATE_ENDPOINT}/default`,
      `${TEMPLATE_ENDPOINT}/active`,
      "/templates/default",
      "/templates/active",
    ];

    for (const ep of candidateEndpoints) {
      try {
        const res = await http.get<any>(ep, { requiresAuth: false });
        const resAny = res as any;
        const candidate = resAny?.data || (resAny?.pages ? resAny : null);
        if (candidate && Array.isArray(candidate.pages) && candidate.pages.length > 0) {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(CACHE_KEY_TEMPLATE, JSON.stringify(candidate));
          }
          return candidate;
        }
      } catch {}
    }

    // 2. Try Supabase REST API directly for saved template
    try {
      const sbUrl = `${API_CONFIG.SUPABASE_URL}/rest/v1/pdf_templates?select=*&is_default=eq.true`;
      const sbRes = await fetch(sbUrl, {
        headers: {
          apikey: API_CONFIG.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${API_CONFIG.SUPABASE_ANON_KEY}`,
        },
      });
      if (sbRes.ok) {
        const sbData = await sbRes.json();
        if (Array.isArray(sbData) && sbData[0]?.pages && Array.isArray(sbData[0].pages)) {
          const parsed = {
            ...DEFAULT_EC_POWER_PDF_TEMPLATE,
            id: sbData[0].id,
            name: sbData[0].name || "Standard EC POWER Field Report",
            pages: sbData[0].pages,
            updatedAt: sbData[0].updated_at || new Date().toISOString(),
          };
          if (typeof window !== "undefined") {
            window.localStorage.setItem(CACHE_KEY_TEMPLATE, JSON.stringify(parsed));
          }
          return parsed;
        }
      }
    } catch {}

    // 3. Fallback to local storage
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

  /**
   * Compiles the full report HTML matching the exact design and active template from mobile.
   */
  public static compileTemplateHtml(options: {
    visitId: string;
    siteName: string;
    values?: Record<string, string>;
    notes?: Record<string, string>;
    photos?: Record<string, ReportPhotoItem[]>;
    companyName?: string;
    technicianName?: string;
    template?: PDFTemplate;
  }): string {
    const template = options.template || DEFAULT_EC_POWER_PDF_TEMPLATE;
    const cleanStr = (s?: string) =>
      s
        ? s
            .replace(/§\s*/g, "")
            .replace(/\u00a7\s*/g, "")
            .replace(/&sect;\s*/g, "")
            .trim()
        : "";

    const siteName = cleanStr(options.siteName) || "Site Visit Inspection";
    const visitId = options.visitId;
    const values = options.values || {};
    const notes = options.notes || {};
    const photosMap = options.photos || {};
    const companyName = cleanStr(options.companyName) || "EC POWER Inc.";
    const technicianName = cleanStr(options.technicianName) || "Certified Field Technician";

    const dateFormatted = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const resolveFieldValue = (fieldId: string, fieldLabel?: string): string => {
      // 1. Exact match on fieldId
      if (values[fieldId] !== undefined && values[fieldId] !== null && values[fieldId] !== "") {
        return String(values[fieldId]);
      }
      // 2. Exact match on fieldLabel
      if (fieldLabel && values[fieldLabel] !== undefined && values[fieldLabel] !== null && values[fieldLabel] !== "") {
        return String(values[fieldLabel]);
      }
      // 3. Match normalized fieldId (lowercase, trimmed)
      const normId = fieldId.toLowerCase().trim();
      for (const [k, v] of Object.entries(values)) {
        if (k.toLowerCase().trim() === normId && v !== "") return String(v);
      }
      // 4. Match stripped prefix (e.g. mc_meeting_date -> meeting_date, cd_fuel_data -> fuel_data, bm_electrician -> electrician)
      const strippedId = fieldId.replace(/^[a-z]{2}_/, "").toLowerCase().replace(/_/g, " ").trim();
      for (const [k, v] of Object.entries(values)) {
        const kNorm = k.toLowerCase().replace(/^[a-z]{2}_/, "").replace(/_/g, " ").trim();
        if (kNorm === strippedId && v !== "") return String(v);
      }
      // 5. Match label alphanumeric
      if (fieldLabel) {
        const labelNorm = fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const [k, v] of Object.entries(values)) {
          if (k.toLowerCase().replace(/[^a-z0-9]/g, "") === labelNorm && v !== "") return String(v);
        }
      }
      return "";
    };

    const resolvePlaceholder = (str?: string): string => {
      if (!str) return "";
      const cleaned = cleanStr(str);
      if (cleaned === "{{field:site_name}}") return siteName;
      if (cleaned === "{{timestamp}}" || cleaned === "{{field:date}}") return dateFormatted;
      if (cleaned === "{{technician:signature}}")
        return `${technicianName} (Verified Lead Inspector)`;
      if (cleaned === "{{technician:name}}") return technicianName;
      if (cleaned === "{{company:name}}") return companyName;

      const fieldMatch = cleaned.match(/\{\{field:([a-zA-Z0-9_-]+)\}\}/);
      if (fieldMatch && fieldMatch[1]) {
        const fId = fieldMatch[1];
        if (fId === "site_name") return siteName;
        return resolveFieldValue(fId) || values[fId] || "";
      }
      return /^\[.*\]$/.test(cleaned) ? "" : cleaned;
    };

    const renderElement = (el: TemplateElement): string => {
      switch (el.type) {
        case "cover_header": {
          return `
            <div class="corporate-cover-header">
              <div class="brand-row">
                <div class="brand-identity">
                  <div class="brand-badge">EC POWER</div>
                  <div class="brand-tagline">XRGI® Combined Heat & Power Solutions</div>
                </div>
                <div class="doc-badge-group">
                  <span class="badge badge-emerald">OFFICIAL AUDIT REPORT</span>
                  <span class="badge badge-slate">CONFIDENTIAL</span>
                </div>
              </div>
              <h1 class="report-title">${cleanStr(el.content) || "Site Visit Inspection & Technical Assessment"}</h1>
              <p class="report-subtitle">${cleanStr(el.placeholder) || "Comprehensive physical plant inspection and facility readiness audit."}</p>
              
              <div class="meta-card-grid">
                <div class="meta-item">
                  <span class="meta-label">SITE / FACILITY</span>
                  <span class="meta-value">${siteName}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">LEAD INSPECTOR</span>
                  <span class="meta-value">${technicianName}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">AUDIT DATE</span>
                  <span class="meta-value">${dateFormatted}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">VISIT IDENTIFIER</span>
                  <span class="meta-value status-indicator">
                    <span class="status-dot"></span>
                    ${visitId.slice(0, 18)}
                  </span>
                </div>
              </div>
            </div>
          `;
        }

        case "heading": {
          return `
            <div class="section-heading-block">
              <div class="section-heading-bar"></div>
              <div>
                <h2 class="section-heading-title">${cleanStr(el.label) || "Inspection Findings"}</h2>
                ${el.content ? `<p class="section-heading-subtitle">${cleanStr(el.content)}</p>` : ""}
              </div>
            </div>
          `;
        }

        case "text_block": {
          return `
            <div class="text-callout-box">
              <p>${cleanStr(el.content || el.placeholder || "")}</p>
            </div>
          `;
        }

        case "divider": {
          return `<div class="divider-rule"></div>`;
        }

        case "field": {
          let resolvedVal = resolvePlaceholder(el.placeholder);
          let noteText = "";

          const fieldKey = el.placeholder?.replace(/^\{\{field:|\}\}$/g, "") || el.id;
          if (values[fieldKey] !== undefined && values[fieldKey] !== null && values[fieldKey] !== "") {
            let fVal = values[fieldKey];
            if (fVal === "true" || (fVal as any) === true) fVal = "Yes";
            else if (fVal === "false" || (fVal as any) === false) fVal = "No";
            resolvedVal = fVal;
            noteText = notes[fieldKey] || "";
          }

          const isHalf = el.width === "half";
          const isThird = el.width === "third";
          const widthClass = isThird ? "col-third" : isHalf ? "col-half" : "col-full";

          return `
            <div class="field-item ${widthClass}">
              <div class="field-label">${cleanStr(el.label) || "Field"}</div>
              <div class="field-value-box">
                <span class="field-value-text">${resolvedVal || '<span class="empty-field-text">Not recorded</span>'}</span>
                ${noteText ? `<div class="field-note-text"><strong>Note:</strong> ${cleanStr(noteText)}</div>` : ""}
              </div>
            </div>
          `;
        }

        case "photo_grid": {
          let targetPhotos: ReportPhotoItem[] = [];
          const isBoilerGrid = el.id === "el-photos-1" || (el.label && el.label.toLowerCase().includes("boiler"));

          if (isBoilerGrid) {
            Object.entries(photosMap).forEach(([fieldId, pList]) => {
              if (fieldId.startsWith("bm_") && Array.isArray(pList)) {
                targetPhotos.push(...pList);
              }
            });
            if (targetPhotos.length === 0) {
              Object.values(photosMap).forEach((pList) => {
                if (Array.isArray(pList)) targetPhotos.push(...pList);
              });
            }
            targetPhotos = targetPhotos.slice(0, 3);
          } else {
            Object.values(photosMap).forEach((pList) => {
              if (Array.isArray(pList)) targetPhotos.push(...pList);
            });
          }

          if (targetPhotos.length === 0) {
            return `
              <div class="photo-section-empty">
                <div class="photo-empty-box">
                  <strong>${cleanStr(el.label) || "Photographic Evidence"}</strong>
                  <p>No field inspection photos recorded for this section.</p>
                </div>
              </div>
            `;
          }

          const cols = el.columns || Math.min(targetPhotos.length, 3);
          const gridClass = cols === 2 ? "photo-grid-2" : cols === 4 ? "photo-grid-4" : "photo-grid-3";

          return `
            <div class="photo-section-block">
              <h3 class="photo-section-heading">${cleanStr(el.label) || "Photographic Evidence"}</h3>
              <div class="photo-grid ${gridClass}">
                ${targetPhotos
                  .map((p) => `
                    <div class="photo-card">
                      <div class="photo-image-wrapper">
                        <img src="${p.remoteUrl || p.uri}" alt="${cleanStr(p.fileName)}" class="photo-image" loading="eager" />
                      </div>
                      <div class="photo-meta">
                        <div class="photo-title">${cleanStr(p.fileName)}</div>
                        <div class="photo-section-tag">${cleanStr(p.sectionId) || "Field Photo"}</div>
                      </div>
                    </div>
                  `)
                  .join("")}
              </div>
            </div>
          `;
        }

        case "autoflow_checklist": {
          let totalCount = 0;
          let completedCount = 0;

          CHECKLIST_SECTIONS_CONFIG.forEach((sec) => {
            sec.fields.forEach((f) => {
              totalCount++;
              const val = resolveFieldValue(f.id, f.label);
              const pList = photosMap[f.id] || [];
              if ((val !== undefined && val !== null && val !== "") || pList.length > 0) {
                completedCount++;
              }
            });
          });

          return `
            <div class="autoflow-checklist-container">
              <div class="autoflow-header">
                <div>
                  <h3 class="autoflow-title">Complete 11-Section Field Verification Breakdown</h3>
                  <p class="autoflow-subtitle">Detailed verification status of all ${totalCount} audit items across mechanical, electrical, and structural systems.</p>
                </div>
                <div class="badge ${completedCount === totalCount ? "badge-emerald" : "badge-amber"}">${completedCount} / ${totalCount} Items Audited</div>
              </div>

              ${CHECKLIST_SECTIONS_CONFIG.map((sec) => {
                let secCompleted = 0;
                sec.fields.forEach((f) => {
                  const val = resolveFieldValue(f.id, f.label);
                  const pList = photosMap[f.id] || [];
                  if ((val !== undefined && val !== null && val !== "") || pList.length > 0) secCompleted++;
                });

                const secTitle = cleanStr(sec.title);
                const secTag = cleanStr(sec.sectionTag);
                const secInstructions = cleanStr(sec.instructions);

                return `
                  <div class="checklist-section-card">
                    <div class="checklist-section-header">
                      <div class="checklist-section-title-wrap">
                        <span class="checklist-section-tag">${secTag}</span>
                        <h4 class="checklist-section-title">${secTitle}</h4>
                      </div>
                      <span class="checklist-section-count">${secCompleted}/${sec.fields.length} Completed</span>
                    </div>

                    ${secInstructions ? `<div class="checklist-section-instructions">${secInstructions}</div>` : ""}

                    <div class="checklist-fields-table">
                      ${sec.fields
                        .map((f) => {
                          let val = resolveFieldValue(f.id, f.label);
                          if (val === "true" || (val as any) === true) val = "Yes";
                          else if (val === "false" || (val as any) === false) val = "No";
                          const note = notes[f.id] || notes[`${f.id}_notes`] || notes[f.label];
                          const fieldPhotos = photosMap[f.id] || [];

                          const hasValue = val !== undefined && val !== null && val !== "";
                          const isPhotoField = f.type === "photo";
                          const isVideoField = f.type === "video";
                          const fieldLabel = cleanStr(f.label);
                          const fieldDesc = cleanStr(f.description);

                          return `
                            <div class="checklist-row">
                              <div class="checklist-col-label">
                                <span class="field-title-text">${fieldLabel}</span>
                                ${f.required ? '<span class="required-star">*</span>' : ""}
                                ${fieldDesc ? `<div class="field-desc-text">${fieldDesc}</div>` : ""}
                              </div>
                              <div class="checklist-col-value">
                                ${
                                  isPhotoField
                                    ? fieldPhotos.length > 0
                                      ? `<div class="inline-photo-row">
                                          ${fieldPhotos
                                            .map(
                                              (p) => `
                                            <div class="inline-photo-card">
                                              <img src="${p.remoteUrl || p.uri}" alt="${cleanStr(p.fileName)}" class="inline-photo-img" loading="eager" />
                                              <div class="inline-photo-caption">${cleanStr(p.fileName)}</div>
                                            </div>
                                          `
                                            )
                                            .join("")}
                                        </div>`
                                      : '<span class="empty-field-text">No photos attached</span>'
                                    : isVideoField
                                    ? hasValue || fieldPhotos.length > 0
                                      ? '<span class="verified-tag">✓ Video Recorded</span>'
                                      : '<span class="empty-field-text">No video recording</span>'
                                    : hasValue
                                    ? `<div class="filled-value-text">${val}</div>`
                                    : '<span class="empty-field-text">Not recorded</span>'
                                }
                                ${
                                  note
                                    ? `<div class="field-note-badge">
                                        <strong>Inspector Note:</strong> ${cleanStr(note)}
                                      </div>`
                                    : ""
                                }
                              </div>
                            </div>
                          `;
                        })
                        .join("")}
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          `;
        }

        default:
          return "";
      }
    };

    const pagesHtml = template.pages
      .map((p, idx) => {
        const isCover = idx === 0 || p.id === "page-1";
        let contentHtml = "";
        let currentRow: TemplateElement[] = [];

        const flushRow = () => {
          if (currentRow.length === 0) return;
          contentHtml += `<div class="element-row">${currentRow.map(renderElement).join("")}</div>`;
          currentRow = [];
        };

        const pageElements = p.elements;
        pageElements.forEach((el) => {
          if (el.width === "half" || el.width === "third") {
            currentRow.push(el);
            if (el.width === "half" && currentRow.length === 2) flushRow();
            if (el.width === "third" && currentRow.length === 3) flushRow();
          } else {
            flushRow();
            contentHtml += renderElement(el);
          }
        });
        flushRow();

        return `
          <div class="pdf-page ${isCover ? "cover-page" : "checklist-page page-break"}">
            <div class="page-inner">
              ${contentHtml}
            </div>
          </div>
        `;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${siteName} — Official Inspection Report</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0F172A;
            background-color: #FFFFFF;
            font-size: 12px;
            line-height: 1.45;
            padding: 24px;
            margin: 0 auto;
            max-width: 900px;
          }

          @page {
            size: A4 portrait;
            margin: 12mm 10mm 12mm 10mm;
          }

          @media print {
            body { padding: 0; max-width: 100%; }
            .no-print { display: none !important; }
          }

          .pdf-page {
            position: relative;
            box-sizing: border-box;
            width: 100%;
          }
          .cover-page {
            padding-bottom: 20px;
          }
          .checklist-page {
            margin-top: 0;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
          }

          .corporate-cover-header {
            border-bottom: 2px solid #0F172A;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }
          .brand-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          .brand-identity {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .brand-badge {
            background-color: #0284C7;
            color: #FFFFFF;
            font-weight: 900;
            font-size: 14px;
            letter-spacing: 1.5px;
            padding: 4px 10px;
            border-radius: 6px;
          }
          .brand-tagline {
            font-size: 12px;
            font-weight: 700;
            color: #0369A1;
            letter-spacing: 0.5px;
          }
          .doc-badge-group {
            display: flex;
            gap: 6px;
          }
          .badge {
            font-size: 10px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 4px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .badge-emerald { background-color: #DCFCE7; color: #15803D; border: 1px solid #BBF7D0; }
          .badge-amber { background-color: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; }
          .badge-slate { background-color: #F1F5F9; color: #475569; border: 1px solid #E2E8F0; }

          .report-title {
            font-size: 20px;
            font-weight: 900;
            color: #0F172A;
            letter-spacing: -0.5px;
            margin-bottom: 4px;
          }
          .report-subtitle {
            font-size: 11px;
            color: #64748B;
            margin-bottom: 14px;
          }

          .meta-card-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 10px 12px;
          }
          .meta-item {
            display: flex;
            flex-direction: column;
          }
          .meta-label {
            font-size: 9px;
            font-weight: 800;
            color: #64748B;
            letter-spacing: 0.8px;
            margin-bottom: 2px;
          }
          .meta-value {
            font-size: 12px;
            font-weight: 700;
            color: #0F172A;
          }
          .status-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .status-dot {
            width: 8px;
            height: 8px;
            background-color: #10B981;
            border-radius: 50%;
            display: inline-block;
          }

          .section-heading-block {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-top: 16px;
            margin-bottom: 10px;
            page-break-after: avoid;
          }
          .section-heading-bar {
            width: 4px;
            height: 24px;
            background-color: #0284C7;
            border-radius: 2px;
            margin-top: 2px;
          }
          .section-heading-title {
            font-size: 14px;
            font-weight: 800;
            color: #0F172A;
            letter-spacing: -0.2px;
          }
          .section-heading-subtitle {
            font-size: 11px;
            color: #64748B;
          }

          .element-row {
            display: flex;
            gap: 12px;
            margin-bottom: 10px;
          }
          .col-full { width: 100%; }
          .col-half { width: calc(50% - 6px); }
          .col-third { width: calc(33.333% - 8px); }

          .field-item {
            display: flex;
            flex-direction: column;
            margin-bottom: 8px;
          }
          .field-label {
            font-size: 10px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
          }
          .field-value-box {
            background-color: #FFFFFF;
            border: 1px solid #CBD5E1;
            border-radius: 6px;
            padding: 6px 10px;
            min-height: 32px;
          }
          .field-value-text {
            font-size: 12px;
            font-weight: 600;
            color: #0F172A;
          }
          .field-note-text {
            font-size: 10px;
            color: #0369A1;
            margin-top: 3px;
            background-color: #F0F9FF;
            padding: 2px 6px;
            border-radius: 4px;
          }
          .empty-field-text {
            color: #94A3B8;
            font-style: italic;
            font-size: 11px;
          }

          .photo-section-block {
            margin-top: 14px;
            margin-bottom: 16px;
            page-break-inside: avoid;
          }
          .photo-section-heading {
            font-size: 13px;
            font-weight: 800;
            color: #1E293B;
            margin-bottom: 10px;
          }
          .photo-grid {
            display: grid;
            gap: 12px;
          }
          .photo-grid-2 { grid-template-columns: repeat(2, 1fr); }
          .photo-grid-3 { grid-template-columns: repeat(3, 1fr); }
          .photo-grid-4 { grid-template-columns: repeat(4, 1fr); }
          .photo-card {
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            overflow: hidden;
            background-color: #F8FAFC;
            page-break-inside: avoid;
          }
          .photo-image-wrapper {
            height: 110px;
            background-color: #0F172A;
            overflow: hidden;
          }
          .photo-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
          .photo-meta {
            padding: 4px 6px;
            background-color: #FFFFFF;
            border-top: 1px solid #E2E8F0;
          }
          .photo-title {
            font-size: 9.5px;
            font-weight: 700;
            color: #1E293B;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .photo-section-tag {
            font-size: 8.5px;
            color: #64748B;
          }
          .photo-empty-box {
            padding: 10px 12px;
            border: 1px dashed #CBD5E1;
            border-radius: 6px;
            background-color: #F8FAFC;
            color: #64748B;
            font-size: 10px;
            text-align: center;
          }

          .autoflow-checklist-container {
            margin-top: 12px;
          }
          .autoflow-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #E2E8F0;
            padding-bottom: 8px;
            margin-bottom: 14px;
            page-break-after: avoid;
          }
          .autoflow-title {
            font-size: 14px;
            font-weight: 800;
            color: #0F172A;
          }
          .autoflow-subtitle {
            font-size: 10px;
            color: #64748B;
          }
          .checklist-section-card {
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            margin-bottom: 14px;
            overflow: hidden;
            page-break-inside: auto;
          }
          .checklist-section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #F1F5F9;
            padding: 8px 12px;
            border-bottom: 1px solid #E2E8F0;
            page-break-after: avoid;
          }
          .checklist-section-title-wrap {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .checklist-section-tag {
            font-size: 9px;
            font-weight: 800;
            color: #0284C7;
            background-color: #E0F2FE;
            padding: 2px 6px;
            border-radius: 4px;
          }
          .checklist-section-title {
            font-size: 12px;
            font-weight: 800;
            color: #0F172A;
          }
          .checklist-section-count {
            font-size: 10px;
            font-weight: 700;
            color: #475569;
          }
          .checklist-section-instructions {
            padding: 6px 12px;
            font-size: 10px;
            color: #475569;
            background-color: #F8FAFC;
            border-bottom: 1px solid #E2E8F0;
            font-style: italic;
          }
          .checklist-fields-table {
            display: flex;
            flex-direction: column;
          }
          .checklist-row {
            display: flex;
            border-bottom: 1px solid #F1F5F9;
            padding: 8px 12px;
            page-break-inside: avoid;
          }
          .checklist-row:last-child {
            border-bottom: none;
          }
          .checklist-col-label {
            width: 45%;
            padding-right: 12px;
          }
          .field-title-text {
            font-size: 11px;
            font-weight: 700;
            color: #1E293B;
          }
          .required-star {
            color: #EF4444;
            font-weight: bold;
          }
          .field-desc-text {
            font-size: 9.5px;
            color: #64748B;
            margin-top: 2px;
          }
          .checklist-col-value {
            width: 55%;
          }
          .filled-value-text {
            font-size: 11px;
            font-weight: 600;
            color: #0F172A;
          }
          .field-note-badge {
            font-size: 9.5px;
            color: #0369A1;
            background-color: #F0F9FF;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: 4px;
          }
          .inline-photo-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 4px;
          }
          .inline-photo-card {
            border: 1px solid #CBD5E1;
            border-radius: 4px;
            overflow: hidden;
            width: 100px;
            background-color: #F8FAFC;
            page-break-inside: avoid;
          }
          .inline-photo-img {
            width: 100px;
            height: 70px;
            object-fit: cover;
            display: block;
          }
          .inline-photo-caption {
            font-size: 8px;
            padding: 2px 4px;
            background-color: #FFFFFF;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #475569;
          }
          .verified-tag {
            font-size: 10px;
            font-weight: 700;
            color: #059669;
          }
          .text-callout-box {
            background-color: #F0F9FF;
            border-left: 3px solid #0284C7;
            padding: 10px 14px;
            margin: 10px 0;
            font-size: 11px;
            color: #0369A1;
            border-radius: 0 6px 6px 0;
          }
          .divider-rule {
            height: 1px;
            background-color: #E2E8F0;
            margin: 12px 0;
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
      </html>
    `;
  }

  /**
   * Fetches the complete raw inspection checklist data directly from Supabase visit_records
   * or backend API. Ensures every field from all 11 sections (including Meeting Context,
   * Notes, and room inspections) has its real values, notes, and photos populated.
   */
  public static async fetchRawChecklistValues(visitId: string): Promise<{
    values: Record<string, string>;
    notes: Record<string, string>;
    photos: Record<string, ReportPhotoItem[]>;
  }> {
    const values: Record<string, string> = {};
    const notes: Record<string, string> = {};
    const photos: Record<string, ReportPhotoItem[]> = {};

    try {
      // 1. Try querying Supabase REST visit_records directly
      const sbKey = API_CONFIG.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_ANON_KEY;
      const sbUrl = `${API_CONFIG.SUPABASE_URL}/rest/v1/visit_records?visit_id=eq.${visitId}&select=*`;
      const res = await fetch(sbUrl, {
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
        },
      });

      if (res.ok) {
        const records = await res.json();
        const record = Array.isArray(records) ? records[0] : records;
        const sections: any[] = record?.service?.sections || [];

        for (const sec of sections) {
          const secId = String(sec.section_id || sec.id || "");
          if (!sec.fields || typeof sec.fields !== "object") continue;

          for (const [k, v] of Object.entries(sec.fields)) {
            // Notes field
            if (k.endsWith("_notes")) {
              const baseField = k.replace(/_notes$/, "");
              notes[k] = String(v);
              notes[baseField] = String(v);
              continue;
            }

            // Photo or video media object
            if (v && typeof v === "object") {
              const vObj = v as any;
              let photoUrl = "";
              if (vObj.storage_key) {
                photoUrl = `/api/media/image?key=${encodeURIComponent(vObj.storage_key)}`;
              } else if (vObj.url && !vObj.url.startsWith("file:///")) {
                photoUrl = vObj.url;
              } else if (vObj.url && vObj.url.startsWith("file:///")) {
                const keyMatch = vObj.url.match(/(visit-media\/[^"'\s]+)/);
                if (keyMatch) {
                  photoUrl = `/api/media/image?key=${encodeURIComponent(keyMatch[1])}`;
                }
              }

              if (photoUrl && (vObj.type === "photo" || !vObj.type)) {
                const list = photos[k] || [];
                list.push({
                  id: `photo-${k}-${list.length}`,
                  fileName: k.replace(/_/g, " "),
                  uri: photoUrl,
                  remoteUrl: photoUrl,
                  sectionId: secId,
                });
                photos[k] = list;
              }
              continue;
            }

            // Primitive values (string, boolean, number)
            if (v !== null && v !== undefined) {
              let strVal = "";
              if (typeof v === "boolean") {
                strVal = v ? "Yes" : "No";
              } else if (typeof v === "string") {
                const trimmed = v.trim();
                const low = trimmed.toLowerCase();
                if (low === "true" || low === "yes") strVal = "Yes";
                else if (low === "false" || low === "no") strVal = "No";
                else strVal = trimmed;
              } else {
                strVal = String(v).trim();
              }

              if (strVal !== "") {
                values[k] = strVal;
              }
            }
          }
        }
      }

      // 2. Query Supabase visit_media table for official media files
      try {
        const mediaUrl = `${API_CONFIG.SUPABASE_URL}/rest/v1/visit_media?visit_id=eq.${visitId}&select=*`;
        const mediaRes = await fetch(mediaUrl, {
          headers: {
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`,
          },
        });

        if (mediaRes.ok) {
          const mediaRows = await mediaRes.json();
          const firstRow = mediaRows[0];
          const mediaItems: any[] = Array.isArray(firstRow?.media) ? firstRow.media : mediaRows;

          for (const m of mediaItems) {
            const isPhoto = m.type === "photo" || !m.type;
            const storageKey = m.storage_key || m.storageKey;
            const fId = m.field_id || m.fieldId;

            if (isPhoto && storageKey && fId) {
              const photoUrl = `/api/media/image?key=${encodeURIComponent(storageKey)}`;
              const list = photos[fId] || [];
              if (!list.some((existing) => existing.uri === photoUrl)) {
                list.push({
                  id: String(m.id || storageKey),
                  fileName: m.file_name || fId.replace(/_/g, " "),
                  uri: photoUrl,
                  remoteUrl: photoUrl,
                  sectionId: m.section_id || m.sectionId,
                });
                photos[fId] = list;
              }
            }
          }
        }
      } catch (mediaErr) {
        console.warn("[PdfService] Error fetching visit_media from Supabase:", mediaErr);
      }
    } catch (err) {
      console.warn("[PdfService] Error fetching raw checklist values from Supabase:", err);
    }

    return { values, notes, photos };
  }

  /**
   * Helper to extract standardized values, notes, and photos from a SiteSubmission
   * for report compilation and PDF generation.
   */
  public static extractReportData(submission: SiteSubmission): {
    values: Record<string, string>;
    notes: Record<string, string>;
    photos: Record<string, ReportPhotoItem[]>;
  } {
    const values: Record<string, string> = {};
    const notes: Record<string, string> = {};
    const photos: Record<string, ReportPhotoItem[]> = {};

    // 1. Populate Meeting Context from top-level submission metadata
    if (submission.siteName) values["mc_site_name"] = submission.siteName;
    if (submission.customer) values["mc_primary_contact_name"] = submission.customer;
    if (submission.sentBy) values["mc_attendees"] = submission.sentBy;
    if (submission.formattedDate) values["mc_meeting_date"] = submission.formattedDate;
    if (submission.sentAt) values["mc_meeting_date"] = new Date(submission.sentAt).toLocaleDateString("en-US");

    if (submission.location) {
      if (submission.location.city) values["mc_address_city"] = submission.location.city;
      if (submission.location.state) values["mc_address_state"] = submission.location.state;
      if (submission.location.country) values["mc_address_country"] = submission.location.country;
      if (submission.location.address) values["mc_address_street"] = submission.location.address;
    }

    // 2. Populate from checklistValues if attached
    if (submission.checklistValues) {
      Object.entries(submission.checklistValues).forEach(([k, v]) => {
        if (v !== null && v !== undefined && typeof v !== "object") {
          let str = String(v).trim();
          if (str === "true") str = "Yes";
          else if (str === "false") str = "No";
          values[k] = str;
        }
      });
    }

    // 3. Populate from rawSections if attached
    if (Array.isArray(submission.rawSections)) {
      submission.rawSections.forEach((sec: any) => {
        if (sec.fields && typeof sec.fields === "object") {
          Object.entries(sec.fields).forEach(([k, v]: [string, any]) => {
            if (k.endsWith("_notes")) {
              const baseField = k.replace(/_notes$/, "");
              notes[k] = String(v);
              notes[baseField] = String(v);
            } else if (v !== null && v !== undefined && typeof v !== "object") {
              let str = String(v).trim();
              if (str === "true") str = "Yes";
              else if (str === "false") str = "No";
              values[k] = str;
            }
          });
        }
      });
    }

    // 4. Gather checklist values, notes, and photos from all areas
    submission.areas.forEach((area) => {
      if (area.rawFields) {
        Object.entries(area.rawFields).forEach(([k, v]) => {
          if (v !== null && v !== undefined && typeof v !== "object") {
            let str = String(v).trim();
            if (str === "true") str = "Yes";
            else if (str === "false") str = "No";
            values[k] = str;
          }
        });
      }
      if (area.specs) {
        Object.entries(area.specs).forEach(([k, v]) => {
          values[k] = v;
        });
      }
      if (area.requestedNote) {
        notes[area.id] = area.requestedNote;
      }
      if (area.customerNote) {
        notes[`${area.id}_notes`] = area.customerNote;
      }
      if (area.media && area.media.length > 0) {
        area.media.forEach((m) => {
          if (m.type === "photo") {
            const list = photos[m.fieldId] || [];
            let photoUrl = m.url;
            const storageKey = (m as any).storageKey || (m as any).storage_key;
            if (storageKey) {
              photoUrl = `/api/media/image?key=${encodeURIComponent(storageKey)}`;
            } else if (photoUrl && photoUrl.startsWith("file:///")) {
              const keyMatch = photoUrl.match(/(visit-media\/[^"'\s]+)/);
              if (keyMatch) {
                photoUrl = `/api/media/image?key=${encodeURIComponent(keyMatch[1])}`;
              }
            }

            if (!list.some((existing) => existing.uri === photoUrl)) {
              list.push({
                id: m.id,
                fileName: m.title || "Photo Evidence",
                uri: photoUrl,
                remoteUrl: photoUrl,
                sectionId: area.id,
              });
              photos[m.fieldId] = list;
            }
          }
        });
      }
    });

    return { values, notes, photos };
  }

  /**
   * Fetches official binary PDF Blob from backend server.
   * Returns null if unable to fetch or if aborted.
   */
  public static async fetchReportPdfBlob(
    opts: DownloadReportOptions,
    signal?: AbortSignal
  ): Promise<Blob | null> {
    const { visitId, shareToken } = opts;
    const base = API_CONFIG.BASE_URL;
    const rawToken = shareToken ? null : TokenHelper.getToken();
    const isRealJwt = rawToken && !rawToken.startsWith("demo_");
    const authToken = isRealJwt ? rawToken : null;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzQuery = tz ? `?tz=${encodeURIComponent(tz)}` : "";

    // Candidate endpoints: public direct, authenticated, and production onrender fallback
    const endpoints: string[] = [
      shareToken
        ? `${base}/public/shared/${shareToken}/export/report-pdf${tzQuery}`
        : `${base}/public/visits/${visitId}/export/report-pdf${tzQuery}`,
      ...(authToken ? [`${base}/visits/${visitId}/export/report-pdf${tzQuery}`] : []),
      `https://site-visit-companion-backend.onrender.com/api/public/visits/${visitId}/export/report-pdf${tzQuery}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          signal,
          headers:
            endpoint.includes("/visits/") && !endpoint.includes("/public/") && authToken
              ? { Authorization: `Bearer ${authToken}` }
              : {},
        });

        if (!res.ok) continue;

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/pdf") && !contentType.includes("octet-stream")) {
          continue;
        }

        const blob = await res.blob();
        if (blob && blob.size >= 1000) {
          return new Blob([blob], { type: "application/pdf" });
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          throw err;
        }
        console.warn(`[PdfService] Failed fetching PDF blob from ${endpoint}:`, err);
      }
    }

    return null;
  }

  /**
   * Triggers download of a Blob file in the browser with the given filename.
   */
  public static downloadBlob(blob: Blob, fileName: string): void {
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      try {
        window.URL.revokeObjectURL(blobUrl);
      } catch {}
    }, 2000);
  }

  /**
   * Downloads the official inspection report PDF or opens printable view.
   * 1. Attempts to fetch rendered PDF binary from backend server and downloads.
   * 2. If backend is unavailable, compiles exact template HTML and opens printable view.
   */
  public static async downloadReport(opts: DownloadReportOptions): Promise<boolean> {
    const { siteName } = opts;
    const sanitizedSite =
      siteName.trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "SiteVisit";
    const fileName = `${sanitizedSite}_Inspection_Report.pdf`;

    let values = { ...(opts.values || {}) };
    let notes = { ...(opts.notes || {}) };
    let photos = { ...(opts.photos || {}) };

    try {
      const raw = await this.fetchRawChecklistValues(opts.visitId);
      values = { ...raw.values, ...values };
      notes = { ...raw.notes, ...notes };
      photos = { ...raw.photos, ...photos };
    } catch {}

    const fullOpts: DownloadReportOptions = {
      ...opts,
      values,
      notes,
      photos,
    };

    try {
      const blob = await this.fetchReportPdfBlob(fullOpts);
      if (blob) {
        this.downloadBlob(blob, fileName);
        return true;
      }
    } catch (err) {
      console.warn("[PdfService] Error downloading report PDF blob:", err);
    }

    // 2. Client-side template HTML compilation fallback
    try {
      const activeTemplate = await this.getActiveTemplate();
      const html = this.compileTemplateHtml({
        visitId: fullOpts.visitId,
        siteName: fullOpts.siteName,
        companyName: fullOpts.companyName,
        technicianName: fullOpts.technicianName,
        values: fullOpts.values,
        notes: fullOpts.notes,
        photos: fullOpts.photos,
        template: activeTemplate,
      });

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
          } catch {}
        }, 600);
        return true;
      }
    } catch (err) {
      console.error("[PdfService] Client template compilation fallback error:", err);
    }

    return false;
  }
}
