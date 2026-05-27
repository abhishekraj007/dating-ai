import { useMutation, useQuery } from "convex/react";
import { api } from "@dating-ai/backend";
import { useMemo, useCallback, useEffect, useState } from "react";
import { Id } from "@dating-ai/backend/convex/_generated/dataModel";
import { useUIMessages } from "@convex-dev/agent/react";

const PAGE_SIZE = 20;

// Store for optimistic messages per thread (triggers re-render via useState)
type OptimisticMessage = ProcessedMessage & { isOptimistic: true };

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

function getStructuredMessagePayload(value: string): string | null {
  try {
    const parsed = JSON.parse(value);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.type !== "string"
    ) {
      return null;
    }

    if (
      parsed.type === "quiz_question" ||
      parsed.type === "quiz_start" ||
      parsed.type === "quiz_end" ||
      parsed.type === "quiz_answer_result" ||
      parsed.type === "image_request" ||
      parsed.type === "image_response" ||
      parsed.type === "image_processing" ||
      parsed.type === "image_failed" ||
      parsed.type === "video_request" ||
      parsed.type === "video_response" ||
      parsed.type === "video_processing" ||
      parsed.type === "video_failed" ||
      parsed.type === "chat_error" ||
      parsed.type === "credits_required"
    ) {
      return JSON.stringify(parsed);
    }
  } catch {
    // Not valid JSON, treat as plain text.
  }

  return null;
}

function extractStructuredPayloadsFromText(value: string): string[] {
  const payloads: string[] = [];

  for (let start = 0; start < value.length; start += 1) {
    if (value[start] !== "{") {
      continue;
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < value.length; index += 1) {
      const char = value[index];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) {
        continue;
      }

      if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
      }

      if (depth === 0) {
        const candidate = value.slice(start, index + 1);
        const payload = getStructuredMessagePayload(candidate);
        if (payload) {
          payloads.push(payload);
          start = index;
        }
        break;
      }
    }
  }

  return payloads;
}

function stripStructuredPayloadsFromText(value: string): string {
  let stripped = value;
  for (const payload of extractStructuredPayloadsFromText(value)) {
    stripped = stripped.replace(payload, "");
  }
  return stripped.replace(/\n{3,}/g, "\n\n").trim();
}

type ParsedMediaPayload = {
  type: string;
  requestId?: string;
};

function parseMediaPayload(content: string): ParsedMediaPayload | null {
  const payload = getStructuredMessagePayload(content);
  if (!payload) {
    return null;
  }

  const parsed = JSON.parse(payload) as ParsedMediaPayload;
  if (
    !parsed.type.startsWith("image_") &&
    !parsed.type.startsWith("video_")
  ) {
    return null;
  }

  return parsed;
}

function mediaPayloadPriority(type: string): number {
  if (type.endsWith("_failed")) {
    return 4;
  }
  if (type.endsWith("_response")) {
    return 3;
  }
  if (type.endsWith("_processing")) {
    return 2;
  }
  if (type.endsWith("_request")) {
    return 1;
  }
  return 0;
}

function dedupeMediaPayloads(payloads: string[]): string[] {
  const bestByRequest = new Map<string, { payload: string; priority: number }>();
  const passthrough: string[] = [];

  for (const payload of payloads) {
    const parsed = parseMediaPayload(payload);
    if (!parsed?.requestId) {
      passthrough.push(payload);
      continue;
    }

    const mediaKind = parsed.type.startsWith("video_") ? "video" : "image";
    const key = `${mediaKind}:${parsed.requestId}`;
    const priority = mediaPayloadPriority(parsed.type);
    const existing = bestByRequest.get(key);

    if (!existing || priority >= existing.priority) {
      bestByRequest.set(key, { payload, priority });
    }
  }

  return [...passthrough, ...Array.from(bestByRequest.values()).map((entry) => entry.payload)];
}

function isMediaToolAgentMessage(msg: any): boolean {
  if (!msg.parts || !Array.isArray(msg.parts)) {
    return false;
  }

  return msg.parts.some(
    (part: any) =>
      part.type === "tool-call" &&
      (part.toolName === "generateVideo" || part.toolName === "generateImage"),
  );
}

function appendStructuredPayloadsFromText(
  outputs: string[],
  value: unknown,
): void {
  if (typeof value !== "string") {
    return;
  }

  for (const payload of extractStructuredPayloadsFromText(value)) {
    outputs.push(payload);
  }
}

type MediaDelivery = {
  requestId: string;
  responseMessageId?: string;
  createdAt: number;
  content: string;
};

function findAnchorOrder(
  messages: ProcessedMessage[],
  createdAt: number,
): number {
  let anchorOrder = 0;

  for (const message of messages) {
    if (message.role === "user" && message._creationTime <= createdAt) {
      anchorOrder = message.order;
    }
  }

  return anchorOrder;
}

function applyAuthoritativeMediaDeliveries(
  messages: ProcessedMessage[],
  deliveries: MediaDelivery[] | undefined,
): ProcessedMessage[] {
  if (!deliveries || deliveries.length === 0) {
    return messages;
  }

  const verifiedRequestIds = new Set(
    deliveries.map((delivery) => delivery.requestId),
  );

  let result = messages.filter((message) => {
    const parsed = parseMediaPayload(message.content);
    if (
      !parsed?.requestId ||
      !parsed.type.endsWith("_response") ||
      !message._id.includes("-tool-")
    ) {
      return true;
    }

    return verifiedRequestIds.has(parsed.requestId);
  });

  for (const delivery of deliveries) {
    if (!delivery.responseMessageId) {
      continue;
    }

    const existingIndex = result.findIndex(
      (message) => message._id === delivery.responseMessageId,
    );

    if (existingIndex >= 0) {
      result[existingIndex] = {
        ...result[existingIndex],
        content: delivery.content,
      };
      continue;
    }

    result.push({
      _id: delivery.responseMessageId,
      _creationTime: delivery.createdAt,
      role: "assistant",
      content: delivery.content,
      order: findAnchorOrder(result, delivery.createdAt),
      isStreaming: false,
    });
  }

  result.sort((a, b) => a.order - b.order);
  return result;
}

function filterDropToolSplitMediaDelivery(
  messages: ProcessedMessage[],
): ProcessedMessage[] {
  return messages.filter((message) => {
    if (!message._id.includes("-tool-")) {
      return true;
    }

    const parsed = parseMediaPayload(message.content);
    if (!parsed) {
      return true;
    }

    return (
      !parsed.type.endsWith("_processing") &&
      !parsed.type.endsWith("_response") &&
      !parsed.type.endsWith("_failed")
    );
  });
}

function dedupeIdenticalStructuredMessages(
  messages: ProcessedMessage[],
): ProcessedMessage[] {
  const seen = new Set<string>();

  return messages.filter((message) => {
    const key = `${message.order}:${message.content}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function filterSupersededMediaMessages(
  messages: ProcessedMessage[],
): ProcessedMessage[] {
  const resolvedRequests = new Set<string>();

  for (const message of messages) {
    const parsed = parseMediaPayload(message.content);
    if (!parsed?.requestId) {
      continue;
    }

    if (
      parsed.type.endsWith("_failed") ||
      parsed.type.endsWith("_response")
    ) {
      const mediaKind = parsed.type.startsWith("video_") ? "video" : "image";
      resolvedRequests.add(`${mediaKind}:${parsed.requestId}`);
    }
  }

  return messages.filter((message) => {
    const parsed = parseMediaPayload(message.content);
    if (!parsed?.requestId || !parsed.type.endsWith("_processing")) {
      return true;
    }

    const mediaKind = parsed.type.startsWith("video_") ? "video" : "image";
    return !resolvedRequests.has(`${mediaKind}:${parsed.requestId}`);
  });
}

function dedupeMediaResponsesAcrossMessages(
  messages: ProcessedMessage[],
): ProcessedMessage[] {
  const preferredResponseByRequest = new Map<string, ProcessedMessage>();

  for (const message of messages) {
    const parsed = parseMediaPayload(message.content);
    if (!parsed?.requestId || !parsed.type.endsWith("_response")) {
      continue;
    }

    const mediaKind = parsed.type.startsWith("video_") ? "video" : "image";
    const key = `${mediaKind}:${parsed.requestId}`;
    const existing = preferredResponseByRequest.get(key);
    const isStandalone = !message._id.includes("-tool-");

    if (
      !existing ||
      (isStandalone && existing._id.includes("-tool-"))
    ) {
      preferredResponseByRequest.set(key, message);
    }
  }

  return messages.filter((message) => {
    const parsed = parseMediaPayload(message.content);
    if (!parsed?.requestId || !parsed.type.endsWith("_response")) {
      return true;
    }

    const mediaKind = parsed.type.startsWith("video_") ? "video" : "image";
    const key = `${mediaKind}:${parsed.requestId}`;
    return preferredResponseByRequest.get(key) === message;
  });
}

function filterRedundantMediaRequests(
  messages: ProcessedMessage[],
): ProcessedMessage[] {
  return messages.filter((message) => {
    const parsed = parseMediaPayload(message.content);
    if (!parsed?.type.endsWith("_request")) {
      return true;
    }

    const mediaKind = parsed.type.startsWith("video_") ? "video" : "image";

    return !messages.some((other) => {
      if (other._id === message._id || other._id.includes("-tool-")) {
        return false;
      }

      const otherParsed = parseMediaPayload(other.content);
      if (!otherParsed) {
        return false;
      }

      const isRelatedState =
        otherParsed.type === `${mediaKind}_processing` ||
        otherParsed.type === `${mediaKind}_response`;

      return (
        isRelatedState &&
        Math.abs(other.order - message.order) <= 1
      );
    });
  });
}

/**
 * Extract all structured tool outputs from message parts.
 * Returns an array since a single message can have multiple tool calls.
 * Also extracts structured content from text parts.
 */
function extractToolOutputs(msg: any): string[] {
  const outputs: string[] = [];

  appendStructuredPayloadsFromText(outputs, msg.text);
  appendStructuredPayloadsFromText(outputs, msg.content);

  if (
    msg.message &&
    typeof msg.message === "object" &&
    "content" in msg.message
  ) {
    appendStructuredPayloadsFromText(outputs, msg.message.content);
  }

  if (msg.parts && Array.isArray(msg.parts)) {
    for (const part of msg.parts) {
      if (
        part.type?.startsWith("tool-") &&
        part.output &&
        part.state === "output-available"
      ) {
        appendStructuredPayloadsFromText(outputs, part.output);
      }

      if (part.type === "text" && part.text && part.state === "done") {
        appendStructuredPayloadsFromText(outputs, part.text);
      }
    }
  }

  const uniquePayloads = [...new Set(outputs)];
  const deduped = dedupeMediaPayloads(uniquePayloads);

  if (!isMediaToolAgentMessage(msg)) {
    return deduped;
  }

  return deduped.filter((payload) => {
    const parsed = parseMediaPayload(payload);
    return !parsed || parsed.type.endsWith("_request");
  });
}

function extractMessageText(
  msg: any,
  hideStructuredPayload: boolean,
): string {
  if (msg.parts && Array.isArray(msg.parts)) {
    const textFromParts = msg.parts
      .filter(
        (part: any) =>
          part.type === "text" &&
          typeof part.text === "string" &&
          part.text.trim() !== "" &&
          stripStructuredPayloadsFromText(part.text) !== "",
      )
      .map((part: any) => stripStructuredPayloadsFromText(part.text))
      .join(" ")
      .trim();

    if (textFromParts) {
      return textFromParts;
    }
  }

  if (typeof msg.text !== "string") {
    return "";
  }

  return hideStructuredPayload
    ? stripStructuredPayloadsFromText(msg.text)
    : msg.text;
}

function hasVisibleAssistantContent(msg: any): boolean {
  return (
    extractToolOutputs(msg).length > 0 ||
    extractMessageText(msg, true).trim() !== ""
  );
}

/**
 * Process a raw message into one or more processed messages.
 * A single agent message with multiple tool calls becomes multiple UI messages.
 */
function processMessage(msg: any, index: number): ProcessedMessage[] {
  const baseId = msg._id || msg.id || msg.key || `msg-${index}`;
  const messageText = extractMessageText(msg, msg.role !== "user");

  // For user messages, just use text
  if (msg.role === "user") {
    return [
      {
        _id: baseId,
        _creationTime: msg._creationTime,
        role: msg.role,
        content: messageText,
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
      content: messageText,
      order: msg.order,
      isStreaming: msg.status === "streaming",
    },
  ];
}

// Global state for optimistic messages - shared across hook instances
let optimisticMessagesMap: Map<string, ProcessedMessage[]> = new Map();
let optimisticListeners: Map<string, Set<() => void>> = new Map();

function addOptimisticMessage(threadId: string, message: ProcessedMessage) {
  const current = optimisticMessagesMap.get(threadId) ?? [];
  optimisticMessagesMap.set(threadId, [...current, message]);
  // Notify listeners
  optimisticListeners.get(threadId)?.forEach((cb) => cb());
}

function clearOptimisticMessages(threadId: string) {
  optimisticMessagesMap.set(threadId, []);
  optimisticListeners.get(threadId)?.forEach((cb) => cb());
}

function removeOptimisticMessage(threadId: string, messageId: string) {
  const current = optimisticMessagesMap.get(threadId) ?? [];
  optimisticMessagesMap.set(
    threadId,
    current.filter((message) => message._id !== messageId),
  );
  optimisticListeners.get(threadId)?.forEach((cb) => cb());
}

function getOptimisticMessages(threadId: string): ProcessedMessage[] {
  return optimisticMessagesMap.get(threadId) ?? [];
}

/**
 * Hook for fetching messages with infinite scroll pagination.
 * Uses the @convex-dev/agent/react useUIMessages hook for proper pagination.
 * Implements caching to prevent flickering on screen revisits.
 *
 * @param threadId - The thread ID from the conversation
 * @param conversationId - Conversation ID for authoritative media delivery state
 */
export function useMessages(
  threadId: string | undefined,
  conversationId?: Id<"aiConversations">,
) {
  const mediaDeliveries = useQuery(
    api.features.ai.queries.listConversationMediaDeliveries,
    conversationId ? { conversationId } : "skip",
  );

  // Local state to trigger re-renders when optimistic messages change
  const [optimisticVersion, setOptimisticVersion] = useState(0);

  // Subscribe to optimistic message changes for this thread
  useEffect(() => {
    if (!threadId) return;
    const listener = () => setOptimisticVersion((v) => v + 1);
    if (!optimisticListeners.has(threadId)) {
      optimisticListeners.set(threadId, new Set());
    }
    optimisticListeners.get(threadId)!.add(listener);
    return () => {
      optimisticListeners.get(threadId)?.delete(listener);
    };
  }, [threadId]);

  // Use the useUIMessages hook from @convex-dev/agent/react
  // This handles pagination internally and accumulates pages
  const { results, status, loadMore } = useUIMessages(
    api.features.ai.queries.listThreadMessages,
    threadId ? { threadId } : "skip",
    { initialNumItems: PAGE_SIZE, stream: true },
  );

  // Get cached messages for this thread (computed once per threadId change)
  const cachedMessages = useMemo(() => {
    if (!threadId) return [];
    return getCachedMessages(threadId) ?? [];
  }, [threadId]);

  // Process all accumulated messages from the query
  const { processedMessages, hasStreamingMessage } = useMemo(() => {
    if (!results || results.length === 0) {
      return { processedMessages: [], hasStreamingMessage: false };
    }

    const allMessages: ProcessedMessage[] = [];

    results.forEach((msg: any, index: number) => {
      const hasVisibleContent =
        msg.role !== "assistant" || hasVisibleAssistantContent(msg);

      if (msg.role === "assistant" && !hasVisibleContent) {
        return;
      }

      const processed = processMessage(msg, index);
      allMessages.push(...processed);
    });

    // Sort by order to ensure correct sequence
    allMessages.sort((a, b) => a.order - b.order);
    const visibleMessages = filterRedundantMediaRequests(
      dedupeIdenticalStructuredMessages(
        dedupeMediaResponsesAcrossMessages(
          filterSupersededMediaMessages(
            filterDropToolSplitMediaDelivery(
              applyAuthoritativeMediaDeliveries(allMessages, mediaDeliveries),
            ),
          ),
        ),
      ),
    );

    const lastRawMessage = results[results.length - 1];
    const hasStreamingTail =
      lastRawMessage?.role === "assistant" &&
      (lastRawMessage.status === "streaming" ||
        lastRawMessage.status === "pending") &&
      !hasVisibleAssistantContent(lastRawMessage);

    return {
      processedMessages: visibleMessages,
      hasStreamingMessage: hasStreamingTail,
    };
  }, [results, mediaDeliveries]);

  // Get optimistic messages for this thread
  const optimisticMessages = useMemo(() => {
    if (!threadId) return [];
    return getOptimisticMessages(threadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, optimisticVersion]);

  // Clear optimistic messages when real messages arrive with matching content
  useEffect(() => {
    if (!threadId || processedMessages.length === 0) return;
    const optimistic = getOptimisticMessages(threadId);
    if (optimistic.length === 0) return;

    // Check if any optimistic message content now exists in real messages
    const realContents = new Set(
      processedMessages.filter((m) => m.role === "user").map((m) => m.content),
    );
    const hasMatchingReal = optimistic.some((o) => realContents.has(o.content));

    if (hasMatchingReal) {
      clearOptimisticMessages(threadId);
    }
  }, [threadId, processedMessages]);

  // Merge fresh messages with cached messages and optimistic messages
  const messages = useMemo(() => {
    if (!threadId) return [];

    // Start with base messages
    let baseMessages: ProcessedMessage[] = [];

    // If still loading first page, show cached messages
    if (status === "LoadingFirstPage") {
      baseMessages = cachedMessages;
    } else if (processedMessages.length === 0) {
      baseMessages = cachedMessages;
    } else if (cachedMessages.length <= processedMessages.length) {
      baseMessages = processedMessages;
    } else {
      // Merge cache with fresh
      const oldestFreshOrder = Math.min(
        ...processedMessages.map((m) => m.order),
      );
      const olderFromCache = cachedMessages.filter(
        (m) => m.order < oldestFreshOrder,
      );
      baseMessages = [...olderFromCache, ...processedMessages];
    }

    // Filter out optimistic messages whose content already exists in real messages
    // This prevents a transient double-count (real + optimistic) that causes scroll jitter
    const realUserContents = new Set(
      baseMessages.filter((m) => m.role === "user").map((m) => m.content),
    );
    const activeOptimistic = optimisticMessages.filter(
      (o) => !realUserContents.has(o.content),
    );

    const allMessages = [...baseMessages, ...activeOptimistic];

    // Sort by order
    allMessages.sort((a, b) => a.order - b.order);

    // Final filter: remove any assistant messages with empty content
    // This catches edge cases from cache or merged results
    return allMessages.filter(
      (m) => m.role === "user" || (m.content && m.content.trim() !== ""),
    );
  }, [threadId, processedMessages, status, cachedMessages, optimisticMessages]);

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
    isAITyping: hasStreamingMessage,
  };
}

export function useSendMessage() {
  const sendMessage = useMutation(api.features.ai.mutations.sendMessage);
  const retryFailedResponse = useMutation(
    api.features.ai.mutations.retryFailedResponse,
  );
  const stopResponseMutation = useMutation(
    api.features.ai.mutations.stopResponse,
  );

  // Enhanced send with local optimistic update for instant feedback
  const sendMessageWithOptimistic = (
    args: {
      conversationId: Id<"aiConversations">;
      content: string;
      platform?: "ios" | "android" | "web";
    },
    threadId?: string,
  ) => {
    // Add optimistic message immediately for instant UI feedback
    if (threadId) {
      const cachedMessages = getCachedMessages(threadId) ?? [];
      const maxOrder =
        cachedMessages.length > 0
          ? Math.max(...cachedMessages.map((m) => m.order)) + 1
          : 0;

      const optimisticMessage: ProcessedMessage = {
        _id: `optimistic-${Date.now()}`,
        _creationTime: Date.now(),
        role: "user",
        content: args.content,
        order: maxOrder + 0.5, // Use .5 to ensure it sorts after real messages with same order
        isStreaming: false,
      };

      // Add to optimistic messages (triggers re-render via listener)
      addOptimisticMessage(threadId, optimisticMessage);

      return sendMessage(args).catch((error) => {
        removeOptimisticMessage(threadId, optimisticMessage._id);
        throw error;
      });
    }

    return sendMessage(args);
  };

  const retryMessage = (args: {
    conversationId: Id<"aiConversations">;
    promptMessageId: string;
  }) => {
    return retryFailedResponse(args);
  };

  const stopResponse = (args: { conversationId: Id<"aiConversations"> }) => {
    return stopResponseMutation(args);
  };

  return { sendMessage, sendMessageWithOptimistic, retryMessage, stopResponse };
}

export function useDeleteMessage() {
  const deleteMessageMutation = useMutation(
    api.features.ai.mutations.deleteMessage,
  );

  const deleteMessage = async (
    conversationId: string,
    messageOrder: number,
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
