import { useRef, useCallback, useEffect, useState } from "react";
import type { NativeSyntheticEvent, NativeScrollEvent } from "react-native";

interface ChatListScrollRef {
  scrollToEnd?: (options?: { animated?: boolean }) => void | Promise<void>;
  getState?: () => {
    isNearEnd?: boolean;
    isAtEnd?: boolean;
    contentLength?: number;
  };
}

interface UseChatScrollOptions {
  listRef: React.RefObject<ChatListScrollRef | null>;
  messages: Array<{ _id: string }>;
  conversationId: string | undefined;
  isLoading: boolean;
}

interface UseChatScrollReturn {
  shouldLoadMore: () => boolean;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollToBottom: (animated?: boolean) => void;
  showScrollToBottom: boolean;
}

/**
 * Tracks scroll-to-bottom visibility and guards pagination.
 * Initial positioning and follow-new-message behavior are handled by
 * LegendList's initialScrollAtEnd and maintainScrollAtEnd props.
 */
export function useChatScroll({
  listRef,
  messages,
  conversationId,
  isLoading,
}: UseChatScrollOptions): UseChatScrollReturn {
  const isInitializedRef = useRef(false);
  const prevConversationIdRef = useRef<string | undefined>(undefined);
  const pendingScrollToBottomRef = useRef<{ animated: boolean } | null>(null);
  const showScrollToBottomRef = useRef(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const messagesLength = messages.length;

  if (conversationId !== prevConversationIdRef.current) {
    isInitializedRef.current = false;
    prevConversationIdRef.current = conversationId;
    pendingScrollToBottomRef.current = null;
    showScrollToBottomRef.current = false;
  }

  const updateShowScrollToBottom = useCallback((nextValue: boolean) => {
    if (showScrollToBottomRef.current === nextValue) {
      return;
    }

    showScrollToBottomRef.current = nextValue;
    setShowScrollToBottom(nextValue);
  }, []);

  useEffect(() => {
    updateShowScrollToBottom(false);
  }, [conversationId, updateShowScrollToBottom]);

  useEffect(() => {
    if (isInitializedRef.current) {
      return;
    }
    if (!conversationId || messagesLength === 0 || isLoading) {
      return;
    }

    isInitializedRef.current = true;
    updateShowScrollToBottom(false);
  }, [conversationId, isLoading, messagesLength, updateShowScrollToBottom]);

  useEffect(() => {
    const pendingScroll = pendingScrollToBottomRef.current;
    if (!pendingScroll || messagesLength === 0) {
      return;
    }

    pendingScrollToBottomRef.current = null;
    const frameId = requestAnimationFrame(() => {
      void listRef.current?.scrollToEnd?.({ animated: pendingScroll.animated });
      updateShowScrollToBottom(false);
    });

    return () => cancelAnimationFrame(frameId);
  }, [listRef, messagesLength, updateShowScrollToBottom]);

  const syncScrollToBottomVisibility = useCallback(() => {
    const state = listRef.current?.getState?.();
    if (!state) {
      return;
    }

    const hasContent = (state.contentLength ?? 0) > 0;
    const isNearLatest = state.isNearEnd ?? state.isAtEnd ?? true;
    updateShowScrollToBottom(hasContent && !isNearLatest);
  }, [listRef, updateShowScrollToBottom]);

  const handleScroll = useCallback(
    (_event: NativeSyntheticEvent<NativeScrollEvent>) => {
      syncScrollToBottomVisibility();
    },
    [syncScrollToBottomVisibility],
  );

  const scrollToBottom = useCallback(
    (animated = true) => {
      pendingScrollToBottomRef.current = { animated };
      void listRef.current?.scrollToEnd?.({ animated });
      updateShowScrollToBottom(false);
    },
    [listRef, updateShowScrollToBottom],
  );

  const shouldLoadMore = useCallback(() => {
    return isInitializedRef.current && !isLoading;
  }, [isLoading]);

  return {
    shouldLoadMore,
    handleScroll,
    scrollToBottom,
    showScrollToBottom,
  };
}
