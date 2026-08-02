import { useCallback, useMemo, useState, type RefObject } from "react";
import {
  View,
  Text,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import {
  type LegendListRef,
  type LegendListRenderItemProps,
} from "@legendapp/list/react-native";
import { KeyboardAwareLegendList } from "@legendapp/list/keyboard";
import type { SharedValue } from "react-native-reanimated";
import { Button, Skeleton } from "heroui-native";
import { Hand } from "lucide-react-native";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./bubbles/TypingIndicator";
import type { ProcessedMessage } from "@/hooks/dating/useMessages";
import { useTranslation } from "@/hooks/use-translation";

const ESTIMATED_MESSAGE_HEIGHT = 60;
const TURN_TOP_OFFSET = 16;
const HISTORY_PREFETCH_THRESHOLD = 1.5;
const MAINTAIN_VISIBLE_CONTENT_POSITION = { data: true, size: true } as const;
const MAINTAIN_SCROLL_AT_END = {
  animated: false,
  on: { dataChange: true },
} as const;
const ACTIVE_ASSISTANT_KEY = "active-assistant-response";

interface TypingIndicatorMessage extends ProcessedMessage {
  isTypingIndicator: true;
}

type ChatListMessage = ProcessedMessage | TypingIndicatorMessage;

const TYPING_INDICATOR_MESSAGE: TypingIndicatorMessage = {
  _id: ACTIVE_ASSISTANT_KEY,
  _creationTime: 0,
  role: "assistant",
  content: "",
  order: Number.MAX_SAFE_INTEGER,
  isStreaming: true,
  isTypingIndicator: true,
};

interface ChatMessageListProps {
  listRef: RefObject<LegendListRef | null>;
  messages: ProcessedMessage[];
  conversationKey: string;
  conversationExists: boolean;
  isLoadingConversation: boolean;
  isLoadingMessages: boolean;
  hasMore: boolean;
  shouldLoadMore: () => boolean;
  loadMore: () => void;
  profile?: {
    avatarUrl?: string | null;
    name?: string;
  };
  interactiveQuizQuestionId: string | null;
  isSending: boolean;
  isFollowingLatest: boolean;
  isResponseStreaming: boolean;
  showTypingIndicator: boolean;
  emptyHeight: number;
  keyboardOffset: number;
  foregroundColorMuted: string;
  contentInsetEndAdjustment: SharedValue<number>;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollBeginDrag: () => void;
  onScrollEnd: () => void;
  onGoBack: () => void;
  onSendGreeting: () => void;
  onQuizAnswer: (answer: string) => void;
  onEndQuiz: () => void;
  onRetryChatError: (promptMessageId: string) => void;
  onBuyCredits: () => void;
  onOpenMessageActions: (messageId: string, messageOrder: number) => void;
}

function isTypingIndicatorMessage(
  item: ChatListMessage,
): item is TypingIndicatorMessage {
  return "isTypingIndicator" in item;
}

function getMessageRenderKey(item: ChatListMessage) {
  if (
    isTypingIndicatorMessage(item) ||
    (item.role === "assistant" && item.isStreaming)
  ) {
    return ACTIVE_ASSISTANT_KEY;
  }

  return item._id;
}

function getMessageContentType(item: ChatListMessage) {
  if (isTypingIndicatorMessage(item)) {
    return "typing";
  }

  return item.content.match(/"type":"([^"]+)"/)?.[1] ?? "text";
}

function messagesAreEqual(previous: ChatListMessage, current: ChatListMessage) {
  return (
    previous._id === current._id &&
    previous._creationTime === current._creationTime &&
    previous.role === current.role &&
    previous.content === current.content &&
    previous.order === current.order &&
    previous.isStreaming === current.isStreaming
  );
}

function ChatLoadingMessages() {
  return (
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
  );
}

export function ChatMessageList({
  listRef,
  messages,
  conversationKey,
  conversationExists,
  isLoadingConversation,
  isLoadingMessages,
  hasMore,
  shouldLoadMore,
  loadMore,
  profile,
  interactiveQuizQuestionId,
  isSending,
  isFollowingLatest,
  isResponseStreaming,
  showTypingIndicator,
  emptyHeight,
  keyboardOffset,
  foregroundColorMuted,
  contentInsetEndAdjustment,
  onScroll,
  onScrollBeginDrag,
  onScrollEnd,
  onGoBack,
  onSendGreeting,
  onQuizAnswer,
  onEndQuiz,
  onRetryChatError,
  onBuyCredits,
  onOpenMessageActions,
}: ChatMessageListProps) {
  const { t } = useTranslation();
  const displayMessages = useMemo(
    () =>
      showTypingIndicator ? [...messages, TYPING_INDICATOR_MESSAGE] : messages,
    [messages, showTypingIndicator],
  );
  const latestUserMessageIndex = displayMessages.findLastIndex(
    (message) => message.role === "user",
  );
  const initialMessageIndex =
    latestUserMessageIndex >= 0
      ? latestUserMessageIndex
      : Math.max(0, displayMessages.length - 1);
  const initialScrollIndex = useMemo(
    () =>
      displayMessages.length > 0
        ? {
            index: initialMessageIndex,
            viewPosition: 0,
            viewOffset: TURN_TOP_OFFSET,
          }
        : undefined,
    [displayMessages.length, initialMessageIndex],
  );
  const [anchorSpaceStatus, setAnchorSpaceStatus] = useState({
    anchorIndex: -1,
    hasSpace: true,
  });
  const handleAnchorSpaceSizeChanged = useCallback(
    (size: number) => {
      setAnchorSpaceStatus((current) => {
        const next = {
          anchorIndex: latestUserMessageIndex,
          hasSpace: size > 1,
        };

        return current.anchorIndex === next.anchorIndex &&
          current.hasSpace === next.hasSpace
          ? current
          : next;
      });
    },
    [latestUserMessageIndex],
  );
  const anchoredEndSpace = useMemo(
    () =>
      latestUserMessageIndex >= 0
        ? {
            anchorIndex: latestUserMessageIndex,
            anchorOffset: TURN_TOP_OFFSET,
            onSizeChanged: handleAnchorSpaceSizeChanged,
          }
        : undefined,
    [handleAnchorSpaceSizeChanged, latestUserMessageIndex],
  );
  const hasActiveAnchorSpace =
    latestUserMessageIndex >= 0 &&
    (anchorSpaceStatus.anchorIndex !== latestUserMessageIndex ||
      anchorSpaceStatus.hasSpace);

  const renderMessage = useCallback(
    ({ item }: LegendListRenderItemProps<ChatListMessage>) => {
      if (isTypingIndicatorMessage(item)) {
        return (
          <View className="pt-2">
            <TypingIndicator
              avatarUrl={profile?.avatarUrl}
              profileName={profile?.name}
            />
          </View>
        );
      }

      const isUser = item.role === "user";

      return (
        <MessageBubble
          content={item.content}
          isUser={isUser}
          isStreaming={item.isStreaming}
          timestamp={item._creationTime}
          avatarUrl={!isUser ? profile?.avatarUrl : undefined}
          profileName={profile?.name}
          isQuizActive={item._id === interactiveQuizQuestionId}
          onQuizAnswer={onQuizAnswer}
          onEndQuiz={onEndQuiz}
          onRetryChatError={onRetryChatError}
          isRetrying={isSending}
          onBuyCredits={onBuyCredits}
          onLongPress={
            isUser
              ? () => onOpenMessageActions(item._id, item.order)
              : undefined
          }
        />
      );
    },
    [
      interactiveQuizQuestionId,
      isSending,
      onBuyCredits,
      onEndQuiz,
      onOpenMessageActions,
      onQuizAnswer,
      onRetryChatError,
      profile?.avatarUrl,
      profile?.name,
    ],
  );

  const handleStartReached = useCallback(() => {
    if (shouldLoadMore() && hasMore) {
      loadMore();
    }
  }, [hasMore, loadMore, shouldLoadMore]);

  if (isLoadingConversation || isLoadingMessages) {
    return <ChatLoadingMessages />;
  }

  return (
    <KeyboardAwareLegendList
      ref={listRef}
      data={displayMessages}
      dataKey={conversationKey}
      renderItem={renderMessage}
      keyExtractor={getMessageRenderKey}
      getItemType={getMessageContentType}
      itemsAreEqual={messagesAreEqual}
      estimatedItemSize={ESTIMATED_MESSAGE_HEIGHT}
      recycleItems={false}
      initialScrollIndex={initialScrollIndex}
      anchoredEndSpace={anchoredEndSpace}
      maintainScrollAtEnd={
        isFollowingLatest && !hasActiveAnchorSpace
          ? MAINTAIN_SCROLL_AT_END
          : false
      }
      maintainScrollAtEndThreshold={0.08}
      maintainVisibleContentPosition={MAINTAIN_VISIBLE_CONTENT_POSITION}
      contentInsetEndAdjustment={contentInsetEndAdjustment}
      applyWorkaroundForContentInsetHitTestBug
      keyboardOffset={keyboardOffset}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: TURN_TOP_OFFSET }}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      onScroll={onScroll}
      onScrollBeginDrag={onScrollBeginDrag}
      onScrollEndDrag={onScrollEnd}
      onMomentumScrollEnd={onScrollEnd}
      scrollEventThrottle={16}
      onStartReached={handleStartReached}
      onStartReachedThreshold={HISTORY_PREFETCH_THRESHOLD}
      ListEmptyComponent={
        !conversationExists ? (
          <View
            className="flex-1 items-center justify-center px-6 pt-20"
            style={{ height: emptyHeight }}
          >
            <Text className="text-foreground text-lg font-semibold mb-2">
              {t("chat.conversationNotFound")}
            </Text>
            <Button className="mt-4" onPress={onGoBack}>
              <Button.Label>{t("common.goBack")}</Button.Label>
            </Button>
          </View>
        ) : (
          <View
            className="flex-1 items-center justify-center px-6 pt-20"
            style={{ height: emptyHeight }}
          >
            <Text className="text-foreground text-lg font-semibold">
              {t("chat.startConversation")}
            </Text>
            <Text className="text-muted text-center">
              {t("chat.sayHello", {
                name: profile?.name ?? t("chat.aiCompanion"),
              })}
            </Text>
            <Button
              variant="ghost"
              className="mt-4 rounded-full px-6"
              isDisabled={isSending || isResponseStreaming}
              onPress={onSendGreeting}
            >
              <Button.Label>
                <Hand color={foregroundColorMuted} />
              </Button.Label>
            </Button>
          </View>
        )
      }
    />
  );
}
