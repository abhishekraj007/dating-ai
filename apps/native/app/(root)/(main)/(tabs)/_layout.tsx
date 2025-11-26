import { Tabs } from "expo-router";
import { useAppTheme } from "@/contexts/app-theme-context";
import { TabBarIcon } from "@/components/tabbar-icon";
import { useThemeColor } from "heroui-native";

export default function TabsLayout() {
  const { isDark } = useAppTheme();
  const accentColor = useThemeColor("accent");
  const mutedColor = useThemeColor("muted");
  const backgroundColor = useThemeColor("background");
  const borderColor = useThemeColor("border");

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
          paddingBottom: 8,
          height: 85,
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
