import { v } from "convex/values";

const convexSiteUrl =
  process.env.CONVEX_SITE_URL ?? process.env.EXPO_PUBLIC_CONVEX_SITE_URL ?? "";

const normalizedConvexSiteUrl = convexSiteUrl.replace(/\/+$/, "");

export const DEFAULT_AVATAR_IMAGE_WIDTH = 500;
export const DEFAULT_AVATAR_IMAGE_QUALITY = 90;

export type AvatarImageRequest = {
  imageWidth?: number;
  imageQuality?: number;
};

export type AvatarImageTransform = {
  width: number;
  quality: number;
};

export const avatarImageQueryArgs = {
  imageWidth: v.optional(v.number()),
  imageQuality: v.optional(v.number()),
};

export function resolveAvatarImageTransform(
  args?: AvatarImageRequest,
): AvatarImageTransform {
  return {
    width: args?.imageWidth ?? DEFAULT_AVATAR_IMAGE_WIDTH,
    quality: args?.imageQuality ?? DEFAULT_AVATAR_IMAGE_QUALITY,
  };
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function getCdnBaseUrl() {
  const cdnBaseUrl = process.env.CDN_BASE_URL?.trim();
  if (cdnBaseUrl) {
    return normalizeBaseUrl(cdnBaseUrl);
  }

  const customDomain = process.env.CUSTOM_DOMAIN?.trim();
  if (!customDomain) {
    return "";
  }

  if (customDomain.startsWith("http://") || customDomain.startsWith("https://")) {
    return normalizeBaseUrl(customDomain);
  }

  return `https://${customDomain.replace(/^\/+/, "")}`;
}

function buildCdnTransformUrl(
  cdnBaseUrl: string,
  avatarImageKey: string,
  transform: AvatarImageTransform,
) {
  const options = [
    `width=${transform.width}`,
    `quality=${transform.quality}`,
    "fit=scale-down",
    "format=jpeg",
  ].join(",");

  return `${cdnBaseUrl}/cdn-cgi/image/${options}/${avatarImageKey.replace(/^\/+/, "")}`;
}

export function buildAiProfileAvatarUrl(
  profileId: string,
  avatarImageKey?: string | null,
  transform?: AvatarImageRequest,
) {
  if (!avatarImageKey || avatarImageKey === "default-avatar") {
    return null;
  }

  const resolved = resolveAvatarImageTransform(transform);
  const cdnBaseUrl = getCdnBaseUrl();
  if (cdnBaseUrl) {
    return buildCdnTransformUrl(cdnBaseUrl, avatarImageKey, resolved);
  }

  if (!normalizedConvexSiteUrl) {
    return null;
  }

  const params = new URLSearchParams({
    profileId,
    key: avatarImageKey,
  });

  return `${normalizedConvexSiteUrl}/ai-profiles/avatar?${params.toString()}`;
}
