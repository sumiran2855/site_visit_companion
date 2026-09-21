"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Download,
  Edit2,
  Printer,
  Save,
  Share2,
  Zap,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import {
  CHECKLIST_SECTIONS_CONFIG,
} from "@/config/checklist";
import { ChecklistSection } from "@/components/checklist/ChecklistSection";
import { ChecklistProgress } from "@/components/checklist/ChecklistProgress";
import { ShareMenu } from "@/components/checklist/ShareMenu";
import type { PhotoMediaItem } from "@/components/checklist/PhotoField";
import type { VideoMediaItem } from "@/components/checklist/VideoField";

interface ChecklistClientProps {
  visitId: string;
}

export function ChecklistClient({ visitId }: ChecklistClientProps) {
  const router = useRouter();

  // Site Visit Info
  const [siteName, setSiteName] = useState(
    visitId === "v-001"
      ? "Benbow Inn - Main Facility"
      : visitId === "v-002"
        ? "Harbor View Hotel - XRGI Survey"
        : "New Site Visit Survey"
  );
  const [isEditingSiteName, setIsEditingSiteName] = useState(false);
  const [tempSiteName, setTempSiteName] = useState(siteName);
  const companyName = "TEST POWER INC";
  const [shareToken] = useState(() => `token_${visitId}_demo`);

  // Form State: Field Values, Notes, Photos, Videos
  const [formValues, setFormValues] = useState<Record<string, string>>({
    mc_contact_person: "John Miller, Facilities Director",
    mc_phone_number: "+1 (555) 019-2834",
    mc_building_type: "Historic Hotel & Resort",
    bm_ceiling_height: "11.2 ft (3.4 m)",
    bm_existing_boilers: "2x Viessmann 500k BTU, Natural Gas",
    em_voltage_service: "480V 3-Phase, 800A Main Service",
    gm_pipe_size: "2-inch pipe, 2 PSI gas line",
  });

  const [formNotes, setFormNotes] = useState<Record<string, string>>({
    mc_meeting_notes: "Survey conducted with chief building engineer.",
    bm_ceiling_height: "Clear pathway above existing piping for XRGI exhaust.",
  });

  const [formPhotos, setFormPhotos] = useState<Record<string, PhotoMediaItem[]>>({
    bm_wall1_photos: [
      {
        id: "p1",
        fileName: "Wall1_ServiceEntryDoor.jpg",
        fileSize: "2.4 MB",
      },
    ],
    bm_wall2_photos: [
      {
        id: "p2",
        fileName: "Wall2_PipingClearance.jpg",
        fileSize: "3.1 MB",
      },
    ],
    em_main_panel_photos: [
      {
        id: "p3",
        fileName: "Electrical_MainPanel_480V.jpg",
        fileSize: "1.8 MB",
      },
    ],
    gm_meter_photos: [
      {
        id: "p4",
        fileName: "GasMeter_SupplyRegulator.jpg",
        fileSize: "2.2 MB",
      },
    ],
  });

  const [formVideos, setFormVideos] = useState<Record<string, VideoMediaItem[]>>({
    bm_room_360_video: [
      {
        id: "v1",
        fileName: "MechanicalRoom_360_Panoramic.mp4",
        fileSize: "48.2 MB",
      },
    ],
  });

  // Accordion Sections State
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "sec-meeting": true,
    "sec-boiler-room": true,
  });

  // Cloud Save State (Section 9 & 30 requirement)
  const [saveStatus, setSaveStatus] = useState<"synced" | "saving" | "unsaved">("synced");

  // Share Dialog State (Section 13 requirement)
  const [showShareModal, setShowShareModal] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Calculate Total & Completed Fields
  const { totalFields, completedFields } = useMemo(() => {
    let total = 0;
    let completed = 0;

    for (const section of CHECKLIST_SECTIONS_CONFIG) {
      for (const field of section.fields) {
        total += 1;
        if (field.type === "text") {
          const val = formValues[field.id];
          if (val && val.trim().length > 0) completed += 1;
        } else if (field.type === "photo") {
          const photos = formPhotos[field.id] || [];
          if (photos.length > 0) completed += 1;
        } else if (field.type === "video") {
          const vids = formVideos[field.id] || [];
          if (vids.length > 0) completed += 1;
        }
      }
    }

    return { totalFields: total, completedFields: completed };
  }, [formValues, formPhotos, formVideos]);

  // Section Toggle
  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Toggle Expand All / Collapse All
  const isAllExpanded = useMemo(() => {
    return CHECKLIST_SECTIONS_CONFIG.every((s) => openSections[s.id]);
  }, [openSections]);

  const handleToggleExpandAll = () => {
    const nextState = !isAllExpanded;
    const updated: Record<string, boolean> = {};
    for (const s of CHECKLIST_SECTIONS_CONFIG) {
      updated[s.id] = nextState;
    }
    setOpenSections(updated);
  };

  // Auto-Save Trigger Simulation
  const triggerAutoSave = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("synced");
    }, 600);
  };

  // Field Handlers
  const handleTextChange = (fieldId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    triggerAutoSave();
  };

  const handleNotesChange = (fieldId: string, notes: string) => {
    setFormNotes((prev) => ({ ...prev, [fieldId]: notes }));
    triggerAutoSave();
  };

  const handleAddPhotos = (fieldId: string, newPhotos: PhotoMediaItem[]) => {
    setFormPhotos((prev) => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || []), ...newPhotos],
    }));
    triggerAutoSave();
    showToast(`Added ${newPhotos.length} photo(s)`);
  };

  const handleRemovePhoto = (fieldId: string, photoId: string) => {
    setFormPhotos((prev) => ({
      ...prev,
      [fieldId]: (prev[fieldId] || []).filter((p) => p.id !== photoId),
    }));
    triggerAutoSave();
  };

  const handleAddVideos = (fieldId: string, newVideos: VideoMediaItem[]) => {
    setFormVideos((prev) => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || []), ...newVideos],
    }));
    triggerAutoSave();
    showToast("Added video recording");
  };

  const handleRemoveVideo = (fieldId: string, videoId: string) => {
    setFormVideos((prev) => ({
      ...prev,
      [fieldId]: (prev[fieldId] || []).filter((v) => v.id !== videoId),
    }));
    triggerAutoSave();
  };

  // Manual Save (Section 9 requirement)
  const handleManualSave = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("synced");
      showToast("All checklist answers and media synced to cloud");
    }, 400);
  };

  // Save Site Name
  const handleSaveSiteName = () => {
    if (tempSiteName.trim()) {
      setSiteName(tempSiteName.trim());
      showToast("Site name updated");
    }
    setIsEditingSiteName(false);
  };

  // ZIP Download Action (Section 15 requirement: <Site_name>_<YYYY-MM-DD>.zip)
  const handleDownloadZip = () => {
    const dateStr = new Date().toISOString().split("T")[0];
    const safeSiteName = siteName.replace(/\s+/g, "_");
    const zipName = `${safeSiteName}_${dateStr}.zip`;
    const folderName = `SiteVisit_${safeSiteName}_${dateStr}`;
    showToast(`Preparing ${zipName} with root folder /${folderName}`);
  };

  // Print Friendly PDF Action (Section 16 requirement)
  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-foreground selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Background Grid & Ambient Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none print:hidden" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-sky-100/30 dark:bg-sky-950/20 blur-[120px] rounded-full pointer-events-none print:hidden" />

      {/* Top Sticky Header */}
      <header className="relative z-20 w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Back to Visits + Brand */}
          <div className="flex items-center gap-2.5 select-none">
            <div className="flex items-center justify-center size-8 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-sm">
              <Zap className="size-4 fill-current" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                EC POWER
              </span>
              <span className="text-[10px] tracking-wider font-medium text-slate-500 dark:text-zinc-400 uppercase">
                Site Visit Companion
              </span>
            </div>
          </div>

          {/* Header Actions: Share, Downloads, Save */}
          <div className="flex items-center gap-2">
            {/* Share Button (Section 9 & 13) */}
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Share2 className="size-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Downloads: Print PDF (Section 9 & 16) */}
            <button
              type="button"
              onClick={handlePrintPdf}
              title="Print checklist or save to PDF"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Printer className="size-3.5" />
              <span className="hidden sm:inline">Print PDF</span>
            </button>

            {/* Downloads: Project ZIP (Section 9 & 15) */}
            <button
              type="button"
              onClick={handleDownloadZip}
              title="Download Project Folder as ZIP"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Download className="size-3.5" />
              <span className="hidden md:inline">Download ZIP</span>
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleManualSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-white shadow-sm transition-all"
            >
              <Save className="size-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Checklist Body */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Back to Visits / Previous Page Button */}
        <div className="flex items-center gap-3 print:hidden">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push(ROUTES.VISITS);
              }
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 backdrop-blur-md shadow-xs group transition-all cursor-pointer"
            title="Go back to previous page"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform text-slate-500 group-hover:text-slate-900 dark:text-zinc-400 dark:group-hover:text-white" />
            <span>Back to visits</span>
          </button>
        </div>

        {/* Site / Building Name Header (Section 9 requirement: editable) */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-5 sm:p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Site / Building Name
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              ID: {visitId}
            </span>
          </div>

          {!isEditingSiteName ? (
            <div className="flex items-center justify-between gap-3 group">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
                {siteName}
              </h1>
              <button
                type="button"
                onClick={() => {
                  setTempSiteName(siteName);
                  setIsEditingSiteName(true);
                }}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white font-medium p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="Edit building name"
              >
                <Edit2 className="size-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                autoFocus
                value={tempSiteName}
                onChange={(e) => setTempSiteName(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3.5 py-2 text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-slate-900"
              />
              <button
                type="button"
                onClick={handleSaveSiteName}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs sm:text-sm"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => setIsEditingSiteName(false)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs sm:text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-zinc-400 pt-1">
            Complete the sections below. All answers, photos, and video recordings auto-save continuously to the cloud.
          </p>
        </div>

        {/* Live Progress Tracker (Section 9 requirement) */}
        <ChecklistProgress
          completedCount={completedFields}
          totalCount={totalFields}
          saveStatus={saveStatus}
          onSave={handleManualSave}
          isAllExpanded={isAllExpanded}
          onToggleExpandAll={handleToggleExpandAll}
        />

        {/* Numbered Collapsible Checklist Sections (Section 10 requirement) */}
        <div className="space-y-4">
          {CHECKLIST_SECTIONS_CONFIG.map((section) => (
            <ChecklistSection
              key={section.id}
              section={section}
              isOpen={Boolean(openSections[section.id])}
              onToggle={() => toggleSection(section.id)}
              formValues={formValues}
              formNotes={formNotes}
              formPhotos={formPhotos}
              formVideos={formVideos}
              onTextChange={handleTextChange}
              onNotesChange={handleNotesChange}
              onAddPhotos={handleAddPhotos}
              onRemovePhoto={handleRemovePhoto}
              onAddVideos={handleAddVideos}
              onRemoveVideo={handleRemoveVideo}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm mt-12 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-6">
            <Link
              href={ROUTES.PRIVACY}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href={ROUTES.TERMS}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span>&copy; {new Date().getFullYear()} EC POWER. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-300 dark:text-zinc-700">|</span>
            <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-zinc-500">EN / DE</span>
          </div>
        </div>
      </footer>

      {/* Share Dialog Popover (Section 13 requirement) */}
      <ShareMenu
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        siteName={siteName}
        shareToken={shareToken}
        onToast={showToast}
      />

      {/* Floating Toast Notification (Section 34 requirement) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 dark:bg-zinc-100 px-4 py-3 text-xs sm:text-sm font-medium text-white dark:text-zinc-900 shadow-xl border border-slate-800 dark:border-zinc-200 animate-in slide-in-from-bottom-5 duration-200">
          <Check className="size-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
