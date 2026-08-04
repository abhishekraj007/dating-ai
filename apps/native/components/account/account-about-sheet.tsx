import { Text, View } from "react-native";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { BottomSheet } from "heroui-native";
import { useTranslation } from "@/hooks/use-translation";

type AccountAboutSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AccountAboutSheet({
  isOpen,
  onOpenChange,
}: AccountAboutSheetProps) {
  const { t } = useTranslation();
  const appName = Constants.expoConfig?.name ?? "FeelChat";
  const appVersion =
    Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? "1.0.0";
  const buildNumber = Constants.nativeBuildVersion;
  const versionLabel = buildNumber
    ? `${appVersion} (${buildNumber})`
    : appVersion;

  const rows = [
    ["Updates", Updates.isEnabled ? "enabled" : "disabled"],
    ["Update ID", Updates.updateId ?? "embedded"],
  ] as const;

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <View className="gap-5 pb-2">
            <Text className="text-center text-xl font-semibold text-foreground">
              {t("account.item.about")}
            </Text>

            <View className="items-center gap-1">
              <Text className="text-sm text-muted">{appName}</Text>
              <Text className="text-xs text-muted">{versionLabel}</Text>
            </View>

            <View className="gap-2">
              {rows.map(([label, value]) => (
                <View
                  key={label}
                  className="flex-row items-center justify-between gap-3"
                >
                  <Text className="text-xs text-muted">{label}</Text>
                  <Text
                    className="flex-1 text-right text-xs text-muted"
                    numberOfLines={1}
                  >
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
