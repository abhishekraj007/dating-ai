import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Alert, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Id } from "@dating-ai/backend/convex/_generated/dataModel";
import { useConversation } from "./useConversations";
import {
  useMessages,
  useSendMessage,
  useDeleteMessage,
  useClearChat,
} from "./useMessages";
import { useRequestChatMedia } from "./useImageRequest";
import type { MediaRequestOptions } from "./useImageRequest";
import { useChatScroll } from "./useChatScroll";
import { useCredits } from "./useCredits";
import { useTranslation } from "@/hooks/use-translation";

const AI_RESPONSE_WAIT_TIMEOUT_MS = 15000;
const INITIAL_CHAT_FORM_HEIGHT = 112;
const openedCreditsRequiredMessageIds = new Set<string>();

function getLatestCreditsRequiredMessageId(
  messages: Array<{ _id: string; role: string; content: string }>,
) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role === "user") {
      continue;
    }

    try {
      const parsed = JSON.parse(message.content);
      if (parsed?.type === "credits_required") {
        return message._id;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function useChatScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  // Map Platform.OS to the supported platform values. macOS is treated as iOS.
  const platform: "ios" | "android" | "web" =
    Platform.OS === "android"
      ? "android"
      : Platform.OS === "web"
        ? "web"
        : "ios";
  const [message, setMessage] = useState("");
  const [isStopRequested, setIsStopRequested] = useState(false);
  const listRef = useRef<any>(null);
  const lastSubmittedInputRef = useRef("");

  // Keyboard composer state
  const [composerHeight, setComposerHeight] = useState(48);
  const [chatFormHeight, setChatFormHeight] = useState(
    INITIAL_CHAT_FORM_HEIGHT,
  );
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [blurTrigger, setBlurTrigger] = useState(0);
  const isKeyboardOpen = keyboardHeight > 0;

  // Dismiss keyboard when tapping outside
  const dismissKeyboard = useCallback(() => {
    setBlurTrigger((current) => current + 1);
  }, []);

  // Conversation and messages
  const { conversation, isLoading: isLoadingConversation } =
    useConversation(id);
  const threadId = conversation?.threadId;
  const {
    messages,
    isLoading: isLoadingMessages,
    isLoadingMore,
    hasMore,
    loadMore,
    isAITyping,
  } = useMessages(threadId);

  const { sendMessage, sendMessageWithOptimistic, retryMessage, stopResponse } =
    useSendMessage();

  // Credits for client-side checking
  const { credits, hasEnoughCredits } = useCredits();

  // Derive profile
  const profile = conversation?.profile;

  // Image request state
  const [isImageSheetOpen, setIsImageSheetOpen] = useState(false);
  const [isRequestingImage, setIsRequestingImage] = useState(false);
  const { requestMedia } = useRequestChatMedia();
  const { deleteMessage } = useDeleteMessage();
  const { clearChat } = useClearChat();
  const [isClearing, setIsClearing] = useState(false);
  const popoverRef = useRef<any>(null);

  // Message actions sheet
  const [isMessageActionsOpen, setIsMessageActionsOpen] = useState(false);
  const [selectedMessageOrder, setSelectedMessageOrder] = useState<
    number | null
  >(null);

  // Topics and suggestions sheets
  const [isTopicsSheetOpen, setIsTopicsSheetOpen] = useState(false);
  const [isSuggestionsSheetOpen, setIsSuggestionsSheetOpen] = useState(false);
  const [isActionsSheetOpen, setIsActionsSheetOpen] = useState(false);
  const [isChatLanguageOpen, setIsChatLanguageOpen] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [pendingAssistantState, setPendingAssistantState] = useState<{
    conversationKey: string;
    baselineOrder: number;
  } | null>(null);
  const pendingAssistantTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const conversationKey = threadId ?? id ?? null;
  const latestCreditsRequiredMessageId = useMemo(
    () => getLatestCreditsRequiredMessageId(messages),
    [messages],
  );

  const clearPendingAssistantState = useCallback(() => {
    if (pendingAssistantTimeoutRef.current) {
      clearTimeout(pendingAssistantTimeoutRef.current);
      pendingAssistantTimeoutRef.current = null;
    }
    setPendingAssistantState(null);
  }, []);

  const startPendingAssistantState = useCallback(() => {
    if (!conversationKey) {
      return;
    }

    const baselineOrder =
      messages.length > 0
        ? Math.max(...messages.map((entry) => entry.order))
        : -1;

    clearPendingAssistantState();
    setPendingAssistantState({ conversationKey, baselineOrder });
    pendingAssistantTimeoutRef.current = setTimeout(() => {
      setPendingAssistantState((current) =>
        current?.conversationKey === conversationKey ? null : current,
      );
      pendingAssistantTimeoutRef.current = null;
    }, AI_RESPONSE_WAIT_TIMEOUT_MS);
  }, [clearPendingAssistantState, conversationKey, messages]);

  const hasAIResponseAfterSend = useMemo(() => {
    if (
      !pendingAssistantState ||
      pendingAssistantState.conversationKey !== conversationKey
    ) {
      return false;
    }

    return messages.some(
      (entry) =>
        entry.role !== "user" &&
        entry.order > pendingAssistantState.baselineOrder,
    );
  }, [conversationKey, messages, pendingAssistantState]);

  const isWaitingForAI =
    pendingAssistantState !== null &&
    pendingAssistantState.conversationKey === conversationKey &&
    !isAITyping &&
    !hasAIResponseAfterSend;

  const showTypingIndicator =
    !isStopRequested && (isAITyping || isWaitingForAI);

  const handleOpenCreditsModal = useCallback(() => {
    setIsImageSheetOpen(false);
    router.push("/buy-credits");
  }, [router]);

  const handleChatFormHeightChange = useCallback((height: number) => {
    setChatFormHeight((currentHeight) =>
      Math.abs(currentHeight - height) < 1 ? currentHeight : height,
    );
  }, []);

  // Chat scroll behavior
  const {
    shouldLoadMore,
    handleScroll,
    handleViewableItemsChanged,
    viewabilityConfig,
    scrollToBottom,
    showScrollToBottom,
  } = useChatScroll({
    listRef,
    messages,
    conversationId: threadId ?? id,
    isLoading: isLoadingMessages,
  });

  useEffect(() => {
    if (keyboardHeight <= 0 || showScrollToBottom) {
      return;
    }

    scrollToBottom(true);
  }, [keyboardHeight, scrollToBottom, showScrollToBottom]);

  useEffect(() => {
    if (!pendingAssistantState) {
      return;
    }

    if (
      pendingAssistantState.conversationKey !== conversationKey ||
      isAITyping ||
      hasAIResponseAfterSend
    ) {
      clearPendingAssistantState();
    }
  }, [
    clearPendingAssistantState,
    conversationKey,
    hasAIResponseAfterSend,
    isAITyping,
    pendingAssistantState,
  ]);

  useEffect(() => {
    return () => {
      if (pendingAssistantTimeoutRef.current) {
        clearTimeout(pendingAssistantTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isAITyping && !isWaitingForAI) {
      setIsStopRequested(false);
      if (hasAIResponseAfterSend) {
        lastSubmittedInputRef.current = "";
      }
    }
  }, [hasAIResponseAfterSend, isAITyping, isWaitingForAI]);

  useEffect(() => {
    if (!latestCreditsRequiredMessageId) {
      return;
    }

    if (openedCreditsRequiredMessageIds.has(latestCreditsRequiredMessageId)) {
      return;
    }

    openedCreditsRequiredMessageIds.add(latestCreditsRequiredMessageId);
    handleOpenCreditsModal();
  }, [handleOpenCreditsModal, latestCreditsRequiredMessageId]);

  const sendConversationMessage = useCallback(
    async (content: string, options?: { optimistic?: boolean }) => {
      if (!id || isSending) {
        return false;
      }

      if (!hasEnoughCredits("TEXT_MESSAGE")) {
        handleOpenCreditsModal();
        return false;
      }

      setIsStopRequested(false);
      setIsSending(true);
      startPendingAssistantState();

      try {
        if (options?.optimistic) {
          await sendMessageWithOptimistic(
            {
              conversationId: id as Id<"aiConversations">,
              content,
              platform,
            },
            threadId,
          );
        } else {
          await sendMessage({
            conversationId: id as Id<"aiConversations">,
            content,
            platform,
          });
        }

        return true;
      } catch (error: any) {
        clearPendingAssistantState();

        if (error.message?.includes("Insufficient credits")) {
          handleOpenCreditsModal();
        } else {
          console.error("Failed to send message:", error);
          Alert.alert(t("alerts.error"), t("alerts.tryAgainMoment"));
        }

        return false;
      } finally {
        setIsSending(false);
      }
    },
    [
      clearPendingAssistantState,
      hasEnoughCredits,
      handleOpenCreditsModal,
      id,
      isSending,
      t,
      platform,
      sendMessage,
      sendMessageWithOptimistic,
      startPendingAssistantState,
      threadId,
    ],
  );

  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim() || !id || isSending) return;

      const content = text.trim();

      lastSubmittedInputRef.current = content;
      dismissKeyboard();
      setMessage("");
      void sendConversationMessage(content, { optimistic: true });

      // Scroll to bottom when user sends message
      scrollToBottom(true);
    },
    [dismissKeyboard, id, isSending, sendConversationMessage, scrollToBottom],
  );

  const handleStopResponse = useCallback(async () => {
    if (!id || !showTypingIndicator) {
      return;
    }

    clearPendingAssistantState();
    setIsStopRequested(true);
    setIsSending(false);

    if (lastSubmittedInputRef.current) {
      setMessage(lastSubmittedInputRef.current);
    }

    try {
      await stopResponse({ conversationId: id as Id<"aiConversations"> });
    } catch (error) {
      setIsStopRequested(false);
      console.error("Failed to stop response:", error);
      Alert.alert(t("alerts.error"), t("chat.stopFailed"));
    }
  }, [clearPendingAssistantState, id, showTypingIndicator, stopResponse, t]);

  const handleImageRequest = useCallback(
    async (options: MediaRequestOptions) => {
      if (!id) return;

      const creditAction =
        options.mediaType === "video" ? "VIDEO_REQUEST" : "IMAGE_REQUEST";

      if (!hasEnoughCredits(creditAction)) {
        handleOpenCreditsModal();
        return;
      }

      setIsRequestingImage(true);
      try {
        await requestMedia(id, options, platform);
        setIsImageSheetOpen(false);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : String(error);
        if (message.includes("Insufficient credits")) {
          handleOpenCreditsModal();
        } else {
          console.error("Failed to request media:", error);
        }
      } finally {
        setIsRequestingImage(false);
      }
    },
    [id, requestMedia, hasEnoughCredits, handleOpenCreditsModal, platform],
  );

  const handleOpenImageSheet = () => {
    dismissKeyboard();
    setIsImageSheetOpen(true);
  };

  const handleStartQuiz = useCallback(async () => {
    if (!id || isSending) return;
    dismissKeyboard();
    await sendConversationMessage("Let's play quiz!");
  }, [dismissKeyboard, id, isSending, sendConversationMessage]);

  const handleOpenTopicsSheet = () => {
    dismissKeyboard();
    setIsTopicsSheetOpen(true);
  };

  const handleOpenSuggestionsSheet = () => {
    dismissKeyboard();
    setIsSuggestionsSheetOpen(true);
  };

  const handleOpenMessageActions = useCallback(
    (messageOrder: number) => {
      dismissKeyboard();
      setSelectedMessageOrder(messageOrder);
      setIsMessageActionsOpen(true);
    },
    [dismissKeyboard],
  );

  const handleDeleteMessage = useCallback(async () => {
    if (selectedMessageOrder === null) return;
    try {
      await deleteMessage(id as string, selectedMessageOrder);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
    setSelectedMessageOrder(null);
  }, [deleteMessage, id, selectedMessageOrder]);

  const handleQuizAnswer = useCallback(
    async (answer: string) => {
      if (!id || isSending) return;

      await sendConversationMessage(answer);
    },
    [id, isSending, sendConversationMessage],
  );

  const handleEndQuiz = useCallback(async () => {
    if (!id || isSending) return;
    await sendConversationMessage("End the quiz");
  }, [id, isSending, sendConversationMessage]);

  const handleTopicSelect = useCallback(
    async (topic: { id: string; label: string; prompt: string }) => {
      if (!id || isSending) return;

      setIsTopicsSheetOpen(false);

      await sendConversationMessage(topic.prompt);
    },
    [id, isSending, sendConversationMessage],
  );

  const handleSuggestionSelect = useCallback(
    async (suggestion: string) => {
      if (!id || isSending) return;

      setIsSuggestionsSheetOpen(false);

      await sendConversationMessage(suggestion);
    },
    [id, isSending, sendConversationMessage],
  );

  const handleRetryFailedResponse = useCallback(
    async (promptMessageId: string) => {
      if (!id || isSending) {
        return;
      }

      dismissKeyboard();
      setIsSending(true);
      startPendingAssistantState();

      try {
        await retryMessage({
          conversationId: id as Id<"aiConversations">,
          promptMessageId,
        });
      } catch (error) {
        clearPendingAssistantState();
        console.error("Failed to retry response:", error);
        Alert.alert(
          t("alerts.error"),
          error instanceof Error ? error.message : t("chat.retryFailed"),
        );
      } finally {
        setIsSending(false);
      }
    },
    [
      clearPendingAssistantState,
      dismissKeyboard,
      id,
      isSending,
      retryMessage,
      startPendingAssistantState,
      t,
    ],
  );

  const handleOpenChatLanguage = useCallback(() => {
    popoverRef.current?.close();
    setIsChatLanguageOpen(true);
  }, []);

  const handleClearChat = useCallback(() => {
    popoverRef.current?.close();
    Alert.alert(
      t("chat.clearTitle"),
      t("chat.clearBody", { name: profile?.name ?? t("chat.thisAi") }),
      [
        { text: t("alerts.cancel"), style: "cancel" },
        {
          text: t("chat.clear"),
          style: "destructive",
          onPress: async () => {
            if (!id) return;
            setIsClearing(true);
            clearPendingAssistantState();
            try {
              await clearChat(id, threadId);
            } catch (error) {
              console.error("Failed to clear chat:", error);
              Alert.alert(t("alerts.error"), t("chat.clearFailed"));
            } finally {
              setIsClearing(false);
            }
          },
        },
      ],
    );
  }, [clearChat, clearPendingAssistantState, id, profile?.name, t, threadId]);

  // Determine which quiz question should be interactive
  const interactiveQuizQuestionId = useMemo(() => {
    if (!messages.length) return null;

    let lastQuizQuestionId: string | null = null;
    let lastQuizQuestionIndex = -1;

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== "user") {
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed.type === "quiz_question") {
            lastQuizQuestionId = msg._id;
            lastQuizQuestionIndex = i;
            break;
          }
        } catch {
          // Not JSON
        }
      }
    }

    if (!lastQuizQuestionId || lastQuizQuestionIndex === -1) return null;

    for (let i = lastQuizQuestionIndex + 1; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.role === "user") return null;
      try {
        const parsed = JSON.parse(msg.content);
        if (
          parsed.type === "quiz_answer_result" ||
          parsed.type === "quiz_end"
        ) {
          return null;
        }
      } catch {
        // Not JSON
      }
    }

    return lastQuizQuestionId;
  }, [messages]);

  // KeyboardAwareWrapper handles the text composer; FlashList padding reserves
  // the extra action row/gradient space above it.
  const composerBottomInset = Math.max(0, composerHeight);

  return {
    // Navigation
    id,
    router,

    // Refs
    listRef,
    popoverRef,

    // Conversation data
    conversation,
    profile,
    messages,
    threadId,

    // Loading states
    isLoadingConversation,
    isLoadingMessages,
    isLoadingMore,
    isClearing,
    isSending,
    isRequestingImage,
    credits,

    // Pagination
    hasMore,
    loadMore,
    shouldLoadMore,

    // Scroll handlers
    handleScroll,
    handleViewableItemsChanged,
    viewabilityConfig,
    scrollToBottom,
    showScrollToBottom,

    // Keyboard state
    composerHeight,
    setComposerHeight,
    chatFormHeight,
    setChatFormHeight: handleChatFormHeightChange,
    composerBottomInset,
    keyboardHeight,
    setKeyboardHeight,
    blurTrigger,
    isKeyboardOpen,
    dismissKeyboard,

    // Message input
    message,
    setMessage,

    // Typing indicator
    showTypingIndicator,
    isAITyping,
    // Sheet states
    isImageSheetOpen,
    setIsImageSheetOpen,
    isMessageActionsOpen,
    setIsMessageActionsOpen,
    isTopicsSheetOpen,
    setIsTopicsSheetOpen,
    isSuggestionsSheetOpen,
    setIsSuggestionsSheetOpen,
    isActionsSheetOpen,
    setIsActionsSheetOpen,
    isChatLanguageOpen,
    setIsChatLanguageOpen,

    // Computed values
    interactiveQuizQuestionId,

    // Handlers
    handleSend,
    handleStopResponse,
    handleOpenImageSheet,
    handleImageRequest,
    handleStartQuiz,
    handleOpenTopicsSheet,
    handleOpenSuggestionsSheet,
    handleOpenMessageActions,
    handleDeleteMessage,
    handleQuizAnswer,
    handleEndQuiz,
    handleTopicSelect,
    handleSuggestionSelect,
    handleRetryFailedResponse,
    handleClearChat,
    handleOpenChatLanguage,
    handleOpenCreditsModal,
  };
}
