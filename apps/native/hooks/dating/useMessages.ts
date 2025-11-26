import { useQuery, useMutation } from "convex/react";
import { api } from "@dating-ai/backend";
import { useMemo } from "react";
import { Id } from "@dating-ai/backend/convex/_generated/dataModel";

const PAGE_SIZE = 10; // Load more messages for better UX

// Global cache to store last known data for each query
const dataCache = new Map<string, any>();

interface ProcessedMessage {
  _id: string;
  _creationTime: number;
  role: string;
  content: string;
  order: number;
  isStreaming: boolean;
}

/**
 * Extract all structured tool outputs from message parts.
 * Returns an array since a single message can have multiple tool calls.
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
            parsed.type === "image_request"
          ) {
            outputs.push(part.output);
          }
        } catch {
          // Not valid JSON, skip
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
  const baseId = msg._id || msg.id || `msg-${index}`;

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
      isStreaming: false,
    },
  ];
}

/**
 * Simple hook for fetching messages without pagination.
 * Uses Convex's reactive queries for real-time updates.
 */
export function useMessages(conversationId: string | undefined) {
  // Stable reference for stream args
  const streamArgs = useMemo(() => ({ kind: "list" as const }), []);
  const cacheKey = `messages:${conversationId}`;

  // Single query - Convex handles reactivity
  const messagesResult = useQuery(
    api.features.ai.queries.getMessages,
    conversationId
      ? {
          conversationId: conversationId as any,
          paginationOpts: { numItems: PAGE_SIZE, cursor: null },
          streamArgs,
        }
      : "skip"
  );

  // Update cache when we have data
  if (messagesResult !== undefined && conversationId) {
    dataCache.set(cacheKey, messagesResult);
  }

  // Use cached data if current result is undefined
  const cachedData = conversationId ? dataCache.get(cacheKey) : undefined;
  const effectiveResult = messagesResult ?? cachedData;

  // Process messages - only recalculate when data changes
  const messages = useMemo(() => {
    if (!effectiveResult?.page) return [];

    const allMessages: ProcessedMessage[] = [];
    effectiveResult.page.forEach((msg: any, index: number) => {
      const processed = processMessage(msg, index);
      allMessages.push(...processed);
    });

    return allMessages;
  }, [effectiveResult?.page]);

  return {
    messages,
    // Only show loading on true first load (no cached data at all)
    isLoading: messagesResult === undefined && cachedData === undefined,
    hasMore: effectiveResult ? !effectiveResult.isDone : false,
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
