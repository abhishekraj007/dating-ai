import { useQuery, useMutation } from "convex/react";
import { api } from "@convex-starter/backend";

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
    conversationId ? { conversationId: conversationId as any } : "skip"
  );

  return {
    conversation,
    isLoading: conversation === undefined,
  };
}

export function useConversationByProfile(aiProfileId: string | undefined) {
  const conversation = useQuery(
    api.features.ai.queries.getConversationByProfile,
    aiProfileId ? { aiProfileId: aiProfileId as any } : "skip"
  );

  return {
    conversation,
    isLoading: conversation === undefined,
  };
}

export function useStartConversation() {
  const startConversation = useMutation(
    api.features.ai.mutations.startConversation
  );

  return { startConversation };
}

