import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Id } from "@dating-ai/backend/convex/_generated/dataModel";
import {
  useConversation,
  useMessages,
  useSendMessage,
  useDeleteMessage,
  useClearChat,
  useRequestChatImage,
  useChatScroll,
  useCredits,
  CREDIT_COSTS,
} from "@/hooks/dating";
import type { ImageRequestOptions } from "@/hooks/dating";

export function useChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const listRef = useRef<any>(null);

  // Keyboard composer state
  const [composerHeight, setComposerHeight] = useState(48);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [blurTrigger, setBlurTrigger] = useState(0);
  const isKeyboardOpen = keyboardHeight > 0;

  // Dismiss keyboard when tapping outside
  const dismissKeyboard = useCallback(() => setBlurTrigger(Date.now()), []);

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

  const { sendMessage, sendMessageWithOptimistic } = useSendMessage();

  // Credits for client-side checking
  const { credits, hasEnoughCredits } = useCredits();

  // Chat scroll behavior
  const {
    shouldLoadMore,
    handleScroll,
    scrollToBottom,
    viewabilityConfig,
    onViewableItemsChanged,
    initialScrollIndex,
    initialScrollIndexParams,
  } = useChatScroll({
    listRef,
    messages,
    conversationId: id,
    isLoading: isLoadingMessages,
  });

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
  const pendingResponseRef = useRef<number | null>(null);

  // Compute if we should show typing indicator
  const isWaitingForAI = useMemo(() => {
    if (pendingResponseRef.current === null) return false;
    const aiMessagesAfterSend = messages.filter(
      (m) => m.role !== "user" && m.order > pendingResponseRef.current!,
    );
    if (aiMessagesAfterSend.length > 0) {
      pendingResponseRef.current = null;
      return false;
    }
    return true;
  }, [messages]);

  const showTypingIndicator = isSending || isAITyping || isWaitingForAI;

  // Reset isSending when AI starts responding
  useEffect(() => {
    if (isAITyping) {
      setIsSending(false);
    }
  }, [isAITyping]);

  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim() || !id || isSending) return;

      // Client-side credit check for text messages (1 credit)
      if (!hasEnoughCredits("TEXT_MESSAGE")) {
        router.push("/buy-credits");
        return;
      }

      const content = text.trim();

      setBlurTrigger(Date.now());
      setMessage("");
      setIsSending(true);

      const currentMaxOrder =
        messages.length > 0 ? Math.max(...messages.map((m) => m.order)) : 0;
      pendingResponseRef.current = currentMaxOrder;

      sendMessageWithOptimistic(
        { conversationId: id as Id<"aiConversations">, content },
        threadId,
      ).catch((error) => {
        if (error.message && error.message.includes("Insufficient credits")) {
          // Reset sending state and redirect to buy credits
          setIsSending(false);
          router.push("/buy-credits");
        } else {
          console.error("Failed to send message:", error);
        }
      });

      // Scroll to bottom when user sends message
      scrollToBottom(true);

      setTimeout(() => {
        setIsSending(false);
      }, 10000); // Timeout to reset sending state if no response
    },
    [
      id,
      isSending,
      messages,
      sendMessageWithOptimistic,
      threadId,
      scrollToBottom,
      router,
      hasEnoughCredits,
    ],
  );

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

  const handleStartQuiz = useCallback(async () => {
    if (!id || isSending) return;

    // Client-side credit check for text messages (1 credit)
    if (!hasEnoughCredits("TEXT_MESSAGE")) {
      router.push("/buy-credits");
      return;
    }

    setIsSending(true);
    try {
      await sendMessage({
        conversationId: id as any,
        content: "Let's play quiz!",
      });
    } catch (error: any) {
      if (error.message?.includes("Insufficient credits")) {
        router.push("/buy-credits");
      } else {
        console.error("Failed to start quiz:", error);
      }
    } finally {
      setIsSending(false);
    }
  }, [id, isSending, sendMessage, hasEnoughCredits, router]);

  const handleOpenMessageActions = useCallback((messageOrder: number) => {
    setSelectedMessageOrder(messageOrder);
    setIsMessageActionsOpen(true);
  }, []);

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

      // Client-side credit check for text messages (1 credit)
      if (!hasEnoughCredits("TEXT_MESSAGE")) {
        router.push("/buy-credits");
        return;
      }

      setIsSending(true);
      try {
        await sendMessage({
          conversationId: id as any,
          content: answer,
        });
      } catch (error: any) {
        if (error.message?.includes("Insufficient credits")) {
          router.push("/buy-credits");
        } else {
          console.error("Failed to send quiz answer:", error);
        }
      } finally {
        setIsSending(false);
      }
    },
    [id, isSending, sendMessage, hasEnoughCredits, router],
  );

  const handleEndQuiz = useCallback(async () => {
    if (!id || isSending) return;

    // Client-side credit check for text messages (1 credit)
    if (!hasEnoughCredits("TEXT_MESSAGE")) {
      router.push("/buy-credits");
      return;
    }

    setIsSending(true);
    try {
      await sendMessage({
        conversationId: id as any,
        content: "End the quiz",
      });
    } catch (error: any) {
      if (error.message?.includes("Insufficient credits")) {
        router.push("/buy-credits");
      } else {
        console.error("Failed to end quiz:", error);
      }
    } finally {
      setIsSending(false);
    }
  }, [id, isSending, sendMessage, hasEnoughCredits, router]);

  const handleTopicSelect = useCallback(
    async (topic: { id: string; label: string; prompt: string }) => {
      if (!id || isSending) return;

      // Client-side credit check for text messages (1 credit)
      if (!hasEnoughCredits("TEXT_MESSAGE")) {
        router.push("/buy-credits");
        return;
      }

      setIsTopicsSheetOpen(false);
      setIsSending(true);
      try {
        await sendMessage({
          conversationId: id as any,
          content: topic.prompt,
        });
      } catch (error: any) {
        if (error.message?.includes("Insufficient credits")) {
          router.push("/buy-credits");
        } else {
          console.error("Failed to send topic message:", error);
        }
      } finally {
        setIsSending(false);
      }
    },
    [id, isSending, sendMessage, hasEnoughCredits, router],
  );

  const handleSuggestionSelect = useCallback(
    async (suggestion: string) => {
      if (!id || isSending) return;

      // Client-side credit check for text messages (1 credit)
      if (!hasEnoughCredits("TEXT_MESSAGE")) {
        router.push("/buy-credits");
        return;
      }

      setIsSuggestionsSheetOpen(false);
      setIsSending(true);
      try {
        await sendMessage({
          conversationId: id as any,
          content: suggestion,
        });
      } catch (error: any) {
        if (error.message?.includes("Insufficient credits")) {
          router.push("/buy-credits");
        } else {
          console.error("Failed to send suggestion message:", error);
        }
      } finally {
        setIsSending(false);
      }
    },
    [id, isSending, sendMessage, hasEnoughCredits, router],
  );

  const handleClearChat = useCallback(() => {
    popoverRef.current?.close();
    Alert.alert(
      "Clear Chat",
      `Are you sure you want to delete all messages and images with ${profile?.name ?? "this AI"}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            if (!id) return;
            setIsClearing(true);
            try {
              await clearChat(id, threadId);
            } catch (error) {
              console.error("Failed to clear chat:", error);
              Alert.alert("Error", "Failed to clear chat. Please try again.");
            } finally {
              setIsClearing(false);
            }
          },
        },
      ],
    );
  }, [id, threadId, profile?.name, clearChat]);

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
    viewabilityConfig,
    onViewableItemsChanged,
    initialScrollIndex,
    initialScrollIndexParams,

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
    handleImageRequest,
    handleStartQuiz,
    handleOpenMessageActions,
    handleDeleteMessage,
    handleQuizAnswer,
    handleEndQuiz,
    handleTopicSelect,
    handleSuggestionSelect,
    handleClearChat,
  };
}
