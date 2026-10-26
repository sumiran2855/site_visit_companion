"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  FileCheck2,
} from "lucide-react";
import type { PDFTemplate, TemplatePage } from "@/types/template";
import { PdfService, ReportPhotoItem } from "@/services/pdf.service";

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: TemplatePage[];
  templateMeta: PDFTemplate;
}

// Generate sharp, lightweight SVG inspection photo data URIs
const createSamplePhoto = (title: string, subtitle: string, bgColor: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420">
    <rect width="600" height="420" fill="${bgColor}"/>
    <g fill="#ffffff" opacity="0.12">
      <circle cx="300" cy="170" r="70"/>
      <path d="M80 360 L240 220 L350 310 L440 200 L560 360 Z"/>
    </g>
    <rect x="36" y="28" width="110" height="24" rx="12" fill="#0284c7" opacity="0.95"/>
    <text x="91" y="44" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">VERIFIED AUDIT</text>
    <text x="300" y="260" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
    <text x="300" y="290" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="13" fill="#cbd5e1" text-anchor="middle">${subtitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export function TemplatePreviewModal({
  isOpen,
  onClose,
  pages,
  templateMeta,
}: TemplatePreviewModalProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [iframeHeight, setIframeHeight] = useState<number>(1800);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Measure and adjust iframe height to display all pages without clipping
  const handleIframeLoad = () => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc) {
        const measured = Math.max(
          doc.documentElement.scrollHeight,
          doc.body.scrollHeight,
          1600
        );
        setIframeHeight(measured + 80);
      }
    } catch {}
  };

  useEffect(() => {
    if (!isOpen) return;

    setZoom(100);

    // Thoroughly strip any "§" (Section sign) from all page titles, labels, placeholders & contents
    const stripSection = (s?: string) =>
      s ? s.replace(/§\s*/g, "").replace(/\u00a7\s*/g, "").replace(/&sect;\s*/g, "").trim() : "";

    const sanitizedPages: TemplatePage[] = pages.map((p) => ({
      ...p,
      title: stripSection(p.title) || p.title,
      elements: (p.elements || []).map((el) => ({
        ...el,
        label: stripSection(el.label),
        content: stripSection(el.content),
        placeholder: stripSection(el.placeholder),
      })),
    }));

    // Realistic sample values covering all 11 sections
    const sampleValues: Record<string, string> = {
      // Section 1: Meeting Context
      mc_meeting_date: "September 16, 2026",
      mc_site_name: "The Benbow Inn",
      mc_address_street: "445 Lake Blvd",
      mc_address_unit: "Main Lodge & Conference Center",
      mc_address_city: "Garberville",
      mc_address_state: "CA",
      mc_address_zip: "95542",
      mc_primary_contact_name: "Michael Vance",
      mc_contact_role: "General Manager",
      mc_contact_phone: "+1 (555) 234-5678",
      mc_contact_email: "mvance@benbowinn.com",
      mc_attendees:
        "Michael Vance (GM), Sarah Jenkins (Lead Facilities Engineer), John Miller (EC POWER)",

      // Section 2: Consumption Data
      cd_electricity_data:
        "142,500 kWh/year. Summer peak demand 85 kW. Commercial TOU-GS-3 tariff schedule.",
      cd_fuel_data:
        "18,200 therms/year natural gas. Core heating load 120,000 BTU/hr.",
      cd_has_chp: "No",
      cd_has_pv: "Yes",

      // Section 3: Planned Efficiency Upgrades
      pe_has_upgrades: "Yes",

      // Section 4: General Path
      gp_passage_widths:
        'Service corridor: 48" W x 88" H. Elevator door: 42" W. Stairway width: 52". Clear path without step drops.',

      // Section 5: Boiler Room
      bm_plumbing_installer: "Redwood Mechanical & Plumbing Solutions",
      bm_electrician: "Pacific Coast Electrical Contractors",
      bm_footprint_confirmed: "Yes",
      bm_footprint_notes:
        'Available floor space: 12.5 ft x 14 ft. Clear height to ceiling beam: 9.5 ft. Ample clearance for XRGI 20 and 1,000L buffer tank.',
      bm_supply_temp_notes:
        "Supply: 165°F (74°C), Return: 125°F (52°C), Gas Pressure: 20 mbar static.",
      bm_480v_available: "Yes",
      bm_electrical_service_notes:
        "Main service: 480V 3-Phase, 800A service entrance. 60A spare feeder available at Sub-Panel B.",
      bm_chimney_measurements:
        'Flue shaft: 10" diameter B-vent. Distance from floor to opening: 7.5 ft. Direct vertical run to roof.',
      bm_outside_air_present: "Yes",
      bm_combustion_air_notes:
        'Louvered exterior intake: 24" x 24" with motorized damper interlock.',
      bm_chemicals_present: "No",
      bm_chemicals_notes: "No corrosive chemicals or solvents stored in mechanical room.",
      bm_cellular_reception_ok: "Yes",
      bm_reception_ethernet_plan:
        "LTE cellular: 4 bars on Verizon & AT&T. Hardwired Cat6 Ethernet drop located 15 ft from planned XRGI rack.",

      // Section 6 & 7: Meter Rooms
      em_service_entrance_video: "Recorded",
      gm_service_entrance_video: "Recorded",

      // Section 8 & 9
      ar_adjacent_rooms_used: "No",

      // Section 10 & 11
      mkt_customer_approved: "Yes",
      mkt_approved_statements:
        "The Benbow Inn is excited to partner with EC POWER on combined heat and power to cut carbon emissions.",
      an_anything_else:
        "Service access via rear loading dock. Keycard issued to lead technician.",
    };

    // Realistic sample photos for photo grids
    const samplePhotos: Record<string, ReportPhotoItem[]> = {
      bm_photos: [
        {
          id: "photo-1",
          fileName: "Wall 1 - Service Entry Door",
          uri: createSamplePhoto("Wall 1: Entry & Clearance", "Clockwise inspection facing entry door", "#0f172a"),
          remoteUrl: createSamplePhoto("Wall 1: Entry & Clearance", "Clockwise inspection facing entry door", "#0f172a"),
          sectionId: "Boiler Room",
        },
        {
          id: "photo-2",
          fileName: "Wall 2 - Gas & Supply Piping",
          uri: createSamplePhoto("Wall 2: Gas & Supply Piping", "Incoming 20 mbar supply line & valves", "#1e293b"),
          remoteUrl: createSamplePhoto("Wall 2: Gas & Supply Piping", "Incoming 20 mbar supply line & valves", "#1e293b"),
          sectionId: "Boiler Room",
        },
        {
          id: "photo-3",
          fileName: "Wall 3 - Main Heating Boilers",
          uri: createSamplePhoto("Wall 3: Primary Boilers & Buffer", "Existing heating plant & buffer manifold", "#334155"),
          remoteUrl: createSamplePhoto("Wall 3: Primary Boilers & Buffer", "Existing heating plant & buffer manifold", "#334155"),
          sectionId: "Boiler Room",
        },
      ],
      bm_boilers_buffer_photos: [
        {
          id: "photo-4",
          fileName: "Primary Boilers & Buffer",
          uri: createSamplePhoto("Primary Boilers & Buffer", "Existing heating plant & buffer manifold", "#1e293b"),
          remoteUrl: createSamplePhoto("Primary Boilers & Buffer", "Existing heating plant & buffer manifold", "#1e293b"),
          sectionId: "Boiler Room",
        },
      ],
    };

    const compiledHtml = PdfService.compileTemplateHtml({
      visitId: "VST-2026-0916",
      siteName: "The Benbow Inn",
      companyName: "EC POWER Partner Network",
      technicianName: "Michael Vance",
      values: sampleValues,
      notes: {
        bm_supply_temp_notes: "Verified on calibrated digital thermometer.",
        bm_footprint_notes: "Floor slab in excellent condition, zero cracks.",
      },
      photos: samplePhotos,
      template: {
        ...templateMeta,
        pages: sanitizedPages,
      },
    });

    setHtmlContent(compiledHtml);
  }, [isOpen, pages, templateMeta]);

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } else {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 500);
      }
    }
  };

  const handleDownload = () => {
    handlePrint();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-5xl h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-800/60">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Eye className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  PDF Report Preview
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  {pages.length} {pages.length === 1 ? "Page" : "Pages"} Formatted
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Full multi-page report rendered exactly according to your active template.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-1.5 py-1 text-xs">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(z - 10, 50))}
                className="p-1 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(z + 10, 150))}
                className="p-1 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(100)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors ml-0.5"
                title="Reset Zoom"
              >
                <RotateCcw className="size-3" />
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
              title="Print full multi-page report"
            >
              <Printer className="size-3.5 text-slate-500 dark:text-zinc-400" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              title="Download or save as PDF"
            >
              <Download className="size-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors ml-1"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Multi-page Document Viewer */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start bg-slate-900/95">
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={htmlContent}
              title="Full Multi-Page PDF Preview"
              onLoad={handleIframeLoad}
              style={{
                width: "100%",
                maxWidth: "860px",
                height: `${iframeHeight}px`,
                border: "none",
                borderRadius: "8px",
                background: "white",
              }}
              className="shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

