import { useQuery, useMutation } from "convex/react";
import { api } from "@dating-ai/backend";
import { useRef } from "react";

// Global cache to store last known data for each query
// This persists across component mounts/unmounts
const dataCache = new Map<string, any>();

export function useConversations() {
  const conversations = useQuery(api.features.ai.queries.getUserConversations);
  const cacheKey = "conversations";

  // Update cache when we have data
  if (conversations !== undefined) {
    dataCache.set(cacheKey, conversations);
  }

  // Use cached data if current result is undefined
  const cachedData = dataCache.get(cacheKey);
  const effectiveData = conversations ?? cachedData ?? [];

  return {
    conversations: effectiveData,
    // Only show loading on true first load (no cached data at all)
    isLoading: conversations === undefined && cachedData === undefined,
  };
}

export function useConversation(conversationId: string | undefined) {
  const conversation = useQuery(
    api.features.ai.queries.getConversation,
    conversationId ? { conversationId: conversationId as any } : "skip"
  );
  const cacheKey = `conversation:${conversationId}`;

  // Update cache when we have data
  if (conversation !== undefined && conversationId) {
    dataCache.set(cacheKey, conversation);
  }

  // Use cached data if current result is undefined
  const cachedData = conversationId ? dataCache.get(cacheKey) : undefined;
  const effectiveData = conversation ?? cachedData;

  return {
    conversation: effectiveData,
    isLoading: conversation === undefined && cachedData === undefined,
  };
}

export function useConversationByProfile(aiProfileId: string | undefined) {
  const conversation = useQuery(
    api.features.ai.queries.getConversationByProfile,
    aiProfileId ? { aiProfileId: aiProfileId as any } : "skip"
  );
  const cacheKey = `conversationByProfile:${aiProfileId}`;

  // Update cache when we have data
  if (conversation !== undefined && aiProfileId) {
    dataCache.set(cacheKey, conversation);
  }

  // Use cached data if current result is undefined
  const cachedData = aiProfileId ? dataCache.get(cacheKey) : undefined;
  const effectiveData = conversation ?? cachedData;

  return {
    conversation: effectiveData,
    isLoading: conversation === undefined && cachedData === undefined,
  };
}

export function useStartConversation() {
  const startConversation = useMutation(
    api.features.ai.mutations.startConversation
  );

  return { startConversation };
}
