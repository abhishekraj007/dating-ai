import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function OnboardingLayout() {
  const backgroundColor = useThemeColor("background");

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent swiping back
        contentStyle: {
          backgroundColor,
        },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="gender" />
      <Stack.Screen name="interests" />
    </Stack>
  );
}
