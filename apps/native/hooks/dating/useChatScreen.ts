import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Id } from "@dating-ai/backend/convex/_generated/dataModel";
import { useConversation } from "./useConversations";
import {
  useMessages,
  useSendMessage,
  useDeleteMessage,
  useClearChat,
} from "./useMessages";
import { useRequestChatImage } from "./useImageRequest";
import type { ImageRequestOptions } from "./useImageRequest";
import { useChatScroll } from "./useChatScroll";
import { useCredits, CREDIT_COSTS } from "./useCredits";
import { useTranslation } from "@/hooks/use-translation";

const AI_RESPONSE_WAIT_TIMEOUT_MS = 15000;

export function useChatScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isStopRequested, setIsStopRequested] = useState(false);
  const listRef = useRef<any>(null);
  const lastSubmittedInputRef = useRef("");

  // Keyboard composer state
  const [composerHeight, setComposerHeight] = useState(48);
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
  const { requestImage } = useRequestChatImage();
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

  const [isSending, setIsSending] = useState(false);
  const [pendingAssistantState, setPendingAssistantState] = useState<{
    conversationKey: string;
    baselineOrder: number;
  } | null>(null);
  const pendingAssistantTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const conversationKey = threadId ?? id ?? null;

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

  // Chat scroll behavior
  const { shouldLoadMore, handleScroll, scrollToBottom } = useChatScroll({
    listRef,
    messages,
    conversationId: threadId ?? id,
    isLoading: isLoadingMessages,
  });

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

  const sendConversationMessage = useCallback(
    async (content: string, options?: { optimistic?: boolean }) => {
      if (!id || isSending) {
        return false;
      }

      if (!hasEnoughCredits("TEXT_MESSAGE")) {
        router.push("/buy-credits");
        return false;
      }

      setIsStopRequested(false);
      setIsSending(true);
      startPendingAssistantState();

      try {
        if (options?.optimistic) {
          await sendMessageWithOptimistic(
            { conversationId: id as Id<"aiConversations">, content },
            threadId,
          );
        } else {
          await sendMessage({
            conversationId: id as Id<"aiConversations">,
            content,
          });
        }

        return true;
      } catch (error: any) {
        clearPendingAssistantState();

        if (error.message?.includes("Insufficient credits")) {
          router.push("/buy-credits");
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
      id,
      isSending,
      router,
      t,
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
    async (options: ImageRequestOptions) => {
      if (!id) return;

      // Client-side credit check for image requests (5 credits)
      if (!hasEnoughCredits("IMAGE_REQUEST")) {
        router.push("/buy-credits");
        return;
      }

      setIsRequestingImage(true);
      try {
        await requestImage(id, options);
        setIsImageSheetOpen(false);
      } catch (error: any) {
        if (error.message && error.message.includes("Insufficient credits")) {
          router.push("/buy-credits");
        } else {
          console.error("Failed to request image:", error);
        }
      } finally {
        setIsRequestingImage(false);
      }
    },
    [id, requestImage, hasEnoughCredits, router],
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

  // Total bottom inset for messages
  const totalBottomInset = composerHeight + 16;

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

    // Pagination
    hasMore,
    loadMore,
    shouldLoadMore,

    // Scroll handlers
    handleScroll,

    // Keyboard state
    composerHeight,
    setComposerHeight,
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

    // Computed values
    interactiveQuizQuestionId,
    totalBottomInset,

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
  };
}
