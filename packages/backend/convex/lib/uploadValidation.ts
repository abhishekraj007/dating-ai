/**
 * Upload validation constants and helpers.
 *
 * These enforce our security model for R2 uploads:
 *  - MIME allowlist (rejects SVG/HTML which could execute JS via the proxy)
 *  - Hard size cap per file
 *  - Per-user storage quotas (free vs premium)
 *
 * Any uploaded object not matching these rules is deleted in `onSyncMetadata`.
 */

/** Allowed MIME types for image uploads. */
export const ALLOWED_IMAGE_MIME_TYPES: ReadonlyArray<string> = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

/** Maximum size of a single uploaded file, in bytes. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MiB

/** Default per-user storage quota (non-premium). */
export const FREE_USER_STORAGE_BYTES = 500 * 1024 * 1024; // 500 MiB

/** Per-user storage quota for premium users. */
export const PREMIUM_USER_STORAGE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GiB

/** Maximum number of files a single user can keep. */
export const MAX_UPLOADS_PER_USER = 500;

/** Normalize a Content-Type header value (strip charset etc.). */
export function normalizeContentType(contentType: string | undefined | null): string {
  if (!contentType) return "";
  return contentType.split(";")[0]!.trim().toLowerCase();
}

/** Whether a Content-Type is an allowed image type. */
export function isAllowedImageMime(contentType: string | undefined | null): boolean {
  const normalized = normalizeContentType(contentType);
  return ALLOWED_IMAGE_MIME_TYPES.includes(normalized);
}

/**
 * Validate a freshly-uploaded object's metadata.
 * Returns a reason string when invalid, null when OK.
 */
export function validateUploadMetadata(
  contentType: string | undefined | null,
  size: number | undefined | null,
): string | null {
  if (!isAllowedImageMime(contentType)) {
    return `disallowed_content_type:${normalizeContentType(contentType) || "empty"}`;
  }
  if (typeof size !== "number" || size <= 0) {
    return "missing_or_invalid_size";
  }
  if (size > MAX_UPLOAD_BYTES) {
    return `size_exceeds_limit:${size}`;
  }
  return null;
}

/** Compute the storage quota for a given user based on premium state. */
export function getUserStorageQuota(isPremium: boolean | undefined): number {
  return isPremium ? PREMIUM_USER_STORAGE_BYTES : FREE_USER_STORAGE_BYTES;
}
