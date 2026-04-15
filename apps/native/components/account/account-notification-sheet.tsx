import { useEffect, useState } from "react";
import { Alert, Linking, Text, View } from "react-native";
import { BottomSheet, Button, Separator, Spinner, Switch } from "heroui-native";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { useTranslation } from "@/hooks/use-translation";

type AccountNotificationSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export const AccountNotificationSheet = ({
  isOpen,
  onOpenChange,
}: AccountNotificationSheetProps) => {
  const { t } = useTranslation();
  const {
    isEnabled,
    isRequesting,
    enableNotifications,
    disableNotifications,
    checkPermissionStatus,
  } = useNotificationSettings();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;

    const syncPermissionStatus = async () => {
      const permissionGranted = await checkPermissionStatus();
      if (isMounted) {
        setHasPermission(permissionGranted);
      }
    };

    void syncPermissionStatus();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        await enableNotifications();
      } else {
        await disableNotifications();
      }

      const permissionGranted = await checkPermissionStatus();
      setHasPermission(permissionGranted);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("notifications.requestFailed");
      const isPermissionError = message === "Permission denied";

      Alert.alert(
        t("alerts.error"),
        isPermissionError
          ? t("notifications.permissionDeniedDescription")
          : message,
        isPermissionError
          ? [
              {
                text: t("alerts.cancel"),
                style: "cancel",
              },
              {
                text: t("nav.settings"),
                onPress: () => {
                  void Linking.openSettings();
                },
              },
            ]
          : [{ text: t("common.ok") }],
      );
    }
  };

  const statusDescription = isEnabled
    ? t("notifications.enabledRegistered")
    : hasPermission === true
      ? t("notifications.disabledInApp")
      : hasPermission === false
        ? t("notifications.disabledPrompt")
        : t("settings.notificationsDescription");

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          snapPoints={[hasPermission === false ? "52%" : "42%"]}
        >
          <View className="gap-4 py-2">
            <View className="gap-1">
              <Text className="text-2xl font-semibold text-foreground">
                {t("account.item.notifications")}
              </Text>
              <Text className="text-sm text-muted">
                {t("settings.notificationsDescription")}
              </Text>
            </View>

            <View className="rounded-3xl bg-overlay p-4 gap-3">
              <View className="flex-row items-center justify-between gap-4">
                <View className="flex-1 gap-1">
                  <Text className="text-base font-medium text-foreground">
                    {t("notifications.enable")}
                  </Text>
                  <Text className="text-sm text-muted">
                    {statusDescription}
                  </Text>
                </View>

                <View className="flex-row items-center gap-3">
                  {isRequesting ? <Spinner size="sm" /> : null}
                  <Switch
                    isSelected={isEnabled}
                    onSelectedChange={(selected) => {
                      void handleToggle(selected);
                    }}
                    isDisabled={isRequesting}
                  />
                </View>
              </View>
            </View>

            {hasPermission === false ? (
              <>
                <Separator />
                <View className="gap-3">
                  <Text className="text-sm text-muted">
                    {t("notifications.permissionDeniedDescription")}
                  </Text>
                  <Button
                    variant="secondary"
                    onPress={() => {
                      void Linking.openSettings();
                    }}
                  >
                    <Text className="text-foreground font-medium">
                      {t("nav.settings")}
                    </Text>
                  </Button>
                </View>
              </>
            ) : null}
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
};
