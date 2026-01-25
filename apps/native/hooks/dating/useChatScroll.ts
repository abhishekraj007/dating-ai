import { useRef, useCallback, useEffect } from "react";
import { AppState } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

// Store scroll state per conversation (persists across unmounts)
const scrollStateStore = new Map<
  string,
  {
    anchorId: string | null;
    firstVisibleIndex: number;
    offset: number;
    wasAtBottom: boolean;
  }
>();

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
  viewabilityConfig: any;
  onViewableItemsChanged: ((info: any) => void) | null;
  initialScrollIndex?: number;
  initialScrollIndexParams?: { viewOffset?: number };
}

const NEAR_BOTTOM_THRESHOLD = 150;
const SESSION_RESET_AFTER_MS = 60_000;

/**
 * Hook to handle WhatsApp-like chat scroll behavior:
 * 1. First visit to conversation: scroll to bottom
 * 2. Returning to conversation: restore previous scroll position
 * 3. User sends message: scroll to bottom
 * 4. New AI message while near bottom: auto-scroll
 * 5. New AI message while scrolled up: don't scroll
 */
export function useChatScroll({
  listRef,
  messages,
  conversationId,
  isLoading,
}: UseChatScrollOptions): UseChatScrollReturn {
  const hasInitialScrolledRef = useRef(false);
  const prevConversationIdRef = useRef<string | undefined>(undefined);
  const prevMessagesLengthRef = useRef(0);
  const isScrollingRef = useRef(false);
  const isNearBottomRef = useRef(false);

  const anchorIdRef = useRef<string | null>(null);
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 50 });
  const scrollOffsetRef = useRef(0);
  const backgroundAtRef = useRef<number | null>(null);

  const messagesLength = messages.length;

  const savedState = conversationId
    ? scrollStateStore.get(conversationId)
    : undefined;

  const initialScrollIndex =
    conversationId && messagesLength > 0
      ? (() => {
          if (!savedState) return messagesLength - 1;

          const byAnchor = savedState.anchorId
            ? messages.findIndex((m) => m._id === savedState.anchorId)
            : -1;
          const fallbackIndex = Math.min(
            savedState.firstVisibleIndex,
            messagesLength - 1,
          );
          const idx = byAnchor >= 0 ? byAnchor : fallbackIndex;
          return Math.max(0, Math.min(idx, messagesLength - 1));
        })()
      : undefined;

  const saveScrollState = useCallback(() => {
    if (!conversationId) return;

    const previous = scrollStateStore.get(conversationId);
    const firstVisibleIndex =
      listRef.current?.getFirstVisibleIndex?.() ??
      previous?.firstVisibleIndex ??
      -1;

    const anchorId =
      anchorIdRef.current ??
      (firstVisibleIndex >= 0 ? messages[firstVisibleIndex]?._id : null) ??
      previous?.anchorId ??
      null;

    scrollStateStore.set(conversationId, {
      anchorId,
      firstVisibleIndex: firstVisibleIndex >= 0 ? firstVisibleIndex : 0,
      offset: scrollOffsetRef.current || previous?.offset || 0,
      wasAtBottom: isNearBottomRef.current,
    });
  }, [conversationId, listRef, messages]);

  // Reset state when conversation changes
  if (conversationId !== prevConversationIdRef.current) {
    hasInitialScrolledRef.current = false;
    prevConversationIdRef.current = conversationId;
    prevMessagesLengthRef.current = 0;
    isScrollingRef.current = true;
    isNearBottomRef.current = false;
  }

  // Handle initial scroll and position restoration
  useEffect(() => {
    if (!conversationId || messagesLength === 0 || isLoading) return;
    if (hasInitialScrolledRef.current) return;

    hasInitialScrolledRef.current = true;
    isNearBottomRef.current = !savedState;
    const timer = setTimeout(() => {
      isScrollingRef.current = false;
    }, 400);

    prevMessagesLengthRef.current = messagesLength;
    return () => clearTimeout(timer);
  }, [conversationId, messagesLength, isLoading, savedState]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" || nextState === "inactive") {
        backgroundAtRef.current = Date.now();
        return;
      }

      if (nextState === "active") {
        const backgroundAt = backgroundAtRef.current;
        backgroundAtRef.current = null;
        if (
          backgroundAt !== null &&
          Date.now() - backgroundAt > SESSION_RESET_AFTER_MS
        ) {
          scrollStateStore.clear();
        }
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    return () => {
      saveScrollState();
    };
  }, [saveScrollState]);

  // Auto-scroll to bottom when new messages arrive (only if near bottom)
  useEffect(() => {
    if (!conversationId || isLoading || !hasInitialScrolledRef.current) return;

    const prevLength = prevMessagesLengthRef.current;
    const currentLength = messagesLength;

    // New messages added (1-3, not bulk pagination)
    if (currentLength > prevLength && prevLength > 0) {
      const diff = currentLength - prevLength;
      if (diff <= 3 && isNearBottomRef.current) {
        setTimeout(() => {
          listRef.current?.scrollToEnd?.({ animated: true });
        }, 50);
      }
    }

    prevMessagesLengthRef.current = currentLength;
  }, [messagesLength, conversationId, isLoading, listRef]);

  // Track scroll position and save state using FlashList's getFirstVisibleIndex
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;

      scrollOffsetRef.current = contentOffset.y;

      // Calculate distance from bottom
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      isNearBottomRef.current = distanceFromBottom <= NEAR_BOTTOM_THRESHOLD;

      // Get first visible index from FlashList ref
      const firstVisibleIndex = listRef.current?.getFirstVisibleIndex?.() ?? -1;

      // Save state for this conversation
      if (conversationId && firstVisibleIndex >= 0) {
        scrollStateStore.set(conversationId, {
          anchorId:
            anchorIdRef.current ?? messages[firstVisibleIndex]?._id ?? null,
          firstVisibleIndex,
          offset: contentOffset.y,
          wasAtBottom: isNearBottomRef.current,
        });
      }
    },
    [conversationId, listRef, messages],
  );

  const onViewableItemsChanged = useCallback((info: any) => {
    const viewableItems = info?.viewableItems;
    if (!Array.isArray(viewableItems) || viewableItems.length === 0) return;

    const first = viewableItems
      .filter((v: any) => v?.isViewable)
      .sort((a: any, b: any) => (a.index ?? 0) - (b.index ?? 0))[0];

    const id = first?.item?._id;
    if (typeof id === "string") {
      anchorIdRef.current = id;
    }
  }, []);

  // Scroll to bottom (for when user sends message)
  const scrollToBottom = useCallback(
    (animated = true) => {
      if (messagesLength === 0) return;

      setTimeout(() => {
        listRef.current?.scrollToEnd?.({ animated });
        isNearBottomRef.current = true;
        if (conversationId) {
          scrollStateStore.set(conversationId, {
            anchorId: messages[messagesLength - 1]?._id ?? null,
            firstVisibleIndex: messagesLength - 1,
            offset: scrollOffsetRef.current,
            wasAtBottom: true,
          });
        }
      }, 50);
    },
    [listRef, messagesLength, conversationId, messages],
  );

  // Check if loadMore should proceed
  const shouldLoadMore = useCallback(() => {
    return !isScrollingRef.current && hasInitialScrolledRef.current;
  }, []);

  return {
    shouldLoadMore,
    handleScroll,
    scrollToBottom,
    viewabilityConfig: viewabilityConfigRef.current,
    onViewableItemsChanged,
    initialScrollIndex,
    initialScrollIndexParams:
      initialScrollIndex !== undefined ? { viewOffset: 0 } : undefined,
  };
}
