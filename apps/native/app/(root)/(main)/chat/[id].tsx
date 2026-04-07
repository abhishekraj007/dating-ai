import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { KeyboardComposer } from "@launchhq/react-native-keyboard-composer";
import { FlashList } from "@shopify/flash-list";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  Button,
  Avatar,
  Skeleton,
  Spinner,
  Popover,
  ScrollShadow,
} from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  MoreVertical,
  Camera,
  HelpCircle,
  MessageSquare,
  Lightbulb,
  Trash2,
  Plus,
} from "lucide-react-native";
import {
  MessageBubble,
  ImageRequestSheet,
  MessageActionsSheet,
  TopicsSheet,
  SuggestionsSheet,
  TypingIndicator,
} from "@/components/dating";
import { useChatScreen } from "@/hooks/dating";
import { useThemeColor } from "heroui-native";
import { useTranslation } from "@/hooks/use-translation";

const BOTTOM_SHADOW_SIZE = 20;

export default function ChatScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const foregroundColor = useThemeColor("foreground");
  const mutedColor = useThemeColor("muted");
  const { height } = useWindowDimensions();
  const emptyHeight = height - 350;

  const {
    // Navigation
    router,

    // Refs
    listRef,
    popoverRef,

    // Conversation data
    conversation,
    profile,
    messages,

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
    setKeyboardHeight,
    blurTrigger,
    isKeyboardOpen,
    dismissKeyboard,

    // Message input
    setMessage,

    // Typing indicator
    showTypingIndicator,
    // Sheet states
    isImageSheetOpen,
    setIsImageSheetOpen,
    isMessageActionsOpen,
    setIsMessageActionsOpen,
    isTopicsSheetOpen,
    setIsTopicsSheetOpen,
    isSuggestionsSheetOpen,
    setIsSuggestionsSheetOpen,

    // Computed values
    interactiveQuizQuestionId,

    // Handlers
    handleSend,
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
  } = useChatScreen();

  const renderMessage = ({ item }: { item: any }) => {
    const isUser = item.role === "user";
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
        onRetryChatError={handleRetryFailedResponse}
        isRetrying={isSending}
        onLongPress={
          isUser ? () => handleOpenMessageActions(item.order) : undefined
        }
      />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-2 py-2 border-b border-border bg-transparent">
          <View className="flex-row items-center gap-2">
            <Button
              variant="tertiary"
              size="sm"
              isIconOnly
              onPress={() => router.back()}
              className="rounded-full"
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
                      `/(root)/(main)/profile/${conversation.aiProfileId}`,
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
                <Text className="text-foreground font-semibold">
                  {profile?.name ?? "AI"}
                </Text>
              </Pressable>
            )}
          </View>
          <View className="flex-row gap-1">
            <Popover>
              <Popover.Trigger ref={popoverRef} asChild>
                <Button
                  variant="tertiary"
                  size="sm"
                  isIconOnly
                  className="rounded-full"
                >
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
                  presentation="popover"
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

        <View style={{ flex: 1 }}>
          {/* Messages with bottom scroll shadow */}
          <View style={{ flex: 1 }}>
            <ScrollShadow
              size={BOTTOM_SHADOW_SIZE}
              visibility="bottom"
              LinearGradientComponent={LinearGradient}
              style={{ flex: 1 }}
            >
              <FlashList
                ref={listRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{
                  paddingTop: 16,
                  paddingBottom: 16,
                }}
                showsVerticalScrollIndicator={false}
                keyboardDismissMode="interactive"
                keyboardShouldPersistTaps="handled"
                onScroll={handleScroll}
                onScrollBeginDrag={dismissKeyboard}
                scrollEventThrottle={16}
                onStartReached={() => {
                  if (!shouldLoadMore() || !hasMore || isLoadingMore) {
                    return;
                  }
                  loadMore();
                }}
                onStartReachedThreshold={0.3}
                ListHeaderComponent={
                  isLoadingMore ? (
                    <View className="py-4 items-center">
                      <Spinner size="sm" />
                    </View>
                  ) : null
                }
                ListFooterComponent={
                  showTypingIndicator ? (
                    <View className="pt-2">
                      <TypingIndicator
                        avatarUrl={profile?.avatarUrl}
                        profileName={profile?.name}
                      />
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  isLoadingConversation || isLoadingMessages ? (
                    <View className="p-4 gap-4">
                      <View className="flex-row gap-2">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <View className="gap-2">
                          <Skeleton className="h-16 w-52 rounded-2xl rounded-tl-sm" />
                          <Skeleton className="h-3 w-12" />
                        </View>
                      </View>
                      <View className="flex-row justify-end">
                        <View className="gap-2 items-end">
                          <Skeleton className="h-10 w-40 rounded-2xl rounded-br-sm" />
                          <Skeleton className="h-3 w-10" />
                        </View>
                      </View>
                      <View className="flex-row gap-2">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <View className="gap-2">
                          <Skeleton className="h-24 w-64 rounded-2xl rounded-tl-sm" />
                          <Skeleton className="h-3 w-12" />
                        </View>
                      </View>
                    </View>
                  ) : !conversation ? (
                    <View
                      className="flex-1 items-center justify-center px-6 pt-20"
                      style={{
                        height: emptyHeight,
                      }}
                    >
                      <Text className="text-foreground text-lg font-semibold mb-2">
                        {t("chat.conversationNotFound")}
                      </Text>
                      <Button className="mt-4" onPress={() => router.back()}>
                        <Button.Label>{t("common.goBack")}</Button.Label>
                      </Button>
                    </View>
                  ) : (
                    <View
                      className="flex-1 items-center justify-center px-6 pt-20"
                      style={{
                        height: emptyHeight,
                      }}
                    >
                      <Text className="text-foreground text-lg font-semibold mb-2">
                        {t("chat.startConversation")}
                      </Text>
                      <Text className="text-muted text-center">
                        {t("chat.sayHello", {
                          name: profile?.name ?? t("chat.aiCompanion"),
                        })}
                      </Text>
                    </View>
                  )
                }
              />
            </ScrollShadow>
          </View>

          <KeyboardStickyView>
            <LinearGradient
              colors={[
                "rgba(0, 0, 0, 0)",
                "rgba(0, 0, 0, 0.8)",
                "rgba(0, 0, 0, 1)",
              ]}
              locations={[0, 0.45, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[
                styles.composerContainer,
                {
                  paddingBottom: isKeyboardOpen
                    ? 8
                    : Math.max(insets.bottom, 8),
                },
              ]}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: 10,
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={handleOpenImageSheet}
                  isDisabled={isRequestingImage}
                >
                  {isRequestingImage ? (
                    <Spinner size="sm" />
                  ) : (
                    <Camera size={16} color={foregroundColor} />
                  )}
                  <Button.Label>{t("chat.selfie")}</Button.Label>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={handleStartQuiz}
                  isDisabled={isSending}
                >
                  <HelpCircle size={16} color={foregroundColor} />
                  <Button.Label>{t("chat.quiz")}</Button.Label>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={handleOpenTopicsSheet}
                  isDisabled={isSending}
                >
                  <MessageSquare size={16} color={foregroundColor} />
                  <Button.Label>{t("chat.topic")}</Button.Label>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={handleOpenSuggestionsSheet}
                  isDisabled={isSending}
                >
                  <Lightbulb size={16} color={foregroundColor} />
                  <Button.Label>{t("chat.suggestion")}</Button.Label>
                </Button>
              </ScrollView>
              <View style={[styles.composerRow]}>
                {/* <Button
                  variant="secondary"
                  isDisabled={isSending}
                  className="mr-2 p-2 rounded-full w-12 h-12"
                >
                  <Plus size={24} color={mutedColor} />
                </Button> */}
                <View
                  style={[
                    styles.composerWrapper,
                    { height: composerHeight, flex: 1 },
                  ]}
                >
                  <KeyboardComposer
                    placeholder={t("chat.typeMessage")}
                    onSend={handleSend}
                    onChangeText={setMessage}
                    onHeightChange={setComposerHeight}
                    onKeyboardHeightChange={setKeyboardHeight}
                    isStreaming={showTypingIndicator}
                    blurTrigger={blurTrigger}
                    editable={!isSending}
                    minHeight={48}
                    maxHeight={120}
                  />
                </View>
              </View>
            </LinearGradient>
          </KeyboardStickyView>
        </View>
      </View>

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

const styles = StyleSheet.create({
  composerContainer: {
    paddingTop: 8,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
  },
  composerWrapper: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
});
