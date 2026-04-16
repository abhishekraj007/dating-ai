const convexSiteUrl =
  process.env.CONVEX_SITE_URL ?? process.env.EXPO_PUBLIC_CONVEX_SITE_URL ?? "";

const normalizedConvexSiteUrl = convexSiteUrl.replace(/\/+$/, "");

// Optional: set CUSTOM_DOMAIN in Convex env to serve avatars directly from
// R2 public access (e.g. "cdn.yourdomain.com"). When unset, the Convex HTTP
// proxy endpoint is used as a fallback.
const customDomain = process.env.CUSTOM_DOMAIN?.replace(/\/+$/, "") ?? "";

export function buildAiProfileAvatarUrl(
  profileId: string,
  avatarImageKey?: string | null,
) {
  if (!avatarImageKey || avatarImageKey === "default-avatar") {
    return null;
  }

  // Direct CDN path when a custom domain is configured.
  if (customDomain) {
    return `https://${customDomain}/${avatarImageKey}`;
  }

  // Fallback: proxy via Convex HTTP endpoint.
  if (!normalizedConvexSiteUrl) {
    return null;
  }

  const params = new URLSearchParams({
    profileId,
    key: avatarImageKey,
  });

  return `${normalizedConvexSiteUrl}/ai-profiles/avatar?${params.toString()}`;
}
