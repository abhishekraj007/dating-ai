import { View, Text } from "react-native";
import { Button, useThemeColor } from "heroui-native";
import { Coins } from "lucide-react-native";
import { AIBubbleWrapper } from "./AIBubbleWrapper";
import type { AIBubbleProps, CreditsRequiredData } from "./message-types";
import { useTranslation } from "@/hooks/use-translation";

interface CreditsRequiredBubbleProps extends AIBubbleProps {
  data: CreditsRequiredData;
  onBuyCredits?: () => void;
}

export function CreditsRequiredBubble({
  data,
  avatarUrl,
  profileName,
  time,
  onBuyCredits,
}: CreditsRequiredBubbleProps) {
  const { t } = useTranslation();
  const accentForegroundColor = useThemeColor("accent-foreground");
  const requiredCredits = data.requiredCredits ?? 5;
  const message =
    data.message ||
    t("chat.creditsRequiredMessage", { count: requiredCredits });

  return (
    <AIBubbleWrapper
      avatarUrl={avatarUrl}
      profileName={profileName}
      time={time}
    >
      <View className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3 border border-border gap-3">
        <Text className="text-foreground text-[15px] leading-[22px]">
          {message}
        </Text>
        <Button size="sm" className="self-start" onPress={onBuyCredits}>
          <Coins size={16} color={accentForegroundColor} />
          <Button.Label>{t("account.profile.buyCredits")}</Button.Label>
        </Button>
      </View>
    </AIBubbleWrapper>
  );
}
