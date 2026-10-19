import { r2 } from "../../uploads";
import { api } from "../../_generated/api";
import type { ActionCtx } from "../../_generated/server";
import { generateImageWithFallback } from "./imageGeneration";
import type { ChatPlatform } from "./chatPlatformValidator";
import { IS_DEV } from "./profileGen/constants";

export type ChatStyleOptions = {
  hairstyle?: string;
  clothing?: string;
  scene?: string;
  description?: string;
  duration?: number;
};

export type ChatProfileDetails = {
  gender?: string;
  ethnicity?: string;
};

type ChatMediaPromptMode = "photo" | "video_frame" | "video_motion";

const CHAT_REFERENCE_IMAGE_GENERATION = {
  aspectRatio: "9:16",
  primaryFalModel: "qwen-image-2-edit" as const,
  devWidth: 512,
  devHeight: 768,
};

const MEDIA_PROMPT_CONFIG: Record<
  ChatMediaPromptMode,
  { subjectLead: string; useGenderArticle: boolean; qualityTags: string }
> = {
  photo: {
    subjectLead: "A realistic photo",
    useGenderArticle: false,
    qualityTags:
      "preserve the same identity and facial features as the reference image, high quality, natural lighting, iPhone photo style, casual pose, authentic, candid",
  },
  video_frame: {
    subjectLead: "A realistic vertical photo of",
    useGenderArticle: true,
    qualityTags:
      "preserve the same identity and facial features as the reference image, high quality, natural lighting, portrait orientation, first frame of a video, authentic, candid",
  },
  video_motion: {
    subjectLead: "A realistic vertical video of",
    useGenderArticle: true,
    qualityTags:
      "natural movement, cinematic lighting, authentic, candid, smooth motion, animate naturally from the starting frame",
  },
};

function formatSubjectGender(
  gender: string | undefined,
  withArticle: boolean,
): string {
  if (withArticle) {
    return gender ?? "a woman";
  }

  return gender ?? "woman";
}

function buildStyleDescription(styleOptions: ChatStyleOptions): string {
  return [
    styleOptions.hairstyle && `with ${styleOptions.hairstyle.toLowerCase()}`,
    styleOptions.clothing && `wearing ${styleOptions.clothing.toLowerCase()}`,
    styleOptions.scene && `in a ${styleOptions.scene.toLowerCase()} setting`,
  ]
    .filter(Boolean)
    .join(", ");
}

export function buildChatMediaPrompt(
  mode: ChatMediaPromptMode,
  profile: ChatProfileDetails,
  styleOptions: ChatStyleOptions,
): string {
  const config = MEDIA_PROMPT_CONFIG[mode];
  const baseDescription = [
    config.subjectLead,
    formatSubjectGender(profile.gender, config.useGenderArticle),
    profile.ethnicity ? `of ${profile.ethnicity} ethnicity` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const styleDescription = buildStyleDescription(styleOptions);
  const additionalContext = styleOptions.description
    ? `. ${styleOptions.description}`
    : "";

  return `${baseDescription}${styleDescription ? `, ${styleDescription}` : ""}${additionalContext}. ${config.qualityTags}`;
}

export function buildImagePrompt(
  profile: ChatProfileDetails,
  styleOptions: ChatStyleOptions,
): string {
  return buildChatMediaPrompt("photo", profile, styleOptions);
}

const ADULT_MEDIA_PROMPT_RULES = `If the user asks for adult, NSFW, or explicit content, write that adult content in the prompt in direct language. Do not soften, censor, refuse, or replace it with a tame version. Only include sexual content when they ask for it. If they do not ask, keep the prompt non-sexual. Everyone depicted is a consenting adult.`;

export const SHEET_IMAGE_PROMPT_SYSTEM = `You write one image prompt for a photorealistic photo. Return only the prompt.
Use the subject, hairstyle, clothing, scene, and details below. The prompt you return is sent to the image model as you write it.
${ADULT_MEDIA_PROMPT_RULES}`;

export const SHEET_VIDEO_PROMPT_SYSTEM = `You write one video prompt for a photorealistic vertical video. Return only the prompt.
Use the subject, hairstyle, clothing, scene, and details below. Describe the look and the motion. The prompt you return is sent to the video model as you write it.
${ADULT_MEDIA_PROMPT_RULES}`;

export function buildSheetImagePromptInput(
  profile: ChatProfileDetails,
  styleOptions: ChatStyleOptions,
): string {
  const details = styleOptions.description?.trim();
  const lines = [
    `Subject: ${profile.gender ?? "woman"}`,
    profile.ethnicity ? `Ethnicity: ${profile.ethnicity}` : null,
    styleOptions.hairstyle ? `Hairstyle: ${styleOptions.hairstyle}` : null,
    styleOptions.clothing ? `Clothing: ${styleOptions.clothing}` : null,
    styleOptions.scene ? `Scene: ${styleOptions.scene}` : null,
    details ? `Details: ${details}` : null,
  ].filter((line): line is string => line !== null);

  return lines.join("\n");
}

export function resolveChatImagePrompt(
  profile: ChatProfileDetails,
  styleOptions: ChatStyleOptions,
  storedPrompt: string,
): { prompt: string; agentPrompt: boolean } {
  const description = styleOptions.description?.trim() ?? "";
  const agentPrompt =
    description.length > 0 && storedPrompt.trim() === description;
  if (!agentPrompt) {
    return {
      prompt: buildImagePrompt(profile, styleOptions),
      agentPrompt: false,
    };
  }

  const styleDescription = buildStyleDescription(styleOptions);
  if (!styleDescription) {
    return { prompt: description, agentPrompt: true };
  }

  return {
    prompt: `${description}. ${styleDescription}.`,
    agentPrompt: true,
  };
}

export function resolveChatVideoPrompt(
  profile: ChatProfileDetails,
  styleOptions: ChatStyleOptions,
  storedPrompt: string,
): { prompt: string; agentPrompt: boolean } {
  const description = styleOptions.description?.trim() ?? "";
  const agentPrompt =
    description.length > 0 && storedPrompt.trim() === description;
  if (!agentPrompt) {
    return {
      prompt: buildVideoPrompt(profile, styleOptions),
      agentPrompt: false,
    };
  }

  const styleDescription = buildStyleDescription(styleOptions);
  if (!styleDescription) {
    return { prompt: description, agentPrompt: true };
  }

  return {
    prompt: `${description}. ${styleDescription}.`,
    agentPrompt: true,
  };
}

export function buildVideoFramePrompt(
  profile: ChatProfileDetails,
  styleOptions: ChatStyleOptions,
): string {
  return buildChatMediaPrompt("video_frame", profile, styleOptions);
}

export function buildVideoPrompt(
  profile: ChatProfileDetails,
  styleOptions: ChatStyleOptions,
): string {
  return buildChatMediaPrompt("video_motion", profile, styleOptions);
}

export function toChatProfileDetails(profile: {
  gender?: string;
  ethnicity?: string;
}): ChatProfileDetails {
  return {
    gender: profile.gender,
    ethnicity: profile.ethnicity,
  };
}

export async function getProfileAvatarUrl(
  avatarImageKey: string | undefined,
): Promise<string | null> {
  if (!avatarImageKey || avatarImageKey === "default-avatar") {
    return null;
  }

  try {
    return await r2.getUrl(avatarImageKey);
  } catch (error) {
    console.error("Failed to get avatar URL:", error);
    return null;
  }
}

export async function isNsfwEnabledForPlatform(
  ctx: ActionCtx,
  platform?: ChatPlatform,
): Promise<boolean> {
  if (!platform) {
    return false;
  }

  const appConfig = await ctx.runQuery(
    api.features.appConfig.queries.getPublicAppConfig,
    {},
  );

  return (appConfig?.nsfwEnabledPlatforms ?? []).includes(platform);
}

export async function generateChatReferenceImage(args: {
  prompt: string;
  avatarImageKey?: string;
  enableSafety: boolean;
}) {
  const referenceImageUrl = await getProfileAvatarUrl(args.avatarImageKey);

  return generateImageWithFallback({
    prompt: args.prompt,
    aspectRatio: CHAT_REFERENCE_IMAGE_GENERATION.aspectRatio,
    referenceImageUrls: referenceImageUrl ? [referenceImageUrl] : [],
    primaryFalModel: CHAT_REFERENCE_IMAGE_GENERATION.primaryFalModel,
    enableSafety: args.enableSafety,
    isDev: IS_DEV,
    devWidth: CHAT_REFERENCE_IMAGE_GENERATION.devWidth,
    devHeight: CHAT_REFERENCE_IMAGE_GENERATION.devHeight,
  });
}

function imageExtensionFromContentType(contentType: string): string {
  if (contentType.includes("png")) {
    return "png";
  }

  if (contentType.includes("jpeg") || contentType.includes("jpg")) {
    return "jpg";
  }

  return "webp";
}

export async function fetchRemoteImageAsset(sourceUrl: string): Promise<{
  data: Uint8Array;
  extension: string;
}> {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch generated image: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/webp";

  return {
    data: new Uint8Array(await response.arrayBuffer()),
    extension: imageExtensionFromContentType(contentType),
  };
}

export async function storeRemoteVideoAsset(
  ctx: ActionCtx,
  sourceUrl: string,
  destinationKey: string,
): Promise<void> {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch generated video: ${response.status}`);
  }

  await r2.store(ctx, new Uint8Array(await response.arrayBuffer()), destinationKey);
}

export function buildChatImageKey(
  userId: string,
  aiProfileId: string,
  requestId: string,
  extension: string,
): string {
  return `chatImages/${userId}/${aiProfileId}/${requestId}.${extension}`;
}

export function buildChatVideoKey(
  userId: string,
  aiProfileId: string,
  requestId: string,
): string {
  return `chatVideos/${userId}/${aiProfileId}/${requestId}.mp4`;
}

export function buildChatVideoPosterKey(
  userId: string,
  aiProfileId: string,
  requestId: string,
  extension: string,
): string {
  return `chatVideoPosters/${userId}/${aiProfileId}/${requestId}.${extension}`;
}
