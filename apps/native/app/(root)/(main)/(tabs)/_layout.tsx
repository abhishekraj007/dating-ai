import { Tabs } from "expo-router";
import { TabBarIcon } from "@/components/tabbar-icon";
import { useThemeColor } from "heroui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend";
import { useTranslation } from "@/hooks/use-translation";

export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const accentColor = useThemeColor("accent");
  const mutedColor = useThemeColor("muted");
  const backgroundColor = useThemeColor("background");
  const borderColor = useThemeColor("border");
  const appConfig = useQuery(
    (api as any).features.appConfig.queries.getPublicAppConfig,
  ) as { showMyCreationTab?: boolean } | undefined;
  const showMyCreationTab = appConfig?.showMyCreationTab ?? false;

  // Calculate proper bottom padding for Android navigation bar
  const bottomPadding =
    Platform.OS === "android" ? Math.max(insets.bottom, 8) : 24;
  // const bottomPadding =
  //   Platform.OS === "android" ? Math.max(insets.bottom, 8) : 24;
  const tabBarHeight = 60 + bottomPadding + 8; // base height + bottom padding + top padding

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: mutedColor,
        tabBarStyle: {
          backgroundColor: backgroundColor,
          borderTopColor: borderColor,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="for-you"
        options={{
          title: t("tabs.forYou"),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="for-you" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t("tabs.explore"),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="explore" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: t("tabs.chats"),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="chats" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-creation"
        options={{
          title: t("tabs.myCreation"),
          href: showMyCreationTab ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="my-creation" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t("tabs.account"),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="account" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
