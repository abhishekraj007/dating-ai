import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Avatar, Skeleton, Spinner } from "heroui-native";
import {
  ChevronLeft,
  Phone,
  Video,
  MoreVertical,
  Send,
  Smile,
  Mic,
  Paperclip,
  Camera,
  HelpCircle,
} from "lucide-react-native";
import { useState, useRef, useEffect } from "react";
import {
  useConversation,
  useMessages,
  useSendMessage,
  useDeleteMessage,
  useRequestChatImage,
} from "@/hooks/dating";
import {
  MessageBubble,
  LevelBadge,
  CompatibilityIndicator,
  ImageRequestSheet,
  MessageActionsSheet,
} from "@/components/dating";
import type { ImageRequestOptions } from "@/hooks/dating";
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
  const { messages, isLoading: isLoadingMessages } = useMessages(id);
  const { sendMessage } = useSendMessage();

  // Derive profile - may be undefined while loading
  const profile = conversation?.profile;

  // Image request
  const [isImageSheetOpen, setIsImageSheetOpen] = useState(false);
  const [isRequestingImage, setIsRequestingImage] = useState(false);
  const { requestImage } = useRequestChatImage();
  const { deleteMessage } = useDeleteMessage();

  // Message actions sheet
  const [isMessageActionsOpen, setIsMessageActionsOpen] = useState(false);
  const [selectedMessageOrder, setSelectedMessageOrder] = useState<
    number | null
  >(null);

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
        content: "Let's play a quiz! Ask me questions about yourself.",
      });
    } catch (error) {
      console.error("Failed to start quiz:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Scroll to end when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

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

  const renderMessage = ({ item }: { item: any }) => {
    const isUser = item.role === "user";
    return (
      <MessageBubble
        content={item.content || ""}
        isUser={isUser}
        timestamp={item._creationTime}
        avatarUrl={!isUser ? profile?.avatarUrl : undefined}
        profileName={profile?.name}
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
              <>
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
              </>
            )}
          </View>
          <View className="flex-row gap-1">
            <Button variant="tertiary" size="sm" isIconOnly>
              <Phone size={20} color={foregroundColor} />
            </Button>
            <Button variant="tertiary" size="sm" isIconOnly>
              <Video size={20} color={foregroundColor} />
            </Button>
            <Button variant="tertiary" size="sm" isIconOnly>
              <MoreVertical size={20} color={foregroundColor} />
            </Button>
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
              <Text className="text-muted-foreground text-center">
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
              {isSending ? (
                <Spinner size="sm" />
              ) : (
                <HelpCircle size={16} color={foregroundColor} />
              )}
              <Button.Label>Quiz</Button.Label>
            </Button>
            <Button variant="secondary" size="sm">
              <Button.Label>Topic</Button.Label>
            </Button>
            <Button variant="secondary" size="sm">
              <Button.Label>Suggestion</Button.Label>
            </Button>
          </ScrollView>
        </View>

        {/* Input area */}
        <View className="flex-row items-center px-4 py-3 border-t border-border gap-2">
          <Button variant="tertiary" size="sm" isIconOnly>
            <Smile size={24} color={mutedColor} />
          </Button>
          <View className="flex-1 flex-row items-center bg-surface rounded-full px-4 py-2">
            <TextInput
              className="flex-1 text-foreground"
              placeholder="Type a message ..."
              placeholderTextColor={mutedColor}
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
          </View>
          <Button variant="tertiary" size="sm" isIconOnly>
            <Mic size={24} color={mutedColor} />
          </Button>
          <Button variant="tertiary" size="sm" isIconOnly>
            <Paperclip size={24} color={mutedColor} />
          </Button>
          <Button
            size="sm"
            isIconOnly
            className="rounded-full"
            onPress={handleSend}
            isDisabled={!message.trim() || isSending}
          >
            <Send size={20} color="white" />
          </Button>
        </View>
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
    </SafeAreaView>
  );
}
