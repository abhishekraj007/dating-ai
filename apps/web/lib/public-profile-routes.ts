import type { PublicSegment } from "@/lib/public-segments";

const RESERVED_PUBLIC_PROFILE_SLUGS = new Set([
  "_next",
  "api",
  "anime",
  "chat",
  "checkout",
  "contact",
  "help",
  "login",
  "men",
  "portal",
  "privacy",
  "settings",
  "support",
  "terms",
  "women",
]);

export function normalizePublicUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

export function isReservedPublicUsername(value: string) {
  const normalizedUsername = normalizePublicUsername(value);
  return (
    !normalizedUsername || RESERVED_PUBLIC_PROFILE_SLUGS.has(normalizedUsername)
  );
}

export function buildPublicProfileSlug(username: string | null | undefined) {
  if (!username) {
    return null;
  }

  const normalizedUsername = normalizePublicUsername(username);
  return isReservedPublicUsername(normalizedUsername)
    ? null
    : normalizedUsername;
}

export function buildPublicProfileHref(
  _segment: PublicSegment,
  username: string | null | undefined,
) {
  const profileSlug = buildPublicProfileSlug(username);
  return profileSlug ? `/${profileSlug}` : null;
}
