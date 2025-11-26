import { useMutation } from "convex/react";
import { api } from "@dating-ai/backend";
import { Id } from "@dating-ai/backend/convex/_generated/dataModel";

export interface ImageRequestOptions {
  hairstyle?: string;
  clothing?: string;
  scene?: string;
}

/**
 * Hook to request a chat image.
 */
export function useRequestChatImage() {
  const requestMutation = useMutation(api.features.ai.mutations.requestChatImage);

  const requestImage = async (
    conversationId: string,
    styleOptions?: ImageRequestOptions
  ) => {
    // Build a prompt from style options
    const promptParts: string[] = ["Generate a selfie"];
    if (styleOptions?.hairstyle) {
      promptParts.push(`with ${styleOptions.hairstyle} hairstyle`);
    }
    if (styleOptions?.clothing) {
      promptParts.push(`wearing ${styleOptions.clothing}`);
    }
    if (styleOptions?.scene) {
      promptParts.push(`in a ${styleOptions.scene} setting`);
    }
    const prompt = promptParts.join(" ");

    return await requestMutation({
      conversationId: conversationId as Id<"aiConversations">,
      prompt,
      styleOptions,
    });
  };

  return { requestImage };
}
