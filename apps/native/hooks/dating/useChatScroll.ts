import { useRef, useCallback, useEffect } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

interface UseChatScrollOptions {
  /** The list ref to control scrolling */
  listRef: React.RefObject<any>;
  /** Messages array */
  messages: Array<{ _id: string; [key: string]: any }>;
  /** Conversation/chat ID */
  conversationId: string | undefined;
  /** Whether messages are still loading */
  isLoading: boolean;
}

interface UseChatScrollReturn {
  /** Call this when onStartReached fires to check if loading should proceed */
  shouldLoadMore: () => boolean;
  /** Handler for FlashList onScroll to track position */
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Scroll to bottom (call when user sends message) */
  scrollToBottom: (animated?: boolean) => void;
}

const NEAR_BOTTOM_THRESHOLD = 150;
const INITIAL_SCROLL_DELAY_MS = 32;

/**
 * Hook to handle WhatsApp-like chat scroll behavior:
 * 1. First visit to conversation: scroll to bottom
 * 2. Returning to conversation: start at the latest message
 * 3. User sends message: scroll to bottom
 * 4. New AI message while near bottom: auto-scroll
 * 5. Loading older messages at the top: preserve visible position
 */
export function useChatScroll({
  listRef,
  messages,
  conversationId,
  isLoading,
}: UseChatScrollOptions): UseChatScrollReturn {
  const isInitializedRef = useRef(false);
  const prevConversationIdRef = useRef<string | undefined>(undefined);
  const prevMessagesLengthRef = useRef(0);
  const isNearBottomRef = useRef(true);
  const pendingScrollToBottomRef = useRef<{ animated: boolean } | null>(null);

  const messagesLength = messages.length;

  // Reset when conversation changes
  if (conversationId !== prevConversationIdRef.current) {
    isInitializedRef.current = false;
    prevConversationIdRef.current = conversationId;
    prevMessagesLengthRef.current = 0;
    isNearBottomRef.current = true;
    pendingScrollToBottomRef.current = null;
  }

  // Initialize the list at the latest message whenever a conversation opens.
  useEffect(() => {
    if (isInitializedRef.current) return;
    if (!conversationId || messagesLength === 0 || isLoading) return;

    isInitializedRef.current = true;
    prevMessagesLengthRef.current = messagesLength;
    isNearBottomRef.current = true;
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd?.({ animated: false });
    }, INITIAL_SCROLL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [conversationId, isLoading, listRef, messagesLength]);

  // --- Core auto-scroll logic ---
  // This only forces a bottom jump when the user intentionally sends a
  // message while scrolled up.
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const prevLen = prevMessagesLengthRef.current;
    const curLen = messagesLength;
    prevMessagesLengthRef.current = curLen;

    if (curLen <= prevLen) return;

    const pendingScroll = pendingScrollToBottomRef.current;
    if (!pendingScroll) return;

    pendingScrollToBottomRef.current = null;
    listRef.current?.scrollToEnd?.({ animated: pendingScroll.animated });
    isNearBottomRef.current = true;
  }, [messagesLength, listRef]);

  // Track scroll position continuously
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;

      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      isNearBottomRef.current = distanceFromBottom <= NEAR_BOTTOM_THRESHOLD;
    },
    [],
  );

  const scrollToBottom = useCallback(
    (animated = true) => {
      pendingScrollToBottomRef.current = { animated };
      if (isInitializedRef.current && messagesLength > 0) {
        listRef.current?.scrollToEnd?.({ animated });
      }
      isNearBottomRef.current = true;
    },
    [listRef, messagesLength],
  );

  const shouldLoadMore = useCallback(() => {
    return isInitializedRef.current && !isLoading;
  }, [isLoading]);

  return {
    shouldLoadMore,
    handleScroll,
    scrollToBottom,
  };
}
