"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import type { Id } from "@dating-ai/backend/convex/_generated/dataModel";

export function useConversations() {
  const conversations = useQuery(api.features.ai.queries.getUserConversations);

  return {
    conversations: conversations ?? [],
    isLoading: conversations === undefined,
  };
}

export function useConversation(conversationId: string | undefined) {
  const conversation = useQuery(
    api.features.ai.queries.getConversation,
    conversationId
      ? { conversationId: conversationId as Id<"aiConversations"> }
      : "skip"
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
