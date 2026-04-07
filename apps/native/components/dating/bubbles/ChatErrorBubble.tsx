import { View, Text } from "react-native";
import { Button } from "heroui-native";
import { AIBubbleWrapper } from "./AIBubbleWrapper";
import type { AIBubbleProps, ChatErrorData } from "./message-types";
import { useTranslation } from "@/hooks/use-translation";

interface ChatErrorBubbleProps extends AIBubbleProps {
  data: ChatErrorData;
  onRetry?: (promptMessageId: string) => void;
  isRetrying?: boolean;
}

export function ChatErrorBubble({
  data,
  avatarUrl,
  profileName,
  time,
  onRetry,
  isRetrying = false,
}: ChatErrorBubbleProps) {
  const { t } = useTranslation();

  const message =
    data.message ||
    (data.code === "rate_limited"
      ? t("chat.errorRateLimited")
      : t("chat.errorGeneric"));

  const canRetry = Boolean(data.retryable && data.promptMessageId && onRetry);

  return (
    <AIBubbleWrapper
      avatarUrl={avatarUrl}
      profileName={profileName}
      time={time}
    >
      <View className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3 border border-border">
        <Text className="text-red-400 text-[15px] leading-[22px]">
          {message}
        </Text>
        {canRetry ? (
          <Button
            variant="tertiary"
            size="sm"
            className="self-start mt-3"
            isDisabled={isRetrying}
            onPress={() => onRetry?.(data.promptMessageId!)}
          >
            <Button.Label>
              {isRetrying ? t("chat.retrying") : t("chat.retry")}
            </Button.Label>
          </Button>
        ) : null}
      </View>
    </AIBubbleWrapper>
  );
}
