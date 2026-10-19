import { useState } from "react";
import * as Linking from "expo-linking";
import { Alert } from "react-native";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import { api } from "@dating-ai/backend";
import type { Id } from "@dating-ai/backend/convex/_generated/dataModel";
import { useToast } from "heroui-native";
import { useTranslation } from "@/hooks/use-translation";

/**
 * Connect the current character to Telegram: mints a one-time deep link when
 * not connected, or opens the existing bot chat when already connected.
 */
export function useTelegramLink(aiProfileId: Id<"aiProfiles"> | undefined) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const status = useQuery(
    api.features.telegram.linking.getLinkStatus,
    aiProfileId ? { aiProfileId } : "skip",
  );

  const createLinkToken = useMutation(
    api.features.telegram.linking.createLinkToken,
  );
  const unlinkCharacter = useMutation(
    api.features.telegram.linking.unlinkCharacter,
  );

  const isLinked = status?.linked ?? false;
  const isAvailable = Boolean(status?.botUsername);

  const continueOnTelegram = async () => {
    if (!aiProfileId || !status?.botUsername) {
      return;
    }

    if (isLinked) {
      await Linking.openURL(`https://t.me/${status.botUsername}`);
      return;
    }

    setIsConnecting(true);
    try {
      const { url } = await createLinkToken({ aiProfileId });
      await Linking.openURL(url);
    } catch (error) {
      console.warn("Failed to create Telegram link:", error);
      Alert.alert(t("alerts.error"), t("telegram.linkFailed"));
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectTelegram = () => {
    if (!aiProfileId) {
      return;
    }

    Alert.alert(t("telegram.disconnectTitle"), t("telegram.disconnectBody"), [
      { text: t("alerts.cancel"), style: "cancel" },
      {
        text: t("telegram.disconnect"),
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await unlinkCharacter({ aiProfileId });
              toast.show({
                id: "telegram-disconnected",
                variant: "success",
                label: t("telegram.disconnected"),
              });
            } catch (error) {
              console.error("Failed to disconnect Telegram:", error);
              toast.show({
                id: "telegram-disconnect-failed",
                variant: "warning",
                label: t("alerts.error"),
                description: t("alerts.tryAgainMoment"),
              });
            }
          })();
        },
      },
    ]);
  };

  return {
    isLinked,
    isAvailable,
    isLoading: status === undefined,
    isConnecting,
    continueOnTelegram,
    disconnectTelegram,
  };
}
