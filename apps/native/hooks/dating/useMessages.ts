import { useMutation } from "convex/react";
import { api } from "@dating-ai/backend";
import { useMemo, useCallback, useEffect } from "react";
import { Id } from "@dating-ai/backend/convex/_generated/dataModel";
import { useUIMessages } from "@convex-dev/agent/react";

const PAGE_SIZE = 20;

interface ProcessedMessage {
  _id: string;
  _creationTime: number;
  role: string;
  content: string;
  order: number;
  isStreaming: boolean;
}

// Global cache for messages - persists across component remounts
const messagesCache = new Map<string, ProcessedMessage[]>();

// Get cached messages for a thread
function getCachedMessages(threadId: string): ProcessedMessage[] | null {
  return messagesCache.get(threadId) ?? null;
}

// Update cache for a thread
function updateCache(threadId: string, messages: ProcessedMessage[]): void {
  messagesCache.set(threadId, messages);
}

/**
 * Extract all structured tool outputs from message parts.
 * Returns an array since a single message can have multiple tool calls.
 * Also extracts structured content from text parts (like image_response).
 */
function extractToolOutputs(msg: any): string[] {
  const outputs: string[] = [];

  if (msg.parts && Array.isArray(msg.parts)) {
    for (const part of msg.parts) {
      // Check for tool calls with structured output
      if (
        part.type?.startsWith("tool-") &&
        part.output &&
        part.state === "output-available"
      ) {
        try {
          const parsed = JSON.parse(part.output);
          // If it's a structured type we care about, add it
          if (
            parsed.type === "quiz_question" ||
            parsed.type === "quiz_start" ||
            parsed.type === "quiz_end" ||
            parsed.type === "quiz_answer_result" ||
            parsed.type === "image_request" ||
            parsed.type === "image_response"
          ) {
            outputs.push(part.output);
          }
        } catch {
          // Not valid JSON, skip
        }
      }

      // Also check text parts for structured content (like image_response)
      // These are added as separate messages by the image generation action
      if (part.type === "text" && part.text && part.state === "done") {
        try {
          const parsed = JSON.parse(part.text);
          // Only extract image_response from text parts
          // (other structured types come from tool outputs)
          if (parsed.type === "image_response") {
            outputs.push(part.text);
          }
        } catch {
          // Not valid JSON, skip (most text parts are plain text)
        }
      }
    }
  }

  return outputs;
}

/**
 * Process a raw message into one or more processed messages.
 * A single agent message with multiple tool calls becomes multiple UI messages.
 */
function processMessage(msg: any, index: number): ProcessedMessage[] {
  const baseId = msg._id || msg.id || msg.key || `msg-${index}`;

  // For user messages, just use text
  if (msg.role === "user") {
    return [
      {
        _id: baseId,
        _creationTime: msg._creationTime,
        role: msg.role,
        content: msg.text || "",
        order: msg.order,
        isStreaming: false,
      },
    ];
  }

  // For assistant messages, extract tool outputs
  const toolOutputs = extractToolOutputs(msg);

  // If we have structured tool outputs, create a message for each
  if (toolOutputs.length > 0) {
    return toolOutputs.map((output, i) => ({
      _id: `${baseId}-tool-${i}`,
      _creationTime: msg._creationTime + i, // Slight offset for ordering
      role: msg.role,
      content: output,
      order: msg.order,
      isStreaming: false,
    }));
  }

  // Fallback to plain text
  return [
    {
      _id: baseId,
      _creationTime: msg._creationTime,
      role: msg.role,
      content: msg.text || "",
      order: msg.order,
      isStreaming: msg.status === "streaming",
    },
  ];
}

/**
 * Hook for fetching messages with infinite scroll pagination.
 * Uses the @convex-dev/agent/react useUIMessages hook for proper pagination.
 * Implements caching to prevent flickering on screen revisits.
 *
 * @param threadId - The thread ID from the conversation
 */
export function useMessages(threadId: string | undefined) {
  // Use the useUIMessages hook from @convex-dev/agent/react
  // This handles pagination internally and accumulates pages
  const { results, status, loadMore } = useUIMessages(
    api.features.ai.queries.listThreadMessages,
    threadId ? { threadId } : "skip",
    { initialNumItems: PAGE_SIZE }
  );

  // Get cached messages for this thread (computed once per threadId change)
  const cachedMessages = useMemo(() => {
    if (!threadId) return [];
    return getCachedMessages(threadId) ?? [];
  }, [threadId]);

  // Process all accumulated messages from the query
  const processedMessages = useMemo(() => {
    if (!results || results.length === 0) return [];

    const allMessages: ProcessedMessage[] = [];
    results.forEach((msg: any, index: number) => {
      const processed = processMessage(msg, index);
      allMessages.push(...processed);
    });

    // Sort by order to ensure correct sequence
    allMessages.sort((a, b) => a.order - b.order);

    return allMessages;
  }, [results]);

  // Merge fresh messages with cached messages
  // This ensures we don't lose older messages when returning to the screen
  const messages = useMemo(() => {
    if (!threadId) return [];

    // If still loading first page, show cached messages
    if (status === "LoadingFirstPage") {
      return cachedMessages;
    }

    // If no fresh messages yet, return cache
    if (processedMessages.length === 0) {
      return cachedMessages;
    }

    // If cache is empty or smaller, just use fresh messages
    if (cachedMessages.length <= processedMessages.length) {
      return processedMessages;
    }

    // IMPORTANT: Cache has MORE messages than current query results
    // This happens when user loaded older messages, left, and came back
    // We need to merge: use fresh data for recent messages, cache for older ones

    // Find the oldest message in fresh data
    const oldestFreshOrder = Math.min(...processedMessages.map((m) => m.order));

    // Get older messages from cache that aren't in fresh data
    const olderFromCache = cachedMessages.filter(
      (m) => m.order < oldestFreshOrder
    );

    // Combine: older cached messages + fresh messages
    const merged = [...olderFromCache, ...processedMessages];

    // Sort by order
    merged.sort((a, b) => a.order - b.order);

    return merged;
  }, [threadId, processedMessages, status, cachedMessages]);

  // Update cache whenever we have messages to cache
  // This happens after messages are computed to include merged results
  useEffect(() => {
    if (threadId && messages.length > 0) {
      // Only update cache if current messages are more than cached
      const currentCache = getCachedMessages(threadId);
      if (!currentCache || messages.length >= currentCache.length) {
        updateCache(threadId, messages);
      }
    }
  }, [threadId, messages]);

  // Memoized loadMore function
  const handleLoadMore = useCallback(() => {
    if (status === "CanLoadMore") {
      loadMore(PAGE_SIZE);
    }
  }, [status, loadMore]);

  // Only show loading skeleton if:
  // 1. It's the first page load AND
  // 2. We don't have any messages to show (neither fresh nor cached)
  const isFirstTimeLoading =
    status === "LoadingFirstPage" && messages.length === 0;

  return {
    messages,
    isLoading: isFirstTimeLoading,
    isLoadingMore: status === "LoadingMore",
    hasMore: status === "CanLoadMore",
    loadMore: handleLoadMore,
  };
}

export function useSendMessage() {
  const sendMessage = useMutation(api.features.ai.mutations.sendMessage);

  return { sendMessage };
}

export function useDeleteMessage() {
  const deleteMessageMutation = useMutation(
    api.features.ai.mutations.deleteMessage
  );

  const deleteMessage = async (
    conversationId: string,
    messageOrder: number
  ) => {
    return await deleteMessageMutation({
      conversationId: conversationId as Id<"aiConversations">,
      messageOrder,
    });
  };

  return { deleteMessage };
}

export function useClearChat() {
  const clearChatMutation = useMutation(api.features.ai.mutations.clearChat);

  const clearChat = async (conversationId: string, threadId?: string) => {
    // Clear local cache for the old thread if provided
    if (threadId) {
      messagesCache.delete(threadId);
    }

    const result = await clearChatMutation({
      conversationId: conversationId as Id<"aiConversations">,
    });

    // Also clear cache for the new thread (in case there's stale data)
    if (result.newThreadId) {
      messagesCache.delete(result.newThreadId);
    }

    return result;
  };

  return { clearChat };
}
