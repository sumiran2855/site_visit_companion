export type TemplateElementType =
  | "cover_header"
  | "heading"
  | "text_block"
  | "field"
  | "photo_grid"
  | "divider"
  | "logo"
  | "autoflow_checklist";

export interface TemplateElement {
  id: string;
  type: TemplateElementType;
  label?: string;
  content?: string;
  placeholder?: string; // e.g. "{{field:site_name}}" or "[value]"
  width?: "full" | "half" | "third";
  fontSize?: "xs" | "sm" | "base" | "lg" | "xl";
  align?: "left" | "center" | "right";
  columns?: 1 | 2 | 3 | 4;
  showBorder?: boolean;
}

export interface TemplatePage {
  id: string;
  title: string;
  pageNumber: number;
  elements: TemplateElement[];
}

export interface PDFTemplate {
  id: string;
  name: string;
  version: string;
  pageSize: "A4" | "Letter";
  orientation: "portrait" | "landscape";
  margins: "normal" | "compact" | "wide";
  pages: TemplatePage[];
  updatedAt: string;
}

