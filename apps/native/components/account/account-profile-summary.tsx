import {
  Avatar,
  Button,
  Chip,
  Separator,
  Surface,
  useThemeColor,
} from "heroui-native";
import { Crown, Coins } from "lucide-react-native";
import { Text, View } from "react-native";
import { useTranslation } from "@/hooks/use-translation";

type AccountProfileSummaryProps = {
  name: string;
  email: string;
  credits: number;
  isPremium: boolean;
  onBuyCredits: () => void;
  onShowSubscription: () => void;
  avatarUrl?: string;
};

export const AccountProfileSummary = ({
  name,
  email,
  credits,
  isPremium,
  onBuyCredits,
  onShowSubscription,
  avatarUrl,
}: AccountProfileSummaryProps) => {
  const accent = useThemeColor("accent");
  const success = useThemeColor("success");
  const { t } = useTranslation();

  return (
    <Surface className="p-4 gap-4">
      <View className="flex-row items-center gap-3">
        <Avatar alt={name} size="md">
          {avatarUrl ? <Avatar.Image source={{ uri: avatarUrl }} /> : null}
          <Avatar.Fallback>{name[0] ?? "U"}</Avatar.Fallback>
        </Avatar>

        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">{name}</Text>
          <Text className="text-sm text-muted">{email}</Text>
          {isPremium && (
            <Chip variant="soft" color="success" className="px-3 mt-1">
              <Crown size={14} color={success} />
              <Chip.Label>{t("account.profile.premium")}</Chip.Label>
            </Chip>
          )}
        </View>
      </View>

      <Separator />

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Coins size={16} color={accent} />
            <Text className="text-sm text-muted">
              {t("account.profile.currentCredits")}
            </Text>
          </View>
          <Text className="text-base font-semibold text-foreground">
            {credits}
          </Text>
        </View>

        <View className="flex-row gap-2">
          <Button variant="secondary" className="flex-1" onPress={onBuyCredits}>
            {t("account.profile.buyCredits")}
          </Button>

          {!isPremium && (
            <Button
              variant="primary"
              className="flex-1"
              onPress={onShowSubscription}
            >
              <Crown size={14} color="white" />
              <Text className="text-white font-medium">
                {t("account.profile.getPremium")}
              </Text>
            </Button>
          )}
        </View>
      </View>
    </Surface>
  );
};
