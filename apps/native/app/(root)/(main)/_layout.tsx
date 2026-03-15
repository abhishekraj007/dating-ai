import { Stack } from "expo-router";
import { useNavigationOptions } from "@/hooks/useNavigationOptions";
import { useAppTheme } from "@/contexts/app-theme-context";
import { useTranslation } from "@/hooks/use-translation";

export default function MainLayout() {
  const { standard } = useNavigationOptions();
  const { isDark } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Stack initialRouteName="(tabs)">
      {/* Tab navigator as the main screen */}
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />

      {/* Profile detail screen */}
      <Stack.Screen
        name="profile/[id]"
        options={{
          ...standard,
          title: t("nav.profile"),
          // presentation: "modal",
          headerShown: false,
        }}
      />

      {/* Chat screen */}
      <Stack.Screen
        name="chat/[id]"
        options={{
          ...standard,
          title: t("nav.chat"),
          headerShown: false,
        }}
      />

      {/* Create character modal */}
      <Stack.Screen
        name="create-character"
        options={{
          ...standard,
          title: t("nav.createCharacter"),
          presentation: "modal",
          headerShown: false,
        }}
      />

      {/* Filter screen */}
      <Stack.Screen
        name="filter"
        options={{
          ...standard,
          title: t("nav.filter"),
          presentation: "modal",
          headerShown: false,
        }}
      />

      {/* Legacy/utility screens */}
      {/* <Stack.Screen
        name="index"
        options={{
          ...standard,
          title: t("nav.home"),
          headerTitle: "",
          headerShown: false,
        }}
      /> */}
      <Stack.Screen
        name="buy-credits"
        options={{
          title: "",
          presentation: "modal",
          headerTitle: "",
          headerBackTitle: "Back",
          ...standard,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: t("nav.settings"),
          presentation: "modal",
          headerBackButtonDisplayMode: "generic",
          headerBlurEffect: isDark ? "dark" : "light",
          headerBackTitle: t("common.back"),
          ...standard,
        }}
      />
      <Stack.Screen
        name="uploads"
        options={{
          title: t("nav.uploads"),
          headerBackTitle: t("common.back"),
          ...standard,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: t("nav.notifications"),
          headerBackTitle: t("common.back"),
          ...standard,
        }}
      />
    </Stack>
  );
}
