import { useRef, useCallback, useEffect, useState } from "react";
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewabilityConfig,
} from "react-native";
import type { ViewToken } from "@shopify/flash-list";

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
  /** Handler for FlashList item visibility changes */
  handleViewableItemsChanged: (info: {
    viewableItems: ViewToken<any>[];
    changed: ViewToken<any>[];
  }) => void;
  /** Stable viewability configuration for latest-message detection */
  viewabilityConfig: ViewabilityConfig;
  /** Scroll to bottom (call when user sends message) */
  scrollToBottom: (animated?: boolean) => void;
  /** Whether the floating scroll-to-bottom control should be visible */
  showScrollToBottom: boolean;
}

const NEAR_BOTTOM_THRESHOLD = 150;
const INITIAL_SCROLL_DELAY_MS = 32;
const CHAT_VIEWABILITY_CONFIG: ViewabilityConfig = {
  itemVisiblePercentThreshold: 25,
  minimumViewTime: 0,
};

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
  const showScrollToBottomRef = useRef(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const messagesLength = messages.length;

  // Reset when conversation changes
  if (conversationId !== prevConversationIdRef.current) {
    isInitializedRef.current = false;
    prevConversationIdRef.current = conversationId;
    prevMessagesLengthRef.current = 0;
    isNearBottomRef.current = true;
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

  // Initialize the list at the latest message whenever a conversation opens.
  useEffect(() => {
    if (isInitializedRef.current) return;
    if (!conversationId || messagesLength === 0 || isLoading) return;

    isInitializedRef.current = true;
    prevMessagesLengthRef.current = messagesLength;
    isNearBottomRef.current = true;
    updateShowScrollToBottom(false);
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd?.({ animated: false });
    }, INITIAL_SCROLL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [
    conversationId,
    isLoading,
    listRef,
    messagesLength,
    updateShowScrollToBottom,
  ]);

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
    updateShowScrollToBottom(false);
  }, [messagesLength, listRef, updateShowScrollToBottom]);

  // Track scroll position continuously
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;

      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      const isNearBottom = distanceFromBottom <= NEAR_BOTTOM_THRESHOLD;

      isNearBottomRef.current = isNearBottom;
      updateShowScrollToBottom(!isNearBottom && contentSize.height > 0);
    },
    [updateShowScrollToBottom],
  );

  const scrollToBottom = useCallback(
    (animated = true) => {
      pendingScrollToBottomRef.current = { animated };
      if (isInitializedRef.current && messagesLength > 0) {
        listRef.current?.scrollToEnd?.({ animated });
      }
      isNearBottomRef.current = true;
      updateShowScrollToBottom(false);
    },
    [listRef, messagesLength, updateShowScrollToBottom],
  );

  const shouldLoadMore = useCallback(() => {
    return isInitializedRef.current && !isLoading;
  }, [isLoading]);

  const handleViewableItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken<any>[];
      changed: ViewToken<any>[];
    }) => {
      if (messagesLength === 0) {
        isNearBottomRef.current = true;
        updateShowScrollToBottom(false);
        return;
      }

      const lastMessageIndex = messagesLength - 1;
      const isLastMessageVisible = viewableItems.some(
        (token) =>
          token.index === lastMessageIndex &&
          token.isViewable !== false,
      );

      isNearBottomRef.current = isLastMessageVisible;
      updateShowScrollToBottom(!isLastMessageVisible);
    },
    [messagesLength, updateShowScrollToBottom],
  );

  return {
    shouldLoadMore,
    handleScroll,
    handleViewableItemsChanged,
    viewabilityConfig: CHAT_VIEWABILITY_CONFIG,
    scrollToBottom,
    showScrollToBottom,
  };
}
