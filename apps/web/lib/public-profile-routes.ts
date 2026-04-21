import { PUBLIC_SEGMENTS, type PublicSegment } from "@/lib/public-segments";

export function normalizePublicUsername(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "") || "profile"
  );
}

export function buildPublicProfileSlug(username: string | null | undefined) {
  return username ? normalizePublicUsername(username) : null;
}

export function buildPublicProfileHref(
  segment: PublicSegment,
  username: string | null | undefined,
) {
  const profileSlug = buildPublicProfileSlug(username);
  return profileSlug ? `${PUBLIC_SEGMENTS[segment].href}/${profileSlug}` : null;
}
