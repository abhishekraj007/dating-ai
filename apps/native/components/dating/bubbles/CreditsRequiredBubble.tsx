import { View, Text } from "react-native";
import { Button, useThemeColor } from "heroui-native";
import { Crown } from "lucide-react-native";
import { AIBubbleWrapper } from "./AIBubbleWrapper";
import type { AIBubbleProps, CreditsRequiredData } from "./message-types";
import { useTranslation } from "@/hooks/use-translation";

interface CreditsRequiredBubbleProps extends AIBubbleProps {
  data: CreditsRequiredData;
  onBuyCredits?: () => void;
  onSubscribe?: () => void;
}

export function CreditsRequiredBubble({
  data,
  avatarUrl,
  profileName,
  time,
  onBuyCredits,
  onSubscribe,
}: CreditsRequiredBubbleProps) {
  const { t } = useTranslation();
  const accentForegroundColor = useThemeColor("accent-foreground");
  const companionName = profileName || t("chat.thisAi");
  const isMediaRequest =
    data.action === "image_request" || data.action === "video_request";
  const message = isMediaRequest
    ? data.message ||
      t("chat.creditsRequiredMessage", {
        count: data.requiredCredits ?? 5,
      })
    : t("premium.keepTalkingDescription", { name: companionName });

  return (
    <AIBubbleWrapper
      avatarUrl={avatarUrl}
      profileName={profileName}
      time={time}
    >
      <View className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3 border border-border gap-3">
        <Text className="text-foreground text-[16px] font-semibold leading-[22px]">
          {t("premium.keepTalking", { name: companionName })}
        </Text>
        <Text className="text-foreground text-[15px] leading-[22px]">
          {message}
        </Text>
        {onSubscribe ? (
          <Button size="sm" className="self-start" onPress={onSubscribe}>
            <Crown size={16} color={accentForegroundColor} />
            <Button.Label>{t("premium.subscribeCta")}</Button.Label>
          </Button>
        ) : null}
        {onBuyCredits ? (
          <Button
            size="sm"
            variant="ghost"
            className="self-start"
            onPress={onBuyCredits}
          >
            <Button.Label>{t("premium.orBuyCredits")}</Button.Label>
          </Button>
        ) : null}
      </View>
    </AIBubbleWrapper>
  );
}
