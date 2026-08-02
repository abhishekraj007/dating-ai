import { View, Text, Pressable, useWindowDimensions } from "react-native";
import {
  KeyboardGestureArea,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import {
  useSafeAreaInsets,
  SafeAreaView,
} from "react-native-safe-area-context";
import { Button, Avatar, Skeleton, Spinner, Popover } from "heroui-native";
import { CachedAvatarImage } from "@/components/cached-avatar-image";
import {
  ChevronLeft,
  Hand,
  MessageCircle,
  MoreVertical,
  Trash2,
} from "lucide-react-native";
import { LanguageSheet } from "@/components/language/language-sheet";
import {
  ChatForm,
  ChatMessageList,
  ImageRequestSheet,
  MessageActionsSheet,
  TopicsSheet,
  SuggestionsSheet,
} from "@/components/dating";
import { useChatScreen } from "@/hooks/dating";
import { useThemeColor } from "heroui-native";
import { useTranslation } from "@/hooks/use-translation";

export default function ChatScreen() {
  const { t } = useTranslation();
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const foregroundColor = useThemeColor("foreground");
  const foregroundColorMuted = useThemeColor("muted");
  const { height } = useWindowDimensions();
  const emptyHeight = height - 350;

  const {
    // Navigation
    id,
    router,

    // Refs
    listRef,
    composerRef,
    popoverRef,

    // Conversation data
    conversation,
    profile,
    messages,
    threadId,

    // Loading states
    isLoadingConversation,
    isLoadingMessages,
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
    scrollToBottom,
    showScrollToBottom,
    hasUnseenMessages,
    isFollowingLatest,
    contentInsetEndAdjustment,
    onComposerLayout,
    handleScrollBeginDrag,
    handleScrollEnd,

    // Keyboard state
    composerHeight,
    setComposerHeight,
    setKeyboardHeight,
    blurTrigger,
    isKeyboardOpen,
    dismissKeyboard,

    // Message input
    message,
    setMessage,

    // Typing indicator
    showTypingIndicator,
    isResponseStreaming,
    // Sheet states
    isImageSheetOpen,
    setIsImageSheetOpen,
    isMessageActionsOpen,
    setIsMessageActionsOpen,
    isTopicsSheetOpen,
    setIsTopicsSheetOpen,
    isSuggestionsSheetOpen,
    setIsSuggestionsSheetOpen,
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
  } = useChatScreen();

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
                    <CachedAvatarImage uri={profile.avatarUrl} />
                  ) : (
                    <Avatar.Fallback>
                      {profile?.name?.[0] ?? "AI"}
                    </Avatar.Fallback>
                  )}
                </Avatar>
                <View style={{ flexDirection: "column" }}>
                  <Text className="text-foreground font-semibold text-base">
                    {profile?.name ?? "AI"}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <View className="w-2 h-2 bg-green-500 rounded-full" />
                    <Text className="text-foreground/60 text-[10px]">
                      {t("chat.aiCharacter")}
                    </Text>
                  </View>
                </View>
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
                  width={200}
                >
                  <Pressable
                    onPress={handleOpenChatLanguage}
                    className="flex-row items-center gap-3 px-3 py-3 rounded-lg active:bg-surface"
                  >
                    <MessageCircle size={20} color={foregroundColor} />
                    <Text className="text-foreground text-base font-medium">
                      {t("account.item.chatLanguage")}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleClearChat}
                    className="flex-row items-center gap-3 px-3 py-3 rounded-lg active:bg-surface"
                  >
                    <Trash2 size={20} color="#ef4444" />
                    <Text className="text-red-500 text-base font-medium">
                      {t("chat.clearTitle")}
                    </Text>
                  </Pressable>
                </Popover.Content>
              </Popover.Portal>
            </Popover>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <KeyboardGestureArea interpolator="ios" style={{ flex: 1 }}>
            <ChatMessageList
              listRef={listRef}
              messages={messages}
              conversationKey={threadId ?? id ?? "chat"}
              conversationExists={Boolean(conversation)}
              isLoadingConversation={isLoadingConversation}
              isLoadingMessages={isLoadingMessages}
              hasMore={hasMore}
              shouldLoadMore={shouldLoadMore}
              loadMore={loadMore}
              profile={profile}
              interactiveQuizQuestionId={interactiveQuizQuestionId}
              isSending={isSending}
              isFollowingLatest={isFollowingLatest}
              isResponseStreaming={isResponseStreaming}
              showTypingIndicator={showTypingIndicator}
              emptyHeight={emptyHeight}
              keyboardOffset={safeAreaBottom}
              foregroundColorMuted={foregroundColorMuted}
              contentInsetEndAdjustment={contentInsetEndAdjustment}
              onScroll={handleScroll}
              onScrollBeginDrag={handleScrollBeginDrag}
              onScrollEnd={handleScrollEnd}
              onGoBack={() => router.back()}
              onSendGreeting={() => handleSend("Hi")}
              onQuizAnswer={handleQuizAnswer}
              onEndQuiz={handleEndQuiz}
              onRetryChatError={handleRetryFailedResponse}
              onBuyCredits={handleOpenCreditsModal}
              onOpenMessageActions={handleOpenMessageActions}
            />
          </KeyboardGestureArea>

          <KeyboardStickyView
            offset={{ closed: 0 }}
            pointerEvents="box-none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 20,
            }}
          >
            <ChatForm
              composerRef={composerRef}
              onComposerLayout={onComposerLayout}
              composerHeight={composerHeight}
              onComposerHeightChange={setComposerHeight}
              onKeyboardHeightChange={setKeyboardHeight}
              blurTrigger={blurTrigger}
              isKeyboardOpen={isKeyboardOpen}
              showScrollToBottom={showScrollToBottom}
              hasUnseenMessages={hasUnseenMessages}
              message={message}
              onChangeMessage={setMessage}
              onSend={handleSend}
              onScrollToBottom={() => scrollToBottom(true)}
              onStopResponse={handleStopResponse}
              isResponseStreaming={isResponseStreaming}
              isSending={isSending}
              isRequestingImage={isRequestingImage}
              onOpenImageSheet={handleOpenImageSheet}
              onStartQuiz={handleStartQuiz}
              onOpenTopicsSheet={handleOpenTopicsSheet}
              onOpenSuggestionsSheet={handleOpenSuggestionsSheet}
            />
          </KeyboardStickyView>
        </View>
      </View>

      {/* Image Request Sheet */}
      <ImageRequestSheet
        isOpen={isImageSheetOpen}
        onClose={() => setIsImageSheetOpen(false)}
        onSubmit={handleImageRequest}
        onBuyCredits={handleOpenCreditsModal}
        isLoading={isRequestingImage}
        credits={credits}
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

      <LanguageSheet
        variant="chat"
        isOpen={isChatLanguageOpen}
        onOpenChange={setIsChatLanguageOpen}
      />
    </SafeAreaView>
  );
}
