import { useMutation } from "convex/react";
import { api } from "@dating-ai/backend";
import { Id } from "@dating-ai/backend/convex/_generated/dataModel";
import type {
  ImageRequestOptions,
  MediaRequestOptions,
  MediaRequestType,
} from "@/components/dating/image-request-sheet";

export type { ImageRequestOptions, MediaRequestOptions, MediaRequestType };

function buildMediaPrompt(
  mediaType: MediaRequestType,
  styleOptions?: Omit<MediaRequestOptions, "mediaType">,
) {
  const normalizedDescription = styleOptions?.description?.trim();
  const promptParts: string[] = [
    mediaType === "video" ? "Send me a video" : "Send me a selfie",
  ];

  if (styleOptions?.hairstyle) {
    promptParts.push(`with ${styleOptions.hairstyle} hairstyle`);
  }
  if (styleOptions?.clothing) {
    promptParts.push(`wearing ${styleOptions.clothing}`);
  }
  if (styleOptions?.scene) {
    promptParts.push(`in a ${styleOptions.scene} setting`);
  }

  let prompt = promptParts.join(" ");

  if (normalizedDescription) {
    prompt = `${prompt}. Additional details: ${normalizedDescription}`;
  }

  return prompt;
}

/**
 * Hook to request chat media (photo or video).
 */
export function useRequestChatMedia() {
  const requestImageMutation = useMutation(
    api.features.ai.mutations.requestChatImage,
  );
  const requestVideoMutation = useMutation(
    api.features.ai.mutations.requestChatVideo,
  );

  const requestMedia = async (
    conversationId: string,
    options: MediaRequestOptions,
    platform?: "ios" | "android" | "web",
  ) => {
    const { mediaType, ...styleOptions } = options;
    const normalizedDescription = styleOptions.description?.trim();
    const normalizedStyleOptions = {
      ...styleOptions,
      description: normalizedDescription || undefined,
      duration:
        mediaType === "video" ? (styleOptions.duration ?? 5) : undefined,
    };
    const prompt = buildMediaPrompt(mediaType, normalizedStyleOptions);

    if (mediaType === "video") {
      return await requestVideoMutation({
        conversationId: conversationId as Id<"aiConversations">,
        prompt,
        platform,
        styleOptions: normalizedStyleOptions,
      });
    }

    return await requestImageMutation({
      conversationId: conversationId as Id<"aiConversations">,
      prompt,
      platform,
      styleOptions: normalizedStyleOptions,
    });
  };

  return { requestMedia };
}

/** @deprecated Use useRequestChatMedia instead */
export function useRequestChatImage() {
  const { requestMedia } = useRequestChatMedia();

  const requestImage = async (
    conversationId: string,
    styleOptions?: ImageRequestOptions,
    platform?: "ios" | "android" | "web",
  ) => {
    return requestMedia(
      conversationId,
      { mediaType: "photo", ...styleOptions },
      platform,
    );
  };

  return { requestImage };
}
