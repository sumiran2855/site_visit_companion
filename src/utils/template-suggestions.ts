import { CHECKLIST_SECTIONS_CONFIG } from "@/config/checklist.config";
import { TemplateElementType } from "@/types/template";

export interface TemplateSuggestion {
  id: string;
  text: string;
  hint?: string;
  sectionNumber?: number;
  sectionTitle?: string;
  fieldId?: string;
  fieldType?: string;
  pairedPlaceholder?: string;
  pairedLabel?: string;
  pairedContent?: string;
  badge?: string;
}

const truncate = (text: string, max = 120) =>
  text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;

export const buildTemplateSuggestions = (
  type: TemplateElementType
): {
  labelSuggestions: TemplateSuggestion[];
  contentSuggestions: TemplateSuggestion[];
  placeholderSuggestions: TemplateSuggestion[];
} => {
  const labelSuggestions: TemplateSuggestion[] = [];
  const contentSuggestions: TemplateSuggestion[] = [];
  const placeholderSuggestions: TemplateSuggestion[] = [];

  // 1. Core System & Common Bindings
  const systemBindings: TemplateSuggestion[] = [
    {
      id: "sys_site_name",
      text: "{{field:site_name}}",
      hint: "Site / Building Name",
      pairedLabel: "Site / Building Name",
      pairedContent: "Official name of inspected property",
      badge: "Core",
    },
    {
      id: "sys_site_address",
      text: "{{field:site_address}}",
      hint: "Full Facility Address",
      pairedLabel: "Street Address",
      pairedContent: "Physical site address and location",
      badge: "Core",
    },
    {
      id: "sys_date",
      text: "{{field:date}}",
      hint: "Inspection Date (Formatted)",
      pairedLabel: "Meeting Date",
      badge: "Core",
    },
    {
      id: "sys_timestamp",
      text: "{{timestamp}}",
      hint: "Full Audit Date & Timestamp",
      pairedLabel: "Inspection Date & Timestamp",
      badge: "System",
    },
    {
      id: "sys_technician_sig",
      text: "{{technician:signature}}",
      hint: "Lead Inspector Verified Sign-off",
      pairedLabel: "Lead Technician Sign-off",
      badge: "Signature",
    },
    {
      id: "sys_technician_name",
      text: "{{technician:name}}",
      hint: "Lead Inspector Name",
      pairedLabel: "Lead Technician Name",
      badge: "System",
    },
    {
      id: "sys_company_name",
      text: "{{company:name}}",
      hint: "Assigned Partner Company",
      pairedLabel: "Partner Company Name",
      badge: "System",
    },
    {
      id: "sys_generic_val",
      text: "[value]",
      hint: "Dynamic Checklist Value (Matched by Label)",
      pairedLabel: "Field Answer",
      badge: "Dynamic",
    },
  ];

  placeholderSuggestions.push(...systemBindings);

  // System labels when editing field
  if (type === "field") {
    labelSuggestions.push(
      {
        id: "lbl_site_name",
        text: "Site / building name",
        hint: "Section 1 • text",
        pairedPlaceholder: "{{field:site_name}}",
        pairedContent: "Official property name",
        badge: "Core",
      },
      {
        id: "lbl_site_address",
        text: "Street address",
        hint: "Section 1 • text",
        pairedPlaceholder: "{{field:site_address}}",
        pairedContent: "Street and facility location",
        badge: "Core",
      },
      {
        id: "lbl_meeting_date",
        text: "Meeting date",
        hint: "Section 1 • date",
        pairedPlaceholder: "{{field:date}}",
        badge: "Core",
      },
      {
        id: "lbl_timestamp",
        text: "Inspection Date & Timestamp",
        hint: "System • datetime",
        pairedPlaceholder: "{{timestamp}}",
        badge: "System",
      },
      {
        id: "lbl_tech_sig",
        text: "Lead Technician Sign-off",
        hint: "System • sign-off",
        pairedPlaceholder: "{{technician:signature}}",
        badge: "System",
      },
      {
        id: "lbl_tech_name",
        text: "Lead Technician Name",
        hint: "System • name",
        pairedPlaceholder: "{{technician:name}}",
        badge: "System",
      },
      {
        id: "lbl_company_name",
        text: "Partner Company Name",
        hint: "System • company",
        pairedPlaceholder: "{{company:name}}",
        badge: "System",
      }
    );
  }

  // 2. Iterate Checklist Sections
  CHECKLIST_SECTIONS_CONFIG.forEach((sec) => {
    const secTag = sec.sectionTag || `SECTION ${sec.number}`;
    const secTitle = `Section ${sec.number}: ${sec.title}`;

    if (type === "heading") {
      labelSuggestions.push({
        id: `sec_h_${sec.number}`,
        text: secTitle,
        hint: secTag,
        sectionNumber: sec.number,
        sectionTitle: sec.title,
        pairedContent: sec.instructions ? truncate(sec.instructions, 140) : sec.title,
        badge: "Section",
      });
      labelSuggestions.push({
        id: `sec_h_bare_${sec.number}`,
        text: sec.title,
        hint: `Section ${sec.number}`,
        sectionNumber: sec.number,
        sectionTitle: sec.title,
        pairedContent: secTag,
        badge: "Heading",
      });
    } else if (type === "text_block") {
      labelSuggestions.push({
        id: `sec_tb_${sec.number}`,
        text: `${sec.title} Notes`,
        hint: secTag,
        sectionNumber: sec.number,
        sectionTitle: sec.title,
        pairedContent: sec.instructions ? truncate(sec.instructions, 200) : "",
        badge: "Notes",
      });
      if (sec.instructions) {
        contentSuggestions.push({
          id: `sec_inst_${sec.number}`,
          text: truncate(sec.instructions, 220),
          hint: `${sec.title} instructions`,
          sectionNumber: sec.number,
          sectionTitle: sec.title,
          badge: "Guidance",
        });
      }
    } else if (type === "cover_header") {
      labelSuggestions.push({
        id: `sec_cov_${sec.number}`,
        text: `${sec.title} Report Header`,
        hint: secTag,
        sectionNumber: sec.number,
        sectionTitle: sec.title,
        pairedContent: `Site Visit Checklist — ${sec.title}`,
        badge: "Header",
      });
    } else if (type === "autoflow_checklist") {
      labelSuggestions.push({
        id: `sec_af_${sec.number}`,
        text: `${secTitle} Checklist`,
        hint: secTag,
        sectionNumber: sec.number,
        sectionTitle: sec.title,
        pairedContent: `Dynamic audit verification table for ${sec.title}`,
        badge: "Table",
      });
    }

    // Process fields in this section
    sec.fields.forEach((field) => {
      const fieldToken = `{{field:${field.id}}}`;

      // All fields can be placeholders
      placeholderSuggestions.push({
        id: `ph_${field.id}`,
        text: fieldToken,
        hint: `${field.label} (${sec.title})`,
        sectionNumber: sec.number,
        sectionTitle: sec.title,
        fieldId: field.id,
        fieldType: field.type,
        pairedLabel: field.label,
        pairedContent: field.description || field.placeholder || "",
        badge: field.type,
      });

      // Field type specific label suggestions
      if (type === "field" && field.type !== "photo" && field.type !== "video") {
        labelSuggestions.push({
          id: `f_lbl_${field.id}`,
          text: field.label,
          hint: `Sec ${sec.number}: ${sec.title}`,
          sectionNumber: sec.number,
          sectionTitle: sec.title,
          fieldId: field.id,
          fieldType: field.type,
          pairedPlaceholder: fieldToken,
          pairedContent: field.description || field.placeholder || "",
          badge: field.type,
        });

        if (field.placeholder) {
          contentSuggestions.push({
            id: `f_desc_${field.id}`,
            text: field.placeholder,
            hint: `${field.label} (placeholder)`,
            sectionNumber: sec.number,
            sectionTitle: sec.title,
            fieldId: field.id,
            pairedLabel: field.label,
            badge: "Placeholder",
          });
        }

        if (field.description) {
          contentSuggestions.push({
            id: `f_instr_${field.id}`,
            text: field.description,
            hint: `${field.label} (guidance)`,
            sectionNumber: sec.number,
            sectionTitle: sec.title,
            fieldId: field.id,
            pairedLabel: field.label,
            badge: "Guidance",
          });
        }
      } else if (type === "photo_grid" && (field.type === "photo" || field.type === "video")) {
        labelSuggestions.push({
          id: `pg_lbl_${field.id}`,
          text: field.label,
          hint: `Sec ${sec.number}: ${sec.title}`,
          sectionNumber: sec.number,
          sectionTitle: sec.title,
          fieldId: field.id,
          fieldType: field.type,
          pairedPlaceholder: fieldToken,
          pairedContent: field.description || field.instructions || "Media evidence attachments",
          badge: field.type,
        });
      }
    });
  });

  // Common content suggestions
  if (type === "cover_header") {
    contentSuggestions.push(
      {
        id: "cov_c1",
        text: "Site Visit Checklist - Project Intake",
        hint: "Standard Subtitle",
        badge: "Header",
      },
      {
        id: "cov_c2",
        text: "Site Visit Checklist & Technical Assessment",
        hint: "Formal Assessment",
        badge: "Header",
      },
      {
        id: "cov_c3",
        text: "EC POWER XRGI Field Engineering & Feasibility Audit",
        hint: "Engineering Feasibility",
        badge: "Header",
      },
      {
        id: "cov_c4",
        text: "Comprehensive physical plant inspection and facility readiness audit.",
        hint: "Detailed Subtitle",
        badge: "Header",
      }
    );
  }

  if (type === "autoflow_checklist") {
    labelSuggestions.push(
      {
        id: "af_lbl_1",
        text: "Systematic Technical Verification",
        hint: "All 11 Sections",
        pairedContent: "Verified Field Questionnaire & Compliance Checks",
        badge: "Audit",
      },
      {
        id: "af_lbl_2",
        text: "Complete 11-Section Field Verification Breakdown",
        hint: "Detailed Breakdown",
        pairedContent:
          "Detailed verification status of all 67 audit items across mechanical, electrical, and structural systems.",
        badge: "Audit",
      }
    );
    contentSuggestions.push(
      {
        id: "af_cnt_1",
        text: "Verified Field Questionnaire & Compliance Checks",
        hint: "Standard Subtitle",
        badge: "Audit",
      },
      {
        id: "af_cnt_2",
        text: "Detailed verification status of all 67 audit items across mechanical, electrical, and structural systems.",
        hint: "Full Audit Scope",
        badge: "Audit",
      }
    );
  }

  if (type === "photo_grid") {
    labelSuggestions.push(
      {
        id: "pg_lbl_default1",
        text: "Site Photographic Evidence",
        hint: "General Media",
        pairedContent: "Up to 3 high-resolution attachments",
        badge: "Gallery",
      },
      {
        id: "pg_lbl_default2",
        text: "Boiler Room Perimeter Photos",
        hint: "Section 5: Boiler Room",
        pairedContent: "Clockwise photographic inspection of walls 1 to 4",
        badge: "Gallery",
      }
    );
    contentSuggestions.push(
      {
        id: "pg_cnt_1",
        text: "Media evidence attachments",
        hint: "Default Subtitle",
        badge: "Gallery",
      },
      {
        id: "pg_cnt_2",
        text: "Up to 3 high-resolution attachments",
        hint: "Specification",
        badge: "Gallery",
      }
    );
  }

  return { labelSuggestions, contentSuggestions, placeholderSuggestions };
};

export const filterSuggestions = (
  list: TemplateSuggestion[],
  query: string,
  current: string,
  max = 8
): TemplateSuggestion[] => {
  const q = (query || "").trim().toLowerCase();
  const curr = (current || "").trim().toLowerCase();
  const seen = new Set<string>();

  return list
    .filter((item) => {
      const key = item.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);

      // If text already matches the current value exactly, skip unless user is typing
      if (key === curr && !q) return false;

      if (!q) return true; // on focus with no query, show initial list

      // Search matching across: text, hint, fieldId, sectionTitle, pairedLabel
      const textMatch = key.includes(q);
      const hintMatch = item.hint ? item.hint.toLowerCase().includes(q) : false;
      const fieldMatch = item.fieldId ? item.fieldId.toLowerCase().includes(q) : false;
      const secMatch = item.sectionTitle ? item.sectionTitle.toLowerCase().includes(q) : false;
      const pairedMatch = item.pairedLabel ? item.pairedLabel.toLowerCase().includes(q) : false;

      return textMatch || hintMatch || fieldMatch || secMatch || pairedMatch;
    })
    .sort((a, b) => {
      if (!q) return 0;
      const aLower = a.text.toLowerCase();
      const bLower = b.text.toLowerCase();

      // Exact match first
      if (aLower === q) return -1;
      if (bLower === q) return 1;

      // Starts with query next
      const aStarts = aLower.startsWith(q);
      const bStarts = bLower.startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return 0;
    })
    .slice(0, max);
};

