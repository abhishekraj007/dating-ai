import { Stack } from "expo-router";
import { useNavigationOptions } from "@/hooks/useNavigationOptions";
import { useAppTheme } from "@/contexts/app-theme-context";

export default function MainLayout() {
  const { standard } = useNavigationOptions();
  const { isDark } = useAppTheme();

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
          title: "Profile",
          presentation: "modal",
          headerShown: false,
        }}
      />

      {/* Chat screen */}
      <Stack.Screen
        name="chat/[id]"
        options={{
          ...standard,
          title: "Chat",
          headerShown: false,
        }}
      />

      {/* Create character modal */}
      <Stack.Screen
        name="create-character"
        options={{
          ...standard,
          title: "Create New AI Character",
          presentation: "modal",
          headerShown: false,
        }}
      />

      {/* Legacy/utility screens */}
      <Stack.Screen
        name="index"
        options={{
          ...standard,
          title: "Home",
          headerTitle: "",
          headerShown: false,
        }}
      />
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
          title: "Settings",
          presentation: "modal",
          headerBackButtonDisplayMode: "generic",
          headerBlurEffect: isDark ? "dark" : "light",
          headerBackTitle: "Back",
          ...standard,
        }}
      />
      <Stack.Screen
        name="uploads"
        options={{
          title: "Uploads",
          headerBackTitle: "Back",
          ...standard,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: "Notifications",
          headerBackTitle: "Back",
          ...standard,
        }}
      />
    </Stack>
  );
}
