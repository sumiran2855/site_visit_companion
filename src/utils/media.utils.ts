/**
 * Media URL utilities for normalizing and securing media URLs across the application.
 */

/**
 * Normalizes any media/photo URL (local file:/// URI, direct Cloudflare R2 bucket URL,
 * or storage key) to use the internal authenticated proxy endpoint `/api/media/image?key=...`.
 *
 * This prevents CORS errors, expired signature errors, and ERR_BLOCKED_BY_ORB errors
 * when rendering photos in the browser or within PDF preview iframes.
 */
export function normalizeMediaUrl(url?: string | null, storageKey?: string | null): string {
  if (storageKey && typeof storageKey === "string" && storageKey.trim()) {
    const cleanKey = storageKey.split("?")[0].replace(/^\/+/, "");
    return `/api/media/image?key=${encodeURIComponent(cleanKey)}`;
  }

  if (!url || typeof url !== "string") return "";

  const trimmed = url.trim();
  if (trimmed.startsWith("/api/media/image")) {
    return trimmed;
  }

  // Matches visit-media/... in file:///, https://*.r2.cloudflarestorage.com/..., etc.
  const match = trimmed.match(/(?:visit-media\/)([^"'\s?#]+)/);
  if (match) {
    const cleanKey = `visit-media/${match[1]}`;
    return `/api/media/image?key=${encodeURIComponent(cleanKey)}`;
  }

  return trimmed;
}
