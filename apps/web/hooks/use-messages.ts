"use client";

import { useMutation, useQuery } from "convex/react";
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
      parsed.type === "quiz_answer_check" ||
      parsed.type === "quiz_answer_result" ||
      parsed.type === "image_request" ||
      parsed.type === "image_response" ||
      parsed.type === "image_processing" ||
      parsed.type === "image_failed" ||
      parsed.type === "video_request" ||
      parsed.type === "video_response" ||
      parsed.type === "video_processing" ||
      parsed.type === "video_failed" ||
      parsed.type === "chat_error"
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
  if (typeof msg.text !== "string") {
    return "";
  }

  return hideStructuredPayload
    ? stripStructuredPayloadsFromText(msg.text)
    : msg.text;
}

function processMessage(msg: any, index: number): ProcessedMessage[] {
  const baseId = msg._id || msg.id || msg.key || `msg-${index}`;

  if (msg.role === "user") {
    return [
      {
        _id: baseId,
        _creationTime: msg._creationTime,
        role: msg.role,
        content: extractMessageText(msg, false),
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
      content: extractMessageText(msg, true),
      order: msg.order,
      isStreaming: msg.status === "streaming",
    },
  ];
}

export function useMessages(
  threadId: string | undefined,
  conversationId?: Id<"aiConversations">,
) {
  const mediaDeliveries = useQuery(
    api.features.ai.queries.listConversationMediaDeliveries,
    conversationId ? { conversationId } : "skip",
  );

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

    return filterRedundantMediaRequests(
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
  }, [results, mediaDeliveries]);

  const handleLoadMore = useCallback(() => {
    if (status === "CanLoadMore") {
      loadMore(PAGE_SIZE);
    }
  }, [status, loadMore]);

  const isAITyping = messages.some((m) => m.isStreaming);

  return {
    messages,
    isLoading: status === "LoadingFirstPage",
    isLoadingMore: status === "LoadingMore",
    hasMore: status === "CanLoadMore",
    loadMore: handleLoadMore,
    isAITyping,
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
