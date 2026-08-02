import { useRef, useCallback, useEffect, useState } from "react";
import type { NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import type { LegendListRef } from "@legendapp/list/react-native";

type ScrollMessageToEnd = (options: {
  animated: boolean;
  closeKeyboard: boolean;
}) => Promise<void>;

interface UseChatScrollOptions {
  listRef: React.RefObject<LegendListRef | null>;
  messages: Array<{ _id: string; content?: string }>;
  conversationId: string | undefined;
  isLoading: boolean;
  scrollMessageToEnd: ScrollMessageToEnd;
}

interface UseChatScrollReturn {
  shouldLoadMore: () => boolean;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleScrollBeginDrag: () => void;
  handleScrollEnd: () => void;
  scrollToBottom: (animated?: boolean) => void;
  prepareForNewTurn: () => void;
  markUserInteraction: () => void;
  showScrollToBottom: boolean;
  hasUnseenMessages: boolean;
  isFollowingLatest: boolean;
}

/**
 * Owns the reader's scroll intent.
 * New content follows only after the reader sends, jumps to latest, or
 * manually reaches the live edge.
 */
export function useChatScroll({
  listRef,
  messages,
  conversationId,
  isLoading,
  scrollMessageToEnd,
}: UseChatScrollOptions): UseChatScrollReturn {
  const isInitializedRef = useRef(false);
  const prevConversationIdRef = useRef<string | undefined>(undefined);
  const pendingScrollToBottomRef = useRef(false);
  const isUserScrollingRef = useRef(false);
  const isFollowingLatestRef = useRef(false);
  const latestMessageVersionRef = useRef("");
  const showScrollToBottomRef = useRef(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [hasUnseenMessages, setHasUnseenMessages] = useState(false);
  const [isFollowingLatest, setIsFollowingLatest] = useState(false);

  const messagesLength = messages.length;
  const latestMessage = messages[messagesLength - 1];
  const latestMessageVersion = latestMessage
    ? `${latestMessage._id}:${latestMessage.content?.length ?? 0}`
    : "";

  if (conversationId !== prevConversationIdRef.current) {
    isInitializedRef.current = false;
    prevConversationIdRef.current = conversationId;
    pendingScrollToBottomRef.current = false;
    isUserScrollingRef.current = false;
    isFollowingLatestRef.current = false;
    latestMessageVersionRef.current = "";
    showScrollToBottomRef.current = false;
  }

  const updateShowScrollToBottom = useCallback((nextValue: boolean) => {
    if (showScrollToBottomRef.current === nextValue) {
      return;
    }

    showScrollToBottomRef.current = nextValue;
    setShowScrollToBottom(nextValue);
  }, []);

  const updateFollowingLatest = useCallback((nextValue: boolean) => {
    if (isFollowingLatestRef.current === nextValue) {
      return;
    }

    isFollowingLatestRef.current = nextValue;
    setIsFollowingLatest(nextValue);
  }, []);

  useEffect(() => {
    updateShowScrollToBottom(false);
    updateFollowingLatest(false);
    setHasUnseenMessages(false);
  }, [conversationId, updateFollowingLatest, updateShowScrollToBottom]);

  useEffect(() => {
    if (isInitializedRef.current) {
      return;
    }
    if (!conversationId || messagesLength === 0 || isLoading) {
      return;
    }

    isInitializedRef.current = true;
    latestMessageVersionRef.current = latestMessageVersion;
    updateShowScrollToBottom(false);
  }, [
    conversationId,
    isLoading,
    latestMessageVersion,
    messagesLength,
    updateShowScrollToBottom,
  ]);

  useEffect(() => {
    if (!pendingScrollToBottomRef.current || messagesLength === 0) {
      return;
    }

    pendingScrollToBottomRef.current = false;
    const frameId = requestAnimationFrame(() => {
      void scrollMessageToEnd({ animated: true, closeKeyboard: true });
      updateShowScrollToBottom(false);
    });

    return () => cancelAnimationFrame(frameId);
  }, [messagesLength, scrollMessageToEnd, updateShowScrollToBottom]);

  const syncScrollPosition = useCallback(() => {
    const state = listRef.current?.getState();
    if (!state) {
      return;
    }

    const hasContent = state.contentLength > 0;
    const isNearLatest =
      state.isWithinMaintainScrollAtEndThreshold || state.isNearEnd;
    updateShowScrollToBottom(hasContent && !isNearLatest);

    if (isUserScrollingRef.current && isNearLatest) {
      updateFollowingLatest(true);
      setHasUnseenMessages(false);
    }
  }, [listRef, updateFollowingLatest, updateShowScrollToBottom]);

  const handleScroll = useCallback(
    (_event: NativeSyntheticEvent<NativeScrollEvent>) => {
      syncScrollPosition();
    },
    [syncScrollPosition],
  );

  const markUserInteraction = useCallback(() => {
    pendingScrollToBottomRef.current = false;
    updateFollowingLatest(false);
  }, [updateFollowingLatest]);

  const handleScrollBeginDrag = useCallback(() => {
    isUserScrollingRef.current = true;
    markUserInteraction();
  }, [markUserInteraction]);

  const handleScrollEnd = useCallback(() => {
    syncScrollPosition();
    isUserScrollingRef.current = false;
  }, [syncScrollPosition]);

  const scrollToBottom = useCallback(
    (animated = true) => {
      updateFollowingLatest(true);
      setHasUnseenMessages(false);
      updateShowScrollToBottom(false);
      void scrollMessageToEnd({ animated, closeKeyboard: false });
    },
    [scrollMessageToEnd, updateFollowingLatest, updateShowScrollToBottom],
  );

  const prepareForNewTurn = useCallback(() => {
    pendingScrollToBottomRef.current = true;
    updateFollowingLatest(true);
    setHasUnseenMessages(false);
    updateShowScrollToBottom(false);
  }, [updateFollowingLatest, updateShowScrollToBottom]);

  useEffect(() => {
    if (
      !isInitializedRef.current ||
      latestMessageVersionRef.current === latestMessageVersion
    ) {
      return;
    }

    latestMessageVersionRef.current = latestMessageVersion;
    if (!isFollowingLatestRef.current) {
      setHasUnseenMessages(true);
    }

    const frameId = requestAnimationFrame(syncScrollPosition);
    return () => cancelAnimationFrame(frameId);
  }, [latestMessageVersion, syncScrollPosition]);

  const shouldLoadMore = useCallback(() => {
    return isInitializedRef.current && !isLoading;
  }, [isLoading]);

  return {
    shouldLoadMore,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEnd,
    scrollToBottom,
    prepareForNewTurn,
    markUserInteraction,
    showScrollToBottom,
    hasUnseenMessages,
    isFollowingLatest,
  };
}
