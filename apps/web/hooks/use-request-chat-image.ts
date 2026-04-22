"use client";

import { useMutation } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import type { Id } from "@dating-ai/backend/convex/_generated/dataModel";

export interface ChatImageRequestOptions {
  hairstyle?: string;
  clothing?: string;
  scene?: string;
  description?: string;
}

export function useRequestChatImage() {
  const requestChatImage = useMutation(
    api.features.ai.mutations.requestChatImage,
  );

  const requestImage = async (
    conversationId: string,
    styleOptions?: ChatImageRequestOptions,
  ) => {
    const normalizedDescription = styleOptions?.description?.trim();
    const normalizedStyleOptions = styleOptions
      ? {
          ...styleOptions,
          description: normalizedDescription || undefined,
        }
      : undefined;

    const promptParts: string[] = ["Generate a selfie"];

    if (normalizedStyleOptions?.hairstyle) {
      promptParts.push(`with ${normalizedStyleOptions.hairstyle} hairstyle`);
    }
    if (normalizedStyleOptions?.clothing) {
      promptParts.push(`wearing ${normalizedStyleOptions.clothing}`);
    }
    if (normalizedStyleOptions?.scene) {
      promptParts.push(`in a ${normalizedStyleOptions.scene} setting`);
    }

    let prompt = promptParts.join(" ");

    if (normalizedStyleOptions?.description) {
      prompt = `${prompt}. Additional details: ${normalizedStyleOptions.description}`;
    }

    return requestChatImage({
      conversationId: conversationId as Id<"aiConversations">,
      prompt,
      styleOptions: normalizedStyleOptions,
    });
  };

  return { requestImage };
}
