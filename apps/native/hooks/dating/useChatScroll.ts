import { useRef, useEffect, useCallback } from "react";

interface UseChatScrollOptions {
  /** The list ref to control scrolling */
  listRef: React.RefObject<any>;
  /** Number of messages currently displayed */
  messagesLength: number;
  /** Conversation/chat ID - resets scroll state when changed */
  conversationId: string | undefined;
  /** Whether messages are still loading */
  isLoading: boolean;
}

interface UseChatScrollReturn {
  /** Whether we're currently in a programmatic scroll (prevents onStartReached) */
  isScrolling: boolean;
  /** Call this when onStartReached fires to check if loading should proceed */
  shouldLoadMore: () => boolean;
}

/**
 * Hook to handle WhatsApp-like chat scrolling behavior:
 * 1. Initial load: scroll to bottom instantly
 * 2. New messages: scroll to bottom with animation
 * 3. Loading older messages: maintains scroll position (handled by FlashList)
 */
export function useChatScroll({
  listRef,
  messagesLength,
  conversationId,
  isLoading,
}: UseChatScrollOptions): UseChatScrollReturn {
  const hasInitialScrolledRef = useRef(false);
  const lastMessageCountRef = useRef(0);
  const prevConversationIdRef = useRef<string | undefined>(undefined);
  const isScrollingRef = useRef(false);

  // Reset scroll state when conversation changes
  if (conversationId !== prevConversationIdRef.current) {
    hasInitialScrolledRef.current = false;
    lastMessageCountRef.current = 0;
    prevConversationIdRef.current = conversationId;
    isScrollingRef.current = false;
  }

  // Main scroll effect
  useEffect(() => {
    // Skip if no messages or still loading initial data
    if (messagesLength === 0 || isLoading) return;

    const currentLength = messagesLength;
    const prevLength = lastMessageCountRef.current;

    // Case 1: Initial scroll when entering chat
    if (!hasInitialScrolledRef.current && currentLength > 0) {
      isScrollingRef.current = true;
      hasInitialScrolledRef.current = true;

      // Delay to ensure FlashList has rendered
      const scrollTimer = setTimeout(() => {
        try {
          listRef.current?.scrollToIndex({
            index: currentLength - 1,
            animated: false,
          });
        } catch {
          listRef.current?.scrollToEnd({ animated: false });
        }

        // Re-enable onStartReached after scroll settles
        const unlockTimer = setTimeout(() => {
          isScrollingRef.current = false;
        }, 300);

        return () => clearTimeout(unlockTimer);
      }, 100);

      lastMessageCountRef.current = currentLength;
      return () => clearTimeout(scrollTimer);
    }

    // Case 2: New messages added (1-3 new messages, not bulk pagination)
    if (currentLength > prevLength && prevLength > 0) {
      const diff = currentLength - prevLength;
      if (diff <= 3) {
        requestAnimationFrame(() => {
          listRef.current?.scrollToEnd({ animated: true });
        });
      }
    }

    lastMessageCountRef.current = currentLength;
  }, [messagesLength, isLoading, listRef]);

  // Check if loadMore should proceed
  const shouldLoadMore = useCallback(() => {
    return !isScrollingRef.current;
  }, []);

  return {
    isScrolling: isScrollingRef.current,
    shouldLoadMore,
  };
}
