const convexSiteUrl =
  process.env.CONVEX_SITE_URL ?? process.env.EXPO_PUBLIC_CONVEX_SITE_URL ?? "";

const normalizedConvexSiteUrl = convexSiteUrl.replace(/\/+$/, "");

export function buildAiProfileAvatarUrl(
  profileId: string,
  avatarImageKey?: string | null,
) {
  if (
    !normalizedConvexSiteUrl ||
    !avatarImageKey ||
    avatarImageKey === "default-avatar"
  ) {
    return null;
  }

  const params = new URLSearchParams({
    profileId,
    key: avatarImageKey,
  });

  return `${normalizedConvexSiteUrl}/ai-profiles/avatar?${params.toString()}`;
}
