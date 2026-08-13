import { useQuery } from "convex-helpers/react/cache";
import { useMutation } from "convex/react";
import { api } from "@dating-ai/backend";
import type { AvatarImageRequest, Id } from "@dating-ai/backend";

/**
 * Uses convex-helpers cache - subscriptions stay alive after unmount
 * so data is instant on revisit (no skeleton loading)
 */
export function useConversations(image?: AvatarImageRequest) {
  const conversations = useQuery(api.features.ai.queries.getUserConversations, {
    imageWidth: image?.imageWidth,
    imageQuality: image?.imageQuality,
  });

  return {
    conversations: conversations ?? [],
    isLoading: conversations === undefined,
  };
}

export function useConversation(
  conversationId: string | undefined,
  image?: AvatarImageRequest,
) {
  const conversation = useQuery(
    api.features.ai.queries.getConversation,
    conversationId
      ? {
          conversationId: conversationId as Id<"aiConversations">,
          imageWidth: image?.imageWidth,
          imageQuality: image?.imageQuality,
        }
      : "skip",
  );

  return {
    conversation,
    isLoading: conversation === undefined && !!conversationId,
  };
}

export function useConversationByProfile(aiProfileId: string | undefined) {
  const conversation = useQuery(
    api.features.ai.queries.getConversationByProfile,
    aiProfileId ? { aiProfileId: aiProfileId as Id<"aiProfiles"> } : "skip"
  );

  return {
    conversation,
    isLoading: conversation === undefined && !!aiProfileId,
  };
}

export function useStartConversation() {
  const startConversation = useMutation(
    api.features.ai.mutations.startConversation
  );

  return { startConversation };
}
