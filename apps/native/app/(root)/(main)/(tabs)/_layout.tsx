import { Tabs } from "expo-router";
import { useAppTheme } from "@/contexts/app-theme-context";
import { TabBarIcon } from "@/components/tabbar-icon";
import { useThemeColor } from "heroui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

export default function TabsLayout() {
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const accentColor = useThemeColor("accent");
  const mutedColor = useThemeColor("muted");
  const backgroundColor = useThemeColor("background");
  const borderColor = useThemeColor("border");

  // Calculate proper bottom padding for Android navigation bar
  const bottomPadding = Platform.OS === "android" ? Math.max(insets.bottom, 8) : 8;
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
          title: "For You",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="for-you" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="explore" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="chats" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-creation"
        options={{
          title: "My Creation",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="my-creation" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="account" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
