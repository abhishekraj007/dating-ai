"use client";

import { useMutation } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { useUIMessages } from "@convex-dev/agent/react";
import type { Id } from "@dating-ai/backend/convex/_generated/dataModel";
import { useMemo, useCallback } from "react";

const PAGE_SIZE = 20;

interface ProcessedMessage {
  _id: string;
  _creationTime: number;
  role: string;
  content: string;
  order: number;
  isStreaming: boolean;
}

function extractToolOutputs(msg: any): string[] {
  const outputs: string[] = [];

  if (msg.parts && Array.isArray(msg.parts)) {
    for (const part of msg.parts) {
      if (
        part.type?.startsWith("tool-") &&
        part.output &&
        part.state === "output-available"
      ) {
        try {
          const parsed = JSON.parse(part.output);
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
          // Not valid JSON
        }
      }

      if (part.type === "text" && part.text && part.state === "done") {
        try {
          const parsed = JSON.parse(part.text);
          if (parsed.type === "image_response") {
            outputs.push(part.text);
          }
        } catch {
          // Not valid JSON
        }
      }
    }
  }

  return outputs;
}

function processMessage(msg: any, index: number): ProcessedMessage[] {
  const baseId = msg._id || msg.id || msg.key || `msg-${index}`;

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

  const toolOutputs = extractToolOutputs(msg);

  if (toolOutputs.length > 0) {
    return toolOutputs.map((output, i) => ({
      _id: `${baseId}-tool-${i}`,
      _creationTime: msg._creationTime + i,
      role: msg.role,
      content: output,
      order: msg.order,
      isStreaming: false,
    }));
  }

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

export function useMessages(threadId: string | undefined) {
  const { results, status, loadMore } = useUIMessages(
    // Type assertion needed due to library version type mismatch
    api.features.ai.queries.listThreadMessages as any,
    threadId ? { threadId } : "skip",
    { initialNumItems: PAGE_SIZE },
  );

  const messages = useMemo(() => {
    if (!results || results.length === 0) return [];

    const allMessages: ProcessedMessage[] = [];
    results.forEach((msg: any, index: number) => {
      const processed = processMessage(msg, index);
      allMessages.push(...processed);
    });

    allMessages.sort((a, b) => a.order - b.order);

    return allMessages;
  }, [results]);

  const handleLoadMore = useCallback(() => {
    if (status === "CanLoadMore") {
      loadMore(PAGE_SIZE);
    }
  }, [status, loadMore]);

  return {
    messages,
    isLoading: status === "LoadingFirstPage",
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

  const clearChat = async (conversationId: string) => {
    return await clearChatMutation({
      conversationId: conversationId as Id<"aiConversations">,
    });
  };

  return { clearChat };
}
