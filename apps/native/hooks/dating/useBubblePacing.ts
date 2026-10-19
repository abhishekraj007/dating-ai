import { useEffect, useMemo, useRef, useState } from "react";
import type { ProcessedMessage } from "./useMessages";

const BASE_TYPING_MS = 600;
const TYPING_MS_PER_CHAR = 30;
const MAX_TYPING_MS = 2000;

function getTypingDelay(length: number) {
  return Math.min(MAX_TYPING_MS, BASE_TYPING_MS + length * TYPING_MS_PER_CHAR);
}

function getMaxOrder(messages: ProcessedMessage[]) {
  return messages.reduce((max, message) => Math.max(max, message.order), -1);
}

function getTrailingReplyStart(messages: ProcessedMessage[]) {
  const last = messages[messages.length - 1];

  if (!last || last.role !== "assistant" || last.bubbleIndex === undefined) {
    return -1;
  }

  let start = messages.length - 1;
  while (
    start > 0 &&
    messages[start - 1].role === "assistant" &&
    messages[start - 1].bubbleIndex !== undefined &&
    messages[start - 1].order === last.order
  ) {
    start -= 1;
  }

  return start;
}

interface UseBubblePacingOptions {
  messages: ProcessedMessage[];
  conversationKey: string | null;
  isLoading: boolean;
  isStopRequested: boolean;
}

export function useBubblePacing({
  messages,
  conversationKey,
  isLoading,
  isStopRequested,
}: UseBubblePacingOptions) {
  const baselineRef = useRef<{ key: string; maxOrder: number } | null>(null);
  const [reveal, setReveal] = useState({
    key: "",
    order: -1,
    count: 1,
    at: 0,
  });

  if (
    !isLoading &&
    conversationKey &&
    baselineRef.current?.key !== conversationKey
  ) {
    baselineRef.current = {
      key: conversationKey,
      maxOrder: getMaxOrder(messages),
    };
  }

  const baselineOrder =
    baselineRef.current?.maxOrder ?? Number.MAX_SAFE_INTEGER;
  const start = getTrailingReplyStart(messages);
  const groupOrder =
    start >= 0 && messages[start].order > baselineOrder
      ? messages[start].order
      : null;
  const isSameGroup =
    groupOrder !== null &&
    reveal.key === conversationKey &&
    reveal.order === groupOrder;
  const count = isSameGroup ? reveal.count : 1;
  const hidden =
    groupOrder !== null && !isStopRequested
      ? Math.max(0, messages.length - start - count)
      : 0;
  const nextBubble = hidden > 0 ? messages[start + count] : undefined;
  const nextLength = nextBubble?.content.length ?? 0;

  useEffect(() => {
    if (groupOrder === null || !conversationKey) {
      return;
    }

    setReveal((current) =>
      current.key === conversationKey && current.order === groupOrder
        ? current
        : { key: conversationKey, order: groupOrder, count: 1, at: Date.now() },
    );
  }, [conversationKey, groupOrder]);

  useEffect(() => {
    if (
      hidden === 0 ||
      !isSameGroup ||
      groupOrder === null ||
      !conversationKey
    ) {
      return;
    }

    const delay = Math.max(
      0,
      reveal.at + getTypingDelay(nextLength) - Date.now(),
    );
    const timeoutId = setTimeout(() => {
      setReveal({
        key: conversationKey,
        order: groupOrder,
        count: reveal.count + 1,
        at: Date.now(),
      });
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [conversationKey, groupOrder, hidden, isSameGroup, nextLength, reveal]);

  const pacedMessages = useMemo(
    () => (hidden > 0 ? messages.slice(0, messages.length - hidden) : messages),
    [messages, hidden],
  );

  return {
    messages: pacedMessages,
    isPacingPending: hidden > 0,
    typingRenderKey: nextBubble?.renderKey,
  };
}
