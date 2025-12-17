import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
  Keyboard,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Avatar, Skeleton, Spinner, Popover } from "heroui-native";
import {
  ChevronLeft,
  Phone,
  Video,
  MoreVertical,
  Camera,
  HelpCircle,
  MessageSquare,
  Lightbulb,
  Trash2,
} from "lucide-react-native";
import { useState, useRef, useCallback, useMemo } from "react";
import {
  useConversation,
  useMessages,
  useSendMessage,
  useDeleteMessage,
  useClearChat,
  useRequestChatImage,
  useChatScroll,
} from "@/hooks/dating";
import {
  MessageBubble,
  LevelBadge,
  CompatibilityIndicator,
  ImageRequestSheet,
  MessageActionsSheet,
  TopicsSheet,
  SuggestionsSheet,
  ChatInputBox,
} from "@/components/dating";
import type { ImageRequestOptions } from "@/hooks/dating";
import type { TopicId } from "@/components/dating";
import { useThemeColor } from "heroui-native";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const foregroundColor = useThemeColor("foreground");
  const mutedColor = useThemeColor("muted");
  const [message, setMessage] = useState("");
  const listRef = useRef<any>(null);

  // Conversation and messages
  const { conversation, isLoading: isLoadingConversation } =
    useConversation(id);
  // Use threadId from conversation for message fetching
  const threadId = conversation?.threadId;
  const {
    messages,
    isLoading: isLoadingMessages,
    isLoadingMore,
    hasMore,
    loadMore,
  } = useMessages(threadId);

  const { sendMessage } = useSendMessage();

  // Chat scroll behavior - WhatsApp-like
  const { shouldLoadMore } = useChatScroll({
    listRef,
    messagesLength: messages.length,
    conversationId: id,
    isLoading: isLoadingMessages,
  });

  // Derive profile - may be undefined while loading
  const profile = conversation?.profile;

  // Image request
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

  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || !id || isSending) return;

    const content = message.trim();
    setMessage("");
    setIsSending(true);

    await sendMessage({
      conversationId: id as any,
      content,
    });

    setIsSending(false);
  };

  // Handle image request
  const handleImageRequest = async (options: ImageRequestOptions) => {
    if (!id) return;
    setIsRequestingImage(true);
    try {
      await requestImage(id, options);
      setIsImageSheetOpen(false);
    } catch (error) {
      console.error("Failed to request image:", error);
    } finally {
      setIsRequestingImage(false);
    }
  };

  // Handle starting quiz - send a message to trigger the agent's quiz flow
  const handleStartQuiz = async () => {
    if (!id || isSending) return;
    setIsSending(true);
    try {
      // Send a message to trigger the agent's quiz mode
      await sendMessage({
        conversationId: id as any,
        content: "Let's play quiz!",
      });
    } catch (error) {
      console.error("Failed to start quiz:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenMessageActions = (messageOrder: number) => {
    setSelectedMessageOrder(messageOrder);
    setIsMessageActionsOpen(true);
  };

  const handleDeleteMessage = async () => {
    if (selectedMessageOrder === null) return;
    try {
      await deleteMessage(id as string, selectedMessageOrder);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
    setSelectedMessageOrder(null);
  };

  // Handle quiz answer - send the answer as a chat message
  const handleQuizAnswer = async (answer: string) => {
    if (!id || isSending) return;
    setIsSending(true);
    try {
      await sendMessage({
        conversationId: id as any,
        content: answer,
      });
    } catch (error) {
      console.error("Failed to send quiz answer:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle ending the quiz
  const handleEndQuiz = async () => {
    if (!id || isSending) return;
    setIsSending(true);
    try {
      await sendMessage({
        conversationId: id as any,
        content: "End the quiz",
      });
    } catch (error) {
      console.error("Failed to end quiz:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle topic selection - send the topic prompt as a message
  const handleTopicSelect = async (topic: {
    id: string;
    label: string;
    prompt: string;
  }) => {
    if (!id || isSending) return;
    setIsTopicsSheetOpen(false);
    setIsSending(true);
    try {
      await sendMessage({
        conversationId: id as any,
        content: topic.prompt,
      });
    } catch (error) {
      console.error("Failed to send topic message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle suggestion selection - send the suggestion as a message
  const handleSuggestionSelect = async (suggestion: string) => {
    if (!id || isSending) return;
    setIsSuggestionsSheetOpen(false);
    setIsSending(true);
    try {
      await sendMessage({
        conversationId: id as any,
        content: suggestion,
      });
    } catch (error) {
      console.error("Failed to send suggestion message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle clear chat with confirmation
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
      ]
    );
  }, [id, threadId, profile?.name, clearChat]);

  // Determine which quiz question (if any) should be interactive
  // A quiz question is interactive if it's the last one and has no answer after it
  const interactiveQuizQuestionId = useMemo(() => {
    if (!messages.length) return null;

    let lastQuizQuestionId: string | null = null;
    let lastQuizQuestionIndex = -1;

    // Find the last quiz_question
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

    // Check if there's a user response or quiz_answer_result after it
    for (let i = lastQuizQuestionIndex + 1; i < messages.length; i++) {
      const msg = messages[i];
      // User answered
      if (msg.role === "user") return null;
      // AI gave a result (means question was answered)
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

  const renderMessage = ({ item }: { item: any }) => {
    const isUser = item.role === "user";
    // A quiz question is interactive only if it's the last unanswered question
    const isInteractiveQuizQuestion = item._id === interactiveQuizQuestionId;

    return (
      <MessageBubble
        content={item.content || ""}
        isUser={isUser}
        timestamp={item._creationTime}
        avatarUrl={!isUser ? profile?.avatarUrl : undefined}
        profileName={profile?.name}
        isQuizActive={isInteractiveQuizQuestion}
        onQuizAnswer={handleQuizAnswer}
        onEndQuiz={handleEndQuiz}
        onLongPress={
          isUser ? () => handleOpenMessageActions(item.order) : undefined
        }
      />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-2 py-2 border-b border-border">
          <View className="flex-row items-center gap-2">
            <Button
              variant="tertiary"
              size="sm"
              isIconOnly
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={foregroundColor} />
            </Button>
            {isLoadingConversation ? (
              <>
                <Skeleton className="w-10 h-10 rounded-full" />
                <View>
                  <Skeleton className="h-4 w-24 rounded" />
                </View>
              </>
            ) : (
              <Pressable
                onPress={() => {
                  if (conversation?.aiProfileId) {
                    router.push(
                      `/(root)/(main)/profile/${conversation.aiProfileId}`
                    );
                  }
                }}
                className="flex-row items-center gap-2 active:opacity-70"
              >
                <Avatar size="sm" alt={profile?.name ?? "AI"}>
                  {profile?.avatarUrl ? (
                    <Avatar.Image source={{ uri: profile.avatarUrl }} />
                  ) : (
                    <Avatar.Fallback>
                      {profile?.name?.[0] ?? "AI"}
                    </Avatar.Fallback>
                  )}
                </Avatar>
                <View>
                  <Text className="text-foreground font-semibold">
                    {profile?.name ?? "AI"}
                  </Text>
                </View>
              </Pressable>
            )}
          </View>
          <View className="flex-row gap-1">
            <Button variant="tertiary" size="sm" isIconOnly>
              <Phone size={20} color={foregroundColor} />
            </Button>
            <Button variant="tertiary" size="sm" isIconOnly>
              <Video size={20} color={foregroundColor} />
            </Button>
            <Popover>
              <Popover.Trigger ref={popoverRef} asChild>
                <Button variant="tertiary" size="sm" isIconOnly>
                  {isClearing ? (
                    <Spinner size="sm" />
                  ) : (
                    <MoreVertical size={20} color={foregroundColor} />
                  )}
                </Button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Overlay />
                <Popover.Content
                  placement="bottom"
                  align="end"
                  className="rounded-xl p-2"
                  width={180}
                >
                  <Pressable
                    onPress={handleClearChat}
                    className="flex-row items-center gap-3 px-3 py-3 rounded-lg active:bg-surface"
                  >
                    <Trash2 size={20} color="#ef4444" />
                    <Text className="text-red-500 text-base font-medium">
                      Clear Chat
                    </Text>
                  </Pressable>
                </Popover.Content>
              </Popover.Portal>
            </Popover>
          </View>
        </View>

        {/* Messages */}
        <View style={{ flex: 1, position: "relative" }}>
          {isLoadingConversation || isLoadingMessages ? (
            // Skeleton messages while loading
            <View className="flex-1 p-4 gap-4">
              {/* AI message skeleton */}
              <View className="flex-row gap-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <View className="gap-2">
                  <Skeleton className="h-16 w-52 rounded-2xl rounded-tl-sm" />
                  <Skeleton className="h-3 w-12" />
                </View>
              </View>
              {/* User message skeleton */}
              <View className="flex-row justify-end">
                <View className="gap-2 items-end">
                  <Skeleton className="h-10 w-40 rounded-2xl rounded-br-sm" />
                  <Skeleton className="h-3 w-10" />
                </View>
              </View>
              {/* AI message skeleton */}
              <View className="flex-row gap-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <View className="gap-2">
                  <Skeleton className="h-24 w-64 rounded-2xl rounded-tl-sm" />
                  <Skeleton className="h-3 w-12" />
                </View>
              </View>
            </View>
          ) : !conversation ? (
            // Conversation not found
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-foreground text-lg font-semibold mb-2">
                Conversation not found
              </Text>
              <Button className="mt-4" onPress={() => router.back()}>
                <Button.Label>Go Back</Button.Label>
              </Button>
            </View>
          ) : messages.length === 0 ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 24,
              }}
            >
              <Text className="text-foreground text-lg font-semibold mb-2">
                Start a conversation
              </Text>
              <Text className="text-muted text-center">
                Say hello to {profile?.name ?? "your AI companion"}!
              </Text>
            </View>
          ) : (
            <FlashList
              ref={listRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{
                paddingVertical: 16,
              }}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={Keyboard.dismiss}
              onStartReached={() => {
                // Don't load more during initial scroll or if already loading
                if (!shouldLoadMore() || !hasMore || isLoadingMore) {
                  return;
                }
                loadMore();
              }}
              onStartReachedThreshold={0.3}
              maintainVisibleContentPosition={{
                minIndexForVisible: 1,
              }}
              estimatedItemSize={80}
              ListHeaderComponent={
                isLoadingMore ? (
                  <View className="py-4 items-center">
                    <Spinner size="sm" />
                  </View>
                ) : null
              }
            />
          )}
        </View>

        {/* Action buttons */}
        <View className="border-t border-border">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              gap: 8,
              alignItems: "center",
            }}
          >
            <Button
              variant="secondary"
              size="sm"
              onPress={() => setIsImageSheetOpen(true)}
              isDisabled={isRequestingImage}
            >
              {isRequestingImage ? (
                <Spinner size="sm" />
              ) : (
                <Camera size={16} color={foregroundColor} />
              )}
              <Button.Label>Selfie</Button.Label>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={handleStartQuiz}
              isDisabled={isSending}
            >
              <HelpCircle size={16} color={foregroundColor} />
              <Button.Label>Quiz</Button.Label>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => setIsTopicsSheetOpen(true)}
              isDisabled={isSending}
            >
              <MessageSquare size={16} color={foregroundColor} />
              <Button.Label>Topic</Button.Label>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => setIsSuggestionsSheetOpen(true)}
              isDisabled={isSending}
            >
              <Lightbulb size={16} color={foregroundColor} />
              <Button.Label>Suggestion</Button.Label>
            </Button>
          </ScrollView>
        </View>

        {/* Input area */}
        <ChatInputBox
          message={message}
          onChangeText={setMessage}
          onSend={handleSend}
          isSending={isSending}
        />
      </KeyboardAvoidingView>

      {/* Image Request Sheet */}
      <ImageRequestSheet
        isOpen={isImageSheetOpen}
        onClose={() => setIsImageSheetOpen(false)}
        onSubmit={handleImageRequest}
        isLoading={isRequestingImage}
        credits={5}
      />

      {/* Message Actions Sheet */}
      <MessageActionsSheet
        isOpen={isMessageActionsOpen}
        onClose={() => setIsMessageActionsOpen(false)}
        onDelete={handleDeleteMessage}
      />

      {/* Topics Sheet */}
      <TopicsSheet
        isOpen={isTopicsSheetOpen}
        onClose={() => setIsTopicsSheetOpen(false)}
        onSelectTopic={handleTopicSelect}
      />

      {/* Suggestions Sheet */}
      <SuggestionsSheet
        isOpen={isSuggestionsSheetOpen}
        onClose={() => setIsSuggestionsSheetOpen(false)}
        onSelectSuggestion={handleSuggestionSelect}
      />
    </SafeAreaView>
  );
}
