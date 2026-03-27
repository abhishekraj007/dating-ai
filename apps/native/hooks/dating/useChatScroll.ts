import { useRef, useCallback, useEffect } from "react";
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
}

const NEAR_BOTTOM_THRESHOLD = 150;

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
  const isInitializedRef = useRef(false);
  const prevConversationIdRef = useRef<string | undefined>(undefined);
  const prevMessagesLengthRef = useRef(0);
  const isNearBottomRef = useRef(true);
  const wantScrollToBottomRef = useRef(false);
  const scrollOffsetRef = useRef(0);
  const anchorIdRef = useRef<string | null>(null);
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 50 });

  const messagesLength = messages.length;

  const savedState = conversationId
    ? scrollStateStore.get(conversationId)
    : undefined;

  // Only compute initialScrollIndex before the hook has initialized.
  // After that, return undefined so FlashList doesn't reuse it.
  const initialScrollIndex =
    !isInitializedRef.current && conversationId && messagesLength > 0
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

  // Save scroll state for this conversation
  const saveScrollState = useCallback(() => {
    if (!conversationId) return;
    const firstVisibleIndex = listRef.current?.getFirstVisibleIndex?.() ?? -1;
    scrollStateStore.set(conversationId, {
      anchorId:
        anchorIdRef.current ??
        (firstVisibleIndex >= 0 ? messages[firstVisibleIndex]?._id : null) ??
        null,
      firstVisibleIndex: Math.max(0, firstVisibleIndex),
      offset: scrollOffsetRef.current,
      wasAtBottom: isNearBottomRef.current,
    });
  }, [conversationId, listRef, messages]);

  // Reset when conversation changes
  if (conversationId !== prevConversationIdRef.current) {
    isInitializedRef.current = false;
    prevConversationIdRef.current = conversationId;
    prevMessagesLengthRef.current = 0;
    isNearBottomRef.current = true;
    wantScrollToBottomRef.current = false;
  }

  // Initialize: mark ready and optionally restore saved offset
  useEffect(() => {
    if (isInitializedRef.current) return;
    if (!conversationId || messagesLength === 0 || isLoading) return;

    isInitializedRef.current = true;
    prevMessagesLengthRef.current = messagesLength;

    // initialScrollIndex already placed us at the right index.
    // If the user was NOT at the bottom, fine-tune with the exact saved offset.
    if (savedState && !savedState.wasAtBottom) {
      const timer = setTimeout(() => {
        listRef.current?.scrollToOffset?.({
          animated: false,
          offset: savedState.offset,
        });
        isNearBottomRef.current = false;
      }, 80);
      return () => clearTimeout(timer);
    }

    // Otherwise the user was at the bottom (or it's a fresh conversation).
    isNearBottomRef.current = true;
  }, [conversationId, messagesLength, isLoading, savedState, listRef]);

  // Persist position on unmount
  useEffect(() => {
    return () => {
      saveScrollState();
    };
  }, [saveScrollState]);

  // --- Core auto-scroll logic ---
  // Fires whenever messages.length changes.
  // Only scrolls to bottom when:
  //   a) the user just sent a message (wantScrollToBottom flag), OR
  //   b) the user is already near the bottom and ≤3 new messages arrived (AI response)
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const prevLen = prevMessagesLengthRef.current;
    const curLen = messagesLength;
    prevMessagesLengthRef.current = curLen;

    if (curLen <= prevLen) return; // only react to additions

    const diff = curLen - prevLen;
    const forced = wantScrollToBottomRef.current;

    if (forced || (isNearBottomRef.current && diff <= 3)) {
      wantScrollToBottomRef.current = false;
      listRef.current?.scrollToEnd?.({ animated: forced });
      isNearBottomRef.current = true;
    }
  }, [messagesLength, listRef]);

  // Track scroll position continuously
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;

      scrollOffsetRef.current = contentOffset.y;

      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      isNearBottomRef.current = distanceFromBottom <= NEAR_BOTTOM_THRESHOLD;

      const firstVisibleIndex = listRef.current?.getFirstVisibleIndex?.() ?? -1;

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

  // Queue a scroll-to-bottom for the next message addition.
  // Does NOT scroll immediately — the auto-scroll effect handles it
  // once the optimistic message lands and messages.length bumps.
  const scrollToBottom = useCallback((_animated = true) => {
    wantScrollToBottomRef.current = true;
    isNearBottomRef.current = true;
  }, []);

  const shouldLoadMore = useCallback(() => {
    return isInitializedRef.current;
  }, []);

  return {
    shouldLoadMore,
    handleScroll,
    scrollToBottom,
    viewabilityConfig: viewabilityConfigRef.current,
    onViewableItemsChanged,
    initialScrollIndex,
  };
}
