import { Text, View } from "react-native";
import Constants from "expo-constants";
import * as Updates from "expo-updates";

export function AccountAppInfo() {
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
    <View className="items-center gap-1 px-2 pb-6 pt-2">
      <Text className="text-xs text-muted">{appName}</Text>
      <Text className="text-[11px] text-muted">{versionLabel}</Text>

      <View className="mt-3 w-full gap-1">
        {rows.map(([label, value]) => (
          <View
            key={label}
            className="flex-row items-center justify-between gap-3"
          >
            <Text className="text-[11px] text-muted">{label}</Text>
            <Text
              className="flex-1 text-right text-[11px] text-muted"
              numberOfLines={1}
            >
              {value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
